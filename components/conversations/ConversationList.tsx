"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { MessageCircle, Instagram, Settings, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type MessageSource = "messenger" | "instagram" | "sms" | "email";

interface ConvexContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
}

interface ConvexConversation {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string;
  unreadCount: number;
  lastMessageAt: number;
  contact?: ConvexContact | null;
}

interface ConversationListProps {
  conversations: ConvexConversation[];
  selectedId: Id<"conversations"> | null;
  onSelect: (conversationId: Id<"conversations">) => void;
}

function getSourceIcon(source: string) {
  switch (source) {
    case "messenger":
      return <MessageCircle className="size-3.5 text-blue-500" />;
    case "instagram":
      return <Instagram className="size-3.5 text-pink-500" />;
    case "email":
      return <Mail className="size-3.5 text-gray-500" />;
    case "sms":
      return <Settings className="size-3.5 text-green-500" />;
    default:
      return <MessageCircle className="size-3.5 text-gray-400" />;
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const avatarColors = [
  "bg-[#012f66]", // Brand blue
  "bg-emerald-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-amber-600",
];

function getAvatarColor(id: string) {
  // Generate consistent color based on contact id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex h-full flex-col border-r bg-white">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <MessageCircle className="mx-auto size-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Messages from Facebook & Instagram will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {conversations.map((conversation) => {
            const contact = conversation.contact;
            if (!contact) return null;

            return (
              <button
                key={conversation._id}
                onClick={() => onSelect(conversation._id)}
                className={cn(
                  "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50",
                  selectedId === conversation._id && "bg-blue-50 hover:bg-blue-50"
                )}
              >
                {/* Avatar with initials and source icon */}
                <div className="relative shrink-0">
                  <Avatar className="size-12">
                    <AvatarFallback className={cn("text-white text-sm font-medium", getAvatarColor(contact._id))}>
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow-sm">
                    {getSourceIcon(conversation.source)}
                  </div>
                </div>

                {/* Message content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {conversation.source === "messenger" ? "Facebook Messenger" :
                       conversation.source === "instagram" ? "Instagram DM" :
                       conversation.source}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="shrink-0 bg-[#ffd666] text-gray-800 font-semibold hover:bg-[#ffd666]">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
