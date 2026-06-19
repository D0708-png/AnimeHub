"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link2, Save } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { showToast } from "@/components/ToastProvider";
import {
  createEpisodeSynopsis,
  extractYouTubePlaylistId,
  extractYouTubeVideoId,
  isDirectVideoUrl,
  isGoogleDriveUrl
} from "@/lib/catalog";
import type { AnimeEpisode, VideoSourceType } from "@/types/anime";
import {
  adminSourceTypes,
  createManualEpisode
} from "./adminRouteHelpers";
import { useFullAdminCatalog } from "./useFullAdminCatalog";

interface AdminEpisodeEditPageProps {
  animeId: string;
  episodeId?: string;
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-white/70">
      <span>{label}</span>
      {children}
    </label>
  );
}

function sourceFromUrl(input: string): VideoSourceType {
  if (isGoogleDriveUrl(input)) {
    return "gdrive";
  }

  if (isDirectVideoUrl(input)) {
    return "direct";
  }

  return "manual";
}

export function AdminEpisodeEditPage({ animeId, episodeId }: AdminEpisodeEditPageProps) {
  const router = useRouter();
  const { catalog, baseLoaded, hasHydrated, addEpisode, updateEpisode } = useFullAdminCatalog();
  const [draft, setDraft] = useState<AnimeEpisode | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [directInput, setDirectInput] = useState("");
  const isNew = !episodeId;

  const anime = useMemo(
    () => catalog.find((item) => item.id === animeId),
    [animeId, catalog]
  );
  const selectedEpisode = useMemo(
    () => anime?.episodes.find((episode) => episode.id === episodeId),
    [anime?.episodes, episodeId]
  );

  useEffect(() => {
    if (!baseLoaded || !hasHydrated || loadedKey || !anime) {
      return;
    }

    if (isNew) {
      const episode = createManualEpisode(anime, "youtube");
      setDraft(episode);
      setLoadedKey(episode.id);
      return;
    }

    if (selectedEpisode) {
      setDraft(JSON.parse(JSON.stringify(selectedEpisode)) as AnimeEpisode);
      setLoadedKey(selectedEpisode.id);
    }
  }, [anime, baseLoaded, hasHydrated, isNew, loadedKey, selectedEpisode]);

  function updateDraft<K extends keyof AnimeEpisode>(key: K, value: AnimeEpisode[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function textField(key: keyof AnimeEpisode) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateDraft(key, event.target.value as never);
    };
  }

  function applyYouTubeInput() {
    if (!draft) {
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeInput);
    const playlistId = extractYouTubePlaylistId(youtubeInput) || draft.youtubePlaylistId;

    if (!videoId) {
      showToast({ message: "No YouTube video ID found", tone: "danger" });
      return;
    }

    setDraft({
      ...draft,
      youtubeVideoId: videoId,
      youtubePlaylistId: playlistId,
      officialVideoUrl: `https://www.youtube.com/watch?v=${videoId}${playlistId ? `&list=${playlistId}` : ""}`,
      thumbnail: draft.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      sourceType: "youtube",
      embeddable: draft.embeddable ?? true
    });
    setYoutubeInput("");
    showToast({ message: "YouTube video ID extracted", tone: "success" });
  }

  function applyDirectInput() {
    if (!draft) {
      return;
    }

    const sourceType = sourceFromUrl(directInput);

    if (sourceType === "manual") {
      showToast({
        message: "Use a Google Drive link or a direct MP4/WebM/Ogg video URL",
        tone: "danger"
      });
      return;
    }

    setDraft({
      ...draft,
      videoUrl: directInput,
      directVideoUrl: sourceType === "direct" ? directInput : undefined,
      googleDriveUrl: sourceType === "gdrive" ? directInput : undefined,
      officialVideoUrl: directInput,
      youtubeVideoId: "",
      sourceType,
      embeddable: undefined
    });
    setDirectInput("");
    showToast({ message: "Video URL applied", tone: "success" });
  }

  async function saveDraft() {
    if (!anime || !draft) {
      return;
    }

    if (!draft.title.trim()) {
      showToast({ message: "Episode title is required", tone: "danger" });
      return;
    }

    const nextEpisode: AnimeEpisode = {
      ...draft,
      number: Number(draft.number) || 1,
      title: draft.title.trim(),
      synopsis: createEpisodeSynopsis(draft.synopsis),
      releaseDate: draft.releaseDate || new Date().toISOString(),
      duration: draft.duration || "Unknown",
      sourceType: draft.sourceType ?? "youtube",
      thumbnail: draft.thumbnail || anime.bannerImage || anime.posterImage
    };

    const saved = isNew
      ? await addEpisode(anime.id, nextEpisode)
      : await updateEpisode(anime.id, nextEpisode.id, nextEpisode);

    if (saved && isNew) {
      router.replace(
        `/admin/anime/${encodeURIComponent(anime.id)}/episodes/${encodeURIComponent(nextEpisode.id)}/edit`
      );
    }
  }

  if (!baseLoaded || !hasHydrated) {
    return <div className="glass-card p-8 text-sm text-white/62">Loading episode editor...</div>;
  }

  if (!anime) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-black text-white">Anime not found</h1>
        <p className="mt-2 text-sm text-white/62">This item may have been deleted or reset.</p>
        <Link href="/admin/anime" className="button-primary mt-5">
          Back to anime
        </Link>
      </div>
    );
  }

  if (!draft && !isNew) {
    return (
      <div className="glass-card p-8">
        <h1 className="text-2xl font-black text-white">Episode not found</h1>
        <p className="mt-2 text-sm text-white/62">This episode may have been deleted or reset.</p>
        <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes`} className="button-primary mt-5">
          Back to episodes
        </Link>
      </div>
    );
  }

  if (!draft) {
    return <div className="glass-card p-8 text-sm text-white/62">Preparing episode editor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              {isNew ? "New Episode" : "Episode Editor"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{anime.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Changes are saved to the site catalog. Source player settings update globally after refresh.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes`} className="button-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Episodes
            </Link>
            <button type="button" className="button-primary" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <form className="glass-card grid gap-4 p-5" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Episode Number">
              <input className="form-field" type="number" value={draft.number} onChange={(event) => updateDraft("number", Number(event.target.value) || 1)} />
            </Field>
            <Field label="Source Type">
              <select className="form-field" value={draft.sourceType ?? "youtube"} onChange={(event) => updateDraft("sourceType", event.target.value as never)}>
                {adminSourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>{sourceType}</option>
                ))}
              </select>
            </Field>
            <Field label="Episode Title">
              <input className="form-field" value={draft.title} onChange={textField("title")} />
            </Field>
            <Field label="Release Date">
              <input className="form-field" value={draft.releaseDate} onChange={textField("releaseDate")} />
            </Field>
            <Field label="Episode Synopsis">
              <textarea className="min-h-36 rounded-2xl border border-token bg-token-card p-3 text-sm text-token-foreground" value={draft.synopsis} onChange={textField("synopsis")} />
            </Field>
            <Field label="Thumbnail">
              <input className="form-field" value={draft.thumbnail} onChange={textField("thumbnail")} />
            </Field>
            <Field label="Duration">
              <input className="form-field" value={draft.duration} onChange={textField("duration")} />
            </Field>
            <Field label="Embeddable">
              <select
                className="form-field"
                value={draft.embeddable === false ? "false" : "true"}
                onChange={(event) => updateDraft("embeddable", event.target.value === "true")}
              >
                <option value="true">Embeddable</option>
                <option value="false">Not embeddable</option>
              </select>
            </Field>
            <Field label="YouTube Video ID">
              <input className="form-field" value={draft.youtubeVideoId} onChange={textField("youtubeVideoId")} />
            </Field>
            <Field label="YouTube Playlist ID">
              <input className="form-field" value={draft.youtubePlaylistId ?? ""} onChange={(event) => updateDraft("youtubePlaylistId", event.target.value)} />
            </Field>
            <Field label="Official Video URL">
              <input className="form-field" value={draft.officialVideoUrl ?? ""} onChange={(event) => updateDraft("officialVideoUrl", event.target.value)} />
            </Field>
            <Field label="Direct Video URL">
              <input className="form-field" value={draft.directVideoUrl ?? ""} onChange={(event) => updateDraft("directVideoUrl", event.target.value)} />
            </Field>
            <Field label="Google Drive URL">
              <input className="form-field" value={draft.googleDriveUrl ?? ""} onChange={(event) => updateDraft("googleDriveUrl", event.target.value)} />
            </Field>
            <Field label="Manual Video URL">
              <input className="form-field" value={draft.videoUrl ?? ""} onChange={(event) => updateDraft("videoUrl", event.target.value)} />
            </Field>
          </div>
        </form>

        <aside className="glass-card h-max space-y-5 p-5 lg:sticky lg:top-24">
          <div>
            <h2 className="text-xl font-black text-white">URL Tools</h2>
            <p className="mt-1 text-sm text-white/58">Paste official YouTube links or direct video URLs. This does not scrape, proxy, or download anything.</p>
          </div>

          <div className="grid gap-2">
            <input className="form-field" value={youtubeInput} onChange={(event) => setYoutubeInput(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            <button type="button" className="button-secondary px-4 py-2" onClick={applyYouTubeInput}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Extract YouTube Video
            </button>
          </div>

          <div className="grid gap-2 border-t border-token pt-5">
            <input className="form-field" value={directInput} onChange={(event) => setDirectInput(event.target.value)} placeholder="Google Drive or direct MP4/WebM/Ogg URL" />
            <button type="button" className="button-secondary px-4 py-2" onClick={applyDirectInput}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
              Apply Direct Source
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-token bg-token-card p-3 text-sm font-black text-white">
            <input
              type="checkbox"
              checked={Boolean(draft.isHidden)}
              onChange={(event) => {
                if (event.target.checked && !window.confirm("Hide this episode from public pages?")) {
                  return;
                }

                updateDraft("isHidden", event.target.checked);
              }}
            />
            Hidden from public pages
          </label>

          <div className="flex flex-wrap gap-2 border-t border-token pt-5">
            <button type="button" className="button-primary" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
            <Link href={`/admin/anime/${encodeURIComponent(anime.id)}/episodes`} className="button-secondary">
              Cancel
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
