"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/placeholder-data";
import { User, Briefcase, Send, Paperclip, Smile } from "lucide-react";
import { format } from "date-fns";

interface MessageWindowProps {
  conversation: Conversation | null;
  onToggleContactDetails: () => void;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function MessageWindow({
  conversation,
  onToggleContactDetails,
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

  const { contact, messages } = conversation;

  const handleSend = () => {
    if (message.trim()) {
      // In production, this would send the message
      console.log("Sending message:", message);
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
            <h2 className="font-semibold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h2>
            <p className="text-sm text-gray-500">{contact.email}</p>
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
          {contact.opportunity && (
            <Button variant="outline" size="sm" className="gap-2">
              <Briefcase className="size-4" />
              Opportunity
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => {
            const showDateSeparator =
              index === 0 ||
              format(messages[index - 1].timestamp, "yyyy-MM-dd") !==
                format(msg.timestamp, "yyyy-MM-dd");

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className="my-4 flex items-center gap-4">
                    <Separator className="flex-1" />
                    <span className="text-xs text-gray-500">
                      {format(msg.timestamp, "MMMM d, yyyy")}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex",
                    msg.isOutgoing ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      msg.isOutgoing
                        ? "bg-[#012f66] text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        msg.isOutgoing ? "text-blue-200" : "text-gray-500"
                      )}
                    >
                      {format(msg.timestamp, "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
