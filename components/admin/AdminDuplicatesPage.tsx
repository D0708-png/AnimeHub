"use client";

import Link from "next/link";
import { ArrowLeft, EyeOff, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type DuplicateAnimeItem,
  type DuplicateEpisodeItem,
  type DuplicateGroup,
  findDuplicateAnime,
  findDuplicateEpisodes,
  normalizeTitle
} from "@/lib/catalog";
import type { Anime } from "@/types/anime";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFullAdminCatalog } from "./useFullAdminCatalog";

function animeItemId(item: DuplicateAnimeItem) {
  return item.anime.id;
}

function episodeItemId(item: DuplicateEpisodeItem) {
  return `${item.anime.id}:${item.episode.id}`;
}

function groupSearchText<T>(
  group: DuplicateGroup<T>,
  getText: (item: T) => string
) {
  return normalizeTitle([
    group.label,
    group.reason,
    ...group.items.map(getText)
  ].join(" "));
}

function selectedOrFirst<T>(
  selectedByGroup: Record<string, string>,
  group: DuplicateGroup<T>,
  getId: (item: T) => string
) {
  return selectedByGroup[group.id] ?? getId(group.items[0]);
}

export function AdminDuplicatesPage() {
  const {
    catalog,
    baseLoaded,
    hasHydrated,
    upsertAnime,
    deleteAnime
  } = useFullAdminCatalog();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});

  const animeGroups = useMemo(() => findDuplicateAnime(catalog), [catalog]);
  const episodeGroups = useMemo(() => findDuplicateEpisodes(catalog), [catalog]);
  const normalizedQuery = normalizeTitle(debouncedQuery);

  const filteredAnimeGroups = useMemo(
    () =>
      normalizedQuery
        ? animeGroups.filter((group) =>
            groupSearchText(group, (item) => `${item.anime.title} ${item.anime.youtubePlaylistId ?? ""}`)
              .includes(normalizedQuery)
          )
        : animeGroups,
    [animeGroups, normalizedQuery]
  );
  const filteredEpisodeGroups = useMemo(
    () =>
      normalizedQuery
        ? episodeGroups.filter((group) =>
            groupSearchText(
              group,
              (item) =>
                `${item.anime.title} ${item.episode.title} ${item.episode.youtubeVideoId} ${item.episode.youtubePlaylistId ?? ""} ${item.episode.directVideoUrl ?? ""} ${item.episode.videoUrl ?? ""}`
            ).includes(normalizedQuery)
          )
        : episodeGroups,
    [episodeGroups, normalizedQuery]
  );

  function choose(groupId: string, itemId: string) {
    setSelectedByGroup((current) => ({
      ...current,
      [groupId]: itemId
    }));
  }

  function hideAnimeOthers(group: DuplicateGroup<DuplicateAnimeItem>) {
    const keepId = selectedOrFirst(selectedByGroup, group, animeItemId);

    if (!window.confirm("Hide all duplicate anime in this group except the selected item?")) {
      return;
    }

    for (const item of group.items) {
      upsertAnime(
        {
          ...item.anime,
          isHidden: item.anime.id !== keepId ? true : item.anime.isHidden
        },
        "Duplicate anime visibility updated locally"
      );
    }
  }

  function deleteAnimeOthers(group: DuplicateGroup<DuplicateAnimeItem>) {
    const keepId = selectedOrFirst(selectedByGroup, group, animeItemId);

    if (!window.confirm("Delete local duplicate anime overrides except the selected item?")) {
      return;
    }

    for (const item of group.items) {
      if (item.anime.id !== keepId) {
        deleteAnime(item.anime.id);
      }
    }
  }

  function updateEpisodesForGroup(
    group: DuplicateGroup<DuplicateEpisodeItem>,
    mode: "hide" | "delete"
  ) {
    const keepId = selectedOrFirst(selectedByGroup, group, episodeItemId);

    if (
      !window.confirm(
        mode === "hide"
          ? "Hide all duplicate videos in this group except the selected item?"
          : "Delete all duplicate videos in this group except the selected item?"
      )
    ) {
      return;
    }

    const affectedAnime = new Map<string, Anime>();

    for (const item of group.items) {
      affectedAnime.set(item.anime.id, item.anime);
    }

    for (const anime of affectedAnime.values()) {
      upsertAnime(
        {
          ...anime,
          episodes:
            mode === "hide"
              ? anime.episodes.map((episode) =>
                  group.items.some((item) => item.anime.id === anime.id && item.episode.id === episode.id) &&
                  `${anime.id}:${episode.id}` !== keepId
                    ? { ...episode, isHidden: true }
                    : episode
                )
              : anime.episodes.filter(
                  (episode) =>
                    `${anime.id}:${episode.id}` === keepId ||
                    !group.items.some((item) => item.anime.id === anime.id && item.episode.id === episode.id)
                )
        },
        mode === "hide" ? "Duplicate videos hidden locally" : "Duplicate videos deleted locally"
      );
    }
  }

  if (!baseLoaded || !hasHydrated) {
    return <div className="glass-card p-8 text-sm text-white/62">Loading duplicate tools...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              Admin tools
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">Duplicate Check</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Duplicate handling is manual. Public pages only hide items explicitly marked hidden.
            </p>
          </div>
          <Link href="/admin/anime" className="button-secondary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Anime
          </Link>
        </div>
      </div>

      <div className="glass-card p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
          <input
            className="form-field pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search duplicate groups by title, playlist, video ID, or URL..."
          />
        </label>
      </div>

      <DuplicateSection
        title={`Anime duplicates (${filteredAnimeGroups.length})`}
        empty="No duplicate anime groups found."
        groups={filteredAnimeGroups}
        getId={animeItemId}
        getTitle={(item) => item.anime.title}
        getMeta={(item) =>
          `${item.anime.sourceName} / ${item.anime.youtubePlaylistId ?? item.anime.playlistId ?? "No playlist"}${item.anime.isHidden ? " / Hidden" : ""}`
        }
        selectedByGroup={selectedByGroup}
        onChoose={choose}
        onHide={hideAnimeOthers}
        onDelete={deleteAnimeOthers}
      />

      <DuplicateSection
        title={`Video duplicates (${filteredEpisodeGroups.length})`}
        empty="No duplicate video groups found."
        groups={filteredEpisodeGroups}
        getId={episodeItemId}
        getTitle={(item) => `${item.anime.title} / ${item.episode.title}`}
        getMeta={(item) =>
          `EP ${item.episode.number} / ${item.episode.youtubeVideoId || item.episode.directVideoUrl || item.episode.videoUrl || "No source"}${item.episode.isHidden ? " / Hidden" : ""}`
        }
        selectedByGroup={selectedByGroup}
        onChoose={choose}
        onHide={(group) => updateEpisodesForGroup(group, "hide")}
        onDelete={(group) => updateEpisodesForGroup(group, "delete")}
      />
    </div>
  );
}

interface DuplicateSectionProps<T> {
  title: string;
  empty: string;
  groups: DuplicateGroup<T>[];
  getId: (item: T) => string;
  getTitle: (item: T) => string;
  getMeta: (item: T) => string;
  selectedByGroup: Record<string, string>;
  onChoose: (groupId: string, itemId: string) => void;
  onHide: (group: DuplicateGroup<T>) => void;
  onDelete: (group: DuplicateGroup<T>) => void;
}

function DuplicateSection<T>({
  title,
  empty,
  groups,
  getId,
  getTitle,
  getMeta,
  selectedByGroup,
  onChoose,
  onHide,
  onDelete
}: DuplicateSectionProps<T>) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      {groups.length === 0 ? (
        <div className="glass-card p-6 text-sm text-white/62">{empty}</div>
      ) : (
        groups.map((group) => {
          const selected = selectedOrFirst(selectedByGroup, group, getId);

          return (
            <article key={group.id} className="glass-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">{group.label}</h3>
                  <p className="mt-1 text-sm text-white/58">{group.reason}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="button-secondary px-4 py-2 text-xs" onClick={() => onHide(group)}>
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    Hide Others
                  </button>
                  <button type="button" className="button-danger px-4 py-2 text-xs" onClick={() => onDelete(group)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete Others
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {group.items.map((item) => {
                  const itemId = getId(item);

                  return (
                    <label
                      key={itemId}
                      className="grid gap-2 rounded-2xl border border-token bg-token-card p-3 text-sm sm:grid-cols-[auto_1fr]"
                    >
                      <input
                        type="radio"
                        name={group.id}
                        checked={selected === itemId}
                        onChange={() => onChoose(group.id, itemId)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-black text-white">{getTitle(item)}</span>
                        <span className="mt-1 block text-white/58">{getMeta(item)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
