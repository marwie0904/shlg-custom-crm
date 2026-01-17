"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMockContacts, useMockOpportunities, useMockProducts, useMockNextInvoiceNumber, useMockMutation } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Trash2, DollarSign, User, Briefcase, Download, CheckCircle } from "lucide-react";
import { generateInvoicePdf, generateInvoicePdfFilename, InvoicePdfData } from "@/lib/services/pdfService";

interface LineItem {
  productId?: Id<"products">;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface AddInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContactId?: Id<"contacts">;
  defaultOpportunityId?: Id<"opportunities">;
  onSuccess?: (invoiceId: Id<"invoices">) => void;
}

export function AddInvoiceModal({
  open,
  onOpenChange,
  defaultContactId,
  defaultOpportunityId,
  onSuccess,
}: AddInvoiceModalProps) {
  // Use mock data or real Convex data based on environment
  const mockContacts = useMockContacts({ limit: 100 });
  const mockOpportunities = useMockOpportunities({ limit: 100 });
  const mockProducts = useMockProducts({ activeOnly: true });
  const mockNextInvoiceNumber = useMockNextInvoiceNumber();
  const mockMutation = useMockMutation();

  // Queries (skip in mock mode)
  const convexContacts = useQuery(
    USE_MOCK_DATA ? "skip" : api.contacts.list,
    USE_MOCK_DATA ? "skip" : { limit: 100 }
  );
  const convexOpportunities = useQuery(
    USE_MOCK_DATA ? "skip" : api.opportunities.list,
    USE_MOCK_DATA ? "skip" : { limit: 100 }
  );
  const convexProducts = useQuery(
    USE_MOCK_DATA ? "skip" : api.products.list,
    USE_MOCK_DATA ? "skip" : { activeOnly: true }
  );
  const convexNextInvoiceNumber = useQuery(
    USE_MOCK_DATA ? "skip" : api.invoices.getNextInvoiceNumber,
    USE_MOCK_DATA ? "skip" : {}
  );

  const contacts = USE_MOCK_DATA ? mockContacts : convexContacts;
  const opportunities = USE_MOCK_DATA ? mockOpportunities : convexOpportunities;
  const products = USE_MOCK_DATA ? mockProducts : convexProducts;
  const nextInvoiceNumber = USE_MOCK_DATA ? mockNextInvoiceNumber : convexNextInvoiceNumber;

  // Mutations (use mock in demo mode)
  const createInvoiceMutation = useMutation(api.invoices.create);
  const updateConfidoInfoMutation = useMutation(api.invoices.updateConfidoInfo);
  const updateDocumentIdMutation = useMutation(api.invoices.updateDocumentId);
  const generateUploadUrlMutation = useMutation(api.documents.generateUploadUrl);
  const createDocumentForInvoiceMutation = useMutation(api.documents.createForInvoice);

  const createInvoice = USE_MOCK_DATA ? mockMutation : createInvoiceMutation;
  const updateConfidoInfo = USE_MOCK_DATA ? mockMutation : updateConfidoInfoMutation;
  const updateDocumentId = USE_MOCK_DATA ? mockMutation : updateDocumentIdMutation;
  const generateUploadUrl = USE_MOCK_DATA ? mockMutation : generateUploadUrlMutation;
  const createDocumentForInvoice = USE_MOCK_DATA ? mockMutation : createDocumentForInvoiceMutation;

  // Form state
  const [contactId, setContactId] = useState<string>(defaultContactId || "");
  const [opportunityId, setOpportunityId] = useState<string>(defaultOpportunityId || "");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<{
    id: Id<"invoices">;
    invoiceNumber: string;
    pdfBlob: Blob;
    contactName: string;
  } | null>(null);

  // Calculate total
  const total = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.total, 0);
  }, [lineItems]);

  // Create combined contact & opportunity options
  const contactOpportunityOptions = useMemo(() => {
    if (!contacts || !opportunities) return [];

    // Create a map of contact names
    const contactMap = new Map(
      contacts.map((c) => [c._id, `${c.firstName} ${c.lastName}`])
    );

    // Create options from opportunities (contact with opportunity)
    const oppOptions = opportunities.map((opp) => ({
      value: `opp:${opp._id}`,
      contactId: opp.contactId,
      opportunityId: opp._id,
      contactName: contactMap.get(opp.contactId) || "Unknown Contact",
      opportunityName: opp.title,
      type: "opportunity" as const,
    }));

    // Create options for contacts without opportunities
    const contactsWithOpps = new Set(opportunities.map((o) => o.contactId));
    const standaloneContacts = contacts
      .filter((c) => !contactsWithOpps.has(c._id))
      .map((c) => ({
        value: `contact:${c._id}`,
        contactId: c._id,
        opportunityId: undefined as Id<"opportunities"> | undefined,
        contactName: `${c.firstName} ${c.lastName}`,
        opportunityName: undefined as string | undefined,
        type: "contact" as const,
      }));

    return [...oppOptions, ...standaloneContacts];
  }, [contacts, opportunities]);

  // Get currently selected option display
  const selectedOption = useMemo(() => {
    if (!contactId) return null;
    return contactOpportunityOptions.find(
      (opt) => opt.contactId === contactId &&
               (opportunityId ? opt.opportunityId === opportunityId : !opt.opportunityId)
    );
  }, [contactId, opportunityId, contactOpportunityOptions]);

  // Handle combined selection
  const handleContactOpportunitySelect = (value: string) => {
    const option = contactOpportunityOptions.find((opt) => opt.value === value);
    if (option) {
      setContactId(option.contactId);
      setOpportunityId(option.opportunityId || "");
    }
  };

  // Update defaults when they change or when options become available
  useEffect(() => {
    if (defaultContactId && contactOpportunityOptions.length > 0) {
      // Find matching option for the defaults
      const matchingOption = contactOpportunityOptions.find(
        (opt) =>
          opt.contactId === defaultContactId &&
          (defaultOpportunityId ? opt.opportunityId === defaultOpportunityId : true)
      );

      if (matchingOption) {
        setContactId(matchingOption.contactId);
        setOpportunityId(matchingOption.opportunityId || "");
      } else {
        // Fallback: just set the contact if no matching opportunity found
        setContactId(defaultContactId);
        if (defaultOpportunityId) setOpportunityId(defaultOpportunityId);
      }
    }
  }, [defaultContactId, defaultOpportunityId, contactOpportunityOptions]);

  // Reset form
  const resetForm = () => {
    setContactId(defaultContactId || "");
    setOpportunityId(defaultOpportunityId || "");
    setName("");
    setDueDate("");
    setNotes("");
    setLineItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setIsSubmitting(false);
    setCreatedInvoice(null);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Update line item
  const updateLineItem = (index: number, field: keyof LineItem, value: unknown) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        // Recalculate total when quantity or unitPrice changes
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }

        return updated;
      })
    );
  };

  // Handle product selection for a line item
  const handleProductSelect = (index: number, productId: string) => {
    if (productId === "custom") {
      updateLineItem(index, "productId", undefined);
      updateLineItem(index, "description", "");
      updateLineItem(index, "unitPrice", 0);
      return;
    }

    const product = products?.find((p) => p._id === productId);
    if (product) {
      setLineItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const quantity = item.quantity || 1;
          return {
            ...item,
            productId: product._id,
            description: product.name,
            unitPrice: product.price,
            total: quantity * product.price,
          };
        })
      );
    }
  };

  // Handle submit
  const handleSubmit = async (status: "Draft" | "Pending", sendToConfido: boolean = false) => {
    if (!contactId || lineItems.length === 0 || total === 0) return;

    setIsSubmitting(true);
    try {
      const invoiceNumber = nextInvoiceNumber || `INV-${Date.now()}`;
      const invoiceName = name || `Invoice ${invoiceNumber}`;
      const selectedContact = contacts?.find((c) => c._id === contactId);
      const selectedOpportunity = opportunities?.find((o) => o._id === opportunityId);
      const contactName = selectedContact
        ? `${selectedContact.firstName} ${selectedContact.lastName}`
        : "Unknown";
      const issueDate = Date.now();
      const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;

      // Create invoice in Convex first
      const invoiceId = await createInvoice({
        contactId: contactId as Id<"contacts">,
        opportunityId: opportunityId ? (opportunityId as Id<"opportunities">) : undefined,
        name: invoiceName,
        invoiceNumber,
        amount: total,
        issueDate,
        dueDate: dueDateTimestamp,
        status: sendToConfido ? "Pending" : status,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        notes: notes || undefined,
      });

      let paymentLink: string | undefined;

      // If sending to Confido, create payment link
      if (sendToConfido) {
        const confidoResponse = await fetch("/api/confido/create-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceId,
            contactId,
            contactName,
            contactEmail: selectedContact?.email,
            contactPhone: selectedContact?.phone,
            opportunityId: opportunityId || undefined,
            opportunityName: selectedOpportunity?.title,
            amount: total,
            invoiceNumber,
            memo: `Invoice #${invoiceNumber} - ${invoiceName}`,
          }),
        });

        const confidoResult = await confidoResponse.json();

        if (confidoResult.success) {
          paymentLink = confidoResult.paymentUrl;
          // Update invoice with Confido info
          await updateConfidoInfo({
            id: invoiceId,
            confidoInvoiceId: confidoResult.confidoInvoiceId,
            confidoClientId: confidoResult.confidoClientId,
            confidoMatterId: confidoResult.confidoMatterId,
            paymentLink: confidoResult.paymentUrl,
            status: "Sent",
          });
        } else {
          console.error("Confido error:", confidoResult.error);
          // Invoice still created, but without payment link
        }
      }

      // Generate PDF
      const pdfData: InvoicePdfData = {
        invoiceNumber,
        name: invoiceName,
        issueDate,
        dueDate: dueDateTimestamp,
        status: sendToConfido ? "Sent" : status,
        contactName,
        contactEmail: selectedContact?.email,
        contactPhone: selectedContact?.phone,
        contactAddress: selectedContact ? [
          selectedContact.streetAddress,
          selectedContact.city,
          selectedContact.state,
          selectedContact.zipCode,
        ].filter(Boolean).join(", ") : undefined,
        opportunityTitle: selectedOpportunity?.title,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        amount: total,
        notes: notes || undefined,
        paymentLink,
      };

      const pdfBlob = generateInvoicePdf(pdfData);

      // Upload PDF to Convex storage
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: pdfBlob,
      });
      const { storageId } = await uploadResult.json();

      // Create document record
      const filename = generateInvoicePdfFilename(invoiceNumber, contactName);
      const documentId = await createDocumentForInvoice({
        invoiceId,
        contactId: contactId as Id<"contacts">,
        opportunityId: opportunityId ? (opportunityId as Id<"opportunities">) : undefined,
        name: filename,
        type: "pdf",
        mimeType: "application/pdf",
        size: pdfBlob.size,
        storageId,
      });

      // Link document to invoice
      await updateDocumentId({
        id: invoiceId,
        documentId,
      });

      // Send invoice email if sending to Confido and contact has email
      if (sendToConfido && selectedContact?.email) {
        try {
          // Convert PDF blob to base64 (browser-compatible)
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const pdfBase64 = btoa(binary);

          // Format due date for email
          const formattedDueDate = dueDateTimestamp
            ? new Date(dueDateTimestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Upon Receipt';

          // Format amount for email
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(total);

          // Send invoice email via Make.com webhook
          const emailResponse = await fetch('/api/invoice/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: selectedContact.email,
              recipientName: contactName,
              invoiceNumber,
              amount: formattedAmount,
              dueDate: formattedDueDate,
              pdfBase64,
              pdfFilename: filename,
              type: 'unpaid',
            }),
          });

          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            console.log('✅ Invoice email sent successfully');
          } else {
            console.error('Failed to send invoice email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending invoice email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      // Set created invoice for success screen
      setCreatedInvoice({
        id: invoiceId,
        invoiceNumber,
        pdfBlob,
        contactName,
      });

      onSuccess?.(invoiceId);
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download the created invoice PDF
  const handleDownloadPdf = () => {
    if (!createdInvoice) return;

    const url = URL.createObjectURL(createdInvoice.pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateInvoicePdfFilename(createdInvoice.invoiceNumber, createdInvoice.contactName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const isValid = contactId && lineItems.some((item) => item.total > 0);

  // Success screen after invoice creation
  if (createdInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Invoice Created!
              </h2>
              <p className="text-sm text-gray-600">
                Invoice {createdInvoice.invoiceNumber} has been created successfully.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleDownloadPdf}
                className="w-full bg-orange-400 hover:bg-orange-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Create New Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Invoice Name & Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Invoice Name
              </label>
              <Input
                placeholder="e.g., Legal Consultation Fee"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Invoice Number
              </label>
              <Input
                value={nextInvoiceNumber || "Loading..."}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Contact & Opportunity (Combined) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Contact & Opportunity <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedOption?.value || ""}
              onValueChange={handleContactOpportunitySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact & opportunity">
                  {selectedOption && (
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span>{selectedOption.contactName}</span>
                      {selectedOption.opportunityName && (
                        <>
                          <span className="text-gray-300">|</span>
                          <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                          <span>{selectedOption.opportunityName}</span>
                        </>
                      )}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {contactOpportunityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span>{option.contactName}</span>
                      {option.opportunityName && (
                        <>
                          <span className="text-gray-300">|</span>
                          <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-600">{option.opportunityName}</span>
                        </>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                Line Items <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
                >
                  {/* Product/Service Selection */}
                  <div className="col-span-4">
                    <Select
                      value={item.productId || "custom"}
                      onValueChange={(v) => handleProductSelect(index, v)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Item</SelectItem>
                        {products?.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} - {formatCurrency(product.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description (for custom items) */}
                  <div className="col-span-3">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, "description", e.target.value)
                      }
                      disabled={!!item.productId}
                      className="bg-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                      className="bg-white text-center"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                        disabled={!!item.productId}
                        className="bg-white pl-7"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="col-span-1 flex items-center justify-end font-medium text-gray-900">
                    {formatCurrency(item.total)}
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end pt-2 border-t">
              <div className="text-right">
                <span className="text-sm text-gray-500">Total: </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Notes</label>
            <Textarea
              placeholder="Add any notes for this invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit("Draft", false)}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit("Pending", true)}
            disabled={!isValid || isSubmitting}
            className="bg-orange-400 hover:bg-orange-500 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Create & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
