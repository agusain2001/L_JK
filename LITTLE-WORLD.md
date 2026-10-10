# Our Little World

The existing sky, scrapbook chapters, photo gallery and six games are preserved. `/world` adds fifteen independently configurable features. Open the owner studio at `/admin` to replace samples, manage invitations and publish personal content.

## Feature checklist

| Feature | Implemented behavior | Route |
| --- | --- | --- |
| Open When Letters | Eight editable sample envelopes; selectable HTML letters, print, approved photos/audio, private audiences and reopening | `/world/letters` |
| Voice Memories | Actual uploaded audio, play/pause, seek, duration, volume, replay, transcript, attached-photo indicators and one shared playback coordinator | `/world/voice` |
| Time Capsules | UTC release timestamps, IANA display zone, server release checks, private attachments, persistent opening records, rescheduling and revocation | `/world/capsules` |
| Daily Little Notes | Stable selection within the configured calendar day, date/annual overrides, featured notes, archive and JSON import as drafts | `/world/today` |
| Memory Map | Leaflet pan/zoom, live OpenStreetMap tiles with attribution, search, linked photographs, optional/generalized/hidden coordinates and fallback place cards | `/world/map` |
| Photo Booth | Camera or local upload, three frames including a four-photo strip, crop controls, caption, date, sticker selection, real PNG download, discard and optional private save | `/world/photo-booth` |
| Tiny Cloud Companion | Lightweight CSS character, subtle pointer tilt, configured hints, navigation and persistent hide/wake preference; reduced motion support | `/world/companion` |
| Songs That Remind Me of You | Actual licensed audio uploads or authorized HTTPS service links, dedications and related memories; shared audio controls | `/world/music` |
| Future Bucket List | Authenticated shared create/edit/delete/filter, atomic ordering, completion/reopening, target dates, approved memory links and real garden milestones | `/world/bucket-list` |
| Special Dates | Calendar navigation, meaningful configured dates, annual recurrence, day counts and related capsule links; Feb 29 uses Feb 28 in non-leap years | `/world/dates` |
| Private Notes | Distinct sender/recipient accounts, real delivery, replies, approved-photo attachments, stickers, pagination, deletion, retention, rate limits and submission deduplication | `/world/notes` |
| Mood-Based Surprises | Six ephemeral choices mapped to owner-curated text, letters and activities; choices are not stored or analyzed | `/world/mood` |
| Growing Garden | Persistent flowers from approved photographs, configured milestones and completed notebook items; unique event keys avoid duplicate growth | `/world/garden` |
| Surprise Memory | Approved permitted photos/videos, repeat avoidance, configurable filters, separate deterministic “today” mode, full story and authenticated save | `/world/surprise` |
| Secret Keepsake Drawer | Persistent per-user photos, notes, booth creations and game bonuses; reopen/delete, explicit game-reward reset and browser progress synchronization | `/world/keepsakes` |

All fifteen have real interfaces and server implementations. The original six games retain their browser progress and PNG exports. Signed-in game drafts use separate browser keys for each account; completions also persist to that account’s database drawer. A new device can restore saved game progress. Published custom bonus letters and their attachment URLs remain unavailable until the associated game reward is unlocked. Game progress is a convenience feature for a personal site, not a competitive or tamper-proof scoring service.

## Local setup

Use Node.js 22.13 or later and the project lockfile. From the project folder:

```powershell
npm.cmd install
# Copy only if you do not already have .env:
Copy-Item .env.example .env
npm.cmd run db:setup
npm.cmd run dev
```

Open `http://127.0.0.1:3000/world`. Set `ADMIN_SECRET` to a random password of at least 24 characters in `.env` to enable `/admin`, then restart the frontend. The owner’s existing signed cookie remains separate from Better Auth recipient accounts. No shared administrator password is given to recipients.

For development, Better Auth generates a stable local secret in `.data/auth-secret`. Production should explicitly set `BETTER_AUTH_SECRET` to a long random value and `BETTER_AUTH_URL` to the public HTTPS origin. Never commit secrets, database files, `.data`, passwords or invitation links.

The additive SQLite migrations preserve existing photographs. Sample content is initialized on first use, once. Published samples are clearly identified: generic letters/notes, sample city pins, a spring date and two demonstration capsule timestamps. The audio sample is an original two-second chime, **not a recording of your voice**. None of those samples assert personal dates, visits or relationship facts.

## Personalize and invite

1. Sign in to `/admin`. Existing uploads and Apify records still enter manual review. Approval makes a record eligible for the selected audience; drafts never enter the public gallery or games.
2. In **Your Little World studio**, upload voice or licensed song files under **Private media**. Review the file, choose its audience and approve it. Files remain in private storage and do not become accessible merely because they were uploaded or approved.
3. Create a letter, voice memory, song, daily note, special date or capsule. Add actual words and approved references. Choose public presentation, all invited participants or a specific recipient. Preview the stored HTML and publish deliberately.
4. Under **Invitations & access**, create an expiring invitation for the recipient’s email. Copy its link and share it yourself. The app does not send email. The recipient chooses their own name and password; sign-up without an invitation is rejected. Used, expired or revoked invitations cannot create another account. Revoking a participant deactivates their account and removes existing sessions.
5. Use **Feature settings** to toggle any of the fifteen features, choose the website time zone, enable/disable guest presentation and shared notebook editing, configure note retention, allow private booth saving, change cloud hints and set eligible/excluded surprise memories and sticker choices.
6. Create optional **Keepsake rewards** with a game condition. These are bonuses; core letters and memory content remain accessible according to their own audience, without completing a game.

Use the notebook and mailbox links in the studio for owner CRUD and message moderation. Removing a message removes it from both participants; referenced library photographs remain in the library. Removing a privately saved booth creation removes its actual stored file.

Personal recordings and private photographs should use controlled uploads. A remote Instagram/CDN URL can remain accessible on its original service, so the canonical memory validator requires local uploaded media for private memory records. Existing Apify imports retain their draft-review flow and canonical memory IDs. No scraper can bypass a private account’s access controls; use authorized data exports, files you have permission to share, or an inspected Actor explicitly documented for your permitted use. No session-cookie collection or invented Actor schema is added here.

## Persistence and privacy

The Prisma schema uses separate authentication, invitation, asset, attachment, capsule/opening, location, notebook, message, flower, keepsake, reward, progress and configuration tables. Indexed `WorldContent` stores common editorial fields for typed letters, daily notes, moods, songs, dates and rewards. Join tables carry approved memory and attachment references; small JSON metadata stores optional editorial settings, not an entire user database.

Private payloads are checked on the server against the active session and recipient scope. Locked/revoked capsules send only their visible title/teaser and release metadata; their text, memory references and attachments are excluded from page data. Direct content and private-media requests enforce the same conditions. Browser clock changes cannot release a capsule. The owner’s authorized studio can preview drafts and unreleased attachments.

Private audio/image delivery goes through `/api/world/media/[id]`, with `private, no-store`, content-type checks and real byte-range responses for seeking. Storage paths are never returned to visitors. The audio coordinator pauses other recordings, background sound and video when a new player starts, and recordings pause off-screen, when the tab hides, or when their component unmounts.

Photo-booth camera streams stop on close/capture/navigation. Temporary pictures stay in memory on the device. Internal world navigation preserves the draft; a full reload or discard clears it. Downloading does not upload anything. A separate authenticated Save action is required for private persistence, and recipient saving is disabled until the owner enables it. There is no automatic gallery publication.

Private notes use a stable submission key for a retry, five new notes per minute per sender, participant checks and configurable retention. Expired notes are pruned when the mailbox is accessed. If you need deletion exactly at the retention boundary without a mailbox visit, run a scheduled database cleanup using the same retention rule. Mood choices have no history table or analytics stream. The small cloud preference and guest game progress are local browser preferences.

## Storage and deployment

For a single persistent Node.js host:

```powershell
npm.cmd run db:setup
npm.cmd run build
npm.cmd start
```

Put the Node server behind HTTPS. Preserve `prisma/dev.db` and `.data` across restarts and redeployments; back them up together. `.data/uploads` contains canonical gallery files, `.data/world-media` contains world audio/images, and `.data/games.json` contains game editorial settings. The default filesystem deployment is a single-instance setup. Do not place a SQLite file or these local files on an ephemeral deployment.

For PostgreSQL, the project includes a separate schema and generated PostgreSQL baseline migration:

```powershell
# Set DATABASE_URL to your PostgreSQL URL and DATABASE_PROVIDER=postgresql first.
npm.cmd run db:prepare:postgres
npm.cmd run db:generate:postgres
npm.cmd run db:setup:postgres
npm.cmd run build
npm.cmd start
```

SQLite and PostgreSQL have separate migration directories. `db:prepare:postgres` copies the model definitions and preserves existing PostgreSQL migrations; create a new PostgreSQL migration for future model changes. Migrate existing data deliberately if switching databases. For local SQLite again, restore `DATABASE_URL`/`DATABASE_PROVIDER` and run `db:generate`. The PostgreSQL schema and SQL are generated locally; a live PostgreSQL deployment has not been tested without a supplied database.

For private S3 or an S3-compatible service, configure `S3_BUCKET`, `S3_REGION`, optional `S3_ENDPOINT`, and your runtime IAM role or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Keep the bucket private and allow only the required object get/put/delete operations under `for-you/`. The server uses the official AWS SDK and authorizes each delivered file; it never returns a public object URL. This adapter covers world attachments and booth exports. Existing canonical photo uploads and game editorial JSON still require persistent host storage. Configure storage before adding personal assets: changing backends does not migrate previously uploaded files automatically. The clearly marked sample chime stays local.

OpenStreetMap tiles need network access and retain visible attribution. Place cards remain usable when tiles fail. Follow the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and choose an appropriate tile provider for larger traffic. Recipient sessions use [Better Auth](https://www.better-auth.com/docs/1.6/integrations/next).

## Verification and remaining inputs

Run `lint`, `typecheck`, `test`, `test:e2e` and `build` from the package scripts. Browser tests use an isolated database, build directory and world-media directory. Camera tests cover both denied permissions and a browser-generated video stream; they do not access your actual webcam. Audio tests decode a real WAV. PNG tests inspect the exported pixels and dimensions. Invitation tests establish actual distinct sessions and check known private URLs, release/revoke behavior and reward conditions.

See [verification/WORLD-VERIFICATION.md](verification/WORLD-VERIFICATION.md) for final executed results and [verification/world-desktop](verification/world-desktop) / [verification/world-mobile](verification/world-mobile) for feature screenshots.

Still needed from the owner: personal photographs, actual voice files, licensed songs or authorized links, names/letters/dates/coordinates you choose to share, an owner password, recipient invitations, hosting credentials, and any live Apify/storage/database credentials. No cloud service is claimed to be deployed or authenticated without them. Public sign-up, email sending, medical mood analysis and private Instagram access bypasses are not part of this app.

The dependency audit currently reports 14 high advisories through `basic-ftp`/Apify proxy dependencies and build-tool chains (`braces`, `deepmerge-ts`, `effect`). A compatible `npm audit fix --ignore-scripts` was executed; it did not resolve those reports. Suggested forced fixes downgrade Next ESLint or Prisma and were not applied. Review patched compatible releases before public hosting; the passing application build does not constitute a clean dependency audit.
