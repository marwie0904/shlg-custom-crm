"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMockConversations, useMockConversationById, useMockMutation } from "@/lib/hooks/use-mock-data";

// Check for mock data mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  User,
  Search,
  MoreVertical,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Types
interface Contact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Message {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  content: string;
  timestamp: number;
  isOutgoing: boolean;
  read: boolean;
}

interface Conversation {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string; // "sms" | "email"
  unreadCount: number;
  lastMessageAt: number;
  contact?: Contact | null;
  lastMessage?: Message | null;
  messages?: Message[];
}

// Avatar color generator
const avatarColors = [
  "bg-[#012f66]",
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
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getSourceIcon(source: string, className?: string) {
  switch (source) {
    case "sms":
      return <MessageSquare className={cn("text-green-500", className)} />;
    case "email":
      return <Mail className={cn("text-blue-500", className)} />;
    default:
      return <MessageSquare className={cn("text-gray-400", className)} />;
  }
}

function getSourceLabel(source: string) {
  switch (source) {
    case "sms":
      return "SMS";
    case "email":
      return "Email";
    default:
      return source;
  }
}

// Conversation List Component (Left Side)
function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}: {
  conversations: Conversation[];
  selectedId: Id<"conversations"> | null;
  onSelect: (id: Id<"conversations">) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const contact = conv.contact;
    if (!contact) return false;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const email = contact.email?.toLowerCase() || "";
    const phone = contact.phone || "";
    return fullName.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
  });

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col border-r bg-white">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
          <p className="text-xs text-gray-500 mt-1">Email & SMS Messages</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <MessageSquare className="mx-auto size-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Email and SMS messages will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-r bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
        <p className="text-xs text-gray-500 mt-1">Email & SMS Messages</p>
      </div>

      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredConversations.map((conversation) => {
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
                {/* Avatar with source indicator */}
                <div className="relative shrink-0">
                  <Avatar className="size-12">
                    <AvatarFallback className={cn("text-white text-sm font-medium", getAvatarColor(contact._id))}>
                      {getInitials(contact.firstName, contact.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow-sm border">
                    {getSourceIcon(conversation.source, "size-3")}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="flex items-center gap-2 mt-0.5">
                    {contact.phone && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="size-3" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                  {contact.email && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {contact.email}
                    </div>
                  )}

                  {/* Last message preview */}
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {conversation.lastMessage ? (
                        <>
                          <span className="text-gray-400">
                            {conversation.lastMessage.isOutgoing ? "You: " : ""}
                          </span>
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">No messages</span>
                      )}
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
          {filteredConversations.length === 0 && searchQuery && (
            <div className="p-4 text-center text-sm text-gray-500">
              No contacts found matching "{searchQuery}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Message Window Component (Right Side)
function MessageWindow({
  conversation,
  onSendMessage,
  isSending,
}: {
  conversation: Conversation | null;
  onSendMessage: (content: string) => void;
  isSending: boolean;
}) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-200">
            <Send className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a conversation from the list to view messages
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
            <User className="size-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Contact not found</h3>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (message.trim() && !isSending) {
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
            <AvatarFallback className={cn("text-white text-sm font-medium", getAvatarColor(contact._id))}>
              {getInitials(contact.firstName, contact.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h2>
              <Badge variant="outline" className="text-xs gap-1">
                {getSourceIcon(conversation.source, "size-3")}
                {getSourceLabel(conversation.source)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {contact.phone}
                </span>
              )}
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {contact.email}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="size-5 text-gray-500" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto size-12 text-gray-300 mb-3" />
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

              // Determine message style based on source
              const isSms = conversation.source === "sms";
              const isEmail = conversation.source === "email";

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

                    {/* Message bubble with source indicator */}
                    <div className="max-w-[70%] flex flex-col gap-1">
                      {/* Source indicator badge */}
                      <div className={cn("flex items-center gap-1", msg.isOutgoing ? "justify-end" : "justify-start")}>
                        {isSms && (
                          <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                            <MessageSquare className="size-2.5" />
                            SMS
                          </span>
                        )}
                        {isEmail && (
                          <span className="text-[10px] text-blue-600 flex items-center gap-0.5">
                            <Mail className="size-2.5" />
                            Email
                          </span>
                        )}
                      </div>

                      {/* Message bubble */}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          msg.isOutgoing
                            ? isSms
                              ? "bg-green-500 text-white" // Outgoing SMS - green
                              : "bg-[#012f66] text-white" // Outgoing Email - blue
                            : isSms
                              ? "bg-green-100 text-gray-900 border border-green-200" // Incoming SMS - light green
                              : "bg-gray-100 text-gray-900" // Incoming Email - gray
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            msg.isOutgoing
                              ? isSms ? "text-green-200" : "text-blue-200"
                              : "text-gray-500"
                          )}
                        >
                          {format(msgDate, "h:mm a")}
                        </p>
                      </div>
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
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type a message...`}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
            className={cn(
              "shrink-0",
              conversation.source === "sms"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-[#012f66] hover:bg-[#012f66]/90"
            )}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Sending as {getSourceLabel(conversation.source)} to {conversation.source === "sms" ? contact.phone : contact.email}
        </p>
      </div>
    </div>
  );
}

// Main Page Component
export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Mock data hooks
  const mockConversationsList = useMockConversations();
  const mockSelectedConversation = useMockConversationById(selectedConversationId as string | null);
  const mockMutation = useMockMutation();

  // Fetch conversations filtered by SMS and Email only (skip in mock mode)
  const convexConversations = useQuery(
    api.conversations.list,
    USE_MOCK_DATA ? "skip" : {}
  );

  // Filter to only show SMS and Email conversations
  const allConversations = USE_MOCK_DATA ? mockConversationsList : convexConversations;
  const conversations = ((allConversations || []).filter(
    (conv) => conv.source === "sms" || conv.source === "email"
  )) as Conversation[];

  // Fetch selected conversation with messages (skip in mock mode)
  const convexSelectedConversation = useQuery(
    api.conversations.getWithMessages,
    USE_MOCK_DATA ? "skip" : (selectedConversationId ? { id: selectedConversationId } : "skip")
  );

  const selectedConversation = USE_MOCK_DATA ? mockSelectedConversation : convexSelectedConversation;

  // Mutations (use mock in demo mode)
  const sendMessageMutation = useMutation(api.conversations.sendMessageWithMeta);
  const markAsReadMutation = useMutation(api.conversations.markAsRead);
  const sendMessage = USE_MOCK_DATA ? mockMutation : sendMessageMutation;
  const markAsRead = USE_MOCK_DATA ? mockMutation : markAsReadMutation;

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unreadCount && selectedConversation.unreadCount > 0) {
      markAsRead({ id: selectedConversationId });
    }
  }, [selectedConversationId, selectedConversation?.unreadCount, markAsRead]);

  const handleSelectConversation = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !content.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        conversationId: selectedConversationId,
        content: content.trim(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6">
      {/* Conversation List - Left Sidebar */}
      <div className="w-96 shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Message Window - Right Side */}
      <div className="flex-1">
        <MessageWindow
          conversation={selectedConversation || null}
          onSendMessage={handleSendMessage}
          isSending={isSending}
        />
      </div>
    </div>
  );
}
