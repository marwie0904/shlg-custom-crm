"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Loader2, Search, User, Mail, Phone, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

// Relationship types
const RELATIONSHIP_TYPES = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Attorney",
  "Trustee",
  "Beneficiary",
  "POA",
  "Caregiver",
  "Financial Advisor",
  "Other",
];

interface Contact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface AddRelatedContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: Id<"opportunities">;
  primaryContactId: Id<"contacts">;
  existingRelatedContactIds?: Id<"contacts">[];
  onSuccess?: () => void;
}

export function AddRelatedContactModal({
  open,
  onOpenChange,
  opportunityId,
  primaryContactId,
  existingRelatedContactIds = [],
  onSuccess,
}: AddRelatedContactModalProps) {
  // Tab state: "existing" or "new"
  const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Relationship state
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  // New contact form state
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build exclude list (primary contact + existing related contacts)
  const excludeContactIds = [primaryContactId, ...existingRelatedContactIds];

  // Search contacts query
  const searchResults = useQuery(
    api.opportunityContacts.searchContacts,
    searchQuery.length >= 2
      ? { query: searchQuery, excludeContactIds }
      : "skip"
  );

  // Mutations
  const addRelatedContact = useMutation(api.opportunityContacts.add);
  const createAndLinkContact = useMutation(api.opportunityContacts.createAndLink);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("existing");
      setSearchQuery("");
      setSelectedContact(null);
      setRelationship("");
      setNotes("");
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!relationship) {
      toast.error("Please select a relationship type");
      return;
    }

    if (activeTab === "existing" && !selectedContact) {
      toast.error("Please select a contact");
      return;
    }

    if (activeTab === "new" && (!newFirstName.trim() || !newLastName.trim())) {
      toast.error("Please enter first and last name");
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeTab === "existing" && selectedContact) {
        await addRelatedContact({
          opportunityId,
          contactId: selectedContact._id,
          relationship,
          notes: notes || undefined,
        });
        toast.success(`${selectedContact.firstName} ${selectedContact.lastName} added as ${relationship}`);
      } else if (activeTab === "new") {
        await createAndLinkContact({
          opportunityId,
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          relationship,
          notes: notes || undefined,
        });
        toast.success(`${newFirstName} ${newLastName} created and added as ${relationship}`);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add related contact:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add related contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Related Contact</DialogTitle>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex rounded-lg border overflow-hidden mb-4">
          <button
            onClick={() => setActiveTab("existing")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "existing"
                ? "bg-brand text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Search className="h-4 w-4" />
            Existing Contact
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 px-4 py-2 text-sm font-medium border-l transition-colors flex items-center justify-center gap-2 ${
              activeTab === "new"
                ? "bg-brand text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            New Contact
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === "existing" ? (
            <>
              {/* Search Input */}
              <div className="space-y-2">
                <Label>Search Contact</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedContact(null);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                  {searchResults === undefined ? (
                    <div className="p-4 text-center text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No contacts found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {searchResults.map((contact) => (
                        <button
                          key={contact._id}
                          onClick={() => setSelectedContact(contact as Contact)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedContact?._id === contact._id ? "bg-brand/5 border-l-2 border-brand" : ""
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {contact.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhone(contact.phone)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Contact Display */}
              {selectedContact && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </span>
                  </div>
                  {(selectedContact.email || selectedContact.phone) && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-green-700">
                      {selectedContact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedContact.email}
                        </span>
                      )}
                      {selectedContact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatPhone(selectedContact.phone)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* New Contact Form */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="First name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Last name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Relationship Selection */}
          <div className="space-y-2">
            <Label>Relationship *</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this relationship..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !relationship || (activeTab === "existing" && !selectedContact) || (activeTab === "new" && (!newFirstName.trim() || !newLastName.trim()))}
            className="bg-brand hover:bg-brand/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
