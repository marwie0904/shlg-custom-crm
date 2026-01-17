import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/ringcentral/sms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text, from } = body;

    if (!to || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, text" },
        { status: 400 }
      );
    }

    const message = await sendSMS({ to, text, from });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("[RingCentral SMS Send] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
