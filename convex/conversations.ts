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
