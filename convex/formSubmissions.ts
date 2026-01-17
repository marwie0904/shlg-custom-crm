import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    formTemplateId: v.optional(v.id("formTemplates")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.formTemplateId) {
      return await ctx.db
        .query("formSubmissions")
        .withIndex("by_formTemplateId", (q) =>
          q.eq("formTemplateId", args.formTemplateId!)
        )
        .order("desc")
        .take(limit);
    }

    if (args.status) {
      return await ctx.db
        .query("formSubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("formSubmissions").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getWithTemplate = query({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) return null;

    const template = await ctx.db.get(submission.formTemplateId);
    const contact = submission.contactId
      ? await ctx.db.get(submission.contactId)
      : null;
    const opportunity = submission.opportunityId
      ? await ctx.db.get(submission.opportunityId)
      : null;

    return { ...submission, template, contact, opportunity };
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formSubmissions")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formSubmissions")
      .withIndex("by_opportunityId", (q) =>
        q.eq("opportunityId", args.opportunityId)
      )
      .order("desc")
      .collect();
  },
});

export const getPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("formSubmissions")
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const listWithRelated = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let submissions;
    if (args.status) {
      submissions = await ctx.db
        .query("formSubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      submissions = await ctx.db
        .query("formSubmissions")
        .order("desc")
        .take(limit);
    }

    // Enrich with related data
    return await Promise.all(
      submissions.map(async (submission) => {
        const template = await ctx.db.get(submission.formTemplateId);
        const contact = submission.contactId
          ? await ctx.db.get(submission.contactId)
          : null;
        const opportunity = submission.opportunityId
          ? await ctx.db.get(submission.opportunityId)
          : null;

        return {
          ...submission,
          templateTitle: template?.title ?? "Unknown Template",
          contactName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : submission.submitterName ?? null,
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    formTemplateId: v.id("formTemplates"),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    data: v.any(),
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),
    submitterIp: v.optional(v.string()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const submissionId = await ctx.db.insert("formSubmissions", {
      formTemplateId: args.formTemplateId,
      contactId: args.contactId,
      opportunityId: args.opportunityId,
      data: args.data ?? {},
      submitterEmail: args.submitterEmail,
      submitterName: args.submitterName,
      submitterPhone: args.submitterPhone,
      submitterIp: args.submitterIp,
      status: "pending",
      dueDate: args.dueDate,
      submittedAt: now,
      updatedAt: now,
    });

    // Increment the submission count on the template
    const template = await ctx.db.get(args.formTemplateId);
    if (template) {
      await ctx.db.patch(args.formTemplateId, {
        submissionCount: (template.submissionCount ?? 0) + 1,
        lastSubmissionAt: now,
        updatedAt: now,
      });
    }

    return submissionId;
  },
});

export const update = mutation({
  args: {
    id: v.id("formSubmissions"),
    data: v.optional(v.any()),
    status: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("formSubmissions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const markReviewed = mutation({
  args: {
    id: v.id("formSubmissions"),
    reviewedByUserId: v.optional(v.id("users")),
    reviewedByName: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "reviewed",
      reviewedByUserId: args.reviewedByUserId,
      reviewedByName: args.reviewedByName,
      reviewedAt: now,
      reviewNotes: args.reviewNotes,
      updatedAt: now,
    });
    return args.id;
  },
});

export const markProcessed = mutation({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(args.id, {
      status: "processed",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const archive = mutation({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToContact = mutation({
  args: {
    id: v.id("formSubmissions"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(args.id, {
      contactId: args.contactId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToOpportunity = mutation({
  args: {
    id: v.id("formSubmissions"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Form submission not found");

    await ctx.db.patch(args.id, {
      opportunityId: args.opportunityId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
