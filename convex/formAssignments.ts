import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to generate a random access token
function generateAccessToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    formTemplateId: v.optional(v.id("formTemplates")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.contactId) {
      return await ctx.db
        .query("formAssignments")
        .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId!))
        .order("desc")
        .take(limit);
    }

    if (args.formTemplateId) {
      return await ctx.db
        .query("formAssignments")
        .withIndex("by_formTemplateId", (q) =>
          q.eq("formTemplateId", args.formTemplateId!)
        )
        .order("desc")
        .take(limit);
    }

    if (args.status) {
      return await ctx.db
        .query("formAssignments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("formAssignments").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByAccessToken = query({
  args: { accessToken: v.string() },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_accessToken", (q) => q.eq("accessToken", args.accessToken))
      .collect();
    return assignments[0] ?? null;
  },
});

export const getWithRelated = query({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) return null;

    const template = await ctx.db.get(assignment.formTemplateId);
    const contact = await ctx.db.get(assignment.contactId);
    const opportunity = assignment.opportunityId
      ? await ctx.db.get(assignment.opportunityId)
      : null;
    const submission = assignment.submissionId
      ? await ctx.db.get(assignment.submissionId)
      : null;

    return { ...assignment, template, contact, opportunity, submission };
  },
});

export const getPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formAssignments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPendingWithRelated = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      assignments.map(async (assignment) => {
        const template = await ctx.db.get(assignment.formTemplateId);
        const contact = await ctx.db.get(assignment.contactId);
        const opportunity = assignment.opportunityId
          ? await ctx.db.get(assignment.opportunityId)
          : null;

        return {
          ...assignment,
          templateTitle: template?.title ?? "Unknown Template",
          contactName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : "Unknown Contact",
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );
  },
});

export const getSubmittedWithRelated = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_status", (q) => q.eq("status", "submitted"))
      .order("desc")
      .take(args.limit ?? 50);

    return await Promise.all(
      assignments.map(async (assignment) => {
        const template = await ctx.db.get(assignment.formTemplateId);
        const contact = await ctx.db.get(assignment.contactId);
        const opportunity = assignment.opportunityId
          ? await ctx.db.get(assignment.opportunityId)
          : null;

        return {
          ...assignment,
          templateTitle: template?.title ?? "Unknown Template",
          contactName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : "Unknown Contact",
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );
  },
});

export const getByContactWithRelated = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .collect();

    return await Promise.all(
      assignments.map(async (assignment) => {
        const template = await ctx.db.get(assignment.formTemplateId);
        return {
          ...assignment,
          templateTitle: template?.title ?? "Unknown Template",
        };
      })
    );
  },
});

export const getOverdue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const assignments = await ctx.db
      .query("formAssignments")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return assignments
      .filter((a) => a.dueDate && a.dueDate < now)
      .slice(0, args.limit ?? 50);
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    formTemplateId: v.id("formTemplates"),
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),
    assignedByUserId: v.optional(v.id("users")),
    assignedByName: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const accessToken = generateAccessToken();

    return await ctx.db.insert("formAssignments", {
      formTemplateId: args.formTemplateId,
      contactId: args.contactId,
      opportunityId: args.opportunityId,
      assignedByUserId: args.assignedByUserId,
      assignedByName: args.assignedByName,
      dueDate: args.dueDate,
      accessToken,
      status: "pending",
      reminderCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("formAssignments"),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Form assignment not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const markSubmitted = mutation({
  args: {
    id: v.id("formAssignments"),
    submissionId: v.id("formSubmissions"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form assignment not found");

    await ctx.db.patch(args.id, {
      status: "submitted",
      submissionId: args.submissionId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const markExpired = mutation({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form assignment not found");

    await ctx.db.patch(args.id, {
      status: "expired",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const cancel = mutation({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form assignment not found");

    await ctx.db.patch(args.id, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const recordReminderSent = mutation({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form assignment not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      lastReminderSentAt: now,
      reminderCount: (existing.reminderCount ?? 0) + 1,
      updatedAt: now,
    });
    return args.id;
  },
});

export const regenerateAccessToken = mutation({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form assignment not found");

    const newToken = generateAccessToken();
    await ctx.db.patch(args.id, {
      accessToken: newToken,
      updatedAt: Date.now(),
    });
    return { id: args.id, accessToken: newToken };
  },
});

export const remove = mutation({
  args: { id: v.id("formAssignments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
