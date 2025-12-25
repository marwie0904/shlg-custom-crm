import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    practiceArea: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.practiceArea) {
      const practiceArea = args.practiceArea;
      return await ctx.db
        .query("intake")
        .withIndex("by_practiceArea", (q) => q.eq("practiceArea", practiceArea))
        .order("desc")
        .take(limit);
    }

    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("intake")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("intake").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("intake") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("intake")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("intake")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
  },
});

export const getWithRelated = query({
  args: { id: v.id("intake") },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) return null;

    const [contact, opportunity] = await Promise.all([
      intake.contactId ? ctx.db.get(intake.contactId) : null,
      intake.opportunityId ? ctx.db.get(intake.opportunityId) : null,
    ]);

    return { ...intake, contact, opportunity };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    appointmentId: v.optional(v.id("appointments")),
    createPdf: v.optional(v.string()),
    practiceArea: v.string(),
    callDetails: v.optional(v.string()),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralOther: v.optional(v.string()),
    // Estate Planning Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_floridaResident: v.optional(v.string()),
    ep_maritalStatus: v.optional(v.string()),
    ep_spouseFirstName: v.optional(v.string()),
    ep_spouseLastName: v.optional(v.string()),
    ep_spouseEmail: v.optional(v.string()),
    ep_spousePhone: v.optional(v.string()),
    ep_spousePlanningTogether: v.optional(v.string()),
    ep_hasChildren: v.optional(v.string()),
    ep_hasExistingDocs: v.optional(v.string()),
    ep_documents: v.optional(v.string()),
    ep_isTrustFunded: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),
    // PBTA Fields
    pbta_beneficiaryDisagreements: v.optional(v.string()),
    pbta_assetOwnership: v.optional(v.string()),
    pbta_allAssetsOwnership: v.optional(v.string()),
    pbta_hasWill: v.optional(v.string()),
    pbta_accessToWill: v.optional(v.string()),
    pbta_assetsForProbate: v.optional(v.string()),
    pbta_decedentFirstName: v.optional(v.string()),
    pbta_decedentLastName: v.optional(v.string()),
    pbta_dateOfDeath: v.optional(v.string()),
    pbta_relationshipToDecedent: v.optional(v.string()),
    // Medicaid Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),
    // Deed Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),
    // Doc Review Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),
    // Appointment
    appointmentStaffId: v.optional(v.string()),
    appointmentStaffName: v.optional(v.string()),
    appointmentMeetingType: v.optional(v.string()),
    appointmentLocation: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    // Status
    status: v.optional(v.string()),
    missingFields: v.optional(v.array(v.string())),
    // GHL
    ghlContactId: v.optional(v.string()),
    ghlOpportunityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("intake", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("intake"),
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    appointmentId: v.optional(v.id("appointments")),
    createPdf: v.optional(v.string()),
    practiceArea: v.optional(v.string()),
    callDetails: v.optional(v.string()),
    firstName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralOther: v.optional(v.string()),
    // Estate Planning Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_floridaResident: v.optional(v.string()),
    ep_maritalStatus: v.optional(v.string()),
    ep_spouseFirstName: v.optional(v.string()),
    ep_spouseLastName: v.optional(v.string()),
    ep_spouseEmail: v.optional(v.string()),
    ep_spousePhone: v.optional(v.string()),
    ep_spousePlanningTogether: v.optional(v.string()),
    ep_hasChildren: v.optional(v.string()),
    ep_hasExistingDocs: v.optional(v.string()),
    ep_documents: v.optional(v.string()),
    ep_isTrustFunded: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),
    // PBTA Fields
    pbta_beneficiaryDisagreements: v.optional(v.string()),
    pbta_assetOwnership: v.optional(v.string()),
    pbta_allAssetsOwnership: v.optional(v.string()),
    pbta_hasWill: v.optional(v.string()),
    pbta_accessToWill: v.optional(v.string()),
    pbta_assetsForProbate: v.optional(v.string()),
    pbta_decedentFirstName: v.optional(v.string()),
    pbta_decedentLastName: v.optional(v.string()),
    pbta_dateOfDeath: v.optional(v.string()),
    pbta_relationshipToDecedent: v.optional(v.string()),
    // Medicaid Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),
    // Deed Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),
    // Doc Review Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),
    // Appointment
    appointmentStaffId: v.optional(v.string()),
    appointmentStaffName: v.optional(v.string()),
    appointmentMeetingType: v.optional(v.string()),
    appointmentLocation: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),
    // Status
    status: v.optional(v.string()),
    missingFields: v.optional(v.array(v.string())),
    // GHL
    ghlContactId: v.optional(v.string()),
    ghlOpportunityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Intake not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const linkToContact = mutation({
  args: {
    id: v.id("intake"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Intake not found");

    await ctx.db.patch(args.id, {
      contactId: args.contactId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToOpportunity = mutation({
  args: {
    id: v.id("intake"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Intake not found");

    await ctx.db.patch(args.id, {
      opportunityId: args.opportunityId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToAppointment = mutation({
  args: {
    id: v.id("intake"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Intake not found");

    await ctx.db.patch(args.id, {
      appointmentId: args.appointmentId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("intake") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
