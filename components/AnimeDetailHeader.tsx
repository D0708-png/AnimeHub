"use client";

import Link from "next/link";
import { ExternalLink, PlayCircle } from "lucide-react";
import { MouseEvent, useEffect, useRef } from "react";
import gsap from "gsap";
import type { Anime } from "@/types/anime";
import { getPublicAnimeSynopsis } from "@/lib/catalog";
import { prefersReducedMotion } from "@/lib/gsap";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { SafeImage } from "./SafeImage";
import { SourceBadge } from "./SourceBadge";
import { WatchlistButton } from "./WatchlistButton";

interface AnimeDetailHeaderProps {
  anime: Anime;
}

function buildOfficialSearchUrl(anime: Anime) {
  const channelUrl = anime.sourceChannelUrl.replace(/\/$/, "");
  return `${channelUrl}/search?query=${encodeURIComponent(anime.title)}`;
}

export function AnimeDetailHeader({ anime }: AnimeDetailHeaderProps) {
  const rootRef = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const { history, hasHydrated } = useWatchHistory();
  const firstEpisode = anime.episodes[0];
  const latestForAnime = history.find((item) => item.slug === anime.slug);
  const heroImage = anime.heroImage || anime.bannerImage || anime.posterImage;
  const posterImage = anime.cardThumbnail || anime.posterImage || anime.bannerImage;
  const synopsis = getPublicAnimeSynopsis(anime);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".detail-reveal",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.46, ease: "power3.out", stagger: 0.04 }
      );
    }, root);

    return () => context.revert();
  }, []);

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    const root = rootRef.current;
    const poster = posterRef.current;

    if (!root || !poster || prefersReducedMotion()) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(poster, {
      x: x * 8,
      y: y * 8,
      rotateY: x * -3,
      rotateX: y * 3,
      duration: 0.28,
      ease: "power3.out"
    });
  }

  function resetPoster() {
    if (posterRef.current) {
      gsap.to(posterRef.current, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.28,
        ease: "power3.out"
      });
    }
  }

  return (
    <section
      ref={rootRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPoster}
      className="relative overflow-hidden rounded-[2rem] border border-token bg-token-card shadow-soft"
    >
      <div className="absolute inset-0 opacity-55" aria-hidden="true">
        <SafeImage
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="hero-overlay absolute inset-0" />
      <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[18rem_1fr] lg:p-10">
        <div
          ref={posterRef}
          className="media-on-image detail-reveal relative aspect-[3/4] overflow-hidden rounded-2xl border border-token bg-token-muted shadow-soft"
          style={{ transformStyle: "preserve-3d" }}
          aria-label={`${anime.title} poster`}
        >
          <SafeImage
            src={posterImage}
            alt=""
            fill
            sizes="18rem"
            className="object-cover"
          />
          <div className="thumbnail-gradient absolute inset-0 rounded-2xl" />
        </div>
        <div className="detail-reveal flex min-w-0 flex-col justify-center">
          <SourceBadge sourceName={anime.sourceName} />
          <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">{anime.title}</h1>
          <p className="mt-2 text-lg font-bold text-white/54">{anime.originalTitle}</p>
          <p className="mt-5 max-w-4xl text-base leading-7 text-white/72">{synopsis}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {anime.genres.map((genre) => (
              <span className="chip" key={genre}>
                {genre}
              </span>
            ))}
            <span className="chip">{anime.year}</span>
            <span className="chip">{anime.studio}</span>
            <span className="chip">{anime.status}</span>
            <span className="chip">{anime.rating}</span>
            <span className="chip">{anime.duration}</span>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            {firstEpisode ? (
              <Link href={`/watch/${anime.slug}/${firstEpisode.number}`} className="button-primary">
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                Start Watching
              </Link>
            ) : null}
            {hasHydrated && latestForAnime ? (
              <Link
                href={`/watch/${anime.slug}/${latestForAnime.episodeNumber}`}
                className="button-secondary"
              >
                Continue Watching
              </Link>
            ) : null}
            <WatchlistButton animeId={anime.id} animeSlug={anime.slug} />
            <a
              href={buildOfficialSearchUrl(anime)}
              target="_blank"
              rel="noreferrer"
              className="button-secondary"
            >
              Open Source Page
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
