import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    includeIgnored: v.optional(v.boolean()), // Set to true to include ignored contacts
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let contacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(limit * 2); // Fetch more to account for filtering

    // Filter out ignored contacts unless explicitly requested
    if (!args.includeIgnored) {
      contacts = contacts.filter((c) => c.leadStatus !== "ignored");
    }

    return contacts.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
  },
});

export const getByGhlContactId = query({
  args: { ghlContactId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_ghlContactId", (q) => q.eq("ghlContactId", args.ghlContactId))
      .first();
  },
});

export const getByIntakeId = query({
  args: { intakeId: v.id("intake") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_intakeId", (q) => q.eq("intakeId", args.intakeId))
      .first();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const searchLower = args.query.toLowerCase();
    const allContacts = await ctx.db.query("contacts").collect();

    return allContacts.filter((contact) => {
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(args.query)
      );
    });
  },
});

// List contacts with their primary opportunity info (for contacts table)
export const listWithOpportunities = query({
  args: {
    limit: v.optional(v.number()),
    searchQuery: v.optional(v.string()),
    includeIgnored: v.optional(v.boolean()), // Set to true to include ignored contacts
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let contacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(limit * 2); // Fetch more to account for filtering

    // Filter out ignored contacts unless explicitly requested
    if (!args.includeIgnored) {
      contacts = contacts.filter((c) => c.leadStatus !== "ignored");
    }

    // Trim to requested limit (before search filter, so search has enough results)
    contacts = contacts.slice(0, limit);

    // Filter by search query if provided
    if (args.searchQuery) {
      const searchLower = args.searchQuery.toLowerCase();
      contacts = contacts.filter((contact) => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.phone?.includes(args.searchQuery!)
        );
      });
    }

    // Get all opportunities and pipeline stages for the contacts
    const opportunities = await ctx.db.query("opportunities").collect();
    const stages = await ctx.db.query("pipelineStages").collect();

    // Create a map of stages by ID
    const stageMap = new Map(stages.map((s) => [s._id.toString(), s]));

    // Create a map of all contacts for relationship lookup
    const allContacts = await ctx.db.query("contacts").collect();
    const contactMap = new Map(allContacts.map((c) => [c._id.toString(), c]));

    // Enrich contacts with opportunity info and relationship data
    return contacts.map((contact) => {
      // Find the first/primary opportunity for this contact
      const contactOpportunities = opportunities.filter(
        (o) => o.contactId === contact._id
      );
      const primaryOpportunity = contactOpportunities[0];

      let opportunityTitle = null;
      let opportunityStage = null;

      if (primaryOpportunity) {
        opportunityTitle = primaryOpportunity.title;
        const stage = stageMap.get(primaryOpportunity.stageId);
        opportunityStage = stage?.name ?? null;
      }

      // Get primary contact name if this is a sub-contact
      let primaryContactName = null;
      if (contact.primaryContactId) {
        const primaryContact = contactMap.get(contact.primaryContactId.toString());
        if (primaryContact) {
          primaryContactName = `${primaryContact.firstName} ${primaryContact.lastName}`;
        }
      }

      // Get sub-contacts if this is a primary contact
      const subContacts = allContacts
        .filter((c) => c.primaryContactId?.toString() === contact._id.toString())
        .map((c) => ({
          _id: c._id,
          firstName: c.firstName,
          lastName: c.lastName,
          relationshipType: c.relationshipType,
        }));

      return {
        ...contact,
        opportunityTitle,
        opportunityStage,
        primaryContactName,
        subContacts,
      };
    });
  },
});

// Get contact with all related data
export const getWithRelated = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) return null;

    const [opportunities, appointments, invoices, tasks, documents, conversations] = await Promise.all([
      ctx.db.query("opportunities").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db.query("appointments").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db.query("invoices").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db.query("tasks").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db.query("documents").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
      ctx.db.query("conversations").withIndex("by_contactId", (q) => q.eq("contactId", args.id)).collect(),
    ]);

    // Get download URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl };
      })
    );

    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
          .order("desc")
          .take(50); // Last 50 messages per conversation
        return {
          ...conv,
          messages: messages.reverse(), // Return in chronological order
        };
      })
    );

    // Get primary contact if this is a sub-contact
    let primaryContact = null;
    if (contact.primaryContactId) {
      const primary = await ctx.db.get(contact.primaryContactId);
      if (primary) {
        primaryContact = {
          _id: primary._id,
          firstName: primary.firstName,
          lastName: primary.lastName,
          email: primary.email,
          phone: primary.phone,
        };
      }
    }

    // Get related contacts (sub-contacts linked to this contact)
    const relatedContacts = await ctx.db
      .query("contacts")
      .withIndex("by_primaryContactId", (q) => q.eq("primaryContactId", args.id))
      .collect();

    const relatedContactsFormatted = relatedContacts.map((c) => ({
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      relationshipType: c.relationshipType,
    }));

    return {
      ...contact,
      opportunities,
      appointments,
      invoices,
      tasks,
      documents: documentsWithUrls,
      conversations: conversationsWithMessages,
      primaryContact,
      relatedContacts: relatedContactsFormatted,
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    // Basic Information
    prefix: v.optional(v.string()),
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()),
    email: v.optional(v.string()),
    secondaryEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    secondaryPhone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    avatar: v.optional(v.string()),
    // Source & Tags
    source: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralOther: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Contact Preferences
    preferredContactMethod: v.optional(v.string()),
    doNotContact: v.optional(v.boolean()),
    lastContactedAt: v.optional(v.number()),
    // General Notes
    notes: v.optional(v.string()),
    // Address
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    // Spouse Information
    spouseFirstName: v.optional(v.string()),
    spouseLastName: v.optional(v.string()),
    spouseEmail: v.optional(v.string()),
    spousePhone: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    planningTogether: v.optional(v.string()),
    // Florida Residency
    floridaResident: v.optional(v.string()),
    // Children
    hasChildren: v.optional(v.string()),
    numberOfChildren: v.optional(v.string()),
    childrenAges: v.optional(v.string()),
    // Existing Documents
    hasExistingDocs: v.optional(v.string()),
    existingDocuments: v.optional(v.string()),
    isTrustFunded: v.optional(v.string()),
    // Beneficiary Section
    beneficiary_name: v.optional(v.string()),
    beneficiary_dateOfBirth: v.optional(v.string()),
    beneficiary_occupation: v.optional(v.string()),
    beneficiary_phone: v.optional(v.string()),
    beneficiary_sex: v.optional(v.string()),
    beneficiary_relationship: v.optional(v.string()),
    beneficiary_specialNeeds: v.optional(v.string()),
    beneficiary_potentialProblems: v.optional(v.string()),
    beneficiary_address: v.optional(v.string()),
    beneficiary_city: v.optional(v.string()),
    beneficiary_state: v.optional(v.string()),
    beneficiary_zipCode: v.optional(v.string()),
    beneficiary_spouseName: v.optional(v.string()),
    beneficiary_relationshipStatus: v.optional(v.string()),
    beneficiary_howManyChildren: v.optional(v.string()),
    beneficiary_agesOfChildren: v.optional(v.string()),
    // Finances Section
    finances_name: v.optional(v.string()),
    finances_representative: v.optional(v.string()),
    finances_accountType: v.optional(v.string()),
    finances_currentOwners: v.optional(v.string()),
    finances_approxValue: v.optional(v.string()),
    // DLM Section
    dlm_statement: v.optional(v.string()),
    dlm_webinarTitle: v.optional(v.string()),
    dlm_eventTitle: v.optional(v.string()),
    dlm_eventVenue: v.optional(v.string()),
    dlm_guestName: v.optional(v.string()),
    // Instagram DM Fields
    instagram_howDidYouHear: v.optional(v.string()),
    instagram_message: v.optional(v.string()),
    instagram_preferredOffice: v.optional(v.string()),
    instagram_workshopSelection: v.optional(v.string()),
    // Medicaid Intake Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),
    // Estate Planning Intake Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),
    // PBTA Intake Fields
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
    // Deed Intake Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),
    // Doc Review Intake Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),
    // Call Details
    callTranscript: v.optional(v.string()),
    callSummary: v.optional(v.string()),
    // GHL Integration
    ghlContactId: v.optional(v.string()),
    // Intake Reference
    intakeId: v.optional(v.id("intake")),
    // Option to skip opportunity creation
    skipOpportunityCreation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { skipOpportunityCreation, ...contactData } = args;

    // Create the contact
    const contactId = await ctx.db.insert("contacts", {
      ...contactData,
      createdAt: now,
      updatedAt: now,
    });

    // Create an opportunity for the new contact (unless explicitly skipped)
    if (!skipOpportunityCreation) {
      const contactName = `${args.firstName} ${args.lastName}`.trim();

      // Get the Fresh Leads stage ID
      const freshLeadsStage = await ctx.db
        .query("pipelineStages")
        .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
        .filter((q) => q.eq(q.field("name"), "Fresh Leads"))
        .first();

      if (freshLeadsStage) {
        await ctx.db.insert("opportunities", {
          title: contactName,
          contactId: contactId,
          pipelineId: "Main Lead Flow",
          stageId: freshLeadsStage._id.toString(), // Convert to string to match schema
          estimatedValue: 0,
          source: args.source, // Sync source from contact
          tags: args.tags, // Sync tags from contact
          createdAt: now,
          updatedAt: now,
        });
      } else {
        console.error("[Convex] Fresh Leads stage not found - opportunity not created for contact:", contactId);
      }
    }

    return contactId;
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    // Basic Information
    prefix: v.optional(v.string()),
    firstName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    suffix: v.optional(v.string()),
    email: v.optional(v.string()),
    secondaryEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    secondaryPhone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    avatar: v.optional(v.string()),
    // Source & Tags
    source: v.optional(v.string()),
    referralSource: v.optional(v.string()),
    referralOther: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Contact Preferences
    preferredContactMethod: v.optional(v.string()),
    doNotContact: v.optional(v.boolean()),
    lastContactedAt: v.optional(v.number()),
    // General Notes
    notes: v.optional(v.string()),
    // Address
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),
    // Spouse Information
    spouseFirstName: v.optional(v.string()),
    spouseLastName: v.optional(v.string()),
    spouseEmail: v.optional(v.string()),
    spousePhone: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    planningTogether: v.optional(v.string()),
    // Florida Residency
    floridaResident: v.optional(v.string()),
    // Children
    hasChildren: v.optional(v.string()),
    numberOfChildren: v.optional(v.string()),
    childrenAges: v.optional(v.string()),
    // Existing Documents
    hasExistingDocs: v.optional(v.string()),
    existingDocuments: v.optional(v.string()),
    isTrustFunded: v.optional(v.string()),
    // Beneficiary Section
    beneficiary_name: v.optional(v.string()),
    beneficiary_dateOfBirth: v.optional(v.string()),
    beneficiary_occupation: v.optional(v.string()),
    beneficiary_phone: v.optional(v.string()),
    beneficiary_sex: v.optional(v.string()),
    beneficiary_relationship: v.optional(v.string()),
    beneficiary_specialNeeds: v.optional(v.string()),
    beneficiary_potentialProblems: v.optional(v.string()),
    beneficiary_address: v.optional(v.string()),
    beneficiary_city: v.optional(v.string()),
    beneficiary_state: v.optional(v.string()),
    beneficiary_zipCode: v.optional(v.string()),
    beneficiary_spouseName: v.optional(v.string()),
    beneficiary_relationshipStatus: v.optional(v.string()),
    beneficiary_howManyChildren: v.optional(v.string()),
    beneficiary_agesOfChildren: v.optional(v.string()),
    // Finances Section
    finances_name: v.optional(v.string()),
    finances_representative: v.optional(v.string()),
    finances_accountType: v.optional(v.string()),
    finances_currentOwners: v.optional(v.string()),
    finances_approxValue: v.optional(v.string()),
    // DLM Section
    dlm_statement: v.optional(v.string()),
    dlm_webinarTitle: v.optional(v.string()),
    dlm_eventTitle: v.optional(v.string()),
    dlm_eventVenue: v.optional(v.string()),
    dlm_guestName: v.optional(v.string()),
    // Instagram DM Fields
    instagram_howDidYouHear: v.optional(v.string()),
    instagram_message: v.optional(v.string()),
    instagram_preferredOffice: v.optional(v.string()),
    instagram_workshopSelection: v.optional(v.string()),
    // Medicaid Intake Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),
    // Estate Planning Intake Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),
    // PBTA Intake Fields
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
    // Deed Intake Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),
    // Doc Review Intake Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),
    // Call Details
    callTranscript: v.optional(v.string()),
    callSummary: v.optional(v.string()),
    // GHL Integration
    ghlContactId: v.optional(v.string()),
    // Intake Reference
    intakeId: v.optional(v.id("intake")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Contact not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const addTag = mutation({
  args: {
    id: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");

    const tags = contact.tags ?? [];
    if (!tags.includes(args.tag)) {
      await ctx.db.patch(args.id, {
        tags: [...tags, args.tag],
        updatedAt: Date.now(),
      });
    }
    return args.id;
  },
});

export const removeTag = mutation({
  args: {
    id: v.id("contacts"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new Error("Contact not found");

    const tags = contact.tags ?? [];
    await ctx.db.patch(args.id, {
      tags: tags.filter((t) => t !== args.tag),
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Migration: Create opportunities for contacts that don't have one
export const migrateContactsWithoutOpportunities = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all contacts
    const contacts = await ctx.db.query("contacts").collect();

    // Get all opportunities to check which contacts already have one
    const opportunities = await ctx.db.query("opportunities").collect();
    const contactsWithOpportunities = new Set(opportunities.map((o) => o.contactId.toString()));

    // Get the Fresh Leads stage
    const freshLeadsStage = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
      .filter((q) => q.eq(q.field("name"), "Fresh Leads"))
      .first();

    if (!freshLeadsStage) {
      return { error: "Fresh Leads stage not found. Please run pipelineStages.seedDefaultStages first." };
    }

    // Find contacts without opportunities
    const contactsWithoutOpportunities = contacts.filter(
      (c) => !contactsWithOpportunities.has(c._id.toString())
    );

    // Create opportunities for each
    let created = 0;
    for (const contact of contactsWithoutOpportunities) {
      const contactName = `${contact.firstName} ${contact.lastName}`.trim();
      await ctx.db.insert("opportunities", {
        title: contactName,
        contactId: contact._id,
        pipelineId: "Main Lead Flow",
        stageId: freshLeadsStage._id.toString(), // Convert to string to match schema
        estimatedValue: 0,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }

    return {
      message: `Created ${created} opportunities for contacts that didn't have one.`,
      totalContacts: contacts.length,
      contactsWithOpportunities: contactsWithOpportunities.size,
      contactsWithoutOpportunities: contactsWithoutOpportunities.length,
    };
  },
});
