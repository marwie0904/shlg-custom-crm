"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Conversation, MessageSource } from "@/lib/placeholder-data";
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Settings,
  Briefcase,
  DollarSign,
  Target,
} from "lucide-react";

interface ContactDetailsProps {
  conversation: Conversation | null;
  onClose: () => void;
}

function getSourceIcon(source: MessageSource) {
  switch (source) {
    case "messenger":
      return <MessageCircle className="size-5 text-blue-500" />;
    case "instagram":
      return <Instagram className="size-5 text-pink-500" />;
    case "email":
      return <Mail className="size-5 text-gray-500" />;
    case "sms":
      return <Settings className="size-5 text-green-500" />;
    default:
      return <MessageCircle className="size-5 text-gray-400" />;
  }
}

function getSourceLabel(source: MessageSource) {
  switch (source) {
    case "messenger":
      return "Facebook Messenger";
    case "instagram":
      return "Instagram DM";
    case "email":
      return "Email";
    case "sms":
      return "SMS";
    default:
      return "Unknown";
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

export function ContactDetails({ conversation, onClose }: ContactDetailsProps) {
  if (!conversation) {
    return null;
  }

  const { contact } = conversation;

  return (
    <div className="flex h-full w-80 flex-col border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold text-gray-900">Contact Details</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Contact Info */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="flex flex-col items-center p-6">
          <Avatar className="size-20">
            <AvatarFallback className="bg-[#012f66] text-white text-xl font-medium">
              {getInitials(contact.firstName, contact.lastName)}
            </AvatarFallback>
          </Avatar>
          <h4 className="mt-3 text-lg font-semibold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h4>
        </div>

        <Separator />

        {/* Details Section */}
        <div className="space-y-4 p-4">
          {/* Source */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              {getSourceIcon(contact.source)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Source</p>
              <p className="font-medium text-gray-900">
                {getSourceLabel(contact.source)}
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <MessageCircle className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Mail className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-[#012f66] hover:underline"
              >
                {contact.email}
              </a>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Phone className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <a
                href={`tel:${contact.phone}`}
                className="font-medium text-[#012f66] hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Opportunity Section */}
        {contact.opportunity && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="size-5 text-gray-700" />
                <h4 className="font-semibold text-gray-900">Opportunity</h4>
              </div>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {contact.opportunity.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Value</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(contact.opportunity.value)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Stage</p>
                    <p className="font-medium text-gray-900">
                      {contact.opportunity.stage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
