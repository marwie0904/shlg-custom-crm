import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Relationship types available for related contacts
export const RELATIONSHIP_TYPES = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Attorney",
  "Trustee",
  "Beneficiary",
  "POA",
  "Caregiver",
  "Financial Advisor",
  "Other",
] as const;

// ==========================================
// QUERIES
// ==========================================

// Get all related contacts for an opportunity
export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    const relatedContacts = await ctx.db
      .query("opportunityContacts")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();

    // Fetch full contact details for each related contact
    const contactsWithDetails = await Promise.all(
      relatedContacts.map(async (rc) => {
        const contact = await ctx.db.get(rc.contactId);
        return {
          ...rc,
          contact,
        };
      })
    );

    return contactsWithDetails;
  },
});

// Search contacts by name, email, or phone
export const searchContacts = query({
  args: {
    query: v.string(),
    excludeContactIds: v.optional(v.array(v.id("contacts"))),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.trim().length < 2) {
      return [];
    }

    const searchLower = args.query.toLowerCase().trim();
    const excludeSet = new Set(args.excludeContactIds?.map(id => id.toString()) || []);

    // Get all contacts and filter
    const allContacts = await ctx.db.query("contacts").collect();

    const results = allContacts.filter((contact) => {
      // Exclude specified contacts
      if (excludeSet.has(contact._id.toString())) {
        return false;
      }

      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const phone = contact.phone?.replace(/\D/g, "") || "";
      const searchPhone = args.query.replace(/\D/g, "");

      return (
        fullName.includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        (searchPhone && phone.includes(searchPhone))
      );
    });

    // Limit results to prevent overwhelming the UI
    return results.slice(0, 20);
  },
});

// ==========================================
// MUTATIONS
// ==========================================

// Add a related contact to an opportunity
export const add = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    contactId: v.id("contacts"),
    relationship: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if opportunity exists
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");

    // Check if contact exists
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    // Check if relationship already exists
    const existing = await ctx.db
      .query("opportunityContacts")
      .withIndex("by_opportunityId_contactId", (q) =>
        q.eq("opportunityId", args.opportunityId).eq("contactId", args.contactId)
      )
      .first();

    if (existing) {
      throw new Error("This contact is already linked to this opportunity");
    }

    // Create the relationship
    const id = await ctx.db.insert("opportunityContacts", {
      opportunityId: args.opportunityId,
      contactId: args.contactId,
      relationship: args.relationship,
      notes: args.notes,
      createdAt: Date.now(),
    });

    return id;
  },
});

// Update a related contact relationship
export const update = mutation({
  args: {
    id: v.id("opportunityContacts"),
    relationship: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Related contact not found");

    await ctx.db.patch(id, updates);
    return id;
  },
});

// Remove a related contact from an opportunity
export const remove = mutation({
  args: { id: v.id("opportunityContacts") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Related contact not found");

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Add a new contact and link it to an opportunity
export const createAndLink = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    // Contact fields
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    // Relationship
    relationship: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if opportunity exists
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity) throw new Error("Opportunity not found");

    // Create the new contact (skip opportunity creation since this is a related contact)
    const contactId = await ctx.db.insert("contacts", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });

    // Link to the opportunity
    const relationshipId = await ctx.db.insert("opportunityContacts", {
      opportunityId: args.opportunityId,
      contactId: contactId,
      relationship: args.relationship,
      notes: args.notes,
      createdAt: now,
    });

    return { contactId, relationshipId };
  },
});
