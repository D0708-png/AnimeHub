import { NextRequest, NextResponse } from "next/server";
import type { Anime } from "@/types/anime";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { deleteServerAnime, patchServerAnime } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnimeRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: AnimeRouteProps) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const patch = (body.patch ?? body.anime ?? {}) as Partial<Anime>;
    const overrides = await patchServerAnime(id, patch);

    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: AnimeRouteProps) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { id } = await params;
    const overrides = await deleteServerAnime(id);

    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}
