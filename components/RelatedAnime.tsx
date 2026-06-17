import type { Anime } from "@/types/anime";
import { AnimeCarousel } from "./AnimeCarousel";
import { SectionHeader } from "./SectionHeader";

interface RelatedAnimeProps {
  anime: Anime;
  catalog: Anime[];
}

export function RelatedAnime({ anime, catalog }: RelatedAnimeProps) {
  const related = catalog
    .filter((item) => item.id !== anime.id)
    .map((item) => ({
      item,
      score: item.genres.filter((genre) => anime.genres.includes(genre)).length
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.item.year - a.item.year)
    .map(({ item }) => item);

  return (
    <section>
      <SectionHeader
        eyebrow="Related"
        title="More like this"
        description="Similar titles based on genre and mood."
      />
      <AnimeCarousel anime={related} emptyTitle="No related titles yet" />
    </section>
  );
}
