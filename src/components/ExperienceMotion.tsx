"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "motion/react";

/** Enhances existing paper objects without changing their layout or controls. */
export default function ExperienceMotion({ root }: { root: RefObject<HTMLElement | null> }) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = root.current;
    if (!element || reduced) return;
    const selector = ".gallery-grid > *, .game-preview, .home-world-links > a, .world-object, .world-hub-art, .world-group-heading, .world-feature-heading, .world-envelope, .capsule-jar, .private-paper, .keepsake-object";
    const observed = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("paper-visible");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    const discover = () => {
      element.querySelectorAll<HTMLElement>(selector).forEach((item) => {
        if (observed.has(item)) return;
        observed.add(item);
        item.classList.add("paper-motion");
        const siblings = item.parentElement ? [...item.parentElement.children] : [];
        item.style.setProperty("--arrival-delay", `${Math.max(0, siblings.indexOf(item)) % 3 * 90}ms`);
        observer.observe(item);
      });
    };
    discover();
    const mutations = new MutationObserver(discover);
    mutations.observe(element, { childList: true, subtree: true });
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let active: HTMLElement | null = null;
    let frame = 0;
    const reset = () => {
      if (!active) return;
      active.style.removeProperty("--tilt-x");
      active.style.removeProperty("--tilt-y");
      active = null;
    };
    const pointer = (event: PointerEvent) => {
      if (!finePointer.matches || event.pointerType === "touch") return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(".polaroid, .little-note, .game-preview, .world-object, .home-world-links > a");
      if (card !== active) reset();
      if (!card) return;
      active = card;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty("--tilt-x", `${-(event.clientY - bounds.y - bounds.height / 2) / bounds.height * 9}deg`);
        card.style.setProperty("--tilt-y", `${(event.clientX - bounds.x - bounds.width / 2) / bounds.width * 9}deg`);
      });
    };
    element.addEventListener("pointermove", pointer);
    element.addEventListener("pointerleave", reset);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      reset();
      element.removeEventListener("pointermove", pointer);
      element.removeEventListener("pointerleave", reset);
      observed.forEach((item) => {
        item.classList.remove("paper-motion", "paper-visible");
        item.style.removeProperty("--arrival-delay");
      });
    };
  }, [root, reduced]);
  return null;
}
