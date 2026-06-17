"use client";

import Link from "next/link";
import { ArrowLeft, Edit3, Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AnimeEpisode } from "@/types/anime";
import {
  adminSourceTypes,
  cloneAnime,
  normalizeEpisodeNumbers
} from "./adminRouteHelpers";
import { useFullAdminCatalog } from "./useFullAdminCatalog";

interface AdminEpisodeListPageProps {
  animeId: string;
}

function sourceTypeOf(episode: AnimeEpisode) {
  return episode.sourceType ?? (episode.youtubeVideoId || episode.youtubePlaylistId ? "youtube" : "manual");
}

export function AdminEpisodeListPage({ animeId }: AdminEpisodeListPageProps) {
  const { catalog, baseLoaded, hasHydrated, upsertAnime } = useFullAdminCatalog();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [embedFilter, setEmbedFilter] = useState("All");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All");
  const anime = catalog.find((item) => item.id === animeId);

  const episodes = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    return (anime?.episodes ?? []).filter((episode) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          episode.title,
          String(episode.number),
          episode.youtubeVideoId,
          episode.youtubePlaylistId,
          episode.officialVideoUrl,
          episode.directVideoUrl,
          episode.videoUrl,
          episode.releaseDate
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesEmbed =
        embedFilter === "All" ||
        (embedFilter === "Embeddable" ? episode.embeddable !== false : episode.embeddable === false);
      const matchesSource =
        sourceTypeFilter === "All" || sourceTypeOf(episode) === sourceTypeFilter;

      return matchesQuery && matchesEmbed && matchesSource;
    });
  }, [anime?.episodes, debouncedQuery, embedFilter, sourceTypeFilter]);

  function deleteEpisode(episodeId: string) {
    if (!anime || !window.confirm("Delete this episode locally?")) {
      return;
    }

    upsertAnime(
      {
        ...anime,
        episodes: anime.episodes.filter((episode) => episode.id !== episodeId)
      },
      "Episode deleted locally"
    );
  }

  function moveEpisode(episodeId: string, direction: -1 | 1) {
    if (!anime) {
      return;
    }

    const nextAnime = cloneAnime(anime);
    const currentIndex = nextAnime.episodes.findIndex((episode) => episode.id === episodeId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextAnime.episodes.length) {
      return;
    }

    const [episode] = nextAnime.episodes.splice(currentIndex, 1);
    nextAnime.episodes.splice(targetIndex, 0, episode);
    nextAnime.episodes = normalizeEpisodeNumbers(nextAnime.episodes);
    upsertAnime(nextAnime, "Episodes reordered locally");
  }

  function toggleEpisodeHidden(episodeId: string) {
    if (!anime) {
      return;
    }

    const currentEpisode = anime.episodes.find((episode) => episode.id === episodeId);

    if (currentEpisode && !currentEpisode.isHidden && !window.confirm("Hide this episode from public pages?")) {
      return;
    }

    upsertAnime(
      {
        ...anime,
        episodes: anime.episodes.map((episode) =>
          episode.id === episodeId ? { ...episode, isHidden: !episode.isHidden } : episode
        )
      },
      "Episode visibility updated locally"
    );
  }

  if (!baseLoaded || !hasHydrated) {
    return <div className="glass-card p-8 text-sm text-white/62">Loading episode manager...</div>;
  }

  if (!anime) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-black text-white">Anime not found</h1>
        <p className="mt-2 text-sm text-white/62">This local item may have been deleted or reset.</p>
        <Link href="/admin/anime" className="button-primary mt-5">
          Back to anime
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">Episode Manager</p>
            <h1 className="mt-2 text-3xl font-black text-white">{anime.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Admin changes are saved locally in this browser. Export JSON to make the cleaned catalog permanent.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/anime" className="button-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Anime
            </Link>
            <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes/new`} className="button-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Episode
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
            <input
              className="form-field pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, number, video ID, date..."
            />
          </label>
          <select className="form-field" value={embedFilter} onChange={(event) => setEmbedFilter(event.target.value)}>
            <option>All</option>
            <option>Embeddable</option>
            <option>Non-embeddable</option>
          </select>
          <select className="form-field" value={sourceTypeFilter} onChange={(event) => setSourceTypeFilter(event.target.value)}>
            <option>All</option>
            {adminSourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>{sourceType}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {episodes.length === 0 ? (
          <div className="glass-card p-8 text-sm text-white/62">No episodes matched these filters.</div>
        ) : (
          episodes.map((episode) => (
            <article key={episode.id} className="glass-card overflow-hidden p-4">
              <div className="grid gap-4 lg:grid-cols-[11rem_1fr_auto] lg:items-center">
                <div className="relative aspect-video overflow-hidden rounded-2xl bg-token-muted">
                  <SafeImage
                    src={episode.thumbnail || anime.bannerImage}
                    alt=""
                    fill
                    sizes="11rem"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {episode.isHidden ? <span className="chip-hot">Hidden</span> : null}
                    <span className="chip">EP {episode.number}</span>
                    <span className="chip">{sourceTypeOf(episode)}</span>
                    {episode.embeddable === false ? <span className="chip-hot">Not embeddable</span> : <span className="chip">Embeddable</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-black text-white">{episode.title}</h2>
                  <p className="mt-1 text-sm text-white/52">{episode.youtubeVideoId || episode.directVideoUrl || episode.videoUrl || episode.officialVideoUrl || "No source URL"}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/42">{episode.duration} / {episode.releaseDate}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-[20rem] lg:justify-end">
                  <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes/${encodeURIComponent(episode.id)}/edit`} className="button-secondary px-4 py-2 text-xs">
                    <Edit3 className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                  <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => toggleEpisodeHidden(episode.id)}>
                    {episode.isHidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
                    {episode.isHidden ? "Unhide" : "Hide"}
                  </button>
                  <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => moveEpisode(episode.id, -1)}>Up</button>
                  <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => moveEpisode(episode.id, 1)}>Down</button>
                  <button type="button" className="button-danger px-4 py-2 text-xs" onClick={() => deleteEpisode(episode.id)}>
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
