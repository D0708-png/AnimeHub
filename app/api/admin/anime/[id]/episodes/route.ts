import { NextRequest, NextResponse } from "next/server";
import type { AnimeEpisode } from "@/types/anime";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { createServerEpisode } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EpisodesRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: EpisodesRouteProps) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const episode = body.episode as AnimeEpisode;

    if (!episode?.id || !episode.title) {
      return NextResponse.json({ error: "Episode ID and title are required." }, { status: 400 });
    }

    const overrides = await createServerEpisode(id, episode);
    return NextResponse.json({ overrides }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
