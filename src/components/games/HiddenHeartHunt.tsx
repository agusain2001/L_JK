"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, EnvelopeSimple } from "@phosphor-icons/react";
import { Modal } from "../MemoryDialog";
import { usePlayground } from "./GameProgress";
function HeartNote({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const { dialog } = usePlayground();
  useEffect(() => {
    dialog(true);
    return () => dialog(false);
  }, [dialog]);
  return (
    <Modal
      label="A little heart note"
      onClose={onClose}
      className="thought-dialog"
    >
      <Heart size={34} weight="light" />
      <span className="handwritten">a little note, tucked away for you</span>
      <h2>{message}</h2>
    </Modal>
  );
}
export function HiddenHeartTrail() {
  const { config, progress, ready, find, open } = usePlayground();
  const [targets, setTargets] = useState<Record<string, HTMLElement>>({}),
    [note, setNote] = useState<string | null>(null);
  const enabled = config.games.some((g) => g.id === "hearts" && g.enabled);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const next: Record<string, HTMLElement> = {};
      for (const heart of config.hearts) {
        const el = document.getElementById(heart.chapterId);
        if (el) next[heart.chapterId] = el;
      }
      setTargets(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [config.hearts]);
  if (!enabled) return null;
  const hearts = config.hearts.filter((h) => h.enabled),
    found = hearts.filter((h) =>
      progress.collectedHeartIds.includes(h.id),
    ).length;
  return (
    <>
      {hearts.map((heart) =>
        targets[heart.chapterId]
          ? createPortal(
              <button
                className={`hidden-heart ${progress.collectedHeartIds.includes(heart.id) ? "heart-found" : ""}`}
                style={{
                  left: `${heart.position.x}%`,
                  top: `${heart.position.y}%`,
                }}
                key={heart.id}
                disabled={!ready}
                aria-label={`${progress.collectedHeartIds.includes(heart.id) ? "Reopen" : "Find"} hidden heart in ${heart.chapterId}`}
                onClick={() => {
                  find(heart.id);
                  setNote(heart.message);
                }}
              >
                <Heart
                  size={21}
                  weight={
                    progress.collectedHeartIds.includes(heart.id)
                      ? "fill"
                      : "light"
                  }
                />
              </button>,
              targets[heart.chapterId],
              heart.id,
            )
          : null,
      )}
      <a
        href="#games"
        className="heart-trail-progress"
        onClick={() => open("hearts")}
        aria-label={`${found} of ${hearts.length} little hearts found. Open accessible heart trail.`}
      >
        <Heart size={16} weight="light" />
        {found} / {hearts.length}
        <span>little hearts</span>
      </a>
      {note && <HeartNote message={note} onClose={() => setNote(null)} />}
    </>
  );
}
export default function HiddenHeartHunt() {
  const { config, progress, ready, find } = usePlayground();
  const [note, setNote] = useState<string | null>(null);
  const hearts = config.hearts.filter((h) => h.enabled);
  const found = hearts.filter((h) =>
    progress.collectedHeartIds.includes(h.id),
  ).length;
  const won = hearts.length > 0 && found === hearts.length;
  return (
    <div className="heart-hunt">
      <p className="game-kicker" role="status">
        {found} of {hearts.length} little hearts found ♡
      </p>
      <h3>Little notes, scattered through our sky.</h3>
      <p>
        You can look through the story, or find each note here. Both paths
        unlock the same surprise.
      </p>
      <div className="heart-discovery-list">
        {hearts.map((heart, i) => (
          <div key={heart.id}>
            <a href={`#${heart.chapterId}`}>
              Visit {heart.chapterId.replaceAll("-", " ")}
            </a>
            <button
              className="game-answer"
              disabled={!ready}
              onClick={() => {
                find(heart.id);
                setNote(heart.message);
              }}
            >
              <Heart
                size={18}
                weight={
                  progress.collectedHeartIds.includes(heart.id)
                    ? "fill"
                    : "light"
                }
              />
              {progress.collectedHeartIds.includes(heart.id)
                ? `Reopen note ${i + 1}`
                : `Find note ${i + 1}`}
            </button>
          </div>
        ))}
      </div>
      {won && (
        <div className="heart-reward">
          <span className="handwritten">a special envelope is waiting</span>
          <button
            className="reward-envelope"
            aria-label="Open your heart reward"
            onClick={() => setNote(config.messages.heartReward)}
          >
            <EnvelopeSimple size={74} weight="light" />
            <span>Open your heart reward ♡</span>
          </button>
        </div>
      )}
      {note && <HeartNote message={note} onClose={() => setNote(null)} />}
    </div>
  );
}
