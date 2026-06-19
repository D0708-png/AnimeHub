"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import gsap from "gsap";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { prefersReducedMotion } from "@/lib/gsap";
import { buildYouTubeWatchUrl } from "@/lib/youtube";
import { AnimeCarousel } from "./AnimeCarousel";
import { EpisodeList } from "./EpisodeList";
import { SectionHeader } from "./SectionHeader";
import { SourceBadge } from "./SourceBadge";
import { WatchSession } from "./WatchSession";
import { YouTubePlayer } from "./YouTubePlayer";

const LocalComments = dynamic(
  () => import("./LocalComments").then((module) => module.LocalComments),
  {
    ssr: false,
    loading: () => <div className="glass-card p-6 text-sm text-white/62">Loading comments...</div>
  }
);

interface WatchPageClientProps {
  anime: Anime;
  episode: AnimeEpisode;
  previousEpisode?: AnimeEpisode;
  nextEpisode?: AnimeEpisode;
  catalog: Anime[];
}

export function WatchPageClient({
  anime,
  episode,
  previousEpisode,
  nextEpisode,
  catalog
}: WatchPageClientProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const watchUrl =
    episode.officialVideoUrl ??
    episode.directVideoUrl ??
    episode.googleDriveUrl ??
    episode.videoUrl ??
    buildYouTubeWatchUrl(episode.youtubeVideoId, episode.youtubePlaylistId);
  const openSourceLabel = "Open Source";
  const related = useMemo(
    () =>
      catalog
        .filter((item) => item.id !== anime.id)
        .filter((item) => item.genres.some((genre) => anime.genres.includes(genre)))
        .slice(0, 8),
    [anime.genres, anime.id, catalog]
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".watch-reveal",
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.42, ease: "power3.out", stagger: 0.035 }
      );
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div ref={rootRef} className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/anime/${anime.slug}`}
        className="watch-reveal inline-flex items-center gap-2 text-sm font-black text-white/62 transition hover:text-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {anime.title}
      </Link>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="w-full">
            <YouTubePlayer
              title={`${anime.title} episode ${episode.number}: ${episode.title}`}
              youtubeVideoId={episode.youtubeVideoId}
              youtubePlaylistId={episode.youtubePlaylistId}
              officialVideoUrl={episode.officialVideoUrl}
              videoUrl={episode.videoUrl}
              directVideoUrl={episode.directVideoUrl}
              googleDriveUrl={episode.googleDriveUrl}
              sourceType={episode.sourceType}
              embeddable={episode.embeddable}
            />
          </div>

          <div className="watch-reveal glass-card p-4 text-sm leading-6 text-token-muted">
            Watch through the source player. Availability may vary by source and region.
          </div>

          <WatchSession anime={anime} episode={episode} />

          <div className="watch-reveal glass-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SourceBadge sourceName={anime.sourceName} />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-ember">
                  Episode {episode.number}
                </p>
                <h1 className="mt-2 text-3xl font-black text-white">
                  {anime.title}: {episode.title}
                </h1>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {watchUrl ? (
                  <a href={watchUrl} target="_blank" rel="noreferrer" className="button-primary">
                    {openSourceLabel}
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="button-secondary opacity-70">{openSourceLabel}</span>
                )}
                <a
                  href={anime.sourceChannelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary"
                >
                  Source Page
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
              {previousEpisode ? (
                <Link
                  href={`/watch/${anime.slug}/${previousEpisode.number}`}
                  className="button-secondary px-4 py-2"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Previous Episode
                </Link>
              ) : null}
              {nextEpisode ? (
                <Link
                  href={`/watch/${anime.slug}/${nextEpisode.number}`}
                  className="button-primary px-4 py-2"
                >
                  Next Episode
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="watch-reveal lg:hidden">
            <SectionHeader title="Episodes" />
            <EpisodeList anime={anime} activeEpisodeNumber={episode.number} showSynopsis={false} />
          </div>
        </div>

        <aside className="watch-reveal hidden lg:block">
          <div className="glass-card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
            <h2 className="text-lg font-black text-white">Episodes</h2>
            <div className="mt-4">
              <EpisodeList anime={anime} activeEpisodeNumber={episode.number} showSynopsis={false} />
            </div>
          </div>
        </aside>
      </section>

      <section className="watch-reveal">
        <SectionHeader
          eyebrow="Related"
          title="Recommended next"
          description="More titles with a similar feel."
        />
        <AnimeCarousel anime={related} emptyTitle="No related anime yet" />
      </section>

      <div className="watch-reveal">
        <LocalComments animeSlug={anime.slug} episodeNumber={episode.number} />
      </div>
    </div>
  );
}
