import { NextResponse } from "next/server";
import { readServerCatalogOverrides } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const overrides = await readServerCatalogOverrides();
  return NextResponse.json({ overrides });
}
