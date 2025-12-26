"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  MoreVertical,
  Mail,
  Ban,
  CheckCircle,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: number;
  createdAt: number;
}

interface UserTableProps {
  users: User[];
}

export default function UserTable({ users }: UserTableProps) {
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const suspendUser = useMutation(api.users.suspend);
  const activateUser = useMutation(api.users.activate);
  const resetPassword = useMutation(api.users.resetPassword);

  const handleSuspend = async (userId: Id<"users">) => {
    setLoadingAction(userId);
    try {
      await suspendUser({ id: userId });
      toast.success("User suspended");
    } catch (error) {
      toast.error("Failed to suspend user");
    } finally {
      setLoadingAction(null);
      setActionMenuOpen(null);
    }
  };

  const handleActivate = async (userId: Id<"users">) => {
    setLoadingAction(userId);
    try {
      await activateUser({ id: userId });
      toast.success("User activated");
    } catch (error) {
      toast.error("Failed to activate user");
    } finally {
      setLoadingAction(null);
      setActionMenuOpen(null);
    }
  };

  const handleResetPassword = async (userId: Id<"users">) => {
    setLoadingAction(userId);
    try {
      await resetPassword({ id: userId });
      toast.success("Password reset to SHLF2026", { duration: 5000 });
    } catch (error) {
      toast.error("Failed to reset password");
    } finally {
      setLoadingAction(null);
      setActionMenuOpen(null);
    }
  };

  const handleResendVerification = async (userId: Id<"users">) => {
    setLoadingAction(userId);
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast.success("Verification email sent");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setLoadingAction(null);
      setActionMenuOpen(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.status === "suspended") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Suspended
        </span>
      );
    }
    if (user.status === "active" && user.emailVerified) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Active
        </span>
      );
    }
    if (user.mustChangePassword) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Password Change Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
        Email Pending
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Login
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded capitalize">
                  {user.role || "staff"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.lastLoginAt
                  ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")
                  : "Never"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="relative">
                  <button
                    onClick={() =>
                      setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)
                    }
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                    disabled={loadingAction === user._id}
                  >
                    {loadingAction === user._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MoreVertical className="w-5 h-5" />
                    )}
                  </button>

                  {actionMenuOpen === user._id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActionMenuOpen(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                        {!user.emailVerified && user.status !== "suspended" && (
                          <button
                            onClick={() => handleResendVerification(user._id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Mail className="w-4 h-4" />
                            Resend Verification
                          </button>
                        )}

                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <KeyRound className="w-4 h-4" />
                          Reset Password
                        </button>

                        {user.status === "suspended" ? (
                          <button
                            onClick={() => handleActivate(user._id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Activate User
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(user._id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-4 h-4" />
                            Suspend User
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found. Create your first user to get started.
        </div>
      )}
    </div>
  );
}
