import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.isActive !== undefined) {
      return await ctx.db
        .query("stageCompletionMappings")
        .withIndex("by_isActive", (q) => q.eq("isActive", args.isActive!))
        .collect();
    }
    return await ctx.db.query("stageCompletionMappings").collect();
  },
});

export const getById = query({
  args: { id: v.id("stageCompletionMappings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySourceStage = query({
  args: { sourceStageName: v.string() },
  handler: async (ctx, args) => {
    const mappings = await ctx.db
      .query("stageCompletionMappings")
      .withIndex("by_sourceStageName", (q) => q.eq("sourceStageName", args.sourceStageName))
      .collect();

    return mappings.find((m) => m.isActive) || null;
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    sourceStageName: v.string(),
    sourceStageId: v.optional(v.string()),
    sourcePipelineId: v.optional(v.string()),
    targetPipelineId: v.string(),
    targetPipelineName: v.string(),
    targetStageName: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("stageCompletionMappings", {
      ...args,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("stageCompletionMappings"),
    sourceStageName: v.optional(v.string()),
    sourceStageId: v.optional(v.string()),
    sourcePipelineId: v.optional(v.string()),
    targetPipelineId: v.optional(v.string()),
    targetPipelineName: v.optional(v.string()),
    targetStageName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Mapping not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("stageCompletionMappings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const toggleActive = mutation({
  args: { id: v.id("stageCompletionMappings") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Mapping not found");

    await ctx.db.patch(args.id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

// Clear all existing mappings
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db.query("stageCompletionMappings").collect();
    await Promise.all(mappings.map((m) => ctx.db.delete(m._id)));
    return { message: `Deleted ${mappings.length} mappings` };
  },
});

// Seed default mappings from GHL data
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if mappings already exist
    const existing = await ctx.db.query("stageCompletionMappings").first();
    if (existing) {
      return { message: "Mappings already exist, skipping seed" };
    }

    // Default mappings: Source Stage → Did Not Hire / Target Stage
    // These match the GHL stage_completion_mappings table
    const defaultMappings = [
      {
        sourceStageName: "Pending Contact",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : Pending Contact",
      },
      {
        sourceStageName: "Pending Intake Completion",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-Up Completed: Pending Intake",
      },
      {
        sourceStageName: "Pending I/V",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : Pending I/V",
      },
      {
        sourceStageName: "Cancelled/No Show I/V",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : No Show / Canceled I/V",
      },
      {
        sourceStageName: "Pending Engagement Lvl 1",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : Did Not Engage Post-I/V or Post-Quotation",
      },
      {
        sourceStageName: "Pending Engagement Lvl 2 and 3",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : Did Not Engage Post-I/V or Post-Quotation",
      },
      {
        sourceStageName: "Cancelled/No Show Design",
        targetPipelineName: "Did Not Hire",
        targetPipelineId: "Did Not Hire",
        targetStageName: "Follow-up Completed : Did Not Engage Post-I/V or Post-Quotation",
      },
    ];

    const ids = await Promise.all(
      defaultMappings.map((mapping) =>
        ctx.db.insert("stageCompletionMappings", {
          ...mapping,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { message: `Seeded ${ids.length} stage completion mappings`, ids };
  },
});

// Import from GHL format
export const importFromGHL = mutation({
  args: {
    mappings: v.array(v.object({
      source_stage_name: v.string(),
      source_stage_id: v.optional(v.string()),
      source_pipeline_id: v.optional(v.string()),
      target_pipeline_id: v.string(),
      target_pipeline_name: v.string(),
      target_stage_name: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const ids = await Promise.all(
      args.mappings.map((m) =>
        ctx.db.insert("stageCompletionMappings", {
          sourceStageName: m.source_stage_name,
          sourceStageId: m.source_stage_id,
          sourcePipelineId: m.source_pipeline_id,
          targetPipelineId: m.target_pipeline_id,
          targetPipelineName: m.target_pipeline_name,
          targetStageName: m.target_stage_name,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { message: `Imported ${ids.length} mappings from GHL`, ids };
  },
});
