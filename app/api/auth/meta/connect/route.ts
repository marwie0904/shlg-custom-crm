import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * GET /api/auth/meta/connect
 * Initiates the Facebook OAuth flow
 *
 * Required env vars:
 * - META_APP_ID: Your Facebook App ID
 * - NEXT_PUBLIC_APP_URL: Your app's URL for the callback
 */
export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!appId) {
    return NextResponse.json(
      { error: "META_APP_ID not configured" },
      { status: 500 }
    );
  }

  // Generate a random state for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Store state in a cookie for verification during callback
  const cookieStore = await cookies();
  cookieStore.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  // Required permissions for Facebook Pages and Instagram
  // Note: Only include permissions that are valid and approved for your app
  const scopes = [
    // Facebook Pages
    "pages_show_list",
    "pages_manage_metadata",
    "pages_messaging",

    // Instagram
    "instagram_basic",
    "instagram_manage_messages",

    // Business
    "business_management",
  ].join(",");

  // Build the Facebook OAuth URL
  const redirectUri = `${appUrl}/api/auth/meta/callback`;
  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");

  // Redirect to Facebook's OAuth page
  return NextResponse.redirect(authUrl.toString());
}
