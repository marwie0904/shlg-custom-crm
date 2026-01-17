import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Grace period in milliseconds (2 minutes)
const STAGE_CHANGE_GRACE_PERIOD_MS = 2 * 60 * 1000;

/**
 * Calculate due date based on task template configuration
 * @param dueDateValue - Duration value (e.g., 3)
 * @param dueDateUnit - Unit: "minutes", "hours", "days", "weeks"
 * @returns Timestamp for due date
 */
function calculateDueDate(dueDateValue: number, dueDateUnit: string): number {
  const now = Date.now();
  let milliseconds = 0;

  switch (dueDateUnit) {
    case "minutes":
      milliseconds = dueDateValue * 60 * 1000;
      break;
    case "hours":
      milliseconds = dueDateValue * 60 * 60 * 1000;
      break;
    case "days":
      milliseconds = dueDateValue * 24 * 60 * 60 * 1000;
      break;
    case "weeks":
      milliseconds = dueDateValue * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      milliseconds = dueDateValue * 24 * 60 * 60 * 1000; // Default to days
  }

  return now + milliseconds;
}

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    pipelineId: v.optional(v.string()),
    stageId: v.optional(v.string()),
    limit: v.optional(v.number()),
    includeIgnored: v.optional(v.boolean()), // Set to true to include ignored leads
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let opportunities;
    if (args.pipelineId) {
      const pipelineId = args.pipelineId;
      opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_pipeline", (q) => q.eq("pipelineId", pipelineId))
        .order("desc")
        .take(limit * 2); // Fetch more to account for filtering
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit * 2);
    }

    // Filter out ignored leads unless explicitly requested
    if (!args.includeIgnored) {
      opportunities = opportunities.filter((o) => o.leadStatus !== "ignored");
    }

    // Filter by stage if specified
    if (args.stageId) {
      opportunities = opportunities.filter((o) => o.stageId === args.stageId);
    }

    return opportunities.slice(0, limit);
  },
});

export const getById = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByGhlOpportunityId = query({
  args: { ghlOpportunityId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_ghlOpportunityId", (q) => q.eq("ghlOpportunityId", args.ghlOpportunityId))
      .first();
  },
});

// Get opportunity with contact and related data
export const getWithRelated = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) return null;

    const [contact, appointments, invoices, tasks, workshops, documents, relatedContactRecords, conversations] = await Promise.all([
      ctx.db.get(opportunity.contactId),
      ctx.db.query("appointments").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("invoices").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("tasks").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("workshopRegistrations").withIndex("by_contactId", (q) => q.eq("contactId", opportunity.contactId)).collect(),
      ctx.db.query("documents").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("opportunityContacts").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      // Fetch conversations for this contact
      ctx.db.query("conversations").withIndex("by_contactId", (q) => q.eq("contactId", opportunity.contactId)).collect(),
    ]);

    // Get download URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl };
      })
    );

    // Get full contact details for related contacts
    const relatedContacts = await Promise.all(
      relatedContactRecords.map(async (rc) => {
        const relatedContact = await ctx.db.get(rc.contactId);
        return {
          ...rc,
          contact: relatedContact,
        };
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

    return {
      ...opportunity,
      contact,
      appointments,
      invoices,
      tasks,
      workshops,
      documents: documentsWithUrls,
      relatedContacts,
      conversations: conversationsWithMessages,
    };
  },
});

// Get pipeline summary (counts and values by stage)
export const getPipelineSummary = query({
  args: { pipelineId: v.string() },
  handler: async (ctx, args) => {
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_pipeline", (q) => q.eq("pipelineId", args.pipelineId))
      .collect();

    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", args.pipelineId))
      .collect();

    const summary = stages.map((stage) => {
      const stageOpps = opportunities.filter((o) => o.stageId === stage._id.toString());
      return {
        stageId: stage._id,
        stageName: stage.name,
        order: stage.order,
        count: stageOpps.length,
        totalValue: stageOpps.reduce((sum, o) => sum + o.estimatedValue, 0),
      };
    });

    return {
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, o) => sum + o.estimatedValue, 0),
      stages: summary.sort((a, b) => a.order - b.order),
    };
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    title: v.string(),
    contactId: v.id("contacts"),
    pipelineId: v.string(),
    stageId: v.string(),
    estimatedValue: v.number(),
    practiceArea: v.optional(v.string()),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    responsibleAttorneyId: v.optional(v.id("users")),
    responsibleAttorneyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    calendarAppointmentDate: v.optional(v.number()),
    calendarAppointmentType: v.optional(v.string()),
    ghlOpportunityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("opportunities", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    pipelineId: v.optional(v.string()),
    stageId: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    practiceArea: v.optional(v.string()),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    responsibleAttorneyId: v.optional(v.id("users")),
    responsibleAttorneyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    calendarAppointmentDate: v.optional(v.number()),
    calendarAppointmentType: v.optional(v.string()),
    didNotHireAt: v.optional(v.number()),
    didNotHireReason: v.optional(v.string()),
    didNotHirePoint: v.optional(v.string()),
    ghlOpportunityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Opportunity not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const addTag = mutation({
  args: {
    id: v.id("opportunities"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) throw new Error("Opportunity not found");

    const tags = opportunity.tags ?? [];
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
    id: v.id("opportunities"),
    tag: v.string(),
  },
  handler: async (ctx, args) => {
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) throw new Error("Opportunity not found");

    const tags = opportunity.tags ?? [];
    await ctx.db.patch(args.id, {
      tags: tags.filter((t) => t !== args.tag),
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const moveToStage = mutation({
  args: {
    id: v.id("opportunities"),
    stageId: v.string(),
    skipTaskGeneration: v.optional(v.boolean()), // Option to skip task generation
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const previousStageId = existing.stageId;
    const now = Date.now();

    // Update the opportunity stage
    await ctx.db.patch(args.id, {
      stageId: args.stageId,
      updatedAt: now,
    });

    // Skip task generation if requested
    if (args.skipTaskGeneration) {
      return { opportunityId: args.id, tasksCreated: 0, tasksDeleted: 0 };
    }

    // Get the new stage info
    const allStages = await ctx.db.query("pipelineStages").collect();
    const newStage = allStages.find((s) => s._id.toString() === args.stageId);
    const previousStage = allStages.find((s) => s._id.toString() === previousStageId);

    if (!newStage) {
      return { opportunityId: args.id, tasksCreated: 0, tasksDeleted: 0 };
    }

    // ===== STEP 1: Grace Period - Delete tasks from recent stage changes =====
    const gracePeriodStart = now - STAGE_CHANGE_GRACE_PERIOD_MS;
    const recentStageChanges = await ctx.db
      .query("stageChanges")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id))
      .collect();

    // Filter to changes within grace period
    const recentChanges = recentStageChanges.filter(
      (change) => change.createdAt >= gracePeriodStart
    );

    let tasksDeleted = 0;
    if (recentChanges.length > 0) {
      // Delete tasks from previous stage changes within grace period
      for (const change of recentChanges) {
        for (const taskId of change.taskIds) {
          try {
            await ctx.db.delete(taskId);
            tasksDeleted++;
          } catch (e) {
            // Task may already be deleted, continue
          }
        }
        // Remove the old stage change record
        await ctx.db.delete(change._id);
      }
    }

    // ===== STEP 2: Get Task Templates for the New Stage =====
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_stageName", (q) => q.eq("stageName", newStage.name))
      .collect();

    // Filter to active templates matching pipeline (or no pipeline specified)
    const activeTemplates = templates
      .filter((t) => t.isActive)
      .filter((t) => !t.pipelineId || t.pipelineId === existing.pipelineId)
      .sort((a, b) => a.taskNumber - b.taskNumber);

    // ===== STEP 3: Create Tasks from Templates =====
    const createdTaskIds: Id<"tasks">[] = [];

    for (const template of activeTemplates) {
      const taskId = await ctx.db.insert("tasks", {
        contactId: existing.contactId,
        opportunityId: args.id,
        title: template.taskName,
        description: template.taskDescription,
        dueDate: calculateDueDate(template.dueDateValue, template.dueDateUnit),
        assignedTo: template.assigneeId,
        assignedToName: template.assigneeName,
        status: "Pending",
        completed: false,
        priority: template.priority || "Medium",
        createdAt: now,
        updatedAt: now,
      });
      createdTaskIds.push(taskId);
    }

    // ===== STEP 4: Record Stage Change =====
    await ctx.db.insert("stageChanges", {
      opportunityId: args.id,
      opportunityName: existing.title,
      previousStage: previousStage?.name,
      previousStageId: previousStageId,
      newStage: newStage.name,
      newStageId: args.stageId,
      taskIds: createdTaskIds,
      createdAt: now,
    });

    return {
      opportunityId: args.id,
      tasksCreated: createdTaskIds.length,
      tasksDeleted,
      gracePeriodApplied: tasksDeleted > 0,
      newStageName: newStage.name,
    };
  },
});

export const moveToPipeline = mutation({
  args: {
    id: v.id("opportunities"),
    pipelineId: v.string(),
    stageId: v.string(),
    didNotHirePoint: v.optional(v.string()), // Closure point: "pre_contact", "pre_intake", "pre_iv", "post_iv"
    skipTaskGeneration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const previousStageId = existing.stageId;
    const now = Date.now();

    // Get stage name for Did Not Hire reason
    const allStages = await ctx.db.query("pipelineStages").collect();
    const targetStage = allStages.find((s) => s._id.toString() === args.stageId);

    // Build update object
    const updateData: Record<string, unknown> = {
      pipelineId: args.pipelineId,
      stageId: args.stageId,
      updatedAt: now,
    };

    // If moving to "Did Not Hire" pipeline, set tracking fields
    if (args.pipelineId === "Did Not Hire") {
      updateData.didNotHireAt = now;
      updateData.didNotHireReason = targetStage?.name || args.stageId;
      if (args.didNotHirePoint) {
        updateData.didNotHirePoint = args.didNotHirePoint;
      }
    }

    // Update the opportunity
    await ctx.db.patch(args.id, updateData);

    // Skip task generation if requested
    if (args.skipTaskGeneration) {
      return { opportunityId: args.id, tasksCreated: 0, tasksDeleted: 0 };
    }

    // Get stage info (allStages already fetched above)
    const newStage = targetStage;
    const previousStage = allStages.find((s) => s._id.toString() === previousStageId);

    if (!newStage) {
      return { opportunityId: args.id, tasksCreated: 0, tasksDeleted: 0 };
    }

    // ===== STEP 1: Grace Period - Delete tasks from recent stage changes =====
    const gracePeriodStart = now - STAGE_CHANGE_GRACE_PERIOD_MS;
    const recentStageChanges = await ctx.db
      .query("stageChanges")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id))
      .collect();

    const recentChanges = recentStageChanges.filter(
      (change) => change.createdAt >= gracePeriodStart
    );

    let tasksDeleted = 0;
    if (recentChanges.length > 0) {
      for (const change of recentChanges) {
        for (const taskId of change.taskIds) {
          try {
            await ctx.db.delete(taskId);
            tasksDeleted++;
          } catch (e) {
            // Task may already be deleted
          }
        }
        await ctx.db.delete(change._id);
      }
    }

    // ===== STEP 2: Get Task Templates for the New Stage =====
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_stageName", (q) => q.eq("stageName", newStage.name))
      .collect();

    const activeTemplates = templates
      .filter((t) => t.isActive)
      .filter((t) => !t.pipelineId || t.pipelineId === args.pipelineId)
      .sort((a, b) => a.taskNumber - b.taskNumber);

    // ===== STEP 3: Create Tasks from Templates =====
    const createdTaskIds: Id<"tasks">[] = [];

    for (const template of activeTemplates) {
      const taskId = await ctx.db.insert("tasks", {
        contactId: existing.contactId,
        opportunityId: args.id,
        title: template.taskName,
        description: template.taskDescription,
        dueDate: calculateDueDate(template.dueDateValue, template.dueDateUnit),
        assignedTo: template.assigneeId,
        assignedToName: template.assigneeName,
        status: "Pending",
        completed: false,
        priority: template.priority || "Medium",
        createdAt: now,
        updatedAt: now,
      });
      createdTaskIds.push(taskId);
    }

    // ===== STEP 4: Record Stage Change =====
    await ctx.db.insert("stageChanges", {
      opportunityId: args.id,
      opportunityName: existing.title,
      previousStage: previousStage?.name,
      previousStageId: previousStageId,
      newStage: newStage.name,
      newStageId: args.stageId,
      taskIds: createdTaskIds,
      createdAt: now,
    });

    return {
      opportunityId: args.id,
      tasksCreated: createdTaskIds.length,
      tasksDeleted,
      gracePeriodApplied: tasksDeleted > 0,
      newStageName: newStage.name,
    };
  },
});

export const remove = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// List opportunities with all related data for Kanban board
export const listWithRelated = query({
  args: {
    pipelineId: v.optional(v.string()),
    limit: v.optional(v.number()),
    includeIgnored: v.optional(v.boolean()), // Set to true to include ignored leads
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    let opportunities;
    if (args.pipelineId) {
      const pipelineId = args.pipelineId;
      opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_pipeline", (q) => q.eq("pipelineId", pipelineId))
        .order("desc")
        .take(limit * 2); // Fetch more to account for filtering
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit * 2);
    }

    // Filter out ignored leads unless explicitly requested
    if (!args.includeIgnored) {
      opportunities = opportunities.filter((o) => o.leadStatus !== "ignored");
    }

    // Trim to requested limit
    opportunities = opportunities.slice(0, limit);

    // Fetch all related data for each opportunity
    const opportunitiesWithRelated = await Promise.all(
      opportunities.map(async (opp) => {
        const [contact, appointments, invoices, tasks, workshopRegistrations, documents] = await Promise.all([
          ctx.db.get(opp.contactId),
          ctx.db
            .query("appointments")
            .withIndex("by_opportunityId", (q) => q.eq("opportunityId", opp._id))
            .collect(),
          ctx.db
            .query("invoices")
            .withIndex("by_opportunityId", (q) => q.eq("opportunityId", opp._id))
            .collect(),
          ctx.db
            .query("tasks")
            .withIndex("by_opportunityId", (q) => q.eq("opportunityId", opp._id))
            .collect(),
          ctx.db
            .query("workshopRegistrations")
            .withIndex("by_contactId", (q) => q.eq("contactId", opp.contactId))
            .collect(),
          ctx.db
            .query("documents")
            .withIndex("by_opportunityId", (q) => q.eq("opportunityId", opp._id))
            .collect(),
        ]);

        // Fetch workshop details for each registration
        const workshops = await Promise.all(
          workshopRegistrations.map(async (reg) => {
            const workshop = await ctx.db.get(reg.workshopId);
            return workshop ? { ...workshop, registrationStatus: reg.status } : null;
          })
        );

        // Get download URLs for documents
        const documentsWithUrls = await Promise.all(
          documents.map(async (doc) => {
            const downloadUrl = await ctx.storage.getUrl(doc.storageId);
            return { ...doc, downloadUrl };
          })
        );

        return {
          ...opp,
          contact,
          appointments,
          invoices,
          tasks,
          workshops: workshops.filter((w) => w !== null),
          documents: documentsWithUrls,
        };
      })
    );

    return opportunitiesWithRelated;
  },
});

// Lightweight query for Kanban board - only fetches data needed for cards
export const listForKanban = query({
  args: {
    pipelineId: v.optional(v.string()),
    limit: v.optional(v.number()),
    includeIgnored: v.optional(v.boolean()), // Set to true to include ignored leads
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    let opportunities;
    if (args.pipelineId) {
      const pipelineId = args.pipelineId;
      opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_pipeline", (q) => q.eq("pipelineId", pipelineId))
        .order("desc")
        .take(limit * 2); // Fetch more to account for filtering
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit * 2);
    }

    // Filter out ignored leads unless explicitly requested
    if (!args.includeIgnored) {
      opportunities = opportunities.filter((o) => o.leadStatus !== "ignored");
    }

    // Trim to requested limit
    opportunities = opportunities.slice(0, limit);

    // Only fetch contact data - that's all we need for the card display
    const opportunitiesWithContact = await Promise.all(
      opportunities.map(async (opp) => {
        const contact = await ctx.db.get(opp.contactId);
        return {
          _id: opp._id,
          title: opp.title,
          contactId: opp.contactId,
          pipelineId: opp.pipelineId,
          stageId: opp.stageId,
          estimatedValue: opp.estimatedValue,
          practiceArea: opp.practiceArea,
          source: opp.source,
          responsibleAttorneyId: opp.responsibleAttorneyId,
          responsibleAttorneyName: opp.responsibleAttorneyName,
          calendarAppointmentDate: opp.calendarAppointmentDate,
          calendarAppointmentType: opp.calendarAppointmentType,
          didNotHireAt: opp.didNotHireAt,
          didNotHireReason: opp.didNotHireReason,
          didNotHirePoint: opp.didNotHirePoint,
          leadStatus: opp.leadStatus,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          contact: contact ? {
            _id: contact._id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            source: contact.source,
          } : null,
        };
      })
    );

    return opportunitiesWithContact;
  },
});

// Create opportunity from intake form submission
export const createFromIntake = mutation({
  args: {
    contactId: v.id("contacts"),
    contactFullName: v.string(),
    // Practice area & source
    practiceArea: v.optional(v.string()),
    source: v.optional(v.string()),
    // Optional appointment info
    appointmentDate: v.optional(v.number()),
    appointmentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Count existing opportunities to generate the next number
    const allOpportunities = await ctx.db.query("opportunities").collect();
    const opportunityNumber = allOpportunities.length + 1;

    // Get the first stage of "Main Lead Flow" pipeline
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
      .collect();

    // Sort by order and get the first stage
    const sortedStages = stages.sort((a, b) => a.order - b.order);
    const firstStage = sortedStages[0];

    if (!firstStage) {
      throw new Error("No pipeline stages found. Please seed default stages first.");
    }

    // Build the opportunity title: "[Number] - Contact Full Name"
    const title = `${opportunityNumber} - ${args.contactFullName}`;

    // Create the opportunity
    const opportunityId = await ctx.db.insert("opportunities", {
      title,
      contactId: args.contactId,
      pipelineId: "Main Lead Flow",
      stageId: firstStage._id.toString(),
      estimatedValue: 0,
      practiceArea: args.practiceArea,
      source: args.source,
      calendarAppointmentDate: args.appointmentDate,
      calendarAppointmentType: args.appointmentType,
      createdAt: now,
      updatedAt: now,
    });

    return opportunityId;
  },
});

// ==========================================
// LEADS PAGE QUERIES & MUTATIONS
// ==========================================

// List pending leads (opportunities with leadStatus pending or undefined)
export const listPendingLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all opportunities and filter for pending (undefined or "pending")
    const opportunities = await ctx.db
      .query("opportunities")
      .order("desc")
      .take(limit * 3); // Fetch more to account for filtering

    // Filter for pending leads (leadStatus is undefined or "pending", excluding duplicates)
    const pendingOpportunities = opportunities
      .filter((o) => (!o.leadStatus || o.leadStatus === "pending") && o.leadStatus !== "duplicate")
      .slice(0, limit);

    // Fetch contact data for each opportunity
    const opportunitiesWithContact = await Promise.all(
      pendingOpportunities.map(async (opp) => {
        const contact = await ctx.db.get(opp.contactId);
        return {
          _id: opp._id,
          title: opp.title,
          contactId: opp.contactId,
          pipelineId: opp.pipelineId,
          stageId: opp.stageId,
          estimatedValue: opp.estimatedValue,
          practiceArea: opp.practiceArea,
          source: opp.source,
          notes: opp.notes,
          leadStatus: opp.leadStatus,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          contact: contact
            ? {
                _id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                source: contact.source,
                notes: contact.notes,
              }
            : null,
        };
      })
    );

    return opportunitiesWithContact;
  },
});

// List ignored leads
export const listIgnoredLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get ignored opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_leadStatus", (q) => q.eq("leadStatus", "ignored"))
      .order("desc")
      .take(limit);

    // Fetch contact data for each opportunity
    const opportunitiesWithContact = await Promise.all(
      opportunities.map(async (opp) => {
        const contact = await ctx.db.get(opp.contactId);
        return {
          _id: opp._id,
          title: opp.title,
          contactId: opp.contactId,
          pipelineId: opp.pipelineId,
          stageId: opp.stageId,
          estimatedValue: opp.estimatedValue,
          practiceArea: opp.practiceArea,
          source: opp.source,
          notes: opp.notes,
          leadStatus: opp.leadStatus,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          contact: contact
            ? {
                _id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                source: contact.source,
                notes: contact.notes,
              }
            : null,
        };
      })
    );

    return opportunitiesWithContact;
  },
});

// Accept a lead - moves it to "Fresh Leads" stage and marks as accepted
export const acceptLead = mutation({
  args: {
    id: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Get the Fresh Leads stage
    const freshLeadsStage = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", "Main Lead Flow"))
      .filter((q) => q.eq(q.field("name"), "Fresh Leads"))
      .first();

    if (!freshLeadsStage) {
      throw new Error("Fresh Leads stage not found");
    }

    // Update opportunity - mark as accepted and move to Fresh Leads
    await ctx.db.patch(args.id, {
      leadStatus: "accepted",
      stageId: freshLeadsStage._id.toString(),
      pipelineId: "Main Lead Flow",
      updatedAt: now,
    });

    // Also update the contact's leadStatus
    await ctx.db.patch(existing.contactId, {
      leadStatus: "accepted",
      updatedAt: now,
    });

    return { success: true, opportunityId: args.id };
  },
});

// Ignore a lead - marks it as ignored (hidden from pipeline)
export const ignoreLead = mutation({
  args: {
    id: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Update opportunity - mark as ignored
    await ctx.db.patch(args.id, {
      leadStatus: "ignored",
      updatedAt: now,
    });

    // Also update the contact's leadStatus
    await ctx.db.patch(existing.contactId, {
      leadStatus: "ignored",
      updatedAt: now,
    });

    return { success: true, opportunityId: args.id };
  },
});

// Restore an ignored lead back to pending
export const restoreLead = mutation({
  args: {
    id: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Update opportunity - mark as pending
    await ctx.db.patch(args.id, {
      leadStatus: "pending",
      updatedAt: now,
    });

    // Also update the contact's leadStatus
    await ctx.db.patch(existing.contactId, {
      leadStatus: "pending",
      updatedAt: now,
    });

    return { success: true, opportunityId: args.id };
  },
});

// ==========================================
// DUPLICATE LEADS QUERIES & MUTATIONS
// ==========================================

// List duplicate leads
export const listDuplicateLeads = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get duplicate opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_leadStatus", (q) => q.eq("leadStatus", "duplicate"))
      .order("desc")
      .take(limit);

    // Fetch contact data and duplicate match info for each opportunity
    const opportunitiesWithDetails = await Promise.all(
      opportunities.map(async (opp) => {
        const contact = await ctx.db.get(opp.contactId);

        // Get the duplicate match contact and their opportunities
        let duplicateContact = null;
        let duplicateOpportunity = null;

        if (opp.duplicateOfContactId) {
          duplicateContact = await ctx.db.get(opp.duplicateOfContactId);

          // Get the most recent opportunity for the duplicate contact
          if (duplicateContact) {
            const duplicateOpps = await ctx.db
              .query("opportunities")
              .withIndex("by_contactId", (q) => q.eq("contactId", opp.duplicateOfContactId!))
              .order("desc")
              .first();
            duplicateOpportunity = duplicateOpps;
          }
        }

        if (opp.duplicateOfOpportunityId) {
          duplicateOpportunity = await ctx.db.get(opp.duplicateOfOpportunityId);
          if (duplicateOpportunity) {
            duplicateContact = await ctx.db.get(duplicateOpportunity.contactId);
          }
        }

        return {
          _id: opp._id,
          title: opp.title,
          contactId: opp.contactId,
          pipelineId: opp.pipelineId,
          stageId: opp.stageId,
          estimatedValue: opp.estimatedValue,
          practiceArea: opp.practiceArea,
          source: opp.source,
          notes: opp.notes,
          leadStatus: opp.leadStatus,
          duplicateMatchType: opp.duplicateMatchType,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          contact: contact
            ? {
                _id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                source: contact.source,
                notes: contact.notes,
              }
            : null,
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

    return opportunitiesWithDetails;
  },
});

// Check if a contact has duplicates (by email or phone)
export const checkForDuplicate = query({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    excludeContactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    if (!args.email && !args.phone) {
      return { hasDuplicate: false, matchType: null, matchingContact: null };
    }

    let matchingContact = null;
    let matchType: "email" | "phone" | "both" | undefined = undefined;
    let emailMatch = false;
    let phoneMatch = false;

    // Check by email
    if (args.email) {
      const emailContact = await ctx.db
        .query("contacts")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      if (emailContact && emailContact._id !== args.excludeContactId) {
        matchingContact = emailContact;
        emailMatch = true;
      }
    }

    // Check by phone
    if (args.phone) {
      const phoneContact = await ctx.db
        .query("contacts")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .first();
      if (phoneContact && phoneContact._id !== args.excludeContactId) {
        if (matchingContact && matchingContact._id === phoneContact._id) {
          phoneMatch = true;
        } else if (!matchingContact) {
          matchingContact = phoneContact;
          phoneMatch = true;
        }
      }
    }

    if (emailMatch && phoneMatch) {
      matchType = "both";
    } else if (emailMatch) {
      matchType = "email";
    } else if (phoneMatch) {
      matchType = "phone";
    }

    return {
      hasDuplicate: !!matchingContact,
      matchType,
      matchingContact: matchingContact
        ? {
            _id: matchingContact._id,
            firstName: matchingContact.firstName,
            lastName: matchingContact.lastName,
            email: matchingContact.email,
            phone: matchingContact.phone,
          }
        : null,
    };
  },
});

// Mark an opportunity as duplicate
export const markAsDuplicate = mutation({
  args: {
    id: v.id("opportunities"),
    duplicateOfContactId: v.id("contacts"),
    duplicateOfOpportunityId: v.optional(v.id("opportunities")),
    matchType: v.string(), // "email", "phone", "both"
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    await ctx.db.patch(args.id, {
      leadStatus: "duplicate",
      duplicateOfContactId: args.duplicateOfContactId,
      duplicateOfOpportunityId: args.duplicateOfOpportunityId,
      duplicateMatchType: args.matchType,
      updatedAt: now,
    });

    // Also update the contact's leadStatus
    await ctx.db.patch(existing.contactId, {
      leadStatus: "duplicate",
      updatedAt: now,
    });

    return { success: true };
  },
});

// Remove a duplicate lead (delete opportunity and optionally contact)
export const removeDuplicateLead = mutation({
  args: {
    id: v.id("opportunities"),
    deleteContact: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    // Delete any related tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id))
      .collect();

    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    // Delete any related opportunity contacts
    const oppContacts = await ctx.db
      .query("opportunityContacts")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id))
      .collect();

    for (const oc of oppContacts) {
      await ctx.db.delete(oc._id);
    }

    // Delete the opportunity
    await ctx.db.delete(args.id);

    // Optionally delete the contact if requested and no other opportunities reference it
    if (args.deleteContact) {
      const otherOpps = await ctx.db
        .query("opportunities")
        .withIndex("by_contactId", (q) => q.eq("contactId", existing.contactId))
        .first();

      if (!otherOpps) {
        await ctx.db.delete(existing.contactId);
      }
    }

    return { success: true };
  },
});

// Update email of a duplicate lead's contact
export const updateDuplicateEmail = mutation({
  args: {
    id: v.id("opportunities"),
    newEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Update the contact's email
    await ctx.db.patch(existing.contactId, {
      email: args.newEmail,
      updatedAt: now,
    });

    // Re-check for duplicates with the new email
    const contact = await ctx.db.get(existing.contactId);
    if (!contact) throw new Error("Contact not found");

    let hasDuplicate = false;
    let matchType: "email" | "phone" | "both" | undefined = undefined;
    let duplicateContactId = null;

    // Check if new email matches another contact
    const emailMatch = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.newEmail))
      .first();

    if (emailMatch && emailMatch._id !== existing.contactId) {
      hasDuplicate = true;
      matchType = "email";
      duplicateContactId = emailMatch._id;

      // Also check phone
      if (contact.phone) {
        const phoneMatch = await ctx.db
          .query("contacts")
          .withIndex("by_phone", (q) => q.eq("phone", contact.phone))
          .first();
        if (phoneMatch && phoneMatch._id !== existing.contactId && phoneMatch._id === emailMatch._id) {
          matchType = "both";
        }
      }
    }

    if (hasDuplicate && duplicateContactId) {
      // Still a duplicate with new email
      const duplicateOpp = await ctx.db
        .query("opportunities")
        .withIndex("by_contactId", (q) => q.eq("contactId", duplicateContactId))
        .order("desc")
        .first();

      await ctx.db.patch(args.id, {
        duplicateOfContactId: duplicateContactId,
        duplicateOfOpportunityId: duplicateOpp?._id,
        duplicateMatchType: matchType,
        updatedAt: now,
      });
    } else {
      // No longer a duplicate - move to pending
      await ctx.db.patch(args.id, {
        leadStatus: "pending",
        duplicateOfContactId: undefined,
        duplicateOfOpportunityId: undefined,
        duplicateMatchType: undefined,
        updatedAt: now,
      });

      await ctx.db.patch(existing.contactId, {
        leadStatus: "pending",
        updatedAt: now,
      });
    }

    return { success: true, stillDuplicate: hasDuplicate };
  },
});

// Update phone of a duplicate lead's contact
export const updateDuplicatePhone = mutation({
  args: {
    id: v.id("opportunities"),
    newPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Update the contact's phone
    await ctx.db.patch(existing.contactId, {
      phone: args.newPhone,
      updatedAt: now,
    });

    // Re-check for duplicates with the new phone
    const contact = await ctx.db.get(existing.contactId);
    if (!contact) throw new Error("Contact not found");

    let hasDuplicate = false;
    let matchType: "email" | "phone" | "both" | undefined = undefined;
    let duplicateContactId = null;

    // Check if new phone matches another contact
    const phoneMatch = await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phone", args.newPhone))
      .first();

    if (phoneMatch && phoneMatch._id !== existing.contactId) {
      hasDuplicate = true;
      matchType = "phone";
      duplicateContactId = phoneMatch._id;

      // Also check email
      if (contact.email) {
        const emailMatch = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", contact.email))
          .first();
        if (emailMatch && emailMatch._id !== existing.contactId && emailMatch._id === phoneMatch._id) {
          matchType = "both";
        }
      }
    }

    if (hasDuplicate && duplicateContactId) {
      // Still a duplicate with new phone
      const duplicateOpp = await ctx.db
        .query("opportunities")
        .withIndex("by_contactId", (q) => q.eq("contactId", duplicateContactId))
        .order("desc")
        .first();

      await ctx.db.patch(args.id, {
        duplicateOfContactId: duplicateContactId,
        duplicateOfOpportunityId: duplicateOpp?._id,
        duplicateMatchType: matchType,
        updatedAt: now,
      });
    } else {
      // No longer a duplicate - move to pending
      await ctx.db.patch(args.id, {
        leadStatus: "pending",
        duplicateOfContactId: undefined,
        duplicateOfOpportunityId: undefined,
        duplicateMatchType: undefined,
        updatedAt: now,
      });

      await ctx.db.patch(existing.contactId, {
        leadStatus: "pending",
        updatedAt: now,
      });
    }

    return { success: true, stillDuplicate: hasDuplicate };
  },
});

// Create as new lead - removes duplicate status and creates fresh
export const createAsNewLead = mutation({
  args: {
    id: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const now = Date.now();

    // Clear duplicate fields and set to pending
    await ctx.db.patch(args.id, {
      leadStatus: "pending",
      duplicateOfContactId: undefined,
      duplicateOfOpportunityId: undefined,
      duplicateMatchType: undefined,
      updatedAt: now,
    });

    await ctx.db.patch(existing.contactId, {
      leadStatus: "pending",
      updatedAt: now,
    });

    return { success: true, opportunityId: args.id };
  },
});

// Scan and detect duplicates for all pending leads
export const scanForDuplicates = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all pending leads
    const pendingLeads = await ctx.db
      .query("opportunities")
      .order("desc")
      .take(500);

    const filteredLeads = pendingLeads.filter(
      (o) => !o.leadStatus || o.leadStatus === "pending"
    );

    let duplicatesFound = 0;

    for (const opp of filteredLeads) {
      const contact = await ctx.db.get(opp.contactId);
      if (!contact) continue;

      let matchingContact = null;
      let matchType: "email" | "phone" | "both" | undefined = undefined;
      let emailMatch = false;
      let phoneMatch = false;

      // Check by email
      if (contact.email) {
        const emailContact = await ctx.db
          .query("contacts")
          .withIndex("by_email", (q) => q.eq("email", contact.email))
          .first();
        if (emailContact && emailContact._id !== contact._id) {
          // Check if this contact has an accepted opportunity
          const acceptedOpp = await ctx.db
            .query("opportunities")
            .withIndex("by_contactId", (q) => q.eq("contactId", emailContact._id))
            .filter((q) => q.eq(q.field("leadStatus"), "accepted"))
            .first();
          if (acceptedOpp || emailContact.leadStatus === "accepted") {
            matchingContact = emailContact;
            emailMatch = true;
          }
        }
      }

      // Check by phone
      if (contact.phone) {
        const phoneContact = await ctx.db
          .query("contacts")
          .withIndex("by_phone", (q) => q.eq("phone", contact.phone))
          .first();
        if (phoneContact && phoneContact._id !== contact._id) {
          // Check if this contact has an accepted opportunity
          const acceptedOpp = await ctx.db
            .query("opportunities")
            .withIndex("by_contactId", (q) => q.eq("contactId", phoneContact._id))
            .filter((q) => q.eq(q.field("leadStatus"), "accepted"))
            .first();
          if (acceptedOpp || phoneContact.leadStatus === "accepted") {
            if (matchingContact && matchingContact._id === phoneContact._id) {
              phoneMatch = true;
            } else if (!matchingContact) {
              matchingContact = phoneContact;
              phoneMatch = true;
            }
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

        // Get the matching contact's opportunity
        const duplicateOpp = await ctx.db
          .query("opportunities")
          .withIndex("by_contactId", (q) => q.eq("contactId", matchingContact._id))
          .order("desc")
          .first();

        // Mark as duplicate
        await ctx.db.patch(opp._id, {
          leadStatus: "duplicate",
          duplicateOfContactId: matchingContact._id,
          duplicateOfOpportunityId: duplicateOpp?._id,
          duplicateMatchType: matchType,
          updatedAt: now,
        });

        await ctx.db.patch(opp.contactId, {
          leadStatus: "duplicate",
          updatedAt: now,
        });

        duplicatesFound++;
      }
    }

    return { success: true, duplicatesFound };
  },
});
