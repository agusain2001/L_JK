"use client";
import Link from "next/link";
import { useState } from "react";
import { Drop } from "@phosphor-icons/react";
import { flowerArt } from "@/lib/games/postcards";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
import { MemoryDialog } from "@/components/MemoryDialog";
export default function GrowingGarden() {
  const { data, refresh } = useWorld();
  const [selected, setSelected] = useState<string | null>(null),
    [watered, setWatered] = useState(false),
    [message, setMessage] = useState("");
  const flower = data.flowers.find((flower) => flower.id === selected);
  const memory = data.memories.find((memory) => memory.id === flower?.memoryId),
    content = data.content.find((content) => content.id === flower?.contentId);
  return (
    <div className="growing-garden">
      <p>
        Every flower belongs to an approved memory, a configured milestone, or a
        completed shared adventure. Visits don&apos;t create flowers.
      </p>
      <div className={`garden-bed ${watered ? "watered" : ""}`}>
        <div className="garden-soil" />
        {data.flowers.map((flower, i) => (
          <button
            key={flower.id}
            className="memory-flower"
            style={{
              left: `${flower.x}%`,
              top: `${flower.y}%`,
              animationDelay: `${i * 0.1}s`,
            }}
            aria-label={`Open flower: ${flower.label}`}
            onClick={() => setSelected(flower.id)}
          >
            <svg
              viewBox="0 0 100 165"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: flowerArt(flower.type, flower.color),
              }}
            />
            <span className="handwritten">{flower.label}</span>
          </button>
        ))}
      </div>
      <div className="world-actions">
        <button
          className="text-button"
          onClick={() => {
            setWatered((value) => !value);
            setMessage(
              "A little watering, just for fun. Your flowers are linked to real records.",
            );
          }}
        >
          <Drop size={23} /> A little water
        </button>
        <button
          className="text-button"
          onClick={() =>
            void refresh().catch((error) => setMessage(error.message))
          }
        >
          See what has grown
        </button>
        <Link href="/#garden">Back to the flower garden</Link>
        <Link href="/world/bucket-list">Our someday notebook</Link>
      </div>
      <p role="status">{message}</p>
      {!data.flowers.length && (
        <p>
          The soil is ready. Approve a memory or complete a shared idea to grow
          a flower.
        </p>
      )}
      {flower && (
        <div className="unfolded-paper">
          <h3>{flower.label}</h3>
          {content ? (
            <ContentView content={content} />
          ) : (
            !memory && <p>A completed adventure in your shared notebook.</p>
          )}
          <button className="text-button" onClick={() => setSelected(null)}>
            Close this flower
          </button>
        </div>
      )}
      {memory && (
        <MemoryDialog memory={memory} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
