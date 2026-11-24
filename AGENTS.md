# Crayon Book Video Studio — Agent Instructions

This repository is a dedicated, lean **Crayon Picture Book** video production studio. Every video is built completely in code (WebGL2 paper-tooth + wax adhesion + watercolour resist, Canvas2D strokes, CC0 wooden/metal storybook score, procedural foley, and TTS narration).

## Key Guides
- Autonomous video production skill: [`.agents/skills/crayon-story-director/SKILL.md`](.agents/skills/crayon-story-director/SKILL.md)
- Persistent reusable libraries: [`engine/custom_props.json`](engine/custom_props.json) (models) & [`engine/custom_worlds.json`](engine/custom_worlds.json) (worlds)
- Style invariants: [`styles/crayon-book/STYLE.md`](styles/crayon-book/STYLE.md)
- Directing standards: [`DIRECTOR.md`](DIRECTOR.md)
- Technical pipeline: [`TECHNIQUE.md`](TECHNIQUE.md)
- Shared tools & CLI flags: [`core/README.md`](core/README.md)
- Available 18 CC0 instruments: [`core/audio/INSTRUMENTS.md`](core/audio/INSTRUMENTS.md)
- Working bilingual template film: [`films/one-little-seed/`](films/one-little-seed/)

## Production Rules
- Talk to the user in their language (Vietnamese by default if they write in Vietnamese).
- Build every new film inside `films/<slug>/` with its own one-command `build.sh`, `TREATMENT.md`, `CREDITS`, `poster.jpg`, `.srt`, and `<slug>.mp4`. No watermarks or third-party studio sign-offs.
- **Keep `styles/crayon-book/STYLE.md` invariants**: warm off-white anchored paper tooth (`#f4efe3`), ≤12 crayons (never black outlines), at most 1 watercolour wash per film with white-wax resist, 12 fps drawn boil + substitution acting, 24 fps smooth camera/wash, small wooden & metal-toothed instruments (no strings or grand piano), −14 LUFS mastering with `grain=0` (paper tooth is the grain).
- **Directing workflow**:
  1. Clarify topic, vocabulary/message, aspect ratio (`1920x1080` default or `1080x1920` vertical), language (EN / VI / bilingual), and storyboard preference in one concise turn.
  2. Write `TREATMENT.md` (3 candidate structures + choice, shot list, beat sheet, cue map, sound design table).
  3. Generate & Whisper-check narration (`core/tts/tts.py` for offline EN Kokoro, `core/tts/tts_zh.py` for online VI/multilingual edge-tts).
  4. Render & visually inspect model sheets + style frames before full render.
  5. Compose original CC0 score (`core/audio/sampler.py`), procedural foley & voice mix (`core/audio/sfx.py`), verify silences & voice-over-bed separation (+7 to +12 dB).
  6. Run `readcheck.mjs`, contact sheet review, full 24 fps render (`video.mjs`), two-pass `-14 LUFS` mux (`mux.sh` with `grain=0`), `blackdetect`, and final-mix Whisper check.
- On Windows PowerShell, execute `.sh` scripts with `"C:\Program Files\Git\bin\sh.exe"`.
