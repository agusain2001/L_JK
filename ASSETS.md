# Asset provenance

The user's attached pastel-sky reference determined the direction. The supplied local `universe_landing_ui.png` and `universe_landing_motion.mp4` were preserved. The dark universe artwork is not used in the public website.

## Generated sky

Created using the built-in image generation tool, then copied into this workspace:

- Original: `public/images/sky-original.png`
- Optimized still: `public/images/sky.webp` (preserved; the story now uses the supplied sky video below).

### Supplied Gemini sky video

The user supplied `gemini_generated_video_c41132ea.mp4` to replace the story's static sky background. Its byte-for-byte runtime copy is `public/video/sky-gemini.mp4` (1280 × 720, 10.005 seconds, 3,847,716 bytes). SHA-256: `7d49151057b2693ff9655d0f67848b63c17bfbca9c08c34b216822bc2375953d`.

`public/images/sky-gemini.webp` is a 1280 × 720 poster extracted at 0.1 seconds from the supplied clip. `SkyBackground.tsx` plays the real footage silently and inline behind the opening and ending sections, loops natively, pauses off-screen or in a hidden tab, and releases the source on unmount. Reduced motion and missing footage use the matching poster. No new footage or motion filter was generated, and visitors do not contact Gemini or another generation service.

Original sky still-image prompt (separate from the supplied video):

> Use case: photorealistic-natural. Asset type: background atmospheric texture for a romantic website. Create a wide landscape 1536x1024 or wider photograph of a dreamy natural pastel sunset sky viewed looking upward, fluffy peach pink and warm ivory cumulus clouds concentrated across the bottom, lower right and upper right, soft powder blue sky visible in the central and upper left areas, pale warm diffused sunlight from upper right, delicate natural film softness, realistic cloud detail and layered atmospheric depth, gentle peaceful warm feeling. Balanced low contrast with plenty of open pale sky on the left half for dark readable HTML text. Reference aesthetic: romantic nostalgic polaroids floating in soft peach and powder blue clouds, but generate ONLY THE SKY. Absolutely NO photographs, NO polaroids, NO people, NO paper, NO text, NO objects, NO hearts, NO borders. This is one background layer and separate interactive objects will be added in code.

## Floating garden illustration

Created with the built-in image-generation tool for the scroll-driven little universe scene. Runtime asset: `public/images/little-universe.webp` (1200 × 800, transparent RGBA, approximately 223 KiB). The source image remains in the tool's generated-images directory; the optimized asset is stored in this project.

Prompt:

> Create a premium dreamy 3D miniature floating garden island, a poetic romantic keepsake world for a pastel sky scrapbook website. Centered single oval island of soft sage green grass floating on a voluminous pearl cream cloud, tiny white daisies with golden centers, a small dusty rose envelope with a heart wax seal, a delicate brass circular arch, a tiny winding cream path. Tactile clay render with realistic soft ambient occlusion, subtle paper textures, warm peach sunset rim lighting, elegant intricate miniature craft, restrained dusty rose, butter yellow and sage palette. Wide landscape composition 3:2, full island object contained in center 70 percent of image with generous transparent space on all sides. Camera looking slightly down at 25 degrees, isometric three quarter view. True transparent background, no text, no people, no watermark, no frame, no UI. High quality art asset to integrate into scroll animated website.

## Sample photographs

These are sample photographs, not photographs of the user's relationship. Downloaded, validated, and optimized locally. Captions describe scenery and are not invented relationship events.

The runtime uses compact `memory-1.webp` through `memory-6.webp` copies (quality 78). The JPEG copies are retained as source material and browser-test fixtures.

| Asset | Source |
| --- | --- |
| `memory-1.jpg` | https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2 |
| `memory-2.jpg` | https://images.unsplash.com/photo-1473116763249-2faaef81ccda |
| `memory-3.jpg` | https://images.unsplash.com/photo-1490750967868-88aa4486c946 |
| `memory-4.jpg` | https://images.unsplash.com/photo-1518837695005-2083093ee35b |
| `memory-5.jpg` | https://images.unsplash.com/photo-1470252649378-9c29740c9fa8 |
| `memory-6.jpg` | https://images.unsplash.com/photo-1500534623283-312aade485b7 |

[Unsplash license](https://unsplash.com/license). Replace these through the studio with your own authorized photos and videos.

## Tulip garden background

Created using the built-in image-generation tool for the princess garden walk. The background contains only the environment; text, tulip choices, blooming flowers, butterflies and transitions are separate interactive code.

- Runtime asset: `public/images/tulip-garden.webp` (1536 × 1024).
- Generated source: `C:/Users/ASHISH/.codex/generated_images/01a123d0-823f-7d42-9925-cf4b756b3dcb/exec-e4a09e64-6560-4b0f-959d-f907283a4428.png`.
- Optimized locally using Sharp with WebP compression, without enlarging the source.

Prompt:

> Use case: stylized-concept. Asset type: immersive fullscreen background for a romantic tulip garden website, panoramic landscape 1536x1024 or wider. Create an exquisite dreamy garden seen from a visitor's eye level as if a princess is walking along a narrow curving pale stone path through a sea of pink, blush, ivory and lilac tulips. The path begins at bottom center and curves towards the upper right into a softly blurred garden with a graceful old willow and a small distant ivory gazebo. Morning sunshine, luminous pale butter sky, airy warm haze, translucent realistic tulip petals, sage green foliage, subtle photographic depth of field and soft painterly fairytale cinematic quality. Rich dense tulips concentrated in the lower half and right third; the UPPER LEFT 45 percent must be light open warm ivory sky and soft pale mist, with little detail so dark text can be placed there in HTML. Foreground flower clusters can be slightly blurred at far left/right edges, center path clear. Main horizon at 52 percent height. Breathtaking, tender, elegant, welcoming, warm storybook romance, high detail, convincing botanical flowers, absolutely NOT low-poly or plastic clay art. Do NOT include people, princess characters, gates, hearts, text, lettering, logos, UI, borders or watermarks. This is an environmental image; real animated flowers and interactive text are layered separately in code.

## Foreground flower removal

The separate arrival flower models were removed at the user's request. `EntrySculpture.tsx` and `WebGLEntry.tsx`, including their CSS fallback flowers, are no longer part of the project. The arrival uses the supplied garden video and HTML color-choice buttons. Shared `TulipBloom.tsx` artwork is retained for the story's garden and bouquet content.

## Supplied Gemini garden video

The user supplied `gemini_generated_video_11534dee.mp4` and explicitly requested it replace the previous background effect. The website plays this video directly. The original source file remains unchanged.

- Runtime asset: `public/video/tulip-garden-gemini.mp4` (1280 × 720, 10.026667 seconds, 7,613,587 bytes).
- Source and runtime SHA-256: `94bce80c7b34f65e317b6680e6e21dab4b0e822b6c83dd74d4da97fdd364cff2`.
- Poster/reduced-motion still: `public/images/tulip-garden-gemini.webp`, captured at 0.1 seconds from the supplied clip and compressed locally using Sharp. No new image or video generation was requested.
- The user described this clip as Gemini-generated. Generation settings and separate licensing terms were not supplied.

`GardenMotion.tsx` supplies native muted inline looping playback with responsive cover cropping. The former `GardenBreeze.tsx` displacement shader, stock-video composites and local compositor script have been removed from the active site. Reduced motion shows the opening-frame still without fetching the clip; missing video retains the poster and working choices. Flower selection remains available through HTML buttons; there are no foreground flower models in the arrival.

Historical background footage was [Pink Tulips Swaying in the Wind](https://www.pexels.com/video/pink-tulips-swaying-in-the-wind-11924001/), by Focus Film/Pexels, used under the [Pexels license](https://www.pexels.com/license/). That footage and its local test composites remain only in historical `output/tulip-motion/` artifacts and are no longer served by the site. The earlier authorized Higgsfield reference upload did not produce an AI video job.

## Romantic piano soundtrack

- Track: **Heartwarming**, by **Kevin MacLeod** (incompetech.com).
- [Official track page](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100207), ISRC USUAN1100207.
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/), verified on the composer's official listing on 10 October 2026.
- Official MP3 download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3.
- Runtime file: `public/audio/heartwarming.mp3` (2,971,312 bytes, approximately 71.974 seconds, stereo).
- SHA-256: `a621a943ab940567f4136060e0f1f0637038b8a03c10ff8926f956e1b2ef34e7`.
- The recording is unmodified. Native playback loops the file and fades its volume to 0.24. No sound effects or synthesized chord layer accompany it.
- Visible title/artist and license links appear in the garden and story footers; the notice is also included in `public/audio/HEARTWARMING-LICENSE.txt`.
- `RomanticMusic.tsx` owns one player across garden/story transitions, starts only on a user action, pauses for other media or a hidden tab, and releases playback on page exit.

## Fonts

Cormorant Garamond, DM Sans, and Caveat are self-hosted under `public/fonts` and loaded through `next/font/local`. Browser visits do not contact Google Fonts. Their SIL Open Font License files are included in `public/fonts/licenses/`.

`scripts/prepare-assets.mjs` records the reproducible sample download and optimization process. It is not called at runtime and does not modify real relationship photos.
