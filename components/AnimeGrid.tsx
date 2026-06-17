import type { Anime } from "@/types/anime";
import { AnimeCard } from "./AnimeCard";

interface AnimeGridProps {
  anime: Anime[];
  compact?: boolean;
}

export function AnimeGrid({ anime, compact = false }: AnimeGridProps) {
  return (
    <div
      className={
        compact
          ? "grid gap-4"
          : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {anime.map((item) => (
        <AnimeCard anime={item} compact={compact} key={item.slug} />
      ))}
    </div>
  );
}
