import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSession } from "@/lib/auth";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

/**
 * GET /api/auth/meta/callback
 * Handles the OAuth callback from Facebook
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const connectUrl = `${appUrl}/connect`;
  const errorUrl = `${connectUrl}?meta_error=`;

  try {
    // 1. Get the session - user must be logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(`${errorUrl}not_authenticated`);
    }

    // 2. Get query parameters
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Check for OAuth errors from Facebook
    if (error) {
      console.error("[Meta OAuth] Error from Facebook:", error, errorDescription);
      return NextResponse.redirect(
        `${errorUrl}${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || "")}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(`${errorUrl}missing_params`);
    }

    // 3. Verify state to prevent CSRF
    const cookieStore = await cookies();
    const storedState = cookieStore.get("meta_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      console.error("[Meta OAuth] State mismatch");
      return NextResponse.redirect(`${errorUrl}state_mismatch`);
    }

    // Clear the state cookie
    cookieStore.delete("meta_oauth_state");

    // 4. Exchange code for access token
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${appUrl}/api/auth/meta/callback`;

    if (!appId || !appSecret) {
      return NextResponse.redirect(`${errorUrl}missing_app_credentials`);
    }

    const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("[Meta OAuth] Token exchange error:", tokenData);
      return NextResponse.redirect(`${errorUrl}token_exchange_failed`);
    }

    const shortLivedToken = tokenData.access_token;

    // 5. Exchange for long-lived token
    const longLivedTokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
    longLivedTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedTokenUrl.searchParams.set("client_id", appId);
    longLivedTokenUrl.searchParams.set("client_secret", appSecret);
    longLivedTokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longLivedResponse = await fetch(longLivedTokenUrl.toString());
    const longLivedData = await longLivedResponse.json();

    if (!longLivedResponse.ok || longLivedData.error) {
      console.error("[Meta OAuth] Long-lived token error:", longLivedData);
      return NextResponse.redirect(`${errorUrl}long_lived_token_failed`);
    }

    const userAccessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // in seconds
    const tokenExpiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;

    // 6. Get user info
    const userInfoResponse = await fetch(
      `${GRAPH_API_BASE}/me?fields=id,name&access_token=${userAccessToken}`
    );
    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok || userInfo.error) {
      console.error("[Meta OAuth] User info error:", userInfo);
      return NextResponse.redirect(`${errorUrl}user_info_failed`);
    }

    // 7. Get user's Facebook Pages
    const pagesResponse = await fetch(
      `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || pagesData.error) {
      console.error("[Meta OAuth] Pages fetch error:", pagesData);
      return NextResponse.redirect(`${errorUrl}pages_fetch_failed`);
    }

    const pages: FacebookPage[] = pagesData.data || [];

    console.log("[Meta OAuth] Pages response:", JSON.stringify(pagesData, null, 2));
    console.log("[Meta OAuth] Found pages:", pages.length);

    if (pages.length === 0) {
      console.error("[Meta OAuth] No pages found. User may not have admin access to any Facebook Pages or pages_show_list permission was not granted.");
      return NextResponse.redirect(`${errorUrl}no_pages_found`);
    }

    // 8. Store connection in Convex
    const connectionId = await convex.mutation(api.metaOAuth.createConnection, {
      userId: session.userId as Id<"users">,
      userName: session.email,
      userAccessToken: userAccessToken,
      userAccessTokenExpiresAt: tokenExpiresAt,
      facebookUserId: userInfo.id,
      facebookUserName: userInfo.name,
    });

    // 9. Store pages in Convex
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const isFirstPage = i === 0;

      // Add Facebook page
      await convex.mutation(api.metaOAuth.addPage, {
        connectionId: connectionId,
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        platform: "facebook",
        isActive: isFirstPage, // First page is active by default
      });

      // If page has Instagram linked, add it too
      if (page.instagram_business_account) {
        await convex.mutation(api.metaOAuth.addPage, {
          connectionId: connectionId,
          pageId: page.instagram_business_account.id,
          pageName: `${page.name} (Instagram)`,
          pageAccessToken: page.access_token, // Uses same page token
          platform: "instagram",
          instagramBusinessAccountId: page.instagram_business_account.id,
          instagramUsername: page.instagram_business_account.username,
          isActive: isFirstPage, // First page's Instagram is active by default
        });
      }
    }

    // 10. Subscribe to webhooks for active pages
    const firstPage = pages[0];
    try {
      await subscribeToPageWebhooks(firstPage.id, firstPage.access_token);
      await convex.mutation(api.metaOAuth.updatePageWebhookStatus, {
        pageId: firstPage.id,
        webhookSubscribed: true,
      });

      // Subscribe Instagram too if available
      if (firstPage.instagram_business_account) {
        // Instagram uses the same page subscription
        await convex.mutation(api.metaOAuth.updatePageWebhookStatus, {
          pageId: firstPage.instagram_business_account.id,
          webhookSubscribed: true,
        });
      }
    } catch (webhookError) {
      console.error("[Meta OAuth] Webhook subscription error:", webhookError);
      // Don't fail the whole flow, just log the error
    }

    // Success! Redirect to connect page
    console.log("[Meta OAuth] Successfully connected Meta account:", userInfo.name);
    return NextResponse.redirect(`${connectUrl}?meta_success=true`);
  } catch (error) {
    console.error("[Meta OAuth] Unexpected error:", error);
    return NextResponse.redirect(`${errorUrl}unexpected_error`);
  }
}

/**
 * Subscribe a page to receive webhooks
 */
async function subscribeToPageWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<void> {
  // Subscribe to messenger and feed webhooks
  const subscribeUrl = `${GRAPH_API_BASE}/${pageId}/subscribed_apps`;

  const response = await fetch(subscribeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: pageAccessToken,
      subscribed_fields: [
        "messages",
        "messaging_postbacks",
        "messaging_optins",
        "message_deliveries",
        "message_reads",
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to subscribe: ${JSON.stringify(data)}`);
  }

  console.log(`[Meta OAuth] Subscribed page ${pageId} to webhooks:`, data);
}
