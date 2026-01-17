"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddInvoiceModal } from "@/components/invoices/AddInvoiceModal";
import { AddProductModal } from "@/components/invoices/AddProductModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { InvoicesSkeleton } from "@/components/invoices/InvoicesSkeleton";
import { Search, Plus, MoreHorizontal, ExternalLink, Package } from "lucide-react";
import { useMockInvoices } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  Cancelled: "bg-gray-100 text-gray-500",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateLink(link: string, maxLength: number = 30): string {
  if (!link) return "—";
  if (link.length <= maxLength) return link;
  return link.substring(0, maxLength) + "...";
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
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

  // Use mock data or real Convex data based on environment
  const mockInvoices = useMockInvoices({ limit: 100 });
  const convexInvoices = useQuery(
    api.invoices.list,
    USE_MOCK_DATA ? "skip" : { limit: 100 }
  );

  const invoices = USE_MOCK_DATA ? mockInvoices : convexInvoices;

  const isLoading = !USE_MOCK_DATA && invoices === undefined;

  // Filter invoices based on search query
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (!searchQuery) return invoices;

    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (invoice) =>
        invoice.name.toLowerCase().includes(query) ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.contactName?.toLowerCase().includes(query) ||
        invoice.opportunityTitle?.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      </div>

      {/* Search and Add Invoice Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAddProductOpen(true)}>
            <Package className="h-4 w-4" />
            Add Product/Service
          </Button>
          <Button onClick={() => setIsAddInvoiceOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Invoice
          </Button>
        </div>
      </div>

      {/* Modals */}
      <AddInvoiceModal
        open={isAddInvoiceOpen}
        onOpenChange={setIsAddInvoiceOpen}
      />
      <AddProductModal
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
      />

      {/* Invoices Table */}
      {isLoading ? (
        <InvoicesSkeleton rows={8} />
      ) : (
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
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setIsInvoiceDetailOpen(true);
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {invoice.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.contactName || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.opportunityTitle || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[invoice.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {invoice.paymentLink ? (
                        <a
                          href={invoice.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                          title={invoice.paymentLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{truncateLink(invoice.paymentLink)}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredInvoices.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-500">
                {searchQuery ? "No invoices found matching your search" : "No invoices yet. Create your first invoice!"}
              </p>
            </div>
          )}

          {/* Table Footer */}
          <div className="border-t px-4 py-3 text-sm text-gray-500">
            {`Showing ${filteredInvoices.length} of ${invoices?.length || 0} invoices`}
          </div>
        </div>
      )}

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
