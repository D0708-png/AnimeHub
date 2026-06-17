"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let scrollTriggerRegistered = false;

export function prefersReducedMotion() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function registerScrollTrigger() {
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
}

export function animateMagneticButton(element: HTMLElement, active: boolean) {
  if (prefersReducedMotion()) {
    return;
  }

  gsap.to(element, {
    scale: active ? 1.04 : 1,
    y: active ? -2 : 0,
    duration: 0.28,
    ease: "power3.out"
  });
}
