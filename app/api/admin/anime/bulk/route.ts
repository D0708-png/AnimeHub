import { NextRequest, NextResponse } from "next/server";
import type { BulkAnimeAction } from "@/lib/catalog";
import { handleApiError, requireAdminSession } from "@/lib/server/admin-api";
import { bulkUpdateServerAnime } from "@/lib/server/admin-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bulkAnimeActions = [
  "delete",
  "hide",
  "unhide",
  "markFeatured",
  "removeFeatured",
  "markTrending",
  "removeTrending"
] as const satisfies readonly BulkAnimeAction[];

function isBulkAnimeAction(action: unknown): action is BulkAnimeAction {
  return typeof action === "string" && bulkAnimeActions.includes(action as BulkAnimeAction);
}

export async function POST(request: NextRequest) {
  const admin = requireAdminSession(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const body = await request.json();

    if (!isBulkAnimeAction(body.action)) {
      return NextResponse.json({ error: "Unsupported bulk anime action." }, { status: 400 });
    }

    const animeIds: string[] = Array.isArray(body.animeIds)
      ? body.animeIds.map((animeId: unknown) => String(animeId).trim()).filter(Boolean)
      : [];

    if (animeIds.length === 0) {
      return NextResponse.json({ error: "Select at least one anime." }, { status: 400 });
    }

    const uniqueAnimeIds = Array.from(new Set(animeIds));
    const overrides = await bulkUpdateServerAnime(body.action, uniqueAnimeIds);

    return NextResponse.json({ count: uniqueAnimeIds.length, overrides });
  } catch (error) {
    return handleApiError(error);
  }
}
