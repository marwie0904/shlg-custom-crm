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

// ==========================================
// LEAD MANAGEMENT
// ==========================================

// List pending leads (intakes that haven't been accepted or ignored)
export const listPendingLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all intakes and filter for pending (undefined or "pending")
    const intakes = await ctx.db
      .query("intake")
      .order("desc")
      .take(limit * 3); // Fetch more to account for filtering

    // Filter for pending leads (leadStatus is undefined or "pending", excluding duplicates)
    const pendingIntakes = intakes
      .filter((i) => (!i.leadStatus || i.leadStatus === "pending") && i.leadStatus !== "duplicate")
      .slice(0, limit);

    return pendingIntakes;
  },
});

// List ignored leads
export const listIgnoredLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const intakes = await ctx.db
      .query("intake")
      .order("desc")
      .take(limit * 3);

    const ignoredIntakes = intakes
      .filter((i) => i.leadStatus === "ignored")
      .slice(0, limit);

    return ignoredIntakes;
  },
});

// Accept a lead - creates contact and opportunity
export const acceptLead = mutation({
  args: {
    id: v.id("intake"),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    const now = Date.now();

    // Create contact from intake data
    const contactId = await ctx.db.insert("contacts", {
      firstName: intake.firstName,
      lastName: intake.lastName,
      middleName: intake.middleName,
      email: intake.email,
      phone: intake.phone,
      streetAddress: intake.streetAddress,
      streetAddress2: intake.streetAddress2,
      city: intake.city,
      state: intake.state,
      zipCode: intake.zipCode,
      country: intake.country,
      source: "Intake Form",
      tags: intake.practiceArea ? [intake.practiceArea] : [],
      notes: intake.callDetails,
      intakeId: args.id,
      createdAt: now,
      updatedAt: now,
    });

    // Get pipeline stages for Main Lead Flow
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
      .collect();

    const sortedStages = stages.sort((a, b) => a.order - b.order);
    const firstStage = sortedStages[0];

    if (!firstStage) {
      throw new Error("No pipeline stages found. Please seed default stages first.");
    }

    // Count existing opportunities for numbering
    const allOpportunities = await ctx.db.query("opportunities").collect();
    const opportunityNumber = allOpportunities.length + 1;

    // Create opportunity
    const contactFullName = `${intake.firstName} ${intake.lastName}`.trim();
    const title = `${opportunityNumber} - ${contactFullName}`;

    const opportunityId = await ctx.db.insert("opportunities", {
      title,
      contactId,
      pipelineId: "Main Lead Flow",
      stageId: firstStage._id.toString(),
      estimatedValue: 0,
      practiceArea: intake.practiceArea,
      source: "Intake Form",
      notes: intake.callDetails,
      leadStatus: "accepted",
      createdAt: now,
      updatedAt: now,
    });

    // Link appointment to contact and opportunity if exists
    if (intake.appointmentId) {
      await ctx.db.patch(intake.appointmentId, {
        contactId,
        opportunityId,
        updatedAt: now,
      });
    }

    // Update intake with links and status
    await ctx.db.patch(args.id, {
      leadStatus: "accepted",
      contactId,
      opportunityId,
      updatedAt: now,
    });

    return {
      intakeId: args.id,
      contactId,
      opportunityId,
    };
  },
});

// Ignore a lead
export const ignoreLead = mutation({
  args: {
    id: v.id("intake"),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    await ctx.db.patch(args.id, {
      leadStatus: "ignored",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Restore an ignored lead back to pending
export const restoreLead = mutation({
  args: {
    id: v.id("intake"),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    await ctx.db.patch(args.id, {
      leadStatus: "pending",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ==========================================
// DUPLICATE LEADS MANAGEMENT
// ==========================================

// List duplicate leads
export const listDuplicateLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get duplicate intakes
    const intakes = await ctx.db
      .query("intake")
      .withIndex("by_leadStatus", (q) => q.eq("leadStatus", "duplicate"))
      .order("desc")
      .take(limit);

    // Fetch duplicate contact data for each intake
    const intakesWithDetails = await Promise.all(
      intakes.map(async (intake) => {
        let duplicateContact = null;
        let duplicateOpportunity = null;

        if (intake.duplicateOfContactId) {
          duplicateContact = await ctx.db.get(intake.duplicateOfContactId);

          // Get the most recent opportunity for the duplicate contact
          if (duplicateContact) {
            const duplicateOpp = await ctx.db
              .query("opportunities")
              .withIndex("by_contactId", (q) => q.eq("contactId", intake.duplicateOfContactId!))
              .order("desc")
              .first();
            duplicateOpportunity = duplicateOpp;
          }
        }

        return {
          ...intake,
          duplicateContact: duplicateContact
            ? {
                _id: duplicateContact._id,
                firstName: duplicateContact.firstName,
                lastName: duplicateContact.lastName,
                email: duplicateContact.email,
                phone: duplicateContact.phone,
              }
            : null,
          duplicateOpportunity: duplicateOpportunity
            ? {
                _id: duplicateOpportunity._id,
                title: duplicateOpportunity.title,
                stageId: duplicateOpportunity.stageId,
                practiceArea: duplicateOpportunity.practiceArea,
                createdAt: duplicateOpportunity.createdAt,
              }
            : null,
        };
      })
    );

    return intakesWithDetails;
  },
});

// Remove a duplicate lead (delete intake)
export const removeDuplicateLead = mutation({
  args: {
    id: v.id("intake"),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Update email of a duplicate lead
export const updateDuplicateEmail = mutation({
  args: {
    id: v.id("intake"),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    const now = Date.now();

    // Update the intake's email
    await ctx.db.patch(args.id, {
      email: args.newEmail,
      updatedAt: now,
    });

    // Re-check for duplicates with the new email
    let hasDuplicate = false;
    let matchType: "email" | "phone" | "both" | undefined = undefined;
    let duplicateContactId = null;

    // Check if new email matches an existing contact
    const emailMatch = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.newEmail))
      .first();

    if (emailMatch) {
      hasDuplicate = true;
      matchType = "email";
      duplicateContactId = emailMatch._id;

      // Also check phone
      if (intake.phone) {
        const phoneMatch = await ctx.db
          .query("contacts")
          .withIndex("by_phone", (q) => q.eq("phone", intake.phone))
          .first();
        if (phoneMatch && phoneMatch._id === emailMatch._id) {
          matchType = "both";
        }
      }
    }

    if (hasDuplicate && duplicateContactId) {
      // Still a duplicate with new email
      await ctx.db.patch(args.id, {
        duplicateOfContactId: duplicateContactId,
        duplicateMatchType: matchType,
        updatedAt: now,
      });
    } else {
      // No longer a duplicate - move to pending
      await ctx.db.patch(args.id, {
        leadStatus: "pending",
        duplicateOfContactId: undefined,
        duplicateMatchType: undefined,
        updatedAt: now,
      });
    }

    return { success: true, stillDuplicate: hasDuplicate };
  },
});

// Update phone of a duplicate lead
export const updateDuplicatePhone = mutation({
  args: {
    id: v.id("intake"),
    newPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    const now = Date.now();

    // Update the intake's phone
    await ctx.db.patch(args.id, {
      phone: args.newPhone,
      updatedAt: now,
    });

    // Re-check for duplicates with the new phone
    let hasDuplicate = false;
    let matchType: "email" | "phone" | "both" | undefined = undefined;
    let duplicateContactId = null;

    // Check if new phone matches an existing contact
    const phoneMatch = await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phone", args.newPhone))
      .first();

    if (phoneMatch) {
      hasDuplicate = true;
      matchType = "phone";
      duplicateContactId = phoneMatch._id;

      // Also check email
      if (intake.email) {
        const emailMatch = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", intake.email))
          .first();
        if (emailMatch && emailMatch._id === phoneMatch._id) {
          matchType = "both";
        }
      }
    }

    if (hasDuplicate && duplicateContactId) {
      // Still a duplicate with new phone
      await ctx.db.patch(args.id, {
        duplicateOfContactId: duplicateContactId,
        duplicateMatchType: matchType,
        updatedAt: now,
      });
    } else {
      // No longer a duplicate - move to pending
      await ctx.db.patch(args.id, {
        leadStatus: "pending",
        duplicateOfContactId: undefined,
        duplicateMatchType: undefined,
        updatedAt: now,
      });
    }

    return { success: true, stillDuplicate: hasDuplicate };
  },
});

// Create as new lead - removes duplicate status
export const createAsNewLead = mutation({
  args: {
    id: v.id("intake"),
  },
  handler: async (ctx, args) => {
    const intake = await ctx.db.get(args.id);
    if (!intake) throw new Error("Intake not found");

    const now = Date.now();

    // Clear duplicate fields and set to pending
    await ctx.db.patch(args.id, {
      leadStatus: "pending",
      duplicateOfContactId: undefined,
      duplicateMatchType: undefined,
      updatedAt: now,
    });

    return { success: true, intakeId: args.id };
  },
});

// Scan and detect duplicates for all pending intakes
export const scanForDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all pending intakes
    const pendingIntakes = await ctx.db
      .query("intake")
      .order("desc")
      .take(500);

    const filteredIntakes = pendingIntakes.filter(
      (i) => !i.leadStatus || i.leadStatus === "pending"
    );

    let duplicatesFound = 0;

    for (const intake of filteredIntakes) {
      let matchingContact = null;
      let matchType: "email" | "phone" | "both" | undefined = undefined;
      let emailMatch = false;
      let phoneMatch = false;

      // Check by email
      if (intake.email) {
        const emailContact = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", intake.email))
          .first();
        if (emailContact) {
          matchingContact = emailContact;
          emailMatch = true;
        }
      }

      // Check by phone
      if (intake.phone) {
        const phoneContact = await ctx.db
          .query("contacts")
          .withIndex("by_phone", (q) => q.eq("phone", intake.phone))
          .first();
        if (phoneContact) {
          if (matchingContact && matchingContact._id === phoneContact._id) {
            phoneMatch = true;
          } else if (!matchingContact) {
            matchingContact = phoneContact;
            phoneMatch = true;
          }
        }
      }

      if (matchingContact) {
        if (emailMatch && phoneMatch) {
          matchType = "both";
        } else if (emailMatch) {
          matchType = "email";
        } else if (phoneMatch) {
          matchType = "phone";
        }

        // Mark as duplicate
        await ctx.db.patch(intake._id, {
          leadStatus: "duplicate",
          duplicateOfContactId: matchingContact._id,
          duplicateMatchType: matchType,
          updatedAt: now,
        });

        duplicatesFound++;
      }
    }

    return { success: true, duplicatesFound };
  },
});
