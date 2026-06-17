import { Tv } from "lucide-react";
import { LEGAL_DISCLAIMER, SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-token bg-token-card">
      <div className="container-page py-10 text-sm text-token-muted">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-token bg-token-muted text-cyan shadow-sm">
            <Tv className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-lg font-black text-token-foreground">{SITE_NAME}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-token-muted">
            Anime discovery and viewing
          </p>
          <p className="mt-5 max-w-3xl leading-7">
            AnimeHub helps fans discover and organize anime collections in a clean, modern viewing experience. Availability and playback are provided through supported content sources.
          </p>
          <p className="mt-4 max-w-4xl leading-7">{LEGAL_DISCLAIMER}</p>
        </div>
      </div>
    </footer>
  );
}
