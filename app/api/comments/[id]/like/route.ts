import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { readComments, writeComments } from "@/lib/server/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LikeRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, { params }: LikeRouteProps) {
  const user = getSessionFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const comments = await readComments();
  const comment = comments.find((item) => item.id === id);

  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const currentLikedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];

  if (currentLikedBy.includes(user.id)) {
    return NextResponse.json({ error: "You already liked this comment." }, { status: 409 });
  }

  const updatedComments = comments.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const likedBy = [...(Array.isArray(item.likedBy) ? item.likedBy : []), user.id];

    return {
      ...item,
      likedBy,
      likes: likedBy.length
    };
  });
  const updatedComment = updatedComments.find((item) => item.id === id);

  await writeComments(updatedComments);

  return NextResponse.json({ comment: updatedComment });
}
