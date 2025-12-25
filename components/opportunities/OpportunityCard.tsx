"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Calendar, User, DollarSign, MessageCircle, Instagram, Smartphone, Mail } from "lucide-react";
import { format } from "date-fns";
import {
  OpportunityForKanban,
  getContactDisplayName,
  getContactSource,
  MessageSource,
} from "@/lib/types/opportunities";

interface OpportunityCardProps {
  opportunity: OpportunityForKanban;
  onClick?: (opportunity: OpportunityForKanban) => void;
}

export function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const hasAppointment = opportunity.calendarAppointmentDate !== undefined;
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity._id,
    data: {
      type: "opportunity",
      opportunity,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSourceIcon = (source?: MessageSource) => {
    if (!source) return null;

    const iconProps = { className: "h-4 w-4" };
    const colorMap: Record<MessageSource, string> = {
      messenger: "text-blue-500",
      instagram: "text-pink-500",
      sms: "text-green-500",
      email: "text-gray-500",
    };

    const icons: Record<MessageSource, React.ReactNode> = {
      messenger: <MessageCircle {...iconProps} className={`${iconProps.className} ${colorMap.messenger}`} />,
      instagram: <Instagram {...iconProps} className={`${iconProps.className} ${colorMap.instagram}`} />,
      sms: <Smartphone {...iconProps} className={`${iconProps.className} ${colorMap.sms}`} />,
      email: <Mail {...iconProps} className={`${iconProps.className} ${colorMap.email}`} />,
    };

    return icons[source];
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x);
      const dy = Math.abs(e.clientY - dragStartPos.current.y);
      // Only trigger click if mouse hasn't moved significantly
      if (dx < 5 && dy < 5 && onClick) {
        onClick(opportunity);
      }
    }
    dragStartPos.current = null;
  };

  const contactName = getContactDisplayName(opportunity.contact);
  const contactSource = getContactSource(opportunity.contact);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`p-4 gap-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-gray-200 bg-white select-none relative ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-brand/20" : ""
      }`}
    >
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-semibold text-gray-900 text-sm leading-tight">
          {opportunity.title}
        </h4>

        {/* Contact Name */}
        <div className="flex items-center gap-2 text-gray-600">
          <User className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs">{contactName}</span>
        </div>

        {/* Estimated Value */}
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-medium">
            {formatCurrency(opportunity.estimatedValue)}
          </span>
        </div>

        {/* Calendar Appointment */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar
              className={`h-3.5 w-3.5 ${
                hasAppointment ? "text-blue-500" : "text-gray-300"
              }`}
            />
            {!hasAppointment && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-[1px] bg-gray-400 rotate-[-45deg]" />
              </div>
            )}
          </div>
          {hasAppointment && opportunity.calendarAppointmentDate && (
            <span className="text-xs text-blue-600 font-medium">
              {format(new Date(opportunity.calendarAppointmentDate), "MMM d, yyyy")}
            </span>
          )}
        </div>
      </div>

      {/* Source Icon - Bottom Right */}
      {contactSource && (
        <div className="absolute bottom-3 right-3">
          {getSourceIcon(contactSource)}
        </div>
      )}
    </Card>
  );
}
