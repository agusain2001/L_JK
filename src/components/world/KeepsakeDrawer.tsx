"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TreasureChest, Flower, Heart, Trash } from "@phosphor-icons/react";
import type { Keepsake } from "@prisma/client";
import { useWorld, worldRequest } from "./WorldContext";
import ContentView, { InvitationHint } from "./ContentView";
import { MemoryDialog } from "@/components/MemoryDialog";
import { gameStorageKey } from "@/lib/games/storage";
export default function KeepsakeDrawer() {
  const { data } = useWorld();
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Keepsake[]>([]),
    [booth, setBooth] = useState<
      { id: string; assetId: string; caption: string; url: string }[]
    >([]),
    [selected, setSelected] = useState<string | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const result = await worldRequest("/api/world/keepsakes", "GET");
      setItems(result.items);
      setBooth(result.booth);
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.actor) void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [data.actor]);
  if (!data.actor) return <InvitationHint />;
  const item = items.find((item) => item.id === selected),
    memory = data.memories.find((memory) => memory.id === item?.memoryId),
    content = data.content.find(
      (content) => content.id === item?.contentId && !content.locked,
    );
  return (
    <div className="keepsake-desk">
      <button
        className={`keepsake-box ${open ? "open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <TreasureChest size={100} weight="light" />
        <span className="handwritten">Our little keepsake drawer</span>
        <span>{open ? "Slide it closed" : "Open your drawer"}</span>
      </button>
      {open && (
        <div className="drawer-contents">
          {items.map((item) => (
            <button
              className="keepsake-object"
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              {item.memoryId &&
              data.memories.find((memory) => memory.id === item.memoryId) ? (
                <img
                  src={
                    data.memories.find((memory) => memory.id === item.memoryId)!
                      .thumbnailUrl ||
                    data.memories.find((memory) => memory.id === item.memoryId)!
                      .mediaUrl
                  }
                  alt=""
                />
              ) : item.type === "game" ? (
                <Flower size={45} weight="light" />
              ) : (
                <Heart size={40} weight="light" />
              )}
              <span className="handwritten">{item.title}</span>
            </button>
          ))}
          {booth.map((photo) => (
            <article className="keepsake-booth" key={photo.id}>
              <a href={photo.url} download="our-photo-booth.png">
                <img
                  src={photo.url}
                  alt={photo.caption || "Your private photo booth creation"}
                />
              </a>
              <p>{photo.caption}</p>
              <button
                className="text-button"
                onClick={() =>
                  void worldRequest(
                    `/api/world/media/${photo.assetId}`,
                    "DELETE",
                  )
                    .then(() => {
                      setMessage(
                        "The saved photo and its private file have been deleted.",
                      );
                      return load();
                    })
                    .catch((error) => setMessage(error.message))
                }
              >
                <Trash size={17} /> Delete saved photo
              </button>
            </article>
          ))}
          {!items.length && !booth.length && (
            <p>
              An empty little drawer. Keep a photograph, open a letter, or
              finish a little game to begin.
            </p>
          )}
        </div>
      )}
      {item && (
        <div className="unfolded-paper">
          <h2>{item.title}</h2>
          {content ? (
            <ContentView content={content} />
          ) : (
            <p className="handwritten">
              {item.body || "A photograph worth keeping close."}
            </p>
          )}
          {item.contentId && !content && (
            <p>
              The original content is unavailable or waiting for its release.
            </p>
          )}
          <button className="text-button" onClick={() => setSelected(null)}>
            Close this keepsake
          </button>
          <button
            className="text-button"
            onClick={() =>
              void worldRequest("/api/world/keepsakes", "DELETE", {
                id: item.id,
              })
                .then(() => {
                  setSelected(null);
                  return load();
                })
                .catch((error) => setMessage(error.message))
            }
          >
            Remove from my drawer
          </button>
        </div>
      )}
      <div className="world-actions">
        <button className="text-button" onClick={() => void load()}>
          Refresh my drawer
        </button>
        <button
          className="text-button"
          onClick={() =>
            void (async () => {
              try {
                const progress = JSON.parse(
                  localStorage.getItem(gameStorageKey(data.actor!.id)) ||
                    "null",
                );
                if (!progress) throw new Error("Play a little game first.");
                await worldRequest("/api/world/keepsakes", "POST", {
                  action: "progress",
                  progress,
                });
                await load();
                setMessage(
                  "Your completed game surprises are kept in the drawer.",
                );
              } catch (error) {
                setMessage((error as Error).message);
              }
            })()
          }
        >
          Bring my local game surprises
        </button>
        <details>
          <summary>Reset only my game rewards</summary>
          <p>
            Original photographs, letters, and other keepsakes remain available.
          </p>
          <button
            className="text-button"
            onClick={() =>
              void worldRequest("/api/world/keepsakes", "DELETE", {
                action: "reset-games",
              })
                .then(() => {
                  setMessage(
                    "Game rewards cleared from your private drawer. Reset local game progress separately in Little Surprises.",
                  );
                  return load();
                })
                .catch((error) => setMessage(error.message))
            }
          >
            Confirm reset of game rewards
          </button>
        </details>
        <Link href="/#games">Find another little game</Link>
      </div>
      <p role="status">{message}</p>
      {memory && (
        <MemoryDialog memory={memory} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
