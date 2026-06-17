"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { loginUser, signupUser } from "@/lib/auth";
import { useAuthSession } from "@/hooks/useAuthSession";

interface AuthPageClientProps {
  mode: "login" | "signup";
}

export function AuthPageClient({ mode }: AuthPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, hasHydrated, logout } = useAuthSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Create your profile";
  const description = isLogin
    ? "Sign in to continue with your watchlist and preferences."
    : "Choose a username and password to personalize your AnimeHub experience.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const result = isLogin
      ? await loginUser(username, password)
      : await signupUser(username, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    const redirectTo = searchParams.get("redirect");
    const nextPath =
      result.session?.role === "admin"
        ? redirectTo || "/admin"
        : redirectTo?.startsWith("/admin")
          ? "/"
          : redirectTo || "/";
    router.replace(nextPath);
  }

  if (hasHydrated && session) {
    return (
      <div className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-xl place-items-center px-4 py-10">
        <section className="glass-card w-full p-6 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-token bg-token-muted text-cyan">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-black text-token-foreground">
            Signed in as {session.username}
          </h1>
          <p className="mt-3 text-sm leading-6 text-token-muted">
            Continue exploring AnimeHub or switch profiles.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {session.role === "admin" ? (
              <Link href="/admin" className="button-primary">
                Admin Panel
              </Link>
            ) : null}
            <Link href="/" className="button-secondary">
              Explore
            </Link>
            <button type="button" className="button-outline" onClick={logout}>
              Sign out
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-xl place-items-center px-4 py-10">
      <section className="glass-card w-full p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-token bg-token-muted text-cyan">
            {isLogin ? (
              <LogIn className="h-5 w-5" aria-hidden="true" />
            ) : (
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              AnimeHub
            </p>
            <h1 className="mt-2 text-3xl font-black text-token-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-token-muted">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-token-foreground">
            Username
            <input
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setError("");
              }}
              className="form-field"
              autoComplete="username"
              minLength={3}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-token-foreground">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              className="form-field"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-500">
              {error}
            </p>
          ) : null}

          <button type="submit" className="button-primary w-full" disabled={submitting}>
            {isLogin ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-token-muted">
          {isLogin ? "New to AnimeHub?" : "Already have a profile?"}{" "}
          <Link
            href={isLogin ? "/signup" : "/login"}
            className="font-black text-cyan transition hover:text-token-foreground"
          >
            {isLogin ? "Create one" : "Log in"}
          </Link>
        </p>
      </section>
    </div>
  );
}
