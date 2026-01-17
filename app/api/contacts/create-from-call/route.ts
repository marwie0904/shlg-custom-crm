import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, callerName } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Normalize phone number for consistency
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    const formattedPhone = normalizedPhone.startsWith("1")
      ? `+${normalizedPhone}`
      : `+1${normalizedPhone}`;

    // Check if contact already exists
    const existingContact = await convex.query(api.contacts.getByPhone, {
      phone: formattedPhone,
    });

    if (existingContact) {
      return NextResponse.json({
        success: true,
        contactId: existingContact._id,
        isNew: false,
        contact: existingContact,
      });
    }

    // Also check with other phone formats
    const phoneVariants = [
      formattedPhone,
      normalizedPhone,
      normalizedPhone.replace(/^1/, ""),
    ];

    // Get all contacts and check manually for phone matches
    const allContacts = await convex.query(api.contacts.list, {});
    const matchingContact = allContacts.find((contact: any) => {
      const contactPhone = contact.phone?.replace(/\D/g, "") || "";
      const contactSecondary = contact.secondaryPhone?.replace(/\D/g, "") || "";
      return phoneVariants.some(
        (variant) =>
          contactPhone === variant ||
          contactSecondary === variant ||
          contactPhone.endsWith(variant) ||
          variant.endsWith(contactPhone)
      );
    });

    if (matchingContact) {
      return NextResponse.json({
        success: true,
        contactId: matchingContact._id,
        isNew: false,
        contact: matchingContact,
      });
    }

    // Create new contact with phone number
    // Use caller name if provided, otherwise use "Unknown" as placeholder
    let firstName = "Unknown";
    let lastName = "Caller";

    if (callerName && callerName.trim()) {
      const nameParts = callerName.trim().split(" ");
      firstName = nameParts[0] || "Unknown";
      lastName = nameParts.slice(1).join(" ") || "Caller";
    }

    const contactId = await convex.mutation(api.contacts.create, {
      firstName,
      lastName,
      phone: formattedPhone,
      source: "Inbound Call",
      tags: ["inbound-call"],
      skipOpportunityCreation: true, // Don't create opportunity for inbound calls
    });

    console.log(
      `[Create Contact] Created new contact from inbound call: ${contactId}, phone: ${formattedPhone}`
    );

    return NextResponse.json({
      success: true,
      contactId,
      isNew: true,
      contact: {
        _id: contactId,
        firstName,
        lastName,
        phone: formattedPhone,
      },
    });
  } catch (error) {
    console.error("[Create Contact] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create contact",
      },
      { status: 500 }
    );
  }
}
