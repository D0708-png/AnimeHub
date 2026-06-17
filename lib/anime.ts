import { animeCatalog } from "@/data/anime";
import { mergeCatalogWithOverrides } from "@/lib/catalog";
import type { Anime, AnimeEpisode } from "@/types/anime";

export function getAllAnime() {
  return mergeCatalogWithOverrides(animeCatalog, null);
}

export function getCatalogPreview(episodeLimit = 1, itemLimit = Number.POSITIVE_INFINITY): Anime[] {
  return getAllAnime().slice(0, itemLimit).map((anime) => ({
    ...anime,
    synopsis: anime.synopsis.slice(0, 600),
    shortSynopsis: anime.shortSynopsis.slice(0, 220),
    episodes: anime.episodes.slice(0, episodeLimit).map((episode) => ({
      ...episode,
      synopsis: episode.synopsis.slice(0, 220)
    }))
  }));
}

export function getFeaturedAnime() {
  return getAllAnime().filter((anime) => anime.featured);
}

export function getAnimeBySlug(slug: string) {
  return getAllAnime().find((anime) => anime.slug === slug);
}

export function getEpisode(slug: string, episode: string | number) {
  const anime = getAnimeBySlug(slug);
  const episodeNumber = Number(episode);

  if (!anime || Number.isNaN(episodeNumber)) {
    return null;
  }

  const selectedEpisode = anime.episodes.find((item) => item.number === episodeNumber);

  if (!selectedEpisode) {
    return null;
  }

  return {
    anime,
    episode: selectedEpisode
  };
}

export function getAllGenres() {
  return Array.from(new Set(getAllAnime().flatMap((anime) => anime.genres))).sort();
}

export function buildOfficialSearchUrl(anime: Anime, episode?: AnimeEpisode) {
  const channelUrl = anime.sourceChannelUrl.replace(/\/$/, "");
  const query = episode
    ? `${anime.title} episode ${episode.number}`
    : anime.title;

  return `${channelUrl}/search?query=${encodeURIComponent(query)}`;
}
