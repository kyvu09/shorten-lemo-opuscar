#!/usr/bin/env node
/**
 * Crayon Story Director — End-to-End Autonomous Film Producer
 * Phases:
 *   draft            Scaffold film + parse script + run real TTS (Kokoro EN + Edge/Google VI) + print exact Beat Sheet
 *   apply-storyboard Compile agent's custom storyboard.json (world, camera shots, blocking, tags, wash, custom props/world) into project.json
 *   verify           Run events.mjs + score_gen.py + mix_gen.py + readcheck.mjs + render 6 QA stills
 *   render           Full 24fps render (video.mjs) + two-pass -14 LUFS mux.sh (grain=0) + poster.jpg + blackdetect QC
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { aspectDimensions, DEFAULT_CRAYONS, projectToLines, projectToSrt } from '../../../../engine/schema.js';
import { buildAutoDirectedProject } from '../../../../engine/autodirector.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const FILMS_DIR = path.join(ROOT, 'films');
const CUSTOM_PROPS_PATH = path.join(ROOT, 'engine', 'custom_props.json');
const CUSTOM_WORLDS_PATH = path.join(ROOT, 'engine', 'custom_worlds.json');
const PY = fs.existsSync(path.join(ROOT, '.venv', 'Scripts', 'python.exe'))
  ? path.join(ROOT, '.venv', 'Scripts', 'python.exe')
  : (fs.existsSync(path.join(ROOT, '.venv', 'bin', 'python')) ? path.join(ROOT, '.venv', 'bin', 'python') : 'python');
const SH = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\bin\\sh.exe')
  ? 'C:\\Program Files\\Git\\bin\\sh.exe'
  : 'sh';

function loadJsonArray(p) {
  try {
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return Array.isArray(d) ? d : [];
    }
  } catch {}
  return [];
}

function findFontsDir() {
  for (const cand of ['core/fonts', 'films/the-kind-wolf/fonts', 'films/one-little-seed/fonts', 'styles/crayon-book/demo/fonts']) {
    const p = path.join(ROOT, cand);
    if (fs.existsSync(path.join(p, 'PatrickHand-Regular.ttf'))) return p;
  }
  return null;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    throw new Error(`Command failed (${r.status}): ${cmd} ${args.join(' ')}`);
  }
}

function writeFilmFiles(dir, project) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(project, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(path.join(dir, 'lines.json'), JSON.stringify(projectToLines(project), null, 2) + '\n', 'utf-8');
  fs.writeFileSync(path.join(dir, 'subtitles_en_vi.srt'), projectToSrt(project), 'utf-8');

  const { w, h } = aspectDimensions(project.meta?.aspect || '16:9');
  const slug = project.meta?.slug || path.basename(dir);
  const fps = Number(project.meta?.fps || 24);
  const mode = project.meta?.narrationMode || 'bilingual';

  fs.writeFileSync(path.join(dir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${String(project.meta?.title || slug).replace(/</g, '&lt;')}</title>
<style>
  @font-face{font-family:"Patrick Hand";src:url("fonts/PatrickHand-Regular.ttf") format("truetype");font-weight:400;}
  @font-face{font-family:"Mali";src:url("fonts/Mali-SemiBold.ttf") format("truetype");font-weight:600;}
  @font-face{font-family:"Mali";src:url("fonts/Mali-Bold.ttf") format("truetype");font-weight:700;}
  html,body{margin:0;background:#f4efe3;overflow:hidden}
  canvas{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<canvas id="gl"></canvas>
<script type="module" src="/engine/player.js"></script>
</body>
</html>
`, 'utf-8');

  const fontsSrc = findFontsDir();
  if (fontsSrc && !fs.existsSync(path.join(dir, 'fonts'))) {
    fs.cpSync(fontsSrc, path.join(dir, 'fonts'), { recursive: true });
  }

  const usedVoices = [...new Set((project.subtitles || []).map(s => s.voice).filter(Boolean))];
  const crfDef = Number(project.meta?.crf || 25);

  fs.writeFileSync(path.join(dir, 'CREDITS'),
`CREDITS — ${project.meta?.title || slug}${project.meta?.titleVi ? ` (${project.meta.titleVi})` : ''}

Fonts (SIL Open Font License 1.1, self-hosted from Google Fonts):
- Patrick Hand (Patrick Wagesreiter): https://github.com/google/fonts/tree/main/ofl/patrickhand
- Mali (Cadson Demak): https://github.com/google/fonts/tree/main/ofl/mali

Audio Sample Libraries (CC0 1.0 Universal):
- Samples (CC0): FreePats project (freepats.zenvoid.org), VS Chamber Orchestra: Community Edition (Versilian Studios / Sam Gossner), Versilian Community Sample Library (Versilian Studios)
  Instruments used: ukulele (FreePats), bassoon & bassoon_stac (VSCO 2 CE), recorder, marimba, glockenspiel, hand_chimes, woodblock, shaker (VCSL).

Voice Engine:
- Kokoro-82M via kokoro-onnx (Apache License 2.0${usedVoices.length ? `, voices: ${usedVoices.join(', ')}` : ''}): https://github.com/thewh1teagle/kokoro-onnx
- Vietnamese / multilingual fallback: Microsoft Edge-TTS & Google Translate TTS
- Speech-to-text verification: faster-whisper (MIT License)

Rendering & Shader Engine:
- WebGL2 paper-tooth / wax-adhesion / watercolour-resist shader and Canvas2D stroke helpers (Crayon Picture Book studio).
`, 'utf-8');

  fs.writeFileSync(path.join(dir, 'build.sh'), `#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$ROOT/films/${slug}"
PY="$ROOT/.venv/Scripts/python.exe"; [ -x "$PY" ] || PY="$ROOT/.venv/bin/python"
"$PY" "$ROOT/engine/bilingual_tts.py" "$DIR" --mode ${mode}
node "$ROOT/core/render/events.mjs" "$DIR" --size ${w}x${h}
"$PY" "$ROOT/engine/score_gen.py" "$DIR"
"$PY" "$ROOT/engine/mix_gen.py" "$DIR"
node "$ROOT/core/render/readcheck.mjs" "$DIR" --step 0.25 --size ${w}x${h}
node "$ROOT/core/render/video.mjs" "$DIR" --fps ${fps} --workers 4 --size ${w}x${h} --out "$DIR/out/video.mp4"
sh "$ROOT/core/render/mux.sh" "$DIR/out/video.mp4" "$DIR/out/mix.wav" "$DIR/${slug}.mp4" ${fps} 0 ${crfDef}
`, 'utf-8');
}

function dedupStates(states) {
  states.sort((a, b) => a.t - b.t);
  const out = [];
  for (const s of states) {
    if (out.length && Math.abs(out[out.length - 1].t - s.t) < 0.08) {
      out[out.length - 1] = { ...out[out.length - 1], ...s };
    } else out.push(s);
  }
  return out;
}

// Parse CLI flags
const args = process.argv.slice(2);
const phase = args[0];
const opt = (flag, def = '') => {
  const i = args.indexOf(flag);
  return (i >= 0 && i + 1 < args.length) ? args[i + 1] : def;
};

const slug = opt('--slug').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
if (!phase || !slug) {
  console.error(`Usage:
  produce_film.mjs draft --slug <slug> --title "<EN>" --title-vi "<VI>" --script <script.txt> [--aspect 16:9|9:16] [--mode bilingual|en|vi] [--world auto|<preset>]
  produce_film.mjs apply-storyboard --slug <slug> --storyboard <storyboard.json>
  produce_film.mjs verify --slug <slug>
  produce_film.mjs render --slug <slug> [--workers 4]`);
  process.exit(2);
}

const dir = path.join(FILMS_DIR, slug);

if (phase === 'draft') {
  const scriptPath = opt('--script');
  if (!scriptPath || !fs.existsSync(scriptPath)) throw new Error(`Script file not found: ${scriptPath}`);
  const scriptText = fs.readFileSync(scriptPath, 'utf-8');
  const title = opt('--title', slug.replace(/-/g, ' '));
  const titleVi = opt('--title-vi', title);
  const aspect = opt('--aspect', '16:9') === '9:16' ? '9:16' : '16:9';
  const narrationMode = ['bilingual', 'en', 'vi'].includes(opt('--mode', 'bilingual')) ? opt('--mode', 'bilingual') : 'bilingual';
  const worldPreset = opt('--world', 'auto');
  const customProps = loadJsonArray(CUSTOM_PROPS_PATH);
  const customWorlds = loadJsonArray(CUSTOM_WORLDS_PATH);

  // 1. Draft project & run real TTS first to measure exact clip durations
  const draft = buildAutoDirectedProject({ slug, title, titleVi, aspect, narrationMode, worldPreset, scriptText, customProps });
  if (!draft.project.subtitles.length) throw new Error('Parsed 0 subtitles from script!');
  writeFilmFiles(dir, draft.project);
  fs.writeFileSync(path.join(dir, 'script_raw.txt'), scriptText, 'utf-8');

  console.log(`\n[1/2] Synthesizing real voices (${narrationMode})...`);
  run(PY, [path.join('engine', 'bilingual_tts.py'), dir, '--mode', narrationMode]);

  // 2. Re-lock timings to measured durations
  const biPath = path.join(dir, 'voices', 'bilingual_durs.json');
  const measuredDurs = fs.existsSync(biPath) ? JSON.parse(fs.readFileSync(biPath, 'utf-8')) : null;
  const locked = buildAutoDirectedProject({ slug, title, titleVi, aspect, narrationMode, worldPreset, scriptText, measuredDurs, customProps });
  const cw = customWorlds.find(w => w.preset === worldPreset || w.id === worldPreset);
  if (cw) {
    locked.project.world.preset = cw.preset;
    locked.project.world.horizonY = cw.horizonY ?? 1090;
    locked.project.customWorld = cw;
  }
  writeFilmFiles(dir, locked.project);

  console.log(`\n=== EXACT BEAT SHEET (${slug} · ${locked.project.meta.duration}s · fridge@${locked.project.ending.tStart}s) ===`);
  locked.project.subtitles.forEach((s, i) => {
    console.log(`[${String(i).padStart(2, '0')}] ${s.id}  ${s.vt.toFixed(2)}s..${(s.vt + s.dur).toFixed(2)}s  (${s.speaker || 'narrator'})  EN: ${s.en}${s.vi ? '  |  VI: ' + s.vi : ''}`);
  });
  console.log(`\nDefault world: ${locked.project.world.preset} | Saved custom models available: ${customProps.length} | Saved custom worlds: ${customWorlds.length}`);
} else if (phase === 'apply-storyboard') {
  const sbPath = opt('--storyboard');
  if (!sbPath || !fs.existsSync(sbPath)) throw new Error(`Storyboard JSON not found: ${sbPath}`);
  const projPath = path.join(dir, 'project.json');
  if (!fs.existsSync(projPath)) throw new Error(`Run draft phase first — missing ${projPath}`);

  const project = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
  const sb = JSON.parse(fs.readFileSync(sbPath, 'utf-8'));
  const allCustomProps = loadJsonArray(CUSTOM_PROPS_PATH);
  const allCustomWorlds = loadJsonArray(CUSTOM_WORLDS_PATH);
  const subs = project.subtitles || [];
  const totalDur = Number(project.meta?.duration || 30);
  const fridgeStart = Number(project.ending?.tStart || Math.max(4, totalDur - 4.8));

  // 1. World & optional custom world embedding
  if (sb.world) {
    const cw = allCustomWorlds.find(w => w.preset === sb.world || w.id === sb.world);
    if (cw) {
      project.world = { preset: cw.preset, horizonY: cw.horizonY ?? 1090 };
      project.customWorld = cw;
    } else {
      project.world = { preset: sb.world, horizonY: Number(sb.horizonY || 1090) };
      delete project.customWorld;
    }
  }

  // 2. Wash & white-wax resist
  if (sb.wash) {
    project.palette = project.palette || { paper: '#f4efe3', crayons: { ...DEFAULT_CRAYONS, rain: '#7a8799' } };
    if (sb.wash.color) project.palette.washColor = sb.wash.color;
    if (sb.wash.waxPreset) project.palette.waxPreset = sb.wash.waxPreset;
    project.palette.washEnabled = sb.wash.disabled ? false : (sb.wash.waxPreset !== 'none');
    if (Number.isInteger(sb.wash.beatIndex) && subs[sb.wash.beatIndex]) {
      project.palette.washStart = Number((subs[sb.wash.beatIndex].vt + 0.35).toFixed(2));
    } else if (Number.isFinite(sb.wash.startSec)) {
      project.palette.washStart = Number(sb.wash.startSec);
    }
  }

  // 3. Title position
  if (sb.titlePos) {
    project.meta.titlePos = {
      x: Number(sb.titlePos.x ?? 800),
      y: Number(sb.titlePos.y ?? 500),
      t: Number(sb.titlePos.t ?? 0.5),
    };
  }

  // 4. Entities: Scenery + Animated Actors across shots
  const entities = [];
  (sb.scenery || []).forEach((s, i) => {
    const bt = Number.isInteger(s.appearBeat) && subs[s.appearBeat] ? subs[s.appearBeat] : null;
    const tStart = bt ? Number(bt.vt.toFixed(2)) : Number(s.tStart ?? 0);
    const states = Array.isArray(s.states) && s.states.length
      ? s.states.map(st => ({
          ...st,
          t: Number.isInteger(st.beat) && subs[st.beat] ? Number(subs[st.beat].vt.toFixed(2)) : Number(st.t ?? 0),
        }))
      : [{ t: 0.0, mood: s.mood || 'plain' }];
    entities.push({
      id: s.id || `sc_${s.type}_${i}`,
      type: s.type,
      x: Number(s.x ?? 1600),
      y: Number(s.y ?? 1120),
      scale: Number(s.scale ?? 1.0),
      tStart,
      drawDur: Number(s.drawDur ?? (tStart > 0 ? 0.9 : 0)),
      fillDur: Number(s.fillDur ?? (tStart > 0 ? 0.8 : 0)),
      states: dedupStates(states),
    });
  });

  const shots = Array.isArray(sb.shots) ? sb.shots.slice().sort((a, b) => (a.beat ?? 0) - (b.beat ?? 0)) : [];
  const actorMap = new Map();
  const customPropMap = new Map(allCustomProps.map(cp => [cp.type, cp]));

  shots.forEach((sh, si) => {
    const bt = subs[Math.min(subs.length - 1, Math.max(0, Number(sh.beat) || 0))] || { vt: si * 3 };
    const tShot = si === 0 ? 0.0 : Number(Math.max(0.2, bt.vt - 0.35).toFixed(2));
    for (const a of (sh.actors || [])) {
      if (!a?.type) continue;
      const aid = a.id || a.type;
      if (!actorMap.has(aid)) {
        const sc = Number(a.scale ?? customPropMap.get(a.type)?.defaultScale ?? 1.0);
        const startT = Number.isFinite(a.tStart) ? a.tStart : (si === 0 ? 0.0 : tShot);
        actorMap.set(aid, {
          id: aid, type: a.type, x: Number(a.x ?? 1600), y: Number(a.y ?? 1265), scale: sc,
          tStart: startT, drawDur: startT > 0 ? 0.65 : 0.0, fillDur: startT > 0 ? 0.55 : 0.0, states: [],
        });
      }
      const rec = actorMap.get(aid);
      const prev = rec.states[rec.states.length - 1];
      const nx = Number(a.x ?? prev?.x ?? rec.x), ny = Number(a.y ?? prev?.y ?? rec.y);
      const moved = prev && (Math.abs(prev.x - nx) > 30 || Math.abs(prev.y - ny) > 20);
      rec.states.push({
        t: tShot, x: nx, y: ny,
        ...(moved ? { moveDur: Number(a.moveDur ?? 1.25) } : {}),
        view: a.view || prev?.view || 'r34',
        pose: a.pose || 'stand',
        expr: a.expr || 'happy',
        ...(a.mood ? { mood: a.mood } : {}),
        ...(a.hat ? { hat: true } : {}),
        ...(a.layer ? { layer: a.layer } : {}),
      });
    }
  });
  for (const ent of actorMap.values()) {
    ent.states = dedupStates(ent.states);
    entities.push(ent);
  }
  if (entities.length) project.entities = entities;

  // 5. Camera path from shots with automatic HOLD keyframes (so camera stays rock-steady then glides briskly in cam.moveDur!)
  if (shots.length) {
    const cam = [];
    shots.forEach((sh, si) => {
      if (!sh.cam) return;
      const bt = subs[Math.min(subs.length - 1, Math.max(0, Number(sh.beat) || 0))] || { vt: si * 3 };
      const tShot = si === 0 ? 0.0 : Number(Math.max(0.25, bt.vt - 0.35).toFixed(2));
      const nx = Number(sh.cam.x ?? 1600), ny = Number(sh.cam.y ?? 950), ns = Number(sh.cam.s ?? 0.86);
      // Insert hold keyframe before transitioning if shot moved and moveDur > 0 (default 1.8s; set moveDur: 0 for continuous drift!)
      const prev = cam[cam.length - 1];
      const moveDur = sh.cam.moveDur !== undefined ? Number(sh.cam.moveDur) : 1.8;
      if (prev && moveDur > 0) {
        const changed = Math.abs(prev.x - nx) > 1 || Math.abs(prev.y - ny) > 1 || Math.abs(prev.s - ns) > 0.002;
        const tHold = Number((tShot - moveDur).toFixed(2));
        if (changed && tHold > prev.t + 0.25) {
          cam.push({ t: tHold, x: prev.x, y: prev.y, s: prev.s });
        }
      }
      cam.push({ t: tShot, x: nx, y: ny, s: ns });
    });
    // Hold final framing cleanly right up to fridgeStart - 0.25 before pulling out to the fridge
    const lastCam = cam[cam.length - 1];
    if (lastCam && fridgeStart - lastCam.t > 0.6) {
      cam.push({ t: Number((fridgeStart - 0.25).toFixed(2)), x: lastCam.x, y: lastCam.y, s: lastCam.s });
    }
    cam.push({ t: Number(fridgeStart.toFixed(2)), x: 1600, y: 900, s: 0.60 });
    cam.push({ t: totalDur, x: 1600, y: 900, s: 0.60 });
    cam.sort((a, b) => a.t - b.t);
    const cleanCam = [];
    for (const kf of cam) {
      if (!cleanCam.length || kf.t > cleanCam[cleanCam.length - 1].t + 0.12) cleanCam.push(kf);
    }
    project.camera = cleanCam;
  }

  // 5b. Optional explicit silences array from storyboard.json ({ id, t0, t1 } OR { id, beforeBeat, dur })
  if (Array.isArray(sb.silences)) {
    const sils = [];
    sb.silences.forEach((s, i) => {
      if (Number.isFinite(s?.t0) && Number.isFinite(s?.t1) && s.t1 > s.t0 + 0.2) {
        sils.push({ id: s.id || `sil_${i + 1}`, t0: Number(s.t0.toFixed(2)), t1: Number(s.t1.toFixed(2)) });
      } else if (Number.isInteger(s?.beforeBeat) && subs[s.beforeBeat]) {
        const durS = Math.max(0.6, Math.min(2.0, Number(s.dur ?? 1.05)));
        const t1 = Number(Math.max(0.5, subs[s.beforeBeat].vt - 0.15).toFixed(2));
        const t0 = Number(Math.max(0.2, t1 - durS).toFixed(2));
        if (t1 - t0 >= 0.4) sils.push({ id: s.id || `sil_${i + 1}`, t0, t1 });
      }
    });
    project.silences = sils;
  }

  // 6. Vocabulary Tags
  if (Array.isArray(sb.tags)) {
    project.tags = sb.tags.slice(0, 6).map((tg, i) => {
      const bt = Number.isInteger(tg.beat) && subs[tg.beat] ? subs[tg.beat] : null;
      const tVal = Number.isFinite(tg.t) ? tg.t : (bt ? Number(Math.min(totalDur - 2.6, bt.vt + 0.6).toFixed(2)) : 2.0 + i * 2.0);
      return {
        id: tg.id || `tag_${String(tg.en || i).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        t: tVal,
        x: Number(tg.x ?? 1600),
        y: Number(tg.y ?? 740),
        en: String(tg.en || '').toUpperCase(),
        vi: String(tg.vi || ''),
        col: tg.col || '#d94436',
      };
    }).sort((a, b) => a.t - b.t);
  }

  // 7. Embed every custom prop recipe referenced by entities so the film renders standalone anywhere!
  const usedTypes = new Set((project.entities || []).map(e => e.type));
  project.customProps = allCustomProps.filter(cp => usedTypes.has(cp.type));

  writeFilmFiles(dir, project);
  console.log(`APPLIED_STORYBOARD: ${slug} | world=${project.world.preset} | shots=${shots.length} | entities=${project.entities.length} | customProps=${project.customProps.length} | tags=${project.tags.length}`);
} else if (phase === 'verify') {
  const projPath = path.join(dir, 'project.json');
  const project = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
  const { w, h } = aspectDimensions(project.meta?.aspect || '16:9');
  const dur = Number(project.meta?.duration || 30);

  console.log('\n[1/5] Extracting events.json...');
  run(process.execPath, [path.join('core', 'render', 'events.mjs'), dir, '--size', `${w}x${h}`]);
  console.log('\n[2/5] Generating CC0 score & foley/voice mix...');
  run(PY, [path.join('engine', 'score_gen.py'), dir]);
  run(PY, [path.join('engine', 'mix_gen.py'), dir]);
  console.log('\n[3/5] Running reading-time check (readcheck.mjs)...');
  run(process.execPath, [path.join('core', 'render', 'readcheck.mjs'), dir, '--step', '0.25', '--size', `${w}x${h}`]);
  console.log('\n[4/5] Running automated layout overlap & edge-clip QA audit (layout_check.mjs)...');
  run(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'layout_check.mjs'), dir, '--size', `${w}x${h}`]);

  console.log('\n[5/5] Rendering 6 QA keyframe stills...');
  const fridgeStart = Number(project.ending?.tStart || Math.max(4, dur - 4.8));
  const times = [
    Math.min(3.5, dur * 0.08),
    fridgeStart * 0.25,
    fridgeStart * 0.48,
    fridgeStart * 0.72,
    Math.max(1, fridgeStart - 1.8),
    Math.min(dur - 0.5, fridgeStart + 2.8),
  ].map(t => Number(Math.max(0.5, t).toFixed(1)));
  run(process.execPath, [
    path.join('core', 'render', 'still.mjs'), dir, ...times.map(String),
    '--prefix', 'qa_', '--size', `${w}x${h}`
  ]);
  console.log('\nQA STILLS READY TO INSPECT:');
  times.forEach(t => console.log(`  - ${path.join(dir, 'stills', `qa_${t}.jpg`)}`));
} else if (phase === 'render') {
  const projPath = path.join(dir, 'project.json');
  const project = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
  const { w, h } = aspectDimensions(project.meta?.aspect || '16:9');
  const fps = Number(project.meta?.fps || 24);
  const dur = Number(project.meta?.duration || 30);
  const workers = opt('--workers', '4');
  const crf = opt('--crf', String(project.meta?.crf || 25));
  const rawVid = path.join(dir, 'out', 'video.mp4');
  const mixWav = path.join(dir, 'out', 'mix.wav');
  const finalMp4 = path.join(dir, `${slug}.mp4`);

  if (!fs.existsSync(mixWav)) {
    throw new Error(`Missing mixed audio "${mixWav}". Run the verify phase first!`);
  }

  console.log(`\n[1/3] Rendering ${Math.round(dur * fps)} frames (${w}x${h} @ ${fps}fps)...`);
  run(process.execPath, [
    path.join('core', 'render', 'video.mjs'), dir,
    '--fps', String(fps), '--workers', String(workers), '--size', `${w}x${h}`, '--out', rawVid
  ]);

  console.log(`\n[2/3] Mastering two-pass -14 LUFS MP4 (fps=${fps}, grain=0, crf=${crf})...`);
  run(SH, [
    path.join(ROOT, 'core', 'render', 'mux.sh').replace(/\\/g, '/'),
    rawVid.replace(/\\/g, '/'),
    mixWav.replace(/\\/g, '/'),
    finalMp4.replace(/\\/g, '/'),
    String(fps), '0', String(crf)
  ]);

  console.log('\n[3/3] Generating poster.jpg & running blackdetect QC...');
  const posterT = Number(Math.min(dur - 1.5, Math.max(2.0, (project.palette?.washStart || dur * 0.72) + 2.5)).toFixed(1));
  run(process.execPath, [path.join('core', 'render', 'still.mjs'), dir, String(posterT), '--prefix', 'poster_', '--size', `${w}x${h}`]);
  const pSrc = path.join(dir, 'stills', `poster_${posterT}.jpg`);
  if (fs.existsSync(pSrc)) fs.copyFileSync(pSrc, path.join(dir, 'poster.jpg'));

  const bd = spawnSync('ffmpeg', ['-i', finalMp4, '-vf', 'blackdetect=d=0.1:pix_th=0.10', '-an', '-f', 'null', '-'], { encoding: 'utf-8' });
  const blacks = (bd.stderr || '').split('\n').filter(l => l.includes('black_start'));
  const sizeMB = (fs.statSync(finalMp4).size / 1048576).toFixed(2);
  console.log(`\n=== RENDER COMPLETE ===`);
  console.log(`MP4:    ${finalMp4} (${sizeMB} MB, ${dur}s, ${w}x${h} @ ${fps}fps)`);
  console.log(`Poster: ${path.join(dir, 'poster.jpg')}`);
  console.log(`SRT:    ${path.join(dir, 'subtitles_en_vi.srt')}`);
  console.log(`Black frames detected: ${blacks.length}`);
} else {
  throw new Error(`Unknown phase: ${phase}`);
}
