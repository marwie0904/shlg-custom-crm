"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { AddInvoiceModal } from "@/components/invoices/AddInvoiceModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import {
  OpportunityWithRelated,
  Invoice,
  getContactDisplayName,
  getContactSource,
  MessageSource,
} from "@/lib/types/opportunities";
import { AddAppointmentModal, AppointmentData } from "@/components/calendars/AddAppointmentModal";
import { ContactMessages } from "@/components/conversations/ContactMessages";
import {
  FileText,
  MessageSquare,
  FolderOpen,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Receipt,
  Pencil,
  CheckSquare,
  CheckCircle2,
  Circle,
  Plus,
  GraduationCap,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

type TabType = "details" | "messages" | "tasks" | "documents";

interface OpportunityDetailModalProps {
  opportunityId: Id<"opportunities"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (data: { id: Id<"opportunities">; notes?: string; estimatedValue?: number }) => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "documents", label: "Documents", icon: FolderOpen },
];

const sourceColors: Record<MessageSource, { bg: string; text: string }> = {
  messenger: { bg: "bg-blue-500", text: "text-white" },
  instagram: { bg: "bg-pink-500", text: "text-white" },
  sms: { bg: "bg-green-500", text: "text-white" },
  email: { bg: "bg-gray-500", text: "text-white" },
};

const sourceLabels: Record<MessageSource, string> = {
  messenger: "Messenger",
  instagram: "Instagram",
  sms: "SMS",
  email: "Email",
};

export function OpportunityDetailModal({
  opportunityId,
  open,
  onOpenChange,
  onUpdate,
}: OpportunityDetailModalProps) {
  // Fetch full opportunity details when modal opens
  const opportunity = useQuery(
    api.opportunities.getWithRelated,
    opportunityId ? { id: opportunityId } : "skip"
  ) as OpportunityWithRelated | null | undefined;

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [editingValue, setEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(0);
  const [notes, setNotes] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("pending");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  // Local state for optimistic task updates
  const [localTaskStates, setLocalTaskStates] = useState<Record<string, boolean>>({});
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

  // Pipeline and stage state
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");

  const handleAppointmentClick = (apt: {
    _id: Id<"appointments">;
    title: string;
    type: string;
    date: number;
    time: string;
    status: string;
    notes?: string;
    contactId?: Id<"contacts">;
    staffId?: string;
    staffName?: string;
    participantFirstName?: string;
    participantLastName?: string;
    participantEmail?: string;
    participantPhone?: string;
    calendarId?: string;
    calendarName?: string;
    location?: string;
  }) => {
    setSelectedAppointment({
      _id: apt._id,
      title: apt.title,
      type: apt.type,
      date: apt.date,
      time: apt.time,
      status: apt.status,
      notes: apt.notes,
      contactId: apt.contactId,
      staffId: apt.staffId,
      staffName: apt.staffName,
      participantFirstName: apt.participantFirstName,
      participantLastName: apt.participantLastName,
      participantEmail: apt.participantEmail,
      participantPhone: apt.participantPhone,
      calendarId: apt.calendarId,
      calendarName: apt.calendarName,
      location: apt.location,
    });
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentModalClose = (open: boolean) => {
    setIsAppointmentModalOpen(open);
    if (!open) {
      setSelectedAppointment(null);
    }
  };

  // Fetch stages for display
  const stages = useQuery(api.pipelineStages.list, {});

  // Mutations
  const createTask = useMutation(api.tasks.create);
  const toggleTaskComplete = useMutation(api.tasks.toggleComplete);
  const moveToPipeline = useMutation(api.opportunities.moveToPipeline);

  const handleCreateTask = async (taskData: NewTaskData) => {
    if (!opportunity) return;
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description || undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).getTime() : undefined,
        assignedTo: taskData.assignedTo || undefined,
        assignedToName: taskData.assignedToName || undefined,
        opportunityId: opportunity._id,
        contactId: opportunity.contactId,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleToggleTaskComplete = async (taskId: Id<"tasks">) => {
    // Get current state (from local state or original task)
    const task = opportunity?.tasks.find(t => t._id === taskId);
    const currentState = localTaskStates[taskId] ?? task?.completed ?? false;

    // Optimistic update - toggle immediately in UI
    setLocalTaskStates(prev => ({
      ...prev,
      [taskId]: !currentState
    }));

    // Call API
    try {
      const result = await toggleTaskComplete({ id: taskId });

      // Show toast if opportunity was moved to Did Not Hire
      if (result.opportunityMoved && result.movedTo) {
        toast.success("Completed Final Follow Up", {
          description: `Moved Opportunity to: ${result.movedTo.stage}`,
          duration: 5000,
        });
        // Close the modal since the opportunity moved
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast.error("Failed to complete task");
      // Revert on error
      setLocalTaskStates(prev => ({
        ...prev,
        [taskId]: currentState
      }));
    }
  };

  // Helper to get task completed state (local optimistic state takes precedence)
  const getTaskCompleted = (taskId: string, originalCompleted: boolean): boolean => {
    return localTaskStates[taskId] ?? originalCompleted;
  };

  // Available pipelines
  const pipelines = ["Main Lead Flow", "Did Not Hire"];

  // Filter stages by selected pipeline
  const filteredStages = useMemo(() => {
    if (!stages || !selectedPipeline) return [];
    return stages
      .filter((s) => s.pipeline === selectedPipeline)
      .sort((a, b) => a.order - b.order);
  }, [stages, selectedPipeline]);

  // Handle pipeline change (local state only - saved on Save Changes)
  const handlePipelineChange = (newPipeline: string) => {
    if (!opportunity || newPipeline === selectedPipeline) return;

    setSelectedPipeline(newPipeline);

    // Get the first stage of the new pipeline
    const newPipelineStages = stages
      ?.filter((s) => s.pipeline === newPipeline)
      .sort((a, b) => a.order - b.order);

    if (newPipelineStages && newPipelineStages.length > 0) {
      const firstStage = newPipelineStages[0];
      setSelectedStageId(firstStage._id);
    }
  };

  // Handle stage change (local state only - saved on Save Changes)
  const handleStageChange = (newStageId: string) => {
    if (!opportunity || newStageId === selectedStageId) return;
    setSelectedStageId(newStageId);
  };

  // Reset state when opportunity changes or modal opens
  useEffect(() => {
    if (open && opportunity) {
      setTempValue(opportunity.estimatedValue);
      setNotes(opportunity.notes ?? "");
      setEditingValue(false);
      setActiveTab("details");
      setTaskFilter("pending");
      setLocalTaskStates({}); // Reset optimistic states when modal opens
      setSelectedPipeline(opportunity.pipelineId);
      setSelectedStageId(opportunity.stageId);
    }
  }, [open, opportunity]);

  // Loading state - show skeleton while fetching opportunity details
  const isLoading = opportunityId && opportunity === undefined;

  const stageName = opportunity
    ? stages?.find((s) => s._id === opportunity.stageId)?.name || opportunity.stageId
    : "";

  const contactName = opportunity ? getContactDisplayName(opportunity.contact) : "";
  const contactSource = opportunity ? getContactSource(opportunity.contact) : undefined;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWorkshopStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "attended":
      case "completed":
        return "bg-green-100 text-green-800";
      case "registered":
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "no-show":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderDetailsTab = () => {
    if (!opportunity) return null;
    return (
    <div className="space-y-6">
      {/* Contact Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <User className="h-4 w-4" />
          <span>Contact</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <Link
            href={`/contacts/${opportunity.contactId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 font-semibold text-gray-900 hover:text-brand transition-colors group"
          >
            {contactName}
            <ExternalLink className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand" />
          </Link>
          {opportunity.contact?.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-3.5 w-3.5 text-gray-400" />
              <span>{opportunity.contact.email}</span>
            </div>
          )}
          {opportunity.contact?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span>{opportunity.contact.phone}</span>
            </div>
          )}
          {contactSource && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Source:</span>
              <Badge
                className={`${sourceColors[contactSource].bg} ${sourceColors[contactSource].text} border-0`}
              >
                {sourceLabels[contactSource]}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Appointments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>Scheduled Appointments</span>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Schedule Appointment
          </Button>
        </div>
        {opportunity.appointments.length > 0 ? (
          <div className="space-y-2">
            {opportunity.appointments.map((apt) => (
              <div
                key={apt._id}
                onClick={() => handleAppointmentClick(apt)}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{apt.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(apt.date), "EEEE, MMMM d, yyyy")} at {apt.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${apt.status === "Completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} border-0`}>
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-center">
            No appointments scheduled
          </div>
        )}
      </div>

      {/* Workshops Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <GraduationCap className="h-4 w-4" />
          <span>Workshops</span>
        </div>
        {opportunity.workshops.length > 0 ? (
          <div className="space-y-2">
            {opportunity.workshops.map((workshop) => (
              <div
                key={workshop._id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{workshop.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(workshop.date), "EEEE, MMMM d, yyyy")} at {workshop.time}
                  </p>
                  {workshop.notes && (
                    <p className="text-xs text-gray-400 mt-1">{workshop.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${getWorkshopStatusColor(workshop.registrationStatus)} border-0 capitalize`}
                  >
                    {workshop.registrationStatus.replace("-", " ")}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-center">
            No workshops attended
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Receipt className="h-4 w-4" />
            <span>Invoices</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsAddInvoiceOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Invoice
          </Button>
        </div>
        {opportunity.invoices.length > 0 ? (
          <div className="space-y-2">
            {opportunity.invoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => {
                  setSelectedInvoice(inv);
                  setIsInvoiceDetailOpen(true);
                }}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{inv.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    {inv.dueDate ? `Due: ${format(new Date(inv.dueDate), "MMM d, yyyy")}` : `Issued: ${format(new Date(inv.issueDate), "MMM d, yyyy")}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {formatCurrency(inv.amount)}
                  </span>
                  <Badge
                    className={`${getInvoiceStatusColor(inv.status)} border-0 capitalize`}
                  >
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-center">
            No invoices
          </div>
        )}
      </div>

      {/* Estimated Value */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <DollarSign className="h-4 w-4" />
          <span>Estimated Value</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {editingValue ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(Number(e.target.value))}
                className="max-w-[150px]"
              />
              <Button
                size="sm"
                onClick={() => {
                  setEditingValue(false);
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTempValue(opportunity.estimatedValue);
                  setEditingValue(false);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">
                {formatCurrency(opportunity.estimatedValue)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingValue(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-500">
          Opportunity Notes
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this opportunity..."
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
  };

  const renderMessagesTab = () => {
    if (!opportunity) return null;
    return (
      <ContactMessages
        contactId={opportunity.contactId}
        className="h-[400px]"
      />
    );
  };

  const renderTasksTab = () => {
    if (!opportunity) return null;
    // Separate tasks into pending and completed using optimistic state
    const pendingTasks = opportunity.tasks.filter((task) => !getTaskCompleted(task._id, task.completed));
    const completedTasks = opportunity.tasks.filter((task) => getTaskCompleted(task._id, task.completed));

    const getDisplayTasks = () => {
      if (taskFilter === "pending") return pendingTasks;
      if (taskFilter === "completed") return completedTasks;
      return opportunity.tasks; // "all" - but we'll render separately
    };

    const renderTaskItem = (task: typeof opportunity.tasks[0]) => {
      const isCompleted = getTaskCompleted(task._id, task.completed);
      return (
        <div
          key={task._id}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <button
            className="mt-0.5 flex-shrink-0"
            onClick={() => handleToggleTaskComplete(task._id)}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm ${
                isCompleted ? "text-gray-400 line-through" : "text-gray-900"
              }`}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-gray-500 mt-1">{task.description}</p>
            )}
            {task.dueDate && (
              <p className="text-xs text-gray-400 mt-1">
                Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    };

    const renderTaskSection = (tasks: typeof opportunity.tasks, title?: string) => (
      <div className="space-y-2">
        {title && (
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</h4>
        )}
        {tasks.length > 0 ? (
          tasks.map(renderTaskItem)
        ) : (
          <div className="text-center py-4 text-sm text-gray-400">
            No {title?.toLowerCase() || "tasks"}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-500">Tasks</h3>
          <Button variant="outline" size="sm" onClick={() => setIsAddTaskOpen(true)}>
            Add Task
          </Button>
        </div>

        {/* Task Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setTaskFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                taskFilter === "all"
                  ? "bg-brand text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTaskFilter("pending")}
              className={`px-3 py-1.5 text-xs font-medium border-l transition-colors ${
                taskFilter === "pending"
                  ? "bg-brand text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setTaskFilter("completed")}
              className={`px-3 py-1.5 text-xs font-medium border-l transition-colors ${
                taskFilter === "completed"
                  ? "bg-brand text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Add Task Modal */}
        <AddTaskModal
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          onCreateTask={handleCreateTask}
          defaultContactId={opportunity.contactId}
          defaultOpportunityId={opportunity._id}
          hideLinkedFields={true}
        />

        {/* Task Lists */}
        {taskFilter === "all" ? (
          // Show separated sections for "All" view
          opportunity.tasks.length > 0 ? (
            <div className="space-y-6">
              {renderTaskSection(pendingTasks, `Pending (${pendingTasks.length})`)}
              {renderTaskSection(completedTasks, `Completed (${completedTasks.length})`)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No tasks yet</p>
              </div>
            </div>
          )
        ) : (
          // Show single list for filtered view
          getDisplayTasks().length > 0 ? (
            <div className="space-y-2">
              {getDisplayTasks().map(renderTaskItem)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No {taskFilter} tasks</p>
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const renderDocumentsTab = () => {
    if (!opportunity) return null;
    return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">Documents</h3>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Upload Document
        </Button>
      </div>

      {opportunity.documents && opportunity.documents.length > 0 ? (
        <div className="space-y-2">
          {opportunity.documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(doc.size)}
                  {doc.type && ` • ${doc.type.toUpperCase()}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {doc.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (doc.downloadUrl) {
                        window.open(doc.downloadUrl, '_blank')
                      }
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No documents yet</p>
            <p className="text-xs mt-1">Upload documents to attach them to this opportunity</p>
          </div>
        </div>
      )}
    </div>
  );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return renderDetailsTab();
      case "messages":
        return renderMessagesTab();
      case "tasks":
        return renderTasksTab();
      case "documents":
        return renderDocumentsTab();
      default:
        return renderDetailsTab();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-[1024px] sm:!max-w-[1024px] p-0 gap-0 overflow-hidden">
        {!opportunityId ? (
          // No opportunity selected
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500">No opportunity selected</p>
          </div>
        ) : isLoading ? (
          // Loading skeleton
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-start justify-between pr-8">
                <div className="space-y-3">
                  <DialogTitle className="sr-only">Loading opportunity details</DialogTitle>
                  <Skeleton className="h-7 w-64" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-[160px]" />
                    <Skeleton className="h-8 w-[200px]" />
                  </div>
                </div>
              </div>
            </DialogHeader>
            <div className="flex h-[60vh] min-h-[400px] max-h-[600px]">
              <div className="w-[180px] border-r bg-gray-50/50 p-2 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
              <div className="flex-1 p-6 space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
              <Skeleton className="h-8 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </>
        ) : opportunity ? (
          // Loaded content
          <>
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between pr-8">
            <div className="space-y-3">
              <DialogTitle className="flex items-center gap-2 text-xl">
                {opportunity.title}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedPipeline} onValueChange={handlePipelineChange}>
                  <SelectTrigger className="w-[160px] h-8 text-sm">
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
                <Select value={selectedStageId} onValueChange={handleStageChange}>
                  <SelectTrigger className="w-[200px] h-8 text-sm">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStages.map((stage) => (
                      <SelectItem key={stage._id} value={stage._id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex h-[60vh] min-h-[400px] max-h-[600px]">
          {/* Left Navigation */}
          <div className="w-[180px] border-r bg-gray-50/50 p-2">
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
                        ? "bg-brand text-white"
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
            Delete
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-brand hover:bg-brand/90"
              onClick={async () => {
                try {
                  // Save pipeline/stage if changed
                  const pipelineChanged = selectedPipeline !== opportunity.pipelineId;
                  const stageChanged = selectedStageId !== opportunity.stageId;

                  if (pipelineChanged || stageChanged) {
                    await moveToPipeline({
                      id: opportunity._id,
                      pipelineId: selectedPipeline,
                      stageId: selectedStageId,
                    });
                  }

                  // Save other fields
                  if (onUpdate) {
                    onUpdate({
                      id: opportunity._id,
                      notes,
                      estimatedValue: tempValue,
                    });
                  }

                  toast.success("Changes saved");
                  onOpenChange(false);
                } catch (error) {
                  console.error("Failed to save changes:", error);
                  toast.error("Failed to save changes");
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>

        {/* Appointment Modal */}
        <AddAppointmentModal
          open={isAppointmentModalOpen}
          onOpenChange={handleAppointmentModalClose}
          appointment={selectedAppointment}
        />

        {/* Add Invoice Modal */}
        <AddInvoiceModal
          open={isAddInvoiceOpen}
          onOpenChange={setIsAddInvoiceOpen}
          defaultContactId={opportunity.contactId}
          defaultOpportunityId={opportunity._id}
        />

        {/* Invoice Detail Modal */}
        <InvoiceDetailModal
          invoice={selectedInvoice}
          open={isInvoiceDetailOpen}
          onOpenChange={(open) => {
            setIsInvoiceDetailOpen(open);
            if (!open) setSelectedInvoice(null);
          }}
        />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
