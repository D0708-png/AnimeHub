"use client";

import Link from "next/link";
import { Info, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { useRef } from "react";
import gsap from "gsap";
import type { Anime } from "@/types/anime";
import { getPublicAnimeSynopsis } from "@/lib/catalog";
import { SafeImage } from "./SafeImage";
import { SourceBadge } from "./SourceBadge";
import { WatchlistButton } from "./WatchlistButton";

interface AnimeCardProps {
  anime: Anime;
  compact?: boolean;
}

export function AnimeCard({ anime, compact = false }: AnimeCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const firstEpisode = anime.episodes[0];
  const cardImage =
    anime.cardThumbnail || anime.posterImage || anime.bannerImage || firstEpisode?.thumbnail;
  const synopsis = getPublicAnimeSynopsis(anime);

  function animateHover(active: boolean) {
    const card = cardRef.current;

    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.to(card, {
      y: active ? -3 : 0,
      duration: 0.2,
      ease: "power3.out"
    });
  }

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => animateHover(true)}
      onMouseLeave={() => animateHover(false)}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border border-token bg-token-card shadow-soft transition-colors duration-200 hover:border-cyan/35 focus-within:border-cyan/35",
        compact && "grid grid-cols-[8.5rem_1fr] sm:grid-cols-[10rem_1fr]"
      )}
    >
      <div
        className={clsx(
          "media-on-image relative overflow-hidden bg-graphite",
          compact ? "aspect-[3/4] h-full" : "aspect-[3/4]"
        )}
      >
        <Link
          href={`/anime/${anime.slug}`}
          aria-label={`Open details for ${anime.title}`}
          className="absolute inset-0 z-10"
        >
          <span className="sr-only">Open details for {anime.title}</span>
        </Link>
        <SafeImage
          src={cardImage}
          alt=""
          fill
          sizes={compact ? "10rem" : "(max-width: 640px) 76vw, (max-width: 1280px) 33vw, 21rem"}
          className="object-cover transition duration-500 group-hover:scale-110 group-focus-within:scale-110"
          loading="lazy"
        />
        <div className="thumbnail-gradient absolute inset-0" />
        <div className="absolute left-3 top-3 z-20">
          <SourceBadge sourceName={anime.sourceName} compact />
        </div>
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
          <span className="chip-hot">{anime.rating}</span>
          <WatchlistButton animeId={anime.id} animeSlug={anime.slug} label={false} />
        </div>
      </div>

      <div className="relative p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/60 to-transparent opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/anime/${anime.slug}`} className="relative z-10">
              <h3 className="line-clamp-2 text-lg font-black leading-6 text-white transition group-hover:text-cyan group-focus-within:text-cyan">
                {anime.title}
              </h3>
            </Link>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/42">
              {anime.year} / {anime.duration}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {anime.genres.slice(0, compact ? 2 : 3).map((genre) => (
            <span className="chip" key={genre}>
              {genre}
            </span>
          ))}
        </div>

        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
          <div className="min-h-0 overflow-hidden">
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/62">
              {synopsis}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {firstEpisode ? (
                <Link
                  href={`/watch/${anime.slug}/${firstEpisode.number}`}
                  className="button-primary px-4 py-2 text-xs"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  Watch Now
                </Link>
              ) : null}
              <Link
                href={`/anime/${anime.slug}`}
                className="button-secondary px-4 py-2 text-xs"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
