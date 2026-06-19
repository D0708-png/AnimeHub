"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { showToast } from "@/components/ToastProvider";
import {
  createEmptyServerCatalogOverrides,
  mergeCatalogWithServerOverrides,
  normalizeServerCatalogOverrides,
  type BulkAnimeAction,
  type ServerCatalogOverrides
} from "@/lib/catalog";
import type { Anime, AnimeEpisode } from "@/types/anime";

function cloneAnime(anime: Anime): Anime {
  return JSON.parse(JSON.stringify(anime)) as Anime;
}

function stripAnimeEpisodes(anime: Anime): Partial<Anime> {
  const animeFields = { ...anime } as Partial<Anime>;
  delete animeFields.episodes;
  return animeFields;
}

async function parseApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => ({}));
  return typeof data.error === "string" ? data.error : fallback;
}

async function fetchOverrides(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, "Unable to load catalog changes."));
  }

  const data = await response.json().catch(() => ({}));
  return normalizeServerCatalogOverrides(data.overrides);
}

export function useAdminCatalog(baseCatalog: Anime[]) {
  const [serverState, setServerState] = useState<ServerCatalogOverrides>(
    createEmptyServerCatalogOverrides()
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const baseIds = useMemo(() => new Set(baseCatalog.map((anime) => anime.id)), [baseCatalog]);
  const catalog = useMemo(
    () => mergeCatalogWithServerOverrides(baseCatalog, serverState),
    [baseCatalog, serverState]
  );

  const reloadCatalog = useCallback(async () => {
    setIsSyncing(true);

    try {
      const overrides = await fetchOverrides("/api/catalog-overrides");
      setServerState(overrides);
    } catch {
      setServerState(createEmptyServerCatalogOverrides());
    } finally {
      setHasHydrated(true);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    void reloadCatalog();
  }, [reloadCatalog]);

  const applyMutation = useCallback(
    async (
      request: Promise<ServerCatalogOverrides>,
      toastMessage: string,
      tone: "success" | "info" = "success"
    ) => {
      try {
        const overrides = await request;
        try {
          const refreshedOverrides = await fetchOverrides("/api/admin/catalog-overrides");
          setServerState(refreshedOverrides);
        } catch {
          setServerState(overrides);
        }
        showToast({ message: toastMessage, tone });
        return true;
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : "Unable to update catalog",
          tone: "danger"
        });
        return false;
      }
    },
    []
  );

  const upsertAnime = useCallback(
    async (anime: Anime, toastMessage = "Catalog item saved") => {
      const isBaseAnime = baseIds.has(anime.id);
      const isCreatedAnime = serverState.createdAnime.some((item) => item.id === anime.id);
      const request =
        isBaseAnime || isCreatedAnime
          ? fetchOverrides(`/api/admin/anime/${encodeURIComponent(anime.id)}`, {
              method: "PATCH",
              body: JSON.stringify({ patch: stripAnimeEpisodes(anime) })
            })
          : fetchOverrides("/api/admin/anime", {
              method: "POST",
              body: JSON.stringify({ anime: cloneAnime(anime) })
            });

      return applyMutation(request, toastMessage);
    },
    [applyMutation, baseIds, serverState.createdAnime]
  );

  const updateAnime = useCallback(
    async (animeId: string, patch: Partial<Anime>, toastMessage?: string) => {
      return applyMutation(
        fetchOverrides(`/api/admin/anime/${encodeURIComponent(animeId)}`, {
          method: "PATCH",
          body: JSON.stringify({ patch })
        }),
        toastMessage ?? "Anime updated"
      );
    },
    [applyMutation]
  );

  const deleteAnime = useCallback(
    async (animeId: string) => {
      return applyMutation(
        fetchOverrides(`/api/admin/anime/${encodeURIComponent(animeId)}`, {
          method: "DELETE"
        }),
        "Anime deleted",
        "info"
      );
    },
    [applyMutation]
  );

  const bulkAnimeAction = useCallback(
    async (action: BulkAnimeAction, animeIds: string[], toastMessage = "Bulk action applied") => {
      return applyMutation(
        fetchOverrides("/api/admin/anime/bulk", {
          method: "POST",
          body: JSON.stringify({ action, animeIds })
        }),
        toastMessage,
        action === "delete" ? "info" : "success"
      );
    },
    [applyMutation]
  );

  const restoreAnime = useCallback(
    async (animeId: string) => {
      return updateAnime(animeId, {}, "Anime restored");
    },
    [updateAnime]
  );

  const updateEpisode = useCallback(
    async (animeId: string, episodeId: string, patch: Partial<AnimeEpisode>) => {
      return applyMutation(
        fetchOverrides(
          `/api/admin/anime/${encodeURIComponent(animeId)}/episodes/${encodeURIComponent(
            episodeId
          )}`,
          {
            method: "PATCH",
            body: JSON.stringify({ patch })
          }
        ),
        "Episode updated"
      );
    },
    [applyMutation]
  );

  const addEpisode = useCallback(
    async (animeId: string, episode: AnimeEpisode) => {
      return applyMutation(
        fetchOverrides(`/api/admin/anime/${encodeURIComponent(animeId)}/episodes`, {
          method: "POST",
          body: JSON.stringify({ episode })
        }),
        "Episode added"
      );
    },
    [applyMutation]
  );

  const deleteEpisode = useCallback(
    async (animeId: string, episodeId: string) => {
      return applyMutation(
        fetchOverrides(
          `/api/admin/anime/${encodeURIComponent(animeId)}/episodes/${encodeURIComponent(
            episodeId
          )}`,
          {
            method: "DELETE"
          }
        ),
        "Episode deleted",
        "info"
      );
    },
    [applyMutation]
  );

  const replaceCatalog = useCallback(
    async (anime: Anime[]) => {
      return applyMutation(
        fetchOverrides("/api/admin/catalog-overrides", {
          method: "PUT",
          body: JSON.stringify({ catalog: anime.map(cloneAnime) })
        }),
        "Catalog JSON imported"
      );
    },
    [applyMutation]
  );

  const resetAdminCatalog = useCallback(async () => {
    return applyMutation(
      fetchOverrides("/api/admin/catalog-reset", {
        method: "POST"
      }),
      "Site catalog changes reset",
      "info"
    );
  }, [applyMutation]);

  const syncCatalog = useCallback(async () => {
    await reloadCatalog();
    showToast({ message: "Catalog synced", tone: "info" });
  }, [reloadCatalog]);

  const exportCatalog = useCallback(
    () => JSON.stringify(catalog, null, 2),
    [catalog]
  );

  return {
    state: serverState,
    catalog,
    hasHydrated,
    isSyncing,
    upsertAnime,
    updateAnime,
    deleteAnime,
    bulkAnimeAction,
    restoreAnime,
    updateEpisode,
    addEpisode,
    deleteEpisode,
    replaceCatalog,
    resetAdminCatalog,
    syncCatalog,
    exportCatalog
  };
}
