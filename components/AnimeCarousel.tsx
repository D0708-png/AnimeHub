"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import type { Anime } from "@/types/anime";
import { prefersReducedMotion, registerScrollTrigger } from "@/lib/gsap";
import { AnimeCard } from "./AnimeCard";
import { EmptyState } from "./EmptyState";

interface AnimeCarouselProps {
  anime: Anime[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function AnimeCarousel({
  anime,
  emptyTitle = "No titles yet",
  emptyDescription = "New titles will appear here when available."
}: AnimeCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root || anime.length === 0 || prefersReducedMotion()) {
      return;
    }

    registerScrollTrigger();

    const context = gsap.context(() => {
      gsap.fromTo(
        ".carousel-card",
        { autoAlpha: 0, x: 14 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.42,
          ease: "power3.out",
          stagger: 0.035,
          scrollTrigger: {
            trigger: root,
            start: "top 82%",
            once: true
          }
        }
      );
    }, root);

    return () => context.revert();
  }, [anime.length]);

  function scrollByPage(direction: "previous" | "next") {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      left: direction === "next" ? scroller.clientWidth * 0.86 : -scroller.clientWidth * 0.86,
      behavior: "smooth"
    });
  }

  if (anime.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          className="button-icon"
          onClick={() => scrollByPage("previous")}
          aria-label="Scroll carousel left"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="button-icon"
          onClick={() => scrollByPage("next")}
          aria-label="Scroll carousel right"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {anime.map((item) => (
          <div
            key={item.id}
            className="carousel-card min-w-[72vw] snap-start sm:min-w-[18rem] md:min-w-[20rem] lg:min-w-[21rem]"
          >
            <AnimeCard anime={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
