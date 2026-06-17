import { NextRequest, NextResponse } from "next/server";
import {
  createComment,
  filterEpisodeComments,
  readComments,
  validateCommentInput,
  writeComments
} from "@/lib/server/comments";
import { getSessionFromRequest } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const animeSlug = searchParams.get("animeSlug") ?? "";
  const episodeNumber = Number(searchParams.get("episodeNumber"));

  if (!animeSlug || !Number.isFinite(episodeNumber)) {
    return NextResponse.json({ error: "Anime and episode are required." }, { status: 400 });
  }

  const comments = filterEpisodeComments(await readComments(), animeSlug, episodeNumber);

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Login to join the conversation." }, { status: 401 });
  }

  try {
    const validation = validateCommentInput(await request.json());

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const allComments = await readComments();
    const comment = createComment({ ...validation, user });
    await writeComments([comment, ...allComments]);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post comment." },
      { status: 500 }
    );
  }
}
