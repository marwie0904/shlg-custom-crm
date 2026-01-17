"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PortalAuthState {
  isAuthenticated: boolean;
  is2FAVerified: boolean;
  clientData: {
    name: string;
    email: string;
    responsibleAttorney: string;
  } | null;
}

interface PortalAuthContextType {
  authState: PortalAuthState;
  login: (email: string, password: string) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType | null>(null);

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (!context) {
    throw new Error("usePortalAuth must be used within PortalLayout");
  }
  return context;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<PortalAuthState>({
    isAuthenticated: false,
    is2FAVerified: false,
    clientData: null,
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - any credentials work
    await new Promise((resolve) => setTimeout(resolve, 800));
    setAuthState({
      isAuthenticated: true,
      is2FAVerified: false,
      clientData: {
        name: "John Smith",
        email: email,
        responsibleAttorney: "Attorney Sarah Johnson",
      },
    });
    return true;
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    // Mock 2FA - any code works
    await new Promise((resolve) => setTimeout(resolve, 600));
    setAuthState((prev) => ({
      ...prev,
      is2FAVerified: true,
    }));
    return true;
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      is2FAVerified: false,
      clientData: null,
    });
  };

  return (
    <PortalAuthContext.Provider value={{ authState, login, verify2FA, logout }}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </PortalAuthContext.Provider>
  );
}
