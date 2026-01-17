"use client";

import { useState, useCallback } from "react";
import { Phone, PhoneOff, Delete, X, Clock, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CallSession } from "@/lib/hooks/useWebPhone";

interface DialPadProps {
  onCall: (number: string) => void;
  onHangUp: () => void;
  currentCall: CallSession | null;
  recentCalls: CallSession[];
  isRegistered: boolean;
  onClose: () => void;
}

const DIALPAD_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export default function DialPad({
  onCall,
  onHangUp,
  currentCall,
  recentCalls,
  isRegistered,
  onClose,
}: DialPadProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showRecent, setShowRecent] = useState(false);

  const handleDigitPress = useCallback((digit: string) => {
    setPhoneNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleCall = useCallback(() => {
    if (phoneNumber.trim()) {
      onCall(phoneNumber.trim());
    }
  }, [phoneNumber, onCall]);

  const handleCallFromRecent = useCallback(
    (number: string) => {
      setPhoneNumber(number);
      onCall(number);
      setShowRecent(false);
    },
    [onCall]
  );

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

  const formatDuration = (startTime?: Date) => {
    if (!startTime) return "00:00";
    const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Active call view
  if (currentCall) {
    return (
      <div className="w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide">
              {currentCall.status === "connecting" ? "Calling..." : "On Call"}
            </span>
            <button onClick={onClose} className="p-1 hover:bg-green-500 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-lg font-semibold">
            {currentCall.remoteName || "Unknown Caller"}
          </div>
          <div className="text-sm text-green-100">
            {formatPhoneNumber(currentCall.remoteNumber)}
          </div>
          {currentCall.status === "connected" && (
            <div className="text-sm mt-1">{formatDuration(currentCall.startTime)}</div>
          )}
        </div>
        <div className="p-4">
          <Button
            onClick={onHangUp}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm text-gray-900">Phone</span>
          {isRegistered && (
            <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Number Display */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter number"
            className="flex-1 bg-transparent text-lg font-medium text-gray-900 outline-none placeholder:text-gray-400"
          />
          {phoneNumber && (
            <button
              onClick={handleBackspace}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Delete className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setShowRecent(false)}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors",
            !showRecent
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Dialpad
        </button>
        <button
          onClick={() => setShowRecent(true)}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors",
            showRecent
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Recent
        </button>
      </div>

      {showRecent ? (
        /* Recent Calls List */
        <div className="max-h-64 overflow-y-auto">
          {recentCalls.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No recent calls</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentCalls.map((call, index) => (
                <button
                  key={`${call.id}-${index}`}
                  onClick={() => handleCallFromRecent(call.remoteNumber)}
                  className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      call.direction === "inbound" ? "bg-blue-100" : "bg-green-100"
                    )}
                  >
                    {call.direction === "inbound" ? (
                      <PhoneIncoming className="w-4 h-4 text-blue-600" />
                    ) : (
                      <PhoneOutgoing className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {call.remoteName || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPhoneNumber(call.remoteNumber)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Dialpad Grid */
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {DIALPAD_KEYS.map(({ digit, letters }) => (
              <button
                key={digit}
                onClick={() => handleDigitPress(digit)}
                className="h-12 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 flex flex-col items-center justify-center transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">{digit}</span>
                {letters && (
                  <span className="text-[10px] text-gray-400 tracking-wider">
                    {letters}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Call Button */}
          <Button
            onClick={handleCall}
            disabled={!phoneNumber.trim() || !isRegistered}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
        </div>
      )}
    </div>
  );
}
