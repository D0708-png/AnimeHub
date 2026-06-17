import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest, NextResponse } from "next/server";
import { readJsonBlob, writeJsonBlob } from "./blob-store";

const AUTH_STORE = "animehub-auth";
const USERS_KEY = "users";
const SESSION_COOKIE = "animehub_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = "user" | "admin";

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
}

interface SessionPayload extends PublicUser {
  exp: number;
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function publicUser(user: Pick<StoredUser, "id" | "username" | "role">): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

function getAdminUsername() {
  return normalizeUsername(process.env.ADMIN_USERNAME || "admin");
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "animehub-development-auth-secret";
  }

  throw new Error("AUTH_SECRET is not configured.");
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getAuthSecret()).update(encodedPayload).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: PublicUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encodedPayload = base64UrlJson(payload);
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): PublicUser | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !signaturesMatch(signPayload(encodedPayload), signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;

    if (
      !payload.id ||
      !payload.username ||
      !["user", "admin"].includes(payload.role) ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, user: PublicUser) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function readUsers() {
  return readJsonBlob<StoredUser[]>(AUTH_STORE, USERS_KEY, []);
}

export async function writeUsers(users: StoredUser[]) {
  await writeJsonBlob(AUTH_STORE, USERS_KEY, users);
}

export async function findUserByUsername(username: string) {
  const normalizedUsername = normalizeUsername(username);
  const users = await readUsers();

  return users.find((user) => normalizeUsername(user.username) === normalizedUsername) ?? null;
}

export async function createUser(username: string, password: string) {
  const now = new Date().toISOString();
  const cleanUsername = normalizeUsername(username);
  const passwordHash = await bcrypt.hash(password, 12);
  const user: StoredUser = {
    id: randomUUID(),
    username: cleanUsername,
    passwordHash,
    role: "user",
    createdAt: now
  };
  const users = await readUsers();

  await writeUsers([...users, user]);
  return user;
}

export async function validateUserPassword(user: StoredUser, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export async function validateAdminPassword(username: string, password: string) {
  if (normalizeUsername(username) !== getAdminUsername()) {
    return null;
  }

  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return null;
  }

  const passwordMatches = adminPassword.startsWith("$2")
    ? await bcrypt.compare(password, adminPassword)
    : password === adminPassword;

  if (!passwordMatches) {
    return null;
  }

  return {
    id: `admin:${getAdminUsername()}`,
    username: getAdminUsername(),
    role: "admin" as const
  };
}

export function validateSignupInput(username: string, password: string) {
  const cleanUsername = normalizeUsername(username);

  if (cleanUsername.length < 3) {
    return "Username must be at least 3 characters.";
  }

  if (cleanUsername === getAdminUsername()) {
    return "That username is reserved.";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}
