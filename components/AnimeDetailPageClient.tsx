"use client";

import { AnimeDetailHeader } from "@/components/AnimeDetailHeader";
import { EmptyState } from "@/components/EmptyState";
import { EpisodeList } from "@/components/EpisodeList";
import { RelatedAnime } from "@/components/RelatedAnime";
import { SectionHeader } from "@/components/SectionHeader";
import { useCatalog } from "@/hooks/useCatalog";
import type { Anime } from "@/types/anime";

interface AnimeDetailPageClientProps {
  baseAnime: Anime[];
  slug: string;
}

export function AnimeDetailPageClient({ baseAnime, slug }: AnimeDetailPageClientProps) {
  const { catalog, hasHydrated } = useCatalog(baseAnime);
  const anime = catalog.find((item) => item.slug === slug);

  if (!anime) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title={hasHydrated ? "Anime not found" : "Loading anime..."}
          description="This title is not available right now. Explore another series from the library."
          actionHref="/anime"
          actionLabel="Explore anime"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <AnimeDetailHeader anime={anime} />

      <section>
        <SectionHeader
          eyebrow={`${anime.episodes.length} episodes`}
          title="Episodes"
          description="Pick an episode and continue watching through the available source player."
        />
        <div className="mt-4">
          <EpisodeList anime={anime} showSynopsis={false} />
        </div>
      </section>

      <RelatedAnime anime={anime} catalog={catalog} />
    </div>
  );
}
