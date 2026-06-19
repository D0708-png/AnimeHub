import { animeCatalog } from "@/data/anime";
import {
  createEmptyServerCatalogOverrides,
  mergeCatalogWithServerOverrides,
  normalizeServerCatalogOverrides,
  type ServerCatalogOverrides
} from "@/lib/catalog";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { readJsonBlob, writeJsonBlob } from "./blob-store";

const ADMIN_CATALOG_STORE = "animehub-admin-catalog";
const ADMIN_CATALOG_KEY = "overrides";
const ADMIN_USERNAME = "admin";

function nowIso() {
  return new Date().toISOString();
}

function uniqueIds(ids: string[], nextId: string) {
  return Array.from(new Set([...ids, nextId]));
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
    createEmptyServerCatalogOverrides()
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
  const state = await readServerCatalogOverrides();
  const catalog = getServerMergedCatalog(state);

  if (catalog.some((item) => item.id === anime.id)) {
    throw new Error("An anime with this ID already exists.");
  }

  const nextState = touchState({
    ...state,
    deletedAnimeIds: state.deletedAnimeIds.filter((id) => id !== anime.id),
    createdAnime: [...state.createdAnime, anime]
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function patchServerAnime(animeId: string, patch: Partial<Anime>) {
  const state = await readServerCatalogOverrides();
  const timestamp = nowIso();
  const animePatch = { ...patch };
  delete animePatch.episodes;
  const createdAnime = state.createdAnime.map((anime) =>
    anime.id === animeId ? { ...anime, ...animePatch } : anime
  );
  const isCreatedAnime = createdAnime.some((anime) => anime.id === animeId);
  const nextState = touchState({
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
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function deleteServerAnime(animeId: string) {
  const state = await readServerCatalogOverrides();
  const animeOverrides = { ...state.animeOverrides };
  const episodeOverrides = { ...state.episodeOverrides };
  const deletedEpisodeIds = { ...state.deletedEpisodeIds };
  const createdEpisodes = { ...state.createdEpisodes };

  delete animeOverrides[animeId];
  delete episodeOverrides[animeId];
  delete deletedEpisodeIds[animeId];
  delete createdEpisodes[animeId];

  const nextState = touchState({
    ...state,
    animeOverrides,
    episodeOverrides,
    deletedEpisodeIds,
    createdEpisodes,
    createdAnime: state.createdAnime.filter((anime) => anime.id !== animeId),
    deletedAnimeIds: uniqueIds(state.deletedAnimeIds, animeId)
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function createServerEpisode(animeId: string, episode: AnimeEpisode) {
  const state = await readServerCatalogOverrides();
  const catalog = getServerMergedCatalog(state);
  const anime = catalog.find((item) => item.id === animeId);

  if (!anime) {
    throw new Error("Anime not found.");
  }

  if (anime.episodes.some((item) => item.id === episode.id)) {
    throw new Error("An episode with this ID already exists.");
  }

  const nextState = touchState({
    ...state,
    deletedEpisodeIds: {
      ...state.deletedEpisodeIds,
      [animeId]: (state.deletedEpisodeIds[animeId] ?? []).filter((id) => id !== episode.id)
    },
    createdEpisodes: {
      ...state.createdEpisodes,
      [animeId]: [...(state.createdEpisodes[animeId] ?? []), episode]
    }
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function patchServerEpisode(
  animeId: string,
  episodeId: string,
  patch: Partial<AnimeEpisode>
) {
  const state = await readServerCatalogOverrides();
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
  const nextState = touchState({
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
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}

export async function deleteServerEpisode(animeId: string, episodeId: string) {
  const state = await readServerCatalogOverrides();
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

  const nextState = touchState({
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
  });

  await writeServerCatalogOverrides(nextState);
  return nextState;
}
