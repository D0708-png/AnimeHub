import {
  getAnimeSourceKey,
  getAnimeSourceLabel,
  inferEpisodeSourceType,
  normalizeTitle,
  VALID_ANIME_STATUSES
} from "@/lib/catalog";
import type { Anime, AnimeEpisode, VideoSourceType } from "@/types/anime";

export const adminStatuses = [...VALID_ANIME_STATUSES];

export const adminSourceTypes: VideoSourceType[] = ["youtube", "gdrive", "direct", "manual"];

export function cloneAnime(anime: Anime): Anime {
  return JSON.parse(JSON.stringify(anime)) as Anime;
}

export function slugifyAdmin(text: string) {
  return normalizeTitle(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createManualAnime(): Anime {
  const now = Date.now();

  return {
    id: `manual-${now}`,
    title: "New Manual Anime",
    slug: `new-manual-anime-${now}`,
    originalTitle: "New Manual Anime",
    synopsis: "Local admin entry. Add official source metadata before publishing.",
    shortSynopsis: "Local admin entry.",
    genres: ["Official YouTube"],
    year: new Date().getFullYear(),
    status: "Ongoing",
    studio: "Unknown",
    rating: 0,
    duration: "Unknown",
    sourceName: "Manual",
    sourceChannelUrl: "",
    posterImage: "/placeholders/poster-default.svg",
    bannerImage: "/placeholders/banner-default.svg",
    cardThumbnail: "/placeholders/poster-default.svg",
    heroImage: "",
    trailerYoutubeId: "",
    sourceType: "manual",
    episodes: []
  };
}

export function createManualEpisode(
  anime: Anime,
  sourceType: VideoSourceType = "youtube"
): AnimeEpisode {
  const nextNumber = Math.max(0, ...anime.episodes.map((episode) => episode.number)) + 1;

  return {
    id: `${anime.id}-episode-${Date.now()}`,
    number: nextNumber,
    title: `Episode ${nextNumber}`,
    synopsis: "Local admin episode entry.",
    youtubeVideoId: "",
    youtubePlaylistId: anime.youtubePlaylistId,
    thumbnail: anime.bannerImage || anime.posterImage || "/placeholders/banner-default.svg",
    duration: "Unknown",
    releaseDate: new Date().toISOString(),
    sourceType,
    embeddable: sourceType === "youtube" ? true : undefined
  };
}

export function sourceBucket(anime: Anime) {
  return getAnimeSourceLabel(getAnimeSourceKey(anime));
}

export function animeSourceType(anime: Anime): VideoSourceType {
  const firstEpisode = anime.episodes[0];

  if (anime.sourceType) {
    return anime.sourceType;
  }

  if (firstEpisode) {
    return firstEpisode.sourceType ?? inferEpisodeSourceType(firstEpisode);
  }

  return "manual";
}

export function getCardImage(anime: Anime) {
  return anime.cardThumbnail || anime.posterImage || anime.bannerImage || anime.episodes[0]?.thumbnail;
}

export function normalizeEpisodeNumbers(episodes: AnimeEpisode[]) {
  return episodes.map((episode, index) => ({
    ...episode,
    number: index + 1
  }));
}
