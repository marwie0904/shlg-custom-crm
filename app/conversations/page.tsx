"use client";

import { useState } from "react";
import { ConversationList } from "@/components/conversations/ConversationList";
import { MessageWindow } from "@/components/conversations/MessageWindow";
import { ContactDetails } from "@/components/conversations/ContactDetails";
import { placeholderConversations, Conversation } from "@/lib/placeholder-data";

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Optionally show contact details when selecting a conversation
    setShowContactDetails(true);
  };

  const toggleContactDetails = () => {
    setShowContactDetails(!showContactDetails);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6">
      {/* Conversation List - Left Sidebar */}
      <div className="w-80 shrink-0">
        <ConversationList
          conversations={placeholderConversations}
          selectedId={selectedConversation?.id || null}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Message Window - Center */}
      <div className="flex-1">
        <MessageWindow
          conversation={selectedConversation}
          onToggleContactDetails={toggleContactDetails}
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
