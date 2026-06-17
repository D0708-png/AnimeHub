"use client";

import type { Anime } from "@/types/anime";
import { useCatalog } from "@/hooks/useCatalog";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AnimeGrid } from "./AnimeGrid";
import { EmptyState } from "./EmptyState";

interface WatchlistClientProps {
  anime: Anime[];
}

export function WatchlistClient({ anime }: WatchlistClientProps) {
  const { catalog } = useCatalog(anime);
  const { watchlist, hasHydrated } = useWatchlist();
  const items = catalog.filter((item) =>
    watchlist.some((watchlistItem) => watchlistItem.animeSlug === item.slug)
  );

  if (!hasHydrated) {
    return <div className="glass-card p-8 text-white/62">Loading watchlist...</div>;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your watchlist is empty"
        description="Save titles you want to revisit and build your next watch queue."
        actionHref="/anime"
        actionLabel="Find titles"
      />
    );
  }

  return <AnimeGrid anime={items} />;
}
