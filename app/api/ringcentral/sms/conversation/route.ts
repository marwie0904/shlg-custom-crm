import { NextRequest, NextResponse } from "next/server";
import { getConversation, markMessageAsRead } from "@/lib/ringcentral/sms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get("phoneNumber");

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Missing required parameter: phoneNumber" },
        { status: 400 }
      );
    }

    const messages = await getConversation(phoneNumber);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("[RingCentral SMS Conversation] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Missing required field: messageId" },
        { status: 400 }
      );
    }

    await markMessageAsRead(messageId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[RingCentral Mark Read] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
