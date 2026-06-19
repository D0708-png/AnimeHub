import { NextRequest, NextResponse } from "next/server";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { resetServerCatalogOverrides } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const overrides = await resetServerCatalogOverrides();
    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}
