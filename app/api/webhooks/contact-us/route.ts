import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Webhook payload structure from the website contact form
interface ContactUsWebhookPayload {
  FirstName?: string;
  LastName?: string;
  Phone?: string;
  Email?: string;
  textarea?: string; // Message/inquiry from the form
  today_date?: string;
  // Additional fields that may be present
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactUsWebhookPayload = await request.json();

    console.log("[Contact Us Webhook] Received payload:", JSON.stringify(body, null, 2));

    // Extract and validate required fields
    const firstName = body.FirstName?.trim() || "Unknown";
    const lastName = body.LastName?.trim() || "Contact";
    const phone = body.Phone?.trim() || undefined;
    const email = body.Email?.trim() || undefined;
    const message = body.textarea?.trim() || undefined;

    // Check if contact already exists by email or phone
    let existingContact = null;

    if (email) {
      existingContact = await convex.query(api.contacts.getByEmail, { email });
    }

    if (!existingContact && phone) {
      // Normalize phone for lookup
      const normalizedPhone = phone.replace(/\D/g, "");
      const phoneVariants = [
        `+1${normalizedPhone}`,
        `+${normalizedPhone}`,
        normalizedPhone,
      ];

      // Check each variant
      for (const variant of phoneVariants) {
        existingContact = await convex.query(api.contacts.getByPhone, { phone: variant });
        if (existingContact) break;
      }
    }

    if (existingContact) {
      console.log(`[Contact Us Webhook] Contact already exists: ${existingContact._id}`);

      // Update the existing contact's notes with the new message
      if (message) {
        const existingNotes = existingContact.notes || "";
        const timestamp = new Date().toLocaleString("en-US", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const updatedNotes = existingNotes
          ? `${existingNotes}\n\n[Contact Us - ${timestamp}]\n${message}`
          : `[Contact Us - ${timestamp}]\n${message}`;

        await convex.mutation(api.contacts.update, {
          id: existingContact._id,
          notes: updatedNotes,
        });
      }

      // Add tag if not present
      const existingTags = existingContact.tags || [];
      if (!existingTags.includes("Contact Us")) {
        await convex.mutation(api.contacts.addTag, {
          id: existingContact._id,
          tag: "Contact Us",
        });
      }

      return NextResponse.json({
        success: true,
        contactId: existingContact._id,
        isNew: false,
        message: "Existing contact updated with new inquiry",
      });
    }

    // Format phone number for storage
    let formattedPhone = undefined;
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "");
      formattedPhone = normalizedPhone.startsWith("1")
        ? `+${normalizedPhone}`
        : `+1${normalizedPhone}`;
    }

    // Create new contact
    // Note: The contact create mutation automatically creates an opportunity in "Fresh Leads"
    const contactId = await convex.mutation(api.contacts.create, {
      firstName,
      lastName,
      phone: formattedPhone,
      email,
      source: "Contact Us",
      tags: ["Contact Us"],
      notes: message,
    });

    console.log(`[Contact Us Webhook] Created new contact: ${contactId}`);

    return NextResponse.json({
      success: true,
      contactId,
      isNew: true,
      message: "New lead created successfully",
    });
  } catch (error) {
    console.error("[Contact Us Webhook] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process contact form submission",
      },
      { status: 500 }
    );
  }
}

// Optional: Handle GET for webhook verification if needed
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Contact Us webhook endpoint is active",
  });
}
