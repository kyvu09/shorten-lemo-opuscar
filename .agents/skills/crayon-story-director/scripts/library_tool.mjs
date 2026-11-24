#!/usr/bin/env node
/**
 * Crayon Story Director — Persistent Model & World Library Manager
 * Commands:
 *   node .agents/skills/crayon-story-director/scripts/library_tool.mjs list
 *   node .agents/skills/crayon-story-director/scripts/library_tool.mjs add-prop <recipe.json>
 *   node .agents/skills/crayon-story-director/scripts/library_tool.mjs add-world <world.json>
 *   node .agents/skills/crayon-story-director/scripts/library_tool.mjs preview-prop <type> [--out file.jpg]
 *   node .agents/skills/crayon-story-director/scripts/library_tool.mjs preview-world <preset> [--out file.jpg]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ENTITY_CATALOG } from '../../../../engine/library.js';
import { DEFAULT_CRAYONS } from '../../../../engine/schema.js';
import { sanitizeCustomProp } from '../../../../engine/gemini_director.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const CUSTOM_PROPS_PATH = path.join(ROOT, 'engine', 'custom_props.json');
const CUSTOM_WORLDS_PATH = path.join(ROOT, 'engine', 'custom_worlds.json');

const BUILTIN_WORLDS = [
  { preset: 'cozy-room',            icon: '🏠', label: 'Phòng tiệc ấm cúng (Indoor / Birthday room with window & bunting)' },
  { preset: 'riverside-pond',       icon: '🦆', label: 'Ao vịt hoa sen (Sunlit meadow + duck pond, lily pads & reeds)' },
  { preset: 'sunny-meadow',         icon: '🌈', label: 'Công viên đồng cỏ (Bright hills, cream path, wildflowers)' },
  { preset: 'starry-hill',          icon: '🌙', label: 'Ngọn đồi sao đêm (Rolling twilight hilltop with fireflies)' },
  { preset: 'forest-clearing',      icon: '🌲', label: 'Khu rừng & Dòng sông (Woodland hills, trail & right river)' },
  { preset: 'garden-cross-section', icon: '🌱', label: 'Mặt cắt khu vườn & lòng đất (Underground soil burrow + fence)' },
  { preset: 'blank-page',           icon: '📄', label: 'Trang giấy trắng tối giản (Pure cream paper tooth)' },
];

const ALLOWED_COLS = new Set(['ink', 'ochre', 'yellow', 'red', 'pink', 'green', 'sky', 'rain', 'peach', 'white', 'none']);
const ALLOWED_WORLD_KINDS = new Set(['poly', 'ellipse', 'circle', 'line', 'dab']);

function loadJsonArray(p) {
  try {
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
      return Array.isArray(d) ? d : [];
    }
  } catch {}
  return [];
}

function saveJsonArray(p, arr) {
  fs.writeFileSync(p, JSON.stringify(arr, null, 2) + '\n', 'utf-8');
}

function clampNum(v, lo, hi, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
}

function cleanCol(c, fallback = 'ochre') {
  const k = String(c || '').trim().toLowerCase();
  if (ALLOWED_COLS.has(k)) return k;
  if (/^#?(000|000000|111|111111|222|222222)$/.test(k)) return 'ink';
  if (/^#[0-9a-f]{6}$/i.test(k)) return k;
  return fallback;
}

export function sanitizeCustomWorld(raw) {
  const id = String(raw?.id || raw?.preset || 'custom_world')
    .toLowerCase().replace(/^world_/, '').replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'custom_world';
  const preset = `world_${id}`;
  const rawShapes = Array.isArray(raw?.shapes) ? raw.shapes.slice(0, 40) : [];
  const shapes = [];
  for (const s of rawShapes) {
    if (!s || !ALLOWED_WORLD_KINDS.has(s.kind)) continue;
    if (s.kind === 'poly' && Array.isArray(s.pts) && s.pts.length >= 3) {
      shapes.push({
        kind: 'poly',
        pts: s.pts.slice(0, 32).map(p => [clampNum(p?.[0], -500, 3800), clampNum(p?.[1], 0, 2000)]),
        fill: s.fill ? cleanCol(s.fill) : undefined,
        col: s.col ? cleanCol(s.col, 'ink') : undefined,
        w: clampNum(s.w, 2, 16, 5.5),
        fw: clampNum(s.fw, 6, 20, 13),
        gap: clampNum(s.gap, 6, 24, 13),
        p: clampNum(s.p, 0.18, 0.96, 0.72),
        ang: clampNum(s.ang, -3.15, 3.15, 0.08),
        smooth: Boolean(s.smooth),
        cross: Boolean(s.cross),
        wave: Boolean(s.wave),
      });
    } else if (s.kind === 'ellipse') {
      shapes.push({
        kind: 'ellipse',
        x: clampNum(s.x ?? s.cx, -400, 3600, 1600),
        y: clampNum(s.y ?? s.cy, 80, 1900, 1200),
        rx: clampNum(s.rx, 8, 1200, 160),
        ry: clampNum(s.ry, 8, 600, 70),
        rot: clampNum(s.rot, -3.15, 3.15, 0),
        fill: s.fill ? cleanCol(s.fill) : undefined,
        col: s.col ? cleanCol(s.col, 'ink') : undefined,
        w: clampNum(s.w, 2, 14, 5),
        p: clampNum(s.p, 0.18, 0.96, 0.76),
        cross: Boolean(s.cross),
        wave: Boolean(s.wave),
      });
    } else if (s.kind === 'circle') {
      shapes.push({
        kind: 'circle',
        x: clampNum(s.x ?? s.cx, -400, 3600, 1600),
        y: clampNum(s.y ?? s.cy, 80, 1900, 800),
        r: clampNum(s.r, 6, 500, 60),
        fill: s.fill ? cleanCol(s.fill) : undefined,
        col: s.col ? cleanCol(s.col, 'ink') : undefined,
        w: clampNum(s.w, 2, 14, 5),
        p: clampNum(s.p, 0.18, 0.96, 0.78),
        wave: Boolean(s.wave),
      });
    } else if (s.kind === 'line' && Array.isArray(s.pts) && s.pts.length >= 2) {
      shapes.push({
        kind: 'line',
        pts: s.pts.slice(0, 24).map(p => [clampNum(p?.[0], -500, 3800), clampNum(p?.[1], 0, 2000)]),
        col: cleanCol(s.col || s.fill, 'ink'),
        w: clampNum(s.w, 2, 16, 5.5),
        p: clampNum(s.p, 0.18, 0.96, 0.8),
        curve: Boolean(s.curve),
        wave: Boolean(s.wave),
      });
    } else if (s.kind === 'dab') {
      shapes.push({
        kind: 'dab',
        x: clampNum(s.x ?? s.cx, -400, 3600, 1600),
        y: clampNum(s.y ?? s.cy, 80, 1900, 1200),
        r: clampNum(s.r, 3, 60, 10),
        col: cleanCol(s.col || s.fill, 'yellow'),
        sq: clampNum(s.sq, 0.4, 2.5, 1),
        p: clampNum(s.p, 0.25, 0.98, 0.88),
        bob: Boolean(s.bob),
      });
    }
  }
  const kws = Array.isArray(raw?.keywords) && raw.keywords.length
    ? raw.keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 8)
    : [id.replace(/_/g, ' ')];

  return {
    id, preset,
    icon: String(raw?.icon || '🏞️').slice(0, 4),
    label: String(raw?.label || id).slice(0, 64),
    keywords: kws,
    horizonY: clampNum(raw?.horizonY, 850, 1300, 1090),
    groundCol: cleanCol(raw?.groundCol || 'green', 'green'),
    groundP: clampNum(raw?.groundP, 0.15, 0.95, 0.56),
    groundLine: raw?.groundLine !== false,
    grassTufts: Boolean(raw?.grassTufts),
    shapes,
  };
}

function readInputJson(fileArg) {
  const txt = (!fileArg || fileArg === '-')
    ? fs.readFileSync(0, 'utf-8')
    : fs.readFileSync(path.resolve(fileArg), 'utf-8');
  return JSON.parse(txt);
}

function findFontsDir() {
  for (const cand of ['films/the-kind-wolf/fonts', 'films/one-little-seed/fonts', 'styles/crayon-book/demo/fonts']) {
    const p = path.join(ROOT, cand);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function renderTempPreview(project, outPath, size = '1280x720', t = 1.0) {
  const tmpSlug = '_skill_preview_tmp';
  const tmpDir = path.join(ROOT, 'films', tmpSlug);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    fs.writeFileSync(path.join(tmpDir, 'project.json'), JSON.stringify(project, null, 2), 'utf-8');
    fs.writeFileSync(path.join(tmpDir, 'index.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Preview</title>
<style>
@font-face{font-family:"Patrick Hand";src:url("fonts/PatrickHand-Regular.ttf") format("truetype");font-weight:400;}
@font-face{font-family:"Mali";src:url("fonts/Mali-SemiBold.ttf") format("truetype");font-weight:600;}
@font-face{font-family:"Mali";src:url("fonts/Mali-Bold.ttf") format("truetype");font-weight:700;}
html,body{margin:0;background:#f4efe3;overflow:hidden}canvas{display:block;width:100vw;height:100vh}
</style></head><body><canvas id="gl"></canvas><script type="module" src="/engine/player.js"></script></body></html>`, 'utf-8');
    const fontsSrc = findFontsDir();
    if (fontsSrc && !fs.existsSync(path.join(tmpDir, 'fonts'))) {
      fs.cpSync(fontsSrc, path.join(tmpDir, 'fonts'), { recursive: true });
    }
    const stillOutDir = path.dirname(path.resolve(outPath));
    fs.mkdirSync(stillOutDir, { recursive: true });
    const baseName = path.basename(outPath, path.extname(outPath));
    execFileSync(process.execPath, [
      path.join(ROOT, 'core', 'render', 'still.mjs'),
      path.join('films', tmpSlug),
      String(t),
      '--prefix', `${baseName}_`,
      '--out', stillOutDir,
      '--size', size,
    ], { cwd: ROOT, stdio: 'inherit' });
    const generated = path.join(stillOutDir, `${baseName}_${t}.jpg`);
    const finalPath = path.resolve(outPath);
    if (fs.existsSync(generated) && generated !== finalPath) {
      fs.renameSync(generated, finalPath);
    }
    console.log(`PREVIEW_OK: ${finalPath}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ——— CLI ———
const [cmd, ...rest] = process.argv.slice(2);
const takeOpt = (flag, def = '') => {
  const i = rest.indexOf(flag);
  if (i >= 0 && i + 1 < rest.length) return rest[i + 1];
  return def;
};

if (cmd === 'list') {
  const customProps = loadJsonArray(CUSTOM_PROPS_PATH);
  const customWorlds = loadJsonArray(CUSTOM_WORLDS_PATH);
  console.log('=== BUILT-IN MODELS (26) ===');
  for (const e of ENTITY_CATALOG) console.log(`  - ${e.type.padEnd(16)} ${e.icon} ${e.label}`);
  console.log(`\n=== SAVED REUSABLE AI MODELS (${customProps.length}) [engine/custom_props.json] ===`);
  if (!customProps.length) console.log('  (none yet)');
  for (const p of customProps) console.log(`  - ${p.type.padEnd(24)} ${p.icon || '🎨'} ${p.label}  [kw: ${(p.keywords || []).join(', ')}]`);
  console.log(`\n=== BUILT-IN WORLDS (${BUILTIN_WORLDS.length}) ===`);
  for (const w of BUILTIN_WORLDS) console.log(`  - ${w.preset.padEnd(22)} ${w.icon} ${w.label}`);
  console.log(`\n=== SAVED REUSABLE AI WORLDS (${customWorlds.length}) [engine/custom_worlds.json] ===`);
  if (!customWorlds.length) console.log('  (none yet)');
  for (const w of customWorlds) console.log(`  - ${w.preset.padEnd(22)} ${w.icon || '🏞️'} ${w.label}  [kw: ${(w.keywords || []).join(', ')}]`);
} else if (cmd === 'add-prop') {
  const raw = readInputJson(rest[0]);
  const items = Array.isArray(raw) ? raw : [raw];
  const list = loadJsonArray(CUSTOM_PROPS_PATH);
  const saved = [];
  for (const item of items) {
    const clean = sanitizeCustomProp(item, item?.id || item?.type || 'prop');
    if (!clean.shapes.length) throw new Error(`Model "${clean.type}" has 0 valid shapes!`);
    const idx = list.findIndex(x => x.type === clean.type);
    if (idx >= 0) list[idx] = clean; else list.push(clean);
    saved.push(clean);
  }
  saveJsonArray(CUSTOM_PROPS_PATH, list);
  console.log(`SAVED_PROPS (${saved.length}):`, saved.map(s => `${s.type} (${s.shapes.length} shapes)`).join(', '));
} else if (cmd === 'add-world') {
  const raw = readInputJson(rest[0]);
  const items = Array.isArray(raw) ? raw : [raw];
  const list = loadJsonArray(CUSTOM_WORLDS_PATH);
  const saved = [];
  for (const item of items) {
    const clean = sanitizeCustomWorld(item);
    const idx = list.findIndex(x => x.preset === clean.preset);
    if (idx >= 0) list[idx] = clean; else list.push(clean);
    saved.push(clean);
  }
  saveJsonArray(CUSTOM_WORLDS_PATH, list);
  console.log(`SAVED_WORLDS (${saved.length}):`, saved.map(s => `${s.preset} (${s.shapes.length} shapes)`).join(', '));
} else if (cmd === 'preview-prop') {
  const targetType = rest[0];
  if (!targetType) throw new Error('Usage: preview-prop <custom_type> [--out path.jpg]');
  const customProps = loadJsonArray(CUSTOM_PROPS_PATH);
  const spec = customProps.find(p => p.type === targetType || p.id === targetType);
  if (!spec) throw new Error(`Custom prop "${targetType}" not found in engine/custom_props.json`);
  const out = takeOpt('--out', path.join(ROOT, 'films', `_preview_${spec.id}.jpg`));
  const project = {
    version: 1,
    meta: { slug: '_preview', title: `${spec.label}`, titleVi: `${spec.type} · Scale & Pose Check`, titlePos: { x: 1600, y: 630, t: 0.0 }, duration: 4, fps: 24, aspect: '16:9' },
    palette: { paper: '#f4efe3', crayons: { ...DEFAULT_CRAYONS, rain: '#7a8799' }, washEnabled: false, waxPreset: 'none' },
    world: { preset: 'blank-page', horizonY: 1120 },
    camera: [{ t: 0, x: 1600, y: 920, s: 0.78 }, { t: 4, x: 1600, y: 920, s: 0.78 }],
    entities: [
      { id: 'ref_dog', type: 'little_dog', x: 1020, y: 1220, scale: 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'r34', expr: 'happy', pose: 'stand' }] },
      { id: 'p_stand', type: spec.type, x: 1450, y: 1220, scale: spec.defaultScale || 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'r34', expr: 'happy', pose: 'stand' }] },
      { id: 'p_flip',  type: spec.type, x: 1850, y: 1220, scale: spec.defaultScale || 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'l34', expr: 'happy', pose: 'cheer' }] },
      { id: 'p_cry',   type: spec.type, x: 2220, y: 1220, scale: spec.defaultScale || 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'l34', expr: 'cry', pose: 'stand' }] },
    ],
    tags: [
      { id: 't1', t: 0, x: 1020, y: 840, en: 'SCALE REF', vi: 'Little Dog', col: '#c88a3b' },
      { id: 't2', t: 0, x: 1450, y: 840, en: 'STAND', vi: 'r34', col: '#4a8ec2' },
      { id: 't3', t: 0, x: 1850, y: 840, en: 'CHEER', vi: 'l34 flip', col: '#5a9c46' },
      { id: 't4', t: 0, x: 2220, y: 840, en: 'CRY FX', vi: 'expr=cry', col: '#d94436' },
    ],
    subtitles: [], silences: [],
    customProps: [spec],
    ending: { type: 'none', tStart: 99, tEnd: 100 },
  };
  renderTempPreview(project, out, '1280x720', 1.2);
} else if (cmd === 'preview-world') {
  const targetPreset = rest[0];
  if (!targetPreset) throw new Error('Usage: preview-world <world_preset> [--out path.jpg]');
  const customWorlds = loadJsonArray(CUSTOM_WORLDS_PATH);
  const cw = customWorlds.find(w => w.preset === targetPreset || w.id === targetPreset);
  const out = takeOpt('--out', path.join(ROOT, 'films', `_preview_${targetPreset}.jpg`));
  const project = {
    version: 1,
    meta: { slug: '_preview', title: cw ? cw.label : targetPreset, titleVi: `World Style Frame (${targetPreset})`, titlePos: { x: 1600, y: 490, t: 0.0 }, duration: 4, fps: 24, aspect: '16:9' },
    palette: { paper: '#f4efe3', crayons: { ...DEFAULT_CRAYONS, rain: '#7a8799' }, washEnabled: false, waxPreset: 'none' },
    world: { preset: cw ? cw.preset : targetPreset, horizonY: cw?.horizonY ?? 1090 },
    camera: [{ t: 0, x: 1600, y: 940, s: 0.78 }, { t: 4, x: 1600, y: 940, s: 0.78 }],
    entities: [
      { id: 'dog', type: 'little_dog', x: 1320, y: 1265, scale: 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'r34', expr: 'happy', pose: 'wave' }] },
      { id: 'cat', type: 'tabby_cat',  x: 1640, y: 1265, scale: 1.0, tStart: 0, drawDur: 0, states: [{ t: 0, view: 'l34', expr: 'happy', pose: 'cheer' }] },
    ],
    tags: [], subtitles: [], silences: [],
    ...(cw ? { customWorld: cw } : {}),
    ending: { type: 'none', tStart: 99, tEnd: 100 },
  };
  renderTempPreview(project, out, '1920x1080', 1.2);
} else {
  console.log(`Usage:
  library_tool.mjs list
  library_tool.mjs add-prop <recipe.json>
  library_tool.mjs add-world <world.json>
  library_tool.mjs preview-prop <custom_type> [--out path.jpg]
  library_tool.mjs preview-world <world_preset> [--out path.jpg]`);
}
