import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("workshops")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    if (args.type) {
      const type = args.type;
      return await ctx.db
        .query("workshops")
        .withIndex("by_type", (q) => q.eq("type", type))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("workshops").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const workshops = await ctx.db
      .query("workshops")
      .withIndex("by_date")
      .collect();

    return workshops
      .filter((w) => w.date >= now && w.status !== "Cancelled")
      .sort((a, b) => a.date - b.date)
      .slice(0, args.limit ?? 10);
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const workshops = await ctx.db
      .query("workshops")
      .withIndex("by_date")
      .collect();

    return workshops.filter(
      (w) => w.date >= args.startDate && w.date <= args.endDate
    );
  },
});

export const getWithRegistrations = query({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const workshop = await ctx.db.get(args.id);
    if (!workshop) return null;

    const registrations = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.id))
      .collect();

    // Fetch contacts for each registration
    const registrationsWithContacts = await Promise.all(
      registrations.map(async (reg) => {
        const contact = await ctx.db.get(reg.contactId);
        return { ...reg, contact };
      })
    );

    return { ...workshop, registrations: registrationsWithContacts };
  },
});

// Get workshop with all related data (tasks, registrations, documents)
export const getWithDetails = query({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const workshop = await ctx.db.get(args.id);
    if (!workshop) return null;

    // Get registrations with contacts
    const registrations = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.id))
      .collect();

    const registrationsWithContacts = await Promise.all(
      registrations.map(async (reg) => {
        const contact = await ctx.db.get(reg.contactId);
        return { ...reg, contact };
      })
    );

    // Get tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.id))
      .collect();

    // Get documents with URLs
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.id))
      .collect();

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl };
      })
    );

    return {
      ...workshop,
      registrations: registrationsWithContacts,
      tasks,
      documents: documentsWithUrls,
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    date: v.number(),
    time: v.string(),
    status: v.string(),
    maxCapacity: v.number(),
    currentCapacity: v.optional(v.number()),
    type: v.optional(v.string()),
    fileIds: v.optional(v.array(v.id("documents"))),
    ghlEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Build formatted location string from address parts
    let location = args.location;
    if (!location && args.streetAddress) {
      const parts = [
        args.streetAddress,
        args.streetAddress2,
        args.city,
        args.state,
        args.postalCode,
      ].filter(Boolean);
      location = parts.join(", ");
    }

    const workshopId = await ctx.db.insert("workshops", {
      ...args,
      location,
      currentCapacity: args.currentCapacity ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-generate workshop tasks
    const workshopTasks = [
      { title: "Workshop Task 1", daysFromNow: 2 },
      { title: "Workshop Task 2", daysFromNow: 7 },
      { title: "Workshop Task 3", daysFromNow: 3 },
    ];

    await Promise.all(
      workshopTasks.map((task) =>
        ctx.db.insert("tasks", {
          workshopId,
          title: task.title,
          dueDate: now + task.daysFromNow * DAY_MS,
          status: "Pending",
          completed: false,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return workshopId;
  },
});

export const update = mutation({
  args: {
    id: v.id("workshops"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    date: v.optional(v.number()),
    time: v.optional(v.string()),
    status: v.optional(v.string()),
    maxCapacity: v.optional(v.number()),
    type: v.optional(v.string()),
    fileIds: v.optional(v.array(v.id("documents"))),
    ghlEventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Workshop not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("workshops"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Workshop not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const cancel = mutation({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Workshop not found");

    await ctx.db.patch(args.id, {
      status: "Cancelled",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const complete = mutation({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Workshop not found");

    await ctx.db.patch(args.id, {
      status: "Completed",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("workshops") },
  handler: async (ctx, args) => {
    // Delete all registrations first
    const registrations = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.id))
      .collect();

    await Promise.all(registrations.map((r) => ctx.db.delete(r._id)));

    // Delete workshop
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// ==========================================
// REGISTRATION FUNCTIONS
// ==========================================

export const register = mutation({
  args: {
    workshopId: v.id("workshops"),
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workshop = await ctx.db.get(args.workshopId);
    if (!workshop) throw new Error("Workshop not found");

    // Check capacity
    if (workshop.currentCapacity >= workshop.maxCapacity) {
      throw new Error("Workshop is at full capacity");
    }

    // Check for existing registration
    const existingRegs = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.workshopId))
      .collect();

    const alreadyRegistered = existingRegs.some(
      (r) => r.contactId === args.contactId
    );

    if (alreadyRegistered) {
      throw new Error("Contact is already registered for this workshop");
    }

    // Create registration
    const registrationId = await ctx.db.insert("workshopRegistrations", {
      workshopId: args.workshopId,
      contactId: args.contactId,
      opportunityId: args.opportunityId,
      status: "registered",
      notes: args.notes,
      registeredAt: Date.now(),
    });

    // Update workshop capacity
    await ctx.db.patch(args.workshopId, {
      currentCapacity: workshop.currentCapacity + 1,
      updatedAt: Date.now(),
    });

    // Update status to Full if at capacity
    if (workshop.currentCapacity + 1 >= workshop.maxCapacity) {
      await ctx.db.patch(args.workshopId, {
        status: "Full",
      });
    }

    return registrationId;
  },
});

export const markAttended = mutation({
  args: { registrationId: v.id("workshopRegistrations") },
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found");

    await ctx.db.patch(args.registrationId, {
      status: "attended",
      attendedAt: Date.now(),
    });
    return args.registrationId;
  },
});

export const markNoShow = mutation({
  args: { registrationId: v.id("workshopRegistrations") },
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found");

    await ctx.db.patch(args.registrationId, {
      status: "no-show",
    });
    return args.registrationId;
  },
});

export const cancelRegistration = mutation({
  args: { registrationId: v.id("workshopRegistrations") },
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found");

    const workshop = await ctx.db.get(registration.workshopId);
    if (!workshop) throw new Error("Workshop not found");

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "cancelled",
    });

    // Update workshop capacity
    await ctx.db.patch(registration.workshopId, {
      currentCapacity: Math.max(0, workshop.currentCapacity - 1),
      updatedAt: Date.now(),
    });

    // Update status if was full
    if (workshop.status === "Full") {
      await ctx.db.patch(registration.workshopId, {
        status: "Open",
      });
    }

    return args.registrationId;
  },
});

export const getRegistrationsByContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("workshopRegistrations")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();

    // Fetch workshops for each registration
    const registrationsWithWorkshops = await Promise.all(
      registrations.map(async (reg) => {
        const workshop = await ctx.db.get(reg.workshopId);
        return { ...reg, workshop };
      })
    );

    return registrationsWithWorkshops;
  },
});
