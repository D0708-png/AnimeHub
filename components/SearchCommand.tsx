"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Clock3, PlayCircle, Search, X } from "lucide-react";
import type { Anime } from "@/types/anime";
import { STORAGE_KEYS } from "@/lib/constants";
import { getPublicAnimeSynopsis } from "@/lib/catalog";
import { searchAnime } from "@/lib/search";
import { useCatalog } from "@/hooks/useCatalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SafeImage } from "./SafeImage";
import { SourceBadge } from "./SourceBadge";

interface SearchCommandProps {
  anime?: Anime[];
}

export function SearchCommand({ anime }: SearchCommandProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loadedAnime, setLoadedAnime] = useState<Anime[]>(anime ?? []);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    STORAGE_KEYS.recentSearches,
    []
  );
  const debouncedQuery = useDebouncedValue(query, 180);
  const catalog = anime ?? loadedAnime;
  const { catalog: finalCatalog } = useCatalog(catalog);
  const isLoadingCatalog = open && !anime && loadedAnime.length === 0;
  const results = useMemo(
    () => searchAnime(finalCatalog, debouncedQuery).slice(0, 7),
    [debouncedQuery, finalCatalog]
  );

  useEffect(() => {
    if (!open || anime || loadedAnime.length > 0) {
      return;
    }

    let cancelled = false;

    import("@/data/anime").then((module) => {
      if (!cancelled) {
        setLoadedAnime(module.animeCatalog);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [anime, loadedAnime.length, open]);

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

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

  function closePalette() {
    setOpen(false);
    setQuery("");
  }

  function navigateTo(href: string) {
    rememberSearch(query);
    closePalette();
    router.push(href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closePalette();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigateTo(`/anime/${results[activeIndex].slug}`);
    }
  }

  return (
    <>
      <button type="button" className="button-icon" aria-label="Open anime search" onClick={() => setOpen(true)}>
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-black/45 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Search anime">
          <button className="absolute inset-0 cursor-default" aria-label="Close search" onClick={closePalette} />
          <div className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl border border-token bg-token-card shadow-soft">
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <Search className="h-5 w-5 text-cyan" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 min-w-0 flex-1 bg-transparent text-base font-bold text-token-foreground outline-none placeholder:text-token-muted"
                placeholder="Search anime, studio, genre, year..."
                autoComplete="off"
              />
              <kbd className="hidden rounded-lg border border-white/10 px-2 py-1 text-xs font-black text-white/42 sm:block">
                Esc
              </kbd>
              <button type="button" className="button-icon h-10 w-10" onClick={closePalette} aria-label="Close search">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {!query && recentSearches.length > 0 ? (
              <div className="border-b border-white/10 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/46">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Recent
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="chip transition hover:border-cyan/40 hover:text-cyan"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {isLoadingCatalog ? (
                <div className="p-8 text-center text-sm font-semibold text-white/56">
                  Loading titles...
                </div>
              ) : results.length > 0 ? (
                results.map((item, index) => {
                  const firstEpisode = item.episodes[0];
                  const cardImage =
                    item.cardThumbnail ||
                    item.posterImage ||
                    item.bannerImage ||
                    firstEpisode?.thumbnail;

                  return (
                    <div
                      key={item.id}
                      className={`grid gap-3 rounded-2xl p-3 transition sm:grid-cols-[4.5rem_1fr_auto] ${
                        index === activeIndex ? "bg-cyan/10" : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="media-on-image relative aspect-[3/4] overflow-hidden rounded-xl bg-token-muted" aria-hidden="true">
                        <SafeImage
                          src={cardImage}
                          alt=""
                          fill
                          sizes="4.5rem"
                          className="object-cover"
                        />
                        <div className="thumbnail-gradient absolute inset-0" />
                      </div>
                      <button
                        type="button"
                        className="min-w-0 text-left"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => navigateTo(`/anime/${item.slug}`)}
                      >
                        <SourceBadge sourceName={item.sourceName} compact />
                        <h3 className="mt-2 line-clamp-1 text-lg font-black text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/58">
                          {getPublicAnimeSynopsis(item)}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 sm:flex-col sm:justify-center">
                        {firstEpisode ? (
                          <button
                            type="button"
                            className="button-primary px-3 py-2 text-xs"
                            onClick={() => navigateTo(`/watch/${item.slug}/${firstEpisode.number}`)}
                          >
                            <PlayCircle className="h-4 w-4" aria-hidden="true" />
                            Watch
                          </button>
                        ) : null}
                        <Link
                          href={`/anime/${item.slug}`}
                          onClick={() => {
                            rememberSearch(query);
                            closePalette();
                          }}
                          className="button-secondary px-3 py-2 text-xs"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm font-semibold text-white/56">
                  No instant results.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
