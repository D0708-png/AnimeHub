"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

const FALLBACK_IMAGE = "/placeholders/poster-default.svg";

const allowedImageHosts = new Set([
  "i.ytimg.com",
  "img.youtube.com",
  "yt3.ggpht.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "l4.googleusercontent.com",
  "s4.anilist.co",
  "images.unsplash.com"
]);

type SafeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  fallbackSrc?: string;
  onError?: () => void;
};

function normalizeSrc(src: string | null | undefined, fallbackSrc: string) {
  const trimmed = String(src ?? "").trim();
  return trimmed || fallbackSrc;
}

function isLocalPath(src: string) {
  return src.startsWith("/");
}

function isAllowedRemoteUrl(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && allowedImageHosts.has(url.hostname);
  } catch {
    return false;
  }
}

function isExternalUrl(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function SafeImage({
  src,
  fallbackSrc = FALLBACK_IMAGE,
  alt,
  fill,
  className,
  loading,
  sizes,
  onError,
  ...props
}: SafeImageProps) {
  const initialSrc = useMemo(() => normalizeSrc(src, fallbackSrc), [fallbackSrc, src]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [hasFallenBack, setHasFallenBack] = useState(false);

  useEffect(() => {
    setCurrentSrc(initialSrc);
    setHasFallenBack(false);
  }, [initialSrc]);

  function handleError() {
    onError?.();

    if (!hasFallenBack && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasFallenBack(true);
    }
  }

  const canUseNextImage = isLocalPath(currentSrc) || isAllowedRemoteUrl(currentSrc);
  const shouldUseNativeImage = !canUseNextImage && isExternalUrl(currentSrc);
  const resolvedLoading = props.priority ? undefined : loading ?? "lazy";

  if (shouldUseNativeImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        loading={loading === "eager" ? "eager" : "lazy"}
        className={clsx(fill && "absolute inset-0 h-full w-full", className)}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      {...props}
      src={canUseNextImage ? currentSrc : fallbackSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      loading={resolvedLoading}
      className={className}
      onError={handleError}
    />
  );
}
