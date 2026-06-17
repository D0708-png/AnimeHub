"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Anime, AnimeGenre } from "@/types/anime";
import type { AnimeSourceKey } from "@/lib/catalog";
import { getAnimeSourceKey, getAnimeSourceLabel } from "@/lib/catalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AnimeGrid } from "./AnimeGrid";
import { EmptyState } from "./EmptyState";
import { PreferencesPanel } from "./PreferencesPanel";
import { usePreferences } from "@/hooks/usePreferences";

interface SearchExperienceProps {
  anime: Anime[];
  genres: AnimeGenre[];
}

export function SearchExperience({ anime, genres }: SearchExperienceProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 220);
  const [genre, setGenre] = useState(searchParams.get("genre") ?? "All");
  const [source, setSource] = useState<"All" | AnimeSourceKey>("All");
  const [visibleCount, setVisibleCount] = useState(24);
  const { preferences } = usePreferences();

  const sources = useMemo(
    () =>
      Array.from(new Set(anime.map((item) => getAnimeSourceKey(item))))
        .sort((a, b) => getAnimeSourceLabel(a).localeCompare(getAnimeSourceLabel(b))),
    [anime]
  );

  const results = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return anime.filter((item) => {
      const searchableText = [
        item.title,
        item.originalTitle,
        item.synopsis,
        item.shortSynopsis,
        item.studio,
        item.sourceName,
        item.importedFrom,
        getAnimeSourceKey(item),
        getAnimeSourceLabel(getAnimeSourceKey(item))
      ].join(" ");
      const matchesQuery =
        !normalizedQuery || searchableText.toLowerCase().includes(normalizedQuery);
      const matchesGenre = genre === "All" || item.genres.includes(genre as AnimeGenre);
      const matchesSource = source === "All" || getAnimeSourceKey(item) === source;

      return matchesQuery && matchesGenre && matchesSource;
    });
  }, [anime, debouncedQuery, genre, source]);

  const visibleResults = results.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <section className="glass-card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem]">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(24);
              }}
              placeholder="Search title, mood, or synopsis"
              className="form-field pl-10"
            />
          </label>
          <select
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value);
              setVisibleCount(24);
            }}
            className="form-field"
            aria-label="Filter by genre"
          >
            <option>All</option>
            {genres.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value as "All" | AnimeSourceKey);
              setVisibleCount(24);
            }}
            className="form-field"
            aria-label="Filter by source"
          >
            <option>All</option>
            {sources.map((item) => (
              <option key={item} value={item}>{getAnimeSourceLabel(item)}</option>
            ))}
          </select>
        </div>
      </section>

      <PreferencesPanel />

      {results.length > 0 ? (
        <>
          <AnimeGrid anime={visibleResults} compact={preferences.compactCards} />
          {visibleResults.length < results.length ? (
            <div className="flex justify-center">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setVisibleCount((current) => current + 24)}
              >
                Load more
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No titles match"
          description="Try a different title, source, or genre filter."
        />
      )}
    </div>
  );
}
