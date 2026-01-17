"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/app/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { PhoneProvider } from "@/components/phone";

// Routes that should not show the sidebar/header (auth routes and public routes)
const PUBLIC_ROUTES = ["/login", "/change-password", "/verify", "/verify-pending", "/invoice/", "/portal"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, user } = useAuth();

  // Check if current route is a public route (no sidebar/header)
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // For public routes, render without sidebar/header
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, show sidebar/header if user is authenticated and verified
  if (user && user.emailVerified && !user.mustChangePassword) {
    return (
      <PhoneProvider autoInitialize>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </PhoneProvider>
    );
  }

  // Fallback: render children without shell (auth pages will handle their own layout)
  return <>{children}</>;
}
