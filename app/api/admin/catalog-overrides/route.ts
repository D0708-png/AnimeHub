import { NextRequest, NextResponse } from "next/server";
import type { Anime } from "@/types/anime";
import type { ServerCatalogOverrides } from "@/lib/catalog";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import {
  convertCatalogToServerOverrides,
  readServerCatalogOverrides,
  replaceServerCatalogState
} from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  const overrides = await readServerCatalogOverrides();
  return NextResponse.json({ overrides });
}

export async function PUT(request: NextRequest) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const body = await request.json();
    const nextState = Array.isArray(body.catalog)
      ? convertCatalogToServerOverrides(body.catalog as Anime[])
      : (body.overrides as ServerCatalogOverrides);
    const overrides = await replaceServerCatalogState(nextState);

    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}
