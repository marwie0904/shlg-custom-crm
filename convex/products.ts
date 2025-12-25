import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    category: v.optional(v.string()),
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const activeOnly = args.activeOnly ?? true;

    let products;

    if (args.category) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .collect();
    } else if (activeOnly) {
      products = await ctx.db
        .query("products")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }

    // Filter by active if category was specified
    if (args.category && activeOnly) {
      products = products.filter((p) => p.isActive);
    }

    return products.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const categories = new Set<string>();

    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });

    return Array.from(categories).sort();
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      category: args.category,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Product not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Product not found");

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Seed some initial products (run once)
export const seedProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const existingProducts = await ctx.db.query("products").collect();
    if (existingProducts.length > 0) {
      return { message: "Products already exist, skipping seed" };
    }

    const now = Date.now();
    const products = [
      {
        name: "Initial Consultation",
        description: "Initial legal consultation (1 hour)",
        price: 500.0,
        category: "Consultation",
        isActive: true,
      },
      {
        name: "Estate Planning Package - Basic",
        description: "Basic estate planning including will and POA",
        price: 1500.0,
        category: "Estate Planning",
        isActive: true,
      },
      {
        name: "Estate Planning Package - Comprehensive",
        description: "Comprehensive estate planning with trust",
        price: 3500.0,
        category: "Estate Planning",
        isActive: true,
      },
      {
        name: "Trust Amendment",
        description: "Amendment to existing trust document",
        price: 750.0,
        category: "Estate Planning",
        isActive: true,
      },
      {
        name: "Probate Administration",
        description: "Full probate administration services",
        price: 5000.0,
        category: "Probate",
        isActive: true,
      },
      {
        name: "Deed Preparation",
        description: "Real estate deed preparation and recording",
        price: 350.0,
        category: "Real Estate",
        isActive: true,
      },
      {
        name: "Document Review",
        description: "Review of existing legal documents",
        price: 250.0,
        category: "Consultation",
        isActive: true,
      },
      {
        name: "Medicaid Planning Consultation",
        description: "Medicaid eligibility planning consultation",
        price: 750.0,
        category: "Medicaid",
        isActive: true,
      },
    ];

    const insertedIds = [];
    for (const product of products) {
      const id = await ctx.db.insert("products", {
        ...product,
        createdAt: now,
        updatedAt: now,
      });
      insertedIds.push(id);
    }

    return { message: `Seeded ${insertedIds.length} products`, ids: insertedIds };
  },
});
