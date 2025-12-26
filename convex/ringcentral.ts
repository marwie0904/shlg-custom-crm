import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
}

interface SendSMSResult {
  success: boolean;
  messageId: string;
  to: string;
  from: string;
}

interface WebhookSubscriptionResult {
  success: boolean;
  subscriptionId: string;
  expiresAt: string;
}

interface ConversationWithContact {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string;
  unreadCount: number;
  lastMessageAt: number;
  createdAt: number;
  updatedAt: number;
  metaSenderId?: string;
  contact: {
    _id: Id<"contacts">;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    [key: string]: unknown;
  } | null;
}

// ==========================================
// HELPER FUNCTIONS (moved to top for use in handlers)
// ==========================================

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it's a 10-digit US number, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it starts with 1 and is 11 digits, add +
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If it already has a country code, just add +
  if (digits.length > 10) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}

/**
 * Normalize phone number for comparison
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If it's 11 digits starting with 1 (US), return last 10
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  // Return last 10 digits for comparison
  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
}

// ==========================================
// INTERNAL QUERIES
// ==========================================

export const getConversationWithContact = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args): Promise<ConversationWithContact | null> => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const contact = await ctx.db.get(conversation.contactId);
    return { ...conversation, contact };
  },
});

// ==========================================
// INTERNAL MUTATIONS (Database operations)
// ==========================================

/**
 * Store an outgoing SMS in an existing conversation
 */
export const storeOutgoingSMS = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    ringcentralMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    const now = Date.now();

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      timestamp: now,
      isOutgoing: true,
      read: true,
      ringcentralMessageId: args.ringcentralMessageId,
    });

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      updatedAt: now,
    });

    return messageId;
  },
});

/**
 * Create conversation if needed and store outgoing SMS
 */
export const createConversationAndStoreSMS = internalMutation({
  args: {
    contactId: v.id("contacts"),
    phoneNumber: v.string(),
    content: v.string(),
    ringcentralMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ conversationId: Id<"conversations">; messageId: Id<"messages"> }> => {
    const now = Date.now();

    // Check if SMS conversation exists for this contact
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .filter((q) => q.eq(q.field("source"), "sms"))
      .first();

    // Create conversation if it doesn't exist
    if (!conversation) {
      const conversationId = await ctx.db.insert("conversations", {
        contactId: args.contactId,
        source: "sms",
        unreadCount: 0,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      });
      conversation = await ctx.db.get(conversationId);
    }

    // Create the message
    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation!._id,
      content: args.content,
      timestamp: now,
      isOutgoing: true,
      read: true,
      ringcentralMessageId: args.ringcentralMessageId,
    });

    // Update conversation
    await ctx.db.patch(conversation!._id, {
      lastMessageAt: now,
      updatedAt: now,
    });

    return { conversationId: conversation!._id, messageId };
  },
});

/**
 * Ingest incoming SMS from RingCentral webhook
 */
export const ingestIncomingSMS = internalMutation({
  args: {
    from: v.string(), // Sender phone number
    to: v.string(), // Your RingCentral number
    text: v.string(), // Message content
    messageId: v.string(), // RingCentral message ID for deduplication
    timestamp: v.number(), // Message timestamp
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    // Check if message already exists (deduplication)
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_ringcentralMessageId", (q) => q.eq("ringcentralMessageId", args.messageId))
      .first();

    if (existingMessage) {
      console.log(`[RingCentral] Message ${args.messageId} already exists, skipping`);
      return existingMessage._id;
    }

    const now = Date.now();
    const normalizedPhone = normalizePhoneNumber(args.from);

    // Find contact by phone number
    let contact = await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phone", normalizedPhone))
      .first();

    // Also try with formatted versions
    if (!contact) {
      const allContacts = await ctx.db.query("contacts").collect();
      contact = allContacts.find((c) => {
        if (!c.phone) return false;
        return normalizePhoneNumber(c.phone) === normalizedPhone;
      }) || null;
    }

    // Create contact if doesn't exist
    if (!contact) {
      const contactId = await ctx.db.insert("contacts", {
        firstName: "SMS",
        lastName: `Contact ${args.from.slice(-4)}`,
        phone: args.from,
        source: "RingCentral SMS",
        createdAt: now,
        updatedAt: now,
      });
      contact = await ctx.db.get(contactId);

      // Create opportunity for new contact
      const freshLeadsStage = await ctx.db
        .query("pipelineStages")
        .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
        .filter((q) => q.eq(q.field("name"), "Fresh Leads"))
        .first();

      if (freshLeadsStage && contact) {
        await ctx.db.insert("opportunities", {
          title: `SMS Contact ${args.from.slice(-4)}`,
          contactId: contact._id,
          pipelineId: "Main Lead Flow",
          stageId: freshLeadsStage._id,
          estimatedValue: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Find or create SMS conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contactId", (q) => q.eq("contactId", contact!._id))
      .filter((q) => q.eq(q.field("source"), "sms"))
      .first();

    if (!conversation) {
      const conversationId = await ctx.db.insert("conversations", {
        contactId: contact!._id,
        source: "sms",
        unreadCount: 1,
        lastMessageAt: args.timestamp,
        createdAt: now,
        updatedAt: now,
      });
      conversation = await ctx.db.get(conversationId);
    }

    // Create the message
    const msgId = await ctx.db.insert("messages", {
      conversationId: conversation!._id,
      content: args.text,
      timestamp: args.timestamp,
      isOutgoing: false,
      read: false,
      ringcentralMessageId: args.messageId,
    });

    // Update conversation
    await ctx.db.patch(conversation!._id, {
      lastMessageAt: args.timestamp,
      unreadCount: (conversation!.unreadCount || 0) + 1,
      updatedAt: now,
    });

    // Update contact last contacted
    await ctx.db.patch(contact!._id, {
      lastContactedAt: args.timestamp,
      updatedAt: now,
    });

    console.log(`[RingCentral] Ingested SMS from ${args.from}: ${args.text.substring(0, 50)}...`);

    return msgId;
  },
});

// ==========================================
// ACTIONS (External API calls)
// ==========================================

/**
 * Authenticate with RingCentral and get access token using JWT
 */
export const authenticate = internalAction({
  args: {},
  handler: async (): Promise<AuthResponse> => {
    const clientId = process.env.RINGCENTRAL_CLIENT_ID;
    const clientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
    const jwtToken = process.env.RINGCENTRAL_JWT_TOKEN;
    const serverUrl = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

    if (!clientId || !clientSecret || !jwtToken) {
      throw new Error("Missing RingCentral credentials in environment variables");
    }

    const tokenUrl = `${serverUrl}/restapi/oauth/token`;

    // Base64 encode credentials (btoa works in Convex runtime)
    const credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwtToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RingCentral] Auth error:", errorText);
      throw new Error(`RingCentral authentication failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  },
});

/**
 * Send an SMS message via RingCentral
 */
export const sendSMS = internalAction({
  args: {
    to: v.string(), // Phone number to send to (e.g., "+15551234567")
    text: v.string(), // Message content
    conversationId: v.optional(v.id("conversations")), // Optional: link to existing conversation
    contactId: v.optional(v.id("contacts")), // Optional: link to contact
  },
  handler: async (ctx, args): Promise<SendSMSResult> => {
    const serverUrl = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";
    const fromNumber = process.env.RINGCENTRAL_PHONE_NUMBER;

    if (!fromNumber) {
      throw new Error("Missing RINGCENTRAL_PHONE_NUMBER in environment variables");
    }

    // Get access token
    const authResult: AuthResponse = await ctx.runAction(internal.ringcentral.authenticate, {});
    const accessToken = authResult.accessToken;

    // Format phone numbers (ensure E.164 format)
    const formattedTo = formatPhoneNumber(args.to);
    const formattedFrom = formatPhoneNumber(fromNumber);

    // Send SMS via RingCentral API
    const smsUrl = `${serverUrl}/restapi/v1.0/account/~/extension/~/sms`;

    const response = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        from: { phoneNumber: formattedFrom },
        to: [{ phoneNumber: formattedTo }],
        text: args.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RingCentral] SMS send error:", errorText);
      throw new Error(`Failed to send SMS: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as { id: string };
    console.log("[RingCentral] SMS sent successfully:", result.id);

    // Store the message in the database
    if (args.conversationId) {
      await ctx.runMutation(internal.ringcentral.storeOutgoingSMS, {
        conversationId: args.conversationId,
        content: args.text,
        ringcentralMessageId: result.id?.toString(),
      });
    } else if (args.contactId) {
      // Create or find conversation and store message
      await ctx.runMutation(internal.ringcentral.createConversationAndStoreSMS, {
        contactId: args.contactId,
        phoneNumber: formattedTo,
        content: args.text,
        ringcentralMessageId: result.id?.toString(),
      });
    }

    return {
      success: true,
      messageId: result.id,
      to: formattedTo,
      from: formattedFrom,
    };
  },
});

/**
 * Send SMS from a conversation (used by UI)
 */
export const sendSMSFromConversation = action({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<SendSMSResult> => {
    // Get conversation and contact to find phone number
    const conversation: ConversationWithContact | null = await ctx.runQuery(
      internal.ringcentral.getConversationWithContact,
      { conversationId: args.conversationId }
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.contact?.phone) {
      throw new Error("Contact has no phone number");
    }

    // Send the SMS
    const result: SendSMSResult = await ctx.runAction(internal.ringcentral.sendSMS, {
      to: conversation.contact.phone,
      text: args.content,
      conversationId: args.conversationId,
    });

    return result;
  },
});

/**
 * Subscribe to RingCentral webhooks for incoming SMS
 */
export const subscribeToSMSWebhook = internalAction({
  args: {
    webhookUrl: v.string(), // Your Convex HTTP endpoint URL
  },
  handler: async (ctx, args): Promise<WebhookSubscriptionResult> => {
    const serverUrl = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";

    // Get access token
    const authResult: AuthResponse = await ctx.runAction(internal.ringcentral.authenticate, {});
    const accessToken = authResult.accessToken;

    // Create subscription for incoming SMS
    const subscriptionUrl = `${serverUrl}/restapi/v1.0/subscription`;

    const response = await fetch(subscriptionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        eventFilters: [
          "/restapi/v1.0/account/~/extension/~/message-store/instant?type=SMS",
        ],
        deliveryMode: {
          transportType: "WebHook",
          address: args.webhookUrl,
        },
        expiresIn: 604800, // 7 days (max)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[RingCentral] Webhook subscription error:", errorText);
      throw new Error(`Failed to subscribe to webhooks: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as { id: string; expirationTime: string };
    console.log("[RingCentral] Webhook subscription created:", result.id);

    return {
      success: true,
      subscriptionId: result.id,
      expiresAt: result.expirationTime,
    };
  },
});
