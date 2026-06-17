"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthSession } from "@/hooks/useAuthSession";

interface AdminGateProps {
  children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { session, hasHydrated, isAdmin, logout } = useAuthSession();

  if (!hasHydrated) {
    return (
      <div className="container-page py-10">
        <div className="glass-card p-6 text-sm text-token-muted">Checking session...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container-page grid min-h-[calc(100svh-9rem)] place-items-center py-8">
        <section className="w-full max-w-md rounded-3xl border border-token bg-token-card p-5 text-center shadow-soft sm:p-7">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-token bg-token-muted text-cyan">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-token-foreground">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-token-muted">
            Log in with an admin profile to manage AnimeHub settings.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/login?redirect=/admin" className="button-primary">
              Log in
            </Link>
            {session ? (
              <button type="button" className="button-secondary" onClick={logout}>
                Sign out
              </button>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-token bg-token-card backdrop-blur-xl">
        <div className="container-page flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              Admin Panel
            </p>
            <p className="mt-1 text-sm text-token-muted">
              Manage titles, episode entries, and featured sections.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <button type="button" className="button-secondary" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Lock Admin
            </button>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
