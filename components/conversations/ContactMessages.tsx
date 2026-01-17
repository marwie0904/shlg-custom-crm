"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Send, MessageCircle, Instagram, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMockMutation } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
}

interface ContactMessagesProps {
  contactId: Id<"contacts">;
  className?: string;
}

function getSourceIcon(source: string) {
  switch (source) {
    case "messenger":
      return <MessageCircle className="size-4 text-blue-500" />;
    case "instagram":
      return <Instagram className="size-4 text-pink-500" />;
    default:
      return <MessageCircle className="size-4 text-gray-400" />;
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

export function ContactMessages({ contactId, className }: ContactMessagesProps) {
  const [messageInput, setMessageInput] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock mutation
  const mockMutation = useMockMutation();

  // Fetch conversations for this contact (skip in mock mode)
  const conversations = useQuery(
    api.conversations.getByContactId,
    USE_MOCK_DATA ? "skip" : { contactId }
  );

  // Fetch messages for selected conversation (skip in mock mode)
  const conversationWithMessages = useQuery(
    api.conversations.getWithMessages,
    USE_MOCK_DATA ? "skip" : (selectedConversationId ? { id: selectedConversationId } : "skip")
  );

  // Mutations (use mock in demo mode)
  const sendMessageMutation = useMutation(api.conversations.sendMessageWithMeta);
  const markAsReadMutation = useMutation(api.conversations.markAsRead);
  const sendMessage = USE_MOCK_DATA ? mockMutation : sendMessageMutation;
  const markAsRead = USE_MOCK_DATA ? mockMutation : markAsReadMutation;

  // Auto-select first conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId]);

  // Mark as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId && conversationWithMessages?.unreadCount && conversationWithMessages.unreadCount > 0) {
      markAsRead({ id: selectedConversationId });
    }
  }, [selectedConversationId, conversationWithMessages?.unreadCount, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationWithMessages?.messages]);

  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const result = await sendMessage({
        conversationId: selectedConversationId,
        content: messageInput.trim(),
      });

      // If this is a Meta conversation, send via API
      if (result.metaSenderId && (result.source === "messenger" || result.source === "instagram")) {
        try {
          await fetch("/api/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientId: result.metaSenderId,
              message: messageInput.trim(),
              source: result.source,
            }),
          });
        } catch (error) {
          console.error("Error sending message via Meta:", error);
        }
      }

      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // No conversations
  if (!conversations || conversations.length === 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <MessageCircle className="mx-auto size-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Messages from Facebook & Instagram will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  const messages = conversationWithMessages?.messages || [];
  const selectedConversation = conversations.find(c => c._id === selectedConversationId);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Conversation Selector (if multiple) */}
      {conversations.length > 1 && (
        <div className="border-b px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {conversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setSelectedConversationId(conv._id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  selectedConversationId === conv._id
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {getSourceIcon(conv.source)}
                {getSourceLabel(conv.source)}
                {conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single conversation header */}
      {conversations.length === 1 && selectedConversation && (
        <div className="border-b px-4 py-2 flex items-center gap-2">
          {getSourceIcon(selectedConversation.source)}
          <span className="text-sm font-medium text-gray-700">
            {getSourceLabel(selectedConversation.source)}
          </span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto size-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No messages in this conversation</p>
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
                          {getInitials(
                            conversationWithMessages?.contact?.firstName,
                            conversationWithMessages?.contact?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2",
                        msg.isOutgoing
                          ? "bg-primary text-white"
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      {selectedConversation && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
