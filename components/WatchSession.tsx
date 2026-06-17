"use client";

import { useEffect } from "react";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { useWatchHistory } from "@/hooks/useWatchHistory";

interface WatchSessionProps {
  anime: Anime;
  episode: AnimeEpisode;
}

export function WatchSession({ anime, episode }: WatchSessionProps) {
  const { recordWatch } = useWatchHistory();
  const posterImage =
    anime.cardThumbnail ||
    anime.posterImage ||
    anime.bannerImage ||
    anime.episodes[0]?.thumbnail;

  useEffect(() => {
    recordWatch({
      animeId: anime.id,
      slug: anime.slug,
      title: anime.title,
      posterImage,
      episodeId: episode.id,
      episodeNumber: episode.number,
      episodeTitle: episode.title,
      youtubeVideoId: episode.youtubeVideoId
    });
  }, [
    anime.id,
    anime.bannerImage,
    anime.cardThumbnail,
    anime.posterImage,
    anime.slug,
    anime.title,
    episode.id,
    episode.number,
    episode.title,
    episode.youtubeVideoId,
    posterImage,
    recordWatch
  ]);

  return null;
}
