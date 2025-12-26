"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Settings,
  User,
  ExternalLink,
} from "lucide-react";

interface ConvexContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  metaPsid?: string;
  metaIgsid?: string;
}

interface ConvexConversation {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string;
  unreadCount: number;
  lastMessageAt: number;
  metaSenderId?: string;
  contact?: ConvexContact | null;
}

interface ContactDetailsProps {
  conversation: ConvexConversation | null;
  onClose: () => void;
}

function getSourceIcon(source: string) {
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

function getSourceLabel(source: string) {
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
      return source || "Unknown";
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function ContactDetails({ conversation, onClose }: ContactDetailsProps) {
  if (!conversation || !conversation.contact) {
    return null;
  }

  const contact = conversation.contact;

  return (
    <div className="flex h-full w-80 flex-col border-l bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold text-gray-900">Contact Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
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
          <Link
            href={`/contacts/${contact._id}`}
            target="_blank"
            className="mt-3 flex items-center gap-1.5 text-lg font-semibold text-gray-900 hover:text-[#012f66] transition-colors group"
          >
            {contact.firstName} {contact.lastName}
            <ExternalLink className="size-4 text-gray-400 group-hover:text-[#012f66]" />
          </Link>
          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            {getSourceIcon(conversation.source)}
            <span>{getSourceLabel(conversation.source)}</span>
          </div>
        </div>

        <Separator />

        {/* Details Section */}
        <div className="space-y-4 p-4">
          {/* Source */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              {getSourceIcon(conversation.source)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Channel</p>
              <p className="font-medium text-gray-900">
                {getSourceLabel(conversation.source)}
              </p>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <User className="size-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
          </div>

          {/* Email */}
          {contact.email && (
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
          )}

          {/* Phone */}
          {contact.phone && (
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
          )}

          {/* Meta Sender ID (for debugging/reference) */}
          {conversation.metaSenderId && (
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                {conversation.source === "instagram" ? (
                  <Instagram className="size-5 text-pink-500" />
                ) : (
                  <MessageCircle className="size-5 text-blue-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {conversation.source === "instagram" ? "Instagram ID" : "Messenger ID"}
                </p>
                <p className="font-mono text-xs text-gray-600 break-all">
                  {conversation.metaSenderId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
