"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMockContactSearch, useMockMutation } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, User, Mail, Phone, Loader2, UserPlus } from "lucide-react";

interface AddAttendeeModalProps {
  workshopId: Id<"workshops">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingContactIds: Id<"contacts">[];
}

export function AddAttendeeModal({
  workshopId,
  open,
  onOpenChange,
  existingContactIds,
}: AddAttendeeModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState<Id<"contacts"> | null>(null);

  // Use mock data or real Convex data based on environment
  const mockSearchResults = useMockContactSearch(searchQuery.length >= 2 ? searchQuery : null);
  const mockMutation = useMockMutation();

  // Search contacts (skip in mock mode)
  const convexSearchResults = useQuery(
    api.contacts.search,
    USE_MOCK_DATA ? "skip" : (searchQuery.length >= 2 ? { query: searchQuery } : "skip")
  );

  const searchResults = USE_MOCK_DATA ? mockSearchResults : convexSearchResults;

  // Register mutation (use mock in demo mode)
  const registerContactMutation = useMutation(api.workshops.register);
  const registerContact = USE_MOCK_DATA ? mockMutation : registerContactMutation;

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setIsAdding(null);
    }
  }, [open]);

  // Filter out contacts already registered
  const filteredResults = searchResults?.filter(
    (contact) => !existingContactIds.includes(contact._id)
  );

  const handleAddAttendee = async (contactId: Id<"contacts">) => {
    setIsAdding(contactId);
    try {
      await registerContact({
        workshopId,
        contactId,
      });
      toast.success("Attendee added successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add attendee:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add attendee"
      );
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Attendee
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Results */}
        <ScrollArea className="h-[300px] mt-2">
          {searchQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          ) : searchResults === undefined ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="space-y-2">
              {filteredResults.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => handleAddAttendee(contact._id)}
                  disabled={isAdding !== null}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {isAdding === contact._id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {contact.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <User className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">No contacts found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
