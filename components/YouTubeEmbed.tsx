import { ExternalLink, PlayCircle } from "lucide-react";
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from "@/lib/youtube";

interface YouTubeEmbedProps {
  title: string;
  videoId?: string;
  officialUrl: string;
  sourceName: string;
  availabilityNote: string;
}

export function YouTubeEmbed({
  title,
  videoId,
  officialUrl,
  sourceName,
  availabilityNote
}: YouTubeEmbedProps) {
  const embedUrl = buildYouTubeEmbedUrl(videoId);
  const watchUrl = buildYouTubeWatchUrl(videoId);

  if (!embedUrl) {
    return (
      <section className="grid min-h-[24rem] place-items-center rounded-3xl border border-white/10 bg-night p-8 text-center text-white shadow-soft">
        <div className="max-w-2xl">
          <PlayCircle className="mx-auto h-14 w-14 text-lemon" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-black">Source player pending</h2>
          <p className="mt-3 text-sm leading-6 text-white/72">{availabilityNote}</p>
          <p className="mt-3 text-sm leading-6 text-white/72">
            Open the source page for {sourceName} when playback is not available here.
          </p>
          <a
            href={officialUrl}
            target="_blank"
            rel="noreferrer"
            className="button-secondary mt-6"
          >
            Open Source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-night shadow-soft">
      <div className="aspect-video">
        <iframe
          className="h-full w-full border-0 bg-black"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-white/10 p-4 text-sm text-white/72 sm:flex-row sm:items-center sm:justify-between">
        <span>Watch through the supported source player.</span>
        {watchUrl ? (
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-bold text-white transition hover:text-lemon"
          >
            Open Source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
