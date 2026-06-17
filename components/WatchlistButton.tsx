"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import clsx from "clsx";
import { useRef } from "react";
import gsap from "gsap";
import { useWatchlist } from "@/hooks/useWatchlist";
import { animateMagneticButton, prefersReducedMotion } from "@/lib/gsap";

interface WatchlistButtonProps {
  animeSlug: string;
  animeId?: string;
  label?: boolean;
  className?: string;
}

export function WatchlistButton({
  animeSlug,
  animeId,
  label = true,
  className
}: WatchlistButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isInWatchlist, toggleWatchlist, hasHydrated } = useWatchlist();
  const active = hasHydrated && isInWatchlist(animeSlug);
  const Icon = active ? BookmarkCheck : Bookmark;

  function handleClick() {
    toggleWatchlist(animeSlug, animeId);

    if (buttonRef.current && !prefersReducedMotion()) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 0.92 },
        { scale: 1, duration: 0.42, ease: "elastic.out(1, 0.45)" }
      );
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onMouseEnter={(event) => animateMagneticButton(event.currentTarget, true)}
      onMouseLeave={(event) => animateMagneticButton(event.currentTarget, false)}
      className={clsx(
        "button-secondary",
        !label && "h-10 w-10 px-0",
        active && "border-cyan/35 bg-cyan/10 text-cyan",
        className
      )}
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label ? (active ? "In watchlist" : "Add to watchlist") : null}
    </button>
  );
}
