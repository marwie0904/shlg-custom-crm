import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    stageName: v.optional(v.string()),
    pipelineId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.stageName) {
      const templates = await ctx.db
        .query("taskTemplates")
        .withIndex("by_stageName", (q) => q.eq("stageName", args.stageName!))
        .collect();

      // Filter by active status if specified
      const filtered = args.isActive !== undefined
        ? templates.filter((t) => t.isActive === args.isActive)
        : templates;

      return filtered.sort((a, b) => a.taskNumber - b.taskNumber);
    }

    if (args.pipelineId) {
      const templates = await ctx.db
        .query("taskTemplates")
        .withIndex("by_pipelineId", (q) => q.eq("pipelineId", args.pipelineId!))
        .collect();

      const filtered = args.isActive !== undefined
        ? templates.filter((t) => t.isActive === args.isActive)
        : templates;

      return filtered.sort((a, b) => a.taskNumber - b.taskNumber);
    }

    const templates = await ctx.db.query("taskTemplates").collect();
    const filtered = args.isActive !== undefined
      ? templates.filter((t) => t.isActive === args.isActive)
      : templates;

    return filtered.sort((a, b) => {
      if (a.stageName !== b.stageName) return a.stageName.localeCompare(b.stageName);
      return a.taskNumber - b.taskNumber;
    });
  },
});

export const getById = query({
  args: { id: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getForStage = query({
  args: {
    stageName: v.string(),
    pipelineId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_stageName", (q) => q.eq("stageName", args.stageName))
      .collect();

    // Filter to active templates only
    let activeTemplates = templates.filter((t) => t.isActive);

    // If pipelineId specified, filter to those matching or with no pipeline specified
    if (args.pipelineId) {
      activeTemplates = activeTemplates.filter(
        (t) => !t.pipelineId || t.pipelineId === args.pipelineId
      );
    }

    return activeTemplates.sort((a, b) => a.taskNumber - b.taskNumber);
  },
});

// Get unique stage names that have templates
export const getStagesWithTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("taskTemplates")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    const stageNames = [...new Set(templates.map((t) => t.stageName))];
    return stageNames.sort();
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    stageName: v.string(),
    pipelineId: v.optional(v.string()),
    taskNumber: v.number(),
    taskName: v.string(),
    taskDescription: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    assigneeName: v.optional(v.string()),
    dueDateValue: v.number(),
    dueDateUnit: v.string(),
    priority: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("taskTemplates", {
      ...args,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("taskTemplates"),
    stageName: v.optional(v.string()),
    pipelineId: v.optional(v.string()),
    taskNumber: v.optional(v.number()),
    taskName: v.optional(v.string()),
    taskDescription: v.optional(v.string()),
    assigneeId: v.optional(v.string()),
    assigneeName: v.optional(v.string()),
    dueDateValue: v.optional(v.number()),
    dueDateUnit: v.optional(v.string()),
    priority: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task template not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("taskTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task template not found");

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Bulk create templates for a stage
export const createBulk = mutation({
  args: {
    templates: v.array(v.object({
      stageName: v.string(),
      pipelineId: v.optional(v.string()),
      taskNumber: v.number(),
      taskName: v.string(),
      taskDescription: v.optional(v.string()),
      assigneeId: v.optional(v.string()),
      assigneeName: v.optional(v.string()),
      dueDateValue: v.number(),
      dueDateUnit: v.string(),
      priority: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = await Promise.all(
      args.templates.map((template) =>
        ctx.db.insert("taskTemplates", {
          ...template,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );
    return ids;
  },
});

// Seed default task templates (can be called to initialize)
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if templates already exist
    const existing = await ctx.db.query("taskTemplates").first();
    if (existing) {
      return { message: "Templates already exist, skipping seed" };
    }

    // Default task templates per stage (matching pipeline stages)
    // Stages: Fresh Leads, Pending Contact, Pending Intake Completion,
    // Scheduled Discovery Call, Pending I/V, Scheduled I/V, Cancelled/No Show I/V,
    // Pending Engagement Lvl 1, Pending Engagement Lvl 2 and 3, Scheduled Design,
    // Cancelled/No Show Design, Engaged
    const defaultTemplates = [
      // Fresh Leads stage
      {
        stageName: "Fresh Leads",
        taskNumber: 1,
        taskName: "Initial contact attempt - call",
        taskDescription: "Make first contact attempt via phone call",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Fresh Leads",
        taskNumber: 2,
        taskName: "Send welcome text/email",
        taskDescription: "If no answer, send introductory text or email",
        dueDateValue: 30,
        dueDateUnit: "minutes",
        priority: "Medium",
      },
      {
        stageName: "Fresh Leads",
        taskNumber: 3,
        taskName: "Second contact attempt",
        taskDescription: "Follow up call attempt",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Fresh Leads",
        taskNumber: 4,
        taskName: "Third contact attempt",
        taskDescription: "Final attempt to reach lead",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Fresh Leads",
        taskNumber: 5,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final follow-up attempt before closing",
        dueDateValue: 4,
        dueDateUnit: "days",
        priority: "High",
      },

      // Pending Contact stage
      {
        stageName: "Pending Contact",
        taskNumber: 1,
        taskName: "Schedule discovery call",
        taskDescription: "Reach out to schedule a discovery call",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Pending Contact",
        taskNumber: 2,
        taskName: "Follow-up if no response",
        taskDescription: "Second attempt to contact lead",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending Contact",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final follow-up call before closing the matter",
        dueDateValue: 5,
        dueDateUnit: "days",
        priority: "High",
      },

      // Pending Intake Completion stage
      {
        stageName: "Pending Intake Completion",
        taskNumber: 1,
        taskName: "Send intake form reminder",
        taskDescription: "Remind client to complete intake form",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending Intake Completion",
        taskNumber: 2,
        taskName: "Follow up on incomplete intake",
        taskDescription: "Call to assist with intake form completion",
        dueDateValue: 3,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending Intake Completion",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final attempt before closing",
        dueDateValue: 7,
        dueDateUnit: "days",
        priority: "High",
      },

      // Scheduled Discovery Call stage
      {
        stageName: "Scheduled Discovery Call",
        taskNumber: 1,
        taskName: "Send appointment confirmation",
        taskDescription: "Confirm appointment details with client",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Scheduled Discovery Call",
        taskNumber: 2,
        taskName: "Send appointment reminder (24 hrs)",
        taskDescription: "Reminder one day before appointment",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },

      // Pending I/V stage (Initial Visit)
      {
        stageName: "Pending I/V",
        taskNumber: 1,
        taskName: "Schedule Initial Visit",
        taskDescription: "Reach out to schedule initial visit appointment",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Pending I/V",
        taskNumber: 2,
        taskName: "Follow up on I/V scheduling",
        taskDescription: "Second attempt to schedule initial visit",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending I/V",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final attempt to schedule I/V",
        dueDateValue: 5,
        dueDateUnit: "days",
        priority: "High",
      },

      // Scheduled I/V stage
      {
        stageName: "Scheduled I/V",
        taskNumber: 1,
        taskName: "Review intake and prepare for I/V",
        taskDescription: "Review all client documents and intake form before meeting",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Scheduled I/V",
        taskNumber: 2,
        taskName: "Send I/V reminder",
        taskDescription: "Remind client of upcoming initial visit",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },

      // Cancelled/No Show I/V stage
      {
        stageName: "Cancelled/No Show I/V",
        taskNumber: 1,
        taskName: "Contact to reschedule I/V",
        taskDescription: "Reach out about missed appointment and reschedule",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Cancelled/No Show I/V",
        taskNumber: 2,
        taskName: "Second reschedule attempt",
        taskDescription: "Follow-up attempt to reschedule",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Cancelled/No Show I/V",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final attempt before moving to Did Not Hire",
        dueDateValue: 5,
        dueDateUnit: "days",
        priority: "High",
      },

      // Pending Engagement Lvl 1 stage
      {
        stageName: "Pending Engagement Lvl 1",
        taskNumber: 1,
        taskName: "Send engagement agreement Lvl 1",
        taskDescription: "Send Level 1 engagement letter for signature",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Pending Engagement Lvl 1",
        taskNumber: 2,
        taskName: "Follow up on engagement agreement",
        taskDescription: "Remind about signing engagement agreement",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending Engagement Lvl 1",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final attempt to secure engagement",
        dueDateValue: 7,
        dueDateUnit: "days",
        priority: "High",
      },

      // Pending Engagement Lvl 2 and 3 stage
      {
        stageName: "Pending Engagement Lvl 2 and 3",
        taskNumber: 1,
        taskName: "Send engagement agreement Lvl 2/3",
        taskDescription: "Send Level 2/3 engagement letter for signature",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Pending Engagement Lvl 2 and 3",
        taskNumber: 2,
        taskName: "Follow up on engagement agreement",
        taskDescription: "Remind about signing engagement agreement",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },
      {
        stageName: "Pending Engagement Lvl 2 and 3",
        taskNumber: 3,
        taskName: "Final follow-up call—if no answer, send final text and close the matter.",
        taskDescription: "Final attempt to secure engagement",
        dueDateValue: 7,
        dueDateUnit: "days",
        priority: "High",
      },

      // Scheduled Design stage
      {
        stageName: "Scheduled Design",
        taskNumber: 1,
        taskName: "Prepare design documents",
        taskDescription: "Prepare estate plan design documents for meeting",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Scheduled Design",
        taskNumber: 2,
        taskName: "Send design meeting reminder",
        taskDescription: "Remind client of upcoming design meeting",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },

      // Cancelled/No Show Design stage
      {
        stageName: "Cancelled/No Show Design",
        taskNumber: 1,
        taskName: "Contact to reschedule design meeting",
        taskDescription: "Reach out about missed meeting and reschedule",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Cancelled/No Show Design",
        taskNumber: 2,
        taskName: "Second reschedule attempt",
        taskDescription: "Follow-up attempt to reschedule design meeting",
        dueDateValue: 2,
        dueDateUnit: "days",
        priority: "Medium",
      },

      // Engaged stage
      {
        stageName: "Engaged",
        taskNumber: 1,
        taskName: "Send welcome packet",
        taskDescription: "Send welcome email with next steps and timeline",
        dueDateValue: 0,
        dueDateUnit: "days",
        priority: "High",
      },
      {
        stageName: "Engaged",
        taskNumber: 2,
        taskName: "Schedule kickoff meeting",
        taskDescription: "Schedule initial planning meeting with client",
        dueDateValue: 1,
        dueDateUnit: "days",
        priority: "Medium",
      },
    ];

    const ids = await Promise.all(
      defaultTemplates.map((template) =>
        ctx.db.insert("taskTemplates", {
          ...template,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { message: `Seeded ${ids.length} default task templates`, ids };
  },
});

// Clear all existing task templates
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("taskTemplates").collect();
    await Promise.all(templates.map((t) => ctx.db.delete(t._id)));
    return { message: `Deleted ${templates.length} templates` };
  },
});

// Import task templates from GHL data (bulk import)
export const importFromGHL = mutation({
  args: {
    templates: v.array(v.object({
      opportunity_stage_name: v.string(),
      task_number: v.number(),
      task_name: v.string(),
      task_description: v.optional(v.string()),
      assignee_id: v.optional(v.string()),
      assignee_name: v.optional(v.string()),
      due_date_value: v.number(),
      due_date_time_relation: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const ids = await Promise.all(
      args.templates.map((t) =>
        ctx.db.insert("taskTemplates", {
          stageName: t.opportunity_stage_name,
          taskNumber: t.task_number,
          taskName: t.task_name,
          taskDescription: t.task_description,
          assigneeId: t.assignee_id,
          assigneeName: t.assignee_name,
          dueDateValue: t.due_date_value,
          dueDateUnit: t.due_date_time_relation,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { message: `Imported ${ids.length} task templates from GHL`, ids };
  },
});
