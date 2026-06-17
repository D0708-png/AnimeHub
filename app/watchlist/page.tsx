import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import { WatchlistClient } from "@/components/WatchlistClient";
import { getAllAnime } from "@/lib/anime";

export const metadata: Metadata = {
  title: "Watchlist"
};

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="Saved"
        title="Watchlist"
        description="Keep your next titles close and organize what you want to watch."
      />
      <WatchlistClient anime={getAllAnime()} />
    </div>
  );
}
