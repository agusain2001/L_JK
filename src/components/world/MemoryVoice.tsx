"use client";
import { useState } from "react";
import { Microphone } from "@phosphor-icons/react";
import type { WorldContent } from "@/lib/world/schemas";
import AudioPlayer from "./AudioPlayer";
export default function MemoryVoice({ contentId }: { contentId: string }) {
  const [record, setRecord] = useState<WorldContent | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function open() {
    setBusy(true);
    try {
      const response = await fetch(`/api/world/content/${contentId}`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("This voice memory is no longer available.");
      setRecord(await response.json());
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="memory-voice">
      {!record ? (
        <button
          className="text-button"
          disabled={busy}
          onClick={() => void open()}
        >
          <Microphone size={20} />
          {busy ? "Opening recording…" : "Hear the voice memory"}
        </button>
      ) : (
        <>
          <p>{record.description}</p>
          {record.assets
            .filter((asset) => asset.mime.startsWith("audio/"))
            .map((asset) => (
              <AudioPlayer
                key={asset.id}
                src={asset.url}
                title={asset.title}
                transcript={record.metadata.transcript}
              />
            ))}
        </>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
