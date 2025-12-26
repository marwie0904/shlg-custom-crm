import { NextRequest, NextResponse } from "next/server";

const MAKE_WEBHOOK_URL = process.env.MAKE_INVOICE_EMAIL_WEBHOOK;
const LOGO_URL = 'https://storage.googleapis.com/msgsndr/afYLuZPi37CZR1IpJlfn/media/68f107369d906785d9458314.png';
const INVOICE_VIEWER_BASE_URL = process.env.INVOICE_VIEWER_URL || 'https://shlg-custom-crm.vercel.app';

interface SendEmailRequest {
  to: string;
  recipientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  pdfBase64: string;
  pdfFilename: string;
  type: 'unpaid' | 'paid';
}

/**
 * Generates the HTML email body for an unpaid invoice
 */
function generateInvoiceEmailHTML(data: {
  recipientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
}): string {
  const invoiceViewerUrl = `${INVOICE_VIEWER_BASE_URL}/invoice/${data.invoiceNumber}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Invoice for ${data.recipientName}</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">Hi ${data.recipientName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Safe Harbor Law Firm sent you invoice# ${data.invoiceNumber} for ${data.amount} that's due on ${data.dueDate}</p>
              <a href="${invoiceViewerUrl}" style="display: inline-block; background-color: #e07c5a; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-size: 16px; font-weight: bold;">View Invoice</a>
              <p style="color: #333; font-size: 14px; margin: 20px 0 30px 0;">Unable to see the invoice button? <a href="${invoiceViewerUrl}" style="color: #2b6cb0;">View Invoice</a></p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">Regards,<br><strong>Safe Harbor Law Firm</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the HTML email body for a paid invoice
 */
function generatePaidInvoiceEmailHTML(data: {
  recipientName: string;
  invoiceNumber: string;
  amount: string;
}): string {
  const invoiceViewerUrl = `${INVOICE_VIEWER_BASE_URL}/invoice/${data.invoiceNumber}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #e8f4fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f4fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${LOGO_URL}" alt="Safe Harbor Law Firm" width="400" style="max-width: 100%;">
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 24px;">Payment Received - Thank You!</h2>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">Hi ${data.recipientName},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Thank you for your payment of ${data.amount} for invoice# ${data.invoiceNumber}.</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">You can view your paid invoice receipt anytime by clicking the button below.</p>
              <a href="${invoiceViewerUrl}" style="display: inline-block; background-color: #48bb78; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-size: 16px; font-weight: bold;">View Receipt</a>
              <p style="color: #333; font-size: 14px; margin: 20px 0 30px 0;">Unable to see the button? <a href="${invoiceViewerUrl}" style="color: #2b6cb0;">View Receipt</a></p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">Regards,<br><strong>Safe Harbor Law Firm</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    // Check for webhook URL
    if (!MAKE_WEBHOOK_URL) {
      return NextResponse.json(
        { success: false, error: "MAKE_INVOICE_EMAIL_WEBHOOK environment variable not set" },
        { status: 500 }
      );
    }

    const body: SendEmailRequest = await request.json();

    const {
      to,
      recipientName,
      invoiceNumber,
      amount,
      dueDate,
      pdfBase64,
      pdfFilename,
      type,
    } = body;

    // Validate required fields
    if (!to || !recipientName || !invoiceNumber || !pdfBase64 || !pdfFilename) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`=== Sending ${type} Invoice Email ===`);
    console.log("To:", to);
    console.log("Invoice:", invoiceNumber);

    // Generate HTML body based on type
    const htmlBody = type === 'paid'
      ? generatePaidInvoiceEmailHTML({ recipientName, invoiceNumber, amount })
      : generateInvoiceEmailHTML({ recipientName, invoiceNumber, amount, dueDate });

    // Prepare subject based on type
    const subject = type === 'paid'
      ? `Payment Received - Invoice #${invoiceNumber}`
      : `Safe Harbor Invoice #${invoiceNumber}`;

    // Prepare webhook payload (same structure as ghl-automation)
    const payload = {
      to,
      subject,
      htmlBody,
      pdfBase64,
      pdfFilename,
      type,
    };

    // Send to Make.com webhook
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Make.com webhook error:", errorText);
      return NextResponse.json(
        { success: false, error: `Webhook failed: ${response.status}` },
        { status: 500 }
      );
    }

    console.log(`✅ ${type === 'paid' ? 'Paid' : ''} Invoice email sent successfully`);

    return NextResponse.json({
      success: true,
      message: `Invoice email sent to ${to}`,
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
