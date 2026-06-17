"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Bookmark,
  Clock3,
  Home,
  Info,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Tv,
  UserCircle,
  X
} from "lucide-react";
import clsx from "clsx";
import gsap from "gsap";
import { SITE_NAME } from "@/lib/constants";
import { prefersReducedMotion } from "@/lib/gsap";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ThemeToggle } from "./ThemeToggle";

const SearchCommand = dynamic(
  () => import("./SearchCommand").then((module) => module.SearchCommand),
  {
    ssr: false,
    loading: () => (
      <button type="button" className="button-icon" aria-label="Loading anime search">
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
    )
  }
);

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/anime", label: "Anime", icon: Tv },
  { href: "/search", label: "Search", icon: Search },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  { href: "/about", label: "About", icon: Info }
];

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, hasHydrated, isAdmin, logout } = useAuthSession();

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 14);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;

    if (!header || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.to(header, {
        backdropFilter: hasScrolled ? "blur(16px)" : "blur(0px)",
        duration: 0.18,
        ease: "power2.out"
      });
    }, header);

    return () => context.revert();
  }, [hasScrolled]);

  return (
    <header
      ref={headerRef}
      className={clsx(
        "sticky top-0 z-50 transition-all duration-300",
        hasScrolled
          ? "border-b border-token bg-token-card shadow-sm backdrop-blur-xl"
          : "border-b border-white/0 bg-transparent"
      )}
    >
      <div className="container-page flex items-center justify-between gap-3 py-3">
        <Link href="/" className="group flex items-center gap-3" aria-label={SITE_NAME}>
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan/20 bg-cyan/10 text-cyan transition duration-200 group-hover:scale-105">
            <Tv className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black tracking-normal text-white">
              AnimeHub
            </span>
            <span className="block truncate text-[11px] font-bold uppercase tracking-[0.14em] text-cyan/80">
              Official Watch
            </span>
          </span>
        </Link>

        <nav aria-label={SITE_NAME} className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition duration-300",
                  isActive
                    ? "bg-token-primary text-token-primary-foreground shadow-sm"
                    : "text-token-muted hover:bg-token-muted hover:text-token-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle compact />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            {hasHydrated && session ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="button-secondary px-3 py-2 text-xs">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Admin Panel
                  </Link>
                ) : null}
                <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-token bg-token-card px-3 text-sm font-bold text-token-muted">
                  <UserCircle className="h-4 w-4" aria-hidden="true" />
                  {session.username}
                </span>
                <button
                  type="button"
                  className="button-icon"
                  onClick={logout}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <Link href="/login" className="button-secondary px-3 py-2 text-xs">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log in
              </Link>
            )}
          </div>
          <SearchCommand />
          <button
            type="button"
            className="button-icon lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "container-page grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 lg:hidden",
          menuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <nav className="min-h-0" aria-label="Mobile navigation">
          <div className="mb-4 grid max-h-[calc(100svh-5.5rem)] gap-2 overflow-y-auto rounded-3xl border border-token bg-token-card p-3 shadow-sm backdrop-blur-xl">
            <ThemeToggle />
            {hasHydrated && session ? (
              <div className="rounded-2xl border border-token bg-token-muted p-3">
                <p className="text-sm font-black text-token-foreground">{session.username}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {isAdmin ? (
                    <Link href="/admin" className="button-secondary px-3 py-2 text-xs">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Admin Panel
                    </Link>
                  ) : null}
                  <button type="button" className="button-outline px-3 py-2 text-xs" onClick={logout}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-token-muted transition hover:bg-token-muted hover:text-token-foreground">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Log in
              </Link>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
                    isActive
                      ? "bg-token-primary text-token-primary-foreground"
                      : "text-token-muted hover:bg-token-muted hover:text-token-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
