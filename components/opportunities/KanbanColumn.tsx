"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OpportunityCard } from "./OpportunityCard";
import { OpportunityForKanban, Stage } from "@/lib/types/opportunities";
import { Circle } from "lucide-react";

interface KanbanColumnProps {
  stage: Stage;
  opportunities: OpportunityForKanban[];
  onOpportunityClick?: (opportunity: OpportunityForKanban) => void;
}

export function KanbanColumn({ stage, opportunities, onOpportunityClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage._id,
    data: {
      type: "column",
      stage,
    },
  });

  const totalValue = opportunities.reduce(
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

  // Determine indicator color based on stage name/position
  const getIndicatorColor = (stageName: string): string => {
    const nameLower = stageName.toLowerCase();

    // Fresh/New leads - blue
    if (nameLower.includes("fresh") || nameLower.includes("new")) {
      return "text-blue-500";
    }
    // Pending stages - amber
    if (nameLower.includes("pending")) {
      return "text-amber-500";
    }
    // Scheduled stages - blue
    if (nameLower.includes("scheduled")) {
      return "text-blue-500";
    }
    // Cancelled/No Show stages - red
    if (nameLower.includes("cancelled") || nameLower.includes("no show") || nameLower.includes("no-show")) {
      return "text-red-500";
    }
    // Engaged/Completed - green
    if (nameLower.includes("engaged") || nameLower.includes("completed") || nameLower.includes("paid")) {
      return "text-green-500";
    }
    // Rejected/Did Not Hire - red
    if (nameLower.includes("rejected") || nameLower.includes("did not") || nameLower.includes("hired other")) {
      return "text-red-500";
    }
    // Default - gray
    return "text-gray-400";
  };

  const opportunityIds = opportunities.map((opp) => opp._id);

  return (
    <div
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg transition-colors ${
        isOver ? "bg-blue-50 ring-2 ring-blue-200" : "bg-gray-50"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Circle
              className={`h-2.5 w-2.5 fill-current ${getIndicatorColor(stage.name)}`}
            />
            <h3 className="font-medium text-gray-900 text-sm truncate max-w-[180px]">
              {stage.name}
            </h3>
          </div>
          <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
            {opportunities.length}
          </span>
        </div>
        <p className="text-xs text-gray-500">{formatCurrency(totalValue)}</p>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 h-[calc(100vh-280px)]">
        <div ref={setNodeRef} className="p-2 space-y-2 min-h-[100px]">
          <SortableContext
            items={opportunityIds}
            strategy={verticalListSortingStrategy}
          >
            {opportunities.length > 0 ? (
              opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity._id}
                  opportunity={opportunity}
                  onClick={onOpportunityClick}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No opportunities
              </div>
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
