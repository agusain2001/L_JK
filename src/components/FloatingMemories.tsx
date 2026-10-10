"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Polaroid } from "./Polaroid";
import type { MemoryMedia } from "@/types/memory";
const WebGLScene = dynamic(() => import("./SkyScene"), { ssr: false });

export default function FloatingMemories({
  memories,
  onOpen,
  reduced,
  variant = "hero",
}: {
  memories: MemoryMedia[];
  onOpen: (memory: MemoryMedia) => void;
  reduced: boolean;
  variant?: "hero" | "memories";
}) {
  const [webGL, setWebGL] = useState(false);
  useEffect(() => {
    const compact = matchMedia(
      "(max-width: 640px), (prefers-reduced-motion: reduce)",
    );
    const update = () => {
      // Phones and reduced-motion visitors keep responsive, spatial HTML paper.
      // Avoid downloading or compiling a graphics engine for those visitors.
      setWebGL(
        !compact.matches &&
          !reduced &&
          (navigator.hardwareConcurrency || 4) > 2,
      );
    };
    const timer = window.setTimeout(update, 0);
    compact.addEventListener("change", update);
    return () => {
      clearTimeout(timer);
      compact.removeEventListener("change", update);
    };
  }, [reduced]);
  if (webGL)
    return (
      <WebGLScene
        memories={memories}
        onOpen={onOpen}
        reduced={reduced}
        variant={variant}
      />
    );
  return (
    <div
      className={`sky-scene html-sky ${variant === "memories" ? "gallery-sky" : ""}`}
      aria-label="Floating memory photographs"
    >
      <div className="scene-fallback">
        {memories.slice(0, variant === "hero" ? 6 : 5).map((memory, i) => (
          <Polaroid
            key={memory.id}
            memory={memory}
            className={`hero-photo hp-${i}`}
            eager={variant === "hero" && i < 3}
            onOpen={() => onOpen(memory)}
          />
        ))}
      </div>
    </div>
  );
}
