"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { MemoryMedia } from "@/types/memory";
import { MemoryDialog } from "./MemoryDialog";
import GameEditor from "./games/GameEditor";
import WorldEditor from "./world/WorldEditor";
import "./world/admin.css";
import "@/app/world/world.css";
import {
  ArrowLeft,
  ArrowSquareOut,
  CloudArrowDown,
  UploadSimple,
  Heart,
  Check,
  X,
  Eye,
} from "@phosphor-icons/react";

async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
function EditMemory({
  memory,
  onSaved,
  onPreview,
}: {
  memory: MemoryMedia;
  onSaved: () => void;
  onPreview: (m: MemoryMedia) => void;
}) {
  const [draft, setDraft] = useState(memory);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function save(approved?: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const updated = await api(
        `/api/admin/memories/${memory.id}`,
        json("PATCH", { ...draft, approved: approved ?? draft.approved }),
      );
      setDraft(updated);
      setMessage("Saved.");
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/api/admin/memories/${memory.id}`, { method: "DELETE" });
      onSaved();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="admin-memory">
      <div className="admin-thumbnail">
        {}
        <img
          src={draft.kind === "video" ? draft.thumbnailUrl : draft.mediaUrl}
          alt={draft.title || "Memory preview"}
          onError={(e) => {
            e.currentTarget.src = "/images/memory-3.jpg";
          }}
        />
        <span
          className={memory.approved ? "status-approved" : "status-pending"}
        >
          {memory.approved ? "Published" : "Awaiting review"}
        </span>
      </div>
      <div className="admin-fields">
        <label>
          Title
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            maxLength={120}
          />
        </label>
        <label>
          Handwritten caption
          <input
            value={draft.caption}
            onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
            maxLength={200}
          />
        </label>
        <label>
          Written memory
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            rows={2}
            maxLength={2000}
          />
        </label>
        <div className="admin-field-pair">
          <label>
            Date
            <input
              placeholder="e.g. 12 June 2026"
              value={draft.date || ""}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </label>
          <label>
            Place
            <input
              value={draft.location || ""}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </label>
        </div>
        <div className="admin-field-pair">
          <label>
            Chapter
            <select
              value={draft.chapter}
              onChange={(e) => setDraft({ ...draft, chapter: e.target.value })}
            >
              {["hero", "memories", "timeline", "gallery"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Order
            <input
              type="number"
              min={0}
              max={10000}
              value={draft.order}
              onChange={(e) =>
                setDraft({ ...draft, order: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <label>
          Tags (comma separated)
          <input
            value={draft.tags.join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <label>
          Media URL
          <input
            value={draft.mediaUrl}
            onChange={(e) => setDraft({ ...draft, mediaUrl: e.target.value })}
          />
        </label>
        <label>
          Video poster / thumbnail URL
          <input
            value={draft.thumbnailUrl || ""}
            onChange={(e) =>
              setDraft({ ...draft, thumbnailUrl: e.target.value || undefined })
            }
          />
        </label>
        <label>
          Memory audience
          <select
            value={draft.audience || "public"}
            onChange={(event) =>
              setDraft({
                ...draft,
                audience: event.target.value as "public" | "private",
              })
            }
          >
            <option value="public">Public / guest presentation</option>
            <option value="private">Invited participants only</option>
          </select>
        </label>
        {draft.audience === "private" && (
          <p className="admin-tip">
            Private memories use an uploaded file. Remote Instagram or image
            URLs remain accessible on their original service.
          </p>
        )}
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
          />
          <Heart size={16} />
          Feature in the sky
        </label>
        <div className="admin-card-actions">
          <button className="admin-button" onClick={() => onPreview(draft)}>
            <Eye size={16} />
            Preview
          </button>
          <button
            className="admin-button"
            disabled={busy}
            onClick={() => void save()}
          >
            Save edits
          </button>
          <button
            className={
              memory.approved ? "admin-button" : "admin-button admin-primary"
            }
            disabled={busy}
            onClick={() => void save(!memory.approved)}
          >
            {memory.approved ? (
              <>
                <X size={15} />
                Hide
              </>
            ) : (
              <>
                <Check size={15} />
                Approve & publish
              </>
            )}
          </button>
        </div>
        <div className="admin-delete">
          {confirm ? (
            <>
              <span>Remove this memory?</span>
              <button onClick={() => void remove()} disabled={busy}>
                Remove
              </button>
              <button onClick={() => setConfirm(false)}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirm(true)}>Remove memory</button>
          )}
        </div>
        <span className="admin-card-status" role="status">
          {message}
        </span>
      </div>
    </article>
  );
}
export default function AdminDashboard({
  initialAuthed,
  enabled,
  configured,
}: {
  initialAuthed: boolean;
  enabled: boolean;
  configured: { dataset: boolean; task: boolean; actor: boolean };
}) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<MemoryMedia[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<MemoryMedia | null>(null);
  const [filter, setFilter] = useState("all");
  const [mediaUrl, setMediaUrl] = useState("");
  const [poster, setPoster] = useState("");
  const [kind, setKind] = useState("image");
  const load = useCallback(async () => {
    try {
      setItems(await api("/api/admin/memories"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (!authed) return;
    const controller = new AbortController();
    void fetch("/api/admin/memories", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setItems(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [authed]);
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/session", json("POST", { password }));
      setPassword("");
      setAuthed(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sync(mode: string) {
    setBusy(true);
    setError("");
    setStatus("Fetching media for review…");
    try {
      const data = await api("/api/admin/apify", json("POST", { mode }));
      setStatus(data.message);
      await load();
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      await api("/api/admin/upload", { method: "POST", body: form });
      setStatus("Photograph uploaded. Review it before publishing.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function addUrl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/api/admin/memories",
        json("POST", { mediaUrl, kind, thumbnailUrl: poster || undefined }),
      );
      setMediaUrl("");
      setPoster("");
      setStatus("Media added to the review queue.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const displayed = items.filter(
    (m) =>
      filter === "all" || (filter === "published" ? m.approved : !m.approved),
  );
  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="wordmark" href="/">
          for you <span>♡</span>
        </Link>
        <Link href="/" className="admin-back">
          <ArrowLeft size={16} />
          Back to our sky
        </Link>
      </header>
      {!authed ? (
        <section className="admin-login">
          <span className="handwritten">make this little sky yours</span>
          <h1>Your memory studio.</h1>
          <p>
            {enabled
              ? "A private space to choose the moments you want to keep."
              : "Set ADMIN_SECRET in .env to a password of at least 24 characters, then restart the server to enable your private studio."}
          </p>
          {enabled && (
            <form onSubmit={signIn}>
              <label>
                Studio password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? "Opening…" : "Open the studio"}
                <ArrowSquareOut size={16} />
              </button>
            </form>
          )}
          <p className="admin-error" role="alert">
            {error}
          </p>
        </section>
      ) : (
        <>
          <section className="admin-intro">
            <div>
              <span className="handwritten">
                a home for your little moments
              </span>
              <h1>Your memory studio.</h1>
              <p>
                Review, personalize, then publish. New media stays private until
                you approve it.
              </p>
            </div>
            <button
              className="admin-button"
              onClick={async () => {
                await api("/api/admin/session", { method: "DELETE" });
                setAuthed(false);
              }}
            >
              Sign out
            </button>
          </section>
          <section className="admin-import">
            <div>
              <h2>Bring your memories in</h2>
              <p>
                Import a cached dataset, run a configured Apify task, or upload
                your own photographs.
              </p>
              <div className="admin-import-actions">
                <button
                  className="admin-button"
                  disabled={busy || !configured.dataset}
                  onClick={() => void sync("dataset")}
                >
                  <CloudArrowDown size={18} />
                  Sync dataset
                </button>
                <button
                  className="admin-button"
                  disabled={busy || !configured.task}
                  onClick={() => void sync("task")}
                >
                  Run saved task
                </button>
                <button
                  className="admin-button"
                  disabled={busy || !configured.actor}
                  onClick={() => void sync("actor")}
                >
                  Run verified Actor
                </button>
                <label className="admin-button upload-button">
                  <UploadSimple size={18} />
                  Upload photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <p className="admin-hint">
                Task and Actor buttons start a new Apify run. Dataset sync reads
                existing results. Configure credentials in .env.
              </p>
            </div>
            <form onSubmit={addUrl} className="admin-url-form">
              <label>
                Or add a reliable HTTPS media URL
                <input
                  type="url"
                  placeholder="https://…"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  required
                />
              </label>
              <div className="admin-field-pair">
                <label>
                  Type
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="image">Photograph</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                <label>
                  Poster URL {kind === "video" ? "(required)" : "(optional)"}
                  <input
                    type="url"
                    value={poster}
                    onChange={(e) => setPoster(e.target.value)}
                    required={kind === "video"}
                  />
                </label>
              </div>
              <button className="admin-button" disabled={busy}>
                Add for review
              </button>
            </form>
          </section>
          <div className="admin-feedback">
            <p role="status">{status}</p>
            <p className="admin-error" role="alert">
              {error}
            </p>
          </div>
          <div className="admin-review-header">
            <h2>
              Your moments <span>{items.length}</span>
            </h2>
            <div className="gallery-filters">
              {[
                ["all", "All"],
                ["pending", "Awaiting review"],
                ["published", "Published"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? "active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {displayed.length ? (
            <div className="admin-grid">
              {displayed.map((m) => (
                <EditMemory
                  key={m.id}
                  memory={m}
                  onSaved={() => void load()}
                  onPreview={setPreview}
                />
              ))}
            </div>
          ) : (
            <div className="admin-empty">
              <Heart size={35} weight="light" />
              <h3>A little room for your memories.</h3>
              <p>
                Upload a photograph or sync your Apify dataset to get started.
              </p>
            </div>
          )}
          <GameEditor />
          <WorldEditor />
          <aside className="admin-personalization">
            <h2>The words are yours, too.</h2>
            <p>
              Edit <code>src/config/story.ts</code> to add your names, love
              letter, little notes, garden messages, soundtrack, and ending
              surprise. The sample photographs disappear once you approve your
              first real memory.
            </p>
          </aside>
        </>
      )}
      {preview && (
        <MemoryDialog
          memory={preview}
          onClose={() => setPreview(null)}
          onNext={() => {
            const i = items.findIndex((m) => m.id === preview.id);
            setPreview(items[(i + 1) % items.length]);
          }}
          onPrevious={() => {
            const i = items.findIndex((m) => m.id === preview.id);
            setPreview(items[(i - 1 + items.length) % items.length]);
          }}
        />
      )}
    </main>
  );
}
