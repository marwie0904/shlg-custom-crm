import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSession } from "@/lib/auth";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/auth/meta/pages
 * Returns the current Meta connection status and connected pages
 */
export async function GET() {
  try {
    // Verify user is logged in
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get active connection with pages
    const connection = await convex.query(api.metaOAuth.getActiveConnection);

    if (!connection) {
      return NextResponse.json({
        connected: false,
        connection: null,
        pages: [],
      });
    }

    // Return connection info (excluding sensitive token data)
    return NextResponse.json({
      connected: true,
      connection: {
        id: connection._id,
        connectedBy: connection.connectedByName,
        facebookUserName: connection.facebookUserName,
        status: connection.status,
        tokenExpiresAt: connection.userAccessTokenExpiresAt,
        createdAt: connection.createdAt,
      },
      pages: connection.pages.map((page) => ({
        id: page._id,
        pageId: page.pageId,
        pageName: page.pageName,
        platform: page.platform,
        instagramUsername: page.instagramUsername,
        webhookSubscribed: page.webhookSubscribed,
        isActive: page.isActive,
      })),
    });
  } catch (error) {
    console.error("[Meta Pages] Error fetching connection:", error);
    return NextResponse.json(
      { error: "Failed to fetch Meta connection" },
      { status: 500 }
    );
  }
}
