"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Facebook,
  Instagram,
  Unlink,
  ExternalLink,
  RefreshCw
} from "lucide-react";

interface ConnectedPage {
  id: string;
  pageId: string;
  pageName: string;
  platform: string;
  instagramUsername?: string;
  webhookSubscribed: boolean;
  isActive: boolean;
}

interface ConnectionData {
  connected: boolean;
  connection: {
    id: string;
    connectedBy: string;
    facebookUserName: string;
    status: string;
    tokenExpiresAt?: number;
    createdAt: number;
  } | null;
  pages: ConnectedPage[];
}

export default function ConnectPage() {
  const searchParams = useSearchParams();
  const [connectionData, setConnectionData] = useState<ConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success/error from OAuth callback
  useEffect(() => {
    const metaSuccess = searchParams.get("meta_success");
    const metaError = searchParams.get("meta_error");
    const errorDescription = searchParams.get("description");

    if (metaSuccess === "true") {
      setSuccessMessage("Successfully connected to Facebook & Instagram!");
    } else if (metaError) {
      setError(getErrorMessage(metaError, errorDescription));
    }
  }, [searchParams]);

  // Fetch connection status
  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/meta/pages");
      const data = await response.json();

      if (response.ok) {
        setConnectionData(data);
      } else {
        setError(data.error || "Failed to fetch connection status");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Facebook & Instagram? You will stop receiving messages.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/auth/meta/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setSuccessMessage("Disconnected successfully");
        setConnectionData({ connected: false, connection: null, pages: [] });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch (err) {
      setError("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/auth/meta/connect";
  };

  const getErrorMessage = (code: string, description?: string | null): string => {
    const messages: Record<string, string> = {
      not_authenticated: "You must be logged in to connect Facebook & Instagram",
      missing_params: "Invalid OAuth response from Facebook",
      state_mismatch: "Security check failed. Please try again.",
      missing_app_credentials: "Facebook App not configured properly",
      token_exchange_failed: "Failed to get access token from Facebook",
      long_lived_token_failed: "Failed to get long-lived token",
      user_info_failed: "Failed to get user info from Facebook",
      pages_fetch_failed: "Failed to fetch your Facebook pages",
      no_pages_found: "No Facebook pages found. You need admin access to at least one page.",
      unexpected_error: "An unexpected error occurred",
    };
    return messages[code] || description || `Error: ${code}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTokenExpiryStatus = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const now = Date.now();
    const daysLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: "expired", text: "Token expired", color: "text-red-600" };
    } else if (daysLeft < 7) {
      return { status: "expiring", text: `Expires in ${daysLeft} days`, color: "text-yellow-600" };
    } else {
      return { status: "valid", text: `Expires in ${daysLeft} days`, color: "text-green-600" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading connection status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Facebook className="h-8 w-8 text-blue-600" />
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
              <Instagram className="h-8 w-8 text-pink-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Connect Facebook & Instagram</h1>
          <p className="text-gray-600 mt-2">
            Connect your business pages to receive and respond to messages
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Connection Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {connectionData?.connected ? (
            <>
              {/* Connected Status Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                  <div>
                    <h2 className="text-white font-semibold text-lg">Connected</h2>
                    <p className="text-green-100 text-sm">
                      Connected by {connectionData.connection?.facebookUserName || connectionData.connection?.connectedBy}
                    </p>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="p-6 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Connected On</p>
                    <p className="text-gray-900 font-medium">
                      {connectionData.connection?.createdAt
                        ? formatDate(connectionData.connection.createdAt)
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Token Status</p>
                    {connectionData.connection?.tokenExpiresAt ? (
                      <p className={`font-medium ${getTokenExpiryStatus(connectionData.connection.tokenExpiresAt)?.color}`}>
                        {getTokenExpiryStatus(connectionData.connection.tokenExpiresAt)?.text}
                      </p>
                    ) : (
                      <p className="text-green-600 font-medium">Active</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected Pages */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                  Connected Pages
                </h3>

                {connectionData.pages.length > 0 ? (
                  <div className="space-y-3">
                    {connectionData.pages.map((page) => (
                      <div
                        key={page.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          page.isActive
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {page.platform === "facebook" ? (
                            <Facebook className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Instagram className="h-5 w-5 text-pink-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{page.pageName}</p>
                            {page.instagramUsername && (
                              <p className="text-sm text-gray-500">@{page.instagramUsername}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {page.webhookSubscribed && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Receiving Messages
                            </span>
                          )}
                          {page.isActive && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No pages connected</p>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={fetchConnectionStatus}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected State */}
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Unlink className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Connected</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your Facebook Page and Instagram Business account to receive and respond to messages directly in the CRM.
                </p>

                <button
                  onClick={handleConnect}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
                >
                  <Facebook className="h-5 w-5" />
                  Connect Facebook & Instagram
                  <ExternalLink className="h-4 w-4" />
                </button>

                {/* Requirements */}
                <div className="mt-8 text-left bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Requirements</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Admin access to a Facebook Page
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Instagram Business account linked to the Page (for Instagram DMs)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      Permission to grant messaging access
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact your system administrator.
        </p>
      </div>
    </div>
  );
}
