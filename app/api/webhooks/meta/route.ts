import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify webhook signature from Meta
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  return signature === `sha256=${expectedSignature}`;
}

// GET: Webhook verification (called by Meta when setting up webhook)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Meta Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[Meta Webhook] Verification failed", { mode, token, verifyToken });
  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Receive incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify signature in production
    if (process.env.NODE_ENV === "production") {
      if (!verifySignature(body, signature)) {
        console.error("[Meta Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    console.log("[Meta Webhook] Received payload:", JSON.stringify(payload, null, 2));

    // Determine source based on object type
    const source = payload.object === "instagram" ? "instagram" : "messenger";

    // Process each entry
    for (const entry of payload.entry || []) {
      // Handle messaging events
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        await processMessagingEvent(event, source);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[Meta Webhook] Error processing webhook:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: "error", message: "Processing failed" }, { status: 200 });
  }
}

interface MessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url?: string;
        sticker_id?: number;
      };
    }>;
  };
  read?: {
    watermark: number;
  };
  delivery?: {
    watermark: number;
    mids: string[];
  };
}

async function processMessagingEvent(event: MessagingEvent, source: "messenger" | "instagram") {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const pageId = process.env.META_PAGE_ID;

  // Skip if this is our own message (sent from the page)
  if (senderId === pageId) {
    console.log("[Meta Webhook] Skipping own message");
    return;
  }

  // Handle incoming message
  if (event.message) {
    const message = event.message;
    const messageId = message.mid;
    const text = message.text || "";
    const timestamp = event.timestamp;

    // Handle attachments
    const attachments = message.attachments?.map((att) => ({
      name: att.type,
      url: att.payload.url || "",
      type: att.type,
    })).filter((att) => att.url) || [];

    console.log(`[Meta Webhook] Processing ${source} message from ${senderId}:`, {
      messageId,
      text: text.substring(0, 50),
      attachmentsCount: attachments.length,
    });

    try {
      // Call Convex to ingest the message
      await convex.mutation(api.conversations.ingestMetaMessage, {
        source,
        senderId,
        messageId,
        content: text,
        timestamp,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      console.log(`[Meta Webhook] Message ingested successfully: ${messageId}`);
    } catch (error) {
      console.error("[Meta Webhook] Error ingesting message:", error);
    }
  }

  // Handle read receipts
  if (event.read) {
    console.log(`[Meta Webhook] Read receipt from ${senderId} at ${event.read.watermark}`);
    // Could update message read status in Convex if needed
  }

  // Handle delivery confirmations
  if (event.delivery) {
    console.log(`[Meta Webhook] Delivery confirmation for ${event.delivery.mids?.length || 0} messages`);
    // Could update message delivery status in Convex if needed
  }
}
