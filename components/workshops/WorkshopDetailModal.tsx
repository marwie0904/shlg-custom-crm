"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileText,
  CheckSquare,
  Users,
  MapPin,
  Calendar,
  Clock,
  Pencil,
  CheckCircle2,
  Circle,
  Plus,
  User,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";

type TabType = "details" | "tasks" | "attendees";

interface WorkshopWithDetails {
  _id: Id<"workshops">;
  title: string;
  description?: string;
  notes?: string;
  location?: string;
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  date: number;
  time: string;
  status: string;
  maxCapacity: number;
  currentCapacity: number;
  type?: string;
  registrations: Array<{
    _id: Id<"workshopRegistrations">;
    contactId: Id<"contacts">;
    status: string;
    registeredAt: number;
    attendedAt?: number;
    contact: {
      _id: Id<"contacts">;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    } | null;
  }>;
  tasks: Array<{
    _id: Id<"tasks">;
    title: string;
    description?: string;
    dueDate?: number;
    status: string;
    completed: boolean;
    assignedToName?: string;
  }>;
  documents: Array<{
    _id: Id<"documents">;
    name: string;
    type?: string;
    size?: number;
    downloadUrl: string | null;
  }>;
}

interface WorkshopDetailModalProps {
  workshopId: Id<"workshops"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "attendees", label: "Attendees", icon: Users },
];

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Open: "bg-blue-100 text-blue-700",
  Upcoming: "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Full: "bg-purple-100 text-purple-700",
};

const registrationStatusColors: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  attended: "bg-green-100 text-green-700",
  "no-show": "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export function WorkshopDetailModal({
  workshopId,
  open,
  onOpenChange,
}: WorkshopDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Fetch workshop with details
  const workshop = useQuery(
    api.workshops.getWithDetails,
    workshopId ? { id: workshopId } : "skip"
  ) as WorkshopWithDetails | null | undefined;

  // Mutations
  const createTask = useMutation(api.tasks.create);
  const toggleTaskComplete = useMutation(api.tasks.toggleComplete);
  const updateWorkshopStatus = useMutation(api.workshops.updateStatus);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("details");
      setIsAddTaskOpen(false);
    }
  }, [open]);

  const handleCreateTask = async (taskData: NewTaskData) => {
    if (!workshopId) return;
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description || undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).getTime() : undefined,
        assignedTo: taskData.assignedTo || undefined,
        assignedToName: taskData.assignedToName || undefined,
        workshopId,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleToggleTaskComplete = async (taskId: Id<"tasks">) => {
    try {
      const result = await toggleTaskComplete({ id: taskId });

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
  };

  if (!workshop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] !max-w-[900px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Workshop Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-gray-500">Loading...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatAddress = () => {
    if (workshop.location) return workshop.location;
    const parts = [
      workshop.streetAddress,
      workshop.streetAddress2,
      workshop.city,
      workshop.state,
      workshop.postalCode,
    ].filter(Boolean);
    return parts.join(", ") || "No location specified";
  };

  const renderDetailsTab = () => (
    <div className="space-y-6">
      {/* Workshop Info Card */}
      <div className="bg-gray-50 rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{workshop.title}</h3>
            {workshop.type && (
              <p className="text-sm text-gray-500 capitalize">{workshop.type}</p>
            )}
          </div>
          <Badge className={`${statusColors[workshop.status] || "bg-gray-100 text-gray-700"} border-0`}>
            {workshop.status}
          </Badge>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            <span className="font-medium">{workshop.currentCapacity}</span>
            {" / "}
            <span>{workshop.maxCapacity}</span>
            {" attendees"}
          </span>
          {workshop.currentCapacity >= workshop.maxCapacity && (
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">Full</Badge>
          )}
        </div>

        {/* Description */}
        {workshop.description && (
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Description</p>
            <p className="text-sm text-gray-700">{workshop.description}</p>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>Location</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{formatAddress()}</p>
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Date</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {format(new Date(workshop.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Time</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{workshop.time}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {workshop.notes && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">Notes</p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{workshop.notes}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddTaskOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onCreateTask={handleCreateTask}
        defaultWorkshopId={workshopId!}
        hideLinkedFields={true}
      />

      {workshop.tasks.length > 0 ? (
        <div className="space-y-2">
          {workshop.tasks.map((task) => (
            <div
              key={task._id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <button
                className="mt-0.5 flex-shrink-0"
                onClick={() => handleToggleTaskComplete(task._id)}
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium text-sm ${
                    task.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {task.dueDate && (
                    <p className="text-xs text-gray-400">
                      Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                  {task.assignedToName && (
                    <p className="text-xs text-gray-400">
                      Assigned to: {task.assignedToName}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          <div className="text-center">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No tasks yet</p>
            <p className="text-xs mt-1">Add tasks to track workshop preparation</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAttendeesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">
          Attendees ({workshop.registrations.length})
        </h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Attendee
        </Button>
      </div>

      {workshop.registrations.length > 0 ? (
        <div className="space-y-2">
          {workshop.registrations.map((registration) => (
            <div
              key={registration._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  {registration.contact ? (
                    <>
                      <Link
                        href={`/contacts/${registration.contactId}`}
                        target="_blank"
                        className="font-medium text-gray-900 hover:text-blue-600 inline-flex items-center gap-1"
                      >
                        {registration.contact.firstName} {registration.contact.lastName}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {registration.contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {registration.contact.email}
                          </span>
                        )}
                        {registration.contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {registration.contact.phone}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Contact not found</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={`${
                    registrationStatusColors[registration.status] || "bg-gray-100 text-gray-700"
                  } border-0 capitalize`}
                >
                  {registration.status.replace("-", " ")}
                </Badge>
                <p className="text-xs text-gray-400">
                  {format(new Date(registration.registeredAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No attendees registered</p>
            <p className="text-xs mt-1">Add contacts to register them for this workshop</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return renderDetailsTab();
      case "tasks":
        return renderTasksTab();
      case "attendees":
        return renderAttendeesTab();
      default:
        return renderDetailsTab();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-[900px] sm:!max-w-[900px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                {workshop.title}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  className={`${statusColors[workshop.status] || "bg-gray-100 text-gray-700"} border-0`}
                >
                  {workshop.status}
                </Badge>
                {workshop.type && (
                  <Badge variant="outline" className="capitalize">
                    {workshop.type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex h-[55vh] min-h-[350px] max-h-[500px]">
          {/* Left Navigation */}
          <div className="w-[160px] border-r bg-gray-50/50 p-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">{renderContent()}</div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
          <Button variant="destructive" size="sm">
            Delete Workshop
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onOpenChange(false)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
