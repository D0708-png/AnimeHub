import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  createPlayableVideoSource,
  isDirectVideoUrl
} from "@/lib/catalog";
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from "@/lib/youtube";
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
  const playableSource = createPlayableVideoSource({
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
  });
  const embedUrl = buildYouTubeEmbedUrl(youtubeVideoId, youtubePlaylistId);
  const watchUrl =
    officialVideoUrl ??
    playableSource.fallbackUrl ??
    buildYouTubeWatchUrl(youtubeVideoId, youtubePlaylistId);

  if (
    (playableSource.type === "direct" || playableSource.type === "gdrive") &&
    playableSource.canPlayInline &&
    playableSource.url &&
    (playableSource.type === "gdrive" || isDirectVideoUrl(playableSource.url))
  ) {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/90 px-4 py-3">
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
        <div className="aspect-video">
          <video
            className="h-full w-full bg-black"
            controls
            preload="metadata"
            src={playableSource.url}
            title={title}
          />
        </div>
        {playableSource.warning ? (
          <p className="border-t border-white/10 bg-black/90 px-4 py-3 text-xs font-semibold text-white/58">
            {playableSource.warning}
          </p>
        ) : null}
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div className="grid aspect-video place-items-center rounded-3xl border border-white/10 bg-night p-6 text-center shadow-soft">
        <div className="max-w-xl">
          <AlertTriangle className="mx-auto h-10 w-10 text-ember" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black text-white">Open Source</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            This video is available through its source player. Open it in a new tab to watch.
          </p>
          {watchUrl ? (
            <a href={watchUrl} target="_blank" rel="noreferrer" className="button-primary mt-5">
              Open Source
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="grid aspect-video place-items-center rounded-3xl border border-white/10 bg-night p-6 text-center shadow-soft">
        <div className="max-w-xl">
          <AlertTriangle className="mx-auto h-10 w-10 text-ember" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black text-white">Source unavailable</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            This episode does not have a supported player yet. Try opening the source page if one is available.
          </p>
          {watchUrl ? (
            <a href={watchUrl} target="_blank" rel="noreferrer" className="button-primary mt-5">
              Open Source
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/90 px-4 py-3">
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
      <div className="aspect-video">
        <iframe
          className="h-full w-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}
