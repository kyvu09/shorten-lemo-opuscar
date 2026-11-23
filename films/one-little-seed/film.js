// Main film renderer for "One Little Seed" (56.0 s, 24 fps smooth camera/wash, 12 fps drawn boil & acting).
import { clamp, lerp, hash, seg, eo, eio, ei } from '/core/lib.js';
import { W, H, CAM, BOIL, WMUL, layer, clear, line, dab, text, sx, sy } from './crayon.js';
import { group, clearGroup, curve } from './rig.js';
import { drawLeo, drawSeed, drawSun, drawCloud, drawFlower } from './chars.js';
import { PW, PH, SEED_X, SEED_Y, LEO_X, LEO_Y, SUN_X, SUN_Y, CLD_X, CLD_Y, drawWorld, drawWhiteWax, drawWash, drawTitle, drawVocabTags } from './world.js';
import { capturePage, renderFridgeFrame } from './fridge.js';
import { DUR, SUBS, TAGS, SILENCES } from './timeline.js';
import { PAPER, C, WASH_SAP } from './pal.js';

// Persistent offscreen Canvas2D pressure layers (reused every frame)
const BG_F = layer(), BG_L = layer();
const WAX_L = layer();
const WASH_L = layer();
const SKY_G = group();
const SEED_G = group();
const LEO_G = group();
const FLW_G = group();
const FX_L = layer();
const TAG_K = layer(), TAG_L = layer();
const SUB_K = layer(), SUB_L = layer();

// Smooth camera keyframes [t, x, y, scale] covering all 8 deliberate moves
const CAM_KEYS = [
  [ 0.00, 1680, 1365, 1.88],   // Shot 1a: ECU on sleeping seed
  [ 0.45, 1680, 1365, 1.88],
  [ 2.55, 2245, 1175, 0.94],   // Shot 1b: Pull-out showing Seed + Title cleanly (Leo hidden off-left!)
  [ 7.55, 2220, 1165, 0.94],
  [ 9.00, 1280,  955, 1.06],   // Shot 2: Tilt/pan left-up off Title onto Leo & soil mound
  [12.10, 1315,  945, 1.05],
  [13.45, 1980,  625, 0.86],   // Shot 3: Tilt along gaze up-right to smiling Sun (cleanly above SEED tag!)
  [17.20, 2000,  615, 0.86],
  [18.00, 1350, 1125, 1.06],   // Shot 4: Locked comic MCU (Leo sweating + Seed hiding below; Title cleanly off-right!)
  [23.25, 1350, 1125, 1.06],
  [24.35, 1460,  575, 1.01],   // Shot 5a: Truck left-to-right across sky drawing Cloud (Title cleanly off-right!)
  [28.55, 1510,  560, 1.00],   // Shot 5b: Settles as Cloud puffs cheeks
  [29.35, 1510,  560, 1.00],
  [30.25, 1615, 1020, 0.66],   // Shot 6: Held wide cross-section for sap-green rain wash & wax resist!
  [41.20, 1615, 1020, 0.66],
  [42.15, 1495, 1055, 1.04],   // Shot 7a: Push onto sprouting stem (Title cleanly off-right!)
  [44.90, 1325,  765, 0.96],   // Shot 7b: Upward crane tracking tall red flower & jumping Leo
  [47.25, 1325,  765, 0.96],
  [48.55, 1600,  900, 0.60],   // Shot 8a: Full finished page (3200×1800 @ 0.60 = 1920×1080 exact)
  [56.00, 1600,  900, 0.60],
];

function evalCam(t) {
  if (t <= CAM_KEYS[0][0]) return { x: CAM_KEYS[0][1], y: CAM_KEYS[0][2], s: CAM_KEYS[0][3] };
  for (let i = 1; i < CAM_KEYS.length; i++) {
    const a = CAM_KEYS[i - 1], b = CAM_KEYS[i];
    if (t <= b[0]) {
      const f = eio(seg(t, a[0], b[0]));
      return { x: lerp(a[1], b[1], f), y: lerp(a[2], b[2], f), s: lerp(a[3], b[3], f) };
    }
  }
  const L = CAM_KEYS[CAM_KEYS.length - 1];
  return { x: L[1], y: L[2], s: L[3] };
}

// Compute Leo's 12 fps substitution pose + expression at time t
function leoState(t) {
  const step12 = Math.floor(t * 12);
  const alt2 = Math.floor(t * 4.5) % 2;
  if (t < 9.5)   return { view: 'r34', expr: 'curious', pose: 'crouch' };
  if (t < 11.15) return { view: 'r34', expr: 'curious', pose: 'stand' };
  if (t < 12.25) return { view: 'r34', expr: 'idea',    pose: 'idea' };
  if (t < 16.5)  return { view: 'r34', expr: 'happy',   pose: alt2 ? 'colourA' : 'colourB' };
  if (t < 17.5)  return { view: 'r34', expr: 'happy',   pose: 'stand' };
  if (t < 20.4)  return { view: 'r34', expr: 'hot',     pose: 'hot' };
  if (t < 22.3)  return { view: 'r34', expr: 'uhoh',    pose: 'stand' };
  if (t < 23.5)  return { view: 'r34', expr: 'idea',    pose: 'ideaBlue' };
  if (t < 27.2)  return { view: 'r34', expr: 'happy',   pose: alt2 ? 'cloudA' : 'cloudB' };
  if (t < 29.8)  return { view: 'r34', expr: 'curious', pose: 'stand' };
  if (t < 41.5)  return { view: 'front', expr: t > 38.6 ? 'excited' : 'amazed', pose: 'rain' };
  if (t < 44.5)  return { view: 'r34', expr: 'amazed',  pose: 'stand' };
  if (t < 47.4) {
    // Two joyful celebratory jumps locked to the beat (45.45 s and 46.45 s)!
    const j1 = t >= 45.35 && t < 45.88;
    const j2 = t >= 46.35 && t < 46.92;
    return { view: 'r34', expr: 'excited', pose: (j1 || j2) ? 'jumpA' : 'jumpB' };
  }
  return { view: 'r34', expr: 'happy', pose: step12 % 24 < 2 ? 'jumpB' : 'stand' };
}

// Draw playful hand-drawn expressive FX (sleepy zzz, idea sparkles, heat waves, cloud puff curls, bloom twinkles)
function drawFX(L, t) {
  // 1. Sleepy 'z z' floating gently above the sleeping seed (Shot 1 & early Shot 2)
  if (t >= 1.4 && t < 17.6) {
    const zFade = t > 16.5 ? clamp(1 - (t - 16.5)) : clamp((t - 1.4) / 0.5);
    if (zFade > 0.05) {
      const cyc = (t * 0.55) % 1;
      for (let k = 0; k < 2; k++) {
        const f = (cyc + k * 0.5) % 1;
        const zx = sx(SEED_X + 46 + f * 34 + k * 14);
        const zy = sy(SEED_Y - 54 - f * 62);
        const sz = (24 + k * 8) * CAM.s;
        text(L, 'z', zx, zy, { font: 'Mali', weight: 700, size: sz, col: C.ink, p: 0.72 * zFade * Math.sin(f * Math.PI), seed: 801 + k });
      }
    }
  }

  // 2. Idea sparkles above Leo at 11.15–12.25 s (yellow) and 22.35–23.5 s (sky blue)
  const drawIdea = (t0, t1, col) => {
    if (t < t0 || t > t1) return;
    const p = eo(seg(t, t0, t0 + 0.25));
    const ix = LEO_X + 14, iy = LEO_Y - 392;
    text(L, '!', sx(ix), sy(iy), { font: 'Mali', weight: 700, size: 68 * CAM.s, col, p: 0.95 * p, seed: 810, stroke: 3 });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.85 + (i / 4) * Math.PI * 0.7;
      line(L, [
        [ix + Math.cos(a) * 34, iy - 22 + Math.sin(a) * 34],
        [ix + Math.cos(a) * (54 + 14 * p), iy - 22 + Math.sin(a) * (54 + 14 * p)]
      ], { col, w: 5.5, p: 0.88 * p, seed: 812 + i });
    }
  };
  drawIdea(11.15, 12.25, C.yellow);
  drawIdea(22.35, 23.50, C.sky);

  // 3. Wavy shimmering heat lines during "Too hot!" (16.5–22.4 s — positioned to the right of Leo so never crossing his face!)
  if (t >= 16.5 && t < 22.4) {
    const hp = clamp(seg(t, 16.5, 17.6)) * clamp(1 - seg(t, 21.8, 22.4));
    const phase = Math.floor(t * 12) * 0.6;
    for (let i = 0; i < 4; i++) {
      const bx = 1320 + i * 185;
      const by = 685 + (i % 2) * 50;
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        pts.push([bx + Math.sin(k * 1.1 + phase + i) * 16, by + k * 28]);
      }
      line(L, pts, { col: i % 2 ? C.red : C.yellow, w: 5.5, p: 0.72 * hp, seed: 820 + i });
    }
  }

  // 4. Soft blowing wind curls from Puffy Cloud before silence #2 (27.8–29.5 s)
  if (t >= 27.8 && t < 29.7) {
    const wp = clamp(seg(t, 27.8, 28.4));
    for (let i = 0; i < 3; i++) {
      const wx = CLD_X - 55 + i * 55;
      const wy = CLD_Y + 66 + (i % 2) * 18;
      line(L, curve([[wx, wy], [wx - 14, wy + 34], [wx + 12, wy + 68]], 4), { col: C.sky, w: 5, p: 0.78 * wp, seed: 830 + i });
    }
  }

  // 5. Joyful blossom sparkles around the tall red flower (44.4–56.0 s)
  if (t >= 44.4) {
    const bp = eo(seg(t, 44.4, 45.2));
    const sparks = [[1520, 560, C.yellow], [1885, 535, C.yellow], [1565, 765, C.pink], [1860, 745, C.yellow], [1705, 470, C.red]];
    sparks.forEach(([px, py, col], i) => {
      const r = (16 + Math.sin(t * 5 + i * 1.9) * 5) * bp;
      line(L, [[px - r, py], [px + r, py]], { col, w: 5, p: 0.85, seed: 840 + i * 2 });
      line(L, [[px, py - r], [px, py + r]], { col, w: 5, p: 0.85, seed: 841 + i * 2 });
    });
  }
}

// Draw printed picture-book bilingual subtitles on a ragged knock-out bare-paper patch at bottom-center!
function drawSubtitles(K_L, T_L, t, onFridge = false) {
  const active = SUBS.find(s => t >= s.t0 && t <= s.t1);
  if (!active) return;

  const rev = clamp((t - active.t0) / 0.36);
  const cyEn = 988, cyVi = 1034;

  // Measure English line width to size the ragged bare-paper patch neatly
  const g = T_L.g;
  g.save();
  g.font = '400 50px "Patrick Hand"';
  const wEn = g.measureText(active.en.normalize('NFC')).width;
  g.font = '400 30px "Patrick Hand"';
  const wVi = g.measureText(active.vi.normalize('NFC')).width;
  g.restore();
  const hw = Math.max(wEn, wVi) * 0.5 + 48;

  // Ragged hand-torn bare-paper knock-out patch (never a dark box!)
  const kg = K_L.g;
  kg.save();
  kg.fillStyle = onFridge ? '#f4efe3' : '#000';
  kg.beginPath();
  const x0 = W / 2 - hw, x1 = W / 2 + hw, y0 = 934, y1 = 1054;
  const st = BOIL.step;
  kg.moveTo(x0, y0);
  for (let i = 1; i <= 18; i++) kg.lineTo(lerp(x0, x1, i / 18), y0 + (hash(i * 4.1 + st * 0.2) - 0.5) * 9);
  for (let i = 1; i <= 6; i++)  kg.lineTo(x1 + (hash(i * 7.3 + 20) - 0.5) * 10, lerp(y0, y1, i / 6));
  for (let i = 17; i >= 0; i--) kg.lineTo(lerp(x0, x1, i / 18), y1 + (hash(i * 5.9 + 40) - 0.5) * 9);
  for (let i = 5; i >= 0; i--)  kg.lineTo(x0 + (hash(i * 3.7 + 60) - 0.5) * 10, lerp(y0, y1, i / 6));
  kg.closePath();
  kg.fill();
  kg.restore();

  // Top line: primary English (50 px Patrick Hand, with key vocabulary highlighted & gently underlined!)
  text(T_L, active.en, W / 2, cyEn, {
    font: 'Patrick Hand', size: 50, col: C.ink,
    highlight: active.key, hiCol: active.hiCol, underline: Boolean(active.key),
    reveal: rev, seed: 970
  });
  // Bottom line: concise Vietnamese translation (30 px Patrick Hand)
  text(T_L, active.vi, W / 2, cyVi, {
    font: 'Patrick Hand', size: 30, col: '#6d4c35',
    reveal: clamp((rev - 0.12) / 0.88), seed: 975
  });
}

// Track on-page texts for core/render/readcheck.mjs
let lastTexts = [];
export function getVisibleTexts(t) {
  // Compute deterministic text boxes without needing full WebGL render if readcheck queries directly
  renderBoxesOnly(t);
  return lastTexts;
}

function renderBoxesOnly(t) {
  // If renderFilm already ran for this t, lastTexts is exact; otherwise recompute quickly
  const cam = evalCam(t);
  CAM.x = cam.x; CAM.y = cam.y; CAM.s = cam.s;
  const boxes = [];
  const p1 = clamp(seg(t, 1.80, 2.55));
  const p2 = clamp(seg(t, 2.25, 2.95));
  const fridgeP = eio(seg(t, 50.80, 54.40));
  const scF = lerp(1, 0.715, fridgeP);
  const mapX = px => W * lerp(0.5, 0.475, fridgeP) + (px - W / 2) * scF;
  const mapY = py => H * lerp(0.5, 0.465, fridgeP) + (py - H / 2) * scF;

  if (p1 > 0) {
    const tx = mapX(sx(2715)), ty = mapY(sy(825));
    const s1 = 74 * CAM.s * scF;
    const hw = 250 * CAM.s * scF;
    if (tx + hw > 0 && tx - hw < W && ty > 0 && ty < H) {
      boxes.push({ id: 'title_en', text: 'One Little Seed', x0: tx - hw, y0: ty - s1 * 0.9, x1: tx + hw, y1: ty + s1 * 0.25 });
    }
  }
  if (p2 > 0) {
    const tx = mapX(sx(2715)), ty = mapY(sy(825) + 62 * CAM.s);
    const s2 = 41 * CAM.s * scF;
    const hw = 205 * CAM.s * scF;
    if (tx + hw > 0 && tx - hw < W && ty > 0 && ty < H) {
      boxes.push({ id: 'title_vi', text: 'Một Hạt Giống Nhỏ', x0: tx - hw, y0: ty - s2 * 0.9, x1: tx + hw, y1: ty + s2 * 0.25 });
    }
  }
  for (const tg of TAGS) {
    const p = clamp(seg(t, tg.t, tg.t + 0.45));
    if (p <= 0) continue;
    const cx = mapX(sx(tg.x)), cy = mapY(sy(tg.y));
    const szEn = 46 * CAM.s * scF, szVi = 28 * CAM.s * scF;
    const hw = 95 * CAM.s * scF;
    if (cx + hw > 0 && cx - hw < W && cy - szEn > 0 && cy + szVi < H) {
      boxes.push({ id: tg.id + '_en', text: tg.en, x0: cx - hw, y0: cy - szEn * 0.9, x1: cx + hw, y1: cy + szEn * 0.2 });
      boxes.push({ id: tg.id + '_vi', text: tg.vi, x0: cx - hw, y0: cy + 34 * CAM.s * scF - szVi * 0.9, x1: cx + hw, y1: cy + 34 * CAM.s * scF + szVi * 0.2 });
    }
  }
  lastTexts = boxes;
}

export function renderFilm(comp, glCanvas, t) {
  const cam = evalCam(t);
  CAM.x = cam.x; CAM.y = cam.y; CAM.s = cam.s;
  WMUL.k = 1;

  // 12 fps boil stepping, calmed to half during our two deliberate real silences (STYLE.md §5 & §8!)
  BOIL.step = Math.floor(t * 12);
  const inSilence = SILENCES.some(s => t >= s.t0 && t <= s.t1);
  BOIL.amp = inSilence ? 0.45 : (t >= 51.0 ? 0.55 : 1.0);

  // Anchor paper tooth to world page!
  comp.paperCam(CAM.x, CAM.y, CAM.s);

  // Clear all working pressure canvases
  clear(BG_F); clear(BG_L); clear(WAX_L); clear(WASH_L);
  clearGroup(SKY_G); clearGroup(SEED_G); clearGroup(LEO_G); clearGroup(FLW_G);
  clear(FX_L); clear(TAG_K); clear(TAG_L); clear(SUB_K); clear(SUB_L);

  // 1. Background garden & underground cross-section (drawn BEFORE wash)
  drawWorld(BG_F, BG_L, t);

  // 2. White-wax resist layer (raindrops + underground roots — invisible until wash!)
  drawWhiteWax(WAX_L, t);

  // 3. Sky characters (Sun draws & colours in Shot 3; Cloud draws & puffs in Shot 5)
  const sunDraw = eo(seg(t, 12.20, 13.60));
  const sunFill = eo(seg(t, 12.90, 15.40));
  const sunHeat = clamp(seg(t, 15.80, 18.20)) * clamp(1 - seg(t, 24.80, 26.80));
  if (sunDraw > 0) {
    drawSun(SKY_G, SUN_X, SUN_Y, { sc: 1.0, draw: sunDraw, fillP: sunFill, heat: sunHeat, rot: Math.floor(t * 12) * 0.012, seed: 200 });
  }

  const cldDraw = eo(seg(t, 23.50, 25.10));
  const cldFill = eo(seg(t, 24.40, 26.80));
  if (cldDraw > 0) {
    const cldX = lerp(CLD_X - 95, CLD_X + 35, eio(seg(t, 23.50, 27.60))) + Math.sin(t * 1.1) * 8;
    const cldMood = (t >= 27.7 && t < 35.5) ? 'puff' : (t >= 26.8 && t < 27.7 ? 'wink' : 'happy');
    drawCloud(SKY_G, cldX, CLD_Y, { sc: 1.06, draw: cldDraw, fillP: cldFill, mood: cldMood, seed: 300 });
  }

  // 4. The Little Seed underground (draws live in Shot 1, reacts to heat, wakes & sprouts; baby shoot hands off seamlessly into full stem at 41.5 s!)
  const seedDraw = eo(seg(t, 0.35, 1.45));
  const seedFill = eo(seg(t, 0.90, 1.95));
  let seedMood = 'sleep';
  if (t >= 17.5 && t < 23.8) seedMood = 'hot';
  else if (t >= 38.6 && t < 41.55) seedMood = 'sprout';
  else if (t >= 35.6) seedMood = 'wake';
  const sproutP = t < 41.55 ? eo(seg(t, 38.70, 41.30)) : 0;
  drawSeed(SEED_G, SEED_X, SEED_Y, { sc: 1.08, mood: seedMood, draw: seedDraw, fillP: seedFill, sproutP, seed: 120 });

  // 5. Tall Red Flower growing continuously from top of the Seed right through the soil and up into the sky!
  if (t >= 41.45) {
    const stemP  = eio(seg(t, 41.45, 44.30));
    const leafP  = eo(seg(t, 42.45, 44.10));
    const petalP = eo(seg(t, 44.25, 46.10));
    const sway = Math.sin(t * 2.1) * 0.45;
    drawFlower(FLW_G, SEED_X, 1088, { sc: 1.08, rootY: SEED_Y - 40, stemP, leafP, petalP, sway, seed: 400 });
  }

  // 6. Leo (composited AFTER the wash per STYLE.md §9 so he stays bright and dry!)
  const ls = leoState(t);
  drawLeo(LEO_G, LEO_X, LEO_Y, { sc: 1.02, view: ls.view, expr: ls.expr, pose: ls.pose, seed: 10 });

  // 7. Expressive FX + Title + Bilingual Vocabulary Tags (composited AFTER wash so Title & Tags stay crisp!)
  drawFX(FX_L, t);
  drawTitle(TAG_L, t, TAG_K);
  drawVocabTags(TAG_K, TAG_L, TAGS, t);

  // 8. Watercolour wash canvas
  drawWash(WASH_L, t);

  // 9. Composite page layers through WebGL2 shader!
  const fridgeP = eio(seg(t, 50.80, 54.40));
  comp.begin(PAPER);
  comp.crayon(BG_F.c);
  comp.crayon(BG_L.c);
  comp.crayon(WAX_L.c, { gain: 1.15 });      // heavy white wax resists sap-green wash!

  // Apply single Sap Rain-Green watercolour wash (resisted by white-wax raindrops & roots!)
  if (t >= 30.0) {
    comp.wash(WASH_L.c, { color: WASH_SAP, resist: 0.94, edge: 1.55, gran: 0.55 });
  }

  // Characters & blooming flower composited AFTER the wash so they never turn muddy!
  comp.group(SKY_G);
  comp.group(SEED_G);
  comp.group(FLW_G);
  comp.group(LEO_G);
  comp.crayon(FX_L.c);

  // Crisp bilingual vocabulary tags on bare-paper knock-out patches
  comp.knock(TAG_K.c, PAPER);
  comp.crayon(TAG_L.c);

  if (fridgeP <= 0.001) {
    // Normal page shots (Shots 1–7 & Shot 8a): printed book subtitles right on the paper!
    drawSubtitles(SUB_K, SUB_L, t, false);
    comp.knock(SUB_K.c, PAPER);
    comp.crayon(SUB_L.c);
    comp.finish({ vig: 0.22, emb: 0.54 });
  } else {
    // Shot 8b (Fridge Pull-Out): finish inner page with vignette=0 (avoid double vignette!), capture, composite onto fridge!
    comp.finish({ vig: 0.0, emb: 0.50 });
    capturePage(glCanvas);
    renderFridgeFrame(comp, fridgeP);
    // Render final line ("Well done, little seed.") cleanly on a warm paper ribbon at bottom of screen
    drawSubtitles(SUB_K, SUB_L, t, true);
    comp.image(SUB_K.c);
    comp.crayon(SUB_L.c);
    comp.finish({ vig: 0.18 * fridgeP, emb: 0.08 * fridgeP, lamp: [0.22, 0.2, 0.95, 0.45 * fridgeP] });
  }

  renderBoxesOnly(t);
}
