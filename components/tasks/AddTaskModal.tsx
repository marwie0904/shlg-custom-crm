"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMockContacts, useMockOpportunities } from "@/lib/hooks/use-mock-data";

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

// Mock users for assignment (TODO: replace with real users from Convex when available)
const mockUsers = [
  { id: "me", name: "Me" },
  { id: "john", name: "John Attorney" },
  { id: "sarah", name: "Sarah Paralegal" },
  { id: "emily", name: "Emily Associate" },
  { id: "admin", name: "Admin Staff" },
];

export interface NewTaskData {
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  assignedToName: string;
  contactId?: string;
  opportunityId?: string;
  workshopId?: string;
  contactOpportunity?: string; // Keep for backwards compatibility
}

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (task: NewTaskData) => void;
  defaultContactId?: Id<"contacts">;
  defaultOpportunityId?: Id<"opportunities">;
  defaultWorkshopId?: Id<"workshops">;
  hideLinkedFields?: boolean; // Hide contact/opportunity/workshop fields when pre-filled
  defaultContactOpportunity?: string; // Legacy prop
}

export function AddTaskModal({
  open,
  onOpenChange,
  onCreateTask,
  defaultContactId,
  defaultOpportunityId,
  defaultWorkshopId,
  hideLinkedFields = false,
  defaultContactOpportunity = "",
}: AddTaskModalProps) {
  // Use mock data or real Convex data based on environment
  const mockContacts = useMockContacts({ limit: 100 });
  const mockOpportunities = useMockOpportunities({ limit: 100 });

  // Only fetch contacts and opportunities if we need to show the dropdowns (skip in mock mode)
  const convexContacts = useQuery(
    USE_MOCK_DATA ? "skip" : api.contacts.list,
    USE_MOCK_DATA ? "skip" : (hideLinkedFields ? "skip" : { limit: 100 })
  );
  const convexOpportunities = useQuery(
    USE_MOCK_DATA ? "skip" : api.opportunities.list,
    USE_MOCK_DATA ? "skip" : (hideLinkedFields ? "skip" : { limit: 100 })
  );

  const contacts = USE_MOCK_DATA ? (hideLinkedFields ? undefined : mockContacts) : convexContacts;
  const opportunities = USE_MOCK_DATA ? (hideLinkedFields ? undefined : mockOpportunities) : convexOpportunities;

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    assignedTo: "me",
    contactId: defaultContactId || "",
    opportunityId: defaultOpportunityId || "",
  });

  // Update defaults when they change
  useEffect(() => {
    if (defaultContactId) {
      setNewTask((prev) => ({
        ...prev,
        contactId: defaultContactId,
      }));
    }
    if (defaultOpportunityId) {
      setNewTask((prev) => ({
        ...prev,
        opportunityId: defaultOpportunityId,
      }));
    }
  }, [defaultContactId, defaultOpportunityId]);

  const resetForm = () => {
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      assignedTo: "me",
      contactId: defaultContactId || "",
      opportunityId: defaultOpportunityId || "",
    });
  };

  const handleCreate = () => {
    if (!newTask.title.trim()) return;

    const assignedUser = mockUsers.find((u) => u.id === newTask.assignedTo);

    onCreateTask({
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      dueDate: newTask.dueDate || new Date().toISOString().split("T")[0],
      assignedTo: newTask.assignedTo,
      assignedToName: assignedUser?.name || "Me",
      contactId: newTask.contactId || defaultContactId || undefined,
      opportunityId: newTask.opportunityId || defaultOpportunityId || undefined,
      workshopId: defaultWorkshopId || undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add New Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Task Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Task Title <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
              className="focus-visible:ring-orange-200 focus-visible:border-orange-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Description
            </label>
            <Textarea
              placeholder="Enter task description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Due Date
            </label>
            <Input
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>

          {/* Assign To */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Assign To
            </label>
            <Select
              value={newTask.assignedTo}
              onValueChange={(value) =>
                setNewTask((prev) => ({ ...prev, assignedTo: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact - only show if not pre-filled */}
          {!hideLinkedFields && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Contact (optional)
              </label>
              <Select
                value={newTask.contactId || "none"}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, contactId: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.firstName} {contact.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Opportunity - only show if not pre-filled */}
          {!hideLinkedFields && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Opportunity (optional)
              </label>
              <Select
                value={newTask.opportunityId || "none"}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, opportunityId: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select opportunity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {opportunities?.map((opportunity) => (
                    <SelectItem key={opportunity._id} value={opportunity._id}>
                      {opportunity.title}
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
          <Button
            onClick={handleCreate}
            disabled={!newTask.title.trim()}
            className="bg-orange-400 hover:bg-orange-500 text-white"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
