"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  FolderOpen,
  ClipboardList,
  CalendarPlus,
  Send,
  FileEdit,
  FilePlus,
  ChevronDown,
  Building2,
  Cake,
  History,
  StickyNote,
  MoreVertical,
  XCircle,
  UserPlus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AddAppointmentModal } from "@/components/calendars/AddAppointmentModal";
import { AddRelatedContactModal } from "@/components/opportunities/AddRelatedContactModal";

type RightTabType = "intake" | "logs" | "files";

// Mock intake form types
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

// Log entry type
interface LogEntry {
  id: string;
  type: "communication" | "note" | "update" | "task";
  title: string;
  description?: string;
  timestamp: number;
  user?: string;
}

// Lead source options for referral dropdown
const leadSourceOptions = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "workshop", label: "Workshop" },
  { value: "social_media", label: "Social Media" },
  { value: "messenger", label: "Messenger" },
  { value: "instagram", label: "Instagram" },
  { value: "google_ads", label: "Google Ads" },
  { value: "facebook_ads", label: "Facebook Ads" },
  { value: "walk_in", label: "Walk In" },
  { value: "phone", label: "Phone" },
  { value: "other", label: "Other" },
];

const stageColors: Record<string, string> = {
  "New Lead": "bg-blue-100 text-blue-700",
  "Contacted": "bg-yellow-100 text-yellow-700",
  "Qualified": "bg-purple-100 text-purple-700",
  "Consultation Scheduled": "bg-indigo-100 text-indigo-700",
  "Consultation Complete": "bg-cyan-100 text-cyan-700",
  "Proposal Sent": "bg-orange-100 text-orange-700",
  "Engaged": "bg-green-100 text-green-700",
  "Did Not Hire": "bg-gray-100 text-gray-500",
  "Lost": "bg-red-100 text-red-700",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Loading skeleton for the page
function OpportunityDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="col-span-2">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;

  const [activeTab, setActiveTab] = useState<RightTabType>("intake");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [selectedIntakeForm, setSelectedIntakeForm] = useState<string>("estate_planning");
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  // Did Not Hire modal state
  const [isDidNotHireOpen, setIsDidNotHireOpen] = useState(false);
  const [didNotHireTag, setDidNotHireTag] = useState<string>("");
  const [didNotHireReason, setDidNotHireReason] = useState<string>("");

  // Related contact modal state
  const [isAddRelatedContactOpen, setIsAddRelatedContactOpen] = useState(false);

  // Mock intake task state (Attempt 1)
  const [intakeTaskCompleted, setIntakeTaskCompleted] = useState(false);

  // Mock checklist tasks for intake process
  const [checklistTasks, setChecklistTasks] = useState([
    { id: "task-1", title: "Schedule I/V", type: "schedule", completed: false, assignee: "Sheila Condomina", dueDate: new Date(2026, 1, 5).getTime() },
    { id: "task-2", title: "Verified if the client reached out. If so, let Charles Faber know and thank him for the referral.", type: "task", completed: false, assignee: "Sheila Condomina", dueDate: new Date(2026, 1, 2).getTime() },
    { id: "task-3", title: "Send intake form to client", type: "task", completed: false, assignee: "Sheila Condomina", dueDate: new Date(2026, 1, 3).getTime() },
    { id: "task-4", title: "Schedule follow-up call", type: "schedule", completed: false, assignee: "Sheila Condomina", dueDate: new Date(2026, 1, 7).getTime() },
    { id: "task-5", title: "Review intake form responses", type: "task", completed: true, assignee: "Sheila Condomina", dueDate: new Date(2026, 0, 28).getTime() },
  ]);

  // Fetch opportunity data from Convex
  const opportunity = useQuery(
    api.opportunities.getWithRelated,
    { id: opportunityId as Id<"opportunities"> }
  );
  const stages = useQuery(api.pipelineStages.list, {});

  // Mutations
  const toggleTaskComplete = useMutation(api.tasks.toggleComplete);
  const moveToPipeline = useMutation(api.opportunities.moveToPipeline);
  const updateOpportunity = useMutation(api.opportunities.update);
  const updateContact = useMutation(api.contacts.update);

  // Editable field state (auto-save on blur)
  const [tempTitle, setTempTitle] = useState("");
  const [tempNotes, setTempNotes] = useState("");
  const [tempValue, setTempValue] = useState(0);
  const [tempContactFirstName, setTempContactFirstName] = useState("");
  const [tempContactLastName, setTempContactLastName] = useState("");
  const [tempContactEmail, setTempContactEmail] = useState("");
  const [tempContactPhone, setTempContactPhone] = useState("");
  const [tempContactSource, setTempContactSource] = useState("");
  const [tempReferralSource, setTempReferralSource] = useState("");
  const [tempReferralOther, setTempReferralOther] = useState("");
  const [tempCity, setTempCity] = useState("");
  const [tempState, setTempState] = useState("");

  // Initialize editable fields when opportunity loads
  useEffect(() => {
    if (opportunity) {
      setTempTitle(opportunity.title || "");
      setTempNotes(opportunity.notes || "");
      setTempValue(opportunity.estimatedValue || 0);
      if (opportunity.contact) {
        setTempContactFirstName(opportunity.contact.firstName || "");
        setTempContactLastName(opportunity.contact.lastName || "");
        setTempContactEmail(opportunity.contact.email || "");
        setTempContactPhone(opportunity.contact.phone || "");
        setTempContactSource(opportunity.contact.source || "");
        setTempReferralSource(opportunity.contact.referralSource || "");
        setTempReferralOther(opportunity.contact.referralOther || "");
        setTempCity(opportunity.contact.city || "");
        setTempState(opportunity.contact.state || "");
      }
    }
  }, [opportunity]);

  // Auto-save opportunity field on blur
  const handleOpportunityFieldBlur = async (field: string, value: string | number) => {
    if (!opportunity) return;
    const originalValue = field === "title" ? opportunity.title :
                          field === "notes" ? opportunity.notes :
                          field === "estimatedValue" ? opportunity.estimatedValue : "";
    if (value === originalValue) return;

    try {
      await updateOpportunity({
        id: opportunity._id,
        [field]: value || undefined,
      });
      toast.success("Updated");
    } catch (error) {
      console.error("Failed to update opportunity:", error);
      toast.error("Failed to save");
    }
  };

  // Auto-save contact field on blur
  const handleContactFieldBlur = async (field: string, value: string) => {
    if (!opportunity?.contact) return;
    const originalValue = field === "firstName" ? opportunity.contact.firstName :
                          field === "lastName" ? opportunity.contact.lastName :
                          field === "email" ? opportunity.contact.email :
                          field === "phone" ? opportunity.contact.phone :
                          field === "source" ? opportunity.contact.source :
                          field === "referralSource" ? opportunity.contact.referralSource :
                          field === "referralOther" ? opportunity.contact.referralOther :
                          field === "city" ? opportunity.contact.city :
                          field === "state" ? opportunity.contact.state : "";
    if (value === originalValue) return;

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

  // Handle lead source change (auto-save immediately)
  const handleLeadSourceChange = async (value: string) => {
    setTempContactSource(value);
    if (!opportunity?.contact) return;
    if (value === opportunity.contact.source) return;

    try {
      await updateContact({
        id: opportunity.contactId,
        source: value || undefined,
      });
      toast.success("Lead source updated");
    } catch (error) {
      console.error("Failed to update lead source:", error);
      toast.error("Failed to save");
    }
  };

  // Get "Did Not Hire" stages for reason dropdown
  const didNotHireStages = useMemo(() => {
    if (!stages) return [];
    return stages
      .filter((s: { pipeline: string }) => s.pipeline === "Did Not Hire")
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
  }, [stages]);

  // Get current pipeline name
  const currentPipeline = useMemo(() => {
    if (!opportunity || !stages) return "";
    const currentStage = stages.find((s: { _id: string }) => s._id === opportunity.stageId);
    return currentStage?.pipeline || "";
  }, [opportunity, stages]);

  // Loading state
  if (opportunity === undefined) {
    return <OpportunityDetailSkeleton />;
  }

  // Not found state
  if (opportunity === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Opportunity not found</h2>
        <p className="text-gray-500 mb-4">The opportunity you're looking for doesn't exist.</p>
        <Button variant="outline" onClick={() => router.push("/opportunities")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>
      </div>
    );
  }

  const stageName = stages?.find(s => s._id === opportunity?.stageId)?.name || opportunity?.stageId || "";
  const contact = opportunity?.contact;

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTaskComplete({ id: taskId as Id<"tasks"> });
    } catch (error) {
      console.error("Failed to toggle task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleAddItem = (type: string) => {
    toast.info(`Add ${type} - Coming soon`);
  };

  const handleScheduleTask = (taskId: string) => {
    setSchedulingTaskId(taskId);
    setIsAppointmentModalOpen(true);
  };

  const handleAppointmentBooked = () => {
    if (schedulingTaskId) {
      // Mark the task as completed when appointment is booked
      setChecklistTasks(prev =>
        prev.map(task =>
          task.id === schedulingTaskId ? { ...task, completed: true } : task
        )
      );
      toast.success("Appointment scheduled and task marked as complete");
    }
    setIsAppointmentModalOpen(false);
    setSchedulingTaskId(null);
  };

  const handleToggleChecklistTask = (taskId: string) => {
    setChecklistTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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
      router.push("/opportunities");
    } catch (error) {
      console.error("Failed to mark as Did Not Hire:", error);
      toast.error("Failed to mark as Did Not Hire");
    }
  };

  // Calculate checklist progress
  const completedChecklistTasks = checklistTasks.filter(t => t.completed).length;
  const totalChecklistTasks = checklistTasks.length;
  const checklistProgress = totalChecklistTasks > 0 ? (completedChecklistTasks / totalChecklistTasks) * 100 : 0;

  const rightTabs = [
    { id: "intake" as const, label: "Intake Process", icon: ClipboardList },
    { id: "logs" as const, label: "Logs", icon: History },
    { id: "files" as const, label: "Files", icon: FolderOpen },
  ];

  // Timeline items for intake process
  const timelineItems = [
    { date: opportunity?.createdAt || Date.now(), type: "created", title: "Opportunity Created" },
    ...(opportunity?.tasks || []).map(task => ({
      date: task.createdAt || Date.now(),
      type: task.completed ? "completed" : "task",
      title: task.title,
      taskId: task._id,
      completed: task.completed,
    })),
    ...(opportunity?.appointments || []).map(apt => ({
      date: apt.date,
      type: "appointment",
      title: apt.title,
    })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/opportunities")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => handleOpportunityFieldBlur("title", tempTitle)}
              className="text-2xl font-bold text-gray-900 border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              placeholder="Opportunity name"
            />
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${stageColors[stageName] || "bg-gray-100 text-gray-700"} border-0`}>
                {stageName}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {opportunity?.createdAt ? format(new Date(opportunity.createdAt), "MMM d, yyyy") : "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentPipeline !== "Did Not Hire" && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setIsDidNotHireOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Did not Hire
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-1 space-y-6">
          {/* Opportunity Details Card */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Opportunity Details</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-gray-400 mt-2.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Opportunity Name</p>
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onBlur={() => handleOpportunityFieldBlur("title", tempTitle)}
                    className="h-9 text-sm font-medium"
                    placeholder="Opportunity name"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ClipboardList className="h-4 w-4 text-gray-400 mt-2.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Stage</p>
                  <Select
                    value={opportunity?.stageId || ""}
                    onValueChange={async (value) => {
                      if (!opportunity) return;
                      try {
                        await updateOpportunity({
                          id: opportunity._id,
                          stageId: value,
                        });
                        toast.success("Stage updated");
                      } catch (error) {
                        console.error("Failed to update stage:", error);
                        toast.error("Failed to update stage");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select stage">
                        <span className="text-sm font-medium text-gray-900">{stageName}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {stages?.map((stage) => (
                        <SelectItem key={stage._id} value={stage._id} className="py-2.5">
                          <span className="text-sm text-gray-900">{stage.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Responsible Attorney</p>
                  <p className="text-sm text-gray-900">{opportunity?.responsibleAttorneyName || "Unassigned"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Created On</p>
                  <p className="text-sm text-gray-900">
                    {opportunity?.createdAt ? format(new Date(opportunity.createdAt), "MMMM d, yyyy") : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-gray-400 mt-2.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <Textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    onBlur={() => handleOpportunityFieldBlur("notes", tempNotes)}
                    className="min-h-[60px] text-sm resize-none"
                    placeholder="Add a description..."
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-2.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={tempCity}
                      onChange={(e) => setTempCity(e.target.value)}
                      onBlur={() => handleContactFieldBlur("city", tempCity)}
                      className="h-9 text-sm"
                      placeholder="City"
                    />
                    <Input
                      value={tempState}
                      onChange={(e) => setTempState(e.target.value)}
                      onBlur={() => handleContactFieldBlur("state", tempState)}
                      className="h-9 text-sm"
                      placeholder="State"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-4 w-4 text-gray-400 mt-2.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Value</p>
                  <Input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(Number(e.target.value))}
                    onBlur={() => handleOpportunityFieldBlur("estimatedValue", tempValue)}
                    className="h-9 text-sm font-medium"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Contact Details</h2>
              {contact && (
                <Link href={`/contacts/${contact._id}`}>
                  <Button variant="ghost" size="sm">View Profile</Button>
                </Link>
              )}
            </div>

            {contact ? (
              <div className="space-y-3">
                {/* Editable Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">First Name</p>
                    <Input
                      value={tempContactFirstName}
                      onChange={(e) => setTempContactFirstName(e.target.value)}
                      onBlur={() => handleContactFieldBlur("firstName", tempContactFirstName)}
                      className="h-9 text-sm"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last Name</p>
                    <Input
                      value={tempContactLastName}
                      onChange={(e) => setTempContactLastName(e.target.value)}
                      onBlur={() => handleContactFieldBlur("lastName", tempContactLastName)}
                      className="h-9 text-sm"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-gray-400 mt-2.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <Input
                        type="email"
                        value={tempContactEmail}
                        onChange={(e) => setTempContactEmail(e.target.value)}
                        onBlur={() => handleContactFieldBlur("email", tempContactEmail)}
                        className="h-9 text-sm"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-gray-400 mt-2.5" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Phone</p>
                      <Input
                        type="tel"
                        value={tempContactPhone}
                        onChange={(e) => setTempContactPhone(e.target.value)}
                        onBlur={() => handleContactFieldBlur("phone", tempContactPhone)}
                        className="h-9 text-sm"
                        placeholder="(555) 555-5555"
                      />
                    </div>
                  </div>

                  {(contact.streetAddress || contact.city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        {contact.streetAddress && <p>{contact.streetAddress}</p>}
                        {(contact.city || contact.state || contact.zipCode) && (
                          <p>
                            {[contact.city, contact.state, contact.zipCode].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {contact.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <Cake className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(contact.dateOfBirth), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}

                  {contact.company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{contact.company}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No contact linked</p>
            )}
          </div>

          {/* Referral Section Card */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900">Referral Information</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Lead Source</p>
                <Select value={tempContactSource} onValueChange={handleLeadSourceChange}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Referrer Name</p>
                <Input
                  value={tempReferralSource}
                  onChange={(e) => setTempReferralSource(e.target.value)}
                  onBlur={() => handleContactFieldBlur("referralSource", tempReferralSource)}
                  className="h-9 text-sm"
                  placeholder="Who referred this contact?"
                />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Additional Details</p>
                <Textarea
                  value={tempReferralOther}
                  onChange={(e) => setTempReferralOther(e.target.value)}
                  onBlur={() => handleContactFieldBlur("referralOther", tempReferralOther)}
                  className="min-h-[60px] text-sm resize-none"
                  placeholder="Additional referral notes..."
                />
              </div>

              {/* Link to Intake Form */}
              <div className="pt-2 border-t">
                <Link href="/intake" className="text-sm text-brand hover:underline flex items-center gap-1">
                  <ClipboardList className="h-4 w-4" />
                  View Intake Form
                </Link>
              </div>
            </div>
          </div>

          {/* Related Contacts Card */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Related Contacts</h2>
              <Button variant="outline" size="sm" onClick={() => setIsAddRelatedContactOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {opportunity?.relatedContacts && opportunity.relatedContacts.length > 0 ? (
              <div className="space-y-3">
                {opportunity.relatedContacts.map((rc: { _id: Id<"opportunityContacts">; relationship: string; notes?: string; contact: { _id: Id<"contacts">; firstName: string; lastName: string; email?: string; phone?: string } | null }) => (
                  <div
                    key={rc._id}
                    className="bg-gray-50 rounded-lg p-3 flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/contacts/${rc.contact?._id}`}
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No related contacts</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg border h-full">
            {/* Tabs */}
            <div className="flex border-b">
              {rightTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "intake" && (
                <div className="space-y-6">
                  {/* Tasks Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Tasks</h3>

                    {/* Intake Task - Attempt 1 */}
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

                    {/* Progress Bar */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${checklistProgress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {completedChecklistTasks}/{totalChecklistTasks} Complete
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checklist Tasks */}
                    <div className="space-y-3">
                      {checklistTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`border rounded-lg p-4 ${task.completed ? "bg-gray-50 opacity-60" : "bg-white"}`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleToggleChecklistTask(task.id)}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className={`text-sm font-medium ${task.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                    Task - {task.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {task.assignee} • {format(new Date(task.dueDate), "MMMM d, yyyy 'at' h:mm a")} (EST) • No Reminder Set
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {task.type === "schedule" && !task.completed && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleScheduleTask(task.id)}
                                      className="text-brand border-brand hover:bg-brand/10"
                                    >
                                      <CalendarPlus className="h-4 w-4 mr-1" />
                                      Schedule
                                    </Button>
                                  )}
                                  <Badge variant={task.completed ? "secondary" : "outline"} className={task.completed ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700 border-amber-200"}>
                                    {task.completed ? "Completed" : "Pending"}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleToggleChecklistTask(task.id)}>
                                        {task.completed ? "Mark Incomplete" : "Mark Complete"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast.info("Edit task - Coming soon")}>
                                        Edit Task
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600" onClick={() => toast.info("Delete task - Coming soon")}>
                                        Delete Task
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Intake Form Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Intake Form</h3>
                    </div>

                    {/* Form Type Dropdown */}
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
                              defaultValue={contact?.firstName || ""}
                              placeholder="First name"
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Last Name</label>
                            <Input
                              defaultValue={contact?.lastName || ""}
                              placeholder="Last name"
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <Input
                              defaultValue={contact?.email || ""}
                              placeholder="email@example.com"
                              className="mt-1 h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Phone</label>
                            <Input
                              defaultValue={contact?.phone || ""}
                              placeholder="(555) 555-5555"
                              className="mt-1 h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Practice Area Fields */}
                      <div className="space-y-3 pt-3 border-t">
                        <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {intakeFormTypes.find((f) => f.id === selectedIntakeForm)?.name.replace(" Intake", "")} Details
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedIntakeForm === "estate_planning" && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Goals</label>
                                <Input placeholder="Estate planning goals" className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Florida Resident</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Marital Status</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Has Children</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Existing Documents</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Trust Funded</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                    <SelectItem value="na">N/A</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                          {selectedIntakeForm === "pbta" && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Decedent First Name</label>
                                <Input placeholder="First name" className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Decedent Last Name</label>
                                <Input placeholder="Last name" className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Date of Death</label>
                                <Input type="date" className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Relationship</label>
                                <Input placeholder="Relationship to decedent" className="mt-1 h-9" />
                              </div>
                            </>
                          )}
                          {selectedIntakeForm === "medicaid" && (
                            <>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500">Primary Concern</label>
                                <Textarea placeholder="Describe primary concern..." className="mt-1" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500">Assets Involved</label>
                                <Textarea placeholder="List assets involved..." className="mt-1" />
                              </div>
                            </>
                          )}
                          {selectedIntakeForm === "deed" && (
                            <>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500">Deed Concern</label>
                                <Textarea placeholder="Describe deed concern..." className="mt-1" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Needs Trust Counsel</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                          {selectedIntakeForm === "doc_review" && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Florida Resident</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Has POA</label>
                                <Select>
                                  <SelectTrigger className="mt-1 h-9">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-gray-500">Legal Advice Sought</label>
                                <Textarea placeholder="Describe legal advice sought..." className="mt-1" />
                              </div>
                            </>
                          )}
                          {selectedIntakeForm === "general" && (
                            <>
                              <div>
                                <label className="text-xs text-gray-500">Practice Area</label>
                                <Input placeholder="Practice area" className="mt-1 h-9" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500">Referral Source</label>
                                <Input placeholder="Referral source" className="mt-1 h-9" />
                              </div>
                            </>
                          )}
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
                </div>
              )}

              {activeTab === "logs" && (() => {
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
                    <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
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
              })()}

              {activeTab === "files" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Files</h3>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                  {opportunity?.documents && opportunity.documents.length > 0 ? (
                    <div className="space-y-2">
                      {opportunity.documents.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No files yet</p>
                        <p className="text-sm mt-1">Upload documents to attach them</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AddAppointmentModal
        open={isAppointmentModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSchedulingTaskId(null);
          }
          setIsAppointmentModalOpen(open);
        }}
        defaultContactId={contact?._id}
        defaultContactName={contact ? `${contact.firstName} ${contact.lastName}` : undefined}
        onAppointmentCreated={handleAppointmentBooked}
      />

      {/* Add Related Contact Modal */}
      {opportunity && (
        <AddRelatedContactModal
          open={isAddRelatedContactOpen}
          onOpenChange={setIsAddRelatedContactOpen}
          opportunityId={opportunity._id}
          primaryContactId={opportunity.contactId}
          existingRelatedContactIds={opportunity.relatedContacts?.map((rc: { contactId: Id<"contacts"> }) => rc.contactId) || []}
        />
      )}

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
    </div>
  );
}
