"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Link2, Save } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { showToast } from "@/components/ToastProvider";
import { extractYouTubePlaylistId, normalizeAnimeStatus } from "@/lib/catalog";
import type { Anime } from "@/types/anime";
import {
  adminSourceTypes,
  adminStatuses,
  cloneAnime,
  createManualAnime,
  slugifyAdmin
} from "./adminRouteHelpers";
import { useFullAdminCatalog } from "./useFullAdminCatalog";

interface AdminAnimeEditPageProps {
  animeId?: string;
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

export function AdminAnimeEditPage({ animeId }: AdminAnimeEditPageProps) {
  const router = useRouter();
  const { catalog, baseLoaded, hasHydrated, upsertAnime } = useFullAdminCatalog();
  const [draft, setDraft] = useState<Anime | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [playlistInput, setPlaylistInput] = useState("");
  const [imageFieldsTouched, setImageFieldsTouched] = useState(false);
  const isNew = !animeId;

  const selectedAnime = useMemo(
    () => (animeId ? catalog.find((anime) => anime.id === animeId) : null),
    [animeId, catalog]
  );

  useEffect(() => {
    if (!baseLoaded || !hasHydrated || loadedKey) {
      return;
    }

    if (isNew) {
      const anime = createManualAnime();
      setDraft(anime);
      setLoadedKey(anime.id);
      setImageFieldsTouched(false);
      return;
    }

    if (selectedAnime) {
      setDraft(cloneAnime(selectedAnime));
      setLoadedKey(selectedAnime.id);
      setImageFieldsTouched(false);
    }
  }, [baseLoaded, hasHydrated, isNew, loadedKey, selectedAnime]);

  function updateDraft<K extends keyof Anime>(key: K, value: Anime[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function textField(key: keyof Anime) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      updateDraft(key, event.target.value as never);
    };
  }

  function imageField(key: "posterImage" | "bannerImage" | "cardThumbnail" | "heroImage") {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setImageFieldsTouched(true);
      updateDraft(key, event.target.value as never);
    };
  }

  async function saveDraft() {
    if (!draft) {
      return;
    }

    if (!draft.title.trim()) {
      showToast({ message: "Title is required", tone: "danger" });
      return;
    }

    const title = draft.title.trim();
    const slug = (draft.slug || slugifyAdmin(title)).trim();

    if (!slug) {
      showToast({ message: "Slug is required", tone: "danger" });
      return;
    }

    const nextAnime: Anime = {
      ...draft,
      title,
      slug,
      originalTitle: draft.originalTitle.trim() || title,
      shortSynopsis: draft.shortSynopsis.trim() || draft.synopsis.slice(0, 160),
      genres: draft.genres.length ? draft.genres : ["Official YouTube"],
      status: normalizeAnimeStatus(String(draft.status)),
      featuredRank: draft.featuredRank ? Number(draft.featuredRank) : undefined,
      trendingRank: draft.trendingRank ? Number(draft.trendingRank) : undefined,
      ongoingRank: draft.ongoingRank ? Number(draft.ongoingRank) : undefined
    };

    const saved = await upsertAnime(nextAnime, isNew ? "Anime added" : "Anime editor saved");

    if (saved && isNew) {
      router.replace(`/admin/anime/${encodeURIComponent(nextAnime.id)}/edit`);
    }
  }

  function applyPlaylistInput() {
    if (!draft) {
      return;
    }

    const playlistId = extractYouTubePlaylistId(playlistInput);

    if (!playlistId) {
      showToast({ message: "No YouTube playlist ID found", tone: "danger" });
      return;
    }

    updateDraft("youtubePlaylistId", playlistId);
    updateDraft("playlistId", playlistId);
    updateDraft("officialPlaylistUrl", `https://www.youtube.com/playlist?list=${playlistId}`);
    updateDraft("sourceType", "youtube");
    setPlaylistInput("");
    showToast({ message: "Playlist ID extracted", tone: "success" });
  }

  function markReviewed() {
    if (!draft) {
      return;
    }

    const nextDraft: Anime = {
      ...draft,
      metadataNeedsReview: false,
      metadataReviewedAt: new Date().toISOString()
    };

    setDraft(nextDraft);
    setImageFieldsTouched(false);
    void upsertAnime(nextDraft, "Metadata review marked done");
  }

  if (!baseLoaded || !hasHydrated) {
    return <div className="glass-card p-8 text-sm text-white/62">Loading anime editor...</div>;
  }

  if (!draft && !isNew) {
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

  if (!draft) {
    return <div className="glass-card p-8 text-sm text-white/62">Preparing editor...</div>;
  }

  const heroLabel =
    draft.isFeatured && Number(draft.featuredRank) === 1
      ? "Main Hero Background Image"
      : "Hero Image";

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan">
              {isNew ? "New Anime" : "Anime Editor"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{draft.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">
              Changes are saved to the site catalog. Updates may take a moment to appear across devices.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/anime" className="button-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Link>
            <button type="button" className="button-primary" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
            {draft.metadataNeedsReview === true ? (
              <button type="button" className="button-secondary" onClick={markReviewed}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark Reviewed
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {draft.metadataNeedsReview === true ? (
        <div className="glass-card border-cyan/25 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="chip-hot">Needs Poster Review</span>
              <p className="mt-3 text-sm leading-6 text-token-muted">
                This anime needs poster/metadata review. Add or replace the card thumbnail, poster image, banner image, or hero image, then mark it as reviewed.
              </p>
              {imageFieldsTouched ? (
                <p className="mt-2 text-sm font-bold text-token-foreground">
                  Image fields changed. Review the preview/source, then use Mark Reviewed when it looks right.
                </p>
              ) : null}
            </div>
            <button type="button" className="button-secondary shrink-0" onClick={markReviewed}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Mark as Reviewed
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <form className="glass-card grid gap-4 p-5" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title">
              <input className="form-field" value={draft.title} onChange={textField("title")} />
            </Field>
            <Field label="Original Title">
              <input className="form-field" value={draft.originalTitle} onChange={textField("originalTitle")} />
            </Field>
            <Field label="Slug">
              <input className="form-field" value={draft.slug} onChange={textField("slug")} />
            </Field>
            <Field label="Genres">
              <input
                className="form-field"
                value={draft.genres.join(", ")}
                onChange={(event) =>
                  updateDraft(
                    "genres",
                    event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Action, Fantasy, Official YouTube"
              />
            </Field>
            <Field label="Synopsis">
              <textarea className="min-h-36 rounded-2xl border border-token bg-token-card p-3 text-sm text-token-foreground" value={draft.synopsis} onChange={textField("synopsis")} />
            </Field>
            <Field label="Short Synopsis">
              <textarea className="min-h-36 rounded-2xl border border-token bg-token-card p-3 text-sm text-token-foreground" value={draft.shortSynopsis} onChange={textField("shortSynopsis")} />
            </Field>
            <Field label="Year">
              <input className="form-field" type="number" value={draft.year} onChange={(event) => updateDraft("year", Number(event.target.value) || new Date().getFullYear())} />
            </Field>
            <Field label="Status">
              <select className="form-field" value={draft.status} onChange={textField("status")}>
                {adminStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Studio">
              <input className="form-field" value={draft.studio} onChange={textField("studio")} />
            </Field>
            <Field label="Rating">
              <input className="form-field" value={String(draft.rating)} onChange={(event) => updateDraft("rating", Number(event.target.value) || event.target.value)} />
            </Field>
            <Field label="Poster Image">
              <input className="form-field" value={draft.posterImage} onChange={imageField("posterImage")} />
            </Field>
            <Field label="Banner Image">
              <input className="form-field" value={draft.bannerImage} onChange={imageField("bannerImage")} />
            </Field>
            <Field label="Main Menu Thumbnail">
              <input className="form-field" value={draft.cardThumbnail ?? ""} onChange={imageField("cardThumbnail")} />
            </Field>
            <Field label={heroLabel}>
              <input className="form-field" value={draft.heroImage ?? ""} onChange={imageField("heroImage")} />
            </Field>
            <Field label="Source Name">
              <input className="form-field" value={draft.sourceName} onChange={textField("sourceName")} />
            </Field>
            <Field label="Source Channel URL">
              <input className="form-field" value={draft.sourceChannelUrl} onChange={textField("sourceChannelUrl")} />
            </Field>
            <Field label="YouTube Playlist ID">
              <input className="form-field" value={draft.youtubePlaylistId ?? ""} onChange={(event) => updateDraft("youtubePlaylistId", event.target.value)} />
            </Field>
            <Field label="Official Playlist URL">
              <input className="form-field" value={draft.officialPlaylistUrl ?? ""} onChange={(event) => updateDraft("officialPlaylistUrl", event.target.value)} />
            </Field>
            <Field label="Source Type">
              <select className="form-field" value={draft.sourceType ?? "manual"} onChange={(event) => updateDraft("sourceType", event.target.value as never)}>
                {adminSourceTypes.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>{sourceType}</option>
                ))}
              </select>
            </Field>
          </div>
        </form>

        <aside className="glass-card h-max space-y-5 p-5 lg:sticky lg:top-24">
          <div>
            <h2 className="text-xl font-black text-white">Publishing</h2>
            <p className="mt-1 text-sm text-white/58">These flags control public homepage placement after sync.</p>
          </div>

          <div className="grid gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-token bg-token-card p-3 text-sm font-black text-white">
              <input
                type="checkbox"
                checked={Boolean(draft.isHidden)}
                onChange={(event) => {
                  if (event.target.checked && !window.confirm("Hide this anime from public pages?")) {
                    return;
                  }

                  updateDraft("isHidden", event.target.checked);
                }}
              />
              Hidden from public pages
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-token bg-token-card p-3 text-sm font-black text-white">
              <input type="checkbox" checked={Boolean(draft.isFeatured)} onChange={(event) => updateDraft("isFeatured", event.target.checked)} />
              Featured
            </label>
            <Field label="Featured Rank">
              <input className="form-field" type="number" min={1} value={draft.featuredRank ?? ""} onChange={(event) => updateDraft("featuredRank", Number(event.target.value) || undefined)} />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-token bg-token-card p-3 text-sm font-black text-white">
              <input type="checkbox" checked={Boolean(draft.isTrending)} onChange={(event) => updateDraft("isTrending", event.target.checked)} />
              Trending
            </label>
            <Field label="Trending Rank">
              <input className="form-field" type="number" min={1} value={draft.trendingRank ?? ""} onChange={(event) => updateDraft("trendingRank", Number(event.target.value) || undefined)} />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-token bg-token-card p-3 text-sm font-black text-white">
              <input type="checkbox" checked={Boolean(draft.isOngoingSection)} onChange={(event) => updateDraft("isOngoingSection", event.target.checked)} />
              Show in Ongoing Anime section
            </label>
            <Field label="Ongoing Rank">
              <input className="form-field" type="number" min={1} value={draft.ongoingRank ?? ""} onChange={(event) => updateDraft("ongoingRank", Number(event.target.value) || undefined)} />
            </Field>
          </div>

          <div className="border-t border-token pt-5">
            <h2 className="text-xl font-black text-white">Import Tools</h2>
            <p className="mt-1 text-sm text-white/58">Paste an official YouTube playlist URL. No scraping or API key is used here.</p>
            <div className="mt-3 grid gap-2">
              <input className="form-field" value={playlistInput} onChange={(event) => setPlaylistInput(event.target.value)} placeholder="https://www.youtube.com/playlist?list=..." />
              <button type="button" className="button-secondary px-4 py-2" onClick={applyPlaylistInput}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Extract Playlist ID
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-token pt-5">
            <button type="button" className="button-primary" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
            <Link href="/admin/anime" className="button-secondary">
              Cancel
            </Link>
            <Link href={`/admin/anime/${encodeURIComponent(draft.id)}/episodes`} className="button-secondary">
              Episodes
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
