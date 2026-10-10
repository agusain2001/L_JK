"use client";

import { useEffect, useRef } from "react";

/** Plays the supplied sky footage only while its section can be seen. */
export default function SkyBackground({ ending = false }: { ending?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = video?.closest("section");
    if (!video || !section) return;
    const motion = matchMedia("(prefers-reduced-motion: no-preference)");
    const bounds = section.getBoundingClientRect();
    let visible = bounds.bottom > 0 && bounds.top < innerHeight;
    let active = true;

    const play = () => {
      if (!active || !visible || !motion.matches || document.hidden || !video.getAttribute("src")) return;
      void video.play().then(() => {
        if (!active || !visible || !motion.matches || document.hidden) video.pause();
      }).catch(() => { /* Retry on the next tap if autoplay needs a gesture. */ });
    };
    const update = () => {
      if (!active) return;
      if (!motion.matches) {
        video.pause();
        video.classList.remove("motion-ready");
        video.removeAttribute("src");
        video.load();
        return;
      }
      if (!visible || document.hidden) { video.pause(); return; }
      const source = "/video/sky-gemini.mp4";
      if (video.getAttribute("src") !== source) {
        video.src = source;
        video.load();
      }
      play();
    };
    const ready = () => { if (active && motion.matches) video.classList.add("motion-ready"); };
    const failure = () => video.classList.remove("motion-ready");
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(section);
    video.addEventListener("playing", ready);
    video.addEventListener("error", failure);
    document.addEventListener("visibilitychange", update);
    document.addEventListener("pointerdown", play, { passive: true });
    document.addEventListener("keydown", play);
    motion.addEventListener("change", update);
    update();

    return () => {
      active = false;
      observer.disconnect();
      video.pause();
      video.removeEventListener("playing", ready);
      video.removeEventListener("error", failure);
      document.removeEventListener("visibilitychange", update);
      document.removeEventListener("pointerdown", play);
      document.removeEventListener("keydown", play);
      motion.removeEventListener("change", update);
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return <div className={`sky-backdrop${ending ? " sky-backdrop-ending" : ""}`} aria-hidden="true">
    <video ref={videoRef} className="sky-motion" muted loop playsInline preload="none" poster="/images/sky-gemini.webp" />
  </div>;
}
