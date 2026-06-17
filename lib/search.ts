import type { Anime } from "@/types/anime";
import { getAnimeSourceKey, getAnimeSourceLabel } from "@/lib/catalog";

export function getAnimeSearchText(anime: Anime) {
  const sourceKey = getAnimeSourceKey(anime);

  return [
    anime.title,
    anime.originalTitle,
    anime.synopsis,
    anime.shortSynopsis,
    anime.genres.join(" "),
    anime.studio,
    anime.sourceName,
    anime.importedFrom,
    anime.sourceChannelUrl,
    sourceKey,
    getAnimeSourceLabel(sourceKey),
    sourceKey === "ani-one-indonesia" ? "Ani One Indonesia AniOneID" : "",
    String(anime.year),
    anime.status,
    anime.rating
  ]
    .join(" ")
    .toLowerCase();
}

export function searchAnime(anime: Anime[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return anime;
  }

  return anime.filter((item) => getAnimeSearchText(item).includes(normalizedQuery));
}

export function getPopularityScore(anime: Anime) {
  return (
    anime.episodes.length * 8 +
    anime.genres.length * 3 +
    (anime.featured ? 20 : 0) +
    Math.max(0, anime.year - 2018)
  );
}

export function getRatingSortScore(anime: Anime) {
  if (typeof anime.rating === "number") {
    return anime.rating;
  }

  const ratingScore: Record<string, number> = {
    "All Ages": 1,
    Teen: 2,
    "Teen+": 3,
    Mature: 4
  };

  return ratingScore[anime.rating] ?? 0;
}
