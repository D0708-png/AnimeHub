"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUTH_SESSION_EVENT,
  type AuthSession,
  fetchAuthSession,
  logoutAuth
} from "@/lib/auth";

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const refreshSession = useCallback(() => {
    fetchAuthSession()
      .then((nextSession) => setSession(nextSession))
      .finally(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    refreshSession();
    window.addEventListener(AUTH_SESSION_EVENT, refreshSession);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, refreshSession);
    };
  }, [refreshSession]);

  const logout = useCallback(() => {
    logoutAuth();
  }, []);

  return {
    session,
    hasHydrated,
    logout,
    isAdmin: session?.role === "admin"
  };
}
