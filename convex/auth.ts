import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

// Get user by email for login
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// Get user by verification token
export const getUserByVerificationToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_verificationToken", (q) => q.eq("verificationToken", args.token))
      .first();
  },
});

// Validate session token
export const getSessionByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) return null;
    if (session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    return user ? { session, user } : null;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Update password hash after login/change
export const updatePasswordHash = mutation({
  args: {
    userId: v.id("users"),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      passwordHash: args.passwordHash,
      temporaryPassword: undefined, // Clear temp password
      mustChangePassword: false,
      updatedAt: Date.now(),
    });
    return args.userId;
  },
});

// Set verification token for email verification
export const setVerificationToken = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      verificationToken: args.token,
      verificationTokenExpiry: args.expiresAt,
      updatedAt: Date.now(),
    });
    return args.userId;
  },
});

// Verify email (called when user clicks verification link)
export const verifyEmail = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_verificationToken", (q) => q.eq("verificationToken", args.token))
      .first();

    if (!user) {
      throw new Error("Invalid verification token");
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < Date.now()) {
      throw new Error("Verification token has expired");
    }

    await ctx.db.patch(user._id, {
      emailVerified: true,
      status: "active",
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
      updatedAt: Date.now(),
    });

    return { success: true, userId: user._id };
  },
});

// Create session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Delete any existing sessions for this user
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(existingSessions.map((s) => ctx.db.delete(s._id)));

    // Create new session
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });

    // Update last login
    await ctx.db.patch(args.userId, {
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sessionId;
  },
});

// Delete session (logout)
export const deleteSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Delete all sessions for a user
export const deleteAllUserSessions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(sessions.map((s) => ctx.db.delete(s._id)));

    return { success: true, deletedCount: sessions.length };
  },
});

// Clean up expired sessions (can be called periodically)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    await Promise.all(expiredSessions.map((s) => ctx.db.delete(s._id)));

    return { success: true, deletedCount: expiredSessions.length };
  },
});
