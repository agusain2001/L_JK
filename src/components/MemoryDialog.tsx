"use client";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, X, Printer } from "@phosphor-icons/react";
import type { MemoryMedia } from "@/types/memory";
import { loveStory } from "@/config/story";
import { claimAudio } from "@/lib/world/audio";
import MemoryVoice from "./world/MemoryVoice";

export function Modal({
  children,
  label,
  onClose,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = old;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`paper-dialog ${className}`}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-surface">
        <button
          className="icon-button dialog-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
export function MemoryDialog({
  memory,
  onClose,
  onNext,
  onPrevious,
}: {
  memory: MemoryMedia;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const current = video.current;
    const pauseWhenHidden = () => {
      if (document.hidden) current?.pause();
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== `video:${memory.id}`)
        current?.pause();
    };
    window.addEventListener("for-you:audio", other);
    return () => {
      current?.pause();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("for-you:audio", other);
    };
  }, [memory.id]);
  return (
    <Modal
      label={memory.title || "Memory detail"}
      onClose={onClose}
      className="memory-dialog"
    >
      <div className="memory-media">
        {memory.kind === "video" ? (
          <video
            key={memory.id}
            ref={video}
            src={memory.mediaUrl}
            poster={memory.thumbnailUrl}
            controls
            playsInline
            preload="metadata"
            onPlay={() => claimAudio(`video:${memory.id}`)}
          />
        ) : (
          <img
            src={memory.mediaUrl}
            alt={memory.title || "A memory"}
            onError={(e) => {
              e.currentTarget.src = "/images/memory-3.jpg";
            }}
          />
        )}
      </div>
      <div className="memory-detail">
        <span className="handwritten">{memory.caption}</span>
        <h2>{memory.title}</h2>
        {(memory.date || memory.location) && (
          <p className="memory-meta">
            {[memory.date, memory.location].filter(Boolean).join(" · ")}
          </p>
        )}
        <p>{memory.description}</p>
        {memory.voiceId && <MemoryVoice contentId={memory.voiceId} />}
        {memory.demo && <span className="sample-label">Sample photograph</span>}
        <div className="memory-controls">
          <button
            className="icon-button"
            aria-label="Previous memory"
            onClick={onPrevious}
            hidden={!onPrevious}
          >
            <ArrowLeft size={22} />
          </button>
          <span className="handwritten">yeh wali phir dekhni hai ♡</span>
          <button
            className="icon-button"
            aria-label="Next memory"
            onClick={onNext}
            hidden={!onNext}
          >
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
export function LetterDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      label="A letter just for you"
      onClose={onClose}
      className="letter-dialog"
    >
      <article className="letter-paper">
        <span className="handwritten letter-date">
          tumhare liye likha hai ♡
        </span>
        <h2>{loveStory.letter.greeting}</h2>
        {loveStory.letter.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="letter-signature">
          {loveStory.letter.signature}
          <br />
          <span className="handwritten">
            {loveStory.senderName || "Main hoon na"} ♡
          </span>
        </p>
        <button
          className="text-button print-button"
          onClick={() => window.print()}
        >
          <Printer size={18} /> Chitthi print karo
        </button>
      </article>
    </Modal>
  );
}
