import { randomUUID } from "node:crypto";
import type { SharedComment } from "@/types/storage";
import type { PublicUser } from "./auth";
import { readJsonBlob, writeJsonBlob } from "./blob-store";

const COMMENT_STORE = "animehub-comments";
const COMMENTS_KEY = "comments";
export const COMMENT_LIMIT = 500;

export async function readComments() {
  const comments = await readJsonBlob<SharedComment[]>(COMMENT_STORE, COMMENTS_KEY, []);

  return comments.map((comment) => {
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];

    return {
      ...comment,
      likedBy,
      likes: Number.isFinite(comment.likes) ? comment.likes : likedBy.length
    };
  });
}

export async function writeComments(comments: SharedComment[]) {
  await writeJsonBlob(COMMENT_STORE, COMMENTS_KEY, comments);
}

export function filterEpisodeComments(
  comments: SharedComment[],
  animeSlug: string,
  episodeNumber: number
) {
  return comments
    .filter(
      (comment) =>
        comment.animeSlug === animeSlug && comment.episodeNumber === episodeNumber
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createComment({
  animeSlug,
  episodeNumber,
  message,
  user
}: {
  animeSlug: string;
  episodeNumber: number;
  message: string;
  user: PublicUser;
}): SharedComment {
  return {
    id: randomUUID(),
    animeSlug,
    episodeNumber,
    username: user.username,
    userId: user.id,
    message,
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
}

export function canDeleteComment(comment: SharedComment, user: PublicUser) {
  return comment.userId === user.id || user.role === "admin";
}

export function validateCommentInput(input: {
  animeSlug?: unknown;
  episodeNumber?: unknown;
  message?: unknown;
}) {
  const animeSlug = typeof input.animeSlug === "string" ? input.animeSlug.trim() : "";
  const episodeNumber = Number(input.episodeNumber);
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!animeSlug) {
    return { ok: false as const, error: "Anime is required." };
  }

  if (!Number.isFinite(episodeNumber) || episodeNumber < 1) {
    return { ok: false as const, error: "Episode number is required." };
  }

  if (message.length < 2) {
    return { ok: false as const, error: "Comment must be at least 2 characters." };
  }

  if (message.length > COMMENT_LIMIT) {
    return {
      ok: false as const,
      error: `Comment must be ${COMMENT_LIMIT} characters or fewer.`
    };
  }

  return {
    ok: true as const,
    animeSlug,
    episodeNumber,
    message
  };
}
