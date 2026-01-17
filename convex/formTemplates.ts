import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Element validator for form elements
const elementValidator = v.object({
  id: v.string(),
  type: v.string(),
  label: v.optional(v.string()),
  placeholder: v.optional(v.string()),
  content: v.optional(v.string()),
  required: v.optional(v.boolean()),
  options: v.optional(v.array(v.string())),
  width: v.optional(v.string()),
  order: v.number(),
  columnCount: v.optional(v.number()),
  children: v.optional(v.array(v.string())),
  parentId: v.optional(v.string()),
  columnIndex: v.optional(v.number()),
  minLength: v.optional(v.number()),
  maxLength: v.optional(v.number()),
  pattern: v.optional(v.string()),
  size: v.optional(v.string()),
  alignment: v.optional(v.string()),
});

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.status) {
      return await ctx.db
        .query("formTemplates")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    if (args.isPublic !== undefined) {
      return await ctx.db
        .query("formTemplates")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", args.isPublic!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("formTemplates").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("formTemplates")
      .withIndex("by_publicSlug", (q) => q.eq("publicSlug", args.slug))
      .collect();
    return templates[0] ?? null;
  },
});

export const getActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formTemplates")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("formTemplates")
      .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(args.limit ?? 50);

    // Only return active public templates
    return templates.filter((t) => t.status === "active");
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db.query("formTemplates").order("desc").take(200);
    const query = args.query.toLowerCase();

    return templates
      .filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.description && t.description.toLowerCase().includes(query))
      )
      .slice(0, args.limit ?? 20);
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    elements: v.array(elementValidator),
    isPublic: v.optional(v.boolean()),
    publicSlug: v.optional(v.string()),
    submitButtonText: v.optional(v.string()),
    confirmationMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    notifyOnSubmission: v.optional(v.boolean()),
    notificationEmails: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    createdByUserId: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generate a slug if making public and no slug provided
    let slug = args.publicSlug;
    if (args.isPublic && !slug) {
      slug = args.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check if slug already exists and make unique if needed
      const existing = await ctx.db
        .query("formTemplates")
        .withIndex("by_publicSlug", (q) => q.eq("publicSlug", slug))
        .first();

      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    return await ctx.db.insert("formTemplates", {
      title: args.title,
      description: args.description,
      elements: args.elements,
      isPublic: args.isPublic ?? false,
      publicSlug: slug,
      submitButtonText: args.submitButtonText ?? "Submit",
      confirmationMessage: args.confirmationMessage,
      redirectUrl: args.redirectUrl,
      notifyOnSubmission: args.notifyOnSubmission ?? true,
      notificationEmails: args.notificationEmails,
      status: args.status ?? "draft",
      submissionCount: 0,
      createdByUserId: args.createdByUserId,
      createdByName: args.createdByName,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("formTemplates"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    elements: v.optional(v.array(elementValidator)),
    isPublic: v.optional(v.boolean()),
    publicSlug: v.optional(v.string()),
    submitButtonText: v.optional(v.string()),
    confirmationMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    notifyOnSubmission: v.optional(v.boolean()),
    notificationEmails: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Form template not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateElements = mutation({
  args: {
    id: v.id("formTemplates"),
    elements: v.array(elementValidator),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    await ctx.db.patch(args.id, {
      elements: args.elements,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("formTemplates"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const togglePublic = mutation({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    const newIsPublic = !existing.isPublic;
    let slug = existing.publicSlug;

    // Generate slug if making public and no slug exists
    if (newIsPublic && !slug) {
      slug = existing.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existingWithSlug = await ctx.db
        .query("formTemplates")
        .withIndex("by_publicSlug", (q) => q.eq("publicSlug", slug))
        .first();

      if (existingWithSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await ctx.db.patch(args.id, {
      isPublic: newIsPublic,
      publicSlug: slug,
      updatedAt: Date.now(),
    });

    return { id: args.id, isPublic: newIsPublic, publicSlug: slug };
  },
});

export const duplicate = mutation({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    const now = Date.now();
    return await ctx.db.insert("formTemplates", {
      title: `${existing.title} (Copy)`,
      description: existing.description,
      elements: existing.elements,
      isPublic: false,
      submitButtonText: existing.submitButtonText,
      confirmationMessage: existing.confirmationMessage,
      redirectUrl: existing.redirectUrl,
      notifyOnSubmission: existing.notifyOnSubmission,
      notificationEmails: existing.notificationEmails,
      status: "draft",
      submissionCount: 0,
      createdByUserId: existing.createdByUserId,
      createdByName: existing.createdByName,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const archive = mutation({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    await ctx.db.patch(args.id, {
      status: "archived",
      isPublic: false,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    // Check for existing submissions
    const submissions = await ctx.db
      .query("formSubmissions")
      .withIndex("by_formTemplateId", (q) => q.eq("formTemplateId", args.id))
      .first();

    if (submissions) {
      throw new Error(
        "Cannot delete form template with existing submissions. Archive it instead."
      );
    }

    // Delete any assignments
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_formTemplateId", (q) => q.eq("formTemplateId", args.id))
      .collect();

    await Promise.all(assignments.map((a) => ctx.db.delete(a._id)));

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Increment submission count (called when a form is submitted)
export const incrementSubmissionCount = mutation({
  args: { id: v.id("formTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form template not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      submissionCount: (existing.submissionCount ?? 0) + 1,
      lastSubmissionAt: now,
      updatedAt: now,
    });
    return args.id;
  },
});
