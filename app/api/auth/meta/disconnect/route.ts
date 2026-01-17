import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getSession } from "@/lib/auth";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/auth/meta/disconnect
 * Disconnects the Meta (Facebook/Instagram) integration
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

    // Check if user is admin (only admins can disconnect)
    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Only administrators can disconnect integrations" },
        { status: 403 }
      );
    }

    // Get connection ID from request body (optional - if not provided, disconnect active connection)
    const body = await request.json().catch(() => ({}));
    let connectionId: Id<"metaConnections"> | undefined = body.connectionId;

    // If no connection ID provided, get the active connection
    if (!connectionId) {
      const activeConnection = await convex.query(api.metaOAuth.getActiveConnection);
      if (!activeConnection) {
        return NextResponse.json(
          { error: "No active Meta connection found" },
          { status: 404 }
        );
      }
      connectionId = activeConnection._id;
    }

    // Disconnect the connection
    await convex.mutation(api.metaOAuth.disconnectConnection, {
      connectionId: connectionId,
    });

    console.log(`[Meta Disconnect] Connection ${connectionId} disconnected by ${session.email}`);

    return NextResponse.json({
      success: true,
      message: "Meta connection disconnected successfully",
    });
  } catch (error) {
    console.error("[Meta Disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Meta integration" },
      { status: 500 }
    );
  }
}
