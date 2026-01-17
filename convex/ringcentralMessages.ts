import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update a message from RingCentral
export const createMessage = mutation({
  args: {
    ringcentralId: v.string(),
    from: v.string(),
    to: v.string(),
    text: v.string(),
    direction: v.union(v.literal("Inbound"), v.literal("Outbound")),
    messageStatus: v.string(),
    readStatus: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find the phone number to look up contact
    const phoneNumber = args.direction === "Inbound" ? args.from : args.to;

    // Normalize phone number for lookup (remove +1 prefix for comparison)
    const normalizedPhone = phoneNumber.replace(/^\+1/, "").replace(/\D/g, "");

    // Try to find existing contact by phone number
    let contact = await ctx.db
      .query("contacts")
      .filter((q) =>
        q.or(
          q.eq(q.field("phone"), phoneNumber),
          q.eq(q.field("phone"), normalizedPhone),
          q.eq(q.field("phone"), `+1${normalizedPhone}`),
          q.eq(q.field("secondaryPhone"), phoneNumber),
          q.eq(q.field("secondaryPhone"), normalizedPhone),
          q.eq(q.field("secondaryPhone"), `+1${normalizedPhone}`)
        )
      )
      .first();

    // If no contact found, create one
    if (!contact) {
      const contactId = await ctx.db.insert("contacts", {
        firstName: "Unknown",
        lastName: phoneNumber,
        phone: phoneNumber,
        source: "RingCentral SMS",
        createdAt: now,
        updatedAt: now,
      });
      contact = await ctx.db.get(contactId);
    }

    if (!contact) {
      throw new Error("Failed to create or find contact");
    }

    // Find or create conversation
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contactId", (q) => q.eq("contactId", contact!._id))
      .filter((q) => q.eq(q.field("source"), "sms"))
      .first();

    if (!conversation) {
      const conversationId = await ctx.db.insert("conversations", {
        contactId: contact._id,
        source: "sms",
        unreadCount: args.direction === "Inbound" ? 1 : 0,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      });
      conversation = await ctx.db.get(conversationId);
    } else {
      // Update conversation
      await ctx.db.patch(conversation._id, {
        lastMessageAt: now,
        updatedAt: now,
        unreadCount: args.direction === "Inbound"
          ? conversation.unreadCount + 1
          : conversation.unreadCount,
      });
    }

    if (!conversation) {
      throw new Error("Failed to create or find conversation");
    }

    // Check if message already exists (deduplication)
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_ringcentralMessageId", (q) =>
        q.eq("ringcentralMessageId", args.ringcentralId)
      )
      .first();

    if (existingMessage) {
      // Message already exists, skip
      return existingMessage._id;
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      content: args.text,
      timestamp: new Date(args.createdAt).getTime(),
      isOutgoing: args.direction === "Outbound",
      read: args.direction === "Outbound" || args.readStatus === "Read",
      ringcentralMessageId: args.ringcentralId,
    });

    // Update contact's last contacted time
    await ctx.db.patch(contact._id, {
      lastContactedAt: now,
      updatedAt: now,
    });

    return messageId;
  },
});

// Get messages for a contact's SMS conversation
export const getMessagesByContactPhone = query({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize phone number
    const normalizedPhone = args.phone.replace(/^\+1/, "").replace(/\D/g, "");

    // Find contact
    const contact = await ctx.db
      .query("contacts")
      .filter((q) =>
        q.or(
          q.eq(q.field("phone"), args.phone),
          q.eq(q.field("phone"), normalizedPhone),
          q.eq(q.field("phone"), `+1${normalizedPhone}`)
        )
      )
      .first();

    if (!contact) {
      return [];
    }

    // Find SMS conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contactId", (q) => q.eq("contactId", contact._id))
      .filter((q) => q.eq(q.field("source"), "sms"))
      .first();

    if (!conversation) {
      return [];
    }

    // Get messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
      .order("asc")
      .collect();

    return messages;
  },
});

// Mark messages as read for a conversation
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Get all unread messages
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    // Mark them as read
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { read: true });
    }

    // Reset unread count
    await ctx.db.patch(args.conversationId, {
      unreadCount: 0,
      updatedAt: Date.now(),
    });

    return unreadMessages.length;
  },
});

// Get SMS conversations with unread counts
export const getSMSConversations = query({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("source"), "sms"))
      .order("desc")
      .collect();

    // Enrich with contact info and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const contact = await ctx.db.get(conv.contactId);
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .first();

        return {
          ...conv,
          contact: contact ? {
            _id: contact._id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
          } : null,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            isOutgoing: lastMessage.isOutgoing,
          } : null,
        };
      })
    );

    return enrichedConversations;
  },
});
