"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface PipelineSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditingStage {
  id: Id<"pipelineStages">;
  name: string;
}

export function PipelineSettingsModal({
  open,
  onOpenChange,
}: PipelineSettingsModalProps) {
  // State
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<EditingStage | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [isCreatingStage, setIsCreatingStage] = useState(false);

  // Queries
  const pipelinesGrouped = useQuery(api.pipelineStages.listAllGrouped);

  // Mutations
  const createStage = useMutation(api.pipelineStages.create);
  const updateStage = useMutation(api.pipelineStages.update);
  const deleteStage = useMutation(api.pipelineStages.remove);

  // Handle create new pipeline (by creating a stage in it)
  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) return;

    setIsCreatingPipeline(true);
    try {
      await createStage({
        name: "New Stage",
        pipeline: newPipelineName.trim(),
        order: 1,
      });
      setNewPipelineName("");
      setSelectedPipeline(newPipelineName.trim());
    } catch (error) {
      console.error("Failed to create pipeline:", error);
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  // Handle create new stage
  const handleCreateStage = async (pipelineName: string) => {
    if (!newStageName.trim()) return;

    setIsCreatingStage(true);
    try {
      // Get current max order for this pipeline
      const pipeline = pipelinesGrouped?.find((p) => p.name === pipelineName);
      const maxOrder = pipeline?.stages.reduce((max, s) => Math.max(max, s.order), 0) ?? 0;

      await createStage({
        name: newStageName.trim(),
        pipeline: pipelineName,
        order: maxOrder + 1,
      });
      setNewStageName("");
    } catch (error) {
      console.error("Failed to create stage:", error);
    } finally {
      setIsCreatingStage(false);
    }
  };

  // Handle update stage name
  const handleUpdateStage = async () => {
    if (!editingStage || !editingStage.name.trim()) return;

    try {
      await updateStage({
        id: editingStage.id,
        name: editingStage.name.trim(),
      });
      setEditingStage(null);
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  // Handle delete stage
  const handleDeleteStage = async (stageId: Id<"pipelineStages">) => {
    if (!confirm("Are you sure you want to delete this stage? Opportunities in this stage will need to be moved.")) {
      return;
    }

    try {
      await deleteStage({ id: stageId });
    } catch (error) {
      console.error("Failed to delete stage:", error);
    }
  };

  const isLoading = pipelinesGrouped === undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pipeline Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Create New Pipeline */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">Create New Pipeline</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Pipeline name..."
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePipeline();
                  }}
                />
                <Button
                  onClick={handleCreatePipeline}
                  disabled={!newPipelineName.trim() || isCreatingPipeline}
                >
                  {isCreatingPipeline ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create
                </Button>
              </div>
            </div>

            {/* Existing Pipelines */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Pipelines & Stages</h3>
              <Accordion
                type="single"
                collapsible
                value={selectedPipeline ?? undefined}
                onValueChange={(value: string) => setSelectedPipeline(value || null)}
                className="space-y-2"
              >
                {pipelinesGrouped?.map((pipeline) => (
                  <AccordionItem
                    key={pipeline.name}
                    value={pipeline.name}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{pipeline.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pipeline.stages.length} stages
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* Stage List */}
                      <div className="space-y-2 mb-4">
                        {pipeline.stages.map((stage, index) => (
                          <div
                            key={stage._id}
                            className="flex items-center gap-2 p-2 bg-white border rounded-md group"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <span className="text-sm text-gray-500 w-6">
                              {index + 1}.
                            </span>

                            {editingStage?.id === stage._id ? (
                              <>
                                <Input
                                  value={editingStage.name}
                                  onChange={(e) =>
                                    setEditingStage({
                                      ...editingStage,
                                      name: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleUpdateStage();
                                    if (e.key === "Escape") setEditingStage(null);
                                  }}
                                  className="flex-1 h-8"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleUpdateStage}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingStage(null)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-gray-500" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm">{stage.name}</span>
                                {stage.color && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                  />
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditingStage({ id: stage._id, name: stage.name })
                                  }
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteStage(stage._id)}
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add New Stage */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="New stage name..."
                          value={selectedPipeline === pipeline.name ? newStageName : ""}
                          onChange={(e) => setNewStageName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateStage(pipeline.name);
                          }}
                          onFocus={() => setSelectedPipeline(pipeline.name)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCreateStage(pipeline.name)}
                          disabled={
                            !newStageName.trim() ||
                            isCreatingStage ||
                            selectedPipeline !== pipeline.name
                          }
                        >
                          {isCreatingStage && selectedPipeline === pipeline.name ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          Add Stage
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {pipelinesGrouped?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pipelines created yet. Create your first pipeline above.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
