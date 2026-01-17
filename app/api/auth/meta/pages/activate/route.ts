import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSession } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * POST /api/auth/meta/pages/activate
 * Activates a specific page for messaging
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pageId, isActive } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    // Update page active status
    await convex.mutation(api.metaOAuth.setPageActive, {
      pageId: pageId,
      isActive: isActive !== false, // Default to true
    });

    // If activating, ensure webhooks are subscribed
    if (isActive !== false) {
      const page = await convex.query(api.metaOAuth.getPageById, { pageId });

      if (page && !page.webhookSubscribed) {
        try {
          await subscribeToPageWebhooks(page.pageId, page.pageAccessToken);
          await convex.mutation(api.metaOAuth.updatePageWebhookStatus, {
            pageId: page.pageId,
            webhookSubscribed: true,
          });
        } catch (webhookError) {
          console.error("[Meta Activate] Webhook subscription error:", webhookError);
          // Don't fail, just log
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Page ${isActive !== false ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("[Meta Activate] Error:", error);
    return NextResponse.json(
      { error: "Failed to update page status" },
      { status: 500 }
    );
  }
}

/**
 * Subscribe a page to receive webhooks
 */
async function subscribeToPageWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<void> {
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

  console.log(`[Meta Activate] Subscribed page ${pageId} to webhooks:`, data);
}
