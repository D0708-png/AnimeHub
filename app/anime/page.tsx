import type { Metadata } from "next";
import { AnimeDirectory } from "@/components/AnimeDirectory";
import { PageIntro } from "@/components/PageIntro";
import { getAllAnime } from "@/lib/anime";

export const metadata: Metadata = {
  title: "Anime Catalog"
};

export default function AnimePage() {
  const anime = getAllAnime();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="Explore"
        title="Anime Library"
        description="Discover curated titles, filter by mood or source, and find your next series with ease."
      />
      <AnimeDirectory anime={anime} />
    </div>
  );
}
