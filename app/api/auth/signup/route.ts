import { NextRequest, NextResponse } from "next/server";
import {
  createUser,
  findUserByUsername,
  publicUser,
  setSessionCookie,
  validateSignupInput
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    const validationError = validateSignupInput(username, password);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    const user = publicUser(await createUser(username, password));
    const response = NextResponse.json({ user });
    setSessionCookie(response, user);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 500 }
    );
  }
}
