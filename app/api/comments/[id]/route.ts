import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { canDeleteComment, readComments, writeComments } from "@/lib/server/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CommentRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: CommentRouteProps) {
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

  if (!canDeleteComment(comment, user)) {
    return NextResponse.json({ error: "You can only delete your own comments." }, { status: 403 });
  }

  await writeComments(comments.filter((item) => item.id !== id));

  return NextResponse.json({ ok: true });
}
