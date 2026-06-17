import Link from "next/link";
import { PlayCircle } from "lucide-react";
import type { Anime, AnimeEpisode } from "@/types/anime";
import { SafeImage } from "./SafeImage";

interface EpisodeCardProps {
  anime: Anime;
  episode: AnimeEpisode;
  active?: boolean;
  showSynopsis?: boolean;
}

export function EpisodeCard({
  anime,
  episode,
  active = false,
  showSynopsis = true
}: EpisodeCardProps) {
  return (
    <Link
      href={`/watch/${anime.slug}/${episode.number}`}
      className={`episode-card group grid gap-4 rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 sm:grid-cols-[9rem_1fr] ${
        active ? "border-cyan/45 bg-cyan/10" : "border-token bg-token-card hover:border-cyan/35"
      }`}
    >
      <div className="media-on-image relative aspect-video overflow-hidden rounded-xl" aria-hidden="true">
        <SafeImage
          src={episode.thumbnail}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 9rem"
          className="object-cover"
          loading="lazy"
        />
        <div className="thumbnail-gradient flex h-full items-end rounded-xl p-2">
          <span className="chip-hot">EP {episode.number}</span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/42">
              Episode {episode.number} / {episode.duration}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black text-white group-hover:text-cyan">
              {episode.title}
            </h3>
          </div>
          <PlayCircle className="h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
        </div>
        {showSynopsis ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
            {episode.synopsis}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
