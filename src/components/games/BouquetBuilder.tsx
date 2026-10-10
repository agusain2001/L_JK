"use client";
import { useRef, useState } from "react";
import {
  bouquetArtwork,
  bouquetPostcard,
  downloadPostcard,
  flowerArt,
} from "@/lib/games/postcards";
import { bouquetSchema, type Bouquet } from "@/lib/games/schemas";
import { usePlayground } from "./GameProgress";
const initial: Bouquet = {
  flowers: [],
  wrap: "cream",
  ribbon: "rose",
  note: "",
  arrangement: "fan",
};
export default function BouquetBuilder() {
  const { config, progress, commit, finish } = usePlayground();
  const [bouquet, setBouquet] = useState<Bouquet>(initial),
    [finished, setFinished] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const exportLock = useRef(false);
  const paper = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    type: Bouquet["flowers"][number]["type"];
    color: string;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  function endDrag(x: number, y: number, cancelled = false) {
    const picked = drag.current;
    drag.current = null;
    if (ghost.current) ghost.current.style.display = "none";
    if (!picked?.moved) return;
    suppressClick.current = true;
    const bounds = paper.current?.getBoundingClientRect();
    if (
      !cancelled &&
      bounds &&
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.bottom
    )
      add(picked.type, picked.color);
  }
  function add(type: Bouquet["flowers"][number]["type"], color: string) {
    setFinished(false);
    setBouquet((b) =>
      b.flowers.length >= 7
        ? b
        : {
            ...b,
            flowers: [...b.flowers, { id: crypto.randomUUID(), type, color }],
          },
    );
  }
  function move(index: number, direction: number) {
    setFinished(false);
    setBouquet((b) => {
      const flowers = [...b.flowers],
        target = index + direction;
      if (target < 0 || target >= flowers.length) return b;
      [flowers[index], flowers[target]] = [flowers[target], flowers[index]];
      return { ...b, flowers };
    });
  }
  async function exportPNG() {
    if (exportLock.current) return;
    exportLock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await downloadPostcard(
        bouquetPostcard(bouquet),
        "a-bouquet-for-you.png",
        900,
        1050,
      );
      setMessage("Your PNG is ready. The postcard download has started.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
      exportLock.current = false;
    }
  }
  return (
    <div className="bouquet-desk">
      <div ref={ghost} className="flower-drag-ghost" aria-hidden="true" />
      <div className="bouquet-preview">
        <div
          className={`bouquet-art ${finished ? "bouquet-finished" : ""}`}
          ref={paper}
          role="img"
          aria-label={`Bouquet with ${bouquet.flowers.length} flowers, ${bouquet.wrap} paper and ${bouquet.ribbon} ribbon`}
          dangerouslySetInnerHTML={{
            __html: bouquetArtwork(bouquet, finished),
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const [type, color] = e.dataTransfer
              .getData("text/plain")
              .split("|");
            const flower = config.flowers.find((f) => f.id === type);
            if (flower && flower.availableColors.includes(color))
              add(flower.id, color);
          }}
        />
        <p className="handwritten bouquet-note">
          {bouquet.note || "a little note, waiting to be written"}
        </p>
      </div>
      <div className="bouquet-tools">
        <p className="game-kicker" role="status">
          {bouquet.flowers.length} of 7 flowers picked
        </p>
        <h3>Pick a little happiness.</h3>
        <p>
          Tap a flower to add it. On desktop, you can also drag it onto the
          paper.
        </p>
        <div className="flower-picker">
          {config.flowers.map((f) => (
            <div key={f.id}>
              <span>{f.label}</span>
              <div>
                {f.availableColors.map((color, i) => (
                  <button
                    key={color}
                    className="flower-choice"
                    draggable={false}
                    disabled={bouquet.flowers.length >= 7}
                    aria-label={`Add ${f.label} color ${i + 1}`}
                    onPointerDown={(e) => {
                      suppressClick.current = false;
                      if (e.pointerType !== "mouse" || e.button !== 0) return;
                      drag.current = {
                        x: e.clientX,
                        y: e.clientY,
                        type: f.id,
                        color,
                        moved: false,
                      };
                      e.currentTarget.setPointerCapture(e.pointerId);
                      if (ghost.current)
                        ghost.current.innerHTML = `<svg viewBox="0 0 100 165">${flowerArt(f.id, color)}</svg>`;
                    }}
                    onPointerMove={(e) => {
                      const picked = drag.current;
                      if (!picked) return;
                      if (
                        Math.hypot(e.clientX - picked.x, e.clientY - picked.y) >
                        6
                      )
                        picked.moved = true;
                      if (picked.moved && ghost.current) {
                        ghost.current.style.display = "block";
                        ghost.current.style.transform = `translate(${e.clientX - 30}px, ${e.clientY - 50}px)`;
                      }
                    }}
                    onPointerUp={(e) => endDrag(e.clientX, e.clientY)}
                    onPointerCancel={(e) => endDrag(e.clientX, e.clientY, true)}
                    onClick={() => {
                      if (suppressClick.current) {
                        suppressClick.current = false;
                        return;
                      }
                      add(f.id, color);
                    }}
                  >
                    <svg
                      viewBox="0 0 100 165"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{
                        __html: flowerArt(f.id, color),
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ol className="bouquet-picked">
          {bouquet.flowers.map((f, i) => (
            <li
              key={f.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/x-bouquet-flower", f.id)
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = bouquet.flowers.findIndex(
                  (x) =>
                    x.id ===
                    e.dataTransfer.getData("application/x-bouquet-flower"),
                );
                if (from < 0) return;
                setFinished(false);
                setBouquet((b) => {
                  const flowers = [...b.flowers];
                  const [moved] = flowers.splice(from, 1);
                  flowers.splice(i, 0, moved);
                  return { ...b, flowers };
                });
              }}
            >
              <span>{config.flowers.find((x) => x.id === f.type)?.label}</span>
              <button
                aria-label={`Move flower ${i + 1} earlier`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                ←
              </button>
              <button
                aria-label={`Move flower ${i + 1} later`}
                disabled={i === bouquet.flowers.length - 1}
                onClick={() => move(i, 1)}
              >
                →
              </button>
              <button
                aria-label={`Remove flower ${i + 1}`}
                onClick={() => {
                  setFinished(false);
                  setBouquet((b) => ({
                    ...b,
                    flowers: b.flowers.filter((x) => x.id !== f.id),
                  }));
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        <div className="bouquet-selects">
          <label>
            Arrangement
            <select
              aria-label="Arrangement"
              value={bouquet.arrangement}
              onChange={(e) => {
                setFinished(false);
                setBouquet({
                  ...bouquet,
                  arrangement: e.target.value as Bouquet["arrangement"],
                });
              }}
            >
              {["fan", "gathered", "cascade"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Paper wrapping
            <select
              aria-label="Paper wrapping"
              value={bouquet.wrap}
              onChange={(e) => {
                setFinished(false);
                setBouquet({
                  ...bouquet,
                  wrap: e.target.value as Bouquet["wrap"],
                });
              }}
            >
              {["cream", "peach", "sage"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Ribbon color
            <select
              aria-label="Ribbon color"
              value={bouquet.ribbon}
              onChange={(e) =>
                setBouquet({
                  ...bouquet,
                  ribbon: e.target.value as Bouquet["ribbon"],
                })
              }
            >
              {["rose", "sage", "blue"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="bouquet-note-input">
          Your little note
          <textarea
            maxLength={180}
            rows={3}
            value={bouquet.note}
            onChange={(e) => setBouquet({ ...bouquet, note: e.target.value })}
          />
          <small>{bouquet.note.length}/180</small>
        </label>
        <div className="game-actions">
          {!finished ? (
            <button
              className="button primary"
              disabled={!bouquet.flowers.length}
              onClick={() => {
                setFinished(true);
                finish("bouquet");
              }}
            >
              Wrap my bouquet
            </button>
          ) : (
            <>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => void exportPNG()}
              >
                {busy ? "Making your postcard…" : "Save postcard as PNG"}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  const valid = bouquetSchema.parse(bouquet);
                  const saved = commit((p) => ({
                    ...p,
                    bouquets: [...p.bouquets, valid].slice(-5),
                  }));
                  setMessage(
                    saved
                      ? "Your bouquet is kept in this browser."
                      : "This browser could not store the bouquet. You can still download its postcard.",
                  );
                }}
              >
                Keep bouquet in this browser
              </button>
            </>
          )}
          {progress.bouquets.length > 0 && (
            <button
              className="text-button"
              onClick={() => {
                setBouquet(progress.bouquets[progress.bouquets.length - 1]);
                setFinished(true);
                setMessage("Your last kept bouquet is back.");
              }}
            >
              Restore my last bouquet
            </button>
          )}
        </div>
        {finished && (
          <p className="handwritten bouquet-message">
            {config.messages.bouquet}
          </p>
        )}
        <p role="status">{message}</p>
      </div>
    </div>
  );
}
