"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PrivateMessage } from "@prisma/client";
import { useWorld, worldRequest } from "./WorldContext";
import { InvitationHint } from "./ContentView";
import { Heart, Flower, Star } from "@phosphor-icons/react";
export default function PrivateNotes() {
  const sending = useRef(false);
  const submission = useRef({ signature: "", key: "" });
  const { data } = useWorld();
  const [items, setItems] = useState<PrivateMessage[]>([]),
    [users, setUsers] = useState<{ id: string; name: string }[]>([]),
    [recipient, setRecipient] = useState(""),
    [body, setBody] = useState(""),
    [sticker, setSticker] = useState("heart"),
    [memoryId, setMemoryId] = useState(""),
    [reply, setReply] = useState<string | null>(null),
    [cursor, setCursor] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(
    async (more = false, cursorValue: string | null = null) => {
      try {
        const result = await worldRequest(
          `/api/world/notes${more && cursorValue ? `?cursor=${encodeURIComponent(cursorValue)}` : ""}`,
          "GET",
        );
        setItems((previous) =>
          more ? [...previous, ...result.items] : result.items,
        );
        setUsers(
          result.users.filter(
            (user: { id: string }) => user.id !== data.actor?.id,
          ),
        );
        setCursor(result.nextCursor);
        setRecipient(
          (previous) =>
            previous ||
            result.users.find(
              (user: { id: string }) => user.id !== data.actor?.id,
            )?.id ||
            "",
        );
      } catch (error) {
        setMessage((error as Error).message);
      }
    },
    [data.actor?.id],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.actor) void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [data.actor, load]);
  if (!data.actor) return <InvitationHint />;
  async function send() {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const input = {
        body,
        recipientId: recipient,
        sticker: sticker || null,
        memoryId: memoryId || null,
        replyToId: reply,
      };
      const signature = JSON.stringify(input);
      if (submission.current.signature !== signature)
        submission.current = { signature, key: crypto.randomUUID() };
      await worldRequest("/api/world/notes", "POST", {
        ...input,
        submissionKey: submission.current.key,
      });
      submission.current = { signature: "", key: "" };
      setBody("");
      setReply(null);
      await load();
      setMessage("Your little note has reached the private mailbox.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
      sending.current = false;
    }
  }
  return (
    <div className="private-pinboard">
      <form
        className="private-writing"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <h2>{reply ? "A little reply" : "Leave me a little note"}</h2>
        <label>
          For
          <select
            required
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          >
            <option value="">Choose a participant</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Your private note
          <textarea
            required
            maxLength={2000}
            rows={6}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <label>
          A tiny sticker
          <select
            value={sticker}
            onChange={(event) => setSticker(event.target.value)}
          >
            <option value="">No sticker</option>
            <option value="heart">Heart</option>
            <option value="flower">Flower</option>
            <option value="star">Star</option>
          </select>
        </label>
        <label>
          An approved photograph
          <select
            value={memoryId}
            onChange={(event) => setMemoryId(event.target.value)}
          >
            <option value="">No photograph</option>
            {data.memories.map((memory) => (
              <option key={memory.id} value={memory.id}>
                {memory.title}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" disabled={busy || !recipient}>
          {busy ? "Sending…" : "Send my little note"}
        </button>
        {reply && (
          <button
            type="button"
            className="text-button"
            onClick={() => setReply(null)}
          >
            Cancel reply
          </button>
        )}
        <p>
          Private to the participants. Notes are permanently removed after{" "}
          {data.settings.noteRetentionDays} days. Deleting a note removes it for
          both people; shared library photos remain in the library.
        </p>
        <p role="status">{message}</p>
      </form>
      <div className="private-notes-list">
        <button className="text-button" onClick={() => void load()}>
          Check the mailbox
        </button>
        {items.map((note) => (
          <article
            className={`private-paper ${note.senderId === data.actor!.id ? "from-me" : "from-you"}`}
            key={note.id}
          >
            <small>
              {note.senderId === data.actor!.id
                ? "From you"
                : users.find((user) => user.id === note.senderId)?.name ||
                  "A participant"}{" "}
              · {new Date(note.createdAt).toLocaleString()}
            </small>
            {note.replyToId && <small>In reply to an earlier note</small>}
            <p className="handwritten selectable-copy">{note.body}</p>
            {note.sticker && (
              <span
                className="note-sticker"
                aria-label={`${note.sticker} sticker`}
              >
                {note.sticker === "flower" ? (
                  <Flower size={30} weight="light" />
                ) : note.sticker === "star" ? (
                  <Star size={30} weight="light" />
                ) : (
                  <Heart size={30} weight="light" />
                )}
              </span>
            )}
            {note.memoryId &&
              data.memories.find((memory) => memory.id === note.memoryId) && (
                <img
                  src={
                    data.memories.find((memory) => memory.id === note.memoryId)!
                      .thumbnailUrl ||
                    data.memories.find((memory) => memory.id === note.memoryId)!
                      .mediaUrl
                  }
                  alt="Attached approved memory"
                />
              )}
            <div className="world-actions">
              {note.senderId !== data.actor!.id && (
                <button
                  className="text-button"
                  onClick={() => {
                    setReply(note.id);
                    setRecipient(note.senderId);
                  }}
                >
                  Reply
                </button>
              )}
              {(note.senderId === data.actor!.id ||
                data.actor!.role === "owner") && (
                <button
                  className="text-button"
                  onClick={() =>
                    void worldRequest("/api/world/notes", "DELETE", {
                      id: note.id,
                    })
                      .then(() => {
                        setMessage(
                          "The note has been deleted for both participants.",
                        );
                        return load();
                      })
                      .catch((error) => setMessage(error.message))
                  }
                >
                  Delete this note
                </button>
              )}
            </div>
          </article>
        ))}
        {cursor && (
          <button
            className="button secondary"
            onClick={() => void load(true, cursor)}
          >
            Earlier notes
          </button>
        )}
        {!items.length && <p>A quiet mailbox, waiting for a few words.</p>}
      </div>
    </div>
  );
}
