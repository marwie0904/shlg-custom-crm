import { NextRequest, NextResponse } from "next/server";
import {
  sendMessengerMessage,
  sendInstagramMessage,
} from "@/lib/services/metaService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, message, source, attachment } = body;

    if (!recipientId || !message || !source) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId, message, source" },
        { status: 400 }
      );
    }

    let result;

    if (source === "messenger") {
      result = await sendMessengerMessage(recipientId, message, attachment);
    } else if (source === "instagram") {
      result = await sendInstagramMessage(recipientId, message, attachment);
    } else {
      return NextResponse.json(
        { error: "Invalid source. Must be 'messenger' or 'instagram'" },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Send Message API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
