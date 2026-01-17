"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Check,
  X,
  Phone,
  Mail,
  Clock,
  RotateCcw,
  Loader2,
  Calendar,
  Eye,
  Copy,
  Trash2,
  Pencil,
  UserPlus,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Source badge colors
const sourceColors: Record<string, string> = {
  "Call From CallRail": "bg-blue-100 text-blue-700 border-blue-200",
  "Website Form": "bg-green-100 text-green-700 border-green-200",
  "Facebook Ads": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Google Ads": "bg-red-100 text-red-700 border-red-200",
  Referral: "bg-purple-100 text-purple-700 border-purple-200",
  Workshop: "bg-orange-100 text-orange-700 border-orange-200",
  "Workshop Registration": "bg-orange-100 text-orange-700 border-orange-200",
  Instagram: "bg-pink-100 text-pink-700 border-pink-200",
  Messenger: "bg-blue-100 text-blue-700 border-blue-200",
  Website: "bg-green-100 text-green-700 border-green-200",
  "Contact Us": "bg-teal-100 text-teal-700 border-teal-200",
  "Intake Form": "bg-cyan-100 text-cyan-700 border-cyan-200",
};

// Helper to get source color
function getSourceColor(source: string): string {
  if (sourceColors[source]) return sourceColors[source];
  if (source.toLowerCase().includes("workshop")) return sourceColors["Workshop"];
  return "bg-gray-100 text-gray-700";
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Skeleton component for loading state
function LeadCardSkeleton() {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="flex gap-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

// Type for intake lead data from Convex
type IntakeLeadData = {
  _id: Id<"intake">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  practiceArea: string;
  callDetails?: string;
  referralSource?: string;
  leadStatus?: string;
  createdAt: number;
  updatedAt: number;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentStaffName?: string;
};

// Type for duplicate lead data
type DuplicateLeadData = IntakeLeadData & {
  duplicateMatchType?: string;
  duplicateOfContactId?: Id<"contacts">;
  duplicateContact?: {
    _id: Id<"contacts">;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  } | null;
  duplicateOpportunity?: {
    _id: Id<"opportunities">;
    title: string;
    stageId: string;
    practiceArea?: string;
    createdAt: number;
  } | null;
};

interface LeadCardProps {
  lead: IntakeLeadData;
  onAccept?: (id: Id<"intake">) => void;
  onIgnore?: (id: Id<"intake">) => void;
  onRestore?: (id: Id<"intake">) => void;
  isIgnored?: boolean;
  isLoading?: boolean;
}

function LeadCard({
  lead,
  onAccept,
  onIgnore,
  onRestore,
  isIgnored,
  isLoading,
}: LeadCardProps) {
  const contactName = `${lead.firstName} ${lead.lastName}`.trim() || "Unknown";
  const source = lead.referralSource || "Intake Form";

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{contactName}</h3>
          <Badge variant="outline" className="text-xs">
            {lead.practiceArea}
          </Badge>
        </div>
        <div className="flex gap-2">
          {isIgnored ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore?.(lead._id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Restore
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => onIgnore?.(lead._id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                Ignore
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onAccept?.(lead._id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Accept
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Call Details */}
      {lead.callDetails && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Call Details</p>
            <p className="text-sm text-gray-700 leading-snug line-clamp-2">
              {lead.callDetails}
            </p>
          </div>
        </div>
      )}

      {/* Appointment Info */}
      {lead.appointmentDate && lead.appointmentTime && (
        <div className="px-4 pb-3">
          <div className="bg-green-50 border border-green-100 rounded p-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">
              Appointment: {lead.appointmentDate} at {lead.appointmentTime}
              {lead.appointmentStaffName && ` with ${lead.appointmentStaffName}`}
            </span>
          </div>
        </div>
      )}

      {/* Info Row */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 text-gray-600">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          {lead.email || <span className="text-gray-400">n/a</span>}
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          {lead.phone || <span className="text-gray-400">n/a</span>}
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatDate(lead.createdAt)}
        </span>
        <Badge variant="outline" className={`text-xs ${getSourceColor(source)}`}>
          {source}
        </Badge>
        <Link
          href={`/intake/${lead._id}`}
          className="ml-auto text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-3.5 w-3.5" />
          View Intake
        </Link>
      </div>
    </div>
  );
}

// Duplicate Lead Card Component
interface DuplicateLeadCardProps {
  lead: DuplicateLeadData;
  onRemove: (id: Id<"intake">) => void;
  onUpdateEmail: (id: Id<"intake">, newEmail: string) => void;
  onUpdatePhone: (id: Id<"intake">, newPhone: string) => void;
  onCreateAsNew: (id: Id<"intake">) => void;
  isLoading?: boolean;
}

function DuplicateLeadCard({
  lead,
  onRemove,
  onUpdateEmail,
  onUpdatePhone,
  onCreateAsNew,
  isLoading,
}: DuplicateLeadCardProps) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newEmail, setNewEmail] = useState(lead.email || "");
  const [newPhone, setNewPhone] = useState(lead.phone || "");

  const contactName = `${lead.firstName} ${lead.lastName}`.trim() || "Unknown";
  const source = lead.referralSource || "Intake Form";

  const duplicateContactName = lead.duplicateContact
    ? `${lead.duplicateContact.firstName} ${lead.duplicateContact.lastName}`.trim()
    : "Unknown";

  const matchTypeLabel =
    lead.duplicateMatchType === "both"
      ? "Email & Phone"
      : lead.duplicateMatchType === "email"
        ? "Email"
        : "Phone";

  const handleEmailSave = () => {
    if (newEmail && newEmail !== lead.email) {
      onUpdateEmail(lead._id, newEmail);
    }
    setEditingEmail(false);
  };

  const handlePhoneSave = () => {
    if (newPhone && newPhone !== lead.phone) {
      onUpdatePhone(lead._id, newPhone);
    }
    setEditingPhone(false);
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-amber-100 bg-amber-50/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h3 className="text-base font-semibold text-gray-900">{contactName}</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {lead.practiceArea}
          </Badge>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
            <Copy className="h-3 w-3 mr-1" />
            Duplicate ({matchTypeLabel})
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => onRemove(lead._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Remove
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
            onClick={() => onCreateAsNew(lead._id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-1" />
            )}
            Create as New
          </Button>
        </div>
      </div>

      {/* Duplicate Match Section */}
      <div className="p-4 border-b bg-gray-50">
        <p className="text-xs font-medium text-gray-500 mb-3">
          Matches Existing Contact
        </p>
        <div className="flex items-center gap-4">
          {/* New Lead Info */}
          <div className="flex-1 bg-white rounded-lg border p-3">
            <p className="text-xs font-medium text-gray-400 mb-2">New Lead</p>
            <p className="text-sm font-medium text-gray-900 mb-2">{contactName}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail
                  className={cn(
                    "h-3.5 w-3.5",
                    lead.duplicateMatchType === "email" ||
                      lead.duplicateMatchType === "both"
                      ? "text-amber-500"
                      : "text-gray-400"
                  )}
                />
                {editingEmail ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleEmailSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        setEditingEmail(false);
                        setNewEmail(lead.email || "");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1">
                    <span
                      className={cn(
                        "text-xs",
                        lead.duplicateMatchType === "email" ||
                          lead.duplicateMatchType === "both"
                          ? "text-amber-700 font-medium"
                          : "text-gray-600"
                      )}
                    >
                      {lead.email || "n/a"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 ml-auto"
                      onClick={() => setEditingEmail(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone
                  className={cn(
                    "h-3.5 w-3.5",
                    lead.duplicateMatchType === "phone" ||
                      lead.duplicateMatchType === "both"
                      ? "text-amber-500"
                      : "text-gray-400"
                  )}
                />
                {editingPhone ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handlePhoneSave}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => {
                        setEditingPhone(false);
                        setNewPhone(lead.phone || "");
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1">
                    <span
                      className={cn(
                        "text-xs",
                        lead.duplicateMatchType === "phone" ||
                          lead.duplicateMatchType === "both"
                          ? "text-amber-700 font-medium"
                          : "text-gray-600"
                      )}
                    >
                      {lead.phone || "n/a"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1.5 ml-auto"
                      onClick={() => setEditingPhone(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="h-5 w-5 text-gray-300 flex-shrink-0" />

          {/* Existing Contact Info */}
          <div className="flex-1 bg-white rounded-lg border border-green-200 p-3">
            <p className="text-xs font-medium text-green-600 mb-2">Existing Contact</p>
            <p className="text-sm font-medium text-gray-900 mb-2">{duplicateContactName}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Mail
                  className={cn(
                    "h-3.5 w-3.5",
                    lead.duplicateMatchType === "email" ||
                      lead.duplicateMatchType === "both"
                      ? "text-green-500"
                      : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    lead.duplicateMatchType === "email" ||
                      lead.duplicateMatchType === "both"
                      ? "text-green-700 font-medium"
                      : "text-gray-600"
                  )}
                >
                  {lead.duplicateContact?.email || "n/a"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone
                  className={cn(
                    "h-3.5 w-3.5",
                    lead.duplicateMatchType === "phone" ||
                      lead.duplicateMatchType === "both"
                      ? "text-green-500"
                      : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    lead.duplicateMatchType === "phone" ||
                      lead.duplicateMatchType === "both"
                      ? "text-green-700 font-medium"
                      : "text-gray-600"
                  )}
                >
                  {lead.duplicateContact?.phone || "n/a"}
                </span>
              </div>
            </div>
            {lead.duplicateContact && (
              <Link
                href={`/contacts/${lead.duplicateContact._id}`}
                className="mt-2 text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View Contact
              </Link>
            )}
          </div>
        </div>

        {/* Opportunity Info */}
        {lead.duplicateOpportunity && (
          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Existing Opportunity:</span>{" "}
              {lead.duplicateOpportunity.title}
              {lead.duplicateOpportunity.practiceArea && (
                <> ({lead.duplicateOpportunity.practiceArea})</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Call Details */}
      {lead.callDetails && (
        <div className="px-4 py-3">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes from Lead</p>
            <p className="text-sm text-gray-700 leading-snug">{lead.callDetails}</p>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 text-gray-600">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatDate(lead.createdAt)}
        </span>
        <Badge variant="outline" className={`text-xs ${getSourceColor(source)}`}>
          {source}
        </Badge>
        <Link
          href={`/intake/${lead._id}`}
          className="ml-auto text-gray-500 hover:text-gray-700 flex items-center gap-1 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <Eye className="h-3.5 w-3.5" />
          View Intake
        </Link>
      </div>
    </div>
  );
}

type TabType = "pending" | "ignored" | "duplicate";

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [loadingId, setLoadingId] = useState<Id<"intake"> | null>(null);

  // Fetch leads from Convex
  const pendingLeads = useQuery(api.intake.listPendingLeads, { limit: 100 });
  const ignoredLeads = useQuery(api.intake.listIgnoredLeads, { limit: 100 });
  const duplicateLeads = useQuery(api.intake.listDuplicateLeads, { limit: 100 });

  // Mutations
  const acceptLead = useMutation(api.intake.acceptLead);
  const ignoreLead = useMutation(api.intake.ignoreLead);
  const restoreLead = useMutation(api.intake.restoreLead);
  const removeDuplicateLead = useMutation(api.intake.removeDuplicateLead);
  const updateDuplicateEmail = useMutation(api.intake.updateDuplicateEmail);
  const updateDuplicatePhone = useMutation(api.intake.updateDuplicatePhone);
  const createAsNewLead = useMutation(api.intake.createAsNewLead);

  const isLoading =
    pendingLeads === undefined ||
    ignoredLeads === undefined ||
    duplicateLeads === undefined;

  const handleAccept = async (id: Id<"intake">) => {
    try {
      setLoadingId(id);
      await acceptLead({ id });
    } catch (error) {
      console.error("Failed to accept lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleIgnore = async (id: Id<"intake">) => {
    try {
      setLoadingId(id);
      await ignoreLead({ id });
    } catch (error) {
      console.error("Failed to ignore lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRestore = async (id: Id<"intake">) => {
    try {
      setLoadingId(id);
      await restoreLead({ id });
    } catch (error) {
      console.error("Failed to restore lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveDuplicate = async (id: Id<"intake">) => {
    try {
      setLoadingId(id);
      await removeDuplicateLead({ id });
    } catch (error) {
      console.error("Failed to remove duplicate:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateEmail = async (id: Id<"intake">, newEmail: string) => {
    try {
      setLoadingId(id);
      await updateDuplicateEmail({ id, newEmail });
    } catch (error) {
      console.error("Failed to update email:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdatePhone = async (id: Id<"intake">, newPhone: string) => {
    try {
      setLoadingId(id);
      await updateDuplicatePhone({ id, newPhone });
    } catch (error) {
      console.error("Failed to update phone:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateAsNew = async (id: Id<"intake">) => {
    try {
      setLoadingId(id);
      await createAsNewLead({ id });
    } catch (error) {
      console.error("Failed to create as new lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const pendingCount = pendingLeads?.length ?? 0;
  const ignoredCount = ignoredLeads?.length ?? 0;
  const duplicateCount = duplicateLeads?.length ?? 0;

  return (
    <div className="px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fresh Leads</h1>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm px-2.5 py-0.5">
              {pendingCount} pending
            </Badge>
            {duplicateCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm px-2.5 py-0.5">
                {duplicateCount} duplicate
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "pending"
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("ignored")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "ignored"
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Ignored ({ignoredCount})
          </button>
          <button
            onClick={() => setActiveTab("duplicate")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "duplicate"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {duplicateCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
            Duplicate ({duplicateCount})
          </button>
        </div>

        {/* Lead Cards */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </>
          ) : activeTab === "duplicate" ? (
            duplicateLeads && duplicateLeads.length > 0 ? (
              duplicateLeads.map((lead) => (
                <DuplicateLeadCard
                  key={lead._id}
                  lead={lead as DuplicateLeadData}
                  onRemove={handleRemoveDuplicate}
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onCreateAsNew={handleCreateAsNew}
                  isLoading={loadingId === lead._id}
                />
              ))
            ) : (
              <div className="rounded-lg border bg-white p-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  No duplicates detected
                </h3>
                <p className="text-sm text-gray-500">
                  All leads have unique contact information.
                </p>
              </div>
            )
          ) : activeTab === "pending" ? (
            pendingLeads && pendingLeads.length > 0 ? (
              pendingLeads.map((lead) => (
                <LeadCard
                  key={lead._id}
                  lead={lead as IntakeLeadData}
                  onAccept={handleAccept}
                  onIgnore={handleIgnore}
                  isLoading={loadingId === lead._id}
                />
              ))
            ) : (
              <div className="rounded-lg border bg-white p-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  All caught up!
                </h3>
                <p className="text-sm text-gray-500">
                  No fresh leads to review. New intake submissions will appear here.
                </p>
              </div>
            )
          ) : ignoredLeads && ignoredLeads.length > 0 ? (
            ignoredLeads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead as IntakeLeadData}
                onRestore={handleRestore}
                isIgnored={true}
                isLoading={loadingId === lead._id}
              />
            ))
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <X className="h-5 w-5 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                No ignored leads
              </h3>
              <p className="text-sm text-gray-500">
                Leads you ignore will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
