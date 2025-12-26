"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ContactData {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  source?: string;
  notes?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  preferredContactMethod?: string;
}

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactData | null;
}

const SOURCE_OPTIONS = [
  "Facebook Messenger",
  "Instagram DM",
  "Website",
  "Phone Call",
  "Referral",
  "Workshop",
  "Webinar",
  "Other",
];

const CONTACT_METHOD_OPTIONS = [
  "Phone",
  "Email",
  "SMS",
  "Messenger",
  "Instagram",
];

export function EditContactModal({
  open,
  onOpenChange,
  contact,
}: EditContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    source: "",
    notes: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    preferredContactMethod: "",
  });

  const updateContact = useMutation(api.contacts.update);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact && open) {
      setFormData({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        dateOfBirth: contact.dateOfBirth || "",
        source: contact.source || "",
        notes: contact.notes || "",
        streetAddress: contact.streetAddress || "",
        city: contact.city || "",
        state: contact.state || "",
        zipCode: contact.zipCode || "",
        preferredContactMethod: contact.preferredContactMethod || "",
      });
    }
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setIsSubmitting(true);
    try {
      await updateContact({
        id: contact._id,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        source: formData.source || undefined,
        notes: formData.notes || undefined,
        streetAddress: formData.streetAddress || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        preferredContactMethod: formData.preferredContactMethod || undefined,
      });
      toast.success("Contact updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
              }
            />
          </div>

          {/* Source and Preferred Contact Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredContactMethod">Preferred Contact</Label>
              <Select
                value={formData.preferredContactMethod}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, preferredContactMethod: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_METHOD_OPTIONS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              value={formData.streetAddress}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, streetAddress: e.target.value }))
              }
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                placeholder="FL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, zipCode: e.target.value }))
                }
                placeholder="12345"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Add notes about this contact..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
