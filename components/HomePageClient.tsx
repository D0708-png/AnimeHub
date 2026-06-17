"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { Anime } from "@/types/anime";
import {
  getAnimeSourceKey,
  sortFeaturedAnime,
  sortOngoingAnime,
  sortTrendingAnime
} from "@/lib/catalog";
import { useCatalog } from "@/hooks/useCatalog";
import { AnimeCarousel } from "./AnimeCarousel";
import { ContinueWatching } from "./ContinueWatching";
import { EmptyState } from "./EmptyState";
import { HeroSection } from "./HeroSection";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

interface HomePageClientProps {
  baseAnime: Anime[];
}

export function HomePageClient({ baseAnime }: HomePageClientProps) {
  const { catalog } = useCatalog(baseAnime);
  const featuredAnime = sortFeaturedAnime(catalog);
  const featured = featuredAnime[0] ?? catalog[0];
  const trending = sortTrendingAnime(catalog).slice(0, 12);
  const ongoingAnime = sortOngoingAnime(catalog).slice(0, 12);
  const museTitles = catalog
    .filter((anime) => getAnimeSourceKey(anime) === "muse-indonesia")
    .slice(0, 12);
  const aniOneTitles = catalog
    .filter((anime) => getAnimeSourceKey(anime) === "ani-one-indonesia")
    .slice(0, 12);

  if (!featured) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="No anime available yet"
          description="AnimeHub is ready for curated titles and fresh collections."
          actionHref="/anime"
          actionLabel="Explore"
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <HeroSection anime={featured} />

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Resume"
          title="Continue Watching"
          description="Jump back into the episode you opened most recently."
        />
        <ContinueWatching anime={catalog} />
      </ScrollReveal>

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Featured Anime"
          title="Featured Anime"
          description="Handpicked series to start your next watch session."
        />
        <AnimeCarousel
          anime={featuredAnime.length > 0 ? featuredAnime : [featured]}
          emptyTitle="No featured anime yet"
        />
      </ScrollReveal>

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Trending"
          title="Trending Now"
          description="Popular picks and fresh arrivals worth checking out."
          actionHref="/anime"
          actionLabel="Browse all"
        />
        <AnimeCarousel anime={trending} />
      </ScrollReveal>

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Latest / New"
          title="Ongoing Series"
          description="Follow currently active collections and new episode drops."
        />
        <AnimeCarousel
          anime={ongoingAnime}
          emptyTitle="No ongoing anime selected"
          emptyDescription="Ongoing series will appear here when available."
        />
      </ScrollReveal>

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Source"
          title="Muse Indonesia"
          description="Explore collections from Muse Indonesia."
        />
        <AnimeCarousel
          anime={museTitles}
          emptyTitle="No Muse Indonesia titles visible"
          emptyDescription="Muse Indonesia titles will appear here when available."
        />
      </ScrollReveal>

      <ScrollReveal className="section-shell">
        <SectionHeader
          eyebrow="Source"
          title="Ani-One Indonesia"
          description="Explore collections from Ani-One Indonesia."
        />
        <AnimeCarousel
          anime={aniOneTitles}
          emptyTitle="No Ani-One Indonesia titles visible"
          emptyDescription="Ani-One Indonesia titles will appear here when available."
        />
      </ScrollReveal>

      <section className="container-page flex flex-col gap-4 py-9 sm:flex-row sm:items-center sm:justify-between sm:py-12">
        <p className="max-w-2xl text-sm leading-6 text-token-muted">
          Discover curated titles, continue watching, and explore new episodes with ease.
        </p>
        <Link href="/anime" className="button-primary shrink-0">
          <PlayCircle className="h-5 w-5" aria-hidden="true" />
          Explore Anime
        </Link>
      </section>
    </div>
  );
}
