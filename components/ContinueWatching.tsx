"use client";

import Link from "next/link";
import { Clock3, PlayCircle } from "lucide-react";
import type { Anime } from "@/types/anime";
import { formatStoredDate } from "@/lib/storage";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { SafeImage } from "./SafeImage";
import { SourceBadge } from "./SourceBadge";

interface ContinueWatchingProps {
  anime: Anime[];
}

export function ContinueWatching({ anime }: ContinueWatchingProps) {
  const { history, hasHydrated } = useWatchHistory();
  const latest = history[0];
  const title = latest ? anime.find((item) => item.slug === latest.slug) : undefined;
  const episode = title?.episodes.find((item) => item.number === latest?.episodeNumber);
  const bannerImage = title ? title.heroImage || title.bannerImage || title.posterImage : "";
  const posterImage = title
    ? title.cardThumbnail ||
      title.posterImage ||
      title.bannerImage ||
      title.episodes[0]?.thumbnail
    : "";

  if (!hasHydrated) {
    return <div className="glass-card p-6 text-white/62">Loading watch history...</div>;
  }

  if (!latest || !title || !episode) {
    return (
      <div className="glass-card overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan/10 text-cyan">
            <Clock3 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-xl font-black text-white">No watch history yet</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
              Open an episode and AnimeHub will keep it ready here for your next visit.
            </p>
            <Link href="/anime" className="button-secondary mt-5">
              Browse anime
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div
        className="relative grid gap-5 p-5 sm:grid-cols-[12rem_1fr] sm:p-6"
      >
        <SafeImage
          src={bannerImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="continue-panel-overlay absolute inset-0" />
        <div
          className="media-on-image relative z-10 aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-token-muted shadow-soft"
          aria-hidden="true"
        >
          <SafeImage
            src={posterImage}
            alt=""
            fill
            sizes="12rem"
            className="object-cover"
          />
          <div className="thumbnail-gradient absolute inset-0" />
        </div>
        <div className="relative z-10 flex min-w-0 flex-col justify-center">
          <SourceBadge sourceName={title.sourceName} />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-ember">
            Continue watching
          </p>
          <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title.title}</h3>
          <p className="mt-2 text-sm font-bold text-white/70">
            Episode {episode.number}: {episode.title}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
            Last opened {formatStoredDate(latest.watchedAt)}
          </p>
          <Link href={`/watch/${title.slug}/${episode.number}`} className="button-primary mt-5 w-fit">
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Resume
          </Link>
        </div>
      </div>
    </div>
  );
}
