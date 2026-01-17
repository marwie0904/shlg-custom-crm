"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Phone, Mail, Clock, RotateCcw, Briefcase, Loader2, MessageSquare, Facebook, Instagram } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Source badge colors
const sourceColors: Record<string, string> = {
  "Call From CallRail": "bg-blue-100 text-blue-700 border-blue-200",
  "Website Form": "bg-green-100 text-green-700 border-green-200",
  "Facebook Ads": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Google Ads": "bg-red-100 text-red-700 border-red-200",
  "Referral": "bg-purple-100 text-purple-700 border-purple-200",
  "Workshop": "bg-orange-100 text-orange-700 border-orange-200",
  "Workshop Registration": "bg-orange-100 text-orange-700 border-orange-200",
  "Instagram": "bg-pink-100 text-pink-700 border-pink-200",
  "Messenger": "bg-blue-100 text-blue-700 border-blue-200",
  "Website": "bg-green-100 text-green-700 border-green-200",
  "Contact Us": "bg-teal-100 text-teal-700 border-teal-200",
};

// Helper to get source color (checks for partial matches for dynamic sources like "Workshop Registration 09/24")
function getSourceColor(source: string): string {
  // First check exact match
  if (sourceColors[source]) return sourceColors[source];

  // Check partial matches for dynamic sources
  if (source.toLowerCase().includes("workshop")) return sourceColors["Workshop"];

  // Default
  return "bg-gray-100 text-gray-700";
}

// Helper to check if source is from social media (Messenger/Instagram)
function isSocialSource(source: string): boolean {
  const lowerSource = source.toLowerCase();
  return (
    lowerSource === "messenger" ||
    lowerSource === "instagram" ||
    lowerSource.includes("facebook messenger") ||
    lowerSource.includes("instagram dm") ||
    lowerSource.includes("instagram direct")
  );
}

// Get icon for social source
function getSocialIcon(source: string) {
  const lowerSource = source.toLowerCase();
  if (lowerSource === "instagram" || lowerSource.includes("instagram")) {
    return <Instagram className="h-4 w-4" />;
  }
  return <Facebook className="h-4 w-4" />;
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

// Type for lead data from Convex
type LeadData = {
  _id: Id<"opportunities">;
  title: string;
  contactId: Id<"contacts">;
  pipelineId: string;
  stageId: string;
  estimatedValue: number;
  practiceArea?: string;
  source?: string;
  notes?: string;
  leadStatus?: string;
  createdAt: number;
  updatedAt: number;
  contact: {
    _id: Id<"contacts">;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    source?: string;
    notes?: string;
  } | null;
};

interface LeadCardProps {
  lead: LeadData;
  onAccept?: (id: Id<"opportunities">) => void;
  onIgnore?: (id: Id<"opportunities">) => void;
  onRestore?: (id: Id<"opportunities">) => void;
  isIgnored?: boolean;
  isLoading?: boolean;
}

function LeadCard({ lead, onAccept, onIgnore, onRestore, isIgnored, isLoading }: LeadCardProps) {
  const contactName = lead.contact
    ? `${lead.contact.firstName} ${lead.contact.lastName}`
    : lead.title;
  const source = lead.source || lead.contact?.source || "Unknown";
  const isSocial = isSocialSource(source);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <h3 className="text-base font-semibold text-gray-900">
          {contactName}{" "}
          <span className="text-gray-400 font-normal text-sm">
            - {source}
          </span>
        </h3>
        <div className="flex gap-2">
          {isSocial && (
            <Link href="/conversations">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  source.toLowerCase().includes("instagram")
                    ? "text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                    : "text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                )}
              >
                {getSocialIcon(source)}
                <span className="ml-1">View Conversation</span>
              </Button>
            </Link>
          )}
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

      {/* Notes/Message */}
      {(lead.notes || lead.contact?.notes) && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700 leading-snug">
              {lead.notes || lead.contact?.notes}
            </p>
          </div>
        </div>
      )}

      {/* Info Row */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 text-gray-600">
          <Mail className="h-3.5 w-3.5 text-gray-400" />
          {lead.contact?.email || <span className="text-gray-400">n/a</span>}
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          {lead.contact?.phone || <span className="text-gray-400">n/a</span>}
        </span>
        <span className="flex items-center gap-1.5 text-gray-600">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatDate(lead.createdAt)}
        </span>
        {lead.practiceArea && (
          <span className="flex items-center gap-1.5 text-gray-600">
            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
            {lead.practiceArea}
          </span>
        )}
        <Badge
          variant="outline"
          className={`text-xs ${getSourceColor(source)}`}
        >
          {source}
        </Badge>
      </div>
    </div>
  );
}

type TabType = "pending" | "ignored";

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [loadingId, setLoadingId] = useState<Id<"opportunities"> | null>(null);

  // Fetch leads from Convex
  const pendingLeads = useQuery(api.opportunities.listPendingLeads, { limit: 100 });
  const ignoredLeads = useQuery(api.opportunities.listIgnoredLeads, { limit: 100 });

  // Mutations
  const acceptLead = useMutation(api.opportunities.acceptLead);
  const ignoreLead = useMutation(api.opportunities.ignoreLead);
  const restoreLead = useMutation(api.opportunities.restoreLead);

  const isLoading = pendingLeads === undefined || ignoredLeads === undefined;

  const handleAccept = async (id: Id<"opportunities">) => {
    try {
      setLoadingId(id);
      await acceptLead({ id });
    } catch (error) {
      console.error("Failed to accept lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleIgnore = async (id: Id<"opportunities">) => {
    try {
      setLoadingId(id);
      await ignoreLead({ id });
    } catch (error) {
      console.error("Failed to ignore lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRestore = async (id: Id<"opportunities">) => {
    try {
      setLoadingId(id);
      await restoreLead({ id });
    } catch (error) {
      console.error("Failed to restore lead:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const displayedLeads = activeTab === "pending" ? pendingLeads : ignoredLeads;
  const pendingCount = pendingLeads?.length ?? 0;
  const ignoredCount = ignoredLeads?.length ?? 0;

  return (
    <div className="px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Fresh Leads</h1>
          <Badge variant="outline" className="text-sm px-2.5 py-0.5">
            {pendingCount} pending
          </Badge>
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
        </div>

        {/* Lead Cards */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              <LeadCardSkeleton />
              <LeadCardSkeleton />
              <LeadCardSkeleton />
            </>
          ) : displayedLeads && displayedLeads.length > 0 ? (
            displayedLeads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onAccept={handleAccept}
                onIgnore={handleIgnore}
                onRestore={handleRestore}
                isIgnored={activeTab === "ignored"}
                isLoading={loadingId === lead._id}
              />
            ))
          ) : (
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                {activeTab === "pending" ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {activeTab === "pending" ? "All caught up!" : "No ignored leads"}
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === "pending"
                  ? "No fresh leads to review."
                  : "Leads you ignore will appear here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
