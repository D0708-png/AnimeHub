"use client";

import { EmptyState } from "@/components/EmptyState";
import { WatchPageClient } from "@/components/WatchPageClient";
import { useCatalog } from "@/hooks/useCatalog";
import type { Anime } from "@/types/anime";

interface WatchRouteClientProps {
  baseAnime: Anime[];
  slug: string;
  episodeParam: string;
}

export function WatchRouteClient({
  baseAnime,
  slug,
  episodeParam
}: WatchRouteClientProps) {
  const { catalog, hasHydrated } = useCatalog(baseAnime);
  const anime = catalog.find((item) => item.slug === slug);
  const episodeNumber = Number(episodeParam);
  const episode = anime?.episodes.find((item) => item.number === episodeNumber);

  if (!anime || !episode) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title={hasHydrated ? "Episode not found" : "Loading episode..."}
          description="This episode is not available right now. Try another title or episode."
          actionHref="/anime"
          actionLabel="Explore anime"
        />
      </div>
    );
  }

  const currentIndex = anime.episodes.findIndex((item) => item.number === episode.number);

  return (
    <WatchPageClient
      anime={anime}
      episode={episode}
      previousEpisode={anime.episodes[currentIndex - 1]}
      nextEpisode={anime.episodes[currentIndex + 1]}
      catalog={catalog}
    />
  );
}
