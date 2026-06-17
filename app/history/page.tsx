import type { Metadata } from "next";
import { HistoryClient } from "@/components/HistoryClient";
import { PageIntro } from "@/components/PageIntro";
import { getAllAnime } from "@/lib/anime";

export const metadata: Metadata = {
  title: "History"
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="Resume"
        title="Watch history"
        description="Pick up from recently opened episodes and continue your viewing flow."
      />
      <HistoryClient anime={getAllAnime()} />
    </div>
  );
}
