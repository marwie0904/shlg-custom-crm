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
import { AddRelatedContactModal } from "@/components/opportunities/AddRelatedContactModal";
import {
  FileText,
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
  History,
  ClipboardList,
  Send,
  StickyNote,
  XCircle,
  UserPlus,
  MapPin,
  Check,
  X,
  MessageSquare,
  Facebook,
  Instagram,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

type TabType = "details" | "logs" | "tasks" | "intake" | "documents";

interface OpportunityDetailModalProps {
  opportunityId: Id<"opportunities"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (data: { id: Id<"opportunities">; notes?: string; estimatedValue?: number }) => void;
}

const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "logs", label: "Logs", icon: History },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "intake", label: "Intake", icon: ClipboardList },
  { id: "documents", label: "Documents", icon: FolderOpen },
];

// Mock intake form types for dropdown
const intakeFormTypes = [
  { id: "estate_planning", name: "Estate Planning Intake" },
  { id: "pbta", name: "PBTA Intake" },
  { id: "medicaid", name: "Medicaid Intake" },
  { id: "deed", name: "Deed Intake" },
  { id: "doc_review", name: "Doc Review Intake" },
  { id: "general", name: "General Intake" },
];

// Closure point tags for "Did Not Hire"
const closurePointTags = [
  { id: "pre_contact", name: "Pre-Contact" },
  { id: "pre_intake", name: "Pre-intake" },
  { id: "pre_iv", name: "Pre-I/V" },
  { id: "post_iv", name: "Post-I/V" },
];

// Mock log entry type
interface LogEntry {
  id: string;
  type: "communication" | "note" | "update" | "task" | "appointment" | "invoice";
  title: string;
  description?: string;
  timestamp: number;
  source?: string;
  user?: string;
}

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

  // Fetch conversations for this contact (for Messenger/Instagram leads)
  const contactConversations = useQuery(
    api.conversations.getByContactId,
    opportunity?.contactId ? { contactId: opportunity.contactId } : "skip"
  );

  // Check if contact has Messenger or Instagram conversation
  const messengerConversation = contactConversations?.find(c => c.source === "messenger");
  const instagramConversation = contactConversations?.find(c => c.source === "instagram");
  const socialConversation = messengerConversation || instagramConversation;
  const hasMessagingConversation = !!socialConversation;

  // Fetch messages for the social conversation (limit to 3 most recent)
  const conversationMessages = useQuery(
    api.conversations.getMessages,
    socialConversation?._id ? { conversationId: socialConversation._id, limit: 3 } : "skip"
  );

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

  // Intake form state
  const [selectedIntakeForm, setSelectedIntakeForm] = useState<string>("estate_planning");

  // Did Not Hire modal state
  const [isDidNotHireOpen, setIsDidNotHireOpen] = useState(false);
  const [didNotHireTag, setDidNotHireTag] = useState<string>("");
  const [didNotHireReason, setDidNotHireReason] = useState<string>("");

  // Related contact modal state
  const [isAddRelatedContactOpen, setIsAddRelatedContactOpen] = useState(false);

  // Editable opportunity details state (auto-save on blur)
  const [tempTitle, setTempTitle] = useState("");
  const [tempNotes, setTempNotes] = useState("");

  // Editable contact details state (auto-save on blur)
  const [tempContactFirstName, setTempContactFirstName] = useState("");
  const [tempContactLastName, setTempContactLastName] = useState("");
  const [tempContactEmail, setTempContactEmail] = useState("");
  const [tempContactPhone, setTempContactPhone] = useState("");

  // Referral state (auto-save on blur/change)
  const [tempReferralSource, setTempReferralSource] = useState("");
  const [tempReferralOther, setTempReferralOther] = useState("");
  const [tempLeadSource, setTempLeadSource] = useState("");

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
  const updateOpportunity = useMutation(api.opportunities.update);
  const updateContact = useMutation(api.contacts.update);

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
      toast.success("Task created");
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
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

  // Get "Did Not Hire" stages for reason dropdown
  const didNotHireStages = useMemo(() => {
    if (!stages) return [];
    return stages
      .filter((s: { pipeline: string }) => s.pipeline === "Did Not Hire")
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  }, [stages]);

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

  // Handle "Did Not Hire" submission
  const handleDidNotHireSubmit = async () => {
    if (!opportunity || !didNotHireReason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      await moveToPipeline({
        id: opportunity._id,
        pipelineId: "Did Not Hire",
        stageId: didNotHireReason,
        didNotHirePoint: didNotHireTag || undefined,
      });

      // Get tag name for the toast
      const tagName = closurePointTags.find((t) => t.id === didNotHireTag)?.name || "";
      const stageName = didNotHireStages.find((s: { _id: string }) => s._id === didNotHireReason)?.name || "";

      toast.success("Opportunity marked as Did Not Hire", {
        description: `${tagName ? `Closure point: ${tagName}` : ""}${stageName ? ` - ${stageName}` : ""}`,
        duration: 5000,
      });

      // Reset modal state
      setIsDidNotHireOpen(false);
      setDidNotHireTag("");
      setDidNotHireReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to mark as Did Not Hire:", error);
      toast.error("Failed to mark as Did Not Hire");
    }
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

      // Reset editable fields (auto-save)
      setTempTitle(opportunity.title);
      setTempNotes(opportunity.notes ?? "");

      // Reset contact fields (auto-save)
      setTempContactFirstName(opportunity.contact?.firstName ?? "");
      setTempContactLastName(opportunity.contact?.lastName ?? "");
      setTempContactEmail(opportunity.contact?.email ?? "");
      setTempContactPhone(opportunity.contact?.phone ?? "");

      // Reset referral fields (auto-save)
      setTempLeadSource(opportunity.contact?.source ?? "");
      setTempReferralSource("");
      setTempReferralOther("");
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

  // Lead source options for dropdown
  const leadSourceOptions = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "workshop", label: "Workshop" },
    { value: "social_media", label: "Social Media" },
    { value: "messenger", label: "Messenger" },
    { value: "instagram", label: "Instagram" },
    { value: "google_ads", label: "Google Ads" },
    { value: "facebook_ads", label: "Facebook Ads" },
    { value: "walk_in", label: "Walk-in" },
    { value: "phone", label: "Phone Call" },
    { value: "other", label: "Other" },
  ];

  // Auto-save contact field on blur
  const handleContactFieldBlur = async (field: string, value: string) => {
    if (!opportunity?.contact) return;
    const originalValue = field === "firstName" ? opportunity.contact.firstName :
                          field === "lastName" ? opportunity.contact.lastName :
                          field === "email" ? opportunity.contact.email :
                          field === "phone" ? opportunity.contact.phone : "";
    if (value === originalValue) return; // No change

    try {
      await updateContact({
        id: opportunity.contactId,
        [field]: value || undefined,
      });
      toast.success("Contact updated");
    } catch (error) {
      console.error("Failed to update contact:", error);
      toast.error("Failed to save");
    }
  };

  // Auto-save referral field on blur
  const handleReferralFieldBlur = async (field: string, value: string) => {
    if (!opportunity?.contact) return;
    try {
      await updateContact({
        id: opportunity.contactId,
        [field]: value || undefined,
      });
      toast.success("Updated");
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to save");
    }
  };

  const renderDetailsTab = () => {
    if (!opportunity) return null;
    return (
    <div className="space-y-6">
      {/* Contact Section - Always Editable with Auto-Save */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <User className="h-4 w-4" />
            <span>Contact</span>
          </div>
          <div className="flex items-center gap-3">
            {hasMessagingConversation && (
              <Link
                href="/conversations"
                className={`text-xs flex items-center gap-1 transition-colors ${
                  messengerConversation
                    ? "text-[#0084ff] hover:text-[#0084ff]/80"
                    : "text-[#E4405F] hover:text-[#E4405F]/80"
                }`}
              >
                {messengerConversation ? (
                  <Facebook className="h-3 w-3" />
                ) : (
                  <Instagram className="h-3 w-3" />
                )}
                View Messages
              </Link>
            )}
            <Link
              href={`/contacts/${opportunity.contactId}`}
              target="_blank"
              className="text-xs text-brand hover:text-brand/80 flex items-center gap-1 transition-colors"
            >
              View Full Profile
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">First Name</label>
              <Input
                value={tempContactFirstName}
                onChange={(e) => setTempContactFirstName(e.target.value)}
                onBlur={(e) => handleContactFieldBlur("firstName", e.target.value)}
                className="mt-1 h-9 bg-white"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Last Name</label>
              <Input
                value={tempContactLastName}
                onChange={(e) => setTempContactLastName(e.target.value)}
                onBlur={(e) => handleContactFieldBlur("lastName", e.target.value)}
                className="mt-1 h-9 bg-white"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Email</label>
            <Input
              type="email"
              value={tempContactEmail}
              onChange={(e) => setTempContactEmail(e.target.value)}
              onBlur={(e) => handleContactFieldBlur("email", e.target.value)}
              className="mt-1 h-9 bg-white"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Phone</label>
            <Input
              type="tel"
              value={tempContactPhone}
              onChange={(e) => setTempContactPhone(e.target.value)}
              onBlur={(e) => handleContactFieldBlur("phone", e.target.value)}
              className="mt-1 h-9 bg-white"
              placeholder="(555) 555-5555"
            />
          </div>
        </div>
      </div>

      {/* Referral Section - Always Editable with Auto-Save */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <UserPlus className="h-4 w-4" />
          <span>Lead Source / Referral</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500">Lead Source</label>
            <Select
              value={tempLeadSource}
              onValueChange={async (value) => {
                setTempLeadSource(value);
                await handleReferralFieldBlur("source", value);
              }}
            >
              <SelectTrigger className="mt-1 h-9 bg-white">
                <SelectValue placeholder="Select lead source" />
              </SelectTrigger>
              <SelectContent>
                {leadSourceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Referrer Name</label>
            <Input
              value={tempReferralSource}
              onChange={(e) => setTempReferralSource(e.target.value)}
              onBlur={(e) => handleReferralFieldBlur("referralSource", e.target.value)}
              placeholder="Who referred this lead?"
              className="mt-1 h-9 bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Additional Details</label>
            <Input
              value={tempReferralOther}
              onChange={(e) => setTempReferralOther(e.target.value)}
              onBlur={(e) => handleReferralFieldBlur("referralOther", e.target.value)}
              placeholder="Any other referral details..."
              className="mt-1 h-9 bg-white"
            />
          </div>
          {/* Link to Intake Tab */}
          <div className="pt-2 border-t">
            <button
              onClick={() => setActiveTab("intake")}
              className="text-sm text-brand hover:text-brand/80 flex items-center gap-1.5 transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              View Intake Form Details
            </button>
          </div>
        </div>
      </div>

      {/* Related Contacts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <UserPlus className="h-4 w-4" />
            <span>Related Contacts</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsAddRelatedContactOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Related Contact
          </Button>
        </div>
        {opportunity.relatedContacts && opportunity.relatedContacts.length > 0 ? (
          <div className="space-y-2">
            {opportunity.relatedContacts.map((rc: { _id: Id<"opportunityContacts">; relationship: string; notes?: string; contact: { _id: Id<"contacts">; firstName: string; lastName: string; email?: string; phone?: string } | null }) => (
              <div
                key={rc._id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/contacts/${rc.contact?._id}`}
                      target="_blank"
                      className="font-medium text-gray-900 hover:text-brand transition-colors group inline-flex items-center gap-1"
                    >
                      {rc.contact?.firstName} {rc.contact?.lastName}
                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-brand" />
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {rc.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {rc.contact?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {rc.contact.email}
                      </span>
                    )}
                    {rc.contact?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {rc.contact.phone}
                      </span>
                    )}
                  </div>
                  {rc.notes && (
                    <p className="text-xs text-gray-400 mt-1">{rc.notes}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500 text-center">
            No related contacts
          </div>
        )}
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

      {/* Conversation History (for Messenger/Instagram leads) or Notes */}
      {hasMessagingConversation ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              {socialConversation?.source === "messenger" ? (
                <Facebook className="h-4 w-4 text-[#0084ff]" />
              ) : (
                <Instagram className="h-4 w-4 text-[#E4405F]" />
              )}
              <span>Conversation History</span>
            </div>
            <Link
              href="/conversations"
              className="text-xs text-brand hover:text-brand/80 flex items-center gap-1 transition-colors"
            >
              View All Messages
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {conversationMessages && conversationMessages.length > 0 ? (
              <>
                {conversationMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.isOutgoing ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        msg.isOutgoing
                          ? socialConversation?.source === "messenger"
                            ? "bg-[#0084ff] text-white"
                            : "bg-[#E4405F] text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isOutgoing ? "text-white/70" : "text-gray-400"}`}>
                        {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                {conversationMessages.length === 3 && (
                  <p className="text-xs text-center text-gray-400">
                    Showing most recent 3 messages
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">No messages yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <StickyNote className="h-4 w-4" />
            <span>Notes</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <Textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              className="min-h-[100px] bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
  };

  // Timeline filter state
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  const renderLogsTab = () => {
    if (!opportunity) return null;

    // Filter options
    const filterOptions = [
      { id: "all", label: "All Activity" },
      { id: "sms", label: "SMS" },
      { id: "email", label: "Emails" },
      { id: "appointment", label: "Appointments" },
      { id: "update", label: "Opportunity Updates" },
      { id: "intake", label: "Forms" },
      { id: "note", label: "Notes" },
    ];

    // Mock activity entries - like a message feed
    const mockEntries = [
      { id: "1", type: "sms", direction: "outbound", title: "Hi Sarah, this is SHLF Law Firm following up on your inquiry. Are you available for a quick call?", timestamp: Date.now() - 3600000, user: "Sheila Condomina" },
      { id: "2", type: "sms", direction: "inbound", title: "Yes, I can talk this afternoon around 3pm.", timestamp: Date.now() - 3500000, user: "Sarah Thompson" },
      { id: "3", type: "email", direction: "outbound", title: "Estate Planning Consultation - Follow Up", description: "Thank you for your interest in our estate planning services. As discussed, I've attached our intake form for you to review...", timestamp: Date.now() - 86400000, user: "Sheila Condomina" },
      { id: "4", type: "appointment", title: "Vision Meeting Scheduled", description: "Naples Office - Room A", timestamp: Date.now() - 86400000 * 2, user: "Andy Baker" },
      { id: "5", type: "update", title: 'Stage changed to "Consultation Scheduled"', timestamp: Date.now() - 86400000 * 2, user: "Sheila Condomina" },
      { id: "6", type: "intake", title: "Estate Planning Intake Form", description: "Completed by client", timestamp: Date.now() - 86400000 * 3, user: "Client" },
      { id: "7", type: "email", direction: "inbound", title: "Re: Estate Planning Consultation", description: "I've completed the intake form as requested. Looking forward to our meeting.", timestamp: Date.now() - 86400000 * 3.5, user: "Sarah Thompson" },
      { id: "8", type: "sms", direction: "outbound", title: "Great! We received your intake form. See you at the consultation.", timestamp: Date.now() - 86400000 * 3.5, user: "Sheila Condomina" },
      { id: "9", type: "appointment", title: "Discovery Call Completed", description: "Initial consultation with client - EP Discovery Call", timestamp: Date.now() - 86400000 * 5, user: "Sheila Condomina" },
      { id: "10", type: "update", title: "Opportunity created", timestamp: Date.now() - 86400000 * 6, user: "System" },
      { id: "11", type: "note", title: "Client referred by: Charles Faber", description: "The client will contact us. She is interested in estate planning for herself and her spouse.", timestamp: Date.now() - 86400000 * 6, user: "Sheila Condomina" },
    ];

    // Apply filter
    const filteredEntries = timelineFilter === "all"
      ? mockEntries
      : mockEntries.filter(e => e.type === timelineFilter);

    // Sort by timestamp descending (newest first)
    const sortedEntries = [...filteredEntries].sort((a, b) => b.timestamp - a.timestamp);

    const formatMessageTime = (timestamp: number) => {
      const now = Date.now();
      const diff = now - timestamp;
      const days = Math.floor(diff / 86400000);

      if (days === 0) {
        return format(new Date(timestamp), "h:mm a");
      } else if (days === 1) {
        return "Yesterday " + format(new Date(timestamp), "h:mm a");
      } else if (days < 7) {
        return format(new Date(timestamp), "EEEE h:mm a");
      } else {
        return format(new Date(timestamp), "MMM d, yyyy h:mm a");
      }
    };

    const renderMessageItem = (entry: typeof mockEntries[0]) => {
      // SMS - Green bubble for outbound, lighter for inbound
      if (entry.type === "sms") {
        const isOutbound = entry.direction === "outbound";
        return (
          <div key={entry.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] ${isOutbound ? "order-2" : "order-1"}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  isOutbound
                    ? "bg-green-500 text-white rounded-br-md"
                    : "bg-green-100 text-gray-900 rounded-bl-md"
                }`}
              >
                <p className="text-sm">{entry.title}</p>
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                <Phone className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-500">{entry.user} • {formatMessageTime(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      }

      // Email - Blue border style
      if (entry.type === "email") {
        const isOutbound = entry.direction === "outbound";
        return (
          <div key={entry.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${isOutbound ? "order-2" : "order-1"}`}>
              <div
                className={`px-4 py-3 rounded-lg border-2 border-blue-400 bg-white ${
                  isOutbound ? "rounded-br-none" : "rounded-bl-none"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm text-gray-900">{entry.title}</span>
                </div>
                {entry.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{entry.description}</p>
                )}
              </div>
              <div className={`flex items-center gap-1 mt-1 ${isOutbound ? "justify-end" : "justify-start"}`}>
                <span className="text-xs text-gray-500">{entry.user} • {formatMessageTime(entry.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      }

      // Appointment/Meeting - Yellow outline banner
      if (entry.type === "appointment") {
        return (
          <div key={entry.id} className="flex justify-center my-2">
            <div className="w-full max-w-[90%] px-4 py-3 rounded-lg border-2 border-yellow-400 bg-yellow-50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-sm text-gray-900">{entry.title}</span>
              </div>
              {entry.description && (
                <p className="text-sm text-gray-600 mt-1 ml-6">{entry.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1 ml-6">{entry.user} • {formatMessageTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      }

      // Opportunity Updates - Gray outline with blue text
      if (entry.type === "update") {
        return (
          <div key={entry.id} className="flex justify-center my-2">
            <div className="w-full max-w-[90%] px-4 py-3 rounded-lg border border-gray-300 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm text-blue-600">{entry.title}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">{entry.user} • {formatMessageTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      }

      // Forms/Intake - Yellow outline banner
      if (entry.type === "intake") {
        return (
          <div key={entry.id} className="flex justify-center my-2">
            <div className="w-full max-w-[90%] px-4 py-3 rounded-lg border-2 border-yellow-400 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm text-gray-900">{entry.title}</span>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  View
                </Button>
              </div>
              {entry.description && (
                <p className="text-sm text-gray-600 mt-1 ml-6">{entry.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1 ml-6">{entry.user} • {formatMessageTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      }

      // Notes - Gray style with edit option
      if (entry.type === "note") {
        return (
          <div key={entry.id} className="flex justify-center my-2">
            <div className="w-full max-w-[90%] px-4 py-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-xs text-gray-500 uppercase">Note</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7 text-gray-500">
                  Edit
                </Button>
              </div>
              <p className="text-sm font-medium text-gray-900">{entry.title}</p>
              {entry.description && (
                <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">{entry.user} • {formatMessageTime(entry.timestamp)}</p>
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className="space-y-4">
        {/* Header with filter */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
          <div className="flex items-center gap-2">
            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>

        {/* Message feed container */}
        <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {sortedEntries.length > 0 ? (
              sortedEntries.map(entry => renderMessageItem(entry))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>SMS</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-blue-400"></div>
            <span>Email</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-yellow-400 bg-yellow-50"></div>
            <span>Meeting/Form</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border border-gray-300 bg-gray-50"></div>
            <span>Update</span>
          </div>
        </div>
      </div>
    );
  };

  // Mock intake task state
  const [intakeTaskCompleted, setIntakeTaskCompleted] = useState(false);

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

    // Render the Intake Tasks section (Attempt 1)
    const renderIntakeTasksSection = () => (
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-brand" />
          <h4 className="text-sm font-semibold text-gray-900">Intake Tasks</h4>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <button
            className="mt-0.5 flex-shrink-0"
            onClick={() => setIntakeTaskCompleted(!intakeTaskCompleted)}
          >
            {intakeTaskCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-blue-400 hover:text-blue-500" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm ${
                intakeTaskCompleted ? "text-gray-400 line-through" : "text-gray-900"
              }`}
            >
              Attempt 1
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Initial intake attempt - contact the lead
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
            Intake
          </Badge>
        </div>
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

        {/* Intake Tasks Section - Always at the top */}
        {renderIntakeTasksSection()}

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

  const renderIntakeTab = () => {
    if (!opportunity) return null;

    // Mock intake form data based on the selected form type
    const getIntakeFormFields = () => {
      switch (selectedIntakeForm) {
        case "estate_planning":
          return [
            { label: "Practice Area", value: "Estate Planning" },
            { label: "Goals", value: "Create/Update Estate Plan" },
            { label: "Florida Resident", value: "Yes" },
            { label: "Marital Status", value: "Married" },
            { label: "Spouse Planning Together", value: "Yes" },
            { label: "Has Children", value: "Yes" },
            { label: "Has Existing Documents", value: "Yes" },
            { label: "Documents", value: "Will, POA" },
            { label: "Is Trust Funded", value: "No" },
          ];
        case "pbta":
          return [
            { label: "Practice Area", value: "PBTA" },
            { label: "Decedent First Name", value: "" },
            { label: "Decedent Last Name", value: "" },
            { label: "Date of Death", value: "" },
            { label: "Relationship to Decedent", value: "" },
            { label: "Beneficiary Disagreements", value: "" },
            { label: "Asset Ownership", value: "" },
            { label: "Was there a Will", value: "" },
            { label: "Access to Will", value: "" },
          ];
        case "medicaid":
          return [
            { label: "Practice Area", value: "Medicaid" },
            { label: "Primary Concern", value: "" },
            { label: "Assets Involved", value: "" },
          ];
        case "deed":
          return [
            { label: "Practice Area", value: "Deed" },
            { label: "Deed Concern", value: "" },
            { label: "Needs Trust Counsel", value: "" },
          ];
        case "doc_review":
          return [
            { label: "Practice Area", value: "Doc Review" },
            { label: "Florida Resident", value: "" },
            { label: "Legal Advice Sought", value: "" },
            { label: "Recent Life Changes", value: "" },
            { label: "Is Document Owner", value: "" },
            { label: "Is Beneficiary/Trustee", value: "" },
            { label: "Has POA", value: "" },
            { label: "Documents to Review", value: "" },
            { label: "Pending Litigation", value: "" },
          ];
        default:
          return [
            { label: "Practice Area", value: "General" },
            { label: "Call Details", value: "" },
            { label: "Referral Source", value: "" },
          ];
      }
    };

    const formFields = getIntakeFormFields();

    return (
      <div className="space-y-4">
        {/* Form Dropdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Intake Form</h3>
          </div>
          <Select value={selectedIntakeForm} onValueChange={setSelectedIntakeForm}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select intake form type" />
            </SelectTrigger>
            <SelectContent>
              {intakeFormTypes.map((form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Intake Form Fields */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h4 className="font-medium text-gray-900">
              {intakeFormTypes.find((f) => f.id === selectedIntakeForm)?.name || "Intake Form"}
            </h4>
            <Badge variant="outline" className="text-xs">
              Draft
            </Badge>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Contact Information
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">First Name</label>
                <Input
                  defaultValue={opportunity.contact?.firstName || ""}
                  placeholder="First name"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Last Name</label>
                <Input
                  defaultValue={opportunity.contact?.lastName || ""}
                  placeholder="Last name"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <Input
                  defaultValue={opportunity.contact?.email || ""}
                  placeholder="email@example.com"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Phone</label>
                <Input
                  defaultValue={opportunity.contact?.phone || ""}
                  placeholder="(555) 555-5555"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>

          {/* Practice Area Specific Fields */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {intakeFormTypes.find((f) => f.id === selectedIntakeForm)?.name.replace(" Intake", "")} Details
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {formFields.map((field, index) => (
                <div key={index}>
                  <label className="text-xs text-gray-500">{field.label}</label>
                  <Input
                    defaultValue={field.value}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="mt-1 h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Call Details */}
          <div className="space-y-3 pt-3 border-t">
            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Call Details
            </h5>
            <Textarea
              placeholder="Enter details from the call..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t">
            <Button className="w-full bg-brand hover:bg-brand/90">
              Save Intake Form
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "details":
        return renderDetailsTab();
      case "logs":
        return renderLogsTab();
      case "tasks":
        return renderTasksTab();
      case "intake":
        return renderIntakeTab();
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
              <DialogTitle asChild>
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={async (e) => {
                    if (e.target.value === opportunity.title) return;
                    try {
                      await updateOpportunity({
                        id: opportunity._id,
                        title: e.target.value,
                      });
                      toast.success("Title updated");
                    } catch (error) {
                      console.error("Failed to update title:", error);
                      toast.error("Failed to update title");
                    }
                  }}
                  className="text-xl font-semibold h-10 w-[350px] border-transparent hover:border-gray-200 focus:border-gray-300 bg-transparent"
                  placeholder="Opportunity title"
                />
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
            {/* Did Not Hire Button */}
            {selectedPipeline !== "Did Not Hire" && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                onClick={() => setIsDidNotHireOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Did not Hire
              </Button>
            )}
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

        {/* Add Related Contact Modal */}
        <AddRelatedContactModal
          open={isAddRelatedContactOpen}
          onOpenChange={setIsAddRelatedContactOpen}
          opportunityId={opportunity._id}
          primaryContactId={opportunity.contactId}
          existingRelatedContactIds={opportunity.relatedContacts?.map((rc: { contactId: Id<"contacts"> }) => rc.contactId) || []}
        />

        {/* Did Not Hire Modal */}
        <Dialog open={isDidNotHireOpen} onOpenChange={setIsDidNotHireOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Mark as Did Not Hire
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Closure Point Tag */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Point in Intake Closed
                </label>
                <Select value={didNotHireTag} onValueChange={setDidNotHireTag}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select closure point" />
                  </SelectTrigger>
                  <SelectContent>
                    {closurePointTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason (Did Not Hire Stage) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Reason
                </label>
                <Select value={didNotHireReason} onValueChange={setDidNotHireReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {didNotHireStages.map((stage: { _id: string; name: string }) => (
                      <SelectItem key={stage._id} value={stage._id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDidNotHireOpen(false);
                  setDidNotHireTag("");
                  setDidNotHireReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDidNotHireSubmit}
                disabled={!didNotHireReason}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
