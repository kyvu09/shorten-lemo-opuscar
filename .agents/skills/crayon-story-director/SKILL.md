---
name: crayon-story-director
description: >-
  Autonomous end-to-end Crayon Picture Book video director and producer. Use this skill
  whenever the user provides a story script (English, Vietnamese, or bilingual) and asks
  the agent to automatically direct, illustrate, animate, score, voice, and render a
  complete Crayon Picture Book MP4 video — including bespoke camera cinematography,
  custom environments, and creating & permanently saving reusable new character/prop
  models when needed.
---

# Crayon Story Director

Turns any pasted children's story script into a finished, mastered **Crayon Picture Book MP4** (`films/<slug>/<slug>.mp4`, 24 fps, −14 LUFS, `grain=0`) completely autonomously — designing bespoke camera shots, environments, and reusable crayon models that are saved permanently so future stories reuse them automatically.

## Invariants (Never Violate)
- Honor [styles/crayon-book/STYLE.md](../../../../styles/crayon-book/STYLE.md): warm off-white paper tooth (`#f4efe3`), ≤12 crayons (**NEVER pure black `#000`**, always cocoa `"ink"` `#472e1e`), ≤1 watercolour wash with white-wax resist per film, 12 fps hand-drawn boil, 24 fps smooth camera/wash, CC0 wooden/metal instruments only, −14 LUFS with `grain=0`.
- **Reuse first, create only what is missing**: Never redraw a model or world that already exists in built-ins or `engine/custom_props.json` / `engine/custom_worlds.json`.
- **Save everything you create**: Every new model/world MUST be saved via [library_tool.mjs](./scripts/library_tool.mjs) so both future AI Agent runs and Web Studio (`npm run studio`) reuse it automatically.
- **No repetitive templates**: Every film MUST have a bespoke `storyboard.json` tailored to its own script (varied camera motion, framing, world, and character blocking — never default to a generic left→bush→river walk unless the script is literally about a wolf/bush/river).
- **Visual inspection is mandatory**: Inspect every new model/world preview AND all 6 QA stills with `read_file` before running full 24 fps render.

## Autonomous 6-Phase Production Workflow

### Phase 1 — Inspect Existing Library (Always First)
Run the inventory command to list all 26 built-in models, saved reusable models, 7 built-in worlds, and saved reusable worlds:
```powershell
node .agents/skills/crayon-story-director/scripts/library_tool.mjs list
```
Compare the pasted script against this inventory:
- List which built-in or saved models can be **reused immediately**.
- List which important characters, props, or environments are **genuinely missing** and need to be created once and saved forever.
- Determine defaults if the user did not specify them: `aspect = 16:9` (`1920x1080`), `mode = bilingual` (if both EN & VI exist, else `en` or `vi`), `slug` from English title. Do NOT pause to ask unnecessary questions unless the user explicitly asked for a storyboard review first.

### Phase 2 — Create, Save & Visually Verify Missing Models / Worlds (Skip if All Exist)
Read [MODEL_AND_WORLD_SPEC.md](./references/MODEL_AND_WORLD_SPEC.md) for the exact coordinate system, 10-crayon palette, and shape primitives.
For each missing model:
1. Author a rich, charming JSON recipe (10–24 layered crayon shapes back-to-front; warm highlights + eye catchlights for animals; `(0,0)` at bottom-center ground contact) into a temporary file or pipe via stdin.
2. Save permanently to `engine/custom_props.json`:
   ```powershell
   node .agents/skills/crayon-story-director/scripts/library_tool.mjs add-prop <recipe.json>
   ```
3. Render an instant model sheet beside `little_dog` (scale + stand/cheer/cry check) and **inspect it with `read_file`**:
   ```powershell
   node .agents/skills/crayon-story-director/scripts/library_tool.mjs preview-prop <custom_type> --out films/_tmp_preview.jpg
   ```
   If silhouette, proportions, or details look awkward, refine the JSON and re-save (`add-prop` overwrites cleanly by `type`), then delete `films/_tmp_preview.jpg`.

For a missing environment/world (e.g. beach, snowy village, classroom, farm, space):
1. Author a custom world JSON recipe (horizon, ground, sky/water/background crayon layers) and save permanently to `engine/custom_worlds.json`:
   ```powershell
   node .agents/skills/crayon-story-director/scripts/library_tool.mjs add-world <world.json>
   ```
2. Render a 1920×1080 style frame and **inspect it with `read_file`**:
   ```powershell
   node .agents/skills/crayon-story-director/scripts/library_tool.mjs preview-world <world_preset> --out films/_tmp_world.jpg
   ```
   Refine if needed, then delete `films/_tmp_world.jpg`.

### Phase 3 — Draft Project & Synthesize Real Voices
Save the user's raw script to `films/<slug>/script_raw.txt` (creating `films/<slug>/` first), then run the `draft` phase to parse beats, synthesize real voices (Kokoro offline EN + Edge-TTS/Google fallback VI), lock exact spoken durations, and print the numbered **Exact Beat Sheet**:
```powershell
node .agents/skills/crayon-story-director/scripts/produce_film.mjs draft --slug <slug> --title "<EN Title>" --title-vi "<VI Title>" --script films/<slug>/script_raw.txt --aspect 16:9 --mode bilingual
```

### Phase 4 — Direct a Bespoke Storyboard (`storyboard.json`)
Read [STORYBOARD_GUIDE.md](./references/STORYBOARD_GUIDE.md) and author `films/<slug>/storyboard.json` tailored 100% to this story's emotional arc and beat timestamps:
- Pick the best built-in or newly saved custom `world` + curated `scenery` (no clutter, no irrelevant props).
- Choreograph **4 to 9 varied camera shots** (`cam: {x, y, s}`) synced to beat indices (`beat: 0..N-1`): vary framing (wide establishing, push-in close-up, reverse pan, skyward tilt, pull-back reveal) and keep actors ≥190 px apart inside each shot's visible frame.
- Animate **both built-in cast and custom AI models** across shots (`x`, `y`, `moveDur`, `view: "r34"|"l34"|"front"`, `pose`, `expr`, `hat`).
- Place `titlePos` in clean sky of Shot 0, choose 1 emotional `wash` (`color`, `waxPreset`, `beatIndex`), and place ≤6 bilingual `tags` with zero collision against the title or frame edges.

Compile the storyboard into `films/<slug>/project.json` (which automatically embeds all referenced `customProps` & `customWorld` for standalone rendering):
```powershell
node .agents/skills/crayon-story-director/scripts/produce_film.mjs apply-storyboard --slug <slug> --storyboard films/<slug>/storyboard.json
```

### Phase 5 — Audio Mix, Readcheck, Layout QA & Visual Stills
Run the `verify` phase (generates `events.json`, CC0 score, procedural foley + voice mix, runs `readcheck.mjs`, runs `layout_check.mjs` to detect text/character head overlaps & lingering edge clips, and renders 6 QA stills `films/<slug>/stills/qa_*.jpg`):
```powershell
node .agents/skills/crayon-story-director/scripts/produce_film.mjs verify --slug <slug>
```
**Review any `[CHAR OVERLAP]`, `[TEXT COLLIDE]`, or `[EDGE CLIP]` warnings from `layout_check.mjs` AND inspect all 6 QA stills with `read_file`!**
If any frame has an overlap, clipped title/tag, or awkward pose, adjust `films/<slug>/storyboard.json`, re-run `apply-storyboard` + `verify`, and re-inspect before rendering!

### Phase 6 — Full 24 fps Render, −14 LUFS Master (CRF 25) & Delivery
Run the `render` phase (renders 24 fps frames via `video.mjs` with static `BG_F` caching + automatic duplicate-frame reuse, masters two-pass −14 LUFS at CRF 25 with `grain=0` via `core/render/mux.sh`, creates `poster.jpg`, and runs `blackdetect` QC):
```powershell
node .agents/skills/crayon-story-director/scripts/produce_film.mjs render --slug <slug> --workers 4 --crf 25
```
Confirm `0` black frames and clean LUFS/size output, then report concisely in the user's language with clickable links to:
- Final video: `films/<slug>/<slug>.mp4`
- Poster & subtitles: `films/<slug>/poster.jpg`, `films/<slug>/subtitles_en_vi.srt`
- Any newly created & saved reusable models/worlds (`engine/custom_props.json`, `engine/custom_worlds.json`)
- Reminder that the episode can also be opened and tweaked visually anytime in `npm run studio`.
