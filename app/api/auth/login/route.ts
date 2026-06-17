import { NextRequest, NextResponse } from "next/server";
import {
  findUserByUsername,
  publicUser,
  setSessionCookie,
  validateAdminPassword,
  validateUserPassword
} from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!username.trim() || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const adminUser = await validateAdminPassword(username, password);

    if (adminUser) {
      const response = NextResponse.json({ user: adminUser });
      setSessionCookie(response, adminUser);
      return response;
    }

    const user = await findUserByUsername(username);
    const isValidPassword = user ? await validateUserPassword(user, password) : false;

    if (!user || !isValidPassword) {
      return NextResponse.json(
        { error: "Incorrect username or password." },
        { status: 401 }
      );
    }

    const responseUser = publicUser(user);
    const response = NextResponse.json({ user: responseUser });
    setSessionCookie(response, responseUser);

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log in." },
      { status: 500 }
    );
  }
}
