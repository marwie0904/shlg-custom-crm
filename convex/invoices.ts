import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let invoices;
    if (args.status) {
      const status = args.status;
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    } else {
      invoices = await ctx.db.query("invoices").order("desc").take(limit);
    }

    // Fetch contacts and opportunities for each invoice
    const invoicesWithRelations = await Promise.all(
      invoices.map(async (inv) => {
        const contact = await ctx.db.get(inv.contactId);
        const opportunity = inv.opportunityId
          ? await ctx.db.get(inv.opportunityId)
          : null;
        return {
          ...inv,
          contact,
          opportunity,
          contactName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : "Unknown",
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );

    return invoicesWithRelations;
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByInvoiceNumber = query({
  args: { invoiceNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_invoiceNumber", (q) => q.eq("invoiceNumber", args.invoiceNumber))
      .first();
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
  },
});

export const getByConfidoInvoiceId = query({
  args: { confidoInvoiceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_confidoInvoiceId", (q) => q.eq("confidoInvoiceId", args.confidoInvoiceId))
      .first();
  },
});

export const getWithContact = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const contact = await ctx.db.get(invoice.contactId);
    const opportunity = invoice.opportunityId
      ? await ctx.db.get(invoice.opportunityId)
      : null;

    return { ...invoice, contact, opportunity };
  },
});

export const getOverdue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "Pending"))
      .collect();

    return invoices
      .filter((inv) => inv.dueDate && inv.dueDate < now)
      .slice(0, args.limit ?? 50);
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").collect();

    const summary = {
      total: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      byStatus: {
        draft: 0,
        sent: 0,
        pending: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
      } as Record<string, number>,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    };

    const now = Date.now();

    invoices.forEach((inv) => {
      const status = inv.status.toLowerCase();
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      if (status === "paid") {
        summary.paidAmount += inv.amount;
      } else if (status === "pending" || status === "sent") {
        if (inv.dueDate && inv.dueDate < now) {
          summary.overdueAmount += inv.amount;
        } else {
          summary.pendingAmount += inv.amount;
        }
      }
    });

    return summary;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),
    name: v.string(),
    invoiceNumber: v.string(),
    amount: v.number(),
    amountPaid: v.optional(v.number()),
    currency: v.optional(v.string()),
    issueDate: v.number(),
    dueDate: v.optional(v.number()),
    status: v.string(),
    paymentLink: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    lineItems: v.optional(v.array(v.object({
      productId: v.optional(v.id("products")),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    }))),
    notes: v.optional(v.string()),
    confidoInvoiceId: v.optional(v.string()),
    confidoClientId: v.optional(v.string()),
    confidoMatterId: v.optional(v.string()),
    ghlInvoiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("invoices", {
      ...args,
      currency: args.currency ?? "USD",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    amountPaid: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.string()),
    paymentLink: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    lineItems: v.optional(v.array(v.object({
      productId: v.optional(v.id("products")),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    }))),
    notes: v.optional(v.string()),
    confidoInvoiceId: v.optional(v.string()),
    confidoClientId: v.optional(v.string()),
    confidoMatterId: v.optional(v.string()),
    ghlInvoiceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Set paid date if marking as paid
    if (args.status === "Paid") {
      updates.paidDate = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("invoices"),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      status: "Paid",
      paidDate: Date.now(),
      paymentMethod: args.paymentMethod,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const send = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      status: "Sent",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const cancel = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      status: "Cancelled",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Update invoice with Confido payment link info (after Confido API call)
export const updateConfidoInfo = mutation({
  args: {
    id: v.id("invoices"),
    confidoInvoiceId: v.string(),
    confidoClientId: v.string(),
    confidoMatterId: v.string(),
    paymentLink: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      confidoInvoiceId: args.confidoInvoiceId,
      confidoClientId: args.confidoClientId,
      confidoMatterId: args.confidoMatterId,
      paymentLink: args.paymentLink,
      status: args.status ?? "Sent",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Update invoice payment status (from Confido webhook)
export const updatePaymentStatus = mutation({
  args: {
    confidoInvoiceId: v.string(),
    amountPaid: v.number(),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_confidoInvoiceId", (q) => q.eq("confidoInvoiceId", args.confidoInvoiceId))
      .first();

    if (!invoice) throw new Error("Invoice not found for Confido ID: " + args.confidoInvoiceId);

    const totalPaid = (invoice.amountPaid ?? 0) + args.amountPaid;
    const isPaidInFull = totalPaid >= invoice.amount;

    await ctx.db.patch(invoice._id, {
      amountPaid: totalPaid,
      status: isPaidInFull ? "Paid" : "Pending",
      paidDate: isPaidInFull ? Date.now() : undefined,
      paymentMethod: args.paymentMethod,
      updatedAt: Date.now(),
    });

    return invoice._id;
  },
});

// Update invoice document ID (link PDF document)
export const updateDocumentId = mutation({
  args: {
    id: v.id("invoices"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Invoice not found");

    await ctx.db.patch(args.id, {
      documentId: args.documentId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Generate next invoice number
export const getNextInvoiceNumber = query({
  args: { prefix: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const prefix = args.prefix ?? "INV";
    const year = new Date().getFullYear();

    const invoices = await ctx.db.query("invoices").collect();

    // Find the highest number for this year
    const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
    let maxNumber = 0;

    invoices.forEach((inv) => {
      const match = inv.invoiceNumber.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    return `${prefix}-${year}-${nextNumber}`;
  },
});
