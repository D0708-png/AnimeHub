export const AUTH_SESSION_EVENT = "animehub-auth-session";

export type AuthRole = "user" | "admin";

export interface AuthSession {
  id: string;
  username: string;
  role: AuthRole;
}

interface AuthResult {
  ok: boolean;
  error?: string;
  session?: AuthSession | null;
}

async function parseAuthResponse(response: Response): Promise<AuthResult> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Something went wrong."
    };
  }

  return {
    ok: true,
    session: data.user ?? null
  };
}

export function dispatchAuthChange() {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

export async function fetchAuthSession(): Promise<AuthSession | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return data.user ?? null;
}

export async function signupUser(username: string, password: string): Promise<AuthResult> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });
  const result = await parseAuthResponse(response);

  if (result.ok) {
    dispatchAuthChange();
  }

  return result;
}

export async function loginUser(username: string, password: string): Promise<AuthResult> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password })
  });
  const result = await parseAuthResponse(response);

  if (result.ok) {
    dispatchAuthChange();
  }

  return result;
}

export async function logoutAuth() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });
  dispatchAuthChange();
}
