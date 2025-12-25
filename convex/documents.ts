import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
  },
});

export const getByIntakeId = query({
  args: { intakeId: v.id("intake") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_intakeId", (q) => q.eq("intakeId", args.intakeId))
      .collect();
  },
});

// Get documents with download URLs
export const getByIntakeIdWithUrls = query({
  args: { intakeId: v.id("intake") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_intakeId", (q) => q.eq("intakeId", args.intakeId))
      .collect();

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl: url };
      })
    );

    return documentsWithUrls;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    intakeId: v.optional(v.id("intake")),
    name: v.string(),
    type: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    storageId: v.id("_storage"),
    category: v.optional(v.string()),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      uploadedAt: Date.now(),
    });
  },
});

// Create document for intake form
export const createForIntake = mutation({
  args: {
    intakeId: v.id("intake"),
    name: v.string(),
    type: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      category: "intake_document",
      uploadedAt: Date.now(),
    });
  },
});

// Create document for workshop
export const createForWorkshop = mutation({
  args: {
    workshopId: v.id("workshops"),
    name: v.string(),
    type: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      category: "workshop_document",
      uploadedAt: Date.now(),
    });
  },
});

// Create document for invoice
export const createForInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    name: v.string(),
    type: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    storageId: v.id("_storage"),
    uploadedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("documents", {
      ...args,
      category: "invoice_document",
      uploadedAt: Date.now(),
    });
  },
});

// Get documents by workshop ID
export const getByWorkshopId = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.workshopId))
      .collect();
  },
});

// Get documents by workshop ID with download URLs
export const getByWorkshopIdWithUrls = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.workshopId))
      .collect();

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl: url };
      })
    );

    return documentsWithUrls;
  },
});

// Get document by invoice ID
export const getByInvoiceId = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .first();
  },
});

// Get document by invoice ID with download URL
export const getByInvoiceIdWithUrl = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("documents")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .first();

    if (!document) return null;

    const url = await ctx.storage.getUrl(document.storageId);
    return { ...document, downloadUrl: url };
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    name: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Document not found");

    await ctx.db.patch(id, updates);
    return id;
  },
});

// Link document to contact after intake submission
export const linkToContact = mutation({
  args: {
    id: v.id("documents"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Document not found");

    await ctx.db.patch(args.id, { contactId: args.contactId });
    return args.id;
  },
});

// Link document to opportunity
export const linkToOpportunity = mutation({
  args: {
    id: v.id("documents"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Document not found");

    await ctx.db.patch(args.id, { opportunityId: args.opportunityId });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) throw new Error("Document not found");

    // Delete from storage
    await ctx.storage.delete(document.storageId);

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get download URL for a stored file
export const getDownloadUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
