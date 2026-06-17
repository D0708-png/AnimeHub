"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import type { Anime } from "@/types/anime";
import { STORAGE_KEYS } from "@/lib/constants";
import { searchAnime } from "@/lib/search";
import { useCatalog } from "@/hooks/useCatalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AnimeCard } from "./AnimeCard";
import { EmptyState } from "./EmptyState";

interface SearchPageClientProps {
  anime: Anime[];
}

export function SearchPageClient({ anime }: SearchPageClientProps) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    STORAGE_KEYS.recentSearches,
    []
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 220);
  const { catalog } = useCatalog(anime);
  const results = useMemo(
    () => searchAnime(catalog, debouncedQuery),
    [catalog, debouncedQuery]
  );
  const visibleResults = results.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(24);
  }, [debouncedQuery]);

  useGsapReveal(resultRef, { selector: ".search-result-card", y: 18, stagger: 0.05 });

  function rememberSearch(value: string) {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return;
    }

    setRecentSearches((current) => [
      cleanValue,
      ...current.filter((item) => item.toLowerCase() !== cleanValue.toLowerCase())
    ].slice(0, 8));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    rememberSearch(query);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-card p-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, original title, synopsis, genre, studio, source, or year"
            className="form-field h-14 pl-12 pr-4 text-base"
            autoComplete="off"
          />
        </label>
      </form>

      {recentSearches.length > 0 ? (
        <section className="glass-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white/56">
              Recent searches
            </h2>
            <button
              type="button"
              onClick={() => setRecentSearches([])}
              className="button-danger min-h-0 px-3 py-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear recent searches
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                type="button"
                key={item}
                className="chip transition hover:border-cyan/40 hover:text-cyan"
                onClick={() => setQuery(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {results.length > 0 ? (
        <>
          <div ref={resultRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleResults.map((item) => (
              <div className="search-result-card" key={item.id}>
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
                Load more results
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No search results"
          description="Try another title, genre, studio, source, or year."
        />
      )}
    </div>
  );
}
