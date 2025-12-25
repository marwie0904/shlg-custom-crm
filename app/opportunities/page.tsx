"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanColumn } from "@/components/opportunities/KanbanColumn";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { OpportunityDetailModal } from "@/components/opportunities/OpportunityDetailModal";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { Plus, CheckSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OpportunityForKanban,
  Stage,
  PipelineName,
} from "@/lib/types/opportunities";

const pipelines: PipelineName[] = ["Main Lead Flow", "Did Not Hire"];

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-2 text-gray-500">Loading opportunities...</p>
      </div>
    }>
      <OpportunitiesContent />
    </Suspense>
  );
}

function OpportunitiesContent() {
  const [selectedPipeline, setSelectedPipeline] =
    useState<PipelineName>("Main Lead Flow");
  const [activeOpportunity, setActiveOpportunity] =
    useState<OpportunityForKanban | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] =
    useState<Id<"opportunities"> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Fetch pipeline stages from Convex
  const stages = useQuery(api.pipelineStages.getByPipeline, {
    pipeline: selectedPipeline,
  });

  // Fetch lightweight opportunities for Kanban board (only card data)
  const opportunitiesData = useQuery(api.opportunities.listForKanban, {
    pipelineId: selectedPipeline,
  });

  // Mutations
  const moveToStage = useMutation(api.opportunities.moveToStage);
  const updateOpportunity = useMutation(api.opportunities.update);
  const createTask = useMutation(api.tasks.create);

  const handleCreateTask = async (taskData: NewTaskData) => {
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description || undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).getTime() : undefined,
        assignedTo: taskData.assignedTo || undefined,
        assignedToName: taskData.assignedToName || undefined,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter stages by selected pipeline (already sorted by API)
  const filteredStages = useMemo(() => {
    return (stages ?? []) as Stage[];
  }, [stages]);

  // Filter opportunities by selected pipeline
  const filteredOpportunities = useMemo(() => {
    return (opportunitiesData ?? []) as OpportunityForKanban[];
  }, [opportunitiesData]);

  // Calculate totals
  const totalOpportunities = filteredOpportunities.length;
  const totalValue = filteredOpportunities.reduce(
    (sum, opp) => sum + opp.estimatedValue,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get opportunities for a specific stage (using stage _id as string)
  const getOpportunitiesForStage = (stageId: string) => {
    return filteredOpportunities.filter((opp) => opp.stageId === stageId);
  };

  // Find opportunity by ID
  const findOpportunity = (id: string) => {
    return filteredOpportunities.find((opp) => opp._id === id);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const opportunity = findOpportunity(active.id as string);
    if (opportunity) {
      setActiveOpportunity(opportunity);
    }
  };

  // Handle drag over (for visual feedback) - optimistic update
  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback is handled by DndKit's built-in styling
    // We'll perform the actual mutation on drag end
  };

  // Handle drag end - persist change to Convex
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active opportunity
    const activeOpp = findOpportunity(activeId);
    if (!activeOpp) return;

    // Check if dropped on a column (stage)
    const overStage = filteredStages.find((stage) => stage._id === overId);
    if (overStage && activeOpp.stageId !== overId) {
      try {
        await moveToStage({
          id: activeId as Id<"opportunities">,
          stageId: overId,
        });
      } catch (error) {
        console.error("Failed to move opportunity:", error);
      }
      return;
    }

    // Check if dropped on another opportunity
    const overOpp = findOpportunity(overId);
    if (overOpp && overOpp.stageId !== activeOpp.stageId) {
      try {
        await moveToStage({
          id: activeId as Id<"opportunities">,
          stageId: overOpp.stageId,
        });
      } catch (error) {
        console.error("Failed to move opportunity:", error);
      }
    }
  };

  // Handle opportunity card click
  const handleOpportunityClick = (opportunity: OpportunityForKanban) => {
    setSelectedOpportunityId(opportunity._id);
    setIsModalOpen(true);
  };

  // Handle opportunity update from modal
  const handleOpportunityUpdate = async (updatedData: {
    id: Id<"opportunities">;
    notes?: string;
    estimatedValue?: number;
  }) => {
    try {
      await updateOpportunity({
        id: updatedData.id,
        notes: updatedData.notes,
        estimatedValue: updatedData.estimatedValue,
      });
      // The UI will automatically update via Convex's reactive queries
    } catch (error) {
      console.error("Failed to update opportunity:", error);
    }
  };

  // Handle URL params for deep-linking to specific opportunity
  const searchParams = useSearchParams();

  useEffect(() => {
    const opportunityId = searchParams.get('id');
    if (opportunityId) {
      setSelectedOpportunityId(opportunityId as Id<"opportunities">);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Loading state
  const isLoading = stages === undefined || opportunitiesData === undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>

        {/* Pipeline Selector Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-[220px]" />
        </div>

        {/* Kanban Board Skeleton */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-4 pb-4 min-h-full">
            {/* Skeleton Columns */}
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div
                key={col}
                className="flex flex-col min-w-[280px] w-[280px] rounded-lg bg-gray-50"
              >
                {/* Column Header Skeleton */}
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-6 rounded" />
                  </div>
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>

                {/* Column Cards Skeleton */}
                <div className="p-2 space-y-2">
                  {[1, 2, 3].slice(0, col % 3 + 1).map((card) => (
                    <div
                      key={card}
                      className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                      <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalOpportunities} opportunities &bull;{" "}
            {formatCurrency(totalValue)} total value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddTaskOpen(true)}>
            <CheckSquare className="h-4 w-4" />
            Add Task
          </Button>
          <Button className="bg-brand hover:bg-brand/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Pipeline Selector */}
      <div className="mb-6">
        <Select
          value={selectedPipeline}
          onValueChange={(value) => setSelectedPipeline(value as PipelineName)}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((pipeline) => (
              <SelectItem key={pipeline} value={pipeline}>
                {pipeline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ScrollArea className="w-full h-full">
            <div className="flex gap-4 pb-4 min-h-full">
              {filteredStages.map((stage) => (
                <KanbanColumn
                  key={stage._id}
                  stage={stage}
                  opportunities={getOpportunitiesForStage(stage._id)}
                  onOpportunityClick={handleOpportunityClick}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <DragOverlay>
            {activeOpportunity ? (
              <div className="rotate-3">
                <OpportunityCard opportunity={activeOpportunity} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunityId={selectedOpportunityId}
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setSelectedOpportunityId(null);
        }}
        onUpdate={handleOpportunityUpdate}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
