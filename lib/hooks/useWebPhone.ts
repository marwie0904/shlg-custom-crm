"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Types for WebPhone
export interface CallSession {
  id: string;
  direction: "inbound" | "outbound";
  remoteNumber: string;
  remoteName?: string;
  status: "ringing" | "connecting" | "connected" | "ended";
  startTime?: Date;
  duration?: number;
  contactId?: string;
}

export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  secondaryPhone?: string;
}

export interface WebPhoneState {
  isInitialized: boolean;
  isInitializing: boolean;
  isRegistered: boolean;
  error: string | null;
  currentCall: CallSession | null;
  incomingCall: CallSession | null;
  recentCalls: CallSession[];
}

interface WebPhoneInstance {
  start: () => Promise<void>;
  stop?: () => void;
  dispose?: () => void;
  call: (number: string) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
}

interface InboundCallSession {
  id: string;
  request: {
    from: {
      uri: {
        user: string;
      };
      displayName?: string;
    };
  };
  answer: () => Promise<void>;
  decline: () => void;
  hangup: () => void;
  on: (event: string, callback: () => void) => void;
}

interface OutboundCallSession {
  id: string;
  hangup: () => void;
  on: (event: string, callback: () => void) => void;
}

export function useWebPhone() {
  const [state, setState] = useState<WebPhoneState>({
    isInitialized: false,
    isInitializing: false,
    isRegistered: false,
    error: null,
    currentCall: null,
    incomingCall: null,
    recentCalls: [],
  });

  const webPhoneRef = useRef<WebPhoneInstance | null>(null);
  const currentCallSessionRef = useRef<InboundCallSession | OutboundCallSession | null>(null);
  const incomingCallSessionRef = useRef<InboundCallSession | null>(null);

  // Query contacts for caller ID lookup
  const contacts = useQuery(api.contacts.list, {});

  // Find contact by phone number
  const findContactByPhone = useCallback(
    (phoneNumber: string): Contact | null => {
      if (!contacts || !phoneNumber) return null;

      // Normalize phone number
      const normalized = phoneNumber.replace(/\D/g, "");
      const withPlus = `+${normalized}`;
      const withPlusOne = `+1${normalized.replace(/^1/, "")}`;
      const withoutPlus = normalized.replace(/^1/, "");

      return (
        contacts.find((c: Contact) => {
          const phone = c.phone?.replace(/\D/g, "") || "";
          const secondary = c.secondaryPhone?.replace(/\D/g, "") || "";
          return (
            phone === normalized ||
            phone === withoutPlus ||
            secondary === normalized ||
            secondary === withoutPlus
          );
        }) || null
      );
    },
    [contacts]
  );

  // Create contact from inbound call (for unknown callers)
  const createContactFromCall = useCallback(
    async (phoneNumber: string, callerName?: string): Promise<{ contactId: string; isNew: boolean } | null> => {
      try {
        console.log("[WebPhone] Creating contact from inbound call:", phoneNumber);
        const response = await fetch("/api/contacts/create-from-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, callerName }),
        });

        const data = await response.json();
        if (data.success) {
          console.log("[WebPhone] Contact created/found:", data.contactId, "isNew:", data.isNew);
          return { contactId: data.contactId, isNew: data.isNew };
        } else {
          console.error("[WebPhone] Failed to create contact:", data.error);
          return null;
        }
      } catch (error) {
        console.error("[WebPhone] Error creating contact from call:", error);
        return null;
      }
    },
    []
  );

  // Initialize WebPhone
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) return;

    console.log("[WebPhone] Starting initialization...");
    setState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Get SIP provisioning info from our API
      console.log("[WebPhone] Fetching SIP provisioning...");
      const response = await fetch("/api/ringcentral/sip-provision");
      const data = await response.json();
      console.log("[WebPhone] SIP provision response:", data.success ? "Success" : "Failed", data.error || "");

      if (!data.success || !data.sipInfo) {
        throw new Error(data.error || "Failed to get SIP provisioning");
      }

      // Dynamically import WebPhone (client-side only)
      console.log("[WebPhone] Importing WebPhone SDK...");
      const WebPhone = (await import("ringcentral-web-phone")).default;

      // Create WebPhone instance
      console.log("[WebPhone] Creating WebPhone instance...");
      const webPhone = new WebPhone({ sipInfo: data.sipInfo });

      // Set up event handlers
      console.log("[WebPhone] Setting up event handlers...");
      webPhone.on("inboundCall", async (session: InboundCallSession) => {
        console.log("[WebPhone] 📞 INCOMING CALL!", session);
        const remoteNumber = session.request.from.uri.user || "Unknown";
        const remoteName = session.request.from.displayName;
        let contact = findContactByPhone(remoteNumber);
        let contactId = contact?._id;

        // If no contact found, create one automatically
        if (!contact && remoteNumber && remoteNumber !== "Unknown") {
          console.log("[WebPhone] Unknown caller - creating new contact...");
          const result = await createContactFromCall(remoteNumber, remoteName);
          if (result) {
            contactId = result.contactId;
            console.log("[WebPhone] Contact created:", contactId, "isNew:", result.isNew);
          }
        }

        const callSession: CallSession = {
          id: session.id,
          direction: "inbound",
          remoteNumber,
          remoteName: contact
            ? `${contact.firstName} ${contact.lastName}`
            : remoteName || "New Contact",
          status: "ringing",
          contactId,
        };

        incomingCallSessionRef.current = session;
        setState((prev) => ({ ...prev, incomingCall: callSession }));

        // Set up session event handlers
        session.on("accepted", () => {
          setState((prev) => ({
            ...prev,
            incomingCall: null,
            currentCall: { ...callSession, status: "connected", startTime: new Date() },
          }));
          currentCallSessionRef.current = session;
          incomingCallSessionRef.current = null;
        });

        session.on("terminated", () => {
          setState((prev) => ({
            ...prev,
            incomingCall: null,
            currentCall: null,
            recentCalls: [
              { ...callSession, status: "ended" },
              ...prev.recentCalls.slice(0, 9),
            ],
          }));
          currentCallSessionRef.current = null;
          incomingCallSessionRef.current = null;
        });
      });

      // Start the WebPhone
      console.log("[WebPhone] Starting WebPhone...");
      await webPhone.start();
      console.log("[WebPhone] ✅ WebPhone started and registered!");

      webPhoneRef.current = webPhone;
      setState((prev) => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        isRegistered: true,
      }));
    } catch (error) {
      console.error("[WebPhone] ❌ Initialization error:", error);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : "Failed to initialize phone",
      }));
    }
  }, [state.isInitialized, state.isInitializing, findContactByPhone, createContactFromCall]);

  // Make outbound call
  const makeCall = useCallback(
    async (phoneNumber: string) => {
      if (!webPhoneRef.current || !state.isRegistered) {
        throw new Error("Phone not initialized");
      }

      if (state.currentCall) {
        throw new Error("Already in a call");
      }

      const contact = findContactByPhone(phoneNumber);

      const callSession: CallSession = {
        id: `outbound-${Date.now()}`,
        direction: "outbound",
        remoteNumber: phoneNumber,
        remoteName: contact ? `${contact.firstName} ${contact.lastName}` : undefined,
        status: "connecting",
        contactId: contact?._id,
      };

      setState((prev) => ({ ...prev, currentCall: callSession }));

      try {
        const session = await webPhoneRef.current.call(phoneNumber);
        currentCallSessionRef.current = session;

        session.on("accepted", () => {
          setState((prev) => ({
            ...prev,
            currentCall: prev.currentCall
              ? { ...prev.currentCall, status: "connected", startTime: new Date() }
              : null,
          }));
        });

        session.on("terminated", () => {
          setState((prev) => ({
            ...prev,
            currentCall: null,
            recentCalls: [
              { ...callSession, status: "ended" },
              ...prev.recentCalls.slice(0, 9),
            ],
          }));
          currentCallSessionRef.current = null;
        });
      } catch (error) {
        setState((prev) => ({ ...prev, currentCall: null }));
        throw error;
      }
    },
    [state.isRegistered, state.currentCall, findContactByPhone]
  );

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCallSessionRef.current) {
      throw new Error("No incoming call to answer");
    }

    await incomingCallSessionRef.current.answer();
  }, []);

  // Decline incoming call
  const declineCall = useCallback(() => {
    if (!incomingCallSessionRef.current) {
      throw new Error("No incoming call to decline");
    }

    incomingCallSessionRef.current.decline();
    setState((prev) => ({ ...prev, incomingCall: null }));
    incomingCallSessionRef.current = null;
  }, []);

  // Hang up current call
  const hangUp = useCallback(() => {
    if (currentCallSessionRef.current) {
      currentCallSessionRef.current.hangup();
      currentCallSessionRef.current = null;
    }
    setState((prev) => ({ ...prev, currentCall: null }));
  }, []);

  // Send DTMF tone
  const sendDTMF = useCallback((digit: string) => {
    if (currentCallSessionRef.current && "sendDTMF" in currentCallSessionRef.current) {
      (currentCallSessionRef.current as any).sendDTMF(digit);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webPhoneRef.current) {
        // Try stop() or dispose() depending on SDK version
        if (webPhoneRef.current.stop) {
          webPhoneRef.current.stop();
        } else if (webPhoneRef.current.dispose) {
          webPhoneRef.current.dispose();
        }
      }
    };
  }, []);

  return {
    ...state,
    initialize,
    makeCall,
    answerCall,
    declineCall,
    hangUp,
    sendDTMF,
    findContactByPhone,
    createContactFromCall,
  };
}
