import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "./auth";

export function requireAdminSession(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Please log in first." }, { status: 401 })
    };
  }

  if (user.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Admin access required." }, { status: 403 })
    };
  }

  return {
    ok: true as const,
    user
  };
}

export function handleApiError(error: unknown, fallback = "Unable to update catalog.") {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 500 }
  );
}
