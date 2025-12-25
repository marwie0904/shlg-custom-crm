"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { User, Briefcase, Send, Paperclip, Smile, MessageCircle, Instagram } from "lucide-react";
import { format } from "date-fns";

interface ConvexContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
}

interface ConvexMessage {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  content: string;
  timestamp: number;
  isOutgoing: boolean;
  read: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
}

interface ConvexConversation {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string;
  unreadCount: number;
  lastMessageAt: number;
  metaSenderId?: string;
  contact?: ConvexContact | null;
  messages?: ConvexMessage[];
}

interface MessageWindowProps {
  conversation: ConvexConversation | null;
  onToggleContactDetails: () => void;
  onSendMessage: (content: string) => void;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getSourceIcon(source: string) {
  switch (source) {
    case "messenger":
      return <MessageCircle className="size-4 text-blue-500" />;
    case "instagram":
      return <Instagram className="size-4 text-pink-500" />;
    default:
      return null;
  }
}

function getSourceLabel(source: string) {
  switch (source) {
    case "messenger":
      return "Facebook Messenger";
    case "instagram":
      return "Instagram DM";
    default:
      return source;
  }
}

export function MessageWindow({
  conversation,
  onToggleContactDetails,
  onSendMessage,
}: MessageWindowProps) {
  const [message, setMessage] = useState("");

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-200">
            <Send className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  const contact = conversation.contact;
  const messages = conversation.messages || [];

  if (!contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-200">
            <Send className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Contact not found</h3>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-[#012f66] text-white text-sm font-medium">
              {getInitials(contact.firstName, contact.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              {getSourceIcon(conversation.source)}
            </div>
            <p className="text-sm text-gray-500">
              {contact.email || getSourceLabel(conversation.source)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleContactDetails}
            className="gap-2"
          >
            <User className="size-4" />
            Contact
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto size-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const msgDate = new Date(msg.timestamp);
              const prevMsgDate = index > 0 ? new Date(messages[index - 1].timestamp) : null;
              const showDateSeparator =
                index === 0 ||
                (prevMsgDate && format(prevMsgDate, "yyyy-MM-dd") !== format(msgDate, "yyyy-MM-dd"));

              return (
                <div key={msg._id}>
                  {showDateSeparator && (
                    <div className="my-4 flex items-center gap-4">
                      <Separator className="flex-1" />
                      <span className="text-xs text-gray-500">
                        {format(msgDate, "MMMM d, yyyy")}
                      </span>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-end gap-2",
                      msg.isOutgoing ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar for incoming messages */}
                    {!msg.isOutgoing && (
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-medium">
                          {getInitials(contact.firstName, contact.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        msg.isOutgoing
                          ? "bg-[#012f66] text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att, i) => (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "block text-xs underline",
                                msg.isOutgoing ? "text-blue-200" : "text-blue-600"
                              )}
                            >
                              {att.name || att.type}
                            </a>
                          ))}
                        </div>
                      )}
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          msg.isOutgoing ? "text-blue-200" : "text-gray-500"
                        )}
                      >
                        {format(msgDate, "h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="size-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="size-5 text-gray-500" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="shrink-0 bg-[#012f66] hover:bg-[#012f66]/90"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
