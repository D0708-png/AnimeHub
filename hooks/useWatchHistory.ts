"use client";

import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import type { WatchHistoryItem } from "@/types/storage";
import { useLocalStorage } from "./useLocalStorage";

type WatchHistoryPayload = Omit<WatchHistoryItem, "id" | "watchedAt" | "animeSlug"> & {
  animeSlug?: string;
};

function normalizeHistory(items: WatchHistoryItem[]) {
  return items.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.slug === "string" &&
      typeof item.title === "string" &&
      typeof item.episodeTitle === "string"
  );
}

export function useWatchHistory() {
  const [rawHistory, setHistory, hasHydrated] = useLocalStorage<WatchHistoryItem[]>(
    STORAGE_KEYS.watchHistory,
    []
  );
  const history = normalizeHistory(rawHistory);

  const recordWatch = useCallback(
    (item: WatchHistoryPayload) => {
      setHistory((current) => {
        const slug = item.slug;
        const nextEntry: WatchHistoryItem = {
          ...item,
          slug,
          animeSlug: item.animeSlug ?? slug,
          id: `${item.animeId}-${item.episodeId}`,
          watchedAt: new Date().toISOString()
        };

        const withoutDuplicate = normalizeHistory(current).filter(
          (entry) =>
            entry.slug !== slug ||
            entry.episodeNumber !== item.episodeNumber
        );

        return [nextEntry, ...withoutDuplicate].slice(0, 50);
      });
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const removeHistoryItem = useCallback(
    (id: string) => {
      setHistory((current) => normalizeHistory(current).filter((item) => item.id !== id));
    },
    [setHistory]
  );

  return {
    history,
    recordWatch,
    removeHistoryItem,
    clearHistory,
    hasHydrated
  };
}
