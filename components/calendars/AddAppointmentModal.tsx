"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle2,
  Loader2,
  Trash2,
  Pencil,
  MapPin,
  FileText,
  UserCog,
} from "lucide-react";

// Type for appointment data from Convex
export interface AppointmentData {
  _id: Id<"appointments">;
  title: string;
  type: string;
  date: number;
  time: string;
  status: string;
  notes?: string;
  contactId?: Id<"contacts">;
  staffId?: string;
  staffName?: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantEmail?: string;
  participantPhone?: string;
  // Calendar and location
  calendarId?: string;
  calendarName?: string;
  location?: string;
}

interface AddAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: AppointmentData | null; // If provided, modal is in edit mode
}

interface AppointmentFormData {
  title: string;
  description: string;
  attendees: string[];
  contactId: Id<"contacts"> | null;
  date: Date | null;
  time: string | null;
}

const TIME_SLOTS = [
  "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Step = "view" | "details" | "date" | "time" | "confirm" | "changeOwner";

export function AddAppointmentModal({
  open,
  onOpenChange,
  appointment,
}: AddAppointmentModalProps) {
  const isEditMode = !!appointment;

  const [step, setStep] = useState<Step>("details");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);
  const [isChangingOwner, setIsChangingOwner] = useState(false);

  const [formData, setFormData] = useState<AppointmentFormData>({
    title: "",
    description: "",
    attendees: [],
    contactId: null,
    date: null,
    time: null,
  });

  // Fetch users and contacts from Convex
  const users = useQuery(api.users.list);
  const contacts = useQuery(api.contacts.list, { limit: 100 });

  // Mutations
  const createAppointment = useMutation(api.appointments.create);
  const updateAppointment = useMutation(api.appointments.update);
  const deleteAppointment = useMutation(api.appointments.remove);

  // Initialize form data when appointment changes (edit mode)
  useEffect(() => {
    if (appointment && open) {
      const appointmentDate = new Date(appointment.date);
      setFormData({
        title: appointment.title,
        description: appointment.notes || "",
        attendees: appointment.staffId ? [appointment.staffId] : [],
        contactId: appointment.contactId || null,
        date: appointmentDate,
        time: appointment.time,
      });
      setCalendarDate(appointmentDate);
      setStep("view"); // Start with view mode when editing
    }
  }, [appointment, open]);

  const resetForm = () => {
    setStep("details");
    setFormData({
      title: "",
      description: "",
      attendees: [],
      contactId: null,
      date: null,
      time: null,
    });
    setCalendarDate(new Date());
    setIsSubmitting(false);
    setIsDeleting(false);
    setSelectedNewOwner(null);
    setIsChangingOwner(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "details" && isEditMode) setStep("view");
    else if (step === "date") setStep("details");
    else if (step === "time") setStep("date");
    else if (step === "confirm") setStep("time");
  };

  const handleStartEdit = () => {
    setStep("details");
  };

  const handleNext = () => {
    if (step === "details") setStep("date");
    else if (step === "date") setStep("time");
    else if (step === "time") setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!formData.date || !formData.time) return;

    setIsSubmitting(true);

    try {
      const selectedAttendee = users?.find((u) => formData.attendees.includes(u._id));
      const selectedContact = contacts?.find((c) => c._id === formData.contactId);

      if (isEditMode && appointment) {
        // Update existing appointment
        await updateAppointment({
          id: appointment._id,
          title: formData.title,
          type: formData.title,
          date: formData.date.getTime(),
          time: formData.time,
          notes: formData.description || undefined,
          contactId: formData.contactId || undefined,
          staffId: selectedAttendee?._id || undefined,
          staffName: selectedAttendee?.name || undefined,
          participantFirstName: selectedContact?.firstName || undefined,
          participantLastName: selectedContact?.lastName || undefined,
          participantEmail: selectedContact?.email || undefined,
          participantPhone: selectedContact?.phone || undefined,
        });
      } else {
        // Create new appointment
        await createAppointment({
          title: formData.title,
          type: formData.title,
          date: formData.date.getTime(),
          time: formData.time,
          status: "Scheduled",
          notes: formData.description || undefined,
          contactId: formData.contactId || undefined,
          staffId: selectedAttendee?._id || undefined,
          staffName: selectedAttendee?.name || undefined,
          participantFirstName: selectedContact?.firstName || undefined,
          participantLastName: selectedContact?.lastName || undefined,
          participantEmail: selectedContact?.email || undefined,
          participantPhone: selectedContact?.phone || undefined,
        });
      }

      handleClose();
    } catch (error) {
      console.error("Failed to save appointment:", error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;

    setIsDeleting(true);

    try {
      await deleteAppointment({ id: appointment._id });
      handleClose();
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      setIsDeleting(false);
    }
  };

  const handleChangeOwner = async () => {
    if (!appointment || !selectedNewOwner) return;

    setIsChangingOwner(true);

    try {
      const newOwner = users?.find((u) => u._id === selectedNewOwner);
      await updateAppointment({
        id: appointment._id,
        staffId: selectedNewOwner,
        staffName: newOwner?.name || undefined,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to change owner:", error);
      setIsChangingOwner(false);
    }
  };

  const handleAttendeeToggle = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter((id) => id !== userId)
        : [...prev.attendees, userId],
    }));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      day
    );
    setFormData((prev) => ({ ...prev, date: selectedDate }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === calendarDate.getFullYear() &&
      today.getMonth() === calendarDate.getMonth() &&
      today.getDate() === day
    );
  };

  const isSelected = (day: number) => {
    if (!formData.date) return false;
    return (
      formData.date.getFullYear() === calendarDate.getFullYear() &&
      formData.date.getMonth() === calendarDate.getMonth() &&
      formData.date.getDate() === day
    );
  };

  const formatDate = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `${days[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getSelectedContactName = () => {
    if (!formData.contactId) return "No contact selected";
    const contact = contacts?.find((c) => c._id === formData.contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : "Select contact";
  };

  const getSelectedAttendeeName = () => {
    if (formData.attendees.length === 0) return "No attendee selected";
    const attendee = users?.find((u) => formData.attendees.includes(u._id));
    return attendee?.name || "No attendee selected";
  };

  const canProceedFromDetails = formData.title.trim() !== "" && formData.attendees.length > 0;
  const canProceedFromDate = formData.date !== null;
  const canProceedFromTime = formData.time !== null;

  // Loading state for data
  const isLoading = users === undefined || contacts === undefined;

  // View Step: Appointment Details (read-only)
  const renderViewStep = () => {
    if (!appointment) return null;

    const appointmentDate = new Date(appointment.date);
    const selectedContact = appointment.contactId
      ? contacts?.find((c) => c._id === appointment.contactId)
      : null;
    const selectedAttendee = appointment.staffId
      ? users?.find((u) => u._id === appointment.staffId)
      : null;

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "scheduled":
          return "bg-blue-100 text-blue-700";
        case "completed":
          return "bg-green-100 text-green-700";
        case "cancelled":
          return "bg-red-100 text-red-700";
        case "no show":
          return "bg-yellow-100 text-yellow-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    return (
      <div className="space-y-5">
        {/* Header with Edit Button */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              {appointment.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
              <span className="text-sm text-gray-500">{appointment.type}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedNewOwner(appointment.staffId || null);
                setStep("changeOwner");
              }}
              className="flex items-center gap-1.5"
            >
              <UserCog className="h-3.5 w-3.5" />
              Change Owner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Details Card */}
        <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{formatDate(appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">{appointment.time}</span>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Calendar & Location */}
          <div className="space-y-3">
            {appointment.calendarName && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Calendar</span>
                  <p className="text-gray-700">{appointment.calendarName}</p>
                </div>
              </div>
            )}
            {appointment.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Location</span>
                  <p className="text-gray-700">{appointment.location}</p>
                </div>
              </div>
            )}
            {!appointment.calendarName && !appointment.location && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>No location specified</span>
              </div>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Participants */}
          <div className="space-y-3">
            {selectedAttendee && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Attendee</span>
                  <p className="text-gray-700">{selectedAttendee.name}</p>
                </div>
              </div>
            )}
            {selectedContact && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Contact</span>
                  <p className="text-gray-700">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </p>
                  {selectedContact.email && (
                    <p className="text-gray-500 text-xs">{selectedContact.email}</p>
                  )}
                </div>
              </div>
            )}
            {!selectedAttendee && !selectedContact && (
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>No participants assigned</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <hr className="border-gray-200" />
              <div className="flex items-start gap-3 text-sm">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-500 text-xs">Notes</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClose}
          >
            Close
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Delete Appointment"}
          </Button>
        </div>
      </div>
    );
  };

  // Change Owner Step
  const renderChangeOwnerStep = () => {
    if (!appointment) return null;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setStep("view")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Change Calendar Owner
            </h2>
            <p className="text-sm text-gray-500">
              Select a new owner for this appointment
            </p>
          </div>
        </div>

        {/* Current Owner */}
        {appointment.staffName && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Current Owner</p>
            <p className="text-sm font-medium text-gray-900">{appointment.staffName}</p>
          </div>
        )}

        {/* Owner Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Select New Owner
          </Label>
          <div className="space-y-2 border rounded-lg p-3 max-h-[250px] overflow-y-auto">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedNewOwner(user._id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedNewOwner === user._id
                      ? "bg-brand/10 border border-brand"
                      : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedNewOwner === user._id
                      ? "bg-brand text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      selectedNewOwner === user._id ? "text-brand" : "text-gray-900"
                    }`}>
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                  {selectedNewOwner === user._id && (
                    <CheckCircle2 className="h-5 w-5 text-brand" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No staff members found
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full bg-brand hover:bg-brand/90"
            onClick={handleChangeOwner}
            disabled={!selectedNewOwner || selectedNewOwner === appointment.staffId || isChangingOwner}
          >
            {isChangingOwner ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCog className="h-4 w-4 mr-2" />
            )}
            {isChangingOwner ? "Changing..." : "Change Owner"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep("view")}
            disabled={isChangingOwner}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // Step 1: Meeting Details
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? "Edit Appointment" : "New Appointment"}
          </h2>
          <p className="text-sm text-gray-500">Meeting Details</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter appointment title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter appointment description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Attendee <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2 border rounded-lg p-3 max-h-[150px] overflow-y-auto">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <div key={user._id} className="flex items-center gap-3">
                    <Checkbox
                      id={user._id}
                      checked={formData.attendees.includes(user._id)}
                      onCheckedChange={() => handleAttendeeToggle(user._id)}
                    />
                    <label
                      htmlFor={user._id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No staff members found</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact <span className="text-gray-400">(optional)</span>
            </Label>
            <Select
              value={formData.contactId || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  contactId: value ? (value as Id<"contacts">) : null,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts && contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <SelectItem key={contact._id} value={contact._id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email && ` - ${contact.email}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No contacts found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-brand hover:bg-brand/90"
        onClick={handleNext}
        disabled={!canProceedFromDetails || isLoading}
      >
        Next: Select Date
      </Button>
    </div>
  );

  // Step 2: Date Selection
  const renderDateStep = () => {
    const days = getMonthDays(calendarDate);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getSelectedContactName()}
            </h2>
            <p className="text-sm text-gray-500">{formData.title}</p>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newDate = new Date(calendarDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setCalendarDate(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-gray-900">
            {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newDate = new Date(calendarDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setCalendarDate(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => (
            <div key={index} className="aspect-square flex items-center justify-center">
              {day && (
                <button
                  onClick={() => handleDateSelect(day)}
                  className={`w-9 h-9 rounded-full text-sm transition-colors ${
                    isSelected(day)
                      ? "bg-brand text-white"
                      : isToday(day)
                      ? "bg-brand/10 text-brand font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>

        <Button
          className="w-full bg-brand hover:bg-brand/90"
          onClick={handleNext}
          disabled={!canProceedFromDate}
        >
          Next: Select Time
        </Button>
      </div>
    );
  };

  // Step 3: Time Selection
  const renderTimeStep = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {getSelectedContactName()}
          </h2>
          <p className="text-sm text-gray-500">Select a time</p>
        </div>
      </div>

      {/* Selected Date */}
      {formData.date && (
        <p className="text-center font-medium text-gray-900">
          {formatDate(formData.date)}
        </p>
      )}

      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
        {TIME_SLOTS.map((time) => (
          <button
            key={time}
            onClick={() => handleTimeSelect(time)}
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              formData.time === time
                ? "border-brand bg-brand/10 text-brand"
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {time}
          </button>
        ))}
      </div>

      <Button
        className="w-full bg-brand hover:bg-brand/90"
        onClick={handleNext}
        disabled={!canProceedFromTime}
      >
        Next: Confirm
      </Button>
    </div>
  );

  // Step 4: Confirmation
  const renderConfirmStep = () => {
    const selectedAttendee = users?.find((u) => formData.attendees.includes(u._id));
    const selectedContact = formData.contactId
      ? contacts?.find((c) => c._id === formData.contactId)
      : null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getSelectedContactName()}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? "Update Appointment" : "Confirm Appointment"}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="border rounded-lg p-4 space-y-4">
          {/* Title and Type */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {formData.title}
                {selectedContact && ` - ${selectedContact.firstName} ${selectedContact.lastName}`}
              </h3>
              <p className="text-sm text-gray-500">{formData.title}</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Details */}
          <div className="space-y-3">
            {formData.date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{formatDate(formData.date)}</span>
              </div>
            )}
            {formData.time && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{formData.time}</span>
              </div>
            )}
            {selectedAttendee && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{selectedAttendee.name}</span>
              </div>
            )}
            {selectedContact && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  {selectedContact.firstName} {selectedContact.lastName}
                </span>
              </div>
            )}
            {formData.description && (
              <div className="flex items-start gap-3 text-sm">
                <Target className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-700">{formData.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full bg-brand hover:bg-brand/90"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {isSubmitting
              ? isEditMode ? "Updating..." : "Creating..."
              : isEditMode ? "Update Appointment" : "Confirm Appointment"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const getDialogTitle = () => {
    if (step === "view") return appointment?.title || "Appointment Details";
    if (step === "changeOwner") return "Change Calendar Owner";
    if (isEditMode) return "Edit Appointment";
    switch (step) {
      case "details": return "New Appointment";
      case "date": return "Select Date";
      case "time": return "Select Time";
      case "confirm": return "Confirm Appointment";
      default: return "Appointment";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={step === "details" || step === "view" || step === "changeOwner"}>
        <VisuallyHidden>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </VisuallyHidden>
        {step === "view" && renderViewStep()}
        {step === "changeOwner" && renderChangeOwnerStep()}
        {step === "details" && renderDetailsStep()}
        {step === "date" && renderDateStep()}
        {step === "time" && renderTimeStep()}
        {step === "confirm" && renderConfirmStep()}
      </DialogContent>
    </Dialog>
  );
}
