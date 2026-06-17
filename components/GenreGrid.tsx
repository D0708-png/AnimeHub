import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Anime, AnimeGenre } from "@/types/anime";

interface GenreGridProps {
  genres: AnimeGenre[];
  anime: Anime[];
}

export function GenreGrid({ genres, anime }: GenreGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {genres.map((genre, index) => {
        const count = anime.filter((item) => item.genres.includes(genre)).length;

        return (
          <Link
            href={`/search?genre=${encodeURIComponent(genre)}`}
            key={genre}
            className="group glass-card relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-glow"
          >
            <div
              className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background:
                  index % 2 === 0
                    ? "radial-gradient(circle at 20% 20%, rgba(52,216,255,0.22), transparent 15rem)"
                    : "radial-gradient(circle at 80% 20%, rgba(255,138,42,0.22), transparent 15rem)"
              }}
            />
            <div className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-cyan transition group-hover:scale-105 group-hover:text-ember">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-black text-white">{genre}</h3>
              <p className="mt-2 text-sm font-semibold text-white/56">
                {count} {count === 1 ? "title" : "titles"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
