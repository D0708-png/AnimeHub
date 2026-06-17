"use client";

import Link from "next/link";
import { PlayCircle, Trash2 } from "lucide-react";
import type { Anime } from "@/types/anime";
import { formatStoredDate } from "@/lib/storage";
import { useCatalog } from "@/hooks/useCatalog";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { EmptyState } from "./EmptyState";
import { SafeImage } from "./SafeImage";

interface HistoryClientProps {
  anime: Anime[];
}

export function HistoryClient({ anime }: HistoryClientProps) {
  const { catalog } = useCatalog(anime);
  const { history, removeHistoryItem, clearHistory, hasHydrated } = useWatchHistory();

  if (!hasHydrated) {
    return <div className="glass-card p-8 text-white/62">Loading watch history...</div>;
  }

  if (history.length === 0) {
    return (
      <EmptyState
        title="No watch history yet"
        description="Open an episode and it will appear here for a faster return."
        actionHref="/anime"
        actionLabel="Browse anime"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearHistory}
          className="button-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Clear history
        </button>
      </div>
      <div className="grid gap-4">
        {history.map((item) => {
          const catalogAnime = catalog.find((entry) => entry.slug === item.slug);
          const poster =
            catalogAnime?.cardThumbnail ??
            catalogAnime?.posterImage ??
            catalogAnime?.bannerImage ??
            item.posterImage;

          return (
            <article
              key={item.id}
              className="grid gap-4 rounded-3xl border border-token bg-token-card p-4 shadow-soft backdrop-blur-xl transition hover:border-cyan/40 sm:grid-cols-[7rem_1fr] lg:grid-cols-[7rem_1fr_auto]"
            >
              <div className="media-on-image relative aspect-[3/4] overflow-hidden rounded-2xl bg-token-muted" aria-hidden="true">
                <SafeImage
                  src={poster}
                  alt=""
                  fill
                  sizes="7rem"
                  className="object-cover"
                />
                <div className="thumbnail-gradient absolute inset-0" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/46">
                  {formatStoredDate(item.watchedAt)}
                </p>
                <h2 className="mt-2 text-xl font-black text-white">{item.title}</h2>
                <p className="mt-1 text-sm text-white/62">
                  Episode {item.episodeNumber}: {item.episodeTitle}
                </p>
              </div>
              <div className="grid gap-2 sm:col-span-2 sm:flex sm:flex-wrap lg:col-span-1 lg:flex-col lg:justify-center">
                <Link href={`/watch/${item.slug}/${item.episodeNumber}`} className="button-primary px-4 py-2">
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Continue Watching
                </Link>
                <button
                  type="button"
                  onClick={() => removeHistoryItem(item.id)}
                  className="button-danger px-4 py-2"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove Item
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
