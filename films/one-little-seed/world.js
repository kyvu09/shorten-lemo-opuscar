// World page for "One Little Seed" (3200 × 1800 picture-book cross-section):
// Sunny garden above (y < 1090), cozy earth cross-section below (y > 1090),
// hidden white-wax raindrops & branching underground roots revealed by 3 overlapping sap-green watercolour wash bands.
import { clamp, lerp, hash, seg, eo, eio } from '/core/lib.js';
import { W, H, CAM, BOIL, sx, sy, ws, line, fill, dab, ellipse, handCircle, smooth, text } from './crayon.js';
import { curve } from './rig.js';
import { C } from './pal.js';

export const PW = 3200, PH = 1800;
export const SEED_X = 1680, SEED_Y = 1365;
export const LEO_X  = 1100, LEO_Y  = 1095;
export const SUN_X  = 2420, SUN_Y  =  340;
export const CLD_X  = 1740, CLD_Y  =  330;

export function groundY(x) {
  const dx = (x - SEED_X) / 210;
  return 1090 + Math.sin(x / 380) * 14 - Math.exp(-(dx * dx)) * 16;
}

// Precompute deterministic white-wax raindrops (spanning full sky cleanly above grass line)
// and separate twinkling sky sparkles + branching underground roots (invisible until sap-green wash passes!)
export const DROPS = (() => {
  const out = [];
  for (let i = 0; i < 86; i++) {
    const u = hash(i * 11.7 + 3.1);
    const v = hash(i * 19.3 + 7.4);
    const x = lerp(240, 2960, u);
    const y = lerp(455, 975, v);
    // keep clear of cloud, sun, and title text box
    if (Math.hypot((x - CLD_X) / 225, (y - CLD_Y) / 120) < 1.05) continue;
    if (Math.hypot((x - SUN_X) / 210, (y - SUN_Y) / 210) < 1.05) continue;
    if (x > 2280 && x < 2960 && y > 710 && y < 945) continue;
    const len = lerp(26, 46, hash(i * 5.9));
    const tilt = -0.15 + (hash(i * 8.3) - 0.5) * 0.06;
    out.push({ x, y, len, tilt, seed: 500 + i * 3 });
  }
  return out;
})();

export const SKY_TWINKLES = (() => {
  const out = [];
  for (let i = 0; i < 24; i++) {
    const x = lerp(340, 2820, hash(i * 23.1 + 1.9));
    const y = lerp(320, 930, hash(i * 13.7 + 6.2));
    if (Math.hypot((x - CLD_X) / 230, (y - CLD_Y) / 130) < 1.05) continue;
    if (Math.hypot((x - SUN_X) / 220, (y - SUN_Y) / 220) < 1.05) continue;
    if (x > 2280 && x < 2960 && y > 710 && y < 945) continue;
    out.push({ x, y, seed: 640 + i * 5 });
  }
  return out;
})();

// Organic branching underground root network radiating from the bottom of the seed!
export const ROOTS = (() => {
  const branches = [
    // Primary tap-root curving gently down (kept <= 1555 so fully above subtitle zone in wide Shot 6)
    { pts: [[1680, 1402], [1670, 1455], [1692, 1505], [1676, 1552]], w: 12 },
    // Main left roots
    { pts: [[1666, 1402], [1595, 1442], [1505, 1478], [1405, 1512], [1335, 1540]], w: 11 },
    { pts: [[1654, 1396], [1565, 1418], [1465, 1430], [1375, 1455]], w: 9.5 },
    { pts: [[1545, 1460], [1510, 1508], [1465, 1546]], w: 8 },
    { pts: [[1445, 1495], [1422, 1532], [1392, 1554]], w: 7 },
    { pts: [[1595, 1442], [1575, 1502], [1562, 1548]], w: 8 },
    // Main right roots
    { pts: [[1694, 1402], [1770, 1440], [1865, 1478], [1965, 1512], [2045, 1538]], w: 11 },
    { pts: [[1706, 1396], [1795, 1416], [1895, 1432], [1995, 1458]], w: 9.5 },
    { pts: [[1825, 1462], [1855, 1510], [1895, 1548]], w: 8 },
    { pts: [[1915, 1495], [1945, 1532], [1978, 1552]], w: 7 },
    { pts: [[1765, 1440], [1782, 1500], [1795, 1548]], w: 8 },
    // Fine curly root hairs
    { pts: [[1675, 1485], [1628, 1518], [1608, 1550]], w: 6.5 },
    { pts: [[1688, 1496], [1732, 1525], [1750, 1552]], w: 6.5 },
    { pts: [[1495, 1430], [1468, 1468]], w: 6 },
    { pts: [[1865, 1428], [1905, 1466]], w: 6 },
  ];
  return branches.map((b, i) => ({ pts: curve(b.pts, 6), w: b.w, seed: 700 + i * 7 }));
})();

// ——— Background garden & earth cross-section (drawn BEFORE wash; background colouring does NOT boil!) ———
export function drawWorld(BG_F, BG_L, t) {
  // 1. Subtle child-drawn soil cross-section fill (light earth ochre streaks along sides, leaving central root zone bright paper so the sap-green wash & white-wax roots contrast dramatically!)
  const horizonPts = [];
  for (let x = -40; x <= PW + 40; x += 48) horizonPts.push([x, groundY(x)]);

  // Warm soft ochre soil top crust band just below grass line (never muddy under wash)
  const crust = [
    ...horizonPts,
    [PW + 40, 1215], [2600, 1220], [1980, 1212], [1680, 1225], [1250, 1210], [600, 1218], [-40, 1215]
  ];
  fill(BG_F, crust, { col: C.ochre, p: 0.42, gap: 16, w: 14, over: 6, seed: 12, ang: 0.06, boil: 0 });

  // Soft meadow grass strip along the horizon (heavy enough pressure >= 0.8 where wash crosses per STYLE.md §9!)
  const grass = [
    ...horizonPts.map(([x, y]) => [x, y - 22]),
    ...horizonPts.slice().reverse().map(([x, y]) => [x, y + 18])
  ];
  fill(BG_F, grass, { col: C.green, p: 0.85, gap: 9, w: 12, over: 6, seed: 14, ang: -0.22, boil: 0 });
  line(BG_L, horizonPts, { col: C.ink, w: 7, p: 0.88, seed: 15, boil: 0.55 });

  // Playful hand-drawn tufts of grass along the meadow
  for (let i = 0; i < 24; i++) {
    const gx = 160 + i * 124 + (hash(i * 9.1) - 0.5) * 40;
    if (Math.abs(gx - SEED_X) < 95) continue;
    const gy = groundY(gx);
    const h = 22 + hash(i * 4.7) * 20;
    line(BG_L, [[gx - 10, gy], [gx - 18, gy - h]], { col: C.green, w: 5.5, p: 0.86, seed: 20 + i * 3, boil: 0.4 });
    line(BG_L, [[gx, gy], [gx + 2, gy - h * 1.15]], { col: C.green, w: 5.5, p: 0.86, seed: 21 + i * 3, boil: 0.4 });
    line(BG_L, [[gx + 10, gy], [gx + 18, gy - h * 0.9]], { col: C.green, w: 5.5, p: 0.86, seed: 22 + i * 3, boil: 0.4 });
  }

  // 2. Cozy curved underground seed burrow (draws live in first 1.2 s!)
  const burrowP = eo(seg(t, 0.0, 1.15));
  if (burrowP > 0) {
    const burrow = ellipse(SEED_X, SEED_Y + 4, 92, 74, 34);
    line(BG_L, burrow, { col: C.ink, w: 6, p: 0.82, seed: 44, draw: burrowP, boil: 0.65, closed: true });
    // Little warm pebbles in soil
    const pebs = [[1470, 1310, 16], [1890, 1295, 14], [1540, 1465, 12], [1855, 1460, 15], [1320, 1345, 13], [2140, 1360, 16], [980, 1330, 15], [2440, 1390, 14]];
    pebs.forEach(([px, py, pr], i) => {
      const pp = clamp((burrowP - 0.2 - i * 0.05) / 0.35);
      if (pp <= 0) return;
      const pb = ellipse(px, py, pr, pr * 0.72, 14, 0, Math.PI * 2, hash(i) * 2);
      fill(BG_F, pb, { col: C.ochre, p: 0.55, gap: 6, w: 7, over: 2, seed: 60 + i, boil: 0 });
      line(BG_L, pb, { col: C.ink, w: 4.5, p: 0.72, seed: 70 + i, draw: pp, boil: 0.5, closed: true });
    });
  }

  // 3. Child-logic wooden garden fence on far left (slanted posts, warm ochre)
  for (let i = 0; i < 5; i++) {
    const fx = 280 + i * 112;
    const fy = groundY(fx) + 6;
    const lean = (hash(i * 3.7) - 0.5) * 12;
    const post = [[fx - 16, fy], [fx - 18 + lean, fy - 132], [fx + lean, fy - 156], [fx + 18 + lean, fy - 132], [fx + 16, fy]];
    fill(BG_F, post, { col: C.ochre, p: 0.72, gap: 9, w: 10, over: 4, seed: 80 + i, ang: 0.9, boil: 0 });
    line(BG_L, post, { col: C.ink, w: 6, p: 0.82, seed: 90 + i, boil: 0.55, closed: true });
  }
  line(BG_L, [[250, 995], [760, 990]], { col: C.ink, w: 7, p: 0.8, seed: 98, boil: 0.5 });
  line(BG_L, [[252, 1052], [758, 1048]], { col: C.ink, w: 7, p: 0.8, seed: 99, boil: 0.5 });

  // 4. Cute sky-blue watering can resting on the grass near Leo (x=820, y=1090)
  const wx = 820, wy = groundY(wx) + 2;
  const canBody = [[wx - 44, wy - 76], [wx + 42, wy - 76], [wx + 48, wy], [wx - 48, wy]];
  fill(BG_F, canBody, { col: C.sky, p: 0.84, gap: 8, w: 10, over: 4, seed: 105, ang: 0.4, boil: 0 });
  line(BG_L, canBody, { col: C.ink, w: 6, p: 0.88, seed: 106, boil: 0.55, closed: true });
  // Spout pointing right + arched handle on left
  line(BG_L, [[wx + 44, wy - 24], [wx + 98, wy - 68]], { col: C.sky, w: 12, p: 0.85, seed: 107, boil: 0.5 });
  line(BG_L, [[wx + 44, wy - 24], [wx + 98, wy - 68]], { col: C.ink, w: 5.5, p: 0.88, seed: 108, boil: 0.55 });
  const rose = ellipse(wx + 104, wy - 72, 12, 18, 14, 0, Math.PI * 2, 0.7);
  fill(BG_F, rose, { col: C.yellow, p: 0.88, gap: 5, w: 6, over: 1, seed: 109, boil: 0 });
  line(BG_L, rose, { col: C.ink, w: 4.5, p: 0.88, seed: 110, boil: 0.55, closed: true });
  line(BG_L, curve([[wx - 42, wy - 64], [wx - 84, wy - 64], [wx - 80, wy - 16], [wx - 44, wy - 16]], 5), { col: C.ink, w: 6, p: 0.86, seed: 111, boil: 0.55 });

  // 5. Little cozy garden flowers & bushes far right (x = 2620..2940) to balance the finished page!
  const bush = smooth([[2660, 1088], [2675, 1005], [2745, 982], [2810, 998], [2865, 978], [2940, 1010], [2960, 1088]], 5, true);
  fill(BG_F, bush, { col: C.green, p: 0.82, gap: 10, w: 12, over: 6, seed: 115, ang: 0.5, boil: 0 });
  line(BG_L, bush, { col: C.ink, w: 6.5, p: 0.84, seed: 116, boil: 0.55, closed: true });
  [[2725, 1030, C.yellow], [2820, 1020, C.pink], [2895, 1040, C.yellow]].forEach(([bx, by, bc], i) => {
    dab(BG_F, bx, by, 14, { col: bc, p: 0.9, seed: 120 + i, boil: 0 });
  });
}

// ——— WHITE-WAX RESIST LAYER (paper-matched wax: invisible on bare paper, glows luminous paper-white under wash!) ———
export function drawWhiteWax(WL, t) {
  // 1. Clean plump diagonal white-wax raindrops across the sky
  const rainMotion = Math.floor(t * 12);
  for (const d of DROPS) {
    const fallOff = t > 30.0 ? ((rainMotion * 6 + d.seed * 13) % 32) - 16 : 0;
    const x0 = d.x + fallOff * d.tilt;
    const y0 = d.y + fallOff;
    const x1 = x0 + Math.sin(d.tilt) * d.len;
    const y1 = y0 + Math.cos(d.tilt) * d.len;
    line(WL, [[x0, y0], [x1, y1]], { col: C.wax, w: 9.5, p: 0.99, seed: d.seed, boil: 0.45, streak: 1, taper: 0.42 });
    dab(WL, x1, y1 + 1.5, 6.5, { col: C.wax, p: 0.99, gap: 3, w: 5, over: 0, seed: d.seed + 1, boil: 0.35 });
  }
  // Separate delicate 4-point white-wax twinkles scattered softly between drops
  for (const s of SKY_TWINKLES) {
    const sp = 11 + Math.sin(t * 4.2 + s.seed) * 3.5;
    line(WL, [[s.x - sp, s.y], [s.x + sp, s.y]], { col: C.wax, w: 4.5, p: 0.98, seed: s.seed, boil: 0.35 });
    line(WL, [[s.x, s.y - sp], [s.x, s.y + sp]], { col: C.wax, w: 4.5, p: 0.98, seed: s.seed + 1, boil: 0.35 });
  }

  // 2. Hidden white-wax branching underground ROOTS (dramatic wax-resist payoff!)
  for (const r of ROOTS) {
    line(WL, r.pts, { col: C.wax, w: r.w + 4, p: 0.99, seed: r.seed, boil: 0.4, streak: 1 });
  }
  const rootSparkles = [
    [1420, 1498], [1510, 1468], [1585, 1522], [1676, 1532],
    [1785, 1518], [1885, 1472], [1970, 1515], [1365, 1528], [2025, 1525]
  ];
  rootSparkles.forEach(([rx, ry], i) => {
    const r = 8 + Math.sin(t * 3.8 + i * 1.4) * 2.5;
    dab(WL, rx, ry, r, { col: C.wax, p: 0.99, gap: 3, w: 5, over: 0, seed: 850 + i, boil: 0.3 });
  });
}

// ——— SAP-GREEN WATERCOLOUR WASH (3 seamless full-page wet-brush bands from sky through deep soil!) ———
// Uses 'source-over' on uniform flat white silhouette masked smoothly so overlapping bands NEVER form dark boxy seams!
export function drawWash(W_L, t) {
  if (t < 30.0) return;
  const g = W_L.g;
  g.save();

  // Three generous full-width wet-brush bands painting left→right, right→left, left→right across the whole page!
  const bands = [
    { y0:  105, y1:  750, t0: 30.00, t1: 32.30, dir:  1, xL: -180, xR: 3380, seed: 11, alpha: 0.64 },
    { y0:  660, y1: 1170, t0: 31.85, t1: 34.15, dir: -1, xL: -180, xR: 3380, seed: 23, alpha: 0.68 },
    { y0: 1080, y1: 1730, t0: 33.75, t1: 36.25, dir:  1, xL: -180, xR: 3380, seed: 37, alpha: 0.84 },
  ];

  // Draw bands cleanly into a single unified silhouette pass first (zero ugly double-alpha overlap seam!),
  // keeping soft wet leading edges and gentle thin bristle streaks (alpha <= 0.10 per STYLE.md §9).
  for (const b of bands) {
    const p = eio(seg(t, b.t0, b.t1));
    if (p <= 0) continue;

    const xa = b.dir > 0 ? b.xL : lerp(b.xR, b.xL, p);
    const xb = b.dir > 0 ? lerp(b.xL, b.xR, p) : b.xR;
    const x0 = sx(xa), x1 = sx(xb);
    const y0 = sy(b.y0), y1 = sy(b.y1);
    const h = y1 - y0;
    const w = x1 - x0;
    if (w < 2) continue;

    g.beginPath();
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const px = lerp(x0, x1, f);
      const wob = (Math.sin(f * 41 + b.seed) * 0.5 + Math.sin(f * 89 + b.seed * 2) * 0.5) * 6 * CAM.s;
      const py = y0 + wob;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const py = lerp(y0, y1, f);
      const bulge = Math.sin(f * Math.PI) * 30 * CAM.s;
      g.lineTo(x1 + (b.dir > 0 ? bulge : 0), py);
    }
    for (let i = steps; i >= 0; i--) {
      const f = i / steps;
      const px = lerp(x0, x1, f);
      const wob = (Math.sin(f * 37 + b.seed * 3) * 0.5 + Math.sin(f * 83 + b.seed) * 0.5) * 6 * CAM.s;
      g.lineTo(px, y1 + wob);
    }
    for (let i = 12; i >= 0; i--) {
      const f = i / 12;
      const py = lerp(y0, y1, f);
      const bulge = Math.sin(f * Math.PI) * 30 * CAM.s;
      g.lineTo(x0 - (b.dir < 0 ? bulge : 0), py);
    }
    g.closePath();

    // Soft vertical feather gradient at top/bottom overlap zones so bands melt seamlessly together!
    const vg = g.createLinearGradient(0, y0, 0, y1);
    vg.addColorStop(0.00, `rgba(255,255,255,${b.alpha * 0.12})`);
    vg.addColorStop(0.14, `rgba(255,255,255,${b.alpha})`);
    vg.addColorStop(0.86, `rgba(255,255,255,${b.alpha})`);
    vg.addColorStop(1.00, `rgba(255,255,255,${b.alpha * 0.12})`);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = vg;
    g.fill();

    // Wet darker leading edge while moving
    if (p < 0.995) {
      const leadX = b.dir > 0 ? x1 : x0;
      const gr = g.createRadialGradient(leadX, (y0 + y1) * 0.5, 4, leadX, (y0 + y1) * 0.5, h * 0.48);
      gr.addColorStop(0, 'rgba(255,255,255,0.34)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fill();
    }

    // Fine thin horizontal bristle streaks (alpha <= 0.08)
    g.strokeStyle = 'rgba(255,255,255,0.075)';
    g.lineWidth = Math.max(1.2, 2.2 * CAM.s);
    for (let k = 0; k < 14; k++) {
      const fy = (k + 0.5) / 14;
      const syk = lerp(y0 + 18 * CAM.s, y1 - 18 * CAM.s, fy);
      g.beginPath();
      g.moveTo(x0, syk);
      g.lineTo(x1, syk + (hash(b.seed + k * 4.3) - 0.5) * 7 * CAM.s);
      g.stroke();
    }
  }
  g.restore();
}

// ——— Hand-lettered Title on the sunny meadow right side (x=2715, y=825) ———
// Leaves via camera pan in Shot 2 (never faded!), stays proudly on the finished fridge drawing!
export function drawTitle(TL, t, K_L = null) {
  const p1 = clamp(seg(t, 1.80, 2.55));
  const p2 = clamp(seg(t, 2.25, 2.95));
  if (p1 <= 0) return [];

  const tx = sx(2715), ty = sy(825);
  const s1 = 74 * CAM.s;
  const s2 = 41 * CAM.s;

  // Soft bare-paper knock-out halo behind title when wash is active so it stays effortlessly readable!
  if (K_L && t >= 30.0) {
    const kg = K_L.g;
    kg.save();
    kg.fillStyle = '#000';
    kg.beginPath();
    const rx = 305 * CAM.s, ry = 102 * CAM.s;
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * Math.PI * 2;
      const px = tx + Math.cos(a) * rx * (0.94 + 0.11 * hash(k * 7.1 + 3));
      const py = ty + 8 * CAM.s + Math.sin(a) * ry * (0.92 + 0.12 * hash(k * 5.3 + 9));
      k ? kg.lineTo(px, py) : kg.moveTo(px, py);
    }
    kg.closePath();
    kg.fill();
    kg.restore();
  }
  const r1 = text(TL, 'One Little Seed', tx, ty, {
    font: 'Mali', weight: 700, size: s1, col: C.ink, reveal: p1, seed: 910, stroke: s1 * 0.025
  });
  if (p1 > 0.7) {
    const up = clamp((p1 - 0.7) / 0.3);
    line(TL, [[2485, 849], [2715, 843], [2945, 851]], { col: C.red, w: 5.5, p: 0.85, seed: 911, draw: up });
  }
  let r2 = null;
  if (p2 > 0) {
    r2 = text(TL, 'Một Hạt Giống Nhỏ', tx, ty + 62 * CAM.s, {
      font: 'Mali', weight: 600, size: s2, col: '#6d4c35', reveal: p2, seed: 912
    });
  }

  const boxes = [];
  if (p1 > 0) boxes.push({ id: 'title_en', text: 'One Little Seed', x0: r1.x0, y0: ty - s1 * 0.9, x1: r1.x1, y1: ty + s1 * 0.25 });
  if (p2 > 0 && r2) boxes.push({ id: 'title_vi', text: 'Một Hạt Giống Nhỏ', x0: r2.x0, y0: ty + 62 * CAM.s - s2 * 0.9, x1: r2.x1, y1: ty + 62 * CAM.s + s2 * 0.25 });
  return boxes;
}

// ——— Bilingual On-Page Vocabulary Tags (drawn on crisp torn-paper knock-out patches after wash!) ———
export function drawVocabTags(K_L, T_L, tags, t) {
  const boxes = [];
  for (let i = 0; i < tags.length; i++) {
    const tg = tags[i];
    const p = clamp(seg(t, tg.t, tg.t + 0.45));
    if (p <= 0) continue;

    const cx = sx(tg.x), cy = sy(tg.y);
    const szEn = 46 * CAM.s;
    const szVi = 28 * CAM.s;

    // Ragged knock-out bare-paper patch behind tag so it pops cleanly over crayon or sap-green wash
    const bw = 112 * CAM.s, bh = 52 * CAM.s;
    const g = K_L.g;
    g.save();
    g.fillStyle = '#000';
    g.beginPath();
    const nPts = 22;
    for (let k = 0; k < nPts; k++) {
      const a = (k / nPts) * Math.PI * 2;
      const rx = bw * (0.94 + 0.12 * hash(i * 17 + k * 3.1));
      const ry = bh * (0.92 + 0.14 * hash(i * 29 + k * 5.7));
      const px = cx + Math.cos(a) * rx;
      const py = cy + 6 * CAM.s + Math.sin(a) * ry;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
    g.fill();
    g.restore();

    // Hand-lettered uppercase English word + Vietnamese gloss directly underneath
    const rEn = text(T_L, tg.en, cx, cy, {
      font: 'Mali', weight: 700, size: szEn, col: tg.col, reveal: p, seed: 940 + i * 5, stroke: szEn * 0.03
    });
    const pVi = clamp((p - 0.35) / 0.65);
    const rVi = pVi > 0 ? text(T_L, tg.vi, cx, cy + 34 * CAM.s, {
      font: 'Patrick Hand', size: szVi, col: C.ink, reveal: pVi, seed: 941 + i * 5
    }) : null;

    // Only report tags currently inside the viewport for readcheck
    if (cx > -200 && cx < W + 200 && cy > -150 && cy < H + 150) {
      boxes.push({ id: tg.id + '_en', text: tg.en, x0: rEn.x0, y0: cy - szEn * 0.9, x1: rEn.x1, y1: cy + szEn * 0.2 });
      if (rVi) boxes.push({ id: tg.id + '_vi', text: tg.vi, x0: rVi.x0, y0: cy + 34 * CAM.s - szVi * 0.9, x1: rVi.x1, y1: cy + 34 * CAM.s + szVi * 0.2 });
    }
  }
  return boxes;
}
