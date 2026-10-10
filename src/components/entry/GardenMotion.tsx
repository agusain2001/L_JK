"use client";

import { useEffect, useRef } from "react";

export default function GardenMotion() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = matchMedia("(prefers-reduced-motion: no-preference)");
    const screen = video.closest<HTMLElement>(".entry-screen");
    let active = true;
    const play = () => {
      if (!active || !motion.matches || document.hidden || !video.getAttribute("src")) return;
      void video.play().then(() => {
        if (!active || !motion.matches || document.hidden) video.pause();
      }).catch(() => { /* A first tap retries browsers that require a gesture. */ });
    };
    const update = () => {
      if (!motion.matches) {
        video.pause(); video.classList.remove("motion-ready");
        video.removeAttribute("src"); video.load();
        return;
      }
      const source = "/video/tulip-garden-gemini.mp4";
      if (video.getAttribute("src") !== source) {
        video.classList.remove("motion-ready"); video.src = source; video.load();
      }
      play();
    };
    const ready = () => { if (active && motion.matches) video.classList.add("motion-ready"); };
    const failure = () => video.classList.remove("motion-ready");
    const visibility = () => { if (document.hidden) video.pause(); else play(); };
    video.addEventListener("playing", ready);
    video.addEventListener("error", failure);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", update);
    screen?.addEventListener("pointerdown", play, { passive: true });
    screen?.addEventListener("keydown", play);
    update();
    return () => {
      active = false; video.pause();
      video.removeEventListener("playing", ready); video.removeEventListener("error", failure);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", update);
      screen?.removeEventListener("pointerdown", play); screen?.removeEventListener("keydown", play);
      video.removeAttribute("src"); video.load();
    };
  }, []);

  return <video ref={videoRef} className="garden-motion" muted loop playsInline preload="none" poster="/images/tulip-garden-gemini.webp" aria-hidden="true" />;
}
