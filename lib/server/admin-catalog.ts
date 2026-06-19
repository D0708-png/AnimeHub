import { animeCatalog } from "@/data/anime";
import {
  createEmptyServerCatalogOverrides,
  mergeCatalogWithServerOverrides,
  normalizeServerCatalogOverrides,
  type BulkAnimeAction,
  type ServerCatalogOverrides
} from "@/lib/catalog";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { readJsonBlob, readJsonBlobWithMetadata, writeJsonBlob } from "./blob-store";

const ADMIN_CATALOG_STORE = "animehub-admin-catalog";
const ADMIN_CATALOG_KEY = "overrides";
const ADMIN_USERNAME = "admin";

function nowIso() {
  return new Date().toISOString();
}

function uniqueIds(ids: string[], nextId: string) {
  return Array.from(new Set([...ids, nextId]));
}

function uniqueMany(ids: string[], nextIds: string[]) {
  return Array.from(new Set([...ids, ...nextIds]));
}

function withoutMetaAnime(anime: Anime) {
  const animeFields = { ...anime } as Partial<Anime>;
  delete animeFields.episodes;
  return animeFields;
}

function touchState(state: ServerCatalogOverrides): ServerCatalogOverrides {
  return {
    ...state,
    updatedAt: nowIso()
  };
}

export async function readServerCatalogOverrides() {
  const state = await readJsonBlob<ServerCatalogOverrides>(
    ADMIN_CATALOG_STORE,
    ADMIN_CATALOG_KEY,
    createEmptyServerCatalogOverrides(),
    { consistency: "strong" }
  );

  return normalizeServerCatalogOverrides(state);
}

export async function writeServerCatalogOverrides(state: ServerCatalogOverrides) {
  await writeJsonBlob(
    ADMIN_CATALOG_STORE,
    ADMIN_CATALOG_KEY,
    normalizeServerCatalogOverrides(state)
  );
}

export const normalizeCatalogOverrides = normalizeServerCatalogOverrides;
export const getCatalogOverrides = readServerCatalogOverrides;
export const saveCatalogOverrides = writeServerCatalogOverrides;

async function updateServerCatalogOverrides(
  mutate: (state: ServerCatalogOverrides) => ServerCatalogOverrides
) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { value, etag } = await readJsonBlobWithMetadata<ServerCatalogOverrides>(
      ADMIN_CATALOG_STORE,
      ADMIN_CATALOG_KEY,
      createEmptyServerCatalogOverrides(),
      { consistency: "strong" }
    );
    const currentState = normalizeServerCatalogOverrides(value);
    const nextState = touchState(normalizeServerCatalogOverrides(mutate(currentState)));
    const result = await writeJsonBlob(
      ADMIN_CATALOG_STORE,
      ADMIN_CATALOG_KEY,
      nextState,
      etag ? { onlyIfMatch: etag } : { onlyIfNew: true }
    );

    if (result.modified) {
      return nextState;
    }
  }

  throw new Error("Catalog changed while saving. Please try again.");
}

export function getServerMergedCatalog(state: ServerCatalogOverrides) {
  return mergeCatalogWithServerOverrides(animeCatalog, state);
}

export function convertCatalogToServerOverrides(catalog: Anime[]) {
  const baseById = new Map(animeCatalog.map((anime) => [anime.id, anime]));
  const baseIds = new Set(animeCatalog.map((anime) => anime.id));
  const catalogIds = new Set(catalog.map((anime) => anime.id));
  const timestamp = nowIso();
  const episodeOverrides: ServerCatalogOverrides["episodeOverrides"] = {};
  const deletedEpisodeIds: ServerCatalogOverrides["deletedEpisodeIds"] = {};
  const createdEpisodes: ServerCatalogOverrides["createdEpisodes"] = {};

  for (const anime of catalog) {
    const baseAnime = baseById.get(anime.id);

    if (!baseAnime) {
      continue;
    }

    const baseEpisodeIds = new Set(baseAnime.episodes.map((episode) => episode.id));
    const importedEpisodeIds = new Set(anime.episodes.map((episode) => episode.id));
    const baseEpisodeOverrides = Object.fromEntries(
      anime.episodes
        .filter((episode) => baseEpisodeIds.has(episode.id))
        .map((episode) => [
          episode.id,
          {
            ...episode,
            updatedAt: timestamp,
            updatedBy: ADMIN_USERNAME
          }
        ])
    );
    const baseDeletedEpisodes = baseAnime.episodes
      .map((episode) => episode.id)
      .filter((episodeId) => !importedEpisodeIds.has(episodeId));
    const importedCreatedEpisodes = anime.episodes.filter(
      (episode) => !baseEpisodeIds.has(episode.id)
    );

    if (Object.keys(baseEpisodeOverrides).length > 0) {
      episodeOverrides[anime.id] = baseEpisodeOverrides;
    }

    if (baseDeletedEpisodes.length > 0) {
      deletedEpisodeIds[anime.id] = baseDeletedEpisodes;
    }

    if (importedCreatedEpisodes.length > 0) {
      createdEpisodes[anime.id] = importedCreatedEpisodes;
    }
  }

  return touchState({
    version: 1,
    updatedAt: timestamp,
    animeOverrides: Object.fromEntries(
      catalog
        .filter((anime) => baseIds.has(anime.id))
        .map((anime) => [
          anime.id,
          {
            ...withoutMetaAnime(anime),
            updatedAt: timestamp,
            updatedBy: ADMIN_USERNAME
          }
        ])
    ),
    deletedAnimeIds: animeCatalog
      .map((anime) => anime.id)
      .filter((animeId) => !catalogIds.has(animeId)),
    createdAnime: catalog.filter((anime) => !baseIds.has(anime.id)),
    episodeOverrides,
    deletedEpisodeIds,
    createdEpisodes
  });
}

export async function replaceServerCatalogState(state: ServerCatalogOverrides) {
  const nextState = touchState(normalizeServerCatalogOverrides(state));
  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function resetServerCatalogOverrides() {
  const nextState = touchState(createEmptyServerCatalogOverrides());
  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function createServerAnime(anime: Anime) {
  return updateServerCatalogOverrides((state) => {
    const catalog = getServerMergedCatalog(state);

    if (catalog.some((item) => item.id === anime.id)) {
      throw new Error("An anime with this ID already exists.");
    }

    return {
      ...state,
      deletedAnimeIds: state.deletedAnimeIds.filter((id) => id !== anime.id),
      createdAnime: [...state.createdAnime, anime]
    };
  });
}

export async function patchServerAnime(animeId: string, patch: Partial<Anime>) {
  return updateServerCatalogOverrides((state) => {
    const timestamp = nowIso();
    const animePatch = { ...patch };
    delete animePatch.episodes;
    const createdAnime = state.createdAnime.map((anime) =>
      anime.id === animeId ? { ...anime, ...animePatch } : anime
    );
    const isCreatedAnime = createdAnime.some((anime) => anime.id === animeId);

    return {
      ...state,
      deletedAnimeIds: state.deletedAnimeIds.filter((id) => id !== animeId),
      createdAnime,
      animeOverrides: isCreatedAnime
        ? state.animeOverrides
        : {
            ...state.animeOverrides,
            [animeId]: {
              ...(state.animeOverrides[animeId] ?? {}),
              ...animePatch,
              id: animeId,
              updatedAt: timestamp,
              updatedBy: ADMIN_USERNAME
            }
          }
    };
  });
}

export async function deleteServerAnime(animeId: string) {
  return updateServerCatalogOverrides((state) => {
    const isCreatedAnime = state.createdAnime.some((anime) => anime.id === animeId);
    const animeOverrides = { ...state.animeOverrides };
    const episodeOverrides = { ...state.episodeOverrides };
    const deletedEpisodeIds = { ...state.deletedEpisodeIds };
    const createdEpisodes = { ...state.createdEpisodes };

    if (isCreatedAnime) {
      delete animeOverrides[animeId];
      delete episodeOverrides[animeId];
      delete deletedEpisodeIds[animeId];
      delete createdEpisodes[animeId];
    }

    return {
      ...state,
      animeOverrides,
      episodeOverrides,
      deletedEpisodeIds,
      createdEpisodes,
      createdAnime: state.createdAnime.filter((anime) => anime.id !== animeId),
      deletedAnimeIds: uniqueIds(state.deletedAnimeIds, animeId)
    };
  });
}

function getBulkAnimePatch(action: BulkAnimeAction): Partial<Anime> {
  switch (action) {
    case "hide":
      return { isHidden: true };
    case "unhide":
      return { isHidden: false };
    case "markFeatured":
      return { isFeatured: true };
    case "removeFeatured":
      return { isFeatured: false };
    case "markTrending":
      return { isTrending: true };
    case "removeTrending":
      return { isTrending: false };
    default:
      return {};
  }
}

export async function bulkUpdateServerAnime(action: BulkAnimeAction, animeIds: string[]) {
  const ids = Array.from(
    new Set(animeIds.map((animeId) => String(animeId).trim()).filter(Boolean))
  );

  if (ids.length === 0) {
    throw new Error("Select at least one anime.");
  }

  return updateServerCatalogOverrides((state) => {
    const timestamp = nowIso();
    const idSet = new Set(ids);

    if (action === "delete") {
      const createdIds = new Set(
        state.createdAnime.filter((anime) => idSet.has(anime.id)).map((anime) => anime.id)
      );
      const animeOverrides = { ...state.animeOverrides };
      const episodeOverrides = { ...state.episodeOverrides };
      const deletedEpisodeIds = { ...state.deletedEpisodeIds };
      const createdEpisodes = { ...state.createdEpisodes };

      for (const animeId of createdIds) {
        delete animeOverrides[animeId];
        delete episodeOverrides[animeId];
        delete deletedEpisodeIds[animeId];
        delete createdEpisodes[animeId];
      }

      return {
        ...state,
        animeOverrides,
        episodeOverrides,
        deletedEpisodeIds,
        createdEpisodes,
        createdAnime: state.createdAnime.filter((anime) => !idSet.has(anime.id)),
        deletedAnimeIds: uniqueMany(state.deletedAnimeIds, ids)
      };
    }

    const patch = getBulkAnimePatch(action);
    const createdIds = new Set(
      state.createdAnime.filter((anime) => idSet.has(anime.id)).map((anime) => anime.id)
    );

    return {
      ...state,
      deletedAnimeIds: state.deletedAnimeIds.filter((animeId) => !idSet.has(animeId)),
      createdAnime: state.createdAnime.map((anime) =>
        idSet.has(anime.id) ? { ...anime, ...patch } : anime
      ),
      animeOverrides: ids.reduce<ServerCatalogOverrides["animeOverrides"]>(
        (overrides, animeId) => {
          if (createdIds.has(animeId)) {
            return overrides;
          }

          return {
            ...overrides,
            [animeId]: {
              ...(overrides[animeId] ?? {}),
              ...patch,
              id: animeId,
              updatedAt: timestamp,
              updatedBy: ADMIN_USERNAME
            }
          };
        },
        { ...state.animeOverrides }
      )
    };
  });
}

export async function createServerEpisode(animeId: string, episode: AnimeEpisode) {
  return updateServerCatalogOverrides((state) => {
    const catalog = getServerMergedCatalog(state);
    const anime = catalog.find((item) => item.id === animeId);

    if (!anime) {
      throw new Error("Anime not found.");
    }

    if (anime.episodes.some((item) => item.id === episode.id)) {
      throw new Error("An episode with this ID already exists.");
    }

    return {
      ...state,
      deletedEpisodeIds: {
        ...state.deletedEpisodeIds,
        [animeId]: (state.deletedEpisodeIds[animeId] ?? []).filter((id) => id !== episode.id)
      },
      createdEpisodes: {
        ...state.createdEpisodes,
        [animeId]: [...(state.createdEpisodes[animeId] ?? []), episode]
      }
    };
  });
}

export async function patchServerEpisode(
  animeId: string,
  episodeId: string,
  patch: Partial<AnimeEpisode>
) {
  return updateServerCatalogOverrides((state) => {
    const timestamp = nowIso();
    const createdEpisodes = state.createdEpisodes[animeId] ?? [];
    const createdEpisodeExists = createdEpisodes.some((episode) => episode.id === episodeId);
    const nextCreatedEpisodes = createdEpisodeExists
      ? createdEpisodes.map((episode) =>
          episode.id === episodeId ? { ...episode, ...patch } : episode
        )
      : createdEpisodes;
    const createdAnime = state.createdAnime.map((anime) =>
      anime.id === animeId
        ? {
            ...anime,
            episodes: anime.episodes.map((episode) =>
              episode.id === episodeId ? { ...episode, ...patch } : episode
            )
          }
        : anime
    );
    const createdAnimeEpisodeExists = createdAnime.some(
      (anime) => anime.id === animeId && anime.episodes.some((episode) => episode.id === episodeId)
    );
    const shouldStoreOverride = !createdEpisodeExists && !createdAnimeEpisodeExists;

    return {
      ...state,
      createdAnime,
      createdEpisodes: {
        ...state.createdEpisodes,
        [animeId]: nextCreatedEpisodes
      },
      episodeOverrides: shouldStoreOverride
        ? {
            ...state.episodeOverrides,
            [animeId]: {
              ...(state.episodeOverrides[animeId] ?? {}),
              [episodeId]: {
                ...(state.episodeOverrides[animeId]?.[episodeId] ?? {}),
                ...patch,
                id: episodeId,
                updatedAt: timestamp,
                updatedBy: ADMIN_USERNAME
              }
            }
          }
        : state.episodeOverrides
    };
  });
}

export async function deleteServerEpisode(animeId: string, episodeId: string) {
  return updateServerCatalogOverrides((state) => {
    const animeEpisodes = state.episodeOverrides[animeId]
      ? { ...state.episodeOverrides[animeId] }
      : {};
    const episodeOverrides = { ...state.episodeOverrides };

    delete animeEpisodes[episodeId];

    if (Object.keys(animeEpisodes).length > 0) {
      episodeOverrides[animeId] = animeEpisodes;
    } else {
      delete episodeOverrides[animeId];
    }

    return {
      ...state,
      createdAnime: state.createdAnime.map((anime) =>
        anime.id === animeId
          ? { ...anime, episodes: anime.episodes.filter((episode) => episode.id !== episodeId) }
          : anime
      ),
      createdEpisodes: {
        ...state.createdEpisodes,
        [animeId]: (state.createdEpisodes[animeId] ?? []).filter(
          (episode) => episode.id !== episodeId
        )
      },
      episodeOverrides,
      deletedEpisodeIds: {
        ...state.deletedEpisodeIds,
        [animeId]: uniqueIds(state.deletedEpisodeIds[animeId] ?? [], episodeId)
      }
    };
  });
}

export async function restoreServerAnime(animeId: string) {
  return updateServerCatalogOverrides((state) => ({
    ...state,
    deletedAnimeIds: state.deletedAnimeIds.filter((id) => id !== animeId)
  }));
}

export const patchAnimeOverride = patchServerAnime;
export const deleteAnimeOverride = deleteServerAnime;
export const restoreAnimeOverride = restoreServerAnime;
export const patchEpisodeOverride = patchServerEpisode;
export const deleteEpisodeOverride = deleteServerEpisode;
