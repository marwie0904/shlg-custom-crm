"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface InvoicesSkeletonProps {
  rows?: number;
}

export function InvoicesSkeleton({ rows = 8 }: InvoicesSkeletonProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Invoice Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Opportunity
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Issue Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Payment Link
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                {/* Invoice Name */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                {/* Invoice # */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                {/* Contact */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </td>
                {/* Opportunity */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-36" />
                </td>
                {/* Issue Date */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                {/* Amount */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </td>
                {/* Status */}
                <td className="px-4 py-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                {/* Payment Link */}
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-6 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="border-t px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}
