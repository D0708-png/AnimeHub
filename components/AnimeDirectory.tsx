"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import type { Anime, AnimeGenre, AnimeStatus } from "@/types/anime";
import type { AnimeSourceKey } from "@/lib/catalog";
import { getAnimeSourceKey, getAnimeSourceLabel } from "@/lib/catalog";
import { getPopularityScore, getRatingSortScore, searchAnime } from "@/lib/search";
import { useCatalog } from "@/hooks/useCatalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { AnimeCard } from "./AnimeCard";
import { EmptyState } from "./EmptyState";
import { SectionHeader } from "./SectionHeader";

type SortMode = "latest" | "highest-rating" | "a-z" | "popular";
type SourceFilter = "All" | AnimeSourceKey;

interface AnimeDirectoryProps {
  anime: Anime[];
  genres?: AnimeGenre[];
  years?: number[];
  sources?: string[];
  statuses?: AnimeStatus[];
}

export function AnimeDirectory({
  anime
}: AnimeDirectoryProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 220);
  const [genre, setGenre] = useState("All");
  const [source, setSource] = useState<SourceFilter>("All");
  const [year, setYear] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState<SortMode>("latest");
  const [visibleCount, setVisibleCount] = useState(24);
  const resultRef = useRef<HTMLDivElement>(null);
  const { catalog } = useCatalog(anime);
  const genres = useMemo(
    () => Array.from(new Set(catalog.flatMap((item) => item.genres))).sort(),
    [catalog]
  );
  const years = useMemo(
    () => Array.from(new Set(catalog.map((item) => item.year))).sort((a, b) => b - a),
    [catalog]
  );
  const sources = useMemo(
    () =>
      Array.from(new Set(catalog.map((item) => getAnimeSourceKey(item))))
        .sort((a, b) => getAnimeSourceLabel(a).localeCompare(getAnimeSourceLabel(b))),
    [catalog]
  );
  const statuses = useMemo(
    () => Array.from(new Set(catalog.map((item) => item.status))).sort(),
    [catalog]
  );

  const results = useMemo(() => {
    const filtered = searchAnime(catalog, debouncedQuery).filter((item) => {
      const matchesGenre = genre === "All" || item.genres.includes(genre as AnimeGenre);
      const matchesSource = source === "All" || getAnimeSourceKey(item) === source;
      const matchesYear = year === "All" || String(item.year) === year;
      const matchesStatus = status === "All" || item.status === status;

      return matchesGenre && matchesSource && matchesYear && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "a-z") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "highest-rating") {
        return getRatingSortScore(b) - getRatingSortScore(a) || b.year - a.year;
      }

      if (sort === "popular") {
        return getPopularityScore(b) - getPopularityScore(a);
      }

      return b.year - a.year || a.title.localeCompare(b.title);
    });
  }, [catalog, debouncedQuery, genre, source, sort, status, year]);

  useEffect(() => {
    setVisibleCount(24);
  }, [debouncedQuery, genre, source, sort, status, year]);

  useGsapReveal(resultRef, { selector: ".directory-card", y: 18, stagger: 0.045 });

  const visibleResults = results.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <section className="glass-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
          <SlidersHorizontal className="h-4 w-4 text-cyan" aria-hidden="true" />
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(5,1fr)]">
          <label className="relative">
            <Filter
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title, studio, source..."
              className="form-field pl-10"
            />
          </label>
          <select value={genre} onChange={(event) => setGenre(event.target.value)} className="form-field">
            <option>All</option>
            {genres.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as SourceFilter)}
            className="form-field"
          >
            <option>All</option>
            {sources.map((item) => (
              <option key={item} value={item}>{getAnimeSourceLabel(item)}</option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)} className="form-field">
            <option>All</option>
            {years.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-field">
            <option>All</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="form-field">
            <option value="latest">Latest</option>
            <option value="highest-rating">Highest rating</option>
            <option value="a-z">A-Z</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </section>

      <SectionHeader
        eyebrow={`${results.length} results`}
        title="All Anime"
        description="Browse curated titles by genre, source, year, and status."
      />

      {results.length > 0 ? (
        <>
          <div ref={resultRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleResults.map((item) => (
              <div className="directory-card" key={item.id}>
                <AnimeCard anime={item} />
              </div>
            ))}
          </div>
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
          title="No anime found"
          description="Adjust the genre, source, year, status, or sort filters and try again."
        />
      )}
    </div>
  );
}
