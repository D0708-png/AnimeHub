"use client";

import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { WatchlistItem } from "@/types/storage";
import { showToast } from "@/components/ToastProvider";
import { useLocalStorage } from "./useLocalStorage";

function normalizeWatchlist(items: WatchlistItem[]) {
  return items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.animeId === "string" &&
      typeof item.animeSlug === "string"
  );
}

export function useWatchlist() {
  const [rawWatchlist, setWatchlist, hasHydrated] = useLocalStorage<WatchlistItem[]>(
    STORAGE_KEYS.watchlist,
    []
  );
  const watchlist = normalizeWatchlist(rawWatchlist);

  const isInWatchlist = useCallback(
    (slug: string) => watchlist.some((item) => item.animeSlug === slug),
    [watchlist]
  );

  const addToWatchlist = useCallback(
    (slug: string, animeId = slug) => {
      setWatchlist((current) => {
        const normalized = normalizeWatchlist(current);

        if (normalized.some((item) => item.animeSlug === slug)) {
          return normalized;
        }

        return [
          {
            id: `watchlist-${animeId}`,
            animeId,
            animeSlug: slug,
            addedAt: new Date().toISOString()
          },
          ...normalized
        ];
      });
      showToast({ message: "Added to watchlist", tone: "success" });
    },
    [setWatchlist]
  );

  const removeFromWatchlist = useCallback(
    (slug: string) => {
      setWatchlist((current) =>
        normalizeWatchlist(current).filter((item) => item.animeSlug !== slug)
      );
      showToast({ message: "Removed from watchlist", tone: "info" });
    },
    [setWatchlist]
  );

  const toggleWatchlist = useCallback(
    (slug: string, animeId = slug) => {
      if (watchlist.some((item) => item.animeSlug === slug)) {
        removeFromWatchlist(slug);
      } else {
        addToWatchlist(slug, animeId);
      }
    },
    [addToWatchlist, removeFromWatchlist, watchlist]
  );

  return {
    watchlist,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    hasHydrated
  };
}
