"use client";
import type { CSSProperties } from "react";
import { Play, Microphone } from "@phosphor-icons/react";
import type { MemoryMedia } from "@/types/memory";
export function Polaroid({
  memory,
  onOpen,
  className = "",
  style,
  eager = false,
}: {
  memory: MemoryMedia;
  onOpen: () => void;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
}) {
  return (
    <button
      className={`polaroid ${className}`}
      style={style}
      onClick={onOpen}
      aria-label={`Open ${memory.title || "memory"}${memory.caption ? ` — ${memory.caption}` : ""}`}
    >
      <span className="polaroid-paper">
        {/* Media from approved arbitrary sources deliberately uses native images. */}
        <img
          src={memory.kind === "video" ? memory.thumbnailUrl : memory.mediaUrl}
          alt={memory.title || "A cherished memory"}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          onError={(e) => {
            e.currentTarget.src = "/images/memory-3.jpg";
          }}
        />
        {memory.kind === "video" && (
          <span className="photo-play">
            <Play weight="fill" />
          </span>
        )}
        {memory.voiceId&&<span className="memory-voice-mark" title="A voice memory is attached"><Microphone size={18}/><span className="sr-only">Voice memory attached</span></span>}
        <span className="photo-caption">
          {memory.caption || memory.title}
          <span className="caption-heart"> ♡</span>
        </span>
      </span>
    </button>
  );
}
