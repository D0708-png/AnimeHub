"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/gsap";

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GsapReveal({ children, className, delay = 0 }: GsapRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = rootRef.current;

    if (!element || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, delay, duration: 0.4, ease: "power3.out" }
      );
    }, element);

    return () => context.revert();
  }, [delay]);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
