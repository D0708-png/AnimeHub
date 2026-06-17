"use client";

import { RefObject, useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion, registerScrollTrigger } from "@/lib/gsap";

interface UseGsapRevealOptions {
  selector?: string;
  y?: number;
  stagger?: number;
  start?: string;
  delay?: number;
}

export function useGsapReveal<T extends HTMLElement>(
  rootRef: RefObject<T | null>,
  {
    selector,
    y = 16,
    stagger = 0.035,
    start = "top 84%",
    delay = 0
  }: UseGsapRevealOptions = {}
) {
  useEffect(() => {
    const root = rootRef.current;

    if (!root || prefersReducedMotion()) {
      return;
    }

    registerScrollTrigger();

    const context = gsap.context(() => {
      const targets = selector ? root.querySelectorAll(selector) : root;

      gsap.fromTo(
        targets,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          delay,
          duration: 0.42,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: root,
            start,
            once: true
          }
        }
      );
    }, root);

    return () => context.revert();
  }, [delay, rootRef, selector, stagger, start, y]);
}
