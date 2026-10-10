# For You ♡

A romantic scrapbook in a peach-and-blue sky, with six mini-games and fifteen integrated Little World features. Built with Next.js App Router, strict TypeScript, React Three Fiber, Three.js, GSAP ScrollTrigger, Motion, Lenis, Prisma, Better Auth, Leaflet, Zod, and the official Apify JavaScript client.

Open `/world` for the expansion. The complete feature checklist, invitation flow, private-media setup and deployment guide are in [LITTLE-WORLD.md](LITTLE-WORLD.md).

## Run locally

Use Node.js 22.13+ (Node.js 24 was used for verification). From this folder in PowerShell:

```powershell
npm.cmd install
# The supplied local .env already sets DATABASE_URL.
# In a fresh checkout, copy .env.example to .env first.
npm.cmd run db:setup
npm.cmd run dev
```

Open **http://127.0.0.1:3000**. This machine has another service on the IPv6 localhost address, so use the IPv4 URL. Choose a different port with `npm.cmd run dev -- --port 3010` if needed.

Production:

```powershell
npm.cmd run build
npm.cmd run start
```

## Make it yours

The arrival, story headings, personal letter, notes, flower replies and default game copy use everyday conversational Hinglish for Rashika. Personal text is in `src/config/story.ts`, flower choices in `src/config/entry.ts`, and game defaults in `src/config/games.ts`. Edited studio content remains independent of these defaults.

First-time visitors take a three-chapter princess walk through a sunlit tulip garden. **Haan, chalo** starts the walk; pink, cream and lilac buttons select a flower and show a cute response; a handwritten note leads into the story. There is no name question or personal-information form. The supplied Gemini garden video is the arrival's floral scenery; the separate foreground 3D and CSS flower models have been removed. Choices work through accessible HTML buttons on every device. The story mounts after the final response. Only the completed-entry flag is remembered for this browser tab's session. **Garden mein phir chalein?** in the story footer replays the walk.

The garden background plays the user's supplied Gemini-generated video directly, without the former footage blend or displacement/ripple layer. `src/components/entry/GardenMotion.tsx` plays the approximately ten-second MP4 muted and inline, with native looping and responsive cover cropping. Playback works without WebGL, pauses when the tab is hidden, retries on a first gesture when necessary, and releases resources on exit. Reduced motion avoids downloading the clip and uses a matching still frame. Missing video also leaves the entry fully usable.

The supplied clip is 1280 × 720 and approximately 7.26 MiB, served locally as `public/video/tulip-garden-gemini.mp4`. It is a byte-for-byte copy of `gemini_generated_video_11534dee.mp4`; the supplied source is preserved. The fallback/poster is `public/images/tulip-garden-gemini.webp`, extracted from the clip's opening frame. Website visitors do not contact a video-generation service. `node scripts/inspect-garden-motion.mjs` captures the entry and compares encoded video frames on desktop and phone. See [ASSETS.md](ASSETS.md) for provenance.

The opening and ending sky backgrounds use the user's second supplied Gemini video, `gemini_generated_video_c41132ea.mp4`, served as `public/video/sky-gemini.mp4` (1280 × 720, 10.005 seconds, approximately 3.67 MiB). `src/components/SkyBackground.tsx` plays the clip muted, inline and on a native loop, loading each player when its section is visible and pausing off-screen or in a hidden tab. The existing romantic soundtrack remains independent. Reduced motion and failed playback use `public/images/sky-gemini.webp`, extracted from the clip; the original sky image is preserved. `tests/sky-motion.spec.ts` checks changing decoded frames, looping, section visibility, replay, reduced motion and unavailable-video fallback on desktop and phone.

The entry, story, letter, notes, garden thoughts and game introductions use playful Hinglish. Headlines reveal individual words and draw accents under emphasized text. All effects respect reduced motion. Entry code lives in `src/components/entry/`; flower choices in `src/config/entry.ts`; shared flower artwork in `src/components/TulipBloom.tsx`; shared typography in `src/components/AnimatedHeading.tsx`; styles in `src/app/entry.css`.

Edit **`src/config/story.ts`** to set your names, hero headline lines, love letter, note messages, garden messages, ending, surprise, and optional licensed soundtrack. No relationship dates or personal history were invented.

The recipient is **Rashika**, configured once as `recipientName` near the top of that file. Her name appears in the garden welcome, story introduction, envelope, letter, ending and page metadata.

The six sample photographs are clearly identified in the gallery and detail view. They disappear once your first real memory is approved. The hero uses up to six featured memories; when none are featured, it uses the first approved memories. Use the studio to assign timeline entries, order, dates, places, captions, and gallery tags.

## Private memory studio

Set `ADMIN_SECRET` in `.env` to a randomly generated password with at least 24 characters. Restart the server, then visit **`/admin`**.

The studio supports:

- JPG, PNG, and WebP uploads, with decoding, orientation correction, resizing, and JPEG optimization.
- Image and video URLs. Videos require a poster image.
- Draft previews before approval.
- Editing title, caption, description, date, place, tags, order, chapter, and hero selection.
- Explicit approval, hiding, and removal.
- Dataset sync, configured Task execution, and verified Actor execution.
- Playground content: game availability, paper themes and order, quiz questions/answers/feedback, approved-photo clues, seven hidden-heart placements and messages, reward notes, and adventure choices.

Sessions use signed, expiring HttpOnly cookies. Mutations check request origin. Local uploaded originals are not served from the public directory: optimized photos live in `.data/uploads` and pass an approval-or-admin check before delivery. Hidden and removed uploads return 404 to anonymous visitors. Login attempts have a single-process rate limit. For multi-instance hosting, use a shared rate limiter and a shared database/storage layer. No administrative or Apify secret is sent to browser code.

## Apify configuration

### Existing dataset (recommended first connection)

Set `APIFY_API_TOKEN` and `APIFY_DATASET_ID`, restart, and use **Sync dataset**. Website visits never launch Actor runs.

Your dataset needs canonical media records:

```json
{
  "kind": "image",
  "mediaUrl": "https://your-authorized-storage.example/photo.jpg",
  "title": "Your actual memory title",
  "caption": "Your own handwritten caption",
  "description": "Your own memory",
  "date": "Your actual date",
  "location": "Your actual place",
  "tags": ["outdoors"],
  "featured": false,
  "order": 0,
  "chapter": "memories"
}
```

For videos, use `"kind": "video"` and add a valid HTTPS `thumbnailUrl`. Imports ignore any supplied `approved` value and always require review. Invalid records are counted and skipped. Duplicate URLs are skipped. Retrieval is paginated and limited to 1,000 records per sync.

No Actor was selected or supplied, so this project does **not** guess Instagram/TikTok/scraper-specific fields. When you select an Actor, inspect its actual output and add a small adapter before `normalizeImport` in `src/lib/apify.ts`. Keep Zod validation after that adapter. Direct source URLs should be replaced with durable authorized storage URLs when they expire.

### Saved Task

Set `APIFY_TASK_ID`. **Run saved task** uses its saved input. It starts a new potentially billable run only when clicked. If it hasn't finished within the wait window, sync its dataset when the run finishes; don't click Run again just to retrieve results.

### Actor

Before enabling Actor execution:

1. Inspect the selected Actor's real input schema in Apify.
2. Save your valid, authorized input as a local JSON file.
3. Set `APIFY_ACTOR_ID`, `APIFY_ACTOR_INPUT_FILE`, and `APIFY_ACTOR_SCHEMA_VERIFIED=true`.

The Actor button stays disabled until these are configured. No input fields are fabricated.

### Optional scheduled sync

Schedule your chosen Actor or Task in Apify and configure its successful-run webhook to `POST /api/apify/webhook`. Supply the custom header `Authorization: Bearer <APIFY_WEBHOOK_SECRET>`. The accepted payload is:

```json
{
  "eventType": "ACTOR.RUN.SUCCEEDED",
  "resource": { "defaultDatasetId": "YOUR_DATASET_ID" }
}
```

The webhook imports drafts, never publishes. Use HTTPS on a publicly reachable Node.js deployment. Actual Apify network execution cannot be verified until your token and dataset/task/Actor are configured.

Official client reference: [Apify JavaScript client quick start](https://docs.apify.com/api/client/js/docs/introduction/quick-start).

## Interaction and accessibility

All nine story chapters are implemented. On larger capable screens, the hero and memory gallery use real spatial meshes and photo planes, independent motion, pointer parallax, and reversible scroll-linked camera movement. Phones, reduced-motion visitors, and devices with two or fewer CPU cores use lighter animated HTML paper layers without downloading the graphics engine. HTML photo buttons provide keyboard interaction. Canvas rendering pauses offscreen; the memory canvas starts near its section. DPR is capped at 1.5.

No-WebGL devices receive interactive HTML Polaroids. Reduced motion disables floating, camera movement, smooth scrolling, and decorative animation. Modal dialogs trap focus natively, close with Escape, and restore the opener's focus. The letter is selectable HTML and can be printed. Videos use posters and native controls, and stop when the viewer closes, changes memory, or the tab becomes hidden.

The soundtrack is **Heartwarming**, a romantic piano recording by Kevin MacLeod. No audio loads or plays before a user action. Tapping **Haan, chalo** starts the piano with a 1.2-second fade to 24% playback volume; **Music chalao / Music rok do** controls it from the garden header and story. A single player continues through the reveal, and a manual pause is respected when replaying the garden. Playback pauses when the tab is hidden or another memory/audio player takes focus. The old synthesized ambient chord has been removed. The track is served locally and credited under CC BY 4.0 in both footers. To replace it, update `soundtrack` and `soundtrackCredit` in `src/config/story.ts`.

## Our little playground

The **Little Games ♡** navigation opens six playable games in the story: a relationship quiz, photograph matching, seven hidden hearts, a bouquet builder, configured memory clues, and a this-or-that adventure postcard. Every game has exit and restart controls. The garden opens the bouquet desk; the gallery opens a configured puzzle based on an approved gallery photograph. Story chapters remain accessible throughout.

Initial content lives in `src/config/games.ts`. The six preference questions have no wrong answers; two explicitly labeled sample-photo questions provide a scored demonstration. Replace these with your own actual facts in the studio. Matching automatically uses up to six approved images, including approved Apify imports. Guessing requires a manually written puzzle associated with an internal approved photo ID. Once real photos replace the sample gallery, unavailable sample questions/puzzles are filtered from the public story. The studio offers a cleanup action before publishing replacement clues.

Studio edits are validated with Zod and saved atomically to `.data/games.json`. Quiz facts, clues, heart coordinates, notes, availability, adventure choices, and advanced JSON are editable. Administrative credentials remain on the server. Anonymous edits, cross-origin mutations, and references to unpublished media are rejected.

**Little Surprises ♡** stores completed games, highest quiz scores, matching records per photo deck, found hearts, revealed memories, and up to five explicitly kept bouquets in this browser under `for-you-little-surprises:v1`. Adventure preferences are stored only when **Remember my choices** is selected. Nothing is booked or shared. Browser storage failures are reported; games still work during the current visit. Resetting progress clears the local record after confirmation.

Bouquet controls support mouse dragging, drag reordering, mobile taps, keyboard add/remove/reorder, three arrangements, three paper styles, three ribbon colors, and a 180-character note. **Save postcard as PNG** exports an actual 900 × 1050 PNG containing the chosen flowers and note. The adventure game exports an actual 1200 × 850 PNG. Both use local SVG artwork rendered through browser canvas, with no external image capture service. Seven 48px heart targets appear across the chapters, with an alternative keyboard-accessible discovery list and an envelope available only after all enabled hearts are found.

## Deployment and storage

For Vercel, use the PostgreSQL and private cloud-storage setup in [VERCEL.md](VERCEL.md). The included Vercel build configuration applies the PostgreSQL migrations. Local SQLite/filesystem settings cannot be used as persistent storage on Vercel.

The default local database is `prisma/dev.db`; canonical photo uploads live in `.data/uploads`, Little World image/audio uploads in `.data/world-media`, and playground editorial content in `.data/games.json`. For local filesystem hosting, preserve `prisma` and `.data` on persistent volumes. The private Blob/S3 adapter supports gallery uploads, Little World attachments, and booth exports. PostgreSQL deployments save playground editorial content in the database. No cloud database or storage has been provisioned or tested with credentials.

For PostgreSQL production, use `prisma/postgresql/schema.prisma` and its separate migration directory, set `DATABASE_PROVIDER=postgresql`, and follow [LITTLE-WORLD.md](LITTLE-WORLD.md). SQLite migrations cannot be replayed against PostgreSQL. A production database connection has not been provided.

The public experience intentionally follows the brief's bright, consistent sky palette; system dark mode does not invert it. Search indexing is disabled by default because this is a personal website. Publishing and public access controls have not been configured for a hosting provider.

## Verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Playwright uses installed Google Chrome, an isolated SQLite test database, `.data/games-test.json`, `.data/world-media-test`, and a separate Next.js build directory. Test startup resets isolated test editorial content and Little World tables. If Chrome isn't installed, install Playwright Chromium and remove `channel: 'chrome'` from `playwright.config.ts`. Tests never call a live Actor or use real credentials. The supplied dark motion asset is used only as a video decoding fixture in an intercepted test request; it is not part of the public romantic website.

See **`output/VERIFICATION.md`** for earlier checks, **`output/tulip-garden/VERIFICATION.md`** for the redesign, and **`output/gemini-garden/VERIFICATION.md`** for the supplied Gemini background video. Music playback checks and captures are documented in **`output/romantic-music/VERIFICATION.md`**. Desktop/mobile screenshots and browser inspection results are in `output/`.

## Assets

See `ASSETS.md` for sample image sources, font information, and the garden and sky generation prompts. The site layers the generated garden and sky with independent HTML, WebGL photographs, curved tulips, butterflies, clouds, petals and paper notes.
