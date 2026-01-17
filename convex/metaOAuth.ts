import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

/**
 * Get the current active Meta connection (if any)
 */
export const getActiveConnection = query({
  args: {},
  handler: async (ctx) => {
    const connection = await ctx.db
      .query("metaConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (!connection) {
      return null;
    }

    // Get all pages for this connection
    const pages = await ctx.db
      .query("metaPages")
      .withIndex("by_connectionId", (q) => q.eq("connectionId", connection._id))
      .collect();

    return {
      ...connection,
      pages,
    };
  },
});

/**
 * Get all Meta connections (for admin view)
 */
export const getAllConnections = query({
  args: {},
  handler: async (ctx) => {
    const connections = await ctx.db.query("metaConnections").collect();

    const connectionsWithPages = await Promise.all(
      connections.map(async (connection) => {
        const pages = await ctx.db
          .query("metaPages")
          .withIndex("by_connectionId", (q) =>
            q.eq("connectionId", connection._id)
          )
          .collect();
        return { ...connection, pages };
      })
    );

    return connectionsWithPages;
  },
});

/**
 * Get a specific page by ID
 */
export const getPageById = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("metaPages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .first();
  },
});

/**
 * Get the active page for a specific platform
 */
export const getActivePage = query({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    // First get active connection
    const connection = await ctx.db
      .query("metaConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .first();

    if (!connection) {
      return null;
    }

    // Get active page for the platform
    const pages = await ctx.db
      .query("metaPages")
      .withIndex("by_connectionId", (q) => q.eq("connectionId", connection._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("platform"), args.platform),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();

    return pages;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

/**
 * Create a new Meta connection after OAuth callback
 */
export const createConnection = mutation({
  args: {
    userId: v.id("users"),
    userName: v.string(),
    userAccessToken: v.string(),
    userAccessTokenExpiresAt: v.optional(v.number()),
    facebookUserId: v.string(),
    facebookUserName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Deactivate any existing connections
    const existingConnections = await ctx.db
      .query("metaConnections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const conn of existingConnections) {
      await ctx.db.patch(conn._id, { status: "replaced", updatedAt: now });
    }

    // Create new connection
    const connectionId = await ctx.db.insert("metaConnections", {
      connectedByUserId: args.userId,
      connectedByName: args.userName,
      userAccessToken: args.userAccessToken,
      userAccessTokenExpiresAt: args.userAccessTokenExpiresAt,
      facebookUserId: args.facebookUserId,
      facebookUserName: args.facebookUserName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return connectionId;
  },
});

/**
 * Add a page to a Meta connection
 */
export const addPage = mutation({
  args: {
    connectionId: v.id("metaConnections"),
    pageId: v.string(),
    pageName: v.string(),
    pageAccessToken: v.string(),
    platform: v.string(),
    instagramBusinessAccountId: v.optional(v.string()),
    instagramUsername: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if page already exists
    const existingPage = await ctx.db
      .query("metaPages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .first();

    if (existingPage) {
      // Update existing page
      await ctx.db.patch(existingPage._id, {
        connectionId: args.connectionId,
        pageName: args.pageName,
        pageAccessToken: args.pageAccessToken,
        platform: args.platform,
        instagramBusinessAccountId: args.instagramBusinessAccountId,
        instagramUsername: args.instagramUsername,
        isActive: args.isActive,
        updatedAt: now,
      });
      return existingPage._id;
    }

    // Create new page
    const pageDbId = await ctx.db.insert("metaPages", {
      connectionId: args.connectionId,
      pageId: args.pageId,
      pageName: args.pageName,
      pageAccessToken: args.pageAccessToken,
      platform: args.platform,
      instagramBusinessAccountId: args.instagramBusinessAccountId,
      instagramUsername: args.instagramUsername,
      webhookSubscribed: false,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });

    return pageDbId;
  },
});

/**
 * Update page webhook subscription status
 */
export const updatePageWebhookStatus = mutation({
  args: {
    pageId: v.string(),
    webhookSubscribed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("metaPages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .first();

    if (!page) {
      throw new Error(`Page not found: ${args.pageId}`);
    }

    await ctx.db.patch(page._id, {
      webhookSubscribed: args.webhookSubscribed,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Set a page as active/inactive
 */
export const setPageActive = mutation({
  args: {
    pageId: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("metaPages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .first();

    if (!page) {
      throw new Error(`Page not found: ${args.pageId}`);
    }

    await ctx.db.patch(page._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Disconnect (revoke) a Meta connection
 */
export const disconnectConnection = mutation({
  args: {
    connectionId: v.id("metaConnections"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    const now = Date.now();

    // Deactivate all pages
    const pages = await ctx.db
      .query("metaPages")
      .withIndex("by_connectionId", (q) => q.eq("connectionId", args.connectionId))
      .collect();

    for (const page of pages) {
      await ctx.db.patch(page._id, { isActive: false, updatedAt: now });
    }

    // Mark connection as revoked
    await ctx.db.patch(args.connectionId, {
      status: "revoked",
      updatedAt: now,
    });
  },
});

/**
 * Update connection status (for token refresh or expiry)
 */
export const updateConnectionStatus = mutation({
  args: {
    connectionId: v.id("metaConnections"),
    status: v.string(),
    userAccessToken: v.optional(v.string()),
    userAccessTokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.userAccessToken) {
      updates.userAccessToken = args.userAccessToken;
    }
    if (args.userAccessTokenExpiresAt) {
      updates.userAccessTokenExpiresAt = args.userAccessTokenExpiresAt;
    }

    await ctx.db.patch(args.connectionId, updates);
  },
});

/**
 * Get page access token by page ID (for internal use by metaService)
 */
export const getPageAccessToken = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("metaPages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .first();

    if (!page || !page.isActive) {
      return null;
    }

    return {
      pageAccessToken: page.pageAccessToken,
      pageId: page.pageId,
      platform: page.platform,
    };
  },
});
