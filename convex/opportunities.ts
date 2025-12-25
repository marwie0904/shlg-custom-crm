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
        .take(limit);
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit);
    }

    // Filter by stage if specified
    if (args.stageId) {
      return opportunities.filter((o) => o.stageId === args.stageId);
    }

    return opportunities;
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

    const [contact, appointments, invoices, tasks, workshops, documents] = await Promise.all([
      ctx.db.get(opportunity.contactId),
      ctx.db.query("appointments").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("invoices").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("tasks").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
      ctx.db.query("workshopRegistrations").withIndex("by_contactId", (q) => q.eq("contactId", opportunity.contactId)).collect(),
      ctx.db.query("documents").withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id)).collect(),
    ]);

    // Get download URLs for documents
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await ctx.storage.getUrl(doc.storageId);
        return { ...doc, downloadUrl };
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
    notes: v.optional(v.string()),
    calendarAppointmentDate: v.optional(v.number()),
    calendarAppointmentType: v.optional(v.string()),
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
    skipTaskGeneration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity not found");

    const previousStageId = existing.stageId;
    const now = Date.now();

    // Update the opportunity
    await ctx.db.patch(args.id, {
      pipelineId: args.pipelineId,
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
        .take(limit);
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit);
    }

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
        .take(limit);
    } else {
      opportunities = await ctx.db.query("opportunities").order("desc").take(limit);
    }

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
          calendarAppointmentDate: opp.calendarAppointmentDate,
          calendarAppointmentType: opp.calendarAppointmentType,
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
      calendarAppointmentDate: args.appointmentDate,
      calendarAppointmentType: args.appointmentType,
      createdAt: now,
      updatedAt: now,
    });

    return opportunityId;
  },
});
