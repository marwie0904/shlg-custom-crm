"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Conversation, MessageSource } from "@/lib/placeholder-data";
import { MessageCircle, Instagram, Settings, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

function getSourceIcon(source: MessageSource) {
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

function getLastMessage(conversation: Conversation) {
  const messages = conversation.messages;
  if (messages.length === 0) return "No messages";
  const lastMessage = messages[messages.length - 1];
  const prefix = lastMessage.isOutgoing ? "You: " : "";
  return prefix + lastMessage.content;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-gray-50",
                selectedId === conversation.id && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              {/* Avatar with initials and source icon */}
              <div className="relative shrink-0">
                <Avatar className="size-12">
                  <AvatarFallback className={cn("text-white text-sm font-medium", getAvatarColor(conversation.contact.id))}>
                    {getInitials(
                      conversation.contact.firstName,
                      conversation.contact.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow-sm">
                  {getSourceIcon(conversation.contact.source)}
                </div>
              </div>

              {/* Message content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    {conversation.contact.firstName} {conversation.contact.lastName}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {formatDistanceToNow(conversation.lastMessageAt, { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {getLastMessage(conversation)}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <Badge className="shrink-0 bg-[#ffd666] text-gray-800 font-semibold hover:bg-[#ffd666]">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
