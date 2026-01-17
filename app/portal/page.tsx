"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalAuth } from "./layout";

export default function PortalPage() {
  const router = useRouter();
  const { authState } = usePortalAuth();

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push("/portal/login");
    } else if (!authState.is2FAVerified) {
      router.push("/portal/verify");
    } else {
      router.push("/portal/dashboard");
    }
  }, [authState, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );
}
