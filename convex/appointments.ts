import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    staffId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("appointments")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    if (args.staffId) {
      const staffId = args.staffId;
      return await ctx.db
        .query("appointments")
        .withIndex("by_staffId", (q) => q.eq("staffId", staffId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("appointments").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
  },
});

export const getByIntakeId = query({
  args: { intakeId: v.id("intake") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_intakeId", (q) => q.eq("intakeId", args.intakeId))
      .collect();
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date")
      .collect();

    return appointments.filter(
      (apt) => apt.date >= args.startDate && apt.date <= args.endDate
    );
  },
});

export const getUpcoming = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_date")
      .collect();

    return appointments
      .filter((apt) => apt.date >= now && apt.status !== "Cancelled")
      .sort((a, b) => a.date - b.date)
      .slice(0, args.limit ?? 10);
  },
});

export const getWithContact = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const appointment = await ctx.db.get(args.id);
    if (!appointment) return null;

    const contact = appointment.contactId
      ? await ctx.db.get(appointment.contactId)
      : null;

    const opportunity = appointment.opportunityId
      ? await ctx.db.get(appointment.opportunityId)
      : null;

    return { ...appointment, contact, opportunity };
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
    title: v.string(),
    type: v.string(),
    practiceArea: v.optional(v.string()),
    date: v.number(),
    time: v.string(),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    staffId: v.optional(v.string()),
    staffName: v.optional(v.string()),
    // Participant info
    participantFirstName: v.optional(v.string()),
    participantLastName: v.optional(v.string()),
    participantEmail: v.optional(v.string()),
    participantPhone: v.optional(v.string()),
    // Calendar info
    calendarId: v.optional(v.string()),
    calendarName: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    ghlAppointmentId: v.optional(v.string()),
    ghlCalendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("appointments", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("appointments"),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    intakeId: v.optional(v.id("intake")),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    practiceArea: v.optional(v.string()),
    date: v.optional(v.number()),
    time: v.optional(v.string()),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    staffId: v.optional(v.string()),
    staffName: v.optional(v.string()),
    // Participant info
    participantFirstName: v.optional(v.string()),
    participantLastName: v.optional(v.string()),
    participantEmail: v.optional(v.string()),
    participantPhone: v.optional(v.string()),
    // Calendar info
    calendarId: v.optional(v.string()),
    calendarName: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    ghlAppointmentId: v.optional(v.string()),
    ghlCalendarId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("appointments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const cancel = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      status: "Cancelled",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const complete = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      status: "Completed",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const noShow = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      status: "No Show",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const linkToContact = mutation({
  args: {
    id: v.id("appointments"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      contactId: args.contactId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToOpportunity = mutation({
  args: {
    id: v.id("appointments"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");

    await ctx.db.patch(args.id, {
      opportunityId: args.opportunityId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});
