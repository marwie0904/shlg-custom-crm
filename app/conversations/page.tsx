"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConversationList } from "@/components/conversations/ConversationList";
import { MessageWindow } from "@/components/conversations/MessageWindow";
import { ContactDetails } from "@/components/conversations/ContactDetails";

// Types for conversations from Convex
export interface ConvexContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
  metaPsid?: string;
  metaIgsid?: string;
}

export interface ConvexMessage {
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
  metaMessageId?: string;
}

export interface ConvexConversation {
  _id: Id<"conversations">;
  contactId: Id<"contacts">;
  source: string;
  unreadCount: number;
  lastMessageAt: number;
  metaSenderId?: string;
  contact?: ConvexContact | null;
  messages?: ConvexMessage[];
}

export default function ConversationsPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  // Fetch conversations from Convex
  const conversations = useQuery(api.conversations.list, {});

  // Fetch selected conversation with messages
  const selectedConversation = useQuery(
    api.conversations.getWithMessages,
    selectedConversationId ? { id: selectedConversationId } : "skip"
  );

  // Mutations
  const sendMessage = useMutation(api.conversations.sendMessageWithMeta);
  const markAsRead = useMutation(api.conversations.markAsRead);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unreadCount && selectedConversation.unreadCount > 0) {
      markAsRead({ id: selectedConversationId });
    }
  }, [selectedConversationId, selectedConversation?.unreadCount, markAsRead]);

  const handleSelectConversation = (conversationId: Id<"conversations">) => {
    setSelectedConversationId(conversationId);
    setShowContactDetails(true);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !content.trim()) return;

    try {
      // Save message to Convex and get Meta sender info
      const result = await sendMessage({
        conversationId: selectedConversationId,
        content: content.trim(),
      });

      // If this is a Meta conversation, send via API
      if (result.metaSenderId && (result.source === "messenger" || result.source === "instagram")) {
        try {
          const response = await fetch("/api/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipientId: result.metaSenderId,
              message: content.trim(),
              source: result.source,
            }),
          });

          if (!response.ok) {
            console.error("Failed to send message via Meta API");
          }
        } catch (error) {
          console.error("Error sending message via Meta:", error);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const toggleContactDetails = () => {
    setShowContactDetails(!showContactDetails);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6">
      {/* Conversation List - Left Sidebar */}
      <div className="w-80 shrink-0">
        <ConversationList
          conversations={conversations || []}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Message Window - Center */}
      <div className="flex-1">
        <MessageWindow
          conversation={selectedConversation || null}
          onToggleContactDetails={toggleContactDetails}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* Contact Details - Right Sidebar */}
      {showContactDetails && selectedConversation && (
        <ContactDetails
          conversation={selectedConversation}
          onClose={() => setShowContactDetails(false)}
        />
      )}
    </div>
  );
}
