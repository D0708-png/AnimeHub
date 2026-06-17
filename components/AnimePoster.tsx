import type { CSSProperties } from "react";
import type { Anime } from "@/types/anime";
import { cleanSourceName } from "@/lib/catalog";

interface AnimePosterProps {
  anime: Anime;
  compact?: boolean;
}

export function AnimePoster({ anime, compact = false }: AnimePosterProps) {
  const [first, second, third] = anime.coverGradient ?? ["#ff4d6d", "#18b7be", "#101114"];
  const initials = anime.title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const style = {
    "--poster-a": first,
    "--poster-b": second,
    "--poster-c": third
  } as CSSProperties;

  return (
    <div
      className={
        compact
          ? "poster-sheen aspect-[4/3] rounded-lg"
          : "poster-sheen aspect-[3/4] rounded-lg"
      }
      style={{
        ...style,
        backgroundImage: `linear-gradient(145deg, color-mix(in srgb, var(--poster-a) 78%, transparent), color-mix(in srgb, var(--poster-b) 78%, transparent) 48%, color-mix(in srgb, var(--poster-c) 78%, transparent)), url(${anime.posterImage})`,
        backgroundPosition: "center",
        backgroundSize: "cover"
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 surface-grid opacity-30" />
      <div className="absolute left-4 top-4 rounded-md bg-white/86 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-night">
        Featured
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="mb-3 text-5xl font-black tracking-normal text-white drop-shadow-sm">
          {initials}
        </div>
        <div className="rounded-lg bg-white/88 p-3 shadow-line backdrop-blur">
          <p className="line-clamp-2 text-sm font-black leading-5 text-night">{anime.title}</p>
          <p className="mt-1 text-xs font-semibold text-night/58">
            Source: {cleanSourceName(anime.sourceName)}
          </p>
        </div>
      </div>
    </div>
  );
}
