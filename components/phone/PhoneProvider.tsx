"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWebPhone, WebPhoneState, CallSession } from "@/lib/hooks/useWebPhone";
import IncomingCallBanner from "./IncomingCallBanner";

interface PhoneContextType extends WebPhoneState {
  initialize: () => Promise<void>;
  makeCall: (number: string) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  hangUp: () => void;
  sendDTMF: (digit: string) => void;
}

const PhoneContext = createContext<PhoneContextType | null>(null);

export function usePhone() {
  const context = useContext(PhoneContext);
  if (!context) {
    throw new Error("usePhone must be used within a PhoneProvider");
  }
  return context;
}

interface PhoneProviderProps {
  children: ReactNode;
  autoInitialize?: boolean;
}

// TODO: Remove this after testing - TEMPORARY MOCK INCOMING CALL
const SHOW_MOCK_INCOMING_CALL = false;

const mockIncomingCall: CallSession = {
  id: "mock-call-123",
  direction: "inbound",
  remoteNumber: "+12395551234",
  remoteName: "John Smith", // Change to undefined to test "New Contact" display
  status: "ringing",
};

export default function PhoneProvider({
  children,
  autoInitialize = true,
}: PhoneProviderProps) {
  const phone = useWebPhone();
  const [showMockCall, setShowMockCall] = useState(SHOW_MOCK_INCOMING_CALL);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && !phone.isInitialized && !phone.isInitializing) {
      phone.initialize();
    }
  }, [autoInitialize, phone.isInitialized, phone.isInitializing, phone.initialize]);

  // Mock handlers for testing
  const handleMockAnswer = () => {
    console.log("Mock call answered");
    setShowMockCall(false);
  };

  const handleMockDecline = () => {
    console.log("Mock call declined");
    setShowMockCall(false);
  };

  return (
    <PhoneContext.Provider value={phone}>
      {children}

      {/* TEMPORARY: Mock Incoming Call Banner for testing */}
      {showMockCall && (
        <IncomingCallBanner
          call={mockIncomingCall}
          onAnswer={handleMockAnswer}
          onDecline={handleMockDecline}
        />
      )}

      {/* Real Incoming Call Banner */}
      {phone.incomingCall && (
        <IncomingCallBanner
          call={phone.incomingCall}
          onAnswer={phone.answerCall}
          onDecline={phone.declineCall}
        />
      )}
    </PhoneContext.Provider>
  );
}
