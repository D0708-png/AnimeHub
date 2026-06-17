import type { Metadata } from "next";
import { Suspense } from "react";
import { PageIntro } from "@/components/PageIntro";
import { SearchPageClient } from "@/components/SearchPageClient";
import { getAllAnime } from "@/lib/anime";

export const metadata: Metadata = {
  title: "Search"
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="Discovery"
        title="Search Anime"
        description="Find titles by name, genre, studio, source, or release year."
      />
      <Suspense fallback={<div className="glass-card p-8 text-white/62">Loading search...</div>}>
        <SearchPageClient anime={getAllAnime()} />
      </Suspense>
    </div>
  );
}
