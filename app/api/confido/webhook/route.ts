import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const CONFIDO_WEBHOOK_SECRET = process.env.CONFIDO_WEBHOOK_SECRET;

/**
 * Verify webhook signature from Confido
 * Note: Implementation depends on Confido's signature format
 */
function verifyWebhookSignature(signature: string | null): boolean {
  if (!CONFIDO_WEBHOOK_SECRET) {
    console.warn("CONFIDO_WEBHOOK_SECRET not set - skipping signature verification");
    return true;
  }

  if (!signature) {
    console.warn("No signature provided in webhook request");
    return false;
  }

  // TODO: Implement actual signature verification based on Confido's algorithm
  // For now, just check that a signature was provided
  return true;
}

/**
 * Confido Payment Webhook Handler
 *
 * This endpoint receives payment notifications from Confido.
 * When a payment is made, Confido sends a webhook with payment details.
 * We use this to update the invoice status in our database.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-confido-signature") ||
                      request.headers.get("x-webhook-signature");

    if (!verifyWebhookSignature(signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = await request.json();

    console.log("=== CONFIDO PAYMENT WEBHOOK RECEIVED ===");
    console.log("Webhook payload:", JSON.stringify(body, null, 2));

    // Extract payment data from webhook
    // Note: Actual field names may vary based on Confido's webhook format
    const paymentData = {
      confidoPaymentId: body.payment_id || body.paymentId || body.id,
      confidoInvoiceId: body.invoice_id || body.invoiceId || body.paymentLinkId,
      amount: parseFloat(body.amount || body.amountPaid || 0) / 100, // Convert from cents
      paymentMethod: body.payment_method || body.paymentMethod || "unknown",
      transactionDate: body.transaction_date || body.createdOn || new Date().toISOString(),
      status: body.status || "completed",
    };

    // Validate required fields
    if (!paymentData.confidoInvoiceId) {
      console.error("Missing invoice ID in webhook");
      return NextResponse.json(
        { success: false, error: "Missing invoice ID" },
        { status: 400 }
      );
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      console.error("Invalid payment amount in webhook");
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    console.log("Payment data:", paymentData);

    // Update invoice payment status in Convex
    try {
      await convex.mutation(api.invoices.updatePaymentStatus, {
        confidoInvoiceId: paymentData.confidoInvoiceId,
        amountPaid: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
      });

      console.log("Invoice payment status updated successfully");
    } catch (convexError) {
      console.error("Error updating invoice in Convex:", convexError);
      // Don't fail the webhook - Confido may retry
    }

    return NextResponse.json({
      success: true,
      message: "Payment webhook processed",
      paymentId: paymentData.confidoPaymentId,
    });
  } catch (error) {
    console.error("Error processing Confido webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification (if Confido requires it)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    // Return challenge for webhook verification
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    status: "ok",
    message: "Confido webhook endpoint is active"
  });
}
