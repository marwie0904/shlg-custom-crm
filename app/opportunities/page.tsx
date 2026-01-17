"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ChevronRight, DollarSign, User, Briefcase } from "lucide-react";
import { format } from "date-fns";

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

export default function OpportunitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch opportunities with contact data using Convex
  const opportunities = useQuery(api.opportunities.listForKanban, { limit: 200 });
  const stages = useQuery(api.pipelineStages.list, {});

  const isLoading = opportunities === undefined;

  // Create a map of stage IDs to stage names (use string keys since stageId is stored as string)
  const stageMap = new Map(stages?.map(s => [s._id.toString(), s.name]) || []);

  // Filter opportunities based on search query
  const filteredOpportunities = opportunities?.filter((opp) => {
    const query = searchQuery.toLowerCase();
    const stageName = stageMap.get(opp.stageId) || "";
    const contactName = opp.contact
      ? `${opp.contact.firstName} ${opp.contact.lastName}`.toLowerCase()
      : "";
    return (
      opp.title.toLowerCase().includes(query) ||
      stageName.toLowerCase().includes(query) ||
      contactName.includes(query) ||
      opp.practiceArea?.toLowerCase().includes(query) ||
      opp.source?.toLowerCase().includes(query)
    );
  }) || [];

  const handleRowClick = (opportunityId: string) => {
    router.push(`/opportunities/${opportunityId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Opportunity
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Opportunity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Practice Area</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Value</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-5" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Content */}
        {!isLoading && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Opportunity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stage</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Practice Area</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOpportunities.map((opp) => {
                    const stageName = stageMap.get(opp.stageId) || opp.stageId;
                    const contactName = opp.contact
                      ? `${opp.contact.firstName} ${opp.contact.lastName}`
                      : "—";
                    return (
                      <tr
                        key={opp._id}
                        onClick={() => handleRowClick(opp._id)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{opp.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{contactName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${stageColors[stageName] || "bg-gray-100 text-gray-700"} border-0`}>
                            {stageName}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {opp.practiceArea ? (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{opp.practiceArea}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            {formatCurrency(opp.estimatedValue)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {opp.createdAt ? format(new Date(opp.createdAt), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredOpportunities.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-gray-500">No opportunities found</p>
              </div>
            )}

            {/* Table Footer */}
            <div className="border-t px-4 py-3 text-sm text-gray-500">
              Showing {filteredOpportunities.length} of {opportunities?.length || 0} opportunities
            </div>
          </>
        )}
      </div>
    </div>
  );
}
