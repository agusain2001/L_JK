"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { CassetteTape, Microphone } from "@phosphor-icons/react";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
export default function MusicCorner({ voice = false }: { voice?: boolean }) {
  const { data } = useWorld();
  const router = useRouter(),
    params = useSearchParams();
  const kind = voice ? "voice" : "music";
  const entries = data.content.filter((content) => content.kind === kind);
  const selected = entries.find((entry) => entry.id === params.get("item"));
  return (
    <div className="music-corner">
      <div className="cassette-library">
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={`cassette-card ${selected?.id === entry.id ? "selected" : ""}`}
            aria-pressed={selected?.id === entry.id}
            onClick={() => router.push(`/world/${kind}?item=${entry.id}`)}
          >
            {voice ? (
              <Microphone size={45} weight="light" />
            ) : (
              <CassetteTape size={66} weight="light" />
            )}
            <span className="handwritten">{entry.title}</span>
            <small>{entry.metadata.artist || entry.description}</small>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="music-player-paper">
          <h2>{selected.title}</h2>
          <ContentView content={selected} />
          {selected.metadata.link && (
            <a
              className="button secondary"
              href={selected.metadata.link}
              target="_blank"
              rel="noreferrer"
            >
              Listen on the linked service
            </a>
          )}
          {!selected.assets.some((asset) =>
            asset.mime.startsWith("audio/"),
          ) && (
            <p>
              {selected.metadata.link
                ? "This track plays on its authorized streaming service."
                : "A recording has not been attached yet. The owner can add a browser-playable file."}
            </p>
          )}
        </div>
      ) : (
        <p>
          {entries.length
            ? "Choose a little recording to open its player."
            : voice
              ? "Your own voice belongs here. Recordings are uploaded privately and reviewed before sharing."
              : "Add a licensed song or an authorized streaming link in the studio."}
        </p>
      )}
    </div>
  );
}
