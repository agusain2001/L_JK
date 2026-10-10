"use client";
import { useEffect, useState } from "react";
import type {
  WorldContent,
  TimeCapsule,
  MemoryLocation,
  GardenFlower,
  MediaAsset,
} from "@prisma/client";
import type { MemoryMedia } from "@/types/memory";
import {
  contentSchema,
  type ContentInput,
  type WorldSettings,
} from "@/lib/world/schemas";
import { features } from "@/lib/world/features";
import { worldRequest } from "./WorldContext";
import AudioPlayer from "./AudioPlayer";
import Link from "next/link";
type ContentRecord = WorldContent & {
  capsule: TimeCapsule | null;
  memories: { memoryId: string }[];
  attachments: { assetId: string }[];
};
type LocationRecord = MemoryLocation & { memories: { memoryId: string }[] };
type Studio = {
  flags: Record<string, boolean>;
  settings: WorldSettings;
  content: ContentRecord[];
  locations: LocationRecord[];
  flowers: GardenFlower[];
  assets: (MediaAsset & { url: string })[];
  memories: MemoryMedia[];
  users: { id: string; name: string; email: string; active: boolean }[];
  invitations: {
    id: string;
    email: string;
    expiresAt: string;
    usedAt: string | null;
    revoked: boolean;
  }[];
};
function Field({
  name,
  label,
  value,
  type = "text",
  maxLength = 140,
}: {
  name: string;
  label: string;
  value?: string | null;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        aria-label={label}
        type={type}
        defaultValue={value || ""}
        maxLength={maxLength}
      />
    </label>
  );
}
function TextArea({
  name,
  label,
  value,
  maxLength = 12000,
}: {
  name: string;
  label: string;
  value?: string | null;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <textarea
        name={name}
        aria-label={label}
        rows={5}
        defaultValue={value || ""}
        maxLength={maxLength}
      />
    </label>
  );
}
const get = (form: FormData, key: string) => String(form.get(key) || "");
export default function WorldEditor() {
  const [studio, setStudio] = useState<Studio | null>(null),
    [tab, setTab] = useState("letters"),
    [draft, setDraft] = useState<ContentInput | null>(null),
    [location, setLocation] = useState<LocationRecord | null | "new">(null),
    [flower, setFlower] = useState<GardenFlower | null | "new">(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [invite, setInvite] = useState("");
  async function load() {
    try {
      setStudio(await worldRequest("/api/admin/world", "GET"));
    } catch (error) {
      setError((error as Error).message);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  async function save(entity: string, data: unknown, flags?: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await worldRequest("/api/admin/world", "POST", {
        entity,
        data,
        flags,
      });
      await load();
      setMessage(
        "Little World content saved. Refresh the experience to see your changes.",
      );
      return result;
    } catch (error) {
      setError((error as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function remove(entity: string, id: string) {
    try {
      await worldRequest("/api/admin/world", "DELETE", { entity, id });
      await load();
      setDraft(null);
      setLocation(null);
      setFlower(null);
      setMessage("The record has been deleted.");
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function newContent() {
    const kind = tab as ContentInput["kind"];
    setDraft(
      contentSchema.parse({
        kind,
        title: "Untitled little keepsake",
        ...(kind === "rewards" ? { metadata: { gameId: "hearts" } } : {}),
        ...(kind === "capsules"
          ? { unlockAt: new Date(Date.now() + 86400000).toISOString() }
          : {}),
      }),
    );
  }
  function edit(record: ContentRecord) {
    setDraft(
      contentSchema.parse({
        ...record,
        metadata: JSON.parse(record.metadata),
        memoryIds: record.memories.map((link) => link.memoryId),
        assetIds: record.attachments.map((link) => link.assetId),
        unlockAt: record.capsule?.unlockAt
          ? new Date(record.capsule.unlockAt).toISOString()
          : undefined,
        timeZone: record.capsule?.timeZone,
        status: record.capsule?.status,
      }),
    );
  }
  if (!studio)
    return (
      <section className="world-editor">
        <h2>Your Little World studio.</h2>
        <p>Loading private editorial tools…</p>
        <p role="alert">{error}</p>
        <button onClick={() => void load()}>Retry loading</button>
      </section>
    );
  const tabNames: Record<string, string> = {
    letters: "Letters",
    voice: "Voice memories",
    capsules: "Time capsules",
    today: "Daily notes",
    map: "Memory map",
    music: "Music",
    dates: "Special dates",
    mood: "Mood messages",
    garden: "Growing garden",
    rewards: "Keepsake rewards",
    assets: "Private media",
    access: "Invitations & access",
    settings: "Feature settings",
  };
  function audienceFields(value?: {
    audience?: string;
    recipientId?: string | null;
  }) {
    return (
      <div className="editor-grid">
        <label>
          Audience
          <select
            name="audience"
            aria-label="Audience"
            defaultValue={value?.audience || "private"}
          >
            <option value="private">Invited participants only</option>
            <option value="public">Public / guest presentation</option>
          </select>
        </label>
        <label>
          Specific recipient (optional)
          <select
            name="recipientId"
            aria-label="Specific recipient"
            defaultValue={value?.recipientId || ""}
          >
            <option value="">All active invited participants</option>
            {studio!.users
              .filter((user) => user.id !== "site-owner" && user.active)
              .map((user) => (
                <option value={user.id} key={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
          </select>
        </label>
      </div>
    );
  }
  function memoryFields(ids: string[] = []) {
    return (
      <fieldset className="world-reference-list">
        <legend>Approved photographs and videos</legend>
        {studio!.memories.map((memory) => (
          <label key={memory.id}>
            <input
              type="checkbox"
              name="memoryIds"
              value={memory.id}
              defaultChecked={ids.includes(memory.id)}
            />
            {memory.demo ? "Sample: " : ""}
            {memory.title}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <section className="world-editor">
      <div className="editor-header">
        <div>
          <span className="handwritten">
            fifteen little corners, one shared world
          </span>
          <h2>Your Little World studio.</h2>
          <p>
            Write personal content, choose its audience, then publish
            intentionally.
          </p>
        </div>
        <button className="admin-button" onClick={() => void load()}>
          Refresh studio
        </button>
      </div>
      <div
        className="world-editor-tabs"
        aria-label="Little World content sections"
      >
        {Object.entries(tabNames).map(([id, label]) => (
          <button
            key={id}
            className="admin-button"
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              setDraft(null);
              setLocation(null);
              setFlower(null);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p>
        <Link href="/world/bucket-list">Manage the shared notebook</Link> ·{" "}
        <Link href="/world/notes">Moderate the private mailbox</Link> ·{" "}
        <Link href="/world/photo-booth">Configure a photo in the booth</Link>
      </p>
      <p className="admin-error" role="alert">
        {error}
      </p>
      <p className="admin-status" role="status">
        {message}
      </p>
      {[
        "letters",
        "voice",
        "capsules",
        "today",
        "music",
        "dates",
        "mood",
        "rewards",
      ].includes(tab) && (
        <>
          <div className="world-admin-list">
            <button className="admin-button" onClick={newContent}>
              Create {tabNames[tab].toLowerCase()}
            </button>
            {studio.content
              .filter((record) => record.kind === tab)
              .map((record) => (
                <button
                  key={record.id}
                  className="world-admin-record"
                  onClick={() => edit(record)}
                >
                  <span>{record.title}</span>
                  <small>
                    {record.enabled ? "Published" : "Draft"} · {record.audience}{" "}
                    · {record.demo ? "sample" : "personal"}
                  </small>
                </button>
              ))}
          </div>
          {tab === "today" && (
            <label>
              Import a prepared note list (JSON array of strings)
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void (async () => {
                    try {
                      const values: unknown = JSON.parse(await file.text());
                      if (
                        !Array.isArray(values) ||
                        values.length > 100 ||
                        values.some(
                          (value) =>
                            typeof value !== "string" ||
                            !value.trim() ||
                            value.length > 12000,
                        )
                      )
                        throw new Error(
                          "Choose up to 100 nonempty note strings.",
                        );
                      let imported = 0;
                      for (const [index, body] of values.entries()) {
                        const result = await save("content", {
                          kind: "today",
                          title: `Prepared note ${index + 1}`,
                          body,
                          displayOrder: index,
                          enabled: false,
                          audience: "private",
                        });
                        if (!result) break;
                        imported++;
                      }
                      setMessage(
                        `${imported} of ${values.length} notes imported as private drafts. Review them before publishing.`,
                      );
                    } catch (error) {
                      setError((error as Error).message);
                    }
                  })();
                }}
              />
            </label>
          )}
          {draft && (
            <form
              key={draft.id || `new-${draft.kind}`}
              className="world-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const metadata = {
                  artist: get(form, "artist"),
                  link: get(form, "link"),
                  transcript: get(form, "transcript"),
                  ...(draft.kind === "mood"
                    ? {
                        mood: get(form, "mood"),
                        letterId: get(form, "letterId") || null,
                        activity: get(form, "activity") || undefined,
                      }
                    : {}),
                  capsuleId: get(form, "capsuleId") || null,
                  ...(draft.kind === "rewards"
                    ? { gameId: get(form, "gameId") }
                    : {}),
                };
                void save("content", {
                  ...draft,
                  title: get(form, "title"),
                  body: get(form, "body"),
                  description: get(form, "description"),
                  audience: get(form, "audience"),
                  recipientId: get(form, "recipientId") || null,
                  date: get(form, "date") || null,
                  recurring: form.has("recurring"),
                  enabled: form.has("enabled"),
                  featured: form.has("featured"),
                  demo: form.has("demo"),
                  color: get(form, "color"),
                  displayOrder: Number(get(form, "displayOrder")),
                  memoryIds: form.getAll("memoryIds"),
                  assetIds: form.getAll("assetIds"),
                  metadata,
                  ...(draft.kind === "capsules"
                    ? {
                        unlockAt: get(form, "unlockAt"),
                        timeZone: get(form, "timeZone"),
                        status: get(form, "status"),
                      }
                    : {}),
                });
              }}
            >
              <h3>
                {draft.id ? "Edit this keepsake" : "Prepare a new keepsake"}
              </h3>
              <Field name="title" label="Keepsake title" value={draft.title} />
              <TextArea
                name="body"
                label="Personal message or dedication"
                value={draft.body}
              />
              <TextArea
                name="description"
                label="Short preview / description"
                value={draft.description}
                maxLength={1000}
              />
              {audienceFields(draft)}
              <div className="editor-grid">
                <label>
                  Paper style
                  <select
                    name="color"
                    aria-label="Paper style"
                    defaultValue={draft.color}
                  >
                    {["cream", "peach", "sage", "blue"].map((color) => (
                      <option key={color}>{color}</option>
                    ))}
                  </select>
                </label>
                <Field
                  name="displayOrder"
                  label="Display order"
                  type="number"
                  value={String(draft.displayOrder)}
                />
                <Field
                  name="date"
                  label="Optional calendar date"
                  type="date"
                  value={draft.date}
                />
              </div>
              <div className="world-admin-checks">
                <label>
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={draft.enabled}
                  />{" "}
                  Published
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="demo"
                    defaultChecked={draft.demo}
                  />{" "}
                  Clearly labeled sample content
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="recurring"
                    defaultChecked={draft.recurring}
                  />{" "}
                  Repeat the calendar date yearly
                </label>
                {draft.kind === "today" && (
                  <label>
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={draft.featured}
                    />{" "}
                    Manually featured daily note
                  </label>
                )}
              </div>
              {draft.kind === "capsules" && (
                <fieldset>
                  <legend>Server-protected release</legend>
                  <Field
                    name="unlockAt"
                    label="Release timestamp with UTC offset"
                    value={draft.unlockAt}
                  />
                  <Field
                    name="timeZone"
                    label="Display time zone"
                    value={draft.timeZone}
                  />
                  <label>
                    Capsule status
                    <select
                      name="status"
                      aria-label="Capsule status"
                      defaultValue={draft.status}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </label>
                  <p>
                    The payload stays on the server until this absolute
                    timestamp. Changing the display time zone does not change
                    the instant.
                  </p>
                </fieldset>
              )}
              {["music", "voice"].includes(draft.kind) && (
                <>
                  <Field
                    name="artist"
                    label="Artist / recording attribution"
                    value={draft.metadata.artist}
                  />
                  <Field
                    name="link"
                    label="Authorized HTTPS streaming link"
                    value={draft.metadata.link}
                    maxLength={2048}
                  />
                  <TextArea
                    name="transcript"
                    label="Recording transcript"
                    value={draft.metadata.transcript}
                    maxLength={16000}
                  />
                </>
              )}
              {draft.kind === "mood" && (
                <>
                  <label>
                    Curated feeling
                    <select
                      name="mood"
                      aria-label="Curated feeling"
                      defaultValue={draft.metadata.mood || "browsing"}
                    >
                      {[
                        "happy",
                        "tired",
                        "missing",
                        "smile",
                        "proud",
                        "browsing",
                      ].map((mood) => (
                        <option key={mood}>{mood}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Related letter
                    <select
                      name="letterId"
                      aria-label="Related letter"
                      defaultValue={draft.metadata.letterId || ""}
                    >
                      <option value="">No linked letter</option>
                      {studio.content
                        .filter((record) => record.kind === "letters")
                        .map((record) => (
                          <option key={record.id} value={record.id}>
                            {record.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Suggested activity
                    <select
                      name="activity"
                      aria-label="Suggested activity"
                      defaultValue={draft.metadata.activity || ""}
                    >
                      <option value="">No activity</option>
                      <option value="games">Little games</option>
                      <option value="garden">Growing garden</option>
                      <option value="photo-booth">Photo booth</option>
                    </select>
                  </label>
                </>
              )}
              {draft.kind === "dates" && (
                <label>
                  Related time capsule
                  <select
                    name="capsuleId"
                    aria-label="Related time capsule"
                    defaultValue={draft.metadata.capsuleId || ""}
                  >
                    <option value="">No package</option>
                    {studio.content
                      .filter((record) => record.kind === "capsules")
                      .map((record) => (
                        <option key={record.id} value={record.id}>
                          {record.title}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {memoryFields(draft.memoryIds)}
              {draft.kind === "rewards" && (
                <label>
                  Unlock after completing
                  <select
                    name="gameId"
                    aria-label="Reward game"
                    defaultValue={draft.metadata.gameId || "hearts"}
                  >
                    {[
                      "hearts",
                      "quiz",
                      "match",
                      "guess",
                      "bouquet",
                      "adventure",
                    ].map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <fieldset className="world-reference-list">
                <legend>Uploaded image and audio attachments</legend>
                {studio.assets.map((asset) => (
                  <label key={asset.id}>
                    <input
                      name="assetIds"
                      type="checkbox"
                      value={asset.id}
                      defaultChecked={draft.assetIds.includes(asset.id)}
                    />
                    {asset.title} ·{" "}
                    {asset.approved ? "approved" : "awaiting review"} ·{" "}
                    {asset.audience}
                  </label>
                ))}
                <p>
                  Review new attachments under Private media before publishing.
                </p>
              </fieldset>
              <div className="world-actions">
                <button className="button primary" disabled={busy}>
                  Save this keepsake
                </button>
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => setDraft(null)}
                >
                  Close editor
                </button>
                {draft.id && (
                  <details>
                    <summary>Delete this record</summary>
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => void remove("content", draft.id!)}
                    >
                      Confirm deletion
                    </button>
                  </details>
                )}
              </div>
              {draft.id && (
                <details className="admin-preview">
                  <summary>Owner-only content preview</summary>
                  <p className="selectable-copy">{draft.body}</p>
                  <p>
                    Capsule previews are visible only in this authenticated
                    studio.
                  </p>
                </details>
              )}
            </form>
          )}
        </>
      )}
      {tab === "assets" && (
        <>
          <label>
            Upload a private recording or attachment
            <input
              type="file"
              accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.set("file", file);
                form.set("purpose", "editorial");
                setBusy(true);
                void fetch("/api/world/upload", { method: "POST", body: form })
                  .then(async (response) => {
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    await load();
                    setMessage(
                      "File stored privately. Review it, choose its audience, then approve it.",
                    );
                  })
                  .catch((error) => setError(error.message))
                  .finally(() => setBusy(false));
                event.target.value = "";
              }}
            />
          </label>
          <div className="editor-grid">
            {studio.assets.map((asset) => (
              <form
                key={`${asset.id}-${asset.approved}-${asset.audience}`}
                className="world-asset-review"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void save("asset", {
                    id: asset.id,
                    title: get(form, "title"),
                    audience: get(form, "audience"),
                    recipientId: get(form, "recipientId") || null,
                    approved: form.has("approved"),
                  });
                }}
              >
                <h3>{asset.title}</h3>
                <small>
                  {asset.mime} · {(asset.bytes / 1024 / 1024).toFixed(2)} MB
                </small>
                {asset.mime.startsWith("audio/") ? (
                  <AudioPlayer src={asset.url} title={asset.title} />
                ) : (
                  <img src={asset.url} alt="Private attachment preview" />
                )}
                <Field
                  name="title"
                  label={`Title for ${asset.title}`}
                  value={asset.title}
                />
                {audienceFields(asset)}
                <label className="editor-checkbox">
                  <input
                    type="checkbox"
                    name="approved"
                    defaultChecked={asset.approved}
                  />{" "}
                  Approved for authorized delivery
                </label>
                <button className="admin-button" disabled={busy}>
                  Save attachment approval
                </button>
                <details>
                  <summary>Remove this file permanently</summary>
                  <button
                    type="button"
                    className="admin-button"
                    onClick={() =>
                      void worldRequest(
                        `/api/world/media/${asset.id}`,
                        "DELETE",
                      )
                        .then(load)
                        .catch((error) => setError(error.message))
                    }
                  >
                    Delete attachment & file
                  </button>
                </details>
              </form>
            ))}
          </div>
        </>
      )}
      {tab === "map" && (
        <>
          <div className="world-admin-list">
            <button className="admin-button" onClick={() => setLocation("new")}>
              Add a confirmed place
            </button>
            {studio.locations.map((place) => (
              <button
                className="world-admin-record"
                key={place.id}
                onClick={() => setLocation(place)}
              >
                {place.title} · {place.precision}
              </button>
            ))}
          </div>
          {location && (
            <form
              key={location === "new" ? "new" : location.id}
              className="world-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void save("location", {
                  id: location === "new" ? undefined : location.id,
                  title: get(form, "title"),
                  description: get(form, "description"),
                  latitude:
                    get(form, "latitude") === ""
                      ? null
                      : Number(get(form, "latitude")),
                  longitude:
                    get(form, "longitude") === ""
                      ? null
                      : Number(get(form, "longitude")),
                  precision: get(form, "precision"),
                  audience: get(form, "audience"),
                  recipientId: get(form, "recipientId") || null,
                  enabled: form.has("enabled"),
                  demo: form.has("demo"),
                  date: get(form, "date") || null,
                  memoryIds: form.getAll("memoryIds"),
                });
              }}
            >
              <Field
                name="title"
                label="Place name"
                value={location === "new" ? "" : location.title}
              />
              <TextArea
                name="description"
                label="Place description"
                value={location === "new" ? "" : location.description}
                maxLength={1000}
              />
              <div className="editor-grid">
                <Field
                  name="latitude"
                  label="Confirmed latitude (optional)"
                  value={
                    location === "new" ? "" : location.latitude?.toString()
                  }
                />
                <Field
                  name="longitude"
                  label="Confirmed longitude (optional)"
                  value={
                    location === "new" ? "" : location.longitude?.toString()
                  }
                />
                <label>
                  Location precision
                  <select
                    name="precision"
                    aria-label="Location precision"
                    defaultValue={
                      location === "new" ? "city" : location.precision
                    }
                  >
                    {["city", "approximate", "exact", "hidden"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              {audienceFields(location === "new" ? undefined : location)}
              <Field
                name="date"
                label="Optional place date"
                type="date"
                value={location === "new" ? "" : location.date}
              />
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={location !== "new" && location.enabled}
                />{" "}
                Published
              </label>
              <label>
                <input
                  type="checkbox"
                  name="demo"
                  defaultChecked={location !== "new" && location.demo}
                />{" "}
                Sample location
              </label>
              {memoryFields(
                location === "new"
                  ? []
                  : location.memories.map((link) => link.memoryId),
              )}
              <button className="button primary" disabled={busy}>
                Save this place
              </button>
              {location !== "new" && (
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => void remove("location", location.id)}
                >
                  Delete this place
                </button>
              )}
            </form>
          )}
        </>
      )}
      {tab === "garden" && (
        <>
          <div className="world-admin-list">
            <button className="admin-button" onClick={() => setFlower("new")}>
              Add an intentional growth event
            </button>
            {studio.flowers.map((flower) => (
              <button
                className="world-admin-record"
                key={flower.id}
                onClick={() => setFlower(flower)}
              >
                {flower.label} · {flower.eventKey}
              </button>
            ))}
          </div>
          {flower && (
            <form
              key={flower === "new" ? "new" : flower.id}
              className="world-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void save("flower", {
                  id: flower === "new" ? undefined : flower.id,
                  eventKey: get(form, "eventKey"),
                  label: get(form, "label"),
                  type: get(form, "type"),
                  color: get(form, "color"),
                  x: Number(get(form, "x")),
                  y: Number(get(form, "y")),
                  memoryId: get(form, "memoryId") || null,
                  contentId: get(form, "contentId") || null,
                  bucketId: flower === "new" ? null : flower.bucketId,
                  enabled: form.has("enabled"),
                });
              }}
            >
              <Field
                name="eventKey"
                label="Unique growth event key"
                value={
                  flower === "new"
                    ? `intentional:${crypto.randomUUID()}`
                    : flower.eventKey
                }
              />
              <Field
                name="label"
                label="Flower label"
                value={flower === "new" ? "" : flower.label}
              />
              <label>
                Flower type
                <select
                  name="type"
                  aria-label="Flower type"
                  defaultValue={flower === "new" ? "daisy" : flower.type}
                >
                  {["daisy", "tulip", "rose", "wildflower"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Field
                name="color"
                label="Flower color"
                type="color"
                value={flower === "new" ? "#e8a8ad" : flower.color}
              />
              <div className="editor-grid">
                <Field
                  name="x"
                  label="Horizontal position (%)"
                  type="number"
                  value={flower === "new" ? "50" : String(flower.x)}
                />
                <Field
                  name="y"
                  label="Vertical position (%)"
                  type="number"
                  value={flower === "new" ? "45" : String(flower.y)}
                />
              </div>
              <label>
                Linked memory
                <select
                  name="memoryId"
                  aria-label="Linked memory"
                  defaultValue={flower === "new" ? "" : flower.memoryId || ""}
                >
                  <option value="">No photograph</option>
                  {studio.memories.map((memory) => (
                    <option key={memory.id} value={memory.id}>
                      {memory.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Linked milestone
                <select
                  name="contentId"
                  aria-label="Linked milestone"
                  defaultValue={flower === "new" ? "" : flower.contentId || ""}
                >
                  <option value="">No milestone</option>
                  {studio.content
                    .filter((content) => content.kind === "dates")
                    .map((content) => (
                      <option key={content.id} value={content.id}>
                        {content.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={flower === "new" || flower.enabled}
                />{" "}
                Visible in the garden
              </label>
              <button className="button primary" disabled={busy}>
                Save this flower
              </button>
              {flower !== "new" && (
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => void remove("flower", flower.id)}
                >
                  Delete this flower
                </button>
              )}
            </form>
          )}
        </>
      )}
      {tab === "access" && (
        <>
          <form
            className="world-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void worldRequest("/api/world/invitations", "POST", {
                action: "invite",
                email: get(form, "email"),
                days: Number(get(form, "days")),
              })
                .then((result) => {
                  setInvite(`${window.location.origin}${result.url}`);
                  return load();
                })
                .catch((error) => setError(error.message));
            }}
          >
            <h3>A private invitation</h3>
            <Field name="email" label="Recipient email" type="email" />
            <Field
              name="days"
              label="Invitation expires in days"
              type="number"
              value="3"
            />
            <button className="button primary">
              Create an invitation link
            </button>
            <p>
              No email is sent automatically. Share the generated link with its
              intended recipient.
            </p>
            {invite && (
              <label>
                Copy this single-use invitation
                <input
                  readOnly
                  value={invite}
                  aria-label="Invitation link"
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
            )}
          </form>
          <h3>Invited participants</h3>
          {studio.users
            .filter((user) => user.id !== "site-owner")
            .map((user) => (
              <article className="world-admin-record" key={user.id}>
                <span>
                  {user.name} · {user.email} ·{" "}
                  {user.active ? "active" : "revoked"}
                </span>
                {user.active && (
                  <button
                    className="admin-button"
                    onClick={() =>
                      void worldRequest("/api/world/invitations", "DELETE", {
                        userId: user.id,
                      })
                        .then(load)
                        .catch((error) => setError(error.message))
                    }
                  >
                    Revoke access & sessions
                  </button>
                )}
              </article>
            ))}
          <h3>Invitation history</h3>
          {studio.invitations.map((invitation) => (
            <article className="world-admin-record" key={invitation.id}>
              <span>
                {invitation.email} ·{" "}
                {invitation.usedAt
                  ? "used"
                  : invitation.revoked
                    ? "revoked"
                    : `expires ${new Date(invitation.expiresAt).toLocaleDateString()}`}
              </span>
              {!invitation.revoked && !invitation.usedAt && (
                <button
                  className="admin-button"
                  onClick={() =>
                    void worldRequest("/api/world/invitations", "DELETE", {
                      invitationId: invitation.id,
                    })
                      .then(load)
                      .catch((error) => setError(error.message))
                  }
                >
                  Revoke invitation
                </button>
              )}
            </article>
          ))}
        </>
      )}
      {tab === "settings" && (
        <form
          key={JSON.stringify(studio.flags)}
          className="world-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void save(
              "settings",
              {
                ...studio.settings,
                timeZone: get(form, "timeZone"),
                guestAccess: form.has("guestAccess"),
                sharedBucket: form.has("sharedBucket"),
                boothSharing: form.has("boothSharing"),
                noteRetentionDays: Number(get(form, "noteRetentionDays")),
                companionHints: get(form, "companionHints")
                  .split("\n")
                  .map((value) => value.trim())
                  .filter(Boolean),
                surpriseFilter: get(form, "surpriseFilter"),
                surpriseIds: form.getAll("surpriseIds"),
                excludedIds: form.getAll("excludedIds"),
                stickers: form.getAll("stickers"),
              },
              Object.fromEntries(
                features.map((feature) => [
                  feature.id,
                  form.has(`flag:${feature.id}`),
                ]),
              ),
            );
          }}
        >
          <fieldset className="world-reference-list">
            <legend>Independent feature availability</legend>
            {features.map((feature) => (
              <label key={feature.id}>
                <input
                  name={`flag:${feature.id}`}
                  type="checkbox"
                  defaultChecked={studio.flags[feature.id] !== false}
                />
                {feature.title}
              </label>
            ))}
          </fieldset>
          <Field
            name="timeZone"
            label="Website time zone"
            value={studio.settings.timeZone}
          />
          <div className="world-admin-checks">
            <label>
              <input
                type="checkbox"
                name="guestAccess"
                defaultChecked={studio.settings.guestAccess}
              />{" "}
              Allow public/demo Little World content for guests
            </label>
            <label>
              <input
                type="checkbox"
                name="sharedBucket"
                defaultChecked={studio.settings.sharedBucket}
              />{" "}
              Allow recipients to edit the shared notebook
            </label>
            <label>
              <input
                type="checkbox"
                name="boothSharing"
                defaultChecked={studio.settings.boothSharing}
              />{" "}
              Enable explicit private photo-booth saving
            </label>
          </div>
          <Field
            name="noteRetentionDays"
            label="Private note retention (days)"
            type="number"
            value={String(studio.settings.noteRetentionDays)}
          />
          <TextArea
            name="companionHints"
            label="Cloud hints (one per line)"
            value={studio.settings.companionHints.join("\n")}
            maxLength={3600}
          />
          <label>
            Eligible surprise memories
            <select
              name="surpriseFilter"
              aria-label="Eligible surprise memories"
              defaultValue={studio.settings.surpriseFilter}
            >
              {["all", "featured", "captions", "videos", "surprise-only"].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <fieldset className="world-reference-list">
            <legend>Surprise-only selection</legend>
            {studio.memories.map((memory) => (
              <label key={memory.id}>
                <input
                  type="checkbox"
                  name="surpriseIds"
                  value={memory.id}
                  defaultChecked={studio.settings.surpriseIds.includes(
                    memory.id,
                  )}
                />
                {memory.title}
              </label>
            ))}
          </fieldset>
          <fieldset className="world-reference-list">
            <legend>Exclude from surprises</legend>
            {studio.memories.map((memory) => (
              <label key={memory.id}>
                <input
                  type="checkbox"
                  name="excludedIds"
                  value={memory.id}
                  defaultChecked={studio.settings.excludedIds.includes(
                    memory.id,
                  )}
                />
                {memory.title}
              </label>
            ))}
          </fieldset>
          <fieldset className="world-reference-list">
            <legend>Photo booth sticker set</legend>
            {["heart", "flower", "star"].map((sticker) => (
              <label key={sticker}>
                <input
                  type="checkbox"
                  name="stickers"
                  value={sticker}
                  defaultChecked={studio.settings.stickers.includes(
                    sticker as "heart",
                  )}
                />
                {sticker}
              </label>
            ))}
          </fieldset>
          <button className="button primary" disabled={busy}>
            Save Little World settings
          </button>
        </form>
      )}
    </section>
  );
}
