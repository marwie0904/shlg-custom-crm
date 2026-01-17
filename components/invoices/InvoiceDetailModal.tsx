"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMockContacts, useMockOpportunities, useMockProducts, useMockMutation } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Pencil,
  Trash2,
  ExternalLink,
  DollarSign,
  Calendar,
  User,
  FileText,
  Plus,
  X,
  Check,
  Send,
  CreditCard,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface LineItem {
  productId?: Id<"products">;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: Id<"invoices">;
  contactId: Id<"contacts">;
  opportunityId?: Id<"opportunities">;
  name: string;
  invoiceNumber: string;
  amount: number;
  amountPaid?: number;
  currency?: string;
  issueDate: number;
  dueDate?: number;
  paidDate?: number;
  status: string;
  paymentLink?: string;
  paymentMethod?: string;
  lineItems?: LineItem[];
  notes?: string;
  confidoInvoiceId?: string;
  confidoClientId?: string;
  confidoMatterId?: string;
  createdAt: number;
  updatedAt: number;
}

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

const STATUS_OPTIONS = ["Draft", "Sent", "Pending", "Paid", "Overdue", "Cancelled"];

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

export function InvoiceDetailModal({
  invoice,
  open,
  onOpenChange,
  onDeleted,
}: InvoiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Use mock data or real Convex data based on environment
  const mockContacts = useMockContacts({});
  const mockOpportunities = useMockOpportunities({});
  const mockProducts = useMockProducts({ activeOnly: true });
  const mockMutation = useMockMutation();

  // Fetch related data (skip in mock mode)
  const convexContact = useQuery(
    api.contacts.getById,
    USE_MOCK_DATA ? "skip" : (invoice ? { id: invoice.contactId } : "skip")
  );
  const convexOpportunity = useQuery(
    api.opportunities.getById,
    USE_MOCK_DATA ? "skip" : (invoice?.opportunityId ? { id: invoice.opportunityId } : "skip")
  );
  const convexProducts = useQuery(
    api.products.list,
    USE_MOCK_DATA ? "skip" : { activeOnly: true }
  );
  const invoiceDocument = useQuery(
    api.documents.getByInvoiceIdWithUrl,
    USE_MOCK_DATA ? "skip" : (invoice ? { invoiceId: invoice._id } : "skip")
  );

  // Use mock or convex data
  const contact = USE_MOCK_DATA
    ? mockContacts.find(c => c._id === invoice?.contactId)
    : convexContact;
  const opportunity = USE_MOCK_DATA
    ? mockOpportunities.find(o => o._id === invoice?.opportunityId)
    : convexOpportunity;
  const products = USE_MOCK_DATA ? mockProducts : convexProducts;

  // Mutations (use mock in demo mode)
  const updateInvoiceMutation = useMutation(api.invoices.update);
  const deleteInvoiceMutation = useMutation(api.invoices.remove);
  const updateStatusMutation = useMutation(api.invoices.updateStatus);
  const markAsPaidMutation = useMutation(api.invoices.markAsPaid);
  const sendInvoiceMutation = useMutation(api.invoices.send);

  const updateInvoice = USE_MOCK_DATA ? mockMutation : updateInvoiceMutation;
  const deleteInvoice = USE_MOCK_DATA ? mockMutation : deleteInvoiceMutation;
  const updateStatus = USE_MOCK_DATA ? mockMutation : updateStatusMutation;
  const markAsPaid = USE_MOCK_DATA ? mockMutation : markAsPaidMutation;
  const sendInvoice = USE_MOCK_DATA ? mockMutation : sendInvoiceMutation;

  // Calculate total from line items
  const calculatedTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  }, [lineItems]);

  // Reset form when invoice changes
  useEffect(() => {
    if (invoice && open) {
      setName(invoice.name);
      setDueDate(invoice.dueDate ? format(new Date(invoice.dueDate), "yyyy-MM-dd") : "");
      setNotes(invoice.notes || "");
      setStatus(invoice.status);
      setLineItems(invoice.lineItems || []);
      setIsEditing(false);
    }
  }, [invoice, open]);

  if (!invoice) return null;

  const contactName = contact
    ? `${contact.firstName} ${contact.lastName}`
    : "Loading...";

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    const updated = [...lineItems];
    const item = { ...updated[index] };

    if (field === "productId" && value) {
      // If a product is selected, populate from product
      const product = products?.find((p) => p._id === value);
      if (product) {
        item.productId = product._id;
        item.description = product.name;
        item.unitPrice = product.price;
        item.total = item.quantity * product.price;
      }
    } else if (field === "quantity" || field === "unitPrice") {
      const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
      (item as Record<string, unknown>)[field] = numValue;
      item.total = (field === "quantity" ? numValue : item.quantity) *
                   (field === "unitPrice" ? numValue : item.unitPrice);
    } else if (field === "description") {
      item.description = value as string;
      item.productId = undefined; // Clear product reference when manually editing description
    }

    updated[index] = item;
    setLineItems(updated);
  };

  const handleSave = async () => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await updateInvoice({
        id: invoice._id,
        name,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        notes: notes || undefined,
        status,
        amount: calculatedTotal || invoice.amount,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await deleteInvoice({ id: invoice._id });
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await markAsPaid({ id: invoice._id });
      setStatus("Paid");
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await sendInvoice({ id: invoice._id });
      setStatus("Sent");
    } catch (error) {
      console.error("Failed to send invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await updateStatus({ id: invoice._id, status: newStatus });
      setStatus(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingBalance = invoice.amount - (invoice.amountPaid || 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] !max-w-[800px] sm:!max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold">
                  {isEditing ? (
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xl font-semibold h-auto py-1"
                    />
                  ) : (
                    invoice.name
                  )}
                </DialogTitle>
                {!isEditing && (
                  <Badge className={`${statusColors[status] || statusColors.Draft} border-0`}>
                    {status}
                  </Badge>
                )}
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">{invoice.invoiceNumber}</p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status Controls (when editing) */}
            {isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quick Actions (when not editing) */}
            {!isEditing && (
              <div className="flex flex-wrap gap-2">
                {invoiceDocument?.downloadUrl && (
                  <a
                    href={invoiceDocument.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={invoiceDocument.name}
                  >
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download PDF
                    </Button>
                  </a>
                )}
                {status !== "Paid" && status !== "Cancelled" && (
                  <>
                    {status === "Draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSendInvoice}
                        disabled={isSubmitting}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send Invoice
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAsPaid}
                      disabled={isSubmitting}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark as Paid
                    </Button>
                  </>
                )}
                {invoice.paymentLink && (
                  <a
                    href={invoice.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment Link
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            )}

            {/* Contact & Opportunity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Contact
                </label>
                <Link
                  href={`/contacts/${invoice.contactId}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {contactName}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              {opportunity && invoice.opportunityId && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    Opportunity
                  </label>
                  <Link
                    href={`/opportunities?id=${invoice.opportunityId}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {opportunity.title}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Issue Date
                </label>
                <p className="text-sm text-gray-900">
                  {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Due Date
                </label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {invoice.dueDate
                      ? format(new Date(invoice.dueDate), "MMM d, yyyy")
                      : "—"}
                  </p>
                )}
              </div>
              {invoice.paidDate && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Paid Date
                  </label>
                  <p className="text-sm text-green-600">
                    {format(new Date(invoice.paidDate), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>

            {/* Amounts */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(isEditing && lineItems.length > 0 ? calculatedTotal : invoice.amount)}
                </span>
              </div>
              {(invoice.amountPaid ?? 0) > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="text-sm text-green-600">
                      {formatCurrency(invoice.amountPaid || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Balance Due</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Line Items</label>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddLineItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                )}
              </div>

              {lineItems.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600 font-medium">
                          Description
                        </th>
                        <th className="px-3 py-2 text-right text-gray-600 font-medium w-20">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right text-gray-600 font-medium w-28">
                          Price
                        </th>
                        <th className="px-3 py-2 text-right text-gray-600 font-medium w-28">
                          Total
                        </th>
                        {isEditing && <th className="w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <div className="space-y-1">
                                {products && products.length > 0 && (
                                  <Select
                                    value={item.productId || ""}
                                    onValueChange={(val) =>
                                      handleLineItemChange(index, "productId", val)
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>
                                          {p.name} - {formatCurrency(p.price)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                <Input
                                  value={item.description}
                                  onChange={(e) =>
                                    handleLineItemChange(index, "description", e.target.value)
                                  }
                                  placeholder="Description"
                                  className="h-8 text-sm"
                                />
                              </div>
                            ) : (
                              item.description
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleLineItemChange(index, "quantity", e.target.value)
                                }
                                className="h-8 text-sm text-right w-16"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleLineItemChange(index, "unitPrice", e.target.value)
                                }
                                className="h-8 text-sm text-right w-24"
                              />
                            ) : (
                              formatCurrency(item.unitPrice)
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(item.total)}
                          </td>
                          {isEditing && (
                            <td className="px-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleRemoveLineItem(index)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-medium">
                          Total:
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(calculatedTotal)}
                        </td>
                        {isEditing && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 border rounded-lg">
                  No line items
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {invoice.notes || "No notes"}
                </p>
              )}
            </div>

            {/* Confido Info */}
            {invoice.confidoInvoiceId && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-700">Confido Integration</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-blue-600">
                  <div>
                    <span className="text-blue-500">Invoice ID:</span>{" "}
                    {invoice.confidoInvoiceId}
                  </div>
                  <div>
                    <span className="text-blue-500">Client ID:</span>{" "}
                    {invoice.confidoClientId}
                  </div>
                  <div>
                    <span className="text-blue-500">Matter ID:</span>{" "}
                    {invoice.confidoMatterId}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {invoice.paymentMethod && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900">{invoice.paymentMethod}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form
                      if (invoice) {
                        setName(invoice.name);
                        setDueDate(
                          invoice.dueDate
                            ? format(new Date(invoice.dueDate), "yyyy-MM-dd")
                            : ""
                        );
                        setNotes(invoice.notes || "");
                        setStatus(invoice.status);
                        setLineItems(invoice.lineItems || []);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="bg-orange-400 hover:bg-orange-500"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice "{invoice.name}" ({invoice.invoiceNumber})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
