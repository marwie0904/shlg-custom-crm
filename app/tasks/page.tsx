"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TaskWithRelated {
  _id: Id<"tasks">;
  _creationTime: number;
  title: string;
  description?: string;
  dueDate?: number;
  assignedTo?: string;
  assignedToName?: string;
  status?: string;
  completed: boolean;
  completedAt?: number;
  priority?: string;
  contactId?: Id<"contacts">;
  opportunityId?: Id<"opportunities">;
  workshopId?: Id<"workshops">;
  contactName: string | null;
  opportunityTitle: string | null;
  workshopTitle: string | null;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

type FilterType = "pending" | "complete" | "all";

function formatDate(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateText(text?: string, maxLength: number = 50): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

interface TaskTableProps {
  tasks: TaskWithRelated[];
  onToggleComplete: (taskId: Id<"tasks">) => void;
  animatingTasks: Set<string>;
  title?: string;
}

function TaskTable({ tasks, onToggleComplete, animatingTasks, title }: TaskTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {title && (
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Complete</span>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Assigned
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Linked To
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((task) => {
              const isAnimating = animatingTasks.has(task._id);
              return (
                <tr
                  key={task._id}
                  className={`hover:bg-gray-50 transition-all duration-300 cursor-pointer ${
                    isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={task.completed || isAnimating}
                      onCheckedChange={() => onToggleComplete(task._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-medium transition-all duration-300 ${
                        task.completed || isAnimating
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span
                      title={task.description}
                      className={`transition-all duration-300 ${
                        task.completed || isAnimating ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {truncateText(task.description)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className={`transition-all duration-300 ${task.completed || isAnimating ? "text-gray-400" : ""}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className={`transition-all duration-300 ${task.completed || isAnimating ? "text-gray-400" : ""}`}>
                      {task.assignedToName || task.assignedTo || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {task.workshopId ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                        Workshop
                      </span>
                    ) : (task.contactId || task.opportunityId) ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                        Contact/Opportunity
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className={`transition-all duration-300 ${task.completed || isAnimating ? "text-gray-400" : ""}`}>
                      {task.contactName || task.opportunityTitle || task.workshopTitle || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${
                        task.completed || isAnimating
                          ? "bg-green-100 text-green-700"
                          : statusColors[task.status || "Pending"] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {task.completed || isAnimating ? "Completed" : task.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("pending");
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Fetch tasks from Convex
  const allTasks = useQuery(api.tasks.listWithRelated, {}) as TaskWithRelated[] | undefined;

  // Mutations
  const toggleComplete = useMutation(api.tasks.toggleComplete);
  const createTask = useMutation(api.tasks.create);

  const handleCreateTask = async (taskData: NewTaskData) => {
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description || undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).getTime() : undefined,
        assignedTo: taskData.assignedTo || undefined,
        assignedToName: taskData.assignedToName || undefined,
        contactId: taskData.contactId as Id<"contacts"> | undefined,
        opportunityId: taskData.opportunityId as Id<"opportunities"> | undefined,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleToggleComplete = useCallback(async (taskId: Id<"tasks">) => {
    const task = allTasks?.find((t) => t._id === taskId);
    if (!task) return;

    // If completing a task (not uncompleting), animate first
    if (!task.completed) {
      // Start animation
      setAnimatingTasks((prev) => new Set(prev).add(taskId));

      // After animation, toggle the task
      setTimeout(async () => {
        try {
          const result = await toggleComplete({ id: taskId });

          // Show toast if opportunity was moved to Did Not Hire
          if (result.opportunityMoved && result.movedTo) {
            toast.success("Completed Final Follow Up", {
              description: `Moved Opportunity to: ${result.movedTo.stage}`,
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("Failed to toggle task:", error);
          toast.error("Failed to complete task");
        }
        setAnimatingTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 300);
    } else {
      // Uncompleting - no animation needed
      try {
        await toggleComplete({ id: taskId });
      } catch (error) {
        console.error("Failed to toggle task:", error);
      }
    }
  }, [allTasks, toggleComplete]);

  // Filter tasks by search query
  const filteredTasks = (allTasks ?? []).filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (task.status?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const pendingTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  const getDisplayTasks = () => {
    switch (filter) {
      case "pending":
        return pendingTasks;
      case "complete":
        return completedTasks;
      default:
        return filteredTasks;
    }
  };

  const isLoading = allTasks === undefined;

  // Skeleton loading component
  const TaskTableSkeleton = () => (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="w-12 px-4 py-3"><Skeleton className="h-4 w-4" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
              <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
              <th className="px-4 py-3"><Skeleton className="h-4 w-4" /></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Skeleton className="h-4 w-4 rounded" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="flex items-center gap-1 border-b pb-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>

        {/* Search and Add Task Row Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Table Skeleton */}
        <TaskTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            filter === "pending"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending
          {filter === "pending" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
          )}
        </button>
        <button
          onClick={() => setFilter("complete")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            filter === "complete"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Complete
          {filter === "complete" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
          )}
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            filter === "all"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All
          {filter === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
          )}
        </button>
      </div>

      {/* Search and Add Task Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsAddTaskOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onCreateTask={handleCreateTask}
      />

      {/* Tasks Table(s) */}
      {filter === "all" ? (
        <div className="space-y-6">
          <TaskTable
            tasks={pendingTasks}
            onToggleComplete={handleToggleComplete}
            animatingTasks={animatingTasks}
            title={`Pending (${pendingTasks.length})`}
          />
          <TaskTable
            tasks={completedTasks}
            onToggleComplete={handleToggleComplete}
            animatingTasks={animatingTasks}
            title={`Completed (${completedTasks.length})`}
          />
        </div>
      ) : (
        <>
          <TaskTable
            tasks={getDisplayTasks()}
            onToggleComplete={handleToggleComplete}
            animatingTasks={animatingTasks}
          />
          {/* Table Footer */}
          <div className="text-sm text-gray-500">
            Showing {getDisplayTasks().length} of {allTasks.length} tasks
          </div>
        </>
      )}
    </div>
  );
}
