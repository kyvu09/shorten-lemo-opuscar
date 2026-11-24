// Data-driven Crayon Picture Book scene renderer:
// Takes ANY project.json + time t -> draws WebGL2 picture + returns hitTargets (for Studio drag-and-drop) & visibleTexts (for readcheck.mjs).
import { clamp, lerp, hash, seg, eo, eio } from '../core/lib.js';
import { hexToRgb01 } from './gl.js';
import { VIEW, CAM, BOIL, WMUL, layer, clear, line, fill, dab, ellipse, smooth, text, sx, sy } from './crayon.js';
import { group, clearGroup, curve } from './rig.js';
import { ENTITY_CATALOG, drawEntity } from './library.js';
import { capturePage, renderFridgeFrame } from './fridge.js';
import { DEFAULT_CRAYONS } from './schema.js';

const PW = 3200;

// Persistent reusable Canvas2D layers (auto-resized by engine/crayon.js setView!)
const BG_F = layer(), BG_L = layer();
const WAX_L = layer(), WASH_L = layer();
const SKY_G = group(), BACK_G = group(), FRONT_G = group();
const FX_L = layer();
const TAG_K = layer(), TAG_L = layer();
const SUB_K = layer(), SUB_L = layer();

// Static BG_F cache & exact duplicate-frame fingerprint cache (for 2-3x faster rendering!)
let lastBgFillKey = '';
let lastFrameKey = '';
let lastFrameResult = { hitTargets: [], visibleTexts: [] };

// Deterministic precomputed white-wax shapes (raindrops, stars, roots)
const DROPS = (() => {
  const out = [];
  for (let i = 0; i < 86; i++) {
    const x = lerp(240, 2960, hash(i * 11.7 + 3.1));
    const y = lerp(455, 975, hash(i * 19.3 + 7.4));
    out.push({ x, y, len: lerp(26, 46, hash(i * 5.9)), tilt: -0.15 + (hash(i * 8.3) - 0.5) * 0.06, seed: 500 + i * 3 });
  }
  return out;
})();

const SKY_TWINKLES = (() => {
  const out = [];
  for (let i = 0; i < 38; i++) {
    out.push({ x: lerp(260, 2940, hash(i * 23.1 + 1.9)), y: lerp(220, 940, hash(i * 13.7 + 6.2)), seed: 640 + i * 5 });
  }
  return out;
})();

function makeRoots(sx0, sy0) {
  const raw = [
    { pts: [[0, 37], [-10, 90], [12, 140], [-4, 187]], w: 12 },
    { pts: [[-14, 37], [-85, 77], [-175, 113], [-275, 147], [-345, 175]], w: 11 },
    { pts: [[-26, 31], [-115, 53], [-215, 65], [-305, 90]], w: 9.5 },
    { pts: [[-135, 95], [-170, 143], [-215, 181]], w: 8 },
    { pts: [[-235, 130], [-258, 167], [-288, 189]], w: 7 },
    { pts: [[-85, 77], [-105, 137], [-118, 183]], w: 8 },
    { pts: [[14, 37], [90, 75], [185, 113], [285, 147], [365, 173]], w: 11 },
    { pts: [[26, 31], [115, 51], [215, 67], [315, 93]], w: 9.5 },
    { pts: [[145, 97], [175, 145], [215, 183]], w: 8 },
    { pts: [[235, 130], [265, 167], [298, 187]], w: 7 },
    { pts: [[85, 75], [102, 135], [115, 183]], w: 8 },
    { pts: [[-5, 120], [-52, 153], [-72, 185]], w: 6.5 },
    { pts: [[8, 131], [52, 160], [70, 187]], w: 6.5 },
  ];
  return raw.map((b, i) => ({ pts: curve(b.pts.map(([dx, dy]) => [sx0 + dx, sy0 + dy]), 6), w: b.w, seed: 700 + i * 7 }));
}

export function evalCamera(project, t) {
  const keys = (project.camera || []).slice().sort((a, b) => a.t - b.t);
  let base;
  if (!keys.length) base = { x: 1600, y: 900, s: 0.65 };
  else if (t <= keys[0].t) base = { x: keys[0].x, y: keys[0].y, s: keys[0].s };
  else {
    base = keys[keys.length - 1];
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t <= b.t) {
        const f = eio(seg(t, a.t, b.t));
        base = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), s: lerp(a.s, b.s, f) };
        break;
      }
    }
  }
  // Auto-adapt scale gently when viewing/exporting in 9:16 vertical mode so the full scene fits cleanly!
  const vertical = VIEW.h > VIEW.w;
  const s = vertical ? base.s * 0.62 : base.s;
  return { x: base.x, y: base.y, s };
}

function resolveEntityState(ent, t) {
  const states = (ent.states || []).slice().sort((a, b) => a.t - b.t);
  let st = states[0] || {};
  let curX = ent.x, curY = ent.y;
  const t12 = Math.floor(t * 12) / 12;
  for (const s of states) {
    if (t >= s.t) {
      st = s;
      if (s.x !== undefined || s.y !== undefined) {
        const tx = s.x ?? curX, ty = s.y ?? curY;
        if (s.moveDur > 0 && t < s.t + s.moveDur) {
          const f = eio(seg(t12, s.t, s.t + s.moveDur));
          curX = lerp(curX, tx, f);
          curY = lerp(curY, ty, f);
        } else {
          curX = tx;
          curY = ty;
        }
      }
    }
  }
  const drawDur = ent.drawDur ?? 0;
  const fillDur = ent.fillDur ?? drawDur;
  const tStart = ent.tStart ?? 0;
  const draw = drawDur > 0 ? eo(seg(t, tStart, tStart + drawDur)) : (t >= tStart ? 1 : 0);
  const fillP = fillDur > 0 ? eo(seg(t, tStart + drawDur * 0.4, tStart + drawDur * 0.4 + fillDur)) : draw;

  const out = { ...st, x: curX, y: curY, draw, fillP };
  if (ent.type === 'sun') {
    out.rot = Math.floor(t * 12) * 0.012;
    out.heat = st.mood === 'blaze' ? 0.95 : 0.0;
  } else if (ent.type === 'flower') {
    if (st.mood === 'full') {
      out.stemP = 1; out.leafP = 1; out.petalP = 1;
    } else {
      out.stemP = eio(seg(t, tStart, tStart + Math.max(0.5, drawDur)));
      out.leafP = eo(seg(t, tStart + drawDur * 0.35, tStart + drawDur * 0.92));
      out.petalP = eo(seg(t, tStart + drawDur * 0.98, tStart + drawDur * 0.98 + Math.max(0.5, fillDur)));
    }
    out.sway = Math.sin(t * 2.1) * 0.45;
  } else if (ent.type === 'seed') {
    out.sproutP = st.mood === 'sprout' ? eo(seg(t, st.t, st.t + 2.4)) : 0;
  }
  return out;
}

function resolveWorldCol(C, name) {
  if (!name) return null;
  const k = String(name).trim().toLowerCase();
  if (C[k]) return C[k];
  if (/^#?(000|000000|111|111111|222|222222)$/.test(k)) return C.ink;
  if (/^#[0-9a-f]{6}$/i.test(k)) return k;
  return C.ochre;
}

function drawCustomWorld(BG_F, BG_L, C, cw, hy, xMin, xMax, gY, t12, skipFill = false) {
  const bgFill = (poly, o) => { if (!skipFill) fill(BG_F, poly, o); };
  const bgDab = (x, y, r, o) => { if (!skipFill) dab(BG_F, x, y, r, o); };
  // Optional base ground fill below horizon
  if (cw.groundCol && cw.groundCol !== 'none') {
    const gc = resolveWorldCol(C, cw.groundCol) || C.green;
    const hPts = [];
    for (let x = xMin; x <= xMax; x += 64) hPts.push([x, gY(x)]);
    if (!skipFill) {
      const groundPoly = [...hPts, [xMax, 1940], [xMin, 1940]];
      fill(BG_F, groundPoly, { col: gc, p: clamp(Number(cw.groundP ?? 0.56), 0.15, 0.95), gap: 15, w: 14, over: 6, seed: 12, ang: -0.05, boil: 0 });
    }
    if (cw.groundLine !== false) {
      line(BG_L, hPts, { col: C.ink, w: 7, p: 0.85, seed: 15, boil: 0.45 });
    }
    if (cw.grassTufts) {
      for (let i = 0; i < 20; i++) {
        const gx = 160 + i * 145 + (hash(i * 9.1) - 0.5) * 40;
        const gy = gY(gx), h = 22 + hash(i * 4.7) * 18;
        line(BG_L, [[gx - 10, gy], [gx - 18, gy - h]], { col: C.green, w: 5.5, p: 0.85, seed: 20 + i * 3, boil: 0.35 });
        line(BG_L, [[gx + 10, gy], [gx + 18, gy - h * 0.9]], { col: C.green, w: 5.5, p: 0.85, seed: 22 + i * 3, boil: 0.35 });
      }
    }
  }
  const shapes = Array.isArray(cw.shapes) ? cw.shapes : [];
  shapes.forEach((sh, i) => {
    const sd = 200 + i * 9;
    const fillCol = sh.fill ? resolveWorldCol(C, sh.fill) : null;
    const strokeCol = sh.col ? resolveWorldCol(C, sh.col) : null;
    const w = clamp(Number(sh.w ?? 5.5), 2, 18);
    const p = clamp(Number(sh.p ?? 0.78), 0.15, 0.96);
    const dxWave = sh.wave ? Math.sin(t12 * 2.0 + i * 1.3) * 10 : 0;
    const mapPt = ([px, py]) => [Number(px || 0) + dxWave, Number(py || 0)];
    if (sh.kind === 'poly' && Array.isArray(sh.pts) && sh.pts.length >= 3) {
      const raw = sh.pts.map(mapPt);
      const pts = sh.smooth ? smooth(raw, 5, true) : raw;
      if (fillCol) bgFill(pts, { col: fillCol, p, gap: Number(sh.gap ?? 13), w: Number(sh.fw ?? 13), over: 5, seed: sd, ang: Number(sh.ang ?? 0.08), boil: 0, ...(sh.cross ? { cross: true, crossP: 0.34 } : {}) });
      if (strokeCol) line(BG_L, pts, { col: strokeCol, w, p: Math.min(0.92, p + 0.1), seed: sd + 1, boil: 0.35, closed: true });
    } else if (sh.kind === 'ellipse') {
      const pts = ellipse(Number(sh.x || 0) + dxWave, Number(sh.y || 0), Math.max(4, Number(sh.rx || 120)), Math.max(4, Number(sh.ry || 60)), 32, 0, Math.PI * 2, Number(sh.rot || 0));
      if (fillCol) bgFill(pts, { col: fillCol, p, gap: Number(sh.gap ?? 11), w: Number(sh.fw ?? 12), over: 4, seed: sd, ang: Number(sh.ang ?? 0.05), boil: 0, ...(sh.cross ? { cross: true, crossP: 0.32 } : {}) });
      if (strokeCol) line(BG_L, pts, { col: strokeCol, w, p: Math.min(0.92, p + 0.1), seed: sd + 1, boil: 0.35, closed: true });
    } else if (sh.kind === 'circle') {
      const pts = handCircle(Number(sh.x || 0) + dxWave, Number(sh.y || 0), Math.max(4, Number(sh.r || 60)), sd, 0.08, 28);
      if (fillCol) bgFill(pts, { col: fillCol, p, gap: Number(sh.gap ?? 10), w: Number(sh.fw ?? 11), over: 4, seed: sd, boil: 0 });
      if (strokeCol) line(BG_L, pts, { col: strokeCol, w, p: Math.min(0.92, p + 0.1), seed: sd + 1, boil: 0.35 });
    } else if (sh.kind === 'line' && Array.isArray(sh.pts) && sh.pts.length >= 2) {
      const raw = sh.pts.map(mapPt);
      const pts = sh.curve && raw.length >= 3 ? curve(raw, 5) : raw;
      line(BG_L, pts, { col: strokeCol || fillCol || C.ink, w, p, seed: sd + 1, boil: 0.35 });
    } else if (sh.kind === 'dab') {
      const dyBob = sh.bob ? Math.sin(t12 * 2.4 + i * 1.7) * 14 : 0;
      if (sh.bob || sh.wave) {
        dab(BG_L, Number(sh.x || 0) + dxWave, Number(sh.y || 0) + dyBob, Math.max(2, Number(sh.r || 10)), { col: strokeCol || fillCol || C.yellow, p, sq: Number(sh.sq ?? 1), seed: sd + 1, boil: 0.2 });
      } else {
        bgDab(Number(sh.x || 0), Number(sh.y || 0), Math.max(2, Number(sh.r || 10)), { col: strokeCol || fillCol || C.yellow, p, sq: Number(sh.sq ?? 1), seed: sd + 1, boil: 0 });
      }
    }
  });
}

function drawWorldPreset(BG_F, BG_L, C, project, t, skipFill = false) {
  const preset = project.world?.preset || 'garden-cross-section';
  if (preset === 'blank-page') return;
  const hy = project.world?.horizonY ?? 1090;
  const seedX = project.world?.seedX ?? 1680;
  const seedY = project.world?.seedY ?? 1365;
  const gY = x => hy + Math.sin(x / 380) * 14 - Math.exp(-(((x - seedX) / 210) ** 2)) * 16;
  const t12 = BOIL.step / 12;
  const bgFill = (poly, o) => { if (!skipFill) fill(BG_F, poly, o); };
  const bgDab = (x, y, r, o) => { if (!skipFill) dab(BG_F, x, y, r, o); };

  // Declarative custom world saved by AI Agent (project.customWorld)!
  if (project.customWorld && (!project.customWorld.preset || project.customWorld.preset === preset || preset.startsWith('world_'))) {
    drawCustomWorld(BG_F, BG_L, C, project.customWorld, hy, -420, PW + 560, gY, t12, skipFill);
    return;
  }

  const horizonPts = [];
  const wide = preset === 'forest-clearing' || preset === 'cozy-room' || preset === 'riverside-pond' || preset === 'starry-hill' || preset === 'sunny-meadow';
  const xMin = wide ? -420 : -40;
  const xMax = wide ? PW + 560 : PW + 40;
  for (let x = xMin; x <= xMax; x += 48) {
    const hillLift = preset === 'starry-hill' ? -Math.exp(-(((x - 1600) / 950) ** 2)) * 90 : 0;
    horizonPts.push([x, gY(x) + hillLift]);
  }

  if (preset === 'cozy-room') {
    const fy = hy + 28;
    const floorPoly = [[xMin, fy], [xMax, fy], [xMax, 1940], [xMin, 1940]];
    bgFill(floorPoly, { col: C.ochre, p: 0.52, gap: 16, w: 14, over: 6, seed: 12, ang: 0.02, boil: 0 });
    line(BG_L, [[xMin, fy], [xMax, fy]], { col: C.ink, w: 7, p: 0.85, seed: 15, boil: 0.45 });
    for (let k = 1; k <= 5; k++) {
      const py = fy + k * 115;
      line(BG_L, [[xMin, py], [xMax, py]], { col: C.ink, w: 3.5, p: 0.32, seed: 15 + k, boil: 0.25 });
    }
    const wx = 1860, wy = 710, ww = 250, wh = 220;
    const winP = [[wx - ww * 0.5, wy - wh * 0.5], [wx + ww * 0.5, wy - wh * 0.5], [wx + ww * 0.5, wy + wh * 0.5], [wx - ww * 0.5, wy + wh * 0.5]];
    bgFill(winP, { col: C.sky, p: 0.54, gap: 11, w: 12, over: 3, seed: 24, boil: 0 });
    line(BG_L, [...winP, winP[0]], { col: C.ink, w: 7, p: 0.85, seed: 25, boil: 0.45 });
    line(BG_L, [[wx, wy - wh * 0.5], [wx, wy + wh * 0.5]], { col: C.ink, w: 5.5, p: 0.82, seed: 26, boil: 0.4 });
    line(BG_L, [[wx - ww * 0.5, wy], [wx + ww * 0.5, wy]], { col: C.ink, w: 5.5, p: 0.82, seed: 27, boil: 0.4 });
    const flagCols = [C.red, C.yellow, C.sky, C.pink, C.green];
    const stringPts = [];
    for (let x = -220; x <= 3460; x += 80) {
      const sag = Math.abs(Math.sin(x / 320)) * 42;
      stringPts.push([x, 334 + sag]);
    }
    line(BG_L, stringPts, { col: C.ink, w: 4.5, p: 0.72, seed: 30, boil: 0.4 });
    for (let i = 0; i < stringPts.length - 1; i++) {
      const a = stringPts[i], b = stringPts[i + 1];
      const mx = (a[0] + b[0]) * 0.5, my = (a[1] + b[1]) * 0.5 + 46;
      const tri = [a, b, [mx, my]];
      bgFill(tri, { col: flagCols[i % flagCols.length], p: 0.82, gap: 6, w: 7, over: 2, seed: 40 + i, boil: 0 });
      line(BG_L, [a, [mx, my], b], { col: C.ink, w: 3.8, p: 0.72, seed: 100 + i, boil: 0.35 });
    }
    return;
  }

  if (preset === 'garden-cross-section') {
    const crust = [...horizonPts, [PW + 40, hy + 125], [2600, hy + 130], [1980, hy + 122], [1680, hy + 135], [1250, hy + 120], [600, hy + 128], [-40, hy + 125]];
    bgFill(crust, { col: C.ochre, p: 0.42, gap: 16, w: 14, over: 6, seed: 12, ang: 0.06, boil: 0 });
  } else if (preset === 'forest-clearing') {
    const hills = smooth([
      [-460, hy + 10], [-140, hy - 140], [160, hy - 145], [520, hy - 185], [920, hy - 110], [1340, hy - 210],
      [1820, hy - 155], [2240, hy - 220], [2680, hy - 145], [3060, hy - 180], [3460, hy - 135], [PW + 580, hy + 10]
    ], 5, true);
    bgFill(hills, { col: C.green, p: 0.30, gap: 18, w: 15, over: 6, seed: 8, ang: 0.14, boil: 0 });
    line(BG_L, hills.slice(1, -1), { col: C.green, w: 4.5, p: 0.55, seed: 9, boil: 0.25 });

    const lawn = [...horizonPts, [xMax, 1940], [xMin, 1940]];
    bgFill(lawn, { col: C.green, p: 0.64, gap: 14, w: 14, over: 6, seed: 12, ang: -0.08, boil: 0 });

    const pathPoly = smooth([
      [-40, hy + 145], [460, hy + 125], [980, hy + 150], [1560, hy + 120], [2180, hy + 145], [2440, hy + 170],
      [2420, hy + 275], [1980, hy + 255], [1480, hy + 235], [920, hy + 265], [380, hy + 245], [-40, hy + 255]
    ], 5, true);
    bgFill(pathPoly, { col: C.ochre, p: 0.46, gap: 14, w: 12, over: 5, seed: 31, ang: 0.04, boil: 0 });

    const river = smooth([
      [2840, hy - 14], [2970, hy - 12], [3060, hy + 135], [3190, hy + 340], [3260, 1840],
      [2760, 1840], [2680, hy + 380], [2690, hy + 185], [2780, hy + 55]
    ], 5, true);
    bgFill(river, { col: C.sky, p: 0.78, gap: 11, w: 13, over: 6, seed: 34, ang: 0.12, boil: 0, cross: true, crossP: 0.35 });
    line(BG_L, curve([[2840, hy - 10], [2780, hy + 58], [2692, hy + 190], [2686, hy + 385], [2760, 1820]], 6), { col: C.ink, w: 5.5, p: 0.72, seed: 35, boil: 0.45 });
    line(BG_L, curve([[2972, hy - 10], [3058, hy + 138], [3188, hy + 342], [3248, 1820]], 6), { col: C.ink, w: 5.5, p: 0.72, seed: 36, boil: 0.45 });
    [[2850, hy + 95, 76], [2815, hy + 210, 96], [2860, hy + 330, 110], [2920, hy + 465, 118], [2975, hy + 585, 105]].forEach(([rx, ry, rw], i) => {
      const sh = Math.sin(t12 * 2.2 + i * 1.4) * 8;
      line(BG_L, [[rx - rw * 0.5 + sh, ry], [rx + rw * 0.5 + sh, ry]], { col: C.white, w: 5.5, p: 0.88, seed: 40 + i, boil: 0.35 });
    });

    [[260, hy + 72, C.yellow], [490, hy + 310, C.pink], [820, hy + 88, C.yellow], [1220, hy + 305, C.pink],
     [1680, hy + 290, C.yellow], [2040, hy + 78, C.pink], [2310, hy + 315, C.yellow], [2540, hy + 140, C.pink]].forEach(([fx, fy, fc], i) => {
      bgDab(fx, fy, 11, { col: fc, p: 0.9, seed: 50 + i, boil: 0 });
      bgDab(fx, fy, 4.5, { col: C.white, p: 0.9, seed: 60 + i, boil: 0 });
    });
  } else if (preset === 'riverside-pond') {
    const hills = smooth([
      [-460, hy + 10], [-80, hy - 125], [460, hy - 95], [1080, hy - 165], [1640, hy - 110],
      [2260, hy - 170], [2880, hy - 115], [3460, hy - 140], [PW + 580, hy + 10]
    ], 5, true);
    bgFill(hills, { col: C.green, p: 0.28, gap: 18, w: 15, over: 6, seed: 18, ang: 0.12, boil: 0 });
    line(BG_L, hills.slice(1, -1), { col: C.green, w: 4, p: 0.5, seed: 19, boil: 0.25 });

    const lawn = [...horizonPts, [xMax, 1940], [xMin, 1940]];
    bgFill(lawn, { col: C.green, p: 0.58, gap: 15, w: 14, over: 6, seed: 22, ang: -0.06, boil: 0 });

    const pcx = 2360, pcy = hy + 245;
    const pond = ellipse(pcx, pcy, 430, 148, 36);
    bgFill(pond, { col: C.sky, p: 0.80, gap: 10, w: 13, over: 5, seed: 34, ang: 0.05, boil: 0, cross: true, crossP: 0.32 });
    line(BG_L, pond, { col: C.ink, w: 5.5, p: 0.72, seed: 35, boil: 0.45, closed: true });
    [[pcx - 190, pcy - 32, 95], [pcx + 40, pcy - 54, 110], [pcx - 60, pcy + 34, 130], [pcx + 170, pcy + 42, 95]].forEach(([rx, ry, rw], i) => {
      const sh = Math.sin(t12 * 2.0 + i * 1.5) * 9;
      line(BG_L, [[rx - rw * 0.5 + sh, ry], [rx + rw * 0.5 + sh, ry]], { col: C.white, w: 5.5, p: 0.88, seed: 40 + i, boil: 0.35 });
    });
    [[pcx - 245, pcy + 54, 42], [pcx + 255, pcy - 22, 38], [pcx + 110, pcy + 88, 36]].forEach(([lx, ly, lr], i) => {
      const pad = ellipse(lx, ly, lr, lr * 0.45, 18);
      bgFill(pad, { col: C.green, p: 0.90, gap: 5, w: 7, over: 2, seed: 46 + i, boil: 0 });
      line(BG_L, pad, { col: C.ink, w: 3.5, p: 0.72, seed: 50 + i, boil: 0.3, closed: true });
      if (i < 2) bgDab(lx + 4, ly - 10, 12, { col: C.pink, p: 0.92, seed: 55 + i, boil: 0 });
    });
    [pcx - 415, pcx - 385, pcx + 395, pcx + 425].forEach((rx, i) => {
      const ry = pcy - 28 + (i % 2) * 26;
      line(BG_L, curve([[rx, ry + 40], [rx + (i % 2 ? 12 : -10), ry - 48], [rx + (i % 2 ? 16 : -14), ry - 115]], 4), { col: C.green, w: 6, p: 0.88, seed: 62 + i, boil: 0.35 });
      bgDab(rx + (i % 2 ? 15 : -13), ry - 98, 11, { col: C.ochre, p: 0.92, sq: 1.8, seed: 68 + i, boil: 0 });
    });
    [[420, hy + 120, C.yellow], [860, hy + 260, C.pink], [1240, hy + 135, C.yellow], [1560, hy + 295, C.pink], [1820, hy + 165, C.yellow]].forEach(([fx, fy, fc], i) => {
      bgDab(fx, fy, 11, { col: fc, p: 0.9, seed: 74 + i, boil: 0 });
      bgDab(fx, fy, 4.5, { col: C.white, p: 0.9, seed: 80 + i, boil: 0 });
    });
  } else if (preset === 'starry-hill') {
    const farHills = smooth([
      [-460, hy + 30], [180, hy - 160], [920, hy - 110], [1600, hy - 195], [2340, hy - 125], [3080, hy - 165], [PW + 580, hy + 30]
    ], 5, true);
    bgFill(farHills, { col: C.rain, p: 0.36, gap: 18, w: 15, over: 6, seed: 18, ang: 0.1, boil: 0 });
    const lawn = [...horizonPts, [xMax, 1940], [xMin, 1940]];
    bgFill(lawn, { col: C.green, p: 0.62, gap: 14, w: 14, over: 6, seed: 22, ang: -0.06, boil: 0 });
    // Glowing warm yellow firefly dots drawn on BG_L so BG_F stays 100% cacheable!
    [[540, hy - 70], [1020, hy - 115], [1480, hy - 140], [1920, hy - 120], [2380, hy - 95], [2720, hy - 80]].forEach(([fx, fy], i) => {
      const bob = Math.sin(t12 * 2.4 + i * 1.7) * 18;
      dab(BG_L, fx, fy + bob, 9, { col: C.yellow, p: 0.85, seed: 90 + i, boil: 0.3 });
      dab(BG_L, fx, fy + bob, 4, { col: C.white, p: 0.95, seed: 96 + i, boil: 0.3 });
    });
  } else {
    const hills = smooth([
      [-460, hy + 10], [120, hy - 115], [760, hy - 155], [1480, hy - 95], [2180, hy - 165], [2860, hy - 120], [PW + 580, hy + 10]
    ], 5, true);
    bgFill(hills, { col: C.green, p: 0.24, gap: 18, w: 15, over: 6, seed: 10, ang: 0.12, boil: 0 });
    const lawn = [...horizonPts, [xMax, 1940], [xMin, 1940]];
    bgFill(lawn, { col: C.green, p: 0.50, gap: 16, w: 15, over: 6, seed: 12, ang: -0.09, boil: 0 });
    const parkPath = smooth([
      [480, hy + 165], [1120, hy + 125], [1760, hy + 150], [2540, hy + 135],
      [2520, hy + 245], [1780, hy + 260], [1120, hy + 235], [460, hy + 265]
    ], 5, true);
    bgFill(parkPath, { col: C.peach, p: 0.56, gap: 13, w: 12, over: 4, seed: 31, ang: 0.03, boil: 0 });
    [[340, hy + 95, C.yellow], [680, hy + 305, C.pink], [1180, hy + 95, C.yellow], [1580, hy + 315, C.pink],
     [2060, hy + 100, C.yellow], [2440, hy + 300, C.pink], [2820, hy + 140, C.yellow]].forEach(([fx, fy, fc], i) => {
      bgDab(fx, fy, 11, { col: fc, p: 0.9, seed: 50 + i, boil: 0 });
      bgDab(fx, fy, 4.5, { col: C.white, p: 0.9, seed: 60 + i, boil: 0 });
    });
  }

  const grass = [...horizonPts.map(([x, y]) => [x, y - 22]), ...horizonPts.slice().reverse().map(([x, y]) => [x, y + 18])];
  bgFill(grass, { col: C.green, p: 0.85, gap: 9, w: 12, over: 6, seed: 14, ang: -0.22, boil: 0 });
  line(BG_L, horizonPts, { col: C.ink, w: 7, p: 0.88, seed: 15, boil: 0.55 });

  for (let i = 0; i < 24; i++) {
    const gx = 160 + i * 124 + (hash(i * 9.1) - 0.5) * 40;
    if (preset === 'garden-cross-section' && Math.abs(gx - seedX) < 95) continue;
    const gy = gY(gx), h = 22 + hash(i * 4.7) * 20;
    line(BG_L, [[gx - 10, gy], [gx - 18, gy - h]], { col: C.green, w: 5.5, p: 0.86, seed: 20 + i * 3, boil: 0.4 });
    line(BG_L, [[gx, gy], [gx + 2, gy - h * 1.15]], { col: C.green, w: 5.5, p: 0.86, seed: 21 + i * 3, boil: 0.4 });
    line(BG_L, [[gx + 10, gy], [gx + 18, gy - h * 0.9]], { col: C.green, w: 5.5, p: 0.86, seed: 22 + i * 3, boil: 0.4 });
  }

  if (preset === 'garden-cross-section') {
    const burrowP = eo(seg(t, 0.0, 1.15));
    if (burrowP > 0) {
      line(BG_L, ellipse(seedX, seedY + 4, 92, 74, 34), { col: C.ink, w: 6, p: 0.82, seed: 44, draw: burrowP, boil: 0.65, closed: true });
      [[1470, 1310, 16], [1890, 1295, 14], [1540, 1465, 12], [1855, 1460, 15], [1320, 1345, 13], [2140, 1360, 16], [980, 1330, 15], [2440, 1390, 14]].forEach(([px, py, pr], i) => {
        const pp = clamp((burrowP - 0.2 - i * 0.05) / 0.35);
        if (pp <= 0) return;
        const pb = ellipse(px, py, pr, pr * 0.72, 14, 0, Math.PI * 2, hash(i) * 2);
        bgFill(pb, { col: C.ochre, p: 0.55, gap: 6, w: 7, over: 2, seed: 60 + i, boil: 0 });
        line(BG_L, pb, { col: C.ink, w: 4.5, p: 0.72, seed: 70 + i, draw: pp, boil: 0.5, closed: true });
      });
    }
    for (let i = 0; i < 5; i++) {
      const fx = 280 + i * 112, fy = gY(fx) + 6, lean = (hash(i * 3.7) - 0.5) * 12;
      const post = [[fx - 16, fy], [fx - 18 + lean, fy - 132], [fx + lean, fy - 156], [fx + 18 + lean, fy - 132], [fx + 16, fy]];
      bgFill(post, { col: C.ochre, p: 0.72, gap: 9, w: 10, over: 4, seed: 80 + i, ang: 0.9, boil: 0 });
      line(BG_L, post, { col: C.ink, w: 6, p: 0.82, seed: 90 + i, boil: 0.55, closed: true });
    }
    line(BG_L, [[250, hy - 95], [760, hy - 100]], { col: C.ink, w: 7, p: 0.8, seed: 98, boil: 0.5 });
    line(BG_L, [[252, hy - 38], [758, hy - 42]], { col: C.ink, w: 7, p: 0.8, seed: 99, boil: 0.5 });

    const wx = 820, wy = gY(wx) + 2;
    const canBody = [[wx - 44, wy - 76], [wx + 42, wy - 76], [wx + 48, wy], [wx - 48, wy]];
    bgFill(canBody, { col: C.sky, p: 0.84, gap: 8, w: 10, over: 4, seed: 105, ang: 0.4, boil: 0 });
    line(BG_L, canBody, { col: C.ink, w: 6, p: 0.88, seed: 106, boil: 0.55, closed: true });
    line(BG_L, [[wx + 44, wy - 24], [wx + 98, wy - 68]], { col: C.sky, w: 12, p: 0.85, seed: 107, boil: 0.5 });
    line(BG_L, [[wx + 44, wy - 24], [wx + 98, wy - 68]], { col: C.ink, w: 5.5, p: 0.88, seed: 108, boil: 0.55 });
    const rose = ellipse(wx + 104, wy - 72, 12, 18, 14, 0, Math.PI * 2, 0.7);
    bgFill(rose, { col: C.yellow, p: 0.88, gap: 5, w: 6, over: 1, seed: 109, boil: 0 });
    line(BG_L, rose, { col: C.ink, w: 4.5, p: 0.88, seed: 110, boil: 0.55, closed: true });
    line(BG_L, curve([[wx - 42, wy - 64], [wx - 84, wy - 64], [wx - 80, wy - 16], [wx - 44, wy - 16]], 5), { col: C.ink, w: 6, p: 0.86, seed: 111, boil: 0.55 });

    const bush = smooth([[2660, hy - 2], [2675, hy - 85], [2745, hy - 108], [2810, hy - 92], [2865, hy - 112], [2940, hy - 80], [2960, hy - 2]], 5, true);
    bgFill(bush, { col: C.green, p: 0.82, gap: 10, w: 12, over: 6, seed: 115, ang: 0.5, boil: 0 });
    line(BG_L, bush, { col: C.ink, w: 6.5, p: 0.84, seed: 116, boil: 0.55, closed: true });
    [[2725, hy - 60, C.yellow], [2820, hy - 70, C.pink], [2895, hy - 50, C.yellow]].forEach(([bx, by, bc], i) => {
      bgDab(bx, by, 14, { col: bc, p: 0.9, seed: 120 + i, boil: 0 });
    });
  }
}

function drawWhiteWaxLayer(WL, project, t) {
  const preset = project.palette?.waxPreset || 'rain-and-roots';
  if (preset === 'none') return;
  const waxCol = project.palette?.paper || '#f4efe3';
  const washStart = project.palette?.washStart ?? 30.0;
  const rainMotion = Math.floor(t * 12);

  if (preset === 'rain-and-roots' || preset === 'rain-and-stars') {
    for (const d of DROPS) {
      const fallOff = t > washStart ? ((rainMotion * 6 + d.seed * 13) % 32) - 16 : 0;
      const x0 = d.x + fallOff * d.tilt, y0 = d.y + fallOff;
      const x1 = x0 + Math.sin(d.tilt) * d.len, y1 = y0 + Math.cos(d.tilt) * d.len;
      line(WL, [[x0, y0], [x1, y1]], { col: waxCol, w: 9.5, p: 0.99, seed: d.seed, boil: 0.45, streak: 1, taper: 0.42 });
      dab(WL, x1, y1 + 1.5, 6.5, { col: waxCol, p: 0.99, gap: 3, w: 5, over: 0, seed: d.seed + 1, boil: 0.35 });
    }
  }
  if (preset === 'rain-and-roots' || preset === 'rain-and-stars' || preset === 'starry-night') {
    const count = preset === 'starry-night' ? SKY_TWINKLES.length : 24;
    for (let i = 0; i < count; i++) {
      const s = SKY_TWINKLES[i];
      const sp = (preset === 'starry-night' ? 16 : 11) + Math.sin(t * 4.2 + s.seed) * 3.5;
      line(WL, [[s.x - sp, s.y], [s.x + sp, s.y]], { col: waxCol, w: 4.5, p: 0.98, seed: s.seed, boil: 0.35 });
      line(WL, [[s.x, s.y - sp], [s.x, s.y + sp]], { col: waxCol, w: 4.5, p: 0.98, seed: s.seed + 1, boil: 0.35 });
    }
  }
  if (preset === 'friendship-hearts' || preset === 'birthday-confetti') {
    // Invisible white-wax hearts & celebration sparkles revealed when the wash sweeps across!
    const hearts = [
      [340, 420, 34], [580, 290, 28], [860, 460, 38], [1140, 310, 30], [1420, 430, 36],
      [1690, 280, 42], [1940, 440, 34], [2140, 310, 44], [2380, 260, 48], [2620, 350, 40],
      [2860, 470, 34], [2980, 290, 30], [1820, 620, 30], [2080, 600, 36], [2540, 620, 38],
      [1310, 640, 28], [670, 610, 30], [2260, 490, 34]
    ];
    hearts.forEach(([hx, hy, hr], i) => {
      const bob = Math.sin(t * 2.2 + i * 1.1) * 8;
      const y0 = hy + bob;
      const pts = [];
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const px = 16 * (Math.sin(a) ** 3);
        const py = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        pts.push([hx + (px / 16) * hr, y0 + (py / 16) * hr]);
      }
      fill(WL, pts, { col: waxCol, p: 0.99, gap: 6, w: 9, over: 2, seed: 740 + i * 3, boil: 0.35 });
      line(WL, pts, { col: waxCol, w: 7, p: 0.99, seed: 741 + i * 3, boil: 0.35, closed: true });
    });
    for (let i = 0; i < 30; i++) {
      const s = SKY_TWINKLES[i];
      const sp = 14 + Math.sin(t * 4.0 + s.seed) * 4;
      line(WL, [[s.x - sp, s.y], [s.x + sp, s.y]], { col: waxCol, w: 5.5, p: 0.99, seed: s.seed, boil: 0.35 });
      line(WL, [[s.x, s.y - sp], [s.x, s.y + sp]], { col: waxCol, w: 5.5, p: 0.99, seed: s.seed + 1, boil: 0.35 });
    }
  }
  if (preset === 'rain-and-roots') {
    const seedEnt = (project.entities || []).find(e => e.type === 'seed');
    const sx0 = seedEnt ? seedEnt.x : (project.world?.seedX ?? 1680);
    const sy0 = seedEnt ? seedEnt.y : (project.world?.seedY ?? 1365);
    for (const r of makeRoots(sx0, sy0)) {
      line(WL, r.pts, { col: waxCol, w: r.w + 4, p: 0.99, seed: r.seed, boil: 0.4, streak: 1 });
    }
    [[-260, 133], [-170, 103], [-95, 157], [-4, 167], [105, 153], [205, 107], [290, 150]].forEach(([dx, dy], i) => {
      dab(WL, sx0 + dx, sy0 + dy, 8 + Math.sin(t * 3.8 + i * 1.4) * 2.5, { col: waxCol, p: 0.99, gap: 3, w: 5, over: 0, seed: 850 + i, boil: 0.3 });
    });
  }
}

function drawWashBands(W_L, project, t) {
  if (!project.palette?.washEnabled) return;
  const ws0 = project.palette.washStart ?? 30.0;
  if (t < ws0) return;
  const g = W_L.g;
  g.save();
  const vertical = VIEW.h > VIEW.w;
  const bands = vertical ? [
    { y0: -520, y1:  680, t0: ws0,        t1: ws0 + 2.30, dir:  1, xL: -480, xR: 3720, seed: 11, alpha: 0.64 },
    { y0:  560, y1: 1240, t0: ws0 + 1.85, t1: ws0 + 4.15, dir: -1, xL: -480, xR: 3720, seed: 23, alpha: 0.68 },
    { y0: 1120, y1: 2450, t0: ws0 + 3.75, t1: ws0 + 6.25, dir:  1, xL: -480, xR: 3720, seed: 37, alpha: 0.84 },
  ] : [
    { y0:  105, y1:  750, t0: ws0,        t1: ws0 + 2.30, dir:  1, xL: -480, xR: 3720, seed: 11, alpha: 0.64 },
    { y0:  660, y1: 1170, t0: ws0 + 1.85, t1: ws0 + 4.15, dir: -1, xL: -480, xR: 3720, seed: 23, alpha: 0.68 },
    { y0: 1080, y1: 1730, t0: ws0 + 3.75, t1: ws0 + 6.25, dir:  1, xL: -480, xR: 3720, seed: 37, alpha: 0.84 },
  ];
  for (const b of bands) {
    const p = eio(seg(t, b.t0, b.t1));
    if (p <= 0) continue;
    const xa = b.dir > 0 ? b.xL : lerp(b.xR, b.xL, p);
    const xb = b.dir > 0 ? lerp(b.xL, b.xR, p) : b.xR;
    const x0 = sx(xa), x1 = sx(xb), y0 = sy(b.y0), y1 = sy(b.y1);
    const h = y1 - y0, w = x1 - x0;
    if (w < 2) continue;

    g.beginPath();
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps, px = lerp(x0, x1, f);
      const wob = (Math.sin(f * 41 + b.seed) * 0.5 + Math.sin(f * 89 + b.seed * 2) * 0.5) * 6 * CAM.s;
      i ? g.lineTo(px, y0 + wob) : g.moveTo(px, y0 + wob);
    }
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      g.lineTo(x1 + (b.dir > 0 ? Math.sin(f * Math.PI) * 30 * CAM.s : 0), lerp(y0, y1, f));
    }
    for (let i = steps; i >= 0; i--) {
      const f = i / steps, px = lerp(x0, x1, f);
      const wob = (Math.sin(f * 37 + b.seed * 3) * 0.5 + Math.sin(f * 83 + b.seed) * 0.5) * 6 * CAM.s;
      g.lineTo(px, y1 + wob);
    }
    for (let i = 12; i >= 0; i--) {
      const f = i / 12;
      g.lineTo(x0 - (b.dir < 0 ? Math.sin(f * Math.PI) * 30 * CAM.s : 0), lerp(y0, y1, f));
    }
    g.closePath();

    const vg = g.createLinearGradient(0, y0, 0, y1);
    vg.addColorStop(0.00, `rgba(255,255,255,${b.alpha * 0.12})`);
    vg.addColorStop(0.14, `rgba(255,255,255,${b.alpha})`);
    vg.addColorStop(0.86, `rgba(255,255,255,${b.alpha})`);
    vg.addColorStop(1.00, `rgba(255,255,255,${b.alpha * 0.12})`);
    g.fillStyle = vg;
    g.fill();

    if (p < 0.995) {
      const leadX = b.dir > 0 ? x1 : x0;
      const gr = g.createRadialGradient(leadX, (y0 + y1) * 0.5, 4, leadX, (y0 + y1) * 0.5, h * 0.48);
      gr.addColorStop(0, 'rgba(255,255,255,0.34)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,0.075)';
    g.lineWidth = Math.max(1.2, 2.2 * CAM.s);
    for (let k = 0; k < 14; k++) {
      const syk = lerp(y0 + 18 * CAM.s, y1 - 18 * CAM.s, (k + 0.5) / 14);
      g.beginPath(); g.moveTo(x0, syk); g.lineTo(x1, syk + (hash(b.seed + k * 4.3) - 0.5) * 7 * CAM.s); g.stroke();
    }
  }
  g.restore();
}

function drawSubtitlesBar(K_L, T_L, C, project, t, onFridge = false) {
  const active = (project.subtitles || []).find(s => t >= s.t0 && t <= s.t1);
  if (!active) return;
  const W = VIEW.w, H = VIEW.h, vertical = H > W;
  const rev = clamp((t - active.t0) / 0.36);

  let szEn = vertical ? 44 : 50;
  let szVi = project.meta?.subViSize ?? (vertical ? 35 : 38);
  const cyEn = active.vi ? (vertical ? H - 222 : H - 104) : (vertical ? H - 190 : H - 72);
  const cyVi = vertical ? H - 164 : H - 50;

  const g = T_L.g;
  const maxW = W * 0.88;
  g.save();
  g.font = `400 ${szEn}px "Patrick Hand"`;
  let wEn = g.measureText((active.en || '').normalize('NFC')).width;
  if (wEn > maxW) { szEn = Math.max(30, Math.floor(szEn * (maxW / wEn))); g.font = `400 ${szEn}px "Patrick Hand"`; wEn = g.measureText((active.en || '').normalize('NFC')).width; }
  g.font = `400 ${szVi}px "Patrick Hand"`;
  let wVi = g.measureText((active.vi || '').normalize('NFC')).width;
  if (wVi > maxW) { szVi = Math.max(26, Math.floor(szVi * (maxW / wVi))); g.font = `400 ${szVi}px "Patrick Hand"`; wVi = g.measureText((active.vi || '').normalize('NFC')).width; }
  g.restore();
  const hw = Math.min(W * 0.48, Math.max(wEn, wVi) * 0.5 + 48);

  const kg = K_L.g;
  kg.save();
  kg.fillStyle = onFridge ? (project.palette?.paper || '#f4efe3') : '#000';
  const x0 = W / 2 - hw, x1 = W / 2 + hw, y0 = cyEn - szEn * 1.05, y1 = (active.vi ? cyVi + 26 : cyEn + 22);
  const st = BOIL.step;
  kg.beginPath(); kg.moveTo(x0, y0);
  for (let i = 1; i <= 18; i++) kg.lineTo(lerp(x0, x1, i / 18), y0 + (hash(i * 4.1 + st * 0.2) - 0.5) * 9);
  for (let i = 1; i <= 6; i++)  kg.lineTo(x1 + (hash(i * 7.3 + 20) - 0.5) * 10, lerp(y0, y1, i / 6));
  for (let i = 17; i >= 0; i--) kg.lineTo(lerp(x0, x1, i / 18), y1 + (hash(i * 5.9 + 40) - 0.5) * 9);
  for (let i = 5; i >= 0; i--)  kg.lineTo(x0 + (hash(i * 3.7 + 60) - 0.5) * 10, lerp(y0, y1, i / 6));
  kg.closePath(); kg.fill(); kg.restore();

  text(T_L, active.en || '', W / 2, cyEn, {
    font: 'Patrick Hand', size: szEn, col: C.ink,
    highlight: active.key || null, hiCol: active.hiCol || C.red, underline: Boolean(active.key),
    reveal: rev, seed: 970
  });
  if (active.vi) {
    const revVi = active.enDur > 0
      ? (t < active.t0 + active.enDur + 0.12 ? 0 : clamp((t - (active.t0 + active.enDur + 0.12)) / 0.36))
      : clamp((rev - 0.12) / 0.88);
    if (revVi > 0) {
      text(T_L, active.vi, W / 2, cyVi, {
        font: 'Patrick Hand', size: szVi, col: '#5a3d29',
        reveal: revVi, seed: 975
      });
    }
  }
}

export function renderProject(comp, glCanvas, project, t, opts = {}) {
  const C = { ...DEFAULT_CRAYONS, ...(project.palette?.crayons || {}) };
  const paperRgb = hexToRgb01(project.palette?.paper || '#f4efe3');
  const washRgb  = hexToRgb01(project.palette?.washColor || '#70b58f');

  const cam = opts.camOverride || evalCamera(project, t);
  CAM.x = cam.x; CAM.y = cam.y; CAM.s = cam.s;
  WMUL.k = 1;

  BOIL.step = Math.floor(t * 12);
  const t12 = BOIL.step / 12;
  const inSilence = (project.silences || []).some(s => t >= s.t0 && t <= s.t1);
  const endCfg = project.ending || { type: 'none' };
  const fridgeP = endCfg.type === 'fridge' ? eio(seg(t, endCfg.tStart ?? 50.8, endCfg.tEnd ?? 54.4)) : 0;
  BOIL.amp = inSilence ? 0.45 : (fridgeP > 0 ? 0.55 : 1.0);

  const ents = project.entities || [];
  const entStates = ents.map(ent => resolveEntityState(ent, t));

  // Exact duplicate-frame skip when allowSkip=true (headless video.mjs render):
  // Any 24fps change (camera, wash sweep, fridge, walk moveDur, stroke draw/fill, title/tag/subtitle reveal) changes frameKey!
  // On held dialogue beats where only 12fps boil/acting occurs, odd frames match even frames bit-for-bit -> skip redraw & screenshot!
  if (opts.allowSkip) {
    const washEn = Boolean(project.palette?.washEnabled);
    const ws = project.palette?.washStart ?? 30.0;
    const washKey = !washEn ? 'W0' : (t < ws ? 'W0' : (t <= ws + 6.9 ? `WS:${t.toFixed(4)}` : 'W1'));
    const gardenBurrow = (project.world?.preset === 'garden-cross-section' && t < 1.25) ? `GB:${t.toFixed(4)}` : '';
    const tp = project.meta?.titlePos || { x: 2715, y: 825, t: 1.8 };
    const pT = clamp(seg(t, tp.t ?? 1.8, (tp.t ?? 1.8) + 0.75));
    const pTVi = clamp(seg(t, (tp.t ?? 1.8) + 0.45, (tp.t ?? 1.8) + 1.15));
    const tagK = (project.tags || []).map(tg => clamp(seg(t, tg.t, tg.t + 0.45)).toFixed(3)).join(',');
    const subA = (project.subtitles || []).find(s => t >= s.t0 && t <= s.t1);
    let subK = '';
    if (subA) {
      const rE = clamp((t - subA.t0) / 0.36);
      const rV = subA.vi ? (subA.enDur > 0 ? (t < subA.t0 + subA.enDur + 0.12 ? 0 : clamp((t - (subA.t0 + subA.enDur + 0.12)) / 0.36)) : clamp((rE - 0.12) / 0.88)) : 0;
      subK = `${subA.id}:${rE.toFixed(3)}:${rV.toFixed(3)}`;
    }
    const entK = ents.map((ent, i) => {
      const st = entStates[i];
      if (st.draw <= 0) return '0';
      return `${(st.x ?? ent.x).toFixed(2)},${(st.y ?? ent.y).toFixed(2)},${st.draw.toFixed(3)},${st.fillP.toFixed(3)},${st.mood || ''},${st.pose || ''},${st.expr || ''},${st.view || ''},${st.layer || ''},${st.hat ? 1 : 0}`;
    }).join(';');
    const fKey = `${VIEW.w}x${VIEW.h}|${CAM.x.toFixed(3)},${CAM.y.toFixed(3)},${CAM.s.toFixed(5)}|${BOIL.step}|${BOIL.amp.toFixed(2)}|${fridgeP.toFixed(4)}|${washKey}|${gardenBurrow}|${pT.toFixed(3)},${pTVi.toFixed(3)}|${tagK}|${subK}|${entK}`;
    if (fKey === lastFrameKey) {
      return { ...lastFrameResult, skipped: true };
    }
    lastFrameKey = fKey;
  }

  comp.paperCam(CAM.x, CAM.y, CAM.s);

  // Static BG_F cache: skip expensive background crayon fills when camera & world palette haven't moved!
  const preset = project.world?.preset || 'garden-cross-section';
  const cw = project.customWorld;
  const bgDynamicFill = (preset === 'garden-cross-section' && t < 1.25)
    || Boolean(cw && Array.isArray(cw.shapes) && cw.shapes.some(s => s.wave && s.fill));
  const bgFillKey = bgDynamicFill ? '' : [
    preset, cw?.preset || '', cw?.shapes?.length || 0, project.world?.horizonY ?? 1090,
    CAM.x.toFixed(2), CAM.y.toFixed(2), CAM.s.toFixed(4), VIEW.w, VIEW.h,
    C.green, C.ochre, C.sky, C.yellow, C.peach, C.rain
  ].join('|');
  const skipBgFill = !bgDynamicFill && bgFillKey === lastBgFillKey && BG_F.c.width === VIEW.w && BG_F.c.height === VIEW.h;
  if (!skipBgFill) {
    clear(BG_F);
    lastBgFillKey = bgFillKey;
  }

  clear(BG_L); clear(WAX_L); clear(WASH_L);
  clearGroup(SKY_G); clearGroup(BACK_G); clearGroup(FRONT_G);
  clear(FX_L); clear(TAG_K); clear(TAG_L); clear(SUB_K); clear(SUB_L);

  // 1. Background world + white-wax resist layer + watercolour wash
  drawWorldPreset(BG_F, BG_L, C, project, t, skipBgFill);
  drawWhiteWaxLayer(WAX_L, project, t);
  drawWashBands(WASH_L, project, t);

  const hitTargets = [];
  const visibleTexts = [];

  // 2. Render all placed entities in clean depth order (sky/back props → hero characters in front!)
  let hasBlazingSun = false;
  for (let i = 0; i < ents.length; i++) {
    const ent = ents[i];
    const st = entStates[i];
    if (st.draw <= 0) continue;
    const isSky = ent.type === 'sun' || ent.type === 'cloud' || ent.type === 'rainbow' || ent.type === 'star';
    const isHero = ent.type === 'boy_leo' || ent.type === 'girl_maya' || ent.type === 'little_dog' || ent.type === 'tabby_cat' || ent.type === 'gray_wolf' || ent.type === 'apple_basket' || ent.type === 'birthday_cake' || ent.type === 'gift_box' || ent.type === 'toy_car' || String(ent.type || '').startsWith('custom_');
    const targetG = isSky ? SKY_G : (st.layer === 'back' ? BACK_G : (isHero || st.layer === 'front' ? FRONT_G : BACK_G));

    // Subtle 12fps cloud drift + interpolated (st.x, st.y) position for walking/peeking characters!
    let ex = st.x ?? ent.x, ey = st.y ?? ent.y;
    if (ent.type === 'cloud') ex += Math.sin(t12 * 1.1 + i) * 10;
    const drawEnt = { ...ent, x: ex, y: ey, seed: 20 + i * 47 };
    if (ent.type === 'sun' && st.mood === 'blaze') hasBlazingSun = true;
    drawEntity(targetG, C, drawEnt, st, t12, project.customProps);

    // Compute screen hit-box for direct canvas drag-and-drop in Studio GUI
    const cSpec = ent.customSpec || (Array.isArray(project.customProps) ? project.customProps.find(p => p.type === ent.type) : project.customProps?.[ent.type]);
    const cat = ENTITY_CATALOG.find(c => c.type === ent.type) || (cSpec ? { label: cSpec.label || ent.type, hit: cSpec.hit || { rx: 100, ry: 100, oy: -90 } } : null);
    if (cat) {
      const sc = ent.scale ?? 1;
      const cx = sx(ex), cy = sy(ey + cat.hit.oy * sc);
      hitTargets.push({
        kind: 'entity', id: ent.id, label: cat.label,
        x0: cx - cat.hit.rx * sc * CAM.s, y0: cy - cat.hit.ry * sc * CAM.s,
        x1: cx + cat.hit.rx * sc * CAM.s, y1: cy + cat.hit.ry * sc * CAM.s,
        wx: ex, wy: ey
      });
    }
  }

  // 3. Automatic playful expressive FX (12fps hand-drawn on twos: heat waves, zzz, rustle puffs, scared shock, tummy rumble, sparkles!)
  for (let i = 0; i < ents.length; i++) {
    const ent = ents[i];
    const st = entStates[i];
    if (st.draw <= 0) continue;
    const ex = st.x ?? ent.x, ey = st.y ?? ent.y, sc = ent.scale ?? 1;
    if (ent.type === 'seed' && st.mood === 'sleep' && t >= (ent.tStart ?? 0) + 1.0) {
      const cyc = (t12 * 0.55) % 1;
      for (let k = 0; k < 2; k++) {
        const f = (cyc + k * 0.5) % 1;
        text(FX_L, 'z', sx(ex + 46 + f * 34 + k * 14), sy(ey - 54 - f * 62), {
          font: 'Mali', weight: 700, size: (24 + k * 8) * CAM.s, col: C.ink, p: 0.72 * Math.sin(f * Math.PI), seed: 801 + k
        });
      }
    }
    if ((ent.type === 'boy_leo' || ent.type === 'girl_maya') && (st.pose === 'idea' || st.pose === 'ideaBlue')) {
      const ix = ex + 14, iy = ey - 392 * sc;
      const col = st.pose === 'ideaBlue' ? C.sky : C.yellow;
      text(FX_L, '!', sx(ix), sy(iy), { font: 'Mali', weight: 700, size: 68 * CAM.s, col, p: 0.95, seed: 810, stroke: 3 });
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI * 0.85 + (k / 4) * Math.PI * 0.7;
        line(FX_L, [[ix + Math.cos(a) * 34, iy - 22 + Math.sin(a) * 34], [ix + Math.cos(a) * 64, iy - 22 + Math.sin(a) * 64]], { col, w: 5.5, p: 0.88, seed: 812 + k });
      }
    }
    if ((ent.type === 'big_tree' || ent.type === 'bush') && st.mood === 'rustle') {
      const ph = BOIL.step;
      const cyR = ent.type === 'big_tree' ? ey - 440 * sc : ey - 85 * sc;
      const rxR = ent.type === 'big_tree' ? 265 * sc : 170 * sc;
      [-1, 1].forEach((dir, di) => {
        const ax = ex + dir * (rxR + (ph % 2) * 14 * sc);
        line(FX_L, curve([[ax, cyR - 55 * sc], [ax + dir * 24 * sc, cyR], [ax, cyR + 55 * sc]], 5), { col: C.ink, w: 5.5, p: 0.85, seed: 860 + di });
        line(FX_L, curve([[ax + dir * 28 * sc, cyR - 36 * sc], [ax + dir * 48 * sc, cyR], [ax + dir * 28 * sc, cyR + 36 * sc]], 5), { col: C.ochre, w: 4.5, p: 0.78, seed: 862 + di });
      });
      for (let k = 0; k < 4; k++) {
        const f = ((t12 * 0.9 + k * 0.27) % 1);
        const lx = ex + (k % 2 ? 1 : -1) * (120 + f * 150) * sc;
        const ly = cyR - 40 * sc + Math.sin(f * Math.PI * 2 + k) * 45 * sc + f * 120 * sc;
        dab(FX_L, lx, ly, 12 * sc, { col: C.green, p: 0.88 * Math.sin(f * Math.PI), sq: 0.6, seed: 866 + k });
      }
    }
    if ((ent.type === 'little_dog' || ent.type === 'tabby_cat') && st.expr === 'scared') {
      const sx0 = ex - 68 * sc, sy0 = ey - 240 * sc;
      line(FX_L, [[sx0, sy0], [sx0 - 24 * sc, sy0 - 22 * sc]], { col: C.ink, w: 4.5, p: 0.85, seed: 870 });
      line(FX_L, [[sx0 - 6 * sc, sy0 + 18 * sc], [sx0 - 30 * sc, sy0 + 12 * sc]], { col: C.ink, w: 4.5, p: 0.85, seed: 871 });
      dab(FX_L, ex + 64 * sc, ey - 235 * sc, 9 * sc, { col: C.sky, p: 0.88, sq: 1.4, seed: 872 });
    }
    if (ent.type === 'gray_wolf' && st.pose === 'sad_hungry') {
      const ph = BOIL.step;
      const bx = ex - 88 * sc, by = ey - 118 * sc + (ph % 2) * 4 * sc;
      line(FX_L, curve([[bx, by - 22 * sc], [bx - 22 * sc, by - 8 * sc], [bx - 6 * sc, by + 6 * sc], [bx - 24 * sc, by + 22 * sc]], 6), { col: C.ochre, w: 5, p: 0.85, seed: 876 });
      line(FX_L, curve([[bx - 24 * sc, by - 14 * sc], [bx - 42 * sc, by], [bx - 26 * sc, by + 14 * sc]], 5), { col: C.ink, w: 4, p: 0.72, seed: 877 });
    }
    if (ent.type === 'door' && st.mood === 'knock') {
      const ph = BOIL.step;
      const kx = ex + 125 * sc, ky = ey - 220 * sc;
      line(FX_L, curve([[kx, ky - 40 * sc], [kx + 24 * sc + (ph % 2) * 8 * sc, ky], [kx, ky + 40 * sc]], 4), { col: C.red, w: 6, p: 0.9, seed: 890 });
      line(FX_L, curve([[kx + 26 * sc, ky - 26 * sc], [kx + 46 * sc + (ph % 2) * 8 * sc, ky], [kx + 26 * sc, ky + 26 * sc]], 4), { col: C.ochre, w: 5, p: 0.82, seed: 891 });
    }
    if ((ent.type === 'little_dog' || ent.type === 'tabby_cat') && st.pose === 'blow') {
      const dir = st.view === 'l34' ? -1 : 1;
      const bx = ex + dir * 56 * sc, by = ey - 184 * sc;
      line(FX_L, curve([[bx, by], [bx + dir * 48 * sc, by - 14 * sc], [bx + dir * 92 * sc, by - 4 * sc]], 5), { col: C.sky, w: 5.5, p: 0.85, seed: 892 });
      line(FX_L, curve([[bx, by + 12 * sc], [bx + dir * 52 * sc, by + 18 * sc], [bx + dir * 96 * sc, by + 8 * sc]], 5), { col: C.sky, w: 4.5, p: 0.78, seed: 893 });
    }
    if ((ent.type === 'little_dog' || ent.type === 'tabby_cat' || ent.type === 'gray_wolf') && st.pose === 'sing') {
      const topY = ey - (ent.type === 'gray_wolf' ? 375 : 275) * sc;
      const bob = Math.sin(t12 * 4.5) * 14 * sc;
      text(FX_L, '♪', sx(ex - 58 * sc), sy(topY - 12 * sc + bob), { font: 'Mali', weight: 700, size: 48 * CAM.s, col: C.red, p: 0.92, seed: 894 });
      text(FX_L, '♫', sx(ex + 66 * sc), sy(topY - 32 * sc - bob), { font: 'Mali', weight: 700, size: 44 * CAM.s, col: C.sky, p: 0.92, seed: 895 });
    }
    if ((ent.type === 'little_dog' || ent.type === 'tabby_cat' || ent.type === 'gray_wolf' || String(ent.type || '').startsWith('custom_')) && (st.pose === 'cheer' || st.expr === 'yummy')) {
      const topY = ey - (ent.type === 'gray_wolf' ? 375 : (String(ent.type).startsWith('custom_') ? 185 : 275)) * sc;
      [[-78, -20, C.yellow], [84, -30, C.pink], [0, -68, C.red]].forEach(([dx, dy, col], k) => {
        const r = (11 + Math.sin(t12 * 5.2 + k * 2.1) * 3.5) * sc;
        const px = ex + dx * sc, py = topY + dy * sc;
        line(FX_L, [[px - r, py], [px + r, py]], { col, w: 4.8, p: 0.88, seed: 880 + k * 2 });
        line(FX_L, [[px, py - r], [px, py + r]], { col, w: 4.8, p: 0.88, seed: 881 + k * 2 });
      });
    }
    if (String(ent.type || '').startsWith('custom_') && (st.expr === 'sad' || st.expr === 'cry')) {
      const cyc = (t12 * 1.4) % 1;
      for (let k = 0; k < 2; k++) {
        const f = (cyc + k * 0.5) % 1;
        const tx = ex + (k ? 28 : -30) * sc + (k ? 1 : -1) * f * 18 * sc;
        const ty = ey - 102 * sc + f * 48 * sc;
        dab(FX_L, tx, ty, 7.5 * sc, { col: C.sky, p: 0.92 * Math.sin(f * Math.PI), sq: 1.4, seed: 896 + k });
      }
    }
    if (ent.type === 'flower' && st.petalP > 0.35) {
      const topY = ey - 435 * sc;
      [[-160, -70, C.yellow], [185, -95, C.yellow], [-115, 130, C.pink], [175, 115, C.yellow]].forEach(([dx, dy, col], k) => {
        const r = (15 + Math.sin(t12 * 5 + k * 1.9) * 4.5) * st.petalP;
        const px = ex + dx, py = topY + dy;
        line(FX_L, [[px - r, py], [px + r, py]], { col, w: 5, p: 0.85, seed: 840 + k * 2 });
        line(FX_L, [[px, py - r], [px, py + r]], { col, w: 5, p: 0.85, seed: 841 + k * 2 });
      });
    }
  }
  if (hasBlazingSun) {
    const phase = Math.floor(t * 12) * 0.6;
    for (let i = 0; i < 4; i++) {
      const bx = 1320 + i * 185, by = 685 + (i % 2) * 50;
      const pts = []; for (let k = 0; k <= 8; k++) pts.push([bx + Math.sin(k * 1.1 + phase + i) * 16, by + k * 28]);
      line(FX_L, pts, { col: i % 2 ? C.red : C.yellow, w: 5.5, p: 0.72, seed: 820 + i });
    }
  }

  // 4. Hand-lettered Title on page
  const tp = project.meta?.titlePos || { x: 2715, y: 825, t: 1.8 };
  const pTitle = clamp(seg(t, tp.t ?? 1.8, (tp.t ?? 1.8) + 0.75));
  const pTitleVi = clamp(seg(t, (tp.t ?? 1.8) + 0.45, (tp.t ?? 1.8) + 1.15));
  if (pTitle > 0 && project.meta?.title) {
    const tx = sx(tp.x), ty = sy(tp.y), s1 = 74 * CAM.s, s2 = 41 * CAM.s;
    if (project.palette?.washEnabled && t >= (project.palette.washStart ?? 30.0)) {
      const kg = TAG_K.g;
      kg.save(); kg.fillStyle = '#000'; kg.beginPath();
      const rx = 305 * CAM.s, ry = 102 * CAM.s;
      for (let k = 0; k < 26; k++) {
        const a = (k / 26) * Math.PI * 2;
        const px = tx + Math.cos(a) * rx * (0.94 + 0.11 * hash(k * 7.1 + 3));
        const py = ty + 8 * CAM.s + Math.sin(a) * ry * (0.92 + 0.12 * hash(k * 5.3 + 9));
        k ? kg.lineTo(px, py) : kg.moveTo(px, py);
      }
      kg.closePath(); kg.fill(); kg.restore();
    }
    const r1 = text(TAG_L, project.meta.title, tx, ty, { font: 'Mali', weight: 700, size: s1, col: C.ink, reveal: pTitle, seed: 910, stroke: s1 * 0.025 });
    if (pTitle > 0.7) {
      line(TAG_L, [[tp.x - 230, tp.y + 24], [tp.x, tp.y + 18], [tp.x + 230, tp.y + 26]], { col: C.red, w: 5.5, p: 0.85, seed: 911, draw: clamp((pTitle - 0.7) / 0.3) });
    }
    let r2 = null;
    if (pTitleVi > 0 && project.meta.titleVi) {
      r2 = text(TAG_L, project.meta.titleVi, tx, ty + 62 * CAM.s, { font: 'Mali', weight: 600, size: s2, col: '#6d4c35', reveal: pTitleVi, seed: 912 });
    }
    hitTargets.push({ kind: 'title', id: 'title', label: 'Tiêu đề', x0: r1.x0 - 20, y0: ty - s1, x1: r1.x1 + 20, y1: ty + 78 * CAM.s, wx: tp.x, wy: tp.y });

    const scF = lerp(1, VIEW.h > VIEW.w ? 0.76 : 0.715, fridgeP);
    const mapX = px => VIEW.w * lerp(0.5, 0.475, fridgeP) + (px - VIEW.w / 2) * scF;
    const mapY = py => VIEW.h * lerp(0.5, 0.465, fridgeP) + (py - VIEW.h / 2) * scF;
    visibleTexts.push({ id: 'title_en', text: project.meta.title, x0: mapX(r1.x0), y0: mapY(ty - s1 * 0.9), x1: mapX(r1.x1), y1: mapY(ty + s1 * 0.25) });
    if (r2) visibleTexts.push({ id: 'title_vi', text: project.meta.titleVi, x0: mapX(r2.x0), y0: mapY(ty + 62 * CAM.s - s2 * 0.9), x1: mapX(r2.x1), y1: mapY(ty + 62 * CAM.s + s2 * 0.25) });
  }

  // 5. On-page bilingual vocabulary tags
  const scF = lerp(1, VIEW.h > VIEW.w ? 0.76 : 0.715, fridgeP);
  const mapX = px => VIEW.w * lerp(0.5, 0.475, fridgeP) + (px - VIEW.w / 2) * scF;
  const mapY = py => VIEW.h * lerp(0.5, 0.465, fridgeP) + (py - VIEW.h / 2) * scF;
  (project.tags || []).forEach((tg, i) => {
    const p = clamp(seg(t, tg.t, tg.t + 0.45));
    if (p <= 0) return;
    const cx = sx(tg.x), cy = sy(tg.y), szEn = 46 * CAM.s, szVi = 28 * CAM.s;
    const bw = 112 * CAM.s, bh = 52 * CAM.s;
    const kg = TAG_K.g;
    kg.save(); kg.fillStyle = '#000'; kg.beginPath();
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      const px = cx + Math.cos(a) * bw * (0.94 + 0.12 * hash(i * 17 + k * 3.1));
      const py = cy + 6 * CAM.s + Math.sin(a) * bh * (0.92 + 0.14 * hash(i * 29 + k * 5.7));
      k ? kg.lineTo(px, py) : kg.moveTo(px, py);
    }
    kg.closePath(); kg.fill(); kg.restore();

    const rEn = text(TAG_L, tg.en || '', cx, cy, { font: 'Mali', weight: 700, size: szEn, col: tg.col || C.red, reveal: p, seed: 940 + i * 5, stroke: szEn * 0.03 });
    const pVi = clamp((p - 0.35) / 0.65);
    const rVi = (pVi > 0 && tg.vi) ? text(TAG_L, tg.vi, cx, cy + 34 * CAM.s, { font: 'Patrick Hand', size: szVi, col: C.ink, reveal: pVi, seed: 941 + i * 5 }) : null;

    hitTargets.push({ kind: 'tag', id: tg.id, label: `Tag: ${tg.en}`, x0: cx - bw, y0: cy - bh, x1: cx + bw, y1: cy + bh, wx: tg.x, wy: tg.y });
    if (cx > -200 && cx < VIEW.w + 200 && cy > -150 && cy < VIEW.h + 150) {
      visibleTexts.push({ id: tg.id + '_en', text: tg.en, x0: mapX(rEn.x0), y0: mapY(cy - szEn * 0.9), x1: mapX(rEn.x1), y1: mapY(cy + szEn * 0.2) });
      if (rVi) visibleTexts.push({ id: tg.id + '_vi', text: tg.vi, x0: mapX(rVi.x0), y0: mapY(cy + 34 * CAM.s - szVi * 0.9), x1: mapX(rVi.x1), y1: mapY(cy + 34 * CAM.s + szVi * 0.2) });
    }
  });

  // 6. WebGL2 Composite!
  comp.begin(paperRgb);
  comp.crayon(BG_F.c);
  comp.crayon(BG_L.c);
  comp.crayon(WAX_L.c, { gain: 1.15 });
  if (project.palette?.washEnabled && t >= (project.palette.washStart ?? 30.0)) {
    comp.wash(WASH_L.c, { color: washRgb, resist: 0.94, edge: 1.55, gran: 0.55 });
  }
  comp.group(SKY_G, { paper: paperRgb });
  comp.group(BACK_G, { paper: paperRgb });
  comp.group(FRONT_G, { paper: paperRgb });
  comp.crayon(FX_L.c);
  comp.knock(TAG_K.c, paperRgb);
  comp.crayon(TAG_L.c);

  if (fridgeP <= 0.001) {
    drawSubtitlesBar(SUB_K, SUB_L, C, project, t, false);
    comp.knock(SUB_K.c, paperRgb);
    comp.crayon(SUB_L.c);
    comp.finish({ vig: 0.22, emb: 0.54 });
  } else {
    comp.finish({ vig: 0.0, emb: 0.50 });
    capturePage(glCanvas);
    renderFridgeFrame(comp, fridgeP, C, endCfg.fridgeColor || '#cbe3d7');
    drawSubtitlesBar(SUB_K, SUB_L, C, project, t, true);
    comp.image(SUB_K.c);
    comp.crayon(SUB_L.c);
    comp.finish({ vig: 0.18 * fridgeP, emb: 0.08 * fridgeP, lamp: [0.22, 0.2, 0.95, 0.45 * fridgeP] });
  }

  lastFrameResult = { hitTargets, visibleTexts };
  return { hitTargets, visibleTexts, skipped: false };
}

// Pure layout inspection for automated QA (detects text/character head overlaps, text-on-text collisions & edge clipping!)
export function getFrameLayout(project, t) {
  const cam = evalCamera(project, t);
  CAM.x = cam.x; CAM.y = cam.y; CAM.s = cam.s;
  const endCfg = project.ending || { type: 'none' };
  const fridgeP = endCfg.type === 'fridge' ? eio(seg(t, endCfg.tStart ?? 50.8, endCfg.tEnd ?? 54.4)) : 0;
  const scF = lerp(1, VIEW.h > VIEW.w ? 0.76 : 0.715, fridgeP);
  const mapX = px => VIEW.w * lerp(0.5, 0.475, fridgeP) + (px - VIEW.w / 2) * scF;
  const mapY = py => VIEW.h * lerp(0.5, 0.465, fridgeP) + (py - VIEW.h / 2) * scF;

  const g = TAG_L.g;
  const measure = (str, font, weight, size) => {
    g.font = `${weight} ${size}px "${font}"`;
    return g.measureText(String(str || '').normalize('NFC')).width;
  };

  const texts = [];
  const tp = project.meta?.titlePos || { x: 2715, y: 825, t: 1.8 };
  const pTitle = clamp(seg(t, tp.t ?? 1.8, (tp.t ?? 1.8) + 0.75));
  if (pTitle > 0 && project.meta?.title) {
    const tx = sx(tp.x), ty = sy(tp.y), s1 = 74 * CAM.s, s2 = 41 * CAM.s;
    const w1 = measure(project.meta.title, 'Mali', 700, s1);
    const w2 = project.meta.titleVi ? measure(project.meta.titleVi, 'Mali', 600, s2) : 0;
    const hw = Math.max(w1, w2) * 0.5;
    texts.push({
      id: 'title', kind: 'title', text: project.meta.title,
      x0: mapX(tx - hw), y0: mapY(ty - s1 * 0.9),
      x1: mapX(tx + hw), y1: mapY(ty + (w2 ? 62 * CAM.s + s2 * 0.25 : s1 * 0.25)),
    });
  }
  (project.tags || []).forEach(tg => {
    const p = clamp(seg(t, tg.t, tg.t + 0.45));
    if (p <= 0) return;
    const cx = sx(tg.x), cy = sy(tg.y), szEn = 46 * CAM.s, szVi = 28 * CAM.s;
    const wEn = measure(tg.en, 'Mali', 700, szEn);
    const wVi = tg.vi ? measure(tg.vi, 'Patrick Hand', 400, szVi) : 0;
    const bw = Math.max(112 * CAM.s, Math.max(wEn, wVi) * 0.5 + 14 * CAM.s);
    const bh = 52 * CAM.s;
    texts.push({
      id: tg.id, kind: 'tag', text: tg.en,
      x0: mapX(cx - bw), y0: mapY(cy - bh),
      x1: mapX(cx + bw), y1: mapY(cy + bh + 6 * CAM.s),
    });
  });

  const CHAR_TYPES = new Set(['boy_leo', 'girl_maya', 'little_dog', 'tabby_cat', 'gray_wolf', 'bird']);
  const actors = [];
  for (const ent of project.entities || []) {
    const st = resolveEntityState(ent, t);
    if (st.draw <= 0) continue;
    const isChar = CHAR_TYPES.has(ent.type) || String(ent.type || '').startsWith('custom_');
    if (!isChar) continue;
    const cSpec = ent.customSpec || (Array.isArray(project.customProps) ? project.customProps.find(p => p.type === ent.type) : project.customProps?.[ent.type]);
    const cat = ENTITY_CATALOG.find(c => c.type === ent.type) || (cSpec ? { label: cSpec.label || ent.type, hit: cSpec.hit || { rx: 90, ry: 90, oy: -85 } } : null);
    if (!cat) continue;
    const sc = ent.scale ?? 1;
    const ex = st.x ?? ent.x, ey = st.y ?? ent.y;
    const cx = sx(ex), cy = sy(ey + cat.hit.oy * sc);
    // Include extra headroom for tall wolf/cat ears and party hats!
    const topBoost = (ent.type === 'gray_wolf' ? 56 : (st.hat ? 48 : 20)) * sc * CAM.s;
    actors.push({
      id: ent.id, type: ent.type, label: cat.label,
      x0: mapX(cx - cat.hit.rx * sc * CAM.s),
      y0: mapY(cy - cat.hit.ry * sc * CAM.s - topBoost),
      x1: mapX(cx + cat.hit.rx * sc * CAM.s),
      y1: mapY(cy + cat.hit.ry * sc * CAM.s),
    });
  }
  return { w: VIEW.w, h: VIEW.h, fridgeP, texts, actors };
}

// Fast pure bounding-box computation for readcheck.mjs (4000+ samples in <1s without running WebGL2 shaders!)
export function getVisibleTexts(project, t) {
  const cam = evalCamera(project, t);
  CAM.x = cam.x; CAM.y = cam.y; CAM.s = cam.s;
  const endCfg = project.ending || { type: 'none' };
  const fridgeP = endCfg.type === 'fridge' ? eio(seg(t, endCfg.tStart ?? 50.8, endCfg.tEnd ?? 54.4)) : 0;
  const scF = lerp(1, VIEW.h > VIEW.w ? 0.76 : 0.715, fridgeP);
  const mapX = px => VIEW.w * lerp(0.5, 0.475, fridgeP) + (px - VIEW.w / 2) * scF;
  const mapY = py => VIEW.h * lerp(0.5, 0.465, fridgeP) + (py - VIEW.h / 2) * scF;

  const visibleTexts = [];
  const g = TAG_L.g;
  const measure = (str, font, weight, size) => {
    g.font = `${weight} ${size}px "${font}"`;
    return g.measureText(String(str || '').normalize('NFC')).width;
  };

  const tp = project.meta?.titlePos || { x: 2715, y: 825, t: 1.8 };
  const pTitle = clamp(seg(t, tp.t ?? 1.8, (tp.t ?? 1.8) + 0.75));
  const pTitleVi = clamp(seg(t, (tp.t ?? 1.8) + 0.45, (tp.t ?? 1.8) + 1.15));
  if (pTitle > 0 && project.meta?.title) {
    const tx = sx(tp.x), ty = sy(tp.y), s1 = 74 * CAM.s, s2 = 41 * CAM.s;
    const w1 = measure(project.meta.title, 'Mali', 700, s1);
    if (tx + w1 * 0.5 > -150 && tx - w1 * 0.5 < VIEW.w + 150) {
      visibleTexts.push({ id: 'title_en', text: project.meta.title, x0: mapX(tx - w1 * 0.5), y0: mapY(ty - s1 * 0.9), x1: mapX(tx + w1 * 0.5), y1: mapY(ty + s1 * 0.25) });
      if (pTitleVi > 0 && project.meta.titleVi) {
        const w2 = measure(project.meta.titleVi, 'Mali', 600, s2);
        visibleTexts.push({ id: 'title_vi', text: project.meta.titleVi, x0: mapX(tx - w2 * 0.5), y0: mapY(ty + 62 * CAM.s - s2 * 0.9), x1: mapX(tx + w2 * 0.5), y1: mapY(ty + 62 * CAM.s + s2 * 0.25) });
      }
    }
  }

  (project.tags || []).forEach(tg => {
    const p = clamp(seg(t, tg.t, tg.t + 0.45));
    if (p <= 0) return;
    const cx = sx(tg.x), cy = sy(tg.y), szEn = 46 * CAM.s, szVi = 28 * CAM.s;
    if (cx > -200 && cx < VIEW.w + 200 && cy > -150 && cy < VIEW.h + 150) {
      const wEn = measure(tg.en, 'Mali', 700, szEn);
      visibleTexts.push({ id: tg.id + '_en', text: tg.en, x0: mapX(cx - wEn * 0.5), y0: mapY(cy - szEn * 0.9), x1: mapX(cx + wEn * 0.5), y1: mapY(cy + szEn * 0.2) });
      const pVi = clamp((p - 0.35) / 0.65);
      if (pVi > 0 && tg.vi) {
        const wVi = measure(tg.vi, 'Patrick Hand', 400, szVi);
        visibleTexts.push({ id: tg.id + '_vi', text: tg.vi, x0: mapX(cx - wVi * 0.5), y0: mapY(cy + 34 * CAM.s - szVi * 0.9), x1: mapX(cx + wVi * 0.5), y1: mapY(cy + 34 * CAM.s + szVi * 0.2) });
      }
    }
  });
  return visibleTexts;
}

// Generate deterministic sound & music events directly from project.json for score_gen.py & mix_gen.py!
export function buildEventsFromProject(project) {
  const ev = [];
  const dur = project.meta?.duration || 30.0;
  const tp = project.meta?.titlePos;
  if (tp && project.meta?.title) ev.push({ t: tp.t ?? 1.8, type: 'write', dur: 0.85, pan: 0.3 });

  for (const tg of project.tags || []) {
    ev.push({ t: tg.t, type: 'write', dur: 0.42, pan: clamp((tg.x - 1600) / 1400, -0.6, 0.6) });
  }
  for (const ent of project.entities || []) {
    const pan = clamp((ent.x - 1600) / 1400, -0.6, 0.6);
    if ((ent.drawDur ?? 0) > 0) ev.push({ t: ent.tStart ?? 0, type: 'scratch', dur: ent.drawDur, pan });
    if ((ent.fillDur ?? 0) > 0) ev.push({ t: (ent.tStart ?? 0) + (ent.drawDur ?? 0) * 0.4, type: 'scribble', dur: ent.fillDur, pan });
    for (const st of ent.states || []) {
      if (st.pose === 'idea' || st.pose === 'ideaBlue') ev.push({ t: st.t, type: 'idea', pan });
      if (st.pose === 'hot') ev.push({ t: st.t + 0.15, type: 'swish', dur: 0.45, pan });
      if (st.pose === 'jumpA') ev.push({ t: st.t + 0.1, type: 'hop', pan });
      if (st.pose === 'sad_hungry') ev.push({ t: st.t + 0.35, type: 'rumble', dur: 0.9, pan });
      if (st.pose === 'eat_apple') ev.push({ t: st.t + 0.25, type: 'crunch', pan });
      if (st.pose === 'blow') ev.push({ t: st.t + 0.20, type: 'blow', dur: 0.65, pan });
      if (st.pose === 'cheer') ev.push({ t: st.t + 0.12, type: 'hop', pan });
      if (st.mood === 'rustle') ev.push({ t: st.t, type: 'rustle', dur: 1.35, pan });
      if (st.mood === 'knock') ev.push({ t: st.t + 0.1, type: 'knock', pan });
      if (st.mood === 'open' && ent.type === 'gift_box') ev.push({ t: st.t, type: 'gift_open', pan });
      if (st.mood === 'puff') ev.push({ t: st.t + 0.1, type: 'puff', pan });
      if (st.mood === 'sprout') ev.push({ t: st.t + 0.15, type: 'sprout', pan });
    }
    if (ent.type === 'flower') {
      ev.push({ t: (ent.tStart ?? 0) + (ent.drawDur ?? 2.5), type: 'bloom', pan });
    }
    if (ent.type === 'gray_wolf') {
      const chSt = (ent.states || []).find(s => s.pose === 'cheer');
      if (chSt) ev.push({ t: chSt.t, type: 'bloom', pan });
    }
  }
  if (project.palette?.washEnabled) {
    const ws = project.palette.washStart ?? 30.0;
    ev.push({ t: Math.max(0, ws - 0.4), type: 'dip', pan: -0.35 });
    ev.push({ t: ws,        type: 'brush', dur: 2.3, dir:  1 });
    ev.push({ t: ws + 1.90, type: 'brush', dur: 2.4, dir: -1 });
    ev.push({ t: ws + 3.80, type: 'brush', dur: 2.5, dir:  1 });
    const pitches = ['A5', 'C6', 'D6', 'F6', 'E6', 'C6', 'A5', 'C6', 'D6', 'F6', 'G6'];
    pitches.forEach((pitch, k) => {
      ev.push({ t: ws + 0.45 + k * 0.55, type: 'glint', pan: ((k % 5) - 2) * 0.2, pitch });
    });
  }
  if (project.ending?.type === 'fridge') {
    ev.push({ t: project.ending.tStart ?? (dur - 5), type: 'tape', pan: 0 });
  }
  for (const sil of project.silences || []) {
    // Subtle wooden crayon clink just before silence #1 ends
    if (sil.t1 - sil.t0 >= 0.8) ev.push({ t: sil.t1 - 0.30, type: 'clink', pan: -0.25 });
  }
  for (const s of project.subtitles || []) {
    ev.push({ t: s.vt, type: 'voice', id: s.id, dur: s.dur || 1.5 });
  }
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
