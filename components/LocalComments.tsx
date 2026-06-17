"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Send, Trash2 } from "lucide-react";
import type { SharedComment } from "@/types/storage";
import { formatStoredDate } from "@/lib/storage";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { useSharedComments } from "@/hooks/useSharedComments";

interface LocalCommentsProps {
  animeSlug: string;
  episodeNumber: number;
}

type SortMode = "newest" | "liked";

export function LocalComments({ animeSlug, episodeNumber }: LocalCommentsProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const commentsRef = useRef<HTMLDivElement>(null);
  const { session, isAdmin } = useAuthSession();
  const {
    comments,
    isLoading,
    error: loadError,
    addComment,
    deleteComment,
    likeComment,
    characterLimit
  } = useSharedComments(animeSlug, episodeNumber);

  useGsapReveal(commentsRef, { selector: ".comment-card", y: 16, stagger: 0.05 });

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortMode === "liked") {
        return b.likes - a.likes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, sortMode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addComment(message).then((result) => {
      if (!result.ok) {
        setError(result.error ?? "Could not post comment.");
        return;
      }

      setError("");
      setMessage("");
    });
  }

  function renderComment(comment: SharedComment) {
    const likedBy = Array.isArray(comment.likedBy) ? comment.likedBy : [];
    const canDelete = Boolean(session && (isAdmin || comment.userId === session.id));
    const alreadyLiked = Boolean(session && likedBy.includes(session.id));

    return (
      <article key={comment.id} className="comment-card rounded-2xl border border-token bg-token-card p-4">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-token bg-token-muted text-sm font-black text-token-foreground">
            {comment.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-token-foreground">{comment.username}</p>
                <p className="text-xs font-semibold text-token-muted">
                  {formatStoredDate(comment.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-token px-3 py-1.5 text-xs font-black text-token-muted transition hover:border-signal/40 hover:text-signal disabled:cursor-not-allowed disabled:opacity-55"
                  onClick={() => {
                    likeComment(comment.id).then((result) => {
                      if (!result.ok) {
                        setError(result.error ?? "Could not like comment.");
                      }
                    });
                  }}
                  disabled={!session || alreadyLiked}
                  title={!session ? "Log in to like comments" : alreadyLiked ? "Already liked" : "Like comment"}
                >
                  <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                  {comment.likes}
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-token px-3 py-1.5 text-xs font-black text-token-muted transition hover:border-ember/40 hover:text-ember"
                    onClick={() => {
                      deleteComment(comment.id).then((result) => {
                        if (!result.ok) {
                          setError(result.error ?? "Could not delete comment.");
                        }
                      });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-token-muted">
              {comment.message}
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <section className="glass-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Join the conversation.
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Comments</h2>
        </div>
        <div className="flex rounded-full border border-token bg-token-muted p-1">
          {[
            ["newest", "Newest"],
            ["liked", "Most liked"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSortMode(value as SortMode)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                sortMode === value ? "bg-token-primary text-token-primary-foreground" : "text-token-muted hover:text-token-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {session ? (
        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <p className="text-sm font-bold text-token-muted">
            Posting as <span className="text-token-foreground">{session.username}</span>
          </p>
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setError("");
            }}
            className="min-h-28 resize-y rounded-2xl border border-token bg-token-card px-4 py-3 text-sm font-semibold leading-6 text-token-foreground placeholder:text-token-muted"
            placeholder="Share your thoughts..."
            maxLength={characterLimit}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-token-muted">
                {message.length}/{characterLimit} characters
              </p>
              {error ? <p className="mt-1 text-xs font-bold text-ember">{error}</p> : null}
            </div>
            <button type="submit" className="button-primary">
              <Send className="h-4 w-4" aria-hidden="true" />
              Post comment
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-token bg-token-muted p-4 text-sm font-bold text-token-muted">
          Login to join the conversation.
          <Link href="/login" className="button-secondary mt-3 w-fit">
            Log in
          </Link>
        </div>
      )}

      <div ref={commentsRef} className="mt-6 grid gap-3">
        {isLoading ? (
          <p className="text-sm font-semibold text-token-muted">Loading comments...</p>
        ) : loadError ? (
          <p className="rounded-2xl border border-ember/20 bg-ember/10 p-4 text-sm font-bold text-ember">
            {loadError}
          </p>
        ) : sortedComments.length > 0 ? (
          sortedComments.map(renderComment)
        ) : (
          <div className="rounded-2xl border border-dashed border-token p-6 text-center text-sm font-semibold text-token-muted">
            No comments yet.
          </div>
        )}
      </div>
    </section>
  );
}
