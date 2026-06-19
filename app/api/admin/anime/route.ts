import { NextRequest, NextResponse } from "next/server";
import type { Anime } from "@/types/anime";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { createServerAnime } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const body = await request.json();
    const anime = body.anime as Anime;

    if (!anime?.id || !anime.title) {
      return NextResponse.json({ error: "Anime ID and title are required." }, { status: 400 });
    }

    const overrides = await createServerAnime(anime);
    return NextResponse.json({ overrides }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
