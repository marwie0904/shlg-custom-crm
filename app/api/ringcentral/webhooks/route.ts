import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Validation token for RingCentral webhook verification
const VALIDATION_TOKEN = process.env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Check for validation request (RingCentral sends this when setting up webhook)
    const validationToken = request.headers.get("validation-token");
    if (validationToken) {
      console.log("[RingCentral Webhook] Validation request received");
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Validation-Token": validationToken,
        },
      });
    }

    const body = await request.json();
    console.log("[RingCentral Webhook] Received event:", JSON.stringify(body, null, 2));

    // Handle different event types
    if (body.event) {
      const eventType = body.event;

      // Handle incoming SMS
      if (eventType.includes("/message-store/instant") && body.body) {
        const messageBody = body.body;

        if (messageBody.type === "SMS" && messageBody.direction === "Inbound") {
          console.log("[RingCentral Webhook] Incoming SMS:", {
            from: messageBody.from?.phoneNumber,
            to: messageBody.to?.[0]?.phoneNumber,
            text: messageBody.subject,
          });

          // Store the message in Convex
          try {
            await convex.mutation(api.ringcentralMessages.createMessage, {
              ringcentralId: String(messageBody.id),
              from: messageBody.from?.phoneNumber || "",
              to: messageBody.to?.[0]?.phoneNumber || "",
              text: messageBody.subject || "",
              direction: "Inbound",
              messageStatus: messageBody.messageStatus || "Received",
              readStatus: messageBody.readStatus || "Unread",
              createdAt: messageBody.creationTime || new Date().toISOString(),
            });
          } catch (convexError) {
            console.error("[RingCentral Webhook] Convex error:", convexError);
          }

          return NextResponse.json({
            success: true,
            event: "sms_received",
            from: messageBody.from?.phoneNumber,
          });
        }
      }

      // Handle telephony events (calls)
      if (eventType.includes("/telephony/sessions") && body.body) {
        const telephonyBody = body.body;
        console.log("[RingCentral Webhook] Telephony event:", {
          sessionId: telephonyBody.sessionId,
          eventType: telephonyBody.eventType,
        });

        return NextResponse.json({
          success: true,
          event: "telephony_event",
          sessionId: telephonyBody.sessionId,
        });
      }

      // Handle presence events
      if (eventType.includes("/presence") && body.body) {
        console.log("[RingCentral Webhook] Presence event:", body.body);

        return NextResponse.json({
          success: true,
          event: "presence_update",
        });
      }
    }

    // Default response for unhandled events
    return NextResponse.json({
      success: true,
      event: "unknown",
    });
  } catch (error) {
    console.error("[RingCentral Webhook] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify the webhook (similar to Meta's verification)
  if (mode === "subscribe" && token === VALIDATION_TOKEN) {
    console.log("[RingCentral Webhook] Verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}
