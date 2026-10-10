"use client";
import Link from "next/link";
import { useState } from "react";
import { Printer, Heart } from "@phosphor-icons/react";
import type { WorldContent } from "@/lib/world/schemas";
import { useWorld, worldRequest } from "./WorldContext";
import AudioPlayer from "./AudioPlayer";
import { MemoryDialog } from "@/components/MemoryDialog";
export function InvitationHint() {
  return (
    <p className="world-invitation">
      This little corner is for invited participants.{" "}
      <Link href="/world/access">Sign in with your invitation</Link>.
    </p>
  );
}
export default function ContentView({
  content,
  print = false,
}: {
  content: WorldContent;
  print?: boolean;
}) {
  const { data } = useWorld();
  const [selected, setSelected] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const memories = data.memories.filter((memory) =>
    content.memoryIds.includes(memory.id),
  );
  const current = memories.find((memory) => memory.id === selected);
  return (
    <div className="content-view">
      {content.demo && <p className="world-demo">Editable sample content</p>}
      <div className="letter-copy selectable-copy">
        {content.body?.split(/\n\s*\n/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
      {memories.length > 0 && (
        <div className="world-photo-row">
          {memories.map((memory) => (
            <button
              className="world-polaroid"
              key={memory.id}
              onClick={() => setSelected(memory.id)}
            >
              <img
                src={memory.thumbnailUrl || memory.mediaUrl}
                alt={memory.title}
              />
              <span className="handwritten">
                {memory.caption || memory.title}
              </span>
            </button>
          ))}
        </div>
      )}
      {content.assets.map((asset) =>
        asset.mime.startsWith("audio/") ? (
          <AudioPlayer
            key={asset.id}
            src={asset.url}
            title={asset.title}
            transcript={content.metadata.transcript}
          />
        ) : asset.mime.startsWith("image/") ? (
          <img
            className="world-attachment"
            key={asset.id}
            src={asset.url}
            alt={asset.title}
          />
        ) : null,
      )}
      <div className="world-actions">
        {print && (
          <button className="text-button" onClick={() => window.print()}>
            <Printer size={19} /> Print this letter
          </button>
        )}
        {data.actor && (
          <button
            className="text-button"
            onClick={() =>
              void worldRequest("/api/world/keepsakes", "POST", {
                contentId: content.id,
              })
                .then(() => setMessage("Kept in your private drawer."))
                .catch((error) => setMessage(error.message))
            }
          >
            <Heart size={18} /> Keep this little note
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      {current && (
        <MemoryDialog
          memory={current}
          onClose={() => setSelected(null)}
          onNext={() =>
            setSelected(
              memories[(memories.indexOf(current) + 1) % memories.length].id,
            )
          }
          onPrevious={() =>
            setSelected(
              memories[
                (memories.indexOf(current) + memories.length - 1) %
                  memories.length
              ].id,
            )
          }
        />
      )}
    </div>
  );
}
