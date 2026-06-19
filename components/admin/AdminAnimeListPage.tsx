"use client";

import Link from "next/link";
import {
  Download,
  Edit3,
  Eye,
  EyeOff,
  Film,
  CheckCircle2,
  Plus,
  RefreshCcw,
  Search,
  Star,
  Trash2,
  Upload,
  Wand2
} from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { showToast } from "@/components/ToastProvider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AnimeSourceKey, BulkAnimeAction } from "@/lib/catalog";
import { getAnimeSourceKey, getAnimeSourceLabel } from "@/lib/catalog";
import type { Anime } from "@/types/anime";
import {
  adminSourceTypes,
  adminStatuses,
  animeSourceType,
  getCardImage,
  sourceBucket
} from "./adminRouteHelpers";
import { useFullAdminCatalog } from "./useFullAdminCatalog";

function matchesFlag(filter: string, value: boolean | undefined) {
  if (filter === "All") {
    return true;
  }

  return filter === "Yes" ? Boolean(value) : !value;
}

function animeSearchText(anime: Anime) {
  const sourceKey = getAnimeSourceKey(anime);

  return [
    anime.title,
    anime.originalTitle,
    anime.slug,
    anime.status,
    anime.sourceName,
    anime.importedFrom,
    anime.sourceChannelUrl,
    sourceKey,
    getAnimeSourceLabel(sourceKey),
    anime.youtubePlaylistId,
    anime.officialPlaylistUrl,
    ...anime.episodes.map((episode) => `${episode.title} ${episode.youtubeVideoId} ${episode.releaseDate}`)
  ]
    .join(" ")
    .toLowerCase();
}

export function AdminAnimeListPage() {
  const {
    catalog,
    baseLoaded,
    hasHydrated,
    updateAnime,
    deleteAnime,
    bulkAnimeAction,
    exportCatalog,
    replaceCatalog,
    resetAdminCatalog,
    syncCatalog,
    isSyncing
  } = useFullAdminCatalog();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | AnimeSourceKey>("All");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All");
  const [hiddenFilter, setHiddenFilter] = useState("All");
  const [featuredFilter, setFeaturedFilter] = useState("All");
  const [trendingFilter, setTrendingFilter] = useState("All");
  const [reviewFilter, setReviewFilter] = useState("All");
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<string[]>([]);

  const summary = useMemo(
    () => ({
      totalAnime: catalog.length,
      totalEpisodes: catalog.reduce((total, anime) => total + anime.episodes.length, 0),
      museItems: catalog.filter((anime) => getAnimeSourceKey(anime) === "muse-indonesia").length,
      aniOneItems: catalog.filter((anime) => getAnimeSourceKey(anime) === "ani-one-indonesia").length,
      hiddenItems: catalog.filter((anime) => anime.isHidden === true).length,
      featuredItems: catalog.filter((anime) => anime.isFeatured === true).length,
      trendingItems: catalog.filter((anime) => anime.isTrending === true).length,
      ongoingItems: catalog.filter((anime) => anime.isOngoingSection === true || anime.status === "Ongoing").length,
      reviewItems: catalog.filter((anime) => anime.metadataNeedsReview === true).length,
      reviewedItems: catalog.filter((anime) => anime.metadataNeedsReview !== true).length
    }),
    [catalog]
  );

  const filteredAnime = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return catalog.filter((anime) => {
      const matchesQuery = !normalizedQuery || animeSearchText(anime).includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || anime.status === statusFilter;
      const matchesSource = sourceFilter === "All" || getAnimeSourceKey(anime) === sourceFilter;
      const matchesSourceType =
        sourceTypeFilter === "All" || animeSourceType(anime) === sourceTypeFilter;
      const matchesHidden = matchesFlag(hiddenFilter, anime.isHidden);
      const matchesFeatured = matchesFlag(featuredFilter, anime.isFeatured);
      const matchesTrending = matchesFlag(trendingFilter, anime.isTrending);
      const matchesReview =
        reviewFilter === "All" ||
        (reviewFilter === "Needs Review"
          ? anime.metadataNeedsReview === true
          : anime.metadataNeedsReview !== true);

      return (
        matchesQuery &&
        matchesStatus &&
        matchesSource &&
        matchesSourceType &&
        matchesHidden &&
        matchesFeatured &&
        matchesTrending &&
        matchesReview
      );
    });
  }, [
    catalog,
    debouncedQuery,
    featuredFilter,
    hiddenFilter,
    sourceFilter,
    sourceTypeFilter,
    statusFilter,
    trendingFilter,
    reviewFilter
  ]);

  const selectedSet = useMemo(() => new Set(selectedAnimeIds), [selectedAnimeIds]);
  const visibleAnimeIds = useMemo(() => filteredAnime.map((anime) => anime.id), [filteredAnime]);
  const selectedCount = selectedAnimeIds.length;
  const visibleSelectedCount = visibleAnimeIds.filter((animeId) => selectedSet.has(animeId)).length;
  const allVisibleSelected =
    visibleAnimeIds.length > 0 && visibleSelectedCount === visibleAnimeIds.length;

  function downloadExport() {
    const blob = new Blob([exportCatalog()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `animehub-cleaned-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importCatalog(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());

      if (!Array.isArray(parsed)) {
        throw new Error("Catalog JSON must be an array of anime items.");
      }

      replaceCatalog(parsed as Anime[]);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Unable to import catalog JSON",
        tone: "danger"
      });
    } finally {
      event.target.value = "";
    }
  }

  function toggleAnimeSelection(animeId: string, checked: boolean) {
    setSelectedAnimeIds((currentIds) => {
      if (checked) {
        return Array.from(new Set([...currentIds, animeId]));
      }

      return currentIds.filter((currentId) => currentId !== animeId);
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedAnimeIds((currentIds) => {
      const visibleSet = new Set(visibleAnimeIds);

      if (checked) {
        return Array.from(new Set([...currentIds, ...visibleAnimeIds]));
      }

      return currentIds.filter((animeId) => !visibleSet.has(animeId));
    });
  }

  async function runBulkAction(
    action: BulkAnimeAction,
    toastMessage: string,
    confirmMessage?: string
  ) {
    if (selectedCount === 0) {
      return;
    }

    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    const didSave = await bulkAnimeAction(action, selectedAnimeIds, toastMessage);

    if (didSave) {
      setSelectedAnimeIds([]);
    }
  }

  if (!baseLoaded || !hasHydrated) {
    return <div className="glass-card p-8 text-sm text-white/62">Loading admin catalog...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">Admin Catalog</p>
            <h1 className="mt-2 text-3xl font-black text-white">Anime Catalog</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Changes are saved to the site catalog. Updates may take a moment to appear across devices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/duplicates" className="button-secondary">
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              Duplicates
            </Link>
            <Link href="/admin/anime/new" className="button-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Anime
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total anime", summary.totalAnime],
          ["Total episodes", summary.totalEpisodes],
          ["Muse Indonesia", summary.museItems],
          ["Ani-One Indonesia", summary.aniOneItems],
          ["Hidden", summary.hiddenItems],
          ["Featured", summary.featuredItems],
          ["Trending", summary.trendingItems],
          ["Ongoing", summary.ongoingItems],
          ["Needs review", summary.reviewItems],
          ["Reviewed", summary.reviewedItems]
        ].map(([label, value]) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-token-muted">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black text-token-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Import / Export</h2>
            <p className="mt-1 text-sm leading-6 text-white/58">
              Export the merged site catalog as JSON, import a cleaned catalog, or sync the latest server state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="button-secondary" onClick={syncCatalog} disabled={isSyncing}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              {isSyncing ? "Syncing..." : "Sync Catalog"}
            </button>
            <button type="button" className="button-secondary" onClick={downloadExport}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export JSON
            </button>
            <button type="button" className="button-secondary" onClick={() => importInputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import JSON
            </button>
            <button
              type="button"
              className="button-danger"
              onClick={() => {
                if (window.confirm("Reset all site catalog changes?")) {
                  resetAdminCatalog();
                }
              }}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Reset Catalog
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={importCatalog}
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="form-field pl-10"
              placeholder="Search by anime or video name..."
            />
          </label>
          <select className="form-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            {adminStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            className="form-field"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as "All" | AnimeSourceKey)}
          >
            <option>All</option>
            {(["muse-indonesia", "ani-one-indonesia", "manual", "other"] as const).map((source) => (
              <option key={source} value={source}>{getAnimeSourceLabel(source)}</option>
            ))}
          </select>
          <select className="form-field" value={sourceTypeFilter} onChange={(event) => setSourceTypeFilter(event.target.value)}>
            <option>All</option>
            {adminSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>{sourceType}</option>
            ))}
          </select>
          <select className="form-field" value={hiddenFilter} onChange={(event) => setHiddenFilter(event.target.value)}>
            <option>All</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <select className="form-field" value={featuredFilter} onChange={(event) => setFeaturedFilter(event.target.value)}>
            <option>All</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <select className="form-field" value={trendingFilter} onChange={(event) => setTrendingFilter(event.target.value)}>
            <option>All</option>
            <option>Yes</option>
            <option>No</option>
          </select>
          <select className="form-field" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}>
            <option>All</option>
            <option>Needs Review</option>
            <option>Reviewed</option>
          </select>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-bold text-token-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-token-border bg-token-card text-token-primary focus:ring-2 focus:ring-token-primary"
                checked={allVisibleSelected}
                disabled={visibleAnimeIds.length === 0}
                onChange={(event) => toggleAllVisible(event.target.checked)}
              />
              Select All Visible
            </label>
            <span className="chip">{selectedCount} selected</span>
            {selectedCount > 0 ? (
              <button
                type="button"
                className="button-ghost px-4 py-2 text-xs"
                onClick={() => setSelectedAnimeIds([])}
              >
                Clear Selection
              </button>
            ) : null}
          </div>

          {selectedCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() =>
                  runBulkAction(
                    "hide",
                    `${selectedCount} anime hidden`,
                    `Hide ${selectedCount} selected anime from public pages?`
                  )
                }
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Hide Selected
              </button>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() => runBulkAction("unhide", `${selectedCount} anime unhidden`)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                Unhide Selected
              </button>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() => runBulkAction("markFeatured", `${selectedCount} anime marked featured`)}
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                Mark Featured
              </button>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() => runBulkAction("removeFeatured", `${selectedCount} anime removed from featured`)}
              >
                Remove Featured
              </button>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() => runBulkAction("markTrending", `${selectedCount} anime marked trending`)}
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Mark Trending
              </button>
              <button
                type="button"
                className="button-secondary px-4 py-2 text-xs"
                onClick={() => runBulkAction("removeTrending", `${selectedCount} anime removed from trending`)}
              >
                Remove Trending
              </button>
              <button
                type="button"
                className="button-danger px-4 py-2 text-xs"
                onClick={() =>
                  runBulkAction(
                    "delete",
                    `${selectedCount} anime deleted`,
                    `Delete ${selectedCount} selected anime from the catalog?`
                  )
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete Selected
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAnime.length === 0 ? (
          <div className="glass-card p-8 text-sm text-white/62">No anime matched these filters.</div>
        ) : (
          filteredAnime.map((anime) => (
            <article key={anime.id} className="glass-card overflow-hidden p-4">
              <div className="grid gap-4 lg:grid-cols-[auto_8rem_1fr_auto] lg:items-center">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-token-foreground lg:self-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-token-border bg-token-card text-token-primary focus:ring-2 focus:ring-token-primary"
                    checked={selectedSet.has(anime.id)}
                    onChange={(event) => toggleAnimeSelection(anime.id, event.target.checked)}
                  />
                  <span className="lg:sr-only">Select {anime.title}</span>
                </label>
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-token-muted">
                  <SafeImage
                    src={getCardImage(anime)}
                    alt=""
                    fill
                    sizes="8rem"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {anime.metadataNeedsReview === true ? (
                      <span className="chip-hot">Needs Poster Review</span>
                    ) : null}
                    {anime.isHidden ? <span className="chip-hot">Hidden</span> : null}
                    {anime.isFeatured ? <span className="chip">Featured #{anime.featuredRank ?? "-"}</span> : null}
                    {anime.isTrending ? <span className="chip">Trending #{anime.trendingRank ?? "-"}</span> : null}
                    {anime.isOngoingSection ? <span className="chip">Ongoing #{anime.ongoingRank ?? "-"}</span> : null}
                    <span className="chip">{sourceBucket(anime)}</span>
                    <span className="chip">{animeSourceType(anime)}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white">{anime.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-white/52">{anime.slug}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/62">{anime.shortSynopsis || anime.synopsis}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/42">
                    {anime.episodes.length} videos / {anime.status} / {anime.sourceName}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-[23rem] lg:justify-end">
                  <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/edit`} className="button-secondary px-4 py-2 text-xs">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                  <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes`} className="button-secondary px-4 py-2 text-xs">
                    <Film className="h-4 w-4" aria-hidden="true" />
                    Episodes
                  </Link>
                  <button
                    type="button"
                    className="button-secondary px-4 py-2 text-xs"
                    onClick={() => {
                      if (!anime.isHidden && !window.confirm("Hide this anime from public pages?")) {
                        return;
                      }

                      updateAnime(anime.id, { isHidden: !anime.isHidden }, anime.isHidden ? "Anime unhidden" : "Anime hidden");
                    }}
                  >
                    {anime.isHidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
                    {anime.isHidden ? "Unhide" : "Hide"}
                  </button>
                  <button
                    type="button"
                    className="button-secondary px-4 py-2 text-xs"
                    onClick={() =>
                      updateAnime(
                        anime.id,
                        {
                          isFeatured: !anime.isFeatured,
                          featuredRank: anime.featuredRank ?? 1
                        },
                        anime.isFeatured ? "Featured disabled" : "Featured enabled"
                      )
                    }
                  >
                    <Star className="h-4 w-4" aria-hidden="true" />
                    Featured
                  </button>
                  <button
                    type="button"
                    className="button-secondary px-4 py-2 text-xs"
                    onClick={() =>
                      updateAnime(
                        anime.id,
                        {
                          isTrending: !anime.isTrending,
                          trendingRank: anime.trendingRank ?? 1
                        },
                        anime.isTrending ? "Trending disabled" : "Trending enabled"
                      )
                    }
                  >
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    Trending
                  </button>
                  {anime.metadataNeedsReview === true ? (
                    <button
                      type="button"
                      className="button-secondary px-4 py-2 text-xs"
                      onClick={() =>
                        updateAnime(
                          anime.id,
                          {
                            metadataNeedsReview: false,
                            metadataReviewedAt: new Date().toISOString()
                          },
                          "Metadata review marked done"
                        )
                      }
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Mark Reviewed
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="button-danger px-4 py-2 text-xs"
                    onClick={() => {
                      if (window.confirm("Delete this anime from the site catalog?")) {
                        deleteAnime(anime.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
