import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// The final task title that triggers opportunity move to "Did Not Hire"
const FINAL_TASK_TITLE = "Final follow-up call—if no answer, send final text and close the matter.";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    status: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    if (args.completed !== undefined) {
      const completed = args.completed;
      return await ctx.db
        .query("tasks")
        .withIndex("by_completed", (q) => q.eq("completed", completed))
        .order("desc")
        .take(limit);
    }

    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("tasks")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(limit);
    }

    if (args.assignedTo) {
      const assignedTo = args.assignedTo;
      return await ctx.db
        .query("tasks")
        .withIndex("by_assignedTo", (q) => q.eq("assignedTo", assignedTo))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("tasks").order("desc").take(limit);
  },
});

export const getById = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByContactId = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_contactId", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

export const getByOpportunityId = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .collect();
  },
});

export const getPending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_completed", (q) => q.eq("completed", false))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getCompleted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_completed", (q) => q.eq("completed", true))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getOverdue = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_completed", (q) => q.eq("completed", false))
      .collect();

    return tasks
      .filter((t) => t.dueDate && t.dueDate < now)
      .slice(0, args.limit ?? 50);
  },
});

export const getUpcoming = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysMs = (args.days ?? 7) * 24 * 60 * 60 * 1000;
    const endDate = now + daysMs;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_completed", (q) => q.eq("completed", false))
      .collect();

    return tasks
      .filter((t) => t.dueDate && t.dueDate >= now && t.dueDate <= endDate)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, args.limit ?? 20);
  },
});

export const getWithRelated = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;

    const contact = task.contactId ? await ctx.db.get(task.contactId) : null;
    const opportunity = task.opportunityId
      ? await ctx.db.get(task.opportunityId)
      : null;

    return { ...task, contact, opportunity };
  },
});

export const listWithRelated = query({
  args: {
    completed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let tasks;
    if (args.completed !== undefined) {
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_completed", (q) => q.eq("completed", args.completed!))
        .order("desc")
        .take(limit);
    } else {
      tasks = await ctx.db.query("tasks").order("desc").take(limit);
    }

    // Enrich with contact, opportunity, and workshop data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const contact = task.contactId ? await ctx.db.get(task.contactId) : null;
        const opportunity = task.opportunityId
          ? await ctx.db.get(task.opportunityId)
          : null;
        const workshop = task.workshopId ? await ctx.db.get(task.workshopId) : null;

        return {
          ...task,
          contactName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : null,
          opportunityTitle: opportunity?.title ?? null,
          workshopTitle: workshop?.title ?? null,
          contact,
          opportunity,
          workshop,
        };
      })
    );

    return enrichedTasks;
  },
});

export const getByWorkshopId = query({
  args: { workshopId: v.id("workshops") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_workshopId", (q) => q.eq("workshopId", args.workshopId))
      .collect();
  },
});

export const getByAssignee = query({
  args: {
    assignedTo: v.string(),
    completed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignedTo", (q) => q.eq("assignedTo", args.assignedTo))
      .collect();

    let filtered = tasks;
    if (args.completed !== undefined) {
      filtered = tasks.filter((t) => t.completed === args.completed);
    }

    return filtered.slice(0, args.limit ?? 50);
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    workshopId: v.optional(v.id("workshops")),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      status: args.status ?? "Pending",
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.string()),
    assignedToName: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // If status is Completed, mark as completed
    if (args.status === "Completed") {
      updates.completed = true;
      updates.completedAt = Date.now();
    } else {
      updates.completed = false;
      updates.completedAt = undefined;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const complete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const now = Date.now();

    // Mark task as completed
    await ctx.db.patch(args.id, {
      status: "Completed",
      completed: true,
      completedAt: now,
      updatedAt: now,
    });

    // Check if this is the final task that should move opportunity to "Did Not Hire"
    let opportunityMoved = false;
    let movedTo = null;

    if (existing.title === FINAL_TASK_TITLE && existing.opportunityId) {
      // Get the opportunity to find its current stage
      const opportunity = await ctx.db.get(existing.opportunityId);
      if (opportunity) {
        // Get the current stage info
        const allStages = await ctx.db.query("pipelineStages").collect();
        const currentStage = allStages.find((s) => s._id.toString() === opportunity.stageId);

        if (currentStage) {
          // Look up the stage completion mapping
          const mappings = await ctx.db
            .query("stageCompletionMappings")
            .withIndex("by_sourceStageName", (q) => q.eq("sourceStageName", currentStage.name))
            .collect();

          const activeMapping = mappings.find((m) => m.isActive);

          if (activeMapping) {
            // Find the target stage in the target pipeline
            const targetStages = allStages.filter(
              (s) => s.pipeline === activeMapping.targetPipelineName
            );
            const targetStage = targetStages.find(
              (s) => s.name === activeMapping.targetStageName
            );

            if (targetStage) {
              // Move the opportunity to "Did Not Hire" pipeline
              await ctx.db.patch(existing.opportunityId, {
                pipelineId: activeMapping.targetPipelineName,
                stageId: targetStage._id.toString(),
                updatedAt: now,
              });

              opportunityMoved = true;
              movedTo = {
                pipeline: activeMapping.targetPipelineName,
                stage: activeMapping.targetStageName,
              };
            }
          }
        }
      }
    }

    return {
      taskId: args.id,
      opportunityMoved,
      movedTo,
    };
  },
});

export const uncomplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      status: "Pending",
      completed: false,
      completedAt: undefined,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const toggleComplete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    const now = Date.now();
    let opportunityMoved = false;
    let movedTo = null;

    if (existing.completed) {
      // Uncompleting - just update the task
      await ctx.db.patch(args.id, {
        status: "Pending",
        completed: false,
        completedAt: undefined,
        updatedAt: now,
      });
    } else {
      // Completing - update task and check for final task
      await ctx.db.patch(args.id, {
        status: "Completed",
        completed: true,
        completedAt: now,
        updatedAt: now,
      });

      // Check if this is the final task that should move opportunity to "Did Not Hire"
      if (existing.title === FINAL_TASK_TITLE && existing.opportunityId) {
        const opportunity = await ctx.db.get(existing.opportunityId);
        if (opportunity) {
          const allStages = await ctx.db.query("pipelineStages").collect();
          const currentStage = allStages.find((s) => s._id.toString() === opportunity.stageId);

          if (currentStage) {
            const mappings = await ctx.db
              .query("stageCompletionMappings")
              .withIndex("by_sourceStageName", (q) => q.eq("sourceStageName", currentStage.name))
              .collect();

            const activeMapping = mappings.find((m) => m.isActive);

            if (activeMapping) {
              const targetStages = allStages.filter(
                (s) => s.pipeline === activeMapping.targetPipelineName
              );
              const targetStage = targetStages.find(
                (s) => s.name === activeMapping.targetStageName
              );

              if (targetStage) {
                await ctx.db.patch(existing.opportunityId, {
                  pipelineId: activeMapping.targetPipelineName,
                  stageId: targetStage._id.toString(),
                  updatedAt: now,
                });

                opportunityMoved = true;
                movedTo = {
                  pipeline: activeMapping.targetPipelineName,
                  stage: activeMapping.targetStageName,
                };
              }
            }
          }
        }
      }
    }

    return {
      taskId: args.id,
      completed: !existing.completed,
      opportunityMoved,
      movedTo,
    };
  },
});

export const assign = mutation({
  args: {
    id: v.id("tasks"),
    assignedTo: v.string(),
    assignedToName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      assignedTo: args.assignedTo,
      assignedToName: args.assignedToName,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToContact = mutation({
  args: {
    id: v.id("tasks"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      contactId: args.contactId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const linkToOpportunity = mutation({
  args: {
    id: v.id("tasks"),
    opportunityId: v.id("opportunities"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Task not found");

    await ctx.db.patch(args.id, {
      opportunityId: args.opportunityId,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Bulk operations
export const completeMultiple = mutation({
  args: { ids: v.array(v.id("tasks")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    await Promise.all(
      args.ids.map((id) =>
        ctx.db.patch(id, {
          status: "Completed",
          completed: true,
          completedAt: now,
          updatedAt: now,
        })
      )
    );
    return args.ids;
  },
});

export const removeMultiple = mutation({
  args: { ids: v.array(v.id("tasks")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
    return args.ids;
  },
});
