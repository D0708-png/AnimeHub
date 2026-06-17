import type { Metadata } from "next";
import { AnimeDetailPageClient } from "@/components/AnimeDetailPageClient";
import { getAllAnime, getAnimeBySlug } from "@/lib/anime";
import { getPublicAnimeSynopsis } from "@/lib/catalog";

interface AnimeDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params
}: AnimeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = getAnimeBySlug(slug);

  if (!anime) {
    return {
      title: "Anime"
    };
  }

  return {
    title: anime.title,
    description: getPublicAnimeSynopsis(anime)
  };
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { slug } = await params;
  const selected = getAnimeBySlug(slug);
  const related = selected
    ? getAllAnime()
        .filter((anime) => anime.id !== selected.id)
        .filter((anime) => anime.genres.some((genre) => selected.genres.includes(genre)))
        .slice(0, 12)
    : [];

  return <AnimeDetailPageClient baseAnime={selected ? [selected, ...related] : []} slug={slug} />;
}
