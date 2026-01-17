import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// QUERIES
// ==========================================

export const list = query({
  args: {
    pipeline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.pipeline) {
      const pipeline = args.pipeline;
      return await ctx.db
        .query("pipelineStages")
        .withIndex("by_pipeline", (q) => q.eq("pipeline", pipeline))
        .collect();
    }
    return await ctx.db.query("pipelineStages").collect();
  },
});

export const getById = query({
  args: { id: v.id("pipelineStages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPipeline = query({
  args: { pipeline: v.string() },
  handler: async (ctx, args) => {
    const stages = await ctx.db
      .query("pipelineStages")
      .withIndex("by_pipeline", (q) => q.eq("pipeline", args.pipeline))
      .collect();

    return stages.sort((a, b) => a.order - b.order);
  },
});

// Get all unique pipeline names
export const listPipelines = query({
  args: {},
  handler: async (ctx) => {
    const allStages = await ctx.db.query("pipelineStages").collect();
    const pipelineNames = [...new Set(allStages.map((stage) => stage.pipeline))];

    // Return pipeline info with stage counts
    return pipelineNames.map((name) => ({
      name,
      stageCount: allStages.filter((s) => s.pipeline === name).length,
    }));
  },
});

// Get all stages grouped by pipeline
export const listAllGrouped = query({
  args: {},
  handler: async (ctx) => {
    const allStages = await ctx.db.query("pipelineStages").collect();
    const pipelineNames = [...new Set(allStages.map((stage) => stage.pipeline))];

    return pipelineNames.map((name) => ({
      name,
      stages: allStages
        .filter((s) => s.pipeline === name)
        .sort((a, b) => a.order - b.order),
    }));
  },
});

// ==========================================
// MUTATIONS
// ==========================================

export const create = mutation({
  args: {
    name: v.string(),
    pipeline: v.string(),
    order: v.number(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pipelineStages", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("pipelineStages"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Stage not found");

    await ctx.db.patch(id, updates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("pipelineStages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorder = mutation({
  args: {
    stages: v.array(v.object({
      id: v.id("pipelineStages"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.stages.map((stage) =>
        ctx.db.patch(stage.id, { order: stage.order })
      )
    );
    return args.stages.map((s) => s.id);
  },
});

// Seed default pipeline stages
export const seedDefaultStages = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if stages already exist
    const existingStages = await ctx.db.query("pipelineStages").first();
    if (existingStages) {
      return { message: "Stages already exist" };
    }

    const mainLeadFlowStages = [
      { name: "Fresh Leads", order: 1 },
      { name: "Pending Contact", order: 2 },
      { name: "Pending Intake Completion", order: 3 },
      { name: "Scheduled Discovery Call", order: 4 },
      { name: "Pending I/V", order: 5 },
      { name: "Scheduled I/V", order: 6 },
      { name: "Cancelled/No Show I/V", order: 7 },
      { name: "Pending Engagement Lvl 1", order: 8 },
      { name: "Pending Engagement Lvl 2 and 3", order: 9 },
      { name: "Scheduled Design", order: 10 },
      { name: "Cancelled/No Show Design", order: 11 },
      { name: "Engaged", order: 12 },
    ];

    const didNotHireStages = [
      { name: "Follow-Up Completed: Pending Intake", order: 1 },
      { name: "Rejected Lead - due to bad behavior", order: 2 },
      { name: "Rejected Lead - Not Qualified", order: 3 },
      { name: "Outside Practice Area / Service Not Offered", order: 4 },
      { name: "Not Ready to Move Forward", order: 5 },
      { name: "Conflict Issue", order: 6 },
      { name: "Cost Concerns", order: 7 },
      { name: "Service No Longer Needed", order: 8 },
      { name: "Hired Other Attorney", order: 9 },
      { name: "Others", order: 10 },
      { name: "Not a Fit", order: 11 },
      { name: "Rejected Lead – Rush Request", order: 12 },
      { name: "Archived Lead from ActionStep", order: 13 },
      { name: "Rejected Lead – Did Not Want Document Changes", order: 14 },
      { name: "Location Concern", order: 15 },
      { name: "INTERNAL/NOT A LEAD", order: 16 },
      { name: "No Show / Canceled Webinar", order: 17 },
      { name: "Client Experience Detractor", order: 18 },
      { name: "Language Barrier", order: 19 },
      { name: "BNI Lead – No Contact", order: 20 },
      { name: "Lead Chose Not to Proceed", order: 21 },
      { name: "Invalid Lead", order: 22 },
      { name: "Follow-up Completed : Pending I/V", order: 23 },
      { name: "Follow-up Completed : No Show / Canceled I/V", order: 24 },
      { name: "Follow-up Completed : Did Not Engage Post-I/V or Post-Quotation", order: 25 },
      { name: "Follow-up Completed : Pending Contact", order: 26 },
    ];

    // Insert Main Lead Flow stages
    await Promise.all(
      mainLeadFlowStages.map((stage) =>
        ctx.db.insert("pipelineStages", {
          ...stage,
          pipeline: "Main Lead Flow",
        })
      )
    );

    // Insert Did Not Hire stages
    await Promise.all(
      didNotHireStages.map((stage) =>
        ctx.db.insert("pipelineStages", {
          ...stage,
          pipeline: "Did Not Hire",
        })
      )
    );

    return { message: "Default stages seeded successfully" };
  },
});
