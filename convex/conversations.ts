import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let conversations;
    if (args.source) {
      const source = args.source;
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_source", (q) => q.eq("source", source))
        .order("desc")
        .take(limit);
    } else {
      conversations = await ctx.db.query("conversations").order("desc").take(limit);
    }

    // Fetch contacts for each conversation
    const conversationsWithContacts = await Promise.all(
      conversations.map(async (conv) => {
        const contact = await ctx.db.get(conv.contactId);
        return { ...conv, contact };
      })
    );

    return conversationsWithContacts;
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;

    const contact = await ctx.db.get(conversation.contactId);
    return { ...conversation, contact };
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getWithMessages = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;

    const [contact, messages] = await Promise.all([
      ctx.db.get(conversation.contactId),
      ctx.db
        .query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
        .order("asc")
        .collect(),
    ]);

    return { ...conversation, contact, messages };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      ...args,
      unreadCount: 0,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("conversations"),
    source: v.optional(v.string()),
    unreadCount: v.optional(v.number()),
    lastMessageAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Conversation not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) throw new Error("Conversation not found");

    // Mark all messages as read
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
      .collect();

    await Promise.all(
      messages
        .filter((m) => !m.read && !m.isOutgoing)
        .map((m) => ctx.db.patch(m._id, { read: true }))
    );

    // Update conversation unread count
    await ctx.db.patch(args.id, {
      unreadCount: 0,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages first
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
      .collect();

    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    // Delete conversation
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ==========================================
// MESSAGE FUNCTIONS
// ==========================================

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    isOutgoing: v.boolean(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const now = Date.now();

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      timestamp: now,
      isOutgoing: args.isOutgoing,
      read: args.isOutgoing, // Outgoing messages are automatically read
      attachments: args.attachments,
    });

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      unreadCount: args.isOutgoing
        ? conversation.unreadCount
        : conversation.unreadCount + 1,
      updatedAt: now,
    });

    return messageId;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId));

    const messages = await query.order("desc").take(args.limit ?? 50);

    // Return in chronological order
    return messages.reverse();
  },
});

// ==========================================
// META WEBHOOK INGESTION
// ==========================================

export const getByMetaSenderId = query({
  args: { metaSenderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_metaSenderId", (q) => q.eq("metaSenderId", args.metaSenderId))
      .first();
  },
});

export const ingestMetaMessage = mutation({
  args: {
    source: v.string(), // "messenger" | "instagram"
    senderId: v.string(), // PSID or IGSID
    messageId: v.string(), // Meta message ID for deduplication
    content: v.string(),
    timestamp: v.number(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
    // Sender profile info from Meta API
    senderFirstName: v.optional(v.string()),
    senderLastName: v.optional(v.string()),
    senderProfilePic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { source, senderId, messageId, content, timestamp, attachments, senderFirstName, senderLastName, senderProfilePic } = args;

    // Check if message already exists (deduplication)
    const existingMessage = await ctx.db
      .query("messages")
      .withIndex("by_metaMessageId", (q) => q.eq("metaMessageId", messageId))
      .first();

    if (existingMessage) {
      console.log(`[Convex] Message ${messageId} already exists, skipping`);
      return existingMessage._id;
    }

    // Find existing conversation by metaSenderId
    let conversation = await ctx.db
      .query("conversations")
      .withIndex("by_metaSenderId", (q) => q.eq("metaSenderId", senderId))
      .first();

    const now = Date.now();

    // If no conversation exists, create one with a new contact
    if (!conversation) {
      // Check if contact exists with this meta ID
      let contact;
      if (source === "messenger") {
        contact = await ctx.db
          .query("contacts")
          .withIndex("by_metaPsid", (q) => q.eq("metaPsid", senderId))
          .first();
      } else {
        contact = await ctx.db
          .query("contacts")
          .withIndex("by_metaIgsid", (q) => q.eq("metaIgsid", senderId))
          .first();
      }

      // Create contact if doesn't exist
      if (!contact) {
        const contactData: {
          firstName: string;
          lastName: string;
          source: string;
          avatar?: string;
          metaPsid?: string;
          metaIgsid?: string;
          createdAt: number;
          updatedAt: number;
        } = {
          // Use profile name if available, otherwise fallback to generic
          firstName: senderFirstName || (source === "messenger" ? "Messenger" : "Instagram"),
          lastName: senderLastName || `User ${senderId.slice(-4)}`,
          source: source === "messenger" ? "Facebook Messenger" : "Instagram DM",
          createdAt: now,
          updatedAt: now,
        };

        // Add profile picture if available
        if (senderProfilePic) {
          contactData.avatar = senderProfilePic;
        }

        if (source === "messenger") {
          contactData.metaPsid = senderId;
        } else {
          contactData.metaIgsid = senderId;
        }

        const contactId = await ctx.db.insert("contacts", contactData);
        contact = await ctx.db.get(contactId);
      } else {
        // Update existing contact with profile info if we have new data
        const updates: { firstName?: string; lastName?: string; avatar?: string; updatedAt: number } = { updatedAt: now };
        let shouldUpdate = false;

        // Update name if contact has generic name and we now have real name
        if (senderFirstName && (contact.firstName === "Messenger" || contact.firstName === "Instagram")) {
          updates.firstName = senderFirstName;
          shouldUpdate = true;
        }
        if (senderLastName && contact.lastName.startsWith("User ")) {
          updates.lastName = senderLastName;
          shouldUpdate = true;
        }
        if (senderProfilePic && !contact.avatar) {
          updates.avatar = senderProfilePic;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await ctx.db.patch(contact._id, updates);
          contact = await ctx.db.get(contact._id);
        }
      }

      // Create conversation
      const conversationId = await ctx.db.insert("conversations", {
        contactId: contact!._id,
        source,
        unreadCount: 1,
        lastMessageAt: timestamp,
        metaSenderId: senderId,
        createdAt: now,
        updatedAt: now,
      });

      conversation = await ctx.db.get(conversationId);
    }

    // Create the message
    const msgId = await ctx.db.insert("messages", {
      conversationId: conversation!._id,
      content,
      timestamp,
      isOutgoing: false,
      read: false,
      attachments,
      metaMessageId: messageId,
    });

    // Update conversation
    await ctx.db.patch(conversation!._id, {
      lastMessageAt: timestamp,
      unreadCount: (conversation!.unreadCount || 0) + 1,
      updatedAt: now,
    });

    return msgId;
  },
});

// Send message and optionally send via Meta API
export const sendMessageWithMeta = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const now = Date.now();

    // Create message in database
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      timestamp: now,
      isOutgoing: true,
      read: true,
      attachments: args.attachments,
    });

    // Update conversation
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      updatedAt: now,
    });

    // Return info needed to send via Meta API
    return {
      messageId,
      metaSenderId: conversation.metaSenderId,
      source: conversation.source,
    };
  },
});

// Update contact with profile info from Meta
export const updateContactFromMeta = mutation({
  args: {
    contactId: v.id("contacts"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contactId, ...updates } = args;
    const contact = await ctx.db.get(contactId);
    if (!contact) throw new Error("Contact not found");

    const cleanUpdates: Record<string, string> = {};
    if (updates.firstName) cleanUpdates.firstName = updates.firstName;
    if (updates.lastName) cleanUpdates.lastName = updates.lastName;
    if (updates.avatar) cleanUpdates.avatar = updates.avatar;

    if (Object.keys(cleanUpdates).length > 0) {
      await ctx.db.patch(contactId, {
        ...cleanUpdates,
        updatedAt: Date.now(),
      });
    }

    return contactId;
  },
});
