"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Loader2, Mail, RefreshCw, LogOut } from "lucide-react";

export default function VerifyPendingPage() {
  const { user, resendVerificationEmail, logout, isLoading: authLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResend = async () => {
    setIsResending(true);
    setMessage("");
    setError("");

    const result = await resendVerificationEmail();

    if (result.success) {
      setMessage("Verification email sent! Please check your inbox.");
    } else {
      setError(result.error || "Failed to send verification email");
    }

    setIsResending(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Mail className="h-8 w-8 text-blue-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
      <p className="text-gray-600 mt-2 mb-6">
        We&apos;ve sent a verification email to{" "}
        <span className="font-semibold">{user?.email}</span>. Please click the link in the email to
        verify your account.
      </p>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Verification Email
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        Didn&apos;t receive the email? Check your spam folder or click resend above.
      </p>
    </div>
  );
}
