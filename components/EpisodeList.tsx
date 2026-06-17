"use client";

import { useRef } from "react";
import type { Anime } from "@/types/anime";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { EpisodeCard } from "./EpisodeCard";

interface EpisodeListProps {
  anime: Anime;
  activeEpisodeNumber?: number;
  showSynopsis?: boolean;
}

export function EpisodeList({
  anime,
  activeEpisodeNumber,
  showSynopsis = true
}: EpisodeListProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGsapReveal(rootRef, { selector: ".episode-card", y: 16, stagger: 0.055 });

  return (
    <div ref={rootRef} className="space-y-3">
      {anime.episodes.map((episode) => (
        <EpisodeCard
          key={episode.id}
          anime={anime}
          episode={episode}
          active={episode.number === activeEpisodeNumber}
          showSynopsis={showSynopsis}
        />
      ))}
    </div>
  );
}
