"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

// Mock data for form templates
interface FormTemplate {
  id: string;
  title: string;
}

// Mock data for opportunities/matters
interface Opportunity {
  id: string;
  title: string;
  contacts: Contact[];
}

// Mock data for contacts
interface Contact {
  id: string;
  name: string;
  email?: string;
}

// Sample mock data
const mockFormTemplates: FormTemplate[] = [
  { id: "1", title: "Estate Planning Intake Form | Safe Harbor Law Firm" },
  { id: "2", title: "Personal Information Form (Shortened)" },
  { id: "3", title: "Document Checklist" },
  { id: "4", title: "Financial Disclosure Form" },
  { id: "5", title: "Witness Statement Form" },
];

const mockOpportunities: Opportunity[] = [
  {
    id: "1",
    title: "TEST (Vren) - Estate Planning",
    contacts: [
      { id: "c1", name: "John Vren", email: "john@example.com" },
      { id: "c2", name: "Jane Vren", email: "jane@example.com" },
    ],
  },
  {
    id: "2",
    title: "Nancy Foy - Estate Planning",
    contacts: [
      { id: "c3", name: "Nancy Foy", email: "nancy@example.com" },
    ],
  },
  {
    id: "3",
    title: "Barbara Matalin - Estate Planning",
    contacts: [
      { id: "c4", name: "Barbara Matalin", email: "barbara@example.com" },
      { id: "c5", name: "Robert Matalin", email: "robert@example.com" },
    ],
  },
  {
    id: "4",
    title: "Smith Family - Business Formation",
    contacts: [
      { id: "c6", name: "Michael Smith", email: "michael@example.com" },
      { id: "c7", name: "Sarah Smith", email: "sarah@example.com" },
      { id: "c8", name: "David Smith", email: "david@example.com" },
    ],
  },
];

type FormMode = "send" | "fill";

interface PrepareFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrepareFormModal({ open, onOpenChange }: PrepareFormModalProps) {
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [formMode, setFormMode] = useState<FormMode>("send");

  // Get the selected opportunity's contacts
  const selectedOpportunity = useMemo(() => {
    return mockOpportunities.find((opp) => opp.id === selectedOpportunityId);
  }, [selectedOpportunityId]);

  const availableContacts = selectedOpportunity?.contacts || [];

  // Reset dependent fields when opportunity changes
  useEffect(() => {
    setSelectedContactId("");
    setSelectedRecipientId("");
  }, [selectedOpportunityId]);

  const resetForm = () => {
    setSelectedFormId("");
    setSelectedOpportunityId("");
    setSelectedContactId("");
    setSelectedRecipientId("");
    setFormMode("send");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleGetFormLink = () => {
    if (!selectedFormId || !selectedOpportunityId || !selectedContactId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formMode === "send" && !selectedRecipientId) {
      toast.error("Please select a recipient");
      return;
    }

    const form = mockFormTemplates.find((f) => f.id === selectedFormId);
    const recipient = availableContacts.find((c) => c.id === selectedRecipientId);

    // Simulate getting/copying form link
    const formLink = `https://forms.example.com/${selectedFormId}?contact=${selectedContactId}`;
    navigator.clipboard.writeText(formLink);

    toast.success("Form link copied to clipboard", {
      description: `Link for "${form?.title}" sent to ${recipient?.name}`,
    });

    handleClose();
  };

  const handleFillOutForm = () => {
    if (!selectedFormId || !selectedOpportunityId || !selectedContactId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const form = mockFormTemplates.find((f) => f.id === selectedFormId);

    toast.info(`Opening form: ${form?.title}`, {
      description: "Form editor would open here",
    });

    handleClose();
  };

  const isFormValid = selectedFormId && selectedOpportunityId && selectedContactId;
  const isSendFormValid = isFormValid && selectedRecipientId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Prepare form
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Top Row: Form and Opportunity Selection */}
          <div className="grid grid-cols-2 gap-4">
            {/* Select Form */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Select form <span className="text-red-500">*</span>
              </label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent>
                  {mockFormTemplates.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Opportunity/Matters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Matters <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedOpportunityId}
                onValueChange={setSelectedOpportunityId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search for opportunity" />
                </SelectTrigger>
                <SelectContent>
                  {mockOpportunities.map((opp) => (
                    <SelectItem key={opp.id} value={opp.id}>
                      {opp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Information Text */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              Whose information are you collecting in this form?
            </p>
            <p className="text-sm text-gray-500">
              Contact information collected through this form will automatically be updated.
            </p>
          </div>

          {/* Client Information */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Client Information (May Be Different From Caller){" "}
              <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedContactId}
              onValueChange={setSelectedContactId}
              disabled={!selectedOpportunityId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    selectedOpportunityId
                      ? "Select a contact"
                      : "Select an opportunity first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableContacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOpportunityId && !selectedContactId && (
              <p className="text-sm text-red-500">This field is required.</p>
            )}
          </div>

          {/* Send Form / Fill Out Form Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={formMode === "send" ? "default" : "outline"}
              className={
                formMode === "send"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : ""
              }
              onClick={() => setFormMode("send")}
            >
              Send form
            </Button>
            <Button
              type="button"
              variant={formMode === "fill" ? "default" : "outline"}
              className={
                formMode === "fill"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : ""
              }
              onClick={() => setFormMode("fill")}
            >
              Fill out form
            </Button>
          </div>

          {/* Conditional: Recipient Selection (only for Send Form mode) */}
          {formMode === "send" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Select recipient <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedRecipientId}
                onValueChange={setSelectedRecipientId}
                disabled={!selectedOpportunityId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      selectedOpportunityId
                        ? "Select a recipient"
                        : "Select an opportunity first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.email ? `(${contact.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {formMode === "send" ? (
            <Button
              onClick={handleGetFormLink}
              disabled={!isSendFormValid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get form link
            </Button>
          ) : (
            <Button
              onClick={handleFillOutForm}
              disabled={!isFormValid}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fill out form
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
