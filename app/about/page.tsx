import type { Metadata } from "next";
import { CheckCircle2, Sparkles } from "lucide-react";
import { PageIntro } from "@/components/PageIntro";
import { LEGAL_DISCLAIMER } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About"
};

const highlights = [
  "Discover curated anime collections in a clean, modern interface.",
  "Continue watching from recently opened episodes.",
  "Save titles to your watchlist and fine-tune your viewing preferences.",
  "Explore collections from supported content sources."
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <PageIntro
        eyebrow="About AnimeHub"
        title="A smoother way to discover anime"
        description="AnimeHub brings your favorite anime collections into one smooth viewing experience. Discover curated titles, continue watching, and explore new episodes with ease."
      />

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">What AnimeHub Helps You Do</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/68">
            {highlights.map((item) => (
              <li className="flex gap-3" key={item}>
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-black text-white">Content Notice</h2>
          <p className="mt-4 text-sm leading-7 text-white/68">
            {LEGAL_DISCLAIMER}
          </p>
          <p className="mt-4 text-sm leading-7 text-white/68">
            Content availability may vary by source and region.
          </p>
        </div>
      </section>
    </div>
  );
}
