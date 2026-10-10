"use client";
import Link from "next/link";
import { useState } from "react";
import { useWorld, worldRequest } from "./WorldContext";
import { MemoryDialog } from "@/components/MemoryDialog";
import { deterministicIndex } from "@/lib/world/dates";
export default function SurpriseMemory() {
  const { data } = useWorld();
  const [selected, setSelected] = useState<string | null>(null),
    [full, setFull] = useState(false),
    [message, setMessage] = useState(""),
    [mode, setMode] = useState("random");
  const settings = data.settings;
  const pool = data.memories.filter(
    (memory) =>
      !settings.excludedIds.includes(memory.id) &&
      (settings.surpriseFilter === "featured"
        ? memory.featured
        : settings.surpriseFilter === "captions"
          ? !!memory.caption
          : settings.surpriseFilter === "videos"
            ? memory.kind === "video"
            : settings.surpriseFilter === "surprise-only"
              ? settings.surpriseIds.includes(memory.id)
              : true),
  );
  const memory = pool.find((memory) => memory.id === selected);
  function surprise() {
    const options = pool.filter((memory) => memory.id !== selected);
    const available = options.length ? options : pool;
    setSelected(
      mode === "today"
        ? pool[deterministicIndex(data.today, pool.length)]?.id || null
        : available[Math.floor(Math.random() * available.length)]?.id || null,
    );
  }
  return (
    <div className="surprise-memory">
      <div className="surprise-mode">
        <label>
          <input
            type="radio"
            name="surprise-mode"
            checked={mode === "random"}
            onChange={() => setMode("random")}
          />{" "}
          A real random surprise
        </label>
        <label>
          <input
            type="radio"
            name="surprise-mode"
            checked={mode === "today"}
            onChange={() => setMode("today")}
          />{" "}
          Today&apos;s memory
        </label>
      </div>
      {memory ? (
        <button
          className="surprise-polaroid world-polaroid"
          onClick={() => setFull(true)}
        >
          <img
            src={memory.thumbnailUrl || memory.mediaUrl}
            alt={memory.title}
          />
          <span className="handwritten">{memory.caption || memory.title}</span>
        </button>
      ) : (
        <button
          className="surprise-empty-polaroid"
          disabled={!pool.length}
          onClick={surprise}
        >
          <span className="handwritten">Surprise me ♡</span>
        </button>
      )}
      {!pool.length && (
        <p>
          No approved memories match the current selection. Ask the owner to add
          a photo or change the filters.
        </p>
      )}
      <div className="world-actions">
        <button
          className="button primary"
          disabled={!pool.length}
          onClick={surprise}
        >
          {mode === "today"
            ? "Show today's memory"
            : memory
              ? "Another memory"
              : "Surprise me"}
        </button>
        {memory && (
          <button className="text-button" onClick={() => setFull(true)}>
            View full story
          </button>
        )}
        {memory && data.actor && (
          <button
            className="text-button"
            onClick={() =>
              void worldRequest("/api/world/keepsakes", "POST", {
                memoryId: memory.id,
              })
                .then(() =>
                  setMessage("This photograph is kept in your private drawer."),
                )
                .catch((error) => setMessage(error.message))
            }
          >
            Save to keepsakes
          </button>
        )}
        <Link href="/#gallery">Back to the gallery</Link>
      </div>
      <p role="status">{message}</p>
      {full && memory && (
        <MemoryDialog
          memory={memory}
          onClose={() => setFull(false)}
          onNext={() => surprise()}
          onPrevious={() => surprise()}
        />
      )}
    </div>
  );
}
