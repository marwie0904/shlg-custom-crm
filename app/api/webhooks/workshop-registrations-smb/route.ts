import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Webhook payload structure from SMB workshop registration
interface WorkshopRegistrationPayload {
  from_first?: string;
  from_last?: string;
  from_phone?: string;
  from_email?: string;
  from_message?: string; // Number of guests
  from_source?: string; // Tag to apply (e.g., "Workshop Registration 09/24")
  referring_url?: string;
  workshop_joined?: string; // e.g., "How to Protect Your Asset in 3 Easy Steps - AAA Fort Myers - Tuesday, January 20th, 2026 at 11:00 am – 12:00 pm"
  marital_status?: string;
  florida_resident?: string;
  [key: string]: unknown;
}

// Parse workshop_joined to extract title, location, and date
function parseWorkshopJoined(workshopJoined: string): {
  title: string;
  location: string;
  dateString: string;
  time: string;
} | null {
  try {
    // Format: "Title - Location - Day, Date at Time"
    // Example: "How to Protect Your Asset in 3 Easy Steps - AAA Fort Myers - Tuesday, January 20th, 2026 at 11:00 am – 12:00 pm"

    const parts = workshopJoined.split(" - ");
    if (parts.length < 3) return null;

    const title = parts[0].trim();
    const location = parts[1].trim();
    const dateTimePart = parts.slice(2).join(" - ").trim();

    // Extract date and time from "Tuesday, January 20th, 2026 at 11:00 am – 12:00 pm"
    const atIndex = dateTimePart.indexOf(" at ");
    if (atIndex === -1) {
      return { title, location, dateString: dateTimePart, time: "" };
    }

    const dateString = dateTimePart.substring(0, atIndex).trim();
    const time = dateTimePart.substring(atIndex + 4).trim();

    return { title, location, dateString, time };
  } catch {
    return null;
  }
}

// Try to parse a date string like "Tuesday, January 20th, 2026"
function parseDateString(dateString: string): Date | null {
  try {
    // Remove day name and ordinal suffixes
    const cleaned = dateString
      .replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s*/i, "")
      .replace(/(\d+)(st|nd|rd|th)/gi, "$1");

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkshopRegistrationPayload = await request.json();

    console.log("[Workshop Registration SMB] Received payload:", JSON.stringify(body, null, 2));

    // Extract fields
    const firstName = body.from_first?.trim() || "Unknown";
    const lastName = body.from_last?.trim() || "Registrant";
    const phone = body.from_phone?.trim() || undefined;
    const email = body.from_email?.trim() || undefined;
    const numberOfGuests = body.from_message?.trim() || "1";
    const source = body.from_source?.trim() || "Workshop Registration";
    const workshopJoined = body.workshop_joined?.trim() || undefined;
    const maritalStatus = body.marital_status?.trim() || undefined;
    const floridaResident = body.florida_resident?.trim() || undefined;

    // Check if contact already exists
    let existingContact = null;
    let contactId: Id<"contacts"> | null = null;

    if (email) {
      existingContact = await convex.query(api.contacts.getByEmail, { email });
    }

    if (!existingContact && phone) {
      const normalizedPhone = phone.replace(/\D/g, "");
      const phoneVariants = [
        `+1${normalizedPhone}`,
        `+${normalizedPhone}`,
        normalizedPhone,
      ];

      for (const variant of phoneVariants) {
        existingContact = await convex.query(api.contacts.getByPhone, { phone: variant });
        if (existingContact) break;
      }
    }

    // Build notes with workshop and guest info
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const workshopNote = workshopJoined
      ? `[Workshop Registration - ${timestamp}]\nWorkshop: ${workshopJoined}\nNumber of Guests: ${numberOfGuests}`
      : `[Workshop Registration - ${timestamp}]\nNumber of Guests: ${numberOfGuests}`;

    if (existingContact) {
      contactId = existingContact._id;
      console.log(`[Workshop Registration SMB] Contact already exists: ${contactId}`);

      // Update existing contact with new info
      const existingNotes = existingContact.notes || "";
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n${workshopNote}`
        : workshopNote;

      await convex.mutation(api.contacts.update, {
        id: contactId,
        notes: updatedNotes,
        // Update marital status and florida resident if provided
        ...(maritalStatus && { maritalStatus }),
        ...(floridaResident && { floridaResident }),
      });

      // Add tag if not present
      const existingTags = existingContact.tags || [];
      if (!existingTags.includes(source)) {
        await convex.mutation(api.contacts.addTag, {
          id: contactId,
          tag: source,
        });
      }

      // Sync tag to existing opportunities
      const opportunities = await convex.query(api.opportunities.getByContactId, {
        contactId: contactId,
      });
      for (const opp of opportunities) {
        const oppTags = opp.tags || [];
        if (!oppTags.includes(source)) {
          await convex.mutation(api.opportunities.addTag, {
            id: opp._id,
            tag: source,
          });
        }
      }
    } else {
      // Format phone number
      let formattedPhone = undefined;
      if (phone) {
        const normalizedPhone = phone.replace(/\D/g, "");
        formattedPhone = normalizedPhone.startsWith("1")
          ? `+${normalizedPhone}`
          : `+1${normalizedPhone}`;
      }

      // Create new contact
      contactId = await convex.mutation(api.contacts.create, {
        firstName,
        lastName,
        phone: formattedPhone,
        email,
        source,
        tags: [source],
        notes: workshopNote,
        maritalStatus,
        floridaResident,
      });

      console.log(`[Workshop Registration SMB] Created new contact: ${contactId}`);
    }

    // Try to find and register for the workshop
    let workshopId: Id<"workshops"> | null = null;
    let registrationId: Id<"workshopRegistrations"> | null = null;
    let workshopMatchInfo = null;

    if (workshopJoined && contactId) {
      const parsed = parseWorkshopJoined(workshopJoined);

      if (parsed) {
        workshopMatchInfo = parsed;

        // Get all upcoming workshops to find a match
        const workshops = await convex.query(api.workshops.list, { limit: 100 });

        // Try to find matching workshop by title (fuzzy match)
        const matchingWorkshop = workshops.find((w: { title: string; location?: string; date: number }) => {
          // Check if titles are similar (contains key words)
          const titleMatch = w.title.toLowerCase().includes(parsed.title.toLowerCase().substring(0, 20)) ||
                           parsed.title.toLowerCase().includes(w.title.toLowerCase().substring(0, 20));

          // Check location if available
          const locationMatch = !w.location || !parsed.location ||
                               w.location.toLowerCase().includes(parsed.location.toLowerCase()) ||
                               parsed.location.toLowerCase().includes(w.location.toLowerCase());

          // Check date if we can parse it
          const workshopDate = parseDateString(parsed.dateString);
          let dateMatch = true;
          if (workshopDate) {
            const wDate = new Date(w.date);
            dateMatch = wDate.toDateString() === workshopDate.toDateString();
          }

          return titleMatch && locationMatch && dateMatch;
        });

        if (matchingWorkshop) {
          workshopId = matchingWorkshop._id;
          console.log(`[Workshop Registration SMB] Found matching workshop: ${workshopId}`);

          // Try to register
          try {
            registrationId = await convex.mutation(api.workshops.register, {
              workshopId,
              contactId,
              notes: `Registered via website form. Guests: ${numberOfGuests}`,
            });
            console.log(`[Workshop Registration SMB] Registered for workshop: ${registrationId}`);
          } catch (regError) {
            // Registration might fail if already registered or capacity full
            console.log(`[Workshop Registration SMB] Could not register: ${regError}`);
          }
        } else {
          console.log(`[Workshop Registration SMB] No matching workshop found for: ${parsed.title}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      contactId,
      isNew: !existingContact,
      workshopId,
      registrationId,
      workshopMatchInfo,
      message: existingContact
        ? "Existing contact updated with workshop registration"
        : "New lead created with workshop registration",
    });
  } catch (error) {
    console.error("[Workshop Registration SMB] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process workshop registration",
      },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "ok",
    message: "Workshop Registration SMB webhook endpoint is active",
  });
}
