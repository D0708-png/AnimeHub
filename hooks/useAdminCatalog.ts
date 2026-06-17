"use client";

import { useCallback, useMemo } from "react";
import { showToast } from "@/components/ToastProvider";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  type AdminCatalogOverrides,
  createEmptyAdminCatalog,
  mergeCatalogWithOverrides,
  normalizeAdminCatalog
} from "@/lib/catalog";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { useLocalStorage } from "./useLocalStorage";

function cloneAnime(anime: Anime): Anime {
  return JSON.parse(JSON.stringify(anime)) as Anime;
}

function touchState(state: AdminCatalogOverrides): AdminCatalogOverrides {
  return {
    ...state,
    updatedAt: new Date().toISOString()
  };
}

function uniqueDeletedIds(ids: string[], nextId: string) {
  return Array.from(new Set([...ids, nextId]));
}

export function useAdminCatalog(baseCatalog: Anime[]) {
  const [rawState, setRawState, hasHydrated] = useLocalStorage<AdminCatalogOverrides>(
    STORAGE_KEYS.adminCatalog,
    createEmptyAdminCatalog()
  );
  const state = useMemo(() => normalizeAdminCatalog(rawState), [rawState]);
  const catalog = useMemo(
    () => mergeCatalogWithOverrides(baseCatalog, state),
    [baseCatalog, state]
  );

  const upsertAnime = useCallback(
    (anime: Anime, toastMessage = "Catalog item saved locally") => {
      setRawState((current) => {
        const normalized = normalizeAdminCatalog(current);
        const next = touchState({
          ...normalized,
          deletedAnimeIds: normalized.deletedAnimeIds.filter((id) => id !== anime.id),
          itemsById: {
            ...normalized.itemsById,
            [anime.id]: cloneAnime(anime)
          }
        });

        return next;
      });
      showToast({ message: toastMessage, tone: "success" });
    },
    [setRawState]
  );

  const updateAnime = useCallback(
    (animeId: string, patch: Partial<Anime>, toastMessage?: string) => {
      const currentAnime = catalog.find((anime) => anime.id === animeId);

      if (!currentAnime) {
        return;
      }

      upsertAnime(
        {
          ...currentAnime,
          ...patch
        },
        toastMessage ?? "Anime updated locally"
      );
    },
    [catalog, upsertAnime]
  );

  const deleteAnime = useCallback(
    (animeId: string) => {
      setRawState((current) => {
        const normalized = normalizeAdminCatalog(current);
        const itemsById = { ...normalized.itemsById };
        delete itemsById[animeId];

        return touchState({
          ...normalized,
          itemsById,
          deletedAnimeIds: uniqueDeletedIds(normalized.deletedAnimeIds, animeId)
        });
      });
      showToast({ message: "Anime deleted locally", tone: "info" });
    },
    [setRawState]
  );

  const restoreAnime = useCallback(
    (animeId: string) => {
      setRawState((current) => {
        const normalized = normalizeAdminCatalog(current);

        return touchState({
          ...normalized,
          deletedAnimeIds: normalized.deletedAnimeIds.filter((id) => id !== animeId)
        });
      });
      showToast({ message: "Anime restored locally", tone: "success" });
    },
    [setRawState]
  );

  const updateEpisode = useCallback(
    (animeId: string, episodeId: string, patch: Partial<AnimeEpisode>) => {
      const currentAnime = catalog.find((anime) => anime.id === animeId);

      if (!currentAnime) {
        return;
      }

      upsertAnime(
        {
          ...currentAnime,
          episodes: currentAnime.episodes.map((episode) =>
            episode.id === episodeId ? { ...episode, ...patch } : episode
          )
        },
        "Episode updated locally"
      );
    },
    [catalog, upsertAnime]
  );

  const addEpisode = useCallback(
    (animeId: string, episode: AnimeEpisode) => {
      const currentAnime = catalog.find((anime) => anime.id === animeId);

      if (!currentAnime) {
        return;
      }

      upsertAnime(
        {
          ...currentAnime,
          episodes: [...currentAnime.episodes, episode].sort((a, b) => a.number - b.number)
        },
        "Episode added locally"
      );
    },
    [catalog, upsertAnime]
  );

  const deleteEpisode = useCallback(
    (animeId: string, episodeId: string) => {
      const currentAnime = catalog.find((anime) => anime.id === animeId);

      if (!currentAnime) {
        return;
      }

      upsertAnime(
        {
          ...currentAnime,
          episodes: currentAnime.episodes.filter((episode) => episode.id !== episodeId)
        },
        "Episode deleted locally"
      );
    },
    [catalog, upsertAnime]
  );

  const replaceCatalog = useCallback(
    (anime: Anime[]) => {
      const itemsById = Object.fromEntries(anime.map((item) => [item.id, cloneAnime(item)]));

      setRawState(
        touchState({
          version: 1,
          itemsById,
          deletedAnimeIds: []
        })
      );
      showToast({ message: "Catalog JSON imported locally", tone: "success" });
    },
    [setRawState]
  );

  const resetAdminCatalog = useCallback(() => {
    setRawState(createEmptyAdminCatalog());
    showToast({ message: "Local admin changes reset", tone: "info" });
  }, [setRawState]);

  const exportCatalog = useCallback(
    () => JSON.stringify(catalog, null, 2),
    [catalog]
  );

  return {
    state,
    catalog,
    hasHydrated,
    upsertAnime,
    updateAnime,
    deleteAnime,
    restoreAnime,
    updateEpisode,
    addEpisode,
    deleteEpisode,
    replaceCatalog,
    resetAdminCatalog,
    exportCatalog
  };
}
