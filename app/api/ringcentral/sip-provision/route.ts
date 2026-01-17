import { NextRequest, NextResponse } from "next/server";
import { getSIPProvision, getPresence, getActiveCalls } from "@/lib/ringcentral/calling";

// GET SIP provisioning info for WebRTC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includePresence = searchParams.get("includePresence") === "true";

    const sipProvision = await getSIPProvision();

    let response: any = {
      success: true,
      sipInfo: sipProvision.sipInfo,
      sipFlags: sipProvision.sipFlags,
      device: sipProvision.device,
    };

    // Optionally include presence/active calls
    if (includePresence) {
      const presence = await getPresence();
      response.presence = presence;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[RingCentral SIP Provision] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET active calls
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "getActiveCalls") {
      const activeCalls = await getActiveCalls();
      return NextResponse.json({
        success: true,
        activeCalls,
      });
    }

    if (action === "getPresence") {
      const presence = await getPresence();
      return NextResponse.json({
        success: true,
        presence,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[RingCentral SIP Action] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
