"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, MoreHorizontal, Users } from "lucide-react";
import { WorkshopDetailModal } from "@/components/workshops/WorkshopDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useMockWorkshops } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Open: "bg-blue-100 text-blue-700",
  Upcoming: "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Full: "bg-purple-100 text-purple-700",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCapacityColor(current: number, max: number): string {
  const percentage = (current / max) * 100;
  if (percentage >= 100) return "text-red-600";
  if (percentage >= 80) return "text-yellow-600";
  return "text-gray-600";
}

export default function WorkshopsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<Id<"workshops"> | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Use mock data or real Convex data based on environment
  const mockWorkshopsList = useMockWorkshops();
  const convexWorkshops = useQuery(
    api.workshops.list,
    USE_MOCK_DATA ? "skip" : {}
  );

  const workshops = USE_MOCK_DATA ? mockWorkshopsList : convexWorkshops;

  const filteredWorkshops = workshops?.filter(
    (workshop) =>
      workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workshop.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (workshop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (workshop.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      workshop.status.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const handleRowClick = (workshopId: Id<"workshops">) => {
    setSelectedWorkshopId(workshopId);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsDetailModalOpen(open);
    if (!open) {
      setSelectedWorkshopId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
      </div>

      {/* Search and Add Workshop Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search workshops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => router.push("/workshops/new")}>
          <Plus className="h-4 w-4" />
          Add Workshop
        </Button>
      </div>

      {/* Workshops Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        {/* Loading Skeleton (never loading in mock mode) */}
        {!USE_MOCK_DATA && workshops === undefined && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Capacity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-6 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table */}
        {(USE_MOCK_DATA || workshops !== undefined) && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Capacity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredWorkshops.map((workshop) => (
                    <tr
                      key={workshop._id}
                      onClick={() => handleRowClick(workshop._id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {workshop.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {workshop.description || workshop.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {workshop.location || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(workshop.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {workshop.time}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[workshop.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {workshop.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span
                            className={`text-sm font-medium ${getCapacityColor(
                              workshop.currentCapacity,
                              workshop.maxCapacity
                            )}`}
                          >
                            {workshop.currentCapacity}
                          </span>
                          <span className="text-sm text-gray-400">/</span>
                          <span className="text-sm text-gray-500">
                            {workshop.maxCapacity}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Add dropdown menu for actions
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredWorkshops.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-sm text-gray-500">No workshops found</p>
              </div>
            )}

            {/* Table Footer */}
            <div className="border-t px-4 py-3 text-sm text-gray-500">
              Showing {filteredWorkshops.length} of {workshops.length} workshops
            </div>
          </>
        )}
      </div>

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshopId={selectedWorkshopId}
        open={isDetailModalOpen}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
