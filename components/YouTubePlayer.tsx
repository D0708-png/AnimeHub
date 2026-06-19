"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  createPlayableVideoSource,
  isDirectVideoUrl
} from "@/lib/catalog";
import { buildYouTubeWatchUrl, createYouTubeEmbedUrl } from "@/lib/youtube";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { VideoSourceType } from "@/types/anime";

interface YouTubePlayerProps {
  title: string;
  youtubeVideoId?: string;
  youtubePlaylistId?: string;
  officialVideoUrl?: string;
  videoUrl?: string;
  directVideoUrl?: string;
  googleDriveUrl?: string;
  sourceType?: VideoSourceType;
  embeddable?: boolean;
}

interface FallbackProps {
  title: string;
  message: string;
  sourceUrl: string | null;
}

function PlayerFallback({ title, message, sourceUrl }: FallbackProps) {
  return (
    <div className="grid aspect-video w-full place-items-center rounded-3xl border border-token bg-token-card p-6 text-center shadow-soft">
      <div className="max-w-xl">
        <AlertTriangle className="mx-auto h-10 w-10 text-ember" aria-hidden="true" />
        <h2 className="mt-4 text-2xl font-black text-token-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-token-muted">{message}</p>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="button-primary mt-5">
            Open Source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

function PlayerDebugDetails({
  sourceType,
  youtubeVideoId,
  youtubePlaylistId,
  embeddable,
  playerUrl,
  sourceUrl
}: {
  sourceType?: VideoSourceType;
  youtubeVideoId?: string;
  youtubePlaylistId?: string;
  embeddable?: boolean;
  playerUrl?: string | null;
  sourceUrl?: string | null;
}) {
  return (
    <details className="border-t border-token bg-token-muted px-4 py-3 text-xs text-token-muted">
      <summary className="cursor-pointer font-black text-token-foreground">
        Player debug
      </summary>
      <dl className="mt-3 grid gap-2 break-all sm:grid-cols-[10rem_1fr]">
        <dt className="font-bold">sourceType</dt>
        <dd>{sourceType ?? "auto"}</dd>
        <dt className="font-bold">youtubeVideoId</dt>
        <dd>{youtubeVideoId || "none"}</dd>
        <dt className="font-bold">youtubePlaylistId</dt>
        <dd>{youtubePlaylistId || "none"}</dd>
        <dt className="font-bold">embeddable</dt>
        <dd>{embeddable === undefined ? "unknown" : String(embeddable)}</dd>
        <dt className="font-bold">playerUrl</dt>
        <dd>{playerUrl || "none"}</dd>
        <dt className="font-bold">sourceUrl</dt>
        <dd>{sourceUrl || "none"}</dd>
      </dl>
    </details>
  );
}

export function YouTubePlayer({
  title,
  youtubeVideoId,
  youtubePlaylistId,
  officialVideoUrl,
  videoUrl,
  directVideoUrl,
  googleDriveUrl,
  sourceType,
  embeddable
}: YouTubePlayerProps) {
  const [nativeVideoFailed, setNativeVideoFailed] = useState(false);
  const { isAdmin } = useAuthSession();
  const playableSource = useMemo(
    () =>
      createPlayableVideoSource({
        id: "player-source",
        number: 0,
        title,
        synopsis: "",
        youtubeVideoId: youtubeVideoId ?? "",
        youtubePlaylistId,
        officialVideoUrl,
        videoUrl,
        directVideoUrl,
        googleDriveUrl,
        sourceType,
        embeddable,
        thumbnail: "",
        duration: "",
        releaseDate: ""
      }),
    [
      directVideoUrl,
      embeddable,
      googleDriveUrl,
      officialVideoUrl,
      sourceType,
      title,
      videoUrl,
      youtubePlaylistId,
      youtubeVideoId
    ]
  );
  const embedUrl = createYouTubeEmbedUrl({ youtubeVideoId, youtubePlaylistId });
  const watchUrl =
    officialVideoUrl ??
    playableSource.fallbackUrl ??
    buildYouTubeWatchUrl(youtubeVideoId, youtubePlaylistId) ??
    null;
  const showDebug = process.env.NODE_ENV !== "production" || isAdmin;
  const debugDetails = showDebug ? (
    <PlayerDebugDetails
      sourceType={sourceType}
      youtubeVideoId={youtubeVideoId}
      youtubePlaylistId={youtubePlaylistId}
      embeddable={embeddable}
      playerUrl={playableSource.type === "youtube" ? embedUrl : playableSource.url}
      sourceUrl={watchUrl}
    />
  ) : null;

  if (
    !nativeVideoFailed &&
    (playableSource.type === "direct" || playableSource.type === "gdrive") &&
    playableSource.canPlayInline &&
    playableSource.url &&
    (playableSource.type === "gdrive" || isDirectVideoUrl(playableSource.url))
  ) {
    return (
      <div className="w-full overflow-hidden rounded-3xl border border-token bg-black shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black px-4 py-3">
          <span className="chip-hot">{playableSource.label}</span>
          {watchUrl ? (
            <a
              href={watchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black text-white/72 transition hover:text-cyan"
            >
              Open Source
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
        <div className="aspect-video w-full bg-black">
          <video
            className="h-full w-full bg-black"
            controls
            playsInline
            preload="metadata"
            src={playableSource.url}
            title={title}
            onError={() => setNativeVideoFailed(true)}
          />
        </div>
        {playableSource.warning ? (
          <p className="border-t border-white/10 bg-black px-4 py-3 text-xs font-semibold text-white/58">
            {playableSource.warning}
          </p>
        ) : null}
        {debugDetails}
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div className="w-full overflow-hidden rounded-3xl shadow-soft">
        <PlayerFallback
          title="Open Source"
          message="This episode cannot be played here on this device. You can continue watching from the source."
          sourceUrl={watchUrl}
        />
        {debugDetails}
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="w-full overflow-hidden rounded-3xl shadow-soft">
        <PlayerFallback
          title="Source unavailable"
          message="This episode is not available in the player yet. You can continue from the source when available."
          sourceUrl={watchUrl}
        />
        {debugDetails}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black px-4 py-3">
        <span className="chip-hot">Source player</span>
        {watchUrl ? (
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-black text-white/72 transition hover:text-cyan"
          >
            Open Source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe
          className="h-full w-full border-0 bg-black"
          src={embedUrl}
          title={`${title} player`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {debugDetails}
    </div>
  );
}
