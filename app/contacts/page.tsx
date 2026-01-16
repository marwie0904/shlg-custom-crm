"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddTaskModal, NewTaskData } from "@/components/tasks/AddTaskModal";
import { Search, Plus, MoreHorizontal, CheckSquare, Link2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Relationship type colors
const relationshipColors: Record<string, string> = {
  Spouse: "bg-pink-100 text-pink-700 border-pink-200",
  Child: "bg-blue-100 text-blue-700 border-blue-200",
  Parent: "bg-purple-100 text-purple-700 border-purple-200",
  Sibling: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Grandparent: "bg-amber-100 text-amber-700 border-amber-200",
  Grandchild: "bg-teal-100 text-teal-700 border-teal-200",
  Caregiver: "bg-green-100 text-green-700 border-green-200",
  "Power of Attorney": "bg-orange-100 text-orange-700 border-orange-200",
  Trustee: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Beneficiary: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Guardian: "bg-rose-100 text-rose-700 border-rose-200",
  "Business Partner": "bg-slate-100 text-slate-700 border-slate-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
};

// Skeleton row component for loading state
function ContactRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-36" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-6 w-24 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-8 rounded" />
      </td>
    </tr>
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
  // Legacy/fallback stages
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

export default function ContactsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Fetch contacts with opportunities from Convex
  const contacts = useQuery(api.contacts.listWithOpportunities, {
    searchQuery: searchQuery || undefined,
    limit: 100,
  });

  const handleCreateTask = (taskData: NewTaskData) => {
    console.log("Task created from Contacts:", taskData);
  };

  const isLoading = contacts === undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
      </div>

      {/* Search and Add Contact Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddTaskOpen(true)}>
            <CheckSquare className="h-4 w-4" />
            Add Task
          </Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onCreateTask={handleCreateTask}
      />

      {/* Contacts Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Relationship
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Opportunity
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Tags
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <>
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                  <ContactRowSkeleton />
                </>
              ) : (
                contacts?.map((contact) => (
                  <tr
                    key={contact._id}
                    onClick={() => router.push(`/contacts/${contact._id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.phone || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.email || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {contact.primaryContactId && contact.relationshipType ? (
                        <div className="flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 text-gray-400" />
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              relationshipColors[contact.relationshipType] || "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {contact.relationshipType}
                          </Badge>
                          <span
                            className="text-xs text-blue-600 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/contacts/${contact.primaryContactId}`);
                            }}
                          >
                            {contact.primaryContactName}
                          </span>
                        </div>
                      ) : contact.subContacts && contact.subContacts.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {contact.subContacts.length} linked
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.opportunityTitle || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {contact.opportunityStage ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            stageColors[contact.opportunityStage] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {contact.opportunityStage}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {contact.source || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-xs ${
                              tagColors[tag] || "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {!isLoading && contacts?.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No contacts found</p>
          </div>
        )}

        {/* Table Footer */}
        <div className="border-t px-4 py-3 text-sm text-gray-500">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            `Showing ${contacts?.length || 0} contacts`
          )}
        </div>
      </div>
    </div>
  );
}
