"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { AddAppointmentModal, AppointmentData } from "@/components/calendars/AddAppointmentModal";
import { AddInvoiceModal } from "@/components/invoices/AddInvoiceModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Pencil,
  MessageSquare,
  CheckSquare,
  FileText,
  Calendar,
  Receipt,
  Plus,
  MoreHorizontal,
  Send,
  Download,
  Trash2,
  ChevronDown,
  Cake,
  ExternalLink,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton loader for the contact detail page
function ContactDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Back button skeleton */}
      <Skeleton className="h-5 w-32" />

      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Left Side Skeleton */}
        <div className="w-96 flex-shrink-0 space-y-4">
          {/* Profile Card Skeleton */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* Avatar and Name */}
            <div className="flex items-start gap-4 mb-6">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-100 py-3">
              <Skeleton className="h-4 w-36 mb-3" />
              <div className="space-y-3 pl-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>

            {/* Opportunity */}
            <div className="border-b border-gray-100 py-3">
              <Skeleton className="h-4 w-40 mb-3" />
              <div className="pl-6 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>

            {/* Tags */}
            <div className="border-b border-gray-100 py-3">
              <Skeleton className="h-4 w-16 mb-3" />
              <div className="flex gap-2 pl-6">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-18 rounded-full" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t mt-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Appointments Skeleton */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="space-y-3 pl-6">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>

          {/* Invoices Skeleton */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between py-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="space-y-3 pl-6">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Right Side Skeleton */}
        <div className="flex-1 rounded-lg border bg-white shadow-sm flex flex-col min-h-[600px]">
          {/* Tabs */}
          <div className="border-b px-4">
            <div className="flex gap-4 py-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-3/4 rounded-lg" />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  actions,
  isEmpty = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  isEmpty?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // If section is empty, show gray text without dropdown
  if (isEmpty) {
    return (
      <div className="border-b border-gray-100 last:border-b-0">
        <div className="flex items-center gap-2 w-full py-3">
          <span className="text-sm font-medium text-gray-400">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2 w-full py-3">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 flex-1 cursor-pointer"
        >
          <ChevronDown
            className={`h-4 w-4 text-blue-500 transition-transform ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
          <span className="text-sm font-medium text-blue-500">{title}</span>
        </div>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

// Form Field Component for displaying label + value
function FormField({
  label,
  value,
  type = "text",
}: {
  label: string;
  value?: string | null;
  type?: "text" | "textarea";
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 resize-none"
          placeholder={label}
          defaultValue={value || ""}
          rows={3}
        />
      ) : (
        <input
          type="text"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400"
          placeholder="Fill values"
          defaultValue={value || ""}
        />
      )}
    </div>
  );
}

// Radio Field Component
function RadioField({
  label,
  options,
  value,
}: {
  label: string;
  options: string[];
  value?: string | null;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-1">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="radio"
              name={label}
              defaultChecked={value === option}
              className="h-4 w-4 border-gray-300 text-primary"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

// Checkbox Field Component
function CheckboxField({
  label,
  options,
  values,
}: {
  label: string;
  options: string[];
  values?: string[] | null;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="space-y-1">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              defaultChecked={values?.includes(option)}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

const stageColors: Record<string, string> = {
  // Main Lead Flow stages
  "Fresh Leads": "bg-gray-100 text-gray-700",
  "Pending Contact": "bg-yellow-100 text-yellow-700",
  "Pending Intake Completion": "bg-orange-100 text-orange-700",
  "Scheduled Discovery Call": "bg-blue-100 text-blue-700",
  "Pending I/V": "bg-purple-100 text-purple-700",
  "Scheduled I/V": "bg-indigo-100 text-indigo-700",
  "Cancelled/No Show I/V": "bg-red-100 text-red-700",
  "Pending Engagement Lvl 1": "bg-cyan-100 text-cyan-700",
  "Pending Engagement Lvl 2 and 3": "bg-teal-100 text-teal-700",
  "Scheduled Design": "bg-emerald-100 text-emerald-700",
  "Cancelled/No Show Design": "bg-rose-100 text-rose-700",
  Engaged: "bg-green-100 text-green-700",
  // Legacy stages
  New: "bg-gray-100 text-gray-700",
  Qualified: "bg-blue-100 text-blue-700",
  Consultation: "bg-purple-100 text-purple-700",
  Discovery: "bg-yellow-100 text-yellow-700",
  Negotiation: "bg-orange-100 text-orange-700",
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
};

const tagColors: Record<string, string> = {
  VIP: "bg-amber-100 text-amber-700 border-amber-200",
  Urgent: "bg-red-100 text-red-700 border-red-200",
  "New Lead": "bg-green-100 text-green-700 border-green-200",
  "High Value": "bg-purple-100 text-purple-700 border-purple-200",
  "Follow Up": "bg-blue-100 text-blue-700 border-blue-200",
  Priority: "bg-orange-100 text-orange-700 border-orange-200",
};

const sourceColors: Record<string, string> = {
  Website: "bg-blue-500",
  Referral: "bg-green-500",
  "Google Ads": "bg-red-500",
  "Social Media": "bg-pink-500",
  "Walk-in": "bg-gray-500",
};

type TabType = "messages" | "tasks" | "documents";

// Helper to format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Helper to format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [messageInput, setMessageInput] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    _id: Id<"invoices">;
    contactId: Id<"contacts">;
    opportunityId?: Id<"opportunities">;
    name: string;
    invoiceNumber: string;
    amount: number;
    amountPaid?: number;
    issueDate: number;
    dueDate?: number;
    paidDate?: number;
    status: string;
    paymentLink?: string;
    paymentMethod?: string;
    lineItems?: { productId?: Id<"products">; description: string; quantity: number; unitPrice: number; total: number; }[];
    notes?: string;
    confidoInvoiceId?: string;
    confidoClientId?: string;
    confidoMatterId?: string;
    createdAt: number;
    updatedAt: number;
  } | null>(null);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

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

  // Fetch contact with all related data from Convex
  const contactData = useQuery(api.contacts.getWithRelated, {
    id: contactId as Id<"contacts">,
  });

  // Fetch pipeline stages for stage name lookup
  const stages = useQuery(api.pipelineStages.list, {});

  // Task filter state
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("pending");

  // Task mutations
  const createTask = useMutation(api.tasks.create);
  const toggleTaskComplete = useMutation(api.tasks.toggleComplete);

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

  const handleCreateTask = async (taskData: NewTaskData) => {
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description || undefined,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).getTime() : undefined,
        assignedTo: taskData.assignedTo || undefined,
        assignedToName: taskData.assignedToName || undefined,
        contactId: contactId as Id<"contacts">,
        opportunityId: contactData?.opportunities?.[0]?._id,
      });
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "messages",
      label: "Messages",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4" /> },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  // Loading state
  if (contactData === undefined) {
    return <ContactDetailSkeleton />;
  }

  // Not found state
  if (contactData === null) {
    return (
      <div className="space-y-4">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Contact not found</p>
        </div>
      </div>
    );
  }

  // Get primary opportunity and stage name
  const primaryOpportunity = contactData.opportunities?.[0];
  const stageName = primaryOpportunity && stages
    ? stages.find((s) => s._id === primaryOpportunity.stageId)?.name
    : null;

  const fullName = `${contactData.firstName} ${contactData.lastName}`;

  return (
    <div className="space-y-4">
      {/* Back to Contacts */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </Link>

      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Left Side - Contact Profile */}
        <div className="w-96 flex-shrink-0 space-y-4 overflow-y-auto pr-2">
          {/* Profile Card */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            {/* Avatar and Name */}
            <div className="flex items-start gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
                {getInitials(contactData.firstName, contactData.lastName)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {fullName}
                </h2>
                {contactData.source && (
                  <Badge
                    className={`mt-1 ${sourceColors[contactData.source] || "bg-gray-500"} text-white border-0`}
                  >
                    {contactData.source}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Information - Collapsible */}
            <CollapsibleSection
              title="Contact Information"
              actions={
                <Button variant="ghost" size="icon-sm">
                  <Pencil className="h-4 w-4 text-gray-400" />
                </Button>
              }
            >
              <div className="space-y-3 pl-6">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{contactData.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{contactData.email || "-"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Cake className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{contactData.dateOfBirth || "-"}</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* Associated Opportunity - Collapsible */}
            <CollapsibleSection title="Associated Opportunity">
              <div className="pl-6">
                {primaryOpportunity ? (
                  <>
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 underline cursor-pointer hover:text-gray-900">
                        {primaryOpportunity.title}
                      </span>
                    </div>
                    {stageName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Stage:</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            stageColors[stageName] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {stageName}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No opportunity assigned</p>
                )}
              </div>
            </CollapsibleSection>

            {/* Tags - Collapsible */}
            <CollapsibleSection title="Tags" isEmpty={!contactData.tags || contactData.tags.length === 0}>
              <div className="flex flex-wrap gap-2 pl-6">
                {contactData.tags?.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={`text-xs ${tagColors[tag] || "bg-gray-50 text-gray-600"}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CollapsibleSection>

            {/* Intake Form Section */}
            <CollapsibleSection title="Intake Form" isEmpty={!contactData.intakeId}>
              <div className="pl-6">
                <Link href={`/intake/${contactData.intakeId}`}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4" />
                    View Submitted Intake Form
                  </Button>
                </Link>
              </div>
            </CollapsibleSection>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t mt-4">
              <Button className="w-full" variant="default">
                <Phone className="h-4 w-4" />
                Call
              </Button>
              <Button className="w-full" variant="outline">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
            </div>
          </div>

          {/* Appointments Section */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <CollapsibleSection
              title="Appointments"
              actions={
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              {contactData.appointments && contactData.appointments.length > 0 ? (
                <div className="space-y-3 pl-6">
                  {contactData.appointments.map((apt) => (
                    <div
                      key={apt._id}
                      onClick={() => handleAppointmentClick(apt)}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {apt.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(apt.date)} at {apt.time}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 pl-6">
                  No appointments scheduled
                </p>
              )}
            </CollapsibleSection>
          </div>

          {/* Invoices Section */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <CollapsibleSection
              title="Invoices"
              actions={
                <Button variant="ghost" size="sm" onClick={() => setIsAddInvoiceOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              {contactData.invoices && contactData.invoices.length > 0 ? (
                <div className="space-y-3 pl-6">
                  {contactData.invoices.map((inv) => (
                    <div
                      key={inv._id}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsInvoiceDetailOpen(true);
                      }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(inv.issueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(inv.amount)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            inv.status === "Paid"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 pl-6">
                  No invoices yet
                </p>
              )}
            </CollapsibleSection>
          </div>

          {/* Custom Fields Card */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            {/* Beneficiary Section */}
            <CollapsibleSection
              title="Beneficiary"
              defaultOpen={false}
              isEmpty={!contactData.beneficiary_name && !contactData.beneficiary_dateOfBirth && !contactData.beneficiary_occupation && !contactData.beneficiary_phone && !contactData.beneficiary_relationship}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Name" value={contactData.beneficiary_name} />
                <FormField label="Date of Birth" value={contactData.beneficiary_dateOfBirth} />
                <FormField label="Occupation" value={contactData.beneficiary_occupation} />
                <FormField label="Phone Number" value={contactData.beneficiary_phone} />
                <FormField label="Sex" value={contactData.beneficiary_sex} />
                <FormField label="Relationship" value={contactData.beneficiary_relationship} />
                <FormField label="Special Needs / Considerations" value={contactData.beneficiary_specialNeeds} />
                <FormField label="Potential Problems / Hardships" value={contactData.beneficiary_potentialProblems} />
                <FormField label="Address" value={contactData.beneficiary_address} />
                <FormField label="City" value={contactData.beneficiary_city} />
                <FormField label="State/Province" value={contactData.beneficiary_state} />
                <FormField label="Zip Code" value={contactData.beneficiary_zipCode} />
                <FormField label="Spouse Name" value={contactData.beneficiary_spouseName} />
                <FormField label="Relationship Status" value={contactData.beneficiary_relationshipStatus} />
                <FormField label="How Many Children" value={contactData.beneficiary_howManyChildren} />
                <FormField label="Ages of Children" value={contactData.beneficiary_agesOfChildren} />
              </div>
            </CollapsibleSection>

            {/* Finances Section */}
            <CollapsibleSection
              title="Finances"
              defaultOpen={false}
              isEmpty={!contactData.finances_name && !contactData.finances_representative && !contactData.finances_accountType && !contactData.finances_approxValue}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Name" value={contactData.finances_name} />
                <FormField label="Representative" value={contactData.finances_representative} />
                <FormField label="Account Type" value={contactData.finances_accountType} />
                <FormField label="Current Owner(s)" value={contactData.finances_currentOwners} />
                <FormField label="Approx. Value" value={contactData.finances_approxValue} />
              </div>
            </CollapsibleSection>

            {/* DLM Section */}
            <CollapsibleSection
              title="DLM"
              defaultOpen={false}
              isEmpty={!contactData.dlm_statement && !contactData.dlm_webinarTitle && !contactData.dlm_eventTitle && !contactData.dlm_eventVenue && !contactData.dlm_guestName}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Which Statement Best Describes You" type="textarea" value={contactData.dlm_statement} />
                <FormField label="Webinar Title" value={contactData.dlm_webinarTitle} />
                <FormField label="Event Title" value={contactData.dlm_eventTitle} />
                <FormField label="Event Venue" value={contactData.dlm_eventVenue} />
                <FormField label="Guest Name" value={contactData.dlm_guestName} />
              </div>
            </CollapsibleSection>

            {/* Instagram DM Fields Section */}
            <CollapsibleSection
              title="Instagram DM Fields"
              defaultOpen={false}
              isEmpty={!contactData.instagram_howDidYouHear && !contactData.instagram_message && !contactData.instagram_preferredOffice && !contactData.instagram_workshopSelection}
            >
              <div className="space-y-4 pl-6">
                <FormField label="How Did You Hear About Us?" value={contactData.instagram_howDidYouHear} />
                <FormField label="Message" value={contactData.instagram_message} />
                <FormField label="Preferred Office Location" value={contactData.instagram_preferredOffice} />
                <FormField label="Select The Workshop You Would Like To Attend" value={contactData.instagram_workshopSelection} />
              </div>
            </CollapsibleSection>

            {/* Medicaid - Intake Form Section */}
            <CollapsibleSection
              title="Medicaid - Intake Form"
              defaultOpen={false}
              isEmpty={!contactData.medicaid_assetsInvolved}
            >
              <div className="space-y-4 pl-6">
                <FormField label="What Assets Are Involved?" type="textarea" value={contactData.medicaid_assetsInvolved} />
              </div>
            </CollapsibleSection>

            {/* Estate Planning - Intake Form Section */}
            <CollapsibleSection
              title="Estate Planning - Intake Form"
              defaultOpen={false}
              isEmpty={!contactData.ep_goals && !contactData.ep_clientJoinMeeting && !contactData.ep_callerFirstName && !contactData.floridaResident && !contactData.maritalStatus}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Estate Planning Goals" type="textarea" value={contactData.ep_goals} />
                <RadioField
                  label="Will The Client Be Able To Join The Meeting?"
                  options={["Yes", "No", "No, but I have POA"]}
                  value={contactData.ep_clientJoinMeeting}
                />
                <RadioField
                  label="Can You Confirm That The Client Is Of Sound Mind?"
                  options={["Yes, the client is of sound mind", "No"]}
                  value={contactData.ep_clientSoundMind}
                />
                <FormField label="Caller Full Name" value={`${contactData.ep_callerFirstName || ""} ${contactData.ep_callerLastName || ""}`.trim() || undefined} />
                <FormField label="Caller Phone Number" value={contactData.ep_callerPhone} />
                <FormField label="Caller Email" value={contactData.ep_callerEmail} />
                <RadioField
                  label="Are You A Florida Resident?"
                  options={["Yes", "No", "No, but I am planning to become a resident within the next 12 months"]}
                  value={contactData.floridaResident}
                />
                <RadioField
                  label="Are You Single Or Married?"
                  options={["Single", "Married"]}
                  value={contactData.maritalStatus}
                />
                <RadioField
                  label="Are You And Your Spouse Planning Together?"
                  options={["Yes", "No"]}
                  value={contactData.planningTogether}
                />
                <FormField label="Spouse Email" value={contactData.spouseEmail} />
                <FormField label="Spouse Number" value={contactData.spousePhone} />
                <RadioField
                  label="Do You Have Children?"
                  options={["Yes", "No"]}
                  value={contactData.hasChildren}
                />
                <RadioField
                  label="Do You Have Existing Documents?"
                  options={["Yes", "No"]}
                  value={contactData.hasExistingDocs}
                />
                <FormField label="What Documents Do You Have" type="textarea" value={contactData.existingDocuments} />
                <RadioField
                  label="Is The Trust Funded?"
                  options={["Yes", "No"]}
                  value={contactData.isTrustFunded}
                />
              </div>
            </CollapsibleSection>

            {/* PBTA - Intake Form Section */}
            <CollapsibleSection
              title="PBTA - Intake Form"
              defaultOpen={false}
              isEmpty={!contactData.pbta_beneficiaryDisagreements && !contactData.pbta_assetOwnership && !contactData.pbta_hasWill && !contactData.pbta_decedentFirstName && !contactData.pbta_assetsForProbate}
            >
              <div className="space-y-4 pl-6">
                <RadioField
                  label="Are There Any Disagreements Among The Beneficiaries?"
                  options={["Yes", "No"]}
                  value={contactData.pbta_beneficiaryDisagreements}
                />
                <RadioField
                  label="Are All The Assets Owned Individually By The Decedent Or Are They In A Trust?"
                  options={["All in the trust", "Some are owned individually"]}
                  value={contactData.pbta_allAssetsOwnership}
                />
                <RadioField
                  label="Are The Assets Owned Individually?"
                  options={["In a trust", "Owned individually"]}
                  value={contactData.pbta_assetOwnership}
                />
                <RadioField
                  label="Was There A Will?"
                  options={["Yes", "No"]}
                  value={contactData.pbta_hasWill}
                />
                <RadioField
                  label="Do You Have Access To The Original Will?"
                  options={["Yes", "No"]}
                  value={contactData.pbta_accessToWill}
                />
                <FormField label="Assets For Probate" type="textarea" value={contactData.pbta_assetsForProbate} />
                <FormField label="Complete Name Of Decedent" value={`${contactData.pbta_decedentFirstName || ""} ${contactData.pbta_decedentLastName || ""}`.trim() || undefined} />
                <FormField label="Date Of Death Of The Decedent" value={contactData.pbta_dateOfDeath} />
                <FormField label="Relationship With The Decedent" value={contactData.pbta_relationshipToDecedent} />
              </div>
            </CollapsibleSection>

            {/* Deed - Intake Form Section */}
            <CollapsibleSection
              title="Deed - Intake Form"
              defaultOpen={false}
              isEmpty={!contactData.deed_concern && !contactData.deed_needsTrustCounsel}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Specify Caller's Concern" value={contactData.deed_concern} />
                <RadioField
                  label="Needs Trust Counsel?"
                  options={["Yes", "No"]}
                  value={contactData.deed_needsTrustCounsel}
                />
              </div>
            </CollapsibleSection>

            {/* DOC - Intake Form Section */}
            <CollapsibleSection
              title="DOC - Intake Form"
              defaultOpen={false}
              isEmpty={!contactData.docReview_floridaResident && !contactData.docReview_legalAdvice && !contactData.docReview_isDocumentOwner && !contactData.docReview_documents?.length}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Are You A Florida Resident - Doc" value={contactData.docReview_floridaResident} />
                <FormField label="Legal Advice Sought" type="textarea" value={contactData.docReview_legalAdvice} />
                <FormField label="Recent Life Events" type="textarea" value={contactData.docReview_recentLifeChanges} />
                <RadioField
                  label="Are You The Document Owner"
                  options={["Yes", "No"]}
                  value={contactData.docReview_isDocumentOwner}
                />
                <FormField label="Relationship With Document Owners" value={contactData.docReview_relationshipWithOwners} />
                <RadioField
                  label="Are You A Beneficiary Or Trustee"
                  options={["Beneficiary", "Trustee", "Both", "Neither"]}
                  value={contactData.docReview_isBeneficiaryOrTrustee}
                />
                <RadioField
                  label="Power Of Attorney (POA)"
                  options={["Yes", "No"]}
                  value={contactData.docReview_hasPOA}
                />
                <CheckboxField
                  label="What Documents Do You Have? - Doc"
                  options={["Trust", "Will", "POA", "Healthcare Directive", "Other"]}
                  values={contactData.docReview_documents}
                />
                <RadioField
                  label="Is There Any Pending Litigation Related To The Estate/Trust?"
                  options={["Yes", "No"]}
                  value={contactData.docReview_pendingLitigation}
                />
              </div>
            </CollapsibleSection>

            {/* Call Details Section */}
            <CollapsibleSection
              title="Call Details"
              defaultOpen={false}
              isEmpty={!contactData.callTranscript && !contactData.callSummary}
            >
              <div className="space-y-4 pl-6">
                <FormField label="Transcript" type="textarea" value={contactData.callTranscript} />
                <FormField label="Call Summary" type="textarea" value={contactData.callSummary} />
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Right Side - Tabs Content */}
        <div className="flex-1 rounded-lg border bg-white shadow-sm flex flex-col min-h-[600px]">
          {/* Tabs */}
          <div className="border-b px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col">
            {/* Messages Tab */}
            {activeTab === "messages" && (
              <>
                <div className="flex-1 p-4 overflow-y-auto">
                  {contactData.conversations && contactData.conversations.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 text-center">
                        {contactData.conversations.length} conversation(s) - Messages coming soon
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-500">No messages yet</p>
                    </div>
                  )}
                </div>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tasks</h3>
                  <Button size="sm" onClick={() => setIsAddTaskOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>

                {/* Task Filter */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">Filter:</span>
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      onClick={() => setTaskFilter("all")}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        taskFilter === "all"
                          ? "bg-primary text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setTaskFilter("pending")}
                      className={`px-3 py-1.5 text-xs font-medium border-l transition-colors ${
                        taskFilter === "pending"
                          ? "bg-primary text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setTaskFilter("completed")}
                      className={`px-3 py-1.5 text-xs font-medium border-l transition-colors ${
                        taskFilter === "completed"
                          ? "bg-primary text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <AddTaskModal
                  open={isAddTaskOpen}
                  onOpenChange={setIsAddTaskOpen}
                  onCreateTask={handleCreateTask}
                  defaultContactId={contactId as Id<"contacts">}
                  defaultOpportunityId={primaryOpportunity?._id}
                  hideLinkedFields={true}
                />

                {(() => {
                  const allTasks = contactData.tasks ?? [];
                  const pendingTasks = allTasks.filter((task) => !task.completed);
                  const completedTasks = allTasks.filter((task) => task.completed);

                  const getDisplayTasks = () => {
                    if (taskFilter === "pending") return pendingTasks;
                    if (taskFilter === "completed") return completedTasks;
                    return allTasks;
                  };

                  const renderTaskItem = (task: typeof allTasks[0]) => (
                    <div
                      key={task._id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
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
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? "text-gray-400 line-through" : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          task.completed
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {task.completed ? "Completed" : "Pending"}
                      </Badge>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  );

                  const renderTaskSection = (tasks: typeof allTasks, title: string) => (
                    <div className="space-y-3">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</h4>
                      {tasks.length > 0 ? (
                        tasks.map(renderTaskItem)
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-400">
                          No {title.toLowerCase().split(" ")[0]} tasks
                        </div>
                      )}
                    </div>
                  );

                  if (taskFilter === "all") {
                    return allTasks.length > 0 ? (
                      <div className="space-y-6">
                        {renderTaskSection(pendingTasks, `Pending (${pendingTasks.length})`)}
                        {renderTaskSection(completedTasks, `Completed (${completedTasks.length})`)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-gray-500">No tasks yet</p>
                      </div>
                    );
                  }

                  return getDisplayTasks().length > 0 ? (
                    <div className="space-y-3">
                      {getDisplayTasks().map(renderTaskItem)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-gray-500">No {taskFilter} tasks</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    Upload
                  </Button>
                </div>
                {contactData.documents && contactData.documents.length > 0 ? (
                  <div className="space-y-3">
                    {contactData.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded {formatDate(doc.uploadedAt)} &bull; {formatFileSize(doc.size)}
                            {doc.type && ` • ${doc.type.toUpperCase()}`}
                          </p>
                        </div>
                        {doc.downloadUrl && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
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
                        <Button variant="ghost" size="icon-sm" title="Delete">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-gray-500">
                      No documents uploaded
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
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
        defaultContactId={contactId as Id<"contacts">}
        defaultOpportunityId={primaryOpportunity?._id}
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
    </div>
  );
}
