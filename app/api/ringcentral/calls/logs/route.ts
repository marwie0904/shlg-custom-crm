import { NextRequest, NextResponse } from "next/server";
import { getCallLogs, getCallRecording } from "@/lib/ringcentral/calling";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const phoneNumber = searchParams.get("phoneNumber") || undefined;
    const direction = searchParams.get("direction") as "Inbound" | "Outbound" | undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const perPage = searchParams.get("perPage") ? parseInt(searchParams.get("perPage")!) : undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const withRecording = searchParams.get("withRecording") === "true";

    const result = await getCallLogs({
      phoneNumber,
      direction,
      dateFrom,
      dateTo,
      perPage,
      page,
      withRecording,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[RingCentral Call Logs] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Get call recording
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId } = body;

    if (!recordingId) {
      return NextResponse.json(
        { error: "Missing required field: recordingId" },
        { status: 400 }
      );
    }

    const recording = await getCallRecording(recordingId);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(recording);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="recording-${recordingId}.mp3"`,
      },
    });
  } catch (error) {
    console.error("[RingCentral Recording] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
