"use client";

import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/components/ToastProvider";
import type { SharedComment } from "@/types/storage";

export const COMMENT_LIMIT = 500;

interface CommentActionResult {
  ok: boolean;
  error?: string;
}

async function parseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  return typeof data.error === "string" ? data.error : fallback;
}

export function useSharedComments(animeSlug: string, episodeNumber: number) {
  const [comments, setComments] = useState<SharedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        animeSlug,
        episodeNumber: String(episodeNumber)
      });
      const response = await fetch(`/api/comments?${params.toString()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Unable to load comments."));
      }

      const data = await response.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load comments.");
    } finally {
      setIsLoading(false);
    }
  }, [animeSlug, episodeNumber]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const addComment = useCallback(
    async (message: string): Promise<CommentActionResult> => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ animeSlug, episodeNumber, message })
      });

      if (!response.ok) {
        return { ok: false, error: await parseError(response, "Unable to post comment.") };
      }

      const data = await response.json();
      setComments((current) => [data.comment, ...current]);
      showToast({ message: "Comment posted", tone: "success" });
      return { ok: true };
    },
    [animeSlug, episodeNumber]
  );

  const deleteComment = useCallback(async (id: string): Promise<CommentActionResult> => {
    const response = await fetch(`/api/comments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!response.ok) {
      return { ok: false, error: await parseError(response, "Unable to delete comment.") };
    }

    setComments((current) => current.filter((comment) => comment.id !== id));
    showToast({ message: "Comment deleted", tone: "info" });
    return { ok: true };
  }, []);

  const likeComment = useCallback(async (id: string): Promise<CommentActionResult> => {
    const response = await fetch(`/api/comments/${encodeURIComponent(id)}/like`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      return { ok: false, error: await parseError(response, "Unable to like comment.") };
    }

    const data = await response.json();
    setComments((current) =>
      current.map((comment) => (comment.id === id ? data.comment : comment))
    );
    return { ok: true };
  }, []);

  return {
    comments,
    isLoading,
    error,
    reload: loadComments,
    addComment,
    deleteComment,
    likeComment,
    characterLimit: COMMENT_LIMIT
  };
}
