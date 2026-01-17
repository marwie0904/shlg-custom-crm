"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, MoreHorizontal, Calendar as CalendarIcon, User, X } from "lucide-react";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useMockTasks, useMockMutation } from "@/lib/hooks/use-mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// Mock users for testing the filter UI
const MOCK_USERS = [
  { _id: "1", name: "Jacqui Calma", email: "jacqui@shlf.com", role: "staff" },
  { _id: "2", name: "Andy Baker", email: "andy@shlf.com", role: "attorney" },
  { _id: "3", name: "Gabriella Ang", email: "gabriella@shlf.com", role: "paralegal" },
  { _id: "4", name: "Mar Wie Ang", email: "marwie@shlf.com", role: "admin" },
];

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
  attempt?: number;
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

function isDateInRange(dueDate: number | undefined, dateRange: DateRange | undefined): boolean {
  // If no date range filter is set, show all tasks
  if (!dateRange || (!dateRange.from && !dateRange.to)) return true;

  // If task has no due date, don't show it when filtering by date
  if (!dueDate) return false;

  const taskDate = new Date(dueDate);
  // Reset time to start of day for comparison
  const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

  // Single date selected (from only)
  if (dateRange.from && !dateRange.to) {
    const fromDay = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    return taskDay.getTime() === fromDay.getTime();
  }

  // Date range selected
  if (dateRange.from && dateRange.to) {
    const fromDay = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const toDay = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
    return taskDay >= fromDay && taskDay <= toDay;
  }

  return true;
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
                Attempt
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
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className={`transition-all duration-300 ${task.completed || isAnimating ? "text-gray-400" : ""}`}>
                      {task.attempt || "—"}
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
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Use mock data or real Convex data based on environment
  const mockTasks = useMockTasks({ searchQuery: searchQuery || undefined });
  const mockMutation = useMockMutation();

  // Fetch users for the filter dropdown (use mock data for now)
  const convexUsers = useQuery(api.users.list, USE_MOCK_DATA ? "skip" : {}) ?? [];
  const users = convexUsers.length > 0 ? convexUsers : MOCK_USERS;

  // Fetch tasks from Convex (or skip if mock mode)
  const convexTasks = useQuery(
    USE_MOCK_DATA ? "skip" : api.tasks.listWithRelated,
    USE_MOCK_DATA ? "skip" : {}
  ) as TaskWithRelated[] | undefined;

  // Use Convex tasks if available, otherwise fall back to mock tasks for testing
  const allTasks = USE_MOCK_DATA
    ? (mockTasks as unknown as TaskWithRelated[])
    : (convexTasks && convexTasks.length > 0 ? convexTasks : (mockTasks as unknown as TaskWithRelated[]));

  // Mutations (use mock in demo mode)
  const toggleComplete = USE_MOCK_DATA ? mockMutation : useMutation(api.tasks.toggleComplete);
  const createTask = USE_MOCK_DATA ? mockMutation : useMutation(api.tasks.create);

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

  // Filter tasks by search query, user, and date
  const filteredTasks = useMemo(() => {
    return (allTasks ?? []).filter((task) => {
      // Search filter
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (task.status?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // User filter
      const matchesUser =
        userFilter === "all" ||
        task.assignedTo === userFilter ||
        task.assignedToName === userFilter;

      // Date filter
      const matchesDate = isDateInRange(task.dueDate, dateRange);

      return matchesSearch && matchesUser && matchesDate;
    });
  }, [allTasks, searchQuery, userFilter, dateRange]);

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

  const isLoading = !USE_MOCK_DATA && allTasks === undefined;

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
                <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
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

        {/* Search, Filters, and Add Task Row Skeleton */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[240px]" />
          </div>
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

      {/* Search, Filters, and Add Task Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[180px]">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id} value={user.name}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-[240px] justify-start text-left font-normal ${
                  !dateRange ? "text-muted-foreground" : ""
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} -{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>Filter by date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              <div className="flex items-center justify-between p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDateRange(undefined)}
                >
                  Clear
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setDateRange({ from: today, to: today });
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6);
                      setDateRange({ from: startOfWeek, to: endOfWeek });
                    }}
                  >
                    This Week
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDateRange(undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
