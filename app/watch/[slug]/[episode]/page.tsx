import type { Metadata } from "next";
import { WatchRouteClient } from "@/components/WatchRouteClient";
import { getAllAnime, getEpisode } from "@/lib/anime";

interface WatchPageProps {
  params: Promise<{
    slug: string;
    episode: string;
  }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug, episode } = await params;
  const selected = getEpisode(slug, episode);

  if (!selected) {
    return {
      title: "Episode"
    };
  }

  return {
    title: `${selected.anime.title} Episode ${selected.episode.number}`,
    description: `Watch ${selected.anime.title} Episode ${selected.episode.number} on AnimeHub.`
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug, episode } = await params;
  const selected = getEpisode(slug, episode);
  const related = selected
    ? getAllAnime()
        .filter((anime) => anime.id !== selected.anime.id)
        .filter((anime) => anime.genres.some((genre) => selected.anime.genres.includes(genre)))
        .slice(0, 12)
    : [];

  return (
    <WatchRouteClient
      baseAnime={selected ? [selected.anime, ...related] : []}
      slug={slug}
      episodeParam={episode}
    />
  );
}
