"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallSession } from "@/lib/hooks/useWebPhone";
import { cn } from "@/lib/utils";

interface IncomingCallBannerProps {
  call: CallSession;
  onAnswer: () => void;
  onDecline: () => void;
}

export default function IncomingCallBanner({
  call,
  onAnswer,
  onDecline,
}: IncomingCallBannerProps) {
  const [isRinging, setIsRinging] = useState(true);

  // Pulsing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRinging((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return number;
  };

  const displayName = call.remoteName || "New Contact";
  const isNewContact = !call.remoteName;

  return (
    <div
      className={cn(
        "fixed top-20 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden",
        "animate-in slide-in-from-top-2 fade-in duration-300"
      )}
    >
      {/* Ringing Header */}
      <div
        className={cn(
          "px-4 py-2 flex items-center gap-2 transition-colors",
          isRinging ? "bg-green-500" : "bg-green-600"
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center",
            isRinging && "animate-pulse"
          )}
        >
          <Phone className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-medium text-sm">Incoming Call</span>
      </div>

      {/* Contact Info */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              isNewContact ? "bg-gray-200" : "bg-blue-100"
            )}
          >
            {isNewContact ? (
              <User className="w-7 h-7 text-gray-500" />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "font-semibold text-lg truncate",
                isNewContact ? "text-gray-600 italic" : "text-gray-900"
              )}
            >
              {displayName}
            </div>
            <div className="text-sm text-gray-500">
              {formatPhoneNumber(call.remoteNumber)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onDecline}
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={onAnswer}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Phone className="w-4 h-4 mr-2" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
