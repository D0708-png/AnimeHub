"use client";

import Link from "next/link";
import { Info, PlayCircle, Sparkles } from "lucide-react";
import { MouseEvent, useEffect, useRef } from "react";
import gsap from "gsap";
import type { Anime } from "@/types/anime";
import { getPublicAnimeSynopsis } from "@/lib/catalog";
import { SafeImage } from "./SafeImage";
import { SourceBadge } from "./SourceBadge";
import { WatchlistButton } from "./WatchlistButton";

interface HeroSectionProps {
  anime: Anime;
}

export function HeroSection({ anime }: HeroSectionProps) {
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const firstEpisode = anime.episodes[0];
  const heroBackground = anime.heroImage || anime.bannerImage || anime.posterImage;
  const posterImage = anime.cardThumbnail || anime.posterImage || anime.bannerImage;
  const synopsis = getPublicAnimeSynopsis(anime);

  useEffect(() => {
    const root = rootRef.current;
    const title = titleRef.current;
    const poster = posterRef.current;

    if (!root || !title || !poster || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        title.querySelectorAll(".hero-word"),
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.52,
          ease: "power3.out",
          stagger: 0.04
        }
      );
      gsap.fromTo(
        poster,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.58, ease: "power3.out", delay: 0.12 }
      );
    }, root);

    return () => context.revert();
  }, []);

  function handlePointerMove(event: MouseEvent<HTMLElement>) {
    const root = rootRef.current;
    const poster = posterRef.current;

    if (!root || !poster || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    gsap.to(poster, {
      x: x * 12,
      y: y * 12,
      rotateY: x * -4,
      rotateX: y * 4,
      duration: 0.35,
      ease: "power3.out"
    });
  }

  function resetPoster() {
    const poster = posterRef.current;

    if (!poster) {
      return;
    }

    gsap.to(poster, {
      x: 0,
      y: 0,
      rotateX: 0,
      rotateY: 0,
      duration: 0.35,
      ease: "power3.out"
    });
  }

  return (
    <section
      ref={rootRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPoster}
      className="relative -mt-[4.25rem] min-h-[100svh] overflow-hidden pt-[5.25rem]"
    >
      <div className="absolute inset-0 opacity-55" aria-hidden="true">
        <SafeImage
          src={heroBackground}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--background)] to-transparent" />

      <div className="container-page relative grid min-h-[calc(100svh-4rem)] items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <SourceBadge sourceName={anime.sourceName} />
            <span className="chip-hot">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Featured
            </span>
          </div>

          <h1
            ref={titleRef}
            className="mt-5 max-w-4xl text-4xl font-black tracking-normal text-white sm:mt-6 sm:text-6xl lg:text-7xl"
          >
            {anime.title.split(" ").map((word, index) => (
              <span
                className="hero-word mr-3 inline-block will-change-transform"
                key={`${word}-${index}`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 sm:text-lg sm:leading-8">
            {synopsis}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {anime.genres.map((genre) => (
              <span className="chip" key={genre}>
                {genre}
              </span>
            ))}
            <span className="chip">{anime.rating}</span>
            <span className="chip">{anime.year}</span>
          </div>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            {firstEpisode ? (
              <Link href={`/watch/${anime.slug}/${firstEpisode.number}`} className="button-primary">
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                Watch Now
              </Link>
            ) : null}
            <Link href={`/anime/${anime.slug}`} className="button-secondary">
              <Info className="h-5 w-5" aria-hidden="true" />
              View Details
            </Link>
            <WatchlistButton animeId={anime.id} animeSlug={anime.slug} />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[18rem] sm:max-w-[24rem] lg:max-w-[28rem]">
          <div className="absolute -inset-4 rounded-[2rem] bg-cyan/10 blur-2xl" />
          <div
            ref={posterRef}
            className="media-on-image relative aspect-[3/4] overflow-hidden rounded-[1.5rem] border border-token bg-token-muted shadow-soft will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
            aria-label={`${anime.title} poster`}
          >
            <SafeImage
              src={posterImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 26rem, 28rem"
              className="object-cover"
            />
            <div className="thumbnail-gradient absolute inset-0 rounded-[1.5rem]" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-night/72 p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan">
                {anime.studio}
              </p>
              <p className="mt-1 text-lg font-black text-white">{anime.originalTitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
