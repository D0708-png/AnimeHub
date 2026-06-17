"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageSquare, Send, Star } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { CommentMap, RatingMap } from "@/types/storage";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface FanActionsProps {
  animeSlug: string;
}

export function FanActions({ animeSlug }: FanActionsProps) {
  const [ratings, setRatings] = useLocalStorage<RatingMap>(STORAGE_KEYS.ratings, {});
  const [comments, setComments] = useLocalStorage<CommentMap>(STORAGE_KEYS.comments, {});
  const [draft, setDraft] = useState("");
  const currentRating = ratings[animeSlug] ?? 0;
  const animeComments = useMemo(() => comments[animeSlug] ?? [], [animeSlug, comments]);

  function updateRating(nextRating: number) {
    setRatings({
      ...ratings,
      [animeSlug]: nextRating
    });
  }

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();

    if (!body) {
      return;
    }

    setComments({
      ...comments,
      [animeSlug]: [
        {
          id: `${animeSlug}-${Date.now()}`,
          animeSlug,
          episodeNumber: 0,
          username: "Viewer",
          message: body,
          likes: 0,
          createdAt: new Date().toISOString()
        },
        ...animeComments
      ]
    });
    setDraft("");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="glass-card p-5">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-lemon" aria-hidden="true" />
          <h2 className="text-lg font-black text-white">Your rating</h2>
        </div>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => updateRating(rating)}
              className={`grid h-10 w-10 place-items-center rounded-lg border text-sm font-black transition ${
                rating <= currentRating
                  ? "border-lemon bg-lemon text-night"
                  : "border-white/10 bg-white/[0.06] text-white/44 hover:border-lemon"
              }`}
              aria-label={`Rate ${rating} out of 5`}
            >
              {rating}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Your rating helps you remember favorite titles.
        </p>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-aqua" aria-hidden="true" />
          <h2 className="text-lg font-black text-white">Private notes</h2>
        </div>
        <form className="mt-4 flex gap-2" onSubmit={addComment}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="form-field min-w-0 flex-1 py-2"
            placeholder="Write a private note about this title"
          />
          <button
            type="submit"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan text-night transition hover:bg-ember"
            aria-label="Add note"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {animeComments.length === 0 ? (
            <p className="text-sm text-white/58">No notes yet.</p>
          ) : (
            animeComments.slice(0, 4).map((comment) => (
              <p
                className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm leading-6 text-white/72"
                key={comment.id}
              >
                {comment.message}
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
