import { NextRequest, NextResponse } from "next/server";
import type { AnimeEpisode } from "@/types/anime";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { deleteServerEpisode, patchServerEpisode } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EpisodeRouteProps {
  params: Promise<{
    id: string;
    episodeId: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: EpisodeRouteProps) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { id, episodeId } = await params;
    const body = await request.json();
    const patch = (body.patch ?? body.episode ?? {}) as Partial<AnimeEpisode>;
    const overrides = await patchServerEpisode(id, episodeId, patch);

    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: EpisodeRouteProps) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const { id, episodeId } = await params;
    const overrides = await deleteServerEpisode(id, episodeId);

    return NextResponse.json({ overrides });
  } catch (error) {
    return handleApiError(error);
  }
}
