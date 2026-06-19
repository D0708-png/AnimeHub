import type { Anime, AnimeEpisode, KnownAnimeStatus, VideoSourceType } from "@/types/anime";

const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

export const VALID_ANIME_STATUSES = [
  "Ongoing",
  "Completed",
  "Coming Soon"
] as const satisfies readonly KnownAnimeStatus[];

export interface AdminCatalogOverrides {
  version: 1;
  itemsById: Record<string, Anime>;
  deletedAnimeIds: string[];
  updatedAt?: string;
}

export type ServerAnimeOverride = Partial<Omit<Anime, "episodes">> & {
  updatedAt?: string;
  updatedBy?: string;
};

export type ServerEpisodeOverride = Partial<AnimeEpisode> & {
  updatedAt?: string;
  updatedBy?: string;
};

export interface ServerCatalogOverrides {
  version: 1;
  updatedAt?: string;
  animeOverrides: Record<string, ServerAnimeOverride>;
  deletedAnimeIds: string[];
  createdAnime: Anime[];
  episodeOverrides: Record<string, Record<string, ServerEpisodeOverride>>;
  deletedEpisodeIds: Record<string, string[]>;
  createdEpisodes: Record<string, AnimeEpisode[]>;
}

export type AnimeSourceKey = "muse-indonesia" | "ani-one-indonesia" | "manual" | "other";

export interface DuplicateGroup<T> {
  id: string;
  label: string;
  reason: string;
  items: T[];
}

export interface DuplicateAnimeItem {
  anime: Anime;
}

export interface DuplicateEpisodeItem {
  anime: Anime;
  episode: AnimeEpisode;
}

export interface PlayableVideoSource {
  type: VideoSourceType;
  label: string;
  url?: string;
  embedUrl?: string;
  fallbackUrl?: string;
  canPlayInline: boolean;
  warning?: string;
}

export function createEmptyAdminCatalog(): AdminCatalogOverrides {
  return {
    version: 1,
    itemsById: {},
    deletedAnimeIds: []
  };
}

export function createEmptyServerCatalogOverrides(): ServerCatalogOverrides {
  return {
    version: 1,
    updatedAt: undefined,
    animeOverrides: {},
    deletedAnimeIds: [],
    createdAnime: [],
    episodeOverrides: {},
    deletedEpisodeIds: {},
    createdEpisodes: {}
  };
}

export function normalizeAnimeStatus(status: string | undefined): KnownAnimeStatus {
  const value = String(status ?? "").trim().toLowerCase();

  if (value === "coming soon" || value === "upcoming") {
    return "Coming Soon";
  }

  if (
    value === "completed" ||
    value === "complete" ||
    value === "finished" ||
    value === "ended" ||
    value === "catalog"
  ) {
    return "Completed";
  }

  return "Ongoing";
}

export function createEpisodeSynopsis(description: string | undefined) {
  const cleaned = String(description ?? "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^https?:\/\//i.test(line) && !/^#/.test(line))
    .join(" ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/#\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "No episode synopsis available yet.";
  }

  return cleaned.length > 360 ? `${cleaned.slice(0, 357).trim()}...` : cleaned;
}

export function inferAnimeStatusFromEpisodes(
  anime: Pick<Anime, "status" | "episodes">,
  now = new Date()
): KnownAnimeStatus {
  if (String(anime.status ?? "").trim().toLowerCase() === "coming soon") {
    return "Coming Soon";
  }

  const latestReleaseTime = getLatestReleaseTime({ episodes: anime.episodes } as Anime);

  if (!latestReleaseTime) {
    return "Ongoing";
  }

  return now.getTime() - latestReleaseTime > EIGHT_DAYS_MS ? "Completed" : "Ongoing";
}

export function normalizeTitle(text: string | undefined) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\[\](){}:|/_-]+/g, " ")
    .replace(/\b(ep|episode|eps|season|s\d+|official|sub|dub|hd|full)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getAnimeSourceKey(
  anime: Pick<Anime, "sourceName" | "sourceChannelUrl" | "importedFrom" | "sourceType">
): AnimeSourceKey {
  const sourceText = [
    anime.importedFrom,
    anime.sourceName,
    anime.sourceChannelUrl,
    anime.sourceType
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_\s]+/g, " ");

  if (
    sourceText.includes("muse-indonesia") ||
    sourceText.includes("muse indonesia") ||
    sourceText.includes("@museindonesia")
  ) {
    return "muse-indonesia";
  }

  if (
    sourceText.includes("ani-one-indonesia") ||
    sourceText.includes("ani one indonesia") ||
    sourceText.includes("ani-one indonesia") ||
    sourceText.includes("anioneid") ||
    sourceText.includes("@anioneid")
  ) {
    return "ani-one-indonesia";
  }

  if (anime.sourceType === "manual" || sourceText.includes("manual")) {
    return "manual";
  }

  return "other";
}

export function getAnimeSourceLabel(sourceKey: AnimeSourceKey) {
  if (sourceKey === "muse-indonesia") {
    return "Muse Indonesia";
  }

  if (sourceKey === "ani-one-indonesia") {
    return "Ani-One Indonesia";
  }

  if (sourceKey === "manual") {
    return "Manual";
  }

  return "Other";
}

export function cleanSourceName(sourceName: string) {
  return sourceName
    .replace(/\s*Official\s+YouTube/gi, "")
    .replace(/\s*Official/gi, "")
    .replace(/\s+Source$/gi, "")
    .trim() || "Supported source";
}

export function getPublicAnimeSynopsis(anime: Pick<Anime, "title" | "synopsis" | "shortSynopsis">) {
  const text = (anime.shortSynopsis || anime.synopsis || "").trim();
  const technicalPattern =
    /(official\s+youtube|youtube\s+embed|playback\s+remains|imported\s+from|front-end|local\s+catalog|generated\s+data|not\s+hosted|admin\s+override|metadata\s+review)/i;

  if (!text || technicalPattern.test(text)) {
    return `Discover ${anime.title}, continue watching with ease, and explore episodes through supported source players.`;
  }

  return text;
}

export function mergeCatalogWithOverrides(
  baseCatalog: Anime[],
  overrides: AdminCatalogOverrides | null | undefined
) {
  const state = normalizeAdminCatalog(overrides);
  const deletedIds = new Set(state.deletedAnimeIds);
  const mergedIds = new Set<string>();
  const merged = baseCatalog
    .filter((anime) => !deletedIds.has(anime.id))
    .map((anime) => {
      const override = state.itemsById[anime.id];
      mergedIds.add(anime.id);
      return normalizeMergedAnime(
        override ? mergeAnime(anime, override) : anime,
        Boolean(override)
      );
    });

  const customItems = Object.values(state.itemsById).filter(
    (anime) => !mergedIds.has(anime.id) && !deletedIds.has(anime.id)
  ).map((anime) => normalizeMergedAnime(anime, true));

  return [...merged, ...customItems];
}

function stripServerMeta<T extends { updatedAt?: string; updatedBy?: string }>(value: T) {
  const rest = { ...value };
  delete rest.updatedAt;
  delete rest.updatedBy;
  return rest;
}

export function normalizeServerCatalogOverrides(
  state: ServerCatalogOverrides | null | undefined
): ServerCatalogOverrides {
  const empty = createEmptyServerCatalogOverrides();

  if (!state || typeof state !== "object") {
    return empty;
  }

  return {
    version: 1,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : undefined,
    animeOverrides:
      state.animeOverrides && typeof state.animeOverrides === "object"
        ? state.animeOverrides
        : {},
    deletedAnimeIds: Array.isArray(state.deletedAnimeIds) ? state.deletedAnimeIds : [],
    createdAnime: Array.isArray(state.createdAnime) ? state.createdAnime : [],
    episodeOverrides:
      state.episodeOverrides && typeof state.episodeOverrides === "object"
        ? state.episodeOverrides
        : {},
    deletedEpisodeIds:
      state.deletedEpisodeIds && typeof state.deletedEpisodeIds === "object"
        ? state.deletedEpisodeIds
        : {},
    createdEpisodes:
      state.createdEpisodes && typeof state.createdEpisodes === "object"
        ? state.createdEpisodes
        : {}
  };
}

export function mergeCatalogWithServerOverrides(
  baseCatalog: Anime[],
  overrides: ServerCatalogOverrides | null | undefined
) {
  const state = normalizeServerCatalogOverrides(overrides);
  const deletedAnimeIds = new Set(state.deletedAnimeIds);
  const mergedIds = new Set<string>();
  const merged = baseCatalog
    .filter((anime) => !deletedAnimeIds.has(anime.id))
    .map((anime) => {
      const animeOverride = state.animeOverrides[anime.id];
      const mergedAnime: Anime = {
        ...anime,
        ...(animeOverride ? stripServerMeta(animeOverride) : {})
      };

      mergedIds.add(anime.id);
      return normalizeMergedAnime(
        mergeEpisodesWithServerOverrides(mergedAnime, state),
        Boolean(animeOverride)
      );
    });
  const createdAnime = state.createdAnime
    .filter((anime) => !deletedAnimeIds.has(anime.id))
    .map((anime) => {
      const animeOverride = state.animeOverrides[anime.id];
      const mergedAnime: Anime = {
        ...anime,
        ...(animeOverride ? stripServerMeta(animeOverride) : {})
      };

      mergedIds.add(anime.id);
      return normalizeMergedAnime(
        mergeEpisodesWithServerOverrides(mergedAnime, state),
        true
      );
    });
  const overrideOnlyAnime = Object.entries(state.animeOverrides)
    .filter(([animeId]) => !mergedIds.has(animeId) && !deletedAnimeIds.has(animeId))
    .filter(([, animeOverride]) => Array.isArray((animeOverride as Partial<Anime>).episodes))
    .map(([, animeOverride]) =>
      normalizeMergedAnime(
        mergeEpisodesWithServerOverrides(stripServerMeta(animeOverride) as Anime, state),
        true
      )
    )
    .filter((anime) => anime.id);

  return [...merged, ...createdAnime, ...overrideOnlyAnime];
}

function mergeEpisodesWithServerOverrides(
  anime: Anime,
  state: ServerCatalogOverrides
): Anime {
  const deletedEpisodeIds = new Set(state.deletedEpisodeIds[anime.id] ?? []);
  const episodeOverrides = state.episodeOverrides[anime.id] ?? {};
  const createdEpisodes = state.createdEpisodes[anime.id] ?? [];
  const episodeIds = new Set<string>();
  const baseEpisodes = (anime.episodes ?? [])
    .filter((episode) => !deletedEpisodeIds.has(episode.id))
    .map((episode) => {
      const override = episodeOverrides[episode.id];
      const mergedEpisode = override
        ? { ...episode, ...stripServerMeta(override) }
        : episode;

      episodeIds.add(episode.id);
      return mergedEpisode;
    });
  const extraEpisodes = createdEpisodes
    .filter((episode) => !deletedEpisodeIds.has(episode.id))
    .filter((episode) => !episodeIds.has(episode.id))
    .map((episode) => {
      const override = episodeOverrides[episode.id];
      return override ? { ...episode, ...stripServerMeta(override) } : episode;
    });

  return {
    ...anime,
    episodes: [...baseEpisodes, ...extraEpisodes].sort((a, b) => a.number - b.number)
  };
}

export function getPublicCatalog(catalog: Anime[]) {
  return catalog
    .filter((anime) => anime.isHidden !== true)
    .map((anime) => ({
      ...anime,
      episodes: anime.episodes.filter((episode) => episode.isHidden !== true)
    }));
}

export function normalizeAdminCatalog(
  state: AdminCatalogOverrides | null | undefined
): AdminCatalogOverrides {
  if (!state || typeof state !== "object") {
    return createEmptyAdminCatalog();
  }

  return {
    version: 1,
    itemsById: state.itemsById && typeof state.itemsById === "object" ? state.itemsById : {},
    deletedAnimeIds: Array.isArray(state.deletedAnimeIds) ? state.deletedAnimeIds : [],
    updatedAt: state.updatedAt
  };
}

function mergeAnime(base: Anime, override: Anime): Anime {
  return {
    ...base,
    ...override,
    episodes: override.episodes ?? base.episodes
  };
}

function normalizeMergedAnime(anime: Anime, hasAdminOverride: boolean): Anime {
  const rawStatus = String(anime.status ?? "");
  const shouldInferStatus =
    !hasAdminOverride &&
    Boolean(anime.importedFrom) &&
    rawStatus.trim().toLowerCase() !== "coming soon";
  const status = shouldInferStatus
    ? inferAnimeStatusFromEpisodes(anime)
    : normalizeAnimeStatus(rawStatus);

  return {
    ...anime,
    status,
    episodes: anime.episodes.map((episode) => ({
      ...episode,
      synopsis:
        anime.importedFrom && !hasAdminOverride
          ? createEpisodeSynopsis(episode.synopsis)
          : episode.synopsis || "No episode synopsis available yet."
    }))
  };
}

function groupBy<T>(items: T[], getKey: (item: T) => string | undefined) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);

    if (!key) {
      continue;
    }

    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return groups;
}

function duplicateGroups<T>(
  groups: Map<string, T[]>,
  reason: string,
  labelPrefix: string,
  keepGroup: (items: T[]) => boolean = (items) => items.length > 1
): DuplicateGroup<T>[] {
  return Array.from(groups.entries())
    .filter(([, items]) => keepGroup(items))
    .map(([key, items]) => ({
      id: `${reason}:${key}`,
      label: `${labelPrefix}: ${key}`,
      reason,
      items
    }));
}

export function findDuplicateAnime(catalog: Anime[]): DuplicateGroup<DuplicateAnimeItem>[] {
  const items = catalog.map((anime) => ({ anime }));
  const byTitle = groupBy(items, (item) => {
    const title = normalizeTitle(item.anime.title);
    return title.length >= 4 ? title : undefined;
  });
  const byPlaylist = groupBy(
    items,
    (item) => item.anime.youtubePlaylistId ?? item.anime.playlistId
  );

  return [
    ...duplicateGroups(byTitle, "normalized anime title", "Title"),
    ...duplicateGroups(byPlaylist, "playlist ID", "Playlist")
  ];
}

export function findDuplicateEpisodes(catalog: Anime[]): DuplicateGroup<DuplicateEpisodeItem>[] {
  const items = catalog.flatMap((anime) =>
    anime.episodes.map((episode) => ({ anime, episode }))
  );
  const byTitle = groupBy(items, (item) => {
    const title = normalizeTitle(item.episode.title);

    if (!title || /^episode \d+$/.test(title) || title.length < 6) {
      return undefined;
    }

    return title;
  });
  const byTitleWithinAnime = groupBy(items, (item) => {
    const title = normalizeTitle(item.episode.title);

    if (!title || title.length < 4) {
      return undefined;
    }

    return `${item.anime.id}:${title}`;
  });
  const byYouTubeId = groupBy(items, (item) => item.episode.youtubeVideoId);
  const byPlaylistId = groupBy(items, (item) => item.episode.youtubePlaylistId);
  const byDirectUrl = groupBy(
    items,
    (item) =>
      item.episode.directVideoUrl ?? item.episode.videoUrl ?? item.episode.googleDriveUrl
  );

  return [
    ...duplicateGroups(byTitle, "normalized episode title", "Episode title"),
    ...duplicateGroups(byTitleWithinAnime, "episode title within same anime", "Episode title"),
    ...duplicateGroups(byYouTubeId, "YouTube video ID", "YouTube video"),
    ...duplicateGroups(
      byPlaylistId,
      "YouTube playlist ID across anime",
      "YouTube playlist",
      (groupItems) => new Set(groupItems.map((item) => item.anime.id)).size > 1
    ),
    ...duplicateGroups(byDirectUrl, "direct video URL", "Video URL")
  ];
}

export function extractYouTubeVideoId(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2] ?? "";
      }

      return url.searchParams.get("v") ?? "";
    }

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

export function extractYouTubePlaylistId(input: string) {
  const value = input.trim();

  if (!value) {
    return "";
  }

  if (/^[a-zA-Z0-9_-]{12,}$/.test(value) && !value.includes("http")) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.searchParams.get("list") ?? "";
  } catch {
    return "";
  }
}

export function isDirectVideoUrl(input: string | undefined) {
  if (!input) {
    return false;
  }

  try {
    const url = new URL(input);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url.pathname + url.search)
    );
  } catch {
    return false;
  }
}

export function isGoogleDriveUrl(input: string | undefined) {
  if (!input) {
    return false;
  }

  try {
    const url = new URL(input);
    return /(^|\.)drive\.google\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function extractGoogleDriveFileId(input: string) {
  try {
    const url = new URL(input);
    const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    return fileMatch?.[1] ?? url.searchParams.get("id") ?? "";
  } catch {
    return "";
  }
}

export function createPlayableVideoSource(episode: AnimeEpisode): PlayableVideoSource {
  const sourceType = episode.sourceType ?? inferEpisodeSourceType(episode);

  if (sourceType === "youtube") {
    return {
      type: "youtube",
      label: "Supported source player",
      fallbackUrl: episode.officialVideoUrl,
      canPlayInline: episode.embeddable !== false
    };
  }

  const directUrl = episode.directVideoUrl ?? episode.videoUrl;

  if (sourceType === "direct" && isDirectVideoUrl(directUrl)) {
    return {
      type: "direct",
      label: "Direct video",
      url: directUrl,
      fallbackUrl: directUrl,
      canPlayInline: true
    };
  }

  const driveUrl = episode.googleDriveUrl ?? episode.videoUrl ?? episode.officialVideoUrl;

  if (sourceType === "gdrive" || isGoogleDriveUrl(driveUrl)) {
    const fileId = driveUrl ? extractGoogleDriveFileId(driveUrl) : "";
    const playableUrl = fileId
      ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
      : undefined;

    return {
      type: "gdrive",
      label: "Google Drive video",
      url: playableUrl,
      fallbackUrl: driveUrl,
      canPlayInline: Boolean(playableUrl),
      warning:
        "Google Drive playback depends on file permissions, video format, and browser CORS rules."
    };
  }

  return {
    type: "manual",
    label: "Source link",
    fallbackUrl: episode.officialVideoUrl ?? directUrl,
    canPlayInline: false,
    warning: "This source is not available in the player."
  };
}

export function inferEpisodeSourceType(episode: AnimeEpisode): VideoSourceType {
  if (episode.youtubeVideoId || episode.youtubePlaylistId) {
    return "youtube";
  }

  if (isGoogleDriveUrl(episode.googleDriveUrl ?? episode.videoUrl)) {
    return "gdrive";
  }

  if (isDirectVideoUrl(episode.directVideoUrl ?? episode.videoUrl)) {
    return "direct";
  }

  return "manual";
}

export function getLatestReleaseTime(anime: Anime) {
  return Math.max(
    0,
    ...anime.episodes.map((episode) => new Date(episode.releaseDate).getTime()).filter(Boolean)
  );
}

export function sortFeaturedAnime(catalog: Anime[]) {
  return [...catalog]
    .filter((anime) => anime.isFeatured === true)
    .sort(
      (a, b) =>
        (a.featuredRank ?? 9999) - (b.featuredRank ?? 9999) ||
        getLatestReleaseTime(b) - getLatestReleaseTime(a) ||
        String(a.title).localeCompare(b.title)
    );
}

export function sortTrendingAnime(catalog: Anime[]) {
  return [...catalog].sort((a, b) => {
    const trendingScore = Number(Boolean(b.isTrending)) - Number(Boolean(a.isTrending));

    if (trendingScore !== 0) {
      return trendingScore;
    }

    const rankScore = (a.trendingRank ?? 9999) - (b.trendingRank ?? 9999);

    if (rankScore !== 0) {
      return rankScore;
    }

    const releaseScore = getLatestReleaseTime(b) - getLatestReleaseTime(a);

    if (releaseScore !== 0) {
      return releaseScore;
    }

    const aRating = typeof a.rating === "number" ? a.rating : 0;
    const bRating = typeof b.rating === "number" ? b.rating : 0;

    return bRating - aRating;
  });
}

export function sortOngoingAnime(catalog: Anime[]) {
  return [...catalog]
    .filter(
      (anime) =>
        anime.isOngoingSection === true ||
        (anime.isOngoingSection !== false && anime.status === "Ongoing")
    )
    .sort((a, b) => {
      const sectionScore = Number(Boolean(b.isOngoingSection)) - Number(Boolean(a.isOngoingSection));

      if (sectionScore !== 0) {
        return sectionScore;
      }

      const rankScore = (a.ongoingRank ?? 9999) - (b.ongoingRank ?? 9999);

      if (rankScore !== 0) {
        return rankScore;
      }

      const statusScore = Number(b.status === "Ongoing") - Number(a.status === "Ongoing");

      if (statusScore !== 0) {
        return statusScore;
      }

      return getLatestReleaseTime(b) - getLatestReleaseTime(a);
    });
}
