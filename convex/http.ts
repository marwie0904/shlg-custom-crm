import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ==========================================
// RINGCENTRAL WEBHOOK ENDPOINT
// ==========================================

/**
 * RingCentral Webhook Handler
 * Receives incoming SMS notifications from RingCentral
 *
 * Endpoint: POST /ringcentral/webhook
 */
http.route({
  path: "/ringcentral/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // IMPORTANT: RingCentral sends validation token in the header, not body
      const validationToken = request.headers.get("Validation-Token");

      if (validationToken) {
        console.log("[RingCentral Webhook] Validation request received");
        return new Response(validationToken, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
            "Validation-Token": validationToken,
          },
        });
      }

      // Parse body for actual webhook events
      let body;
      try {
        body = await request.json();
      } catch {
        console.log("[RingCentral Webhook] Empty or invalid body");
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Log incoming webhook for debugging
      console.log("[RingCentral Webhook] Received:", JSON.stringify(body, null, 2));

      // Handle direct message notifications (from subscription with instant filter)
      if (body.uuid && body.body) {
        const msgBody = body.body;

        // Check if this is an inbound message
        if (msgBody.direction === "Inbound" && msgBody.type === "SMS") {
          const from = msgBody.from?.phoneNumber || msgBody.from?.extensionNumber;
          const to = msgBody.to?.[0]?.phoneNumber || msgBody.to?.[0]?.extensionNumber;
          const text = msgBody.subject || msgBody.text || "";
          const messageId = msgBody.id?.toString() || body.uuid;
          const timestamp = msgBody.creationTime
            ? new Date(msgBody.creationTime).getTime()
            : Date.now();

          if (from && text) {
            // Ingest the message into the database
            await ctx.runMutation(internal.ringcentral.ingestIncomingSMS, {
              from,
              to: to || "",
              text,
              messageId,
              timestamp,
            });

            console.log(`[RingCentral Webhook] Ingested SMS from ${from}`);
          }
        }
      }

      // Handle message-store notifications (may have different structure)
      if (body.body?.changes) {
        for (const change of body.body.changes) {
          if (change.type === "SMS" && change.newCount > 0) {
            console.log("[RingCentral Webhook] New SMS notification:", change);
            // Note: Full message details need to be fetched via API
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("[RingCentral Webhook] Error:", error);
      // Still return 200 to prevent RingCentral from retrying
      return new Response(
        JSON.stringify({ error: "Processing error", received: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * RingCentral Webhook Verification (GET request)
 * Some webhook setups require a GET endpoint for verification
 */
http.route({
  path: "/ringcentral/webhook",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Check header first
    const headerToken = request.headers.get("Validation-Token");
    if (headerToken) {
      return new Response(headerToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Validation-Token": headerToken,
        },
      });
    }

    // Check query param
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("validation_token");
    if (queryToken) {
      return new Response(queryToken, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Validation-Token": queryToken,
        },
      });
    }

    return new Response(JSON.stringify({ status: "RingCentral webhook endpoint active" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// ==========================================
// HEALTH CHECK
// ==========================================

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
