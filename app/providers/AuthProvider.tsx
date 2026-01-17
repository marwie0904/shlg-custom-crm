"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * AUTH BYPASS FOR DEVELOPMENT/DEMO
 * =================================
 * Set NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local to bypass all authentication.
 *
 * TO RESTORE AUTHENTICATION:
 * 1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local
 * 2. Or delete the variable entirely
 */
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// Mock user for demo mode
const MOCK_USER = {
  id: "mock-user-001",
  name: "Demo User",
  email: "demo@safeharbor.com",
  role: "admin",
  mustChangePassword: false,
  emailVerified: true,
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/verify", "/change-password"];
// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(USE_MOCK_DATA ? MOCK_USER : null);
  const [isLoading, setIsLoading] = useState(!USE_MOCK_DATA);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAuth = useCallback(async () => {
    // Skip API call in mock mode - user is already set
    if (USE_MOCK_DATA) {
      return;
    }
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  // Handle route protection - SKIP IN MOCK MODE
  useEffect(() => {
    // Skip all route protection in mock mode
    if (USE_MOCK_DATA) return;

    if (isLoading) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      router.push("/login");
      return;
    }

    if (user) {
      // User is authenticated
      if (user.mustChangePassword && pathname !== "/change-password") {
        // Must change password first
        router.push("/change-password");
        return;
      }

      if (!user.emailVerified && !user.mustChangePassword && pathname !== "/verify-pending" && !isPublicRoute) {
        // Email not verified
        router.push("/verify-pending");
        return;
      }

      if (isAdminRoute && user.role !== "admin") {
        // Trying to access admin route without admin role
        router.push("/");
        return;
      }

      if (pathname === "/login" && user.emailVerified && !user.mustChangePassword) {
        // Already logged in, redirect to dashboard
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      setUser(data.user);

      if (data.redirectTo) {
        router.push(data.redirectTo);
      }

      return { success: true };
    } catch {
      return { success: false, error: "An error occurred during login" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      router.push("/login");
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      // Refresh auth to get updated user state
      await refreshAuth();

      if (data.redirectTo) {
        router.push(data.redirectTo);
      }

      return { success: true };
    } catch {
      return { success: false, error: "An error occurred while changing password" };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An error occurred while sending verification email" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        changePassword,
        resendVerificationEmail,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
