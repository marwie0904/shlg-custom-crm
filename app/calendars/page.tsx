"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddAppointmentModal, AppointmentData } from "@/components/calendars/AddAppointmentModal";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Plus,
  Loader2,
} from "lucide-react";

type ViewType = "month" | "week" | "3day";
type DisplayMode = "calendar" | "list";

interface CalendarAppointment {
  _id: string;
  title: string;
  contactName: string;
  type: string;
  date: number; // timestamp
  time: string;
  // Additional fields for editing
  notes?: string;
  contactId?: string;
  staffId?: string;
  staffName?: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantEmail?: string;
  participantPhone?: string;
  status: string;
  // Calendar and location
  calendarId?: string;
  calendarName?: string;
  location?: string;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("month");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);

  // Fetch appointments from Convex
  const rawAppointments = useQuery(api.appointments.list, { limit: 500 });

  // Transform appointments to include contact name
  const appointments: CalendarAppointment[] = (rawAppointments || []).map((apt) => ({
    _id: apt._id,
    title: apt.title,
    contactName: apt.participantFirstName && apt.participantLastName
      ? `${apt.participantFirstName} ${apt.participantLastName}`
      : apt.staffName || "Unknown",
    type: apt.type,
    date: apt.date,
    time: apt.time,
    notes: apt.notes,
    contactId: apt.contactId,
    staffId: apt.staffId,
    staffName: apt.staffName,
    participantFirstName: apt.participantFirstName,
    participantLastName: apt.participantLastName,
    participantEmail: apt.participantEmail,
    participantPhone: apt.participantPhone,
    status: apt.status,
    calendarId: apt.calendarId,
    calendarName: apt.calendarName,
    location: apt.location,
  }));

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const get3DayDays = (date: Date) => {
    const days: Date[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(date);
      d.setDate(date.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getAppointmentsForDate = (year: number, month: number, day: number) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return (
        aptDate.getFullYear() === year &&
        aptDate.getMonth() === month &&
        aptDate.getDate() === day
      );
    });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 3);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 3);
    }
    setCurrentDate(newDate);
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const formatDateRange = () => {
    if (viewType === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === "week") {
      const weekDays = getWeekDays(currentDate);
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      const days = get3DayDays(currentDate);
      const start = days[0];
      const end = days[2];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} - ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEditAppointment = (appointment: CalendarAppointment) => {
    // Convert to AppointmentData format for the modal
    setSelectedAppointment({
      _id: appointment._id as any,
      title: appointment.title,
      type: appointment.type,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      notes: appointment.notes,
      contactId: appointment.contactId as any,
      staffId: appointment.staffId,
      staffName: appointment.staffName,
      participantFirstName: appointment.participantFirstName,
      participantLastName: appointment.participantLastName,
      participantEmail: appointment.participantEmail,
      participantPhone: appointment.participantPhone,
      calendarId: appointment.calendarId,
      calendarName: appointment.calendarName,
      location: appointment.location,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedAppointment(null);
    }
  };

  const renderAppointmentCard = (appointment: CalendarAppointment, showContact: boolean) => {
    return (
      <div
        key={appointment._id}
        onClick={() => handleEditAppointment(appointment)}
        className="bg-blue-50 border-l-2 border-blue-500 rounded-r px-2 py-1 mb-1 cursor-pointer hover:bg-blue-100 transition-colors"
      >
        <p className="text-xs font-medium text-gray-900 truncate">
          {appointment.title}
        </p>
        {showContact && (
          <p className="text-xs text-gray-600 truncate">{appointment.contactName}</p>
        )}
        {showContact && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-0.5 bg-blue-500 text-white border-0">
            {appointment.type}
          </Badge>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getMonthDays(currentDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numRows = Math.ceil(days.length / 7);

    return (
      <div
        className="grid grid-cols-7 border-t border-l border-gray-200 h-full"
        style={{ gridTemplateRows: `auto repeat(${numRows}, 1fr)` }}
      >
        {/* Header row */}
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 border-r border-b border-gray-200 bg-gray-50"
          >
            {day}
          </div>
        ))}
        {/* Day cells */}
        {days.map((day, index) => {
          const dayAppointments = day ? getAppointmentsForDate(year, month, day) : [];
          const today = day ? isToday(year, month, day) : false;

          return (
            <div
              key={index}
              className={`min-h-[80px] p-1 border-r border-b border-gray-200 overflow-hidden ${
                day ? "bg-white" : "bg-gray-50"
              }`}
            >
              {day && (
                <>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 text-sm ${
                      today
                        ? "bg-brand text-white rounded-full font-semibold"
                        : "text-gray-900"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1">
                    {dayAppointments.slice(0, 2).map((apt) =>
                      renderAppointmentCard(apt, false)
                    )}
                    {dayAppointments.length > 2 && (
                      <p className="text-xs text-gray-500 pl-2">
                        +{dayAppointments.length - 2} more
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);

    return (
      <div className="grid grid-cols-7 grid-rows-[auto_1fr] border-t border-l border-gray-200 h-full min-h-[400px]">
        {/* Header row with day names and dates */}
        {weekDays.map((date, index) => {
          const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());
          return (
            <div
              key={index}
              className="p-2 text-center border-r border-b border-gray-200 bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-500">
                {DAYS_OF_WEEK[date.getDay()]}
              </p>
              <p
                className={`text-lg font-semibold mt-1 ${
                  today
                    ? "bg-brand text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    : "text-gray-900"
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          );
        })}
        {/* Day content */}
        {weekDays.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );

          return (
            <div
              key={`content-${index}`}
              className="p-2 border-r border-b border-gray-200 bg-white overflow-y-auto"
            >
              {dayAppointments.map((apt) => renderAppointmentCard(apt, true))}
            </div>
          );
        })}
      </div>
    );
  };

  const render3DayView = () => {
    const days = get3DayDays(currentDate);

    return (
      <div className="grid grid-cols-3 grid-rows-[auto_1fr] border-t border-l border-gray-200 h-full min-h-[400px]">
        {/* Header row with day names and dates */}
        {days.map((date, index) => {
          const today = isToday(date.getFullYear(), date.getMonth(), date.getDate());
          return (
            <div
              key={index}
              className="p-3 text-center border-r border-b border-gray-200 bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-500">
                {DAYS_OF_WEEK[date.getDay()]}
              </p>
              <p
                className={`text-xl font-semibold mt-1 ${
                  today
                    ? "bg-brand text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto"
                    : "text-gray-900"
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          );
        })}
        {/* Day content */}
        {days.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );

          return (
            <div
              key={`content-${index}`}
              className="p-3 border-r border-b border-gray-200 bg-white overflow-y-auto"
            >
              {dayAppointments.map((apt) => renderAppointmentCard(apt, true))}
            </div>
          );
        })}
      </div>
    );
  };

  // Skeleton Loader Component
  const CalendarSkeleton = () => (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-56 bg-gray-200 rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded" />
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center justify-between flex-shrink-0 mt-6">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <div className="h-8 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <div className="h-8 w-16 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Calendar Container Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col mt-6 min-h-0">
        {/* Navigation Header Skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>

        {/* Calendar Grid Skeleton */}
        <div className="flex-1 p-1">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-t border-l border-gray-200">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="p-2 text-center border-r border-b border-gray-200 bg-gray-50"
              >
                <div className="h-4 w-8 bg-gray-200 rounded mx-auto" />
              </div>
            ))}
          </div>
          {/* Calendar Cells - 5 rows */}
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 border-l border-gray-200">
              {[...Array(7)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="min-h-[80px] p-2 border-r border-b border-gray-200 bg-white"
                >
                  <div className="h-5 w-5 bg-gray-200 rounded-full mb-2" />
                  {/* Random appointment placeholders */}
                  {(rowIndex + colIndex) % 3 === 0 && (
                    <div className="h-6 w-full bg-gray-100 rounded mb-1" />
                  )}
                  {(rowIndex + colIndex) % 5 === 0 && (
                    <div className="h-6 w-3/4 bg-gray-100 rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Loading state
  if (rawAppointments === undefined) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendars</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule and manage your appointments.
          </p>
        </div>
        <Button
          className="bg-brand hover:bg-brand/90"
          onClick={handleAddAppointment}
        >
          <Plus className="h-4 w-4" />
          Add Appointment
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-shrink-0 mt-6">
        {/* Calendar/List Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={displayMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDisplayMode("calendar")}
            className={displayMode === "calendar" ? "bg-brand hover:bg-brand/90" : ""}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Calendar
          </Button>
          <Button
            variant={displayMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDisplayMode("list")}
            className={displayMode === "list" ? "bg-brand hover:bg-brand/90" : ""}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        {/* View Type Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={viewType === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("month")}
            className={viewType === "month" ? "bg-brand hover:bg-brand/90" : ""}
          >
            Month
          </Button>
          <Button
            variant={viewType === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("week")}
            className={viewType === "week" ? "bg-brand hover:bg-brand/90" : ""}
          >
            Week
          </Button>
          <Button
            variant={viewType === "3day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("3day")}
            className={viewType === "3day" ? "bg-brand hover:bg-brand/90" : ""}
          >
            3 Day
          </Button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col mt-6 min-h-0">
        {/* Navigation Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDateRange()}
          </h2>
          <Button variant="ghost" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-auto flex-1">
          {viewType === "month" && renderMonthView()}
          {viewType === "week" && renderWeekView()}
          {viewType === "3day" && render3DayView()}
        </div>
      </div>

      {/* Add/Edit Appointment Modal */}
      <AddAppointmentModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        appointment={selectedAppointment}
      />
    </div>
  );
}
