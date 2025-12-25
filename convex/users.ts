import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("User not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Seed default staff members
export const seedDefaultUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if users already exist
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      return { message: "Users already exist" };
    }

    const defaultStaff = [
      { name: "Jacqui Calma", email: "jacqui@shlf.com", role: "staff" },
      { name: "Andy Baker", email: "andy@shlf.com", role: "attorney" },
      { name: "Gabriella Ang", email: "gabriella@shlf.com", role: "paralegal" },
      { name: "Mar Wie Ang", email: "marwie@shlf.com", role: "admin" },
    ];

    const now = Date.now();
    await Promise.all(
      defaultStaff.map((user) =>
        ctx.db.insert("users", {
          ...user,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { message: "Default users seeded successfully" };
  },
});
