// Reusable Crayon Picture Book Cast & Prop Library (15 original hand-drawn crayon entities).
// Every entity respects STYLE.md: cocoa outlines (never black), child-logic proportions, knock-out backing,
// white-wax eye catchlights, hair outlined on outer edge only, dynamic palette C passed from project.json.
import { clamp, hash } from '/core/lib.js';
import { line, fill, dab, ellipse, handCircle, smooth } from './crayon.js';
import { part, tube, curve, erase, knock } from './rig.js';

export const HUMAN_POSES = [
  'stand', 'crouch', 'idea', 'colour_loop', 'colourA', 'colourB',
  'hot', 'ideaBlue', 'cloud_loop', 'cloudA', 'cloudB', 'rain', 'jumpA', 'jumpB'
];
export const HUMAN_EXPRS = ['happy', 'curious', 'idea', 'hot', 'uhoh', 'amazed', 'excited'];
export const HUMAN_VIEWS = ['r34', 'front', 'l34'];

export const DOG_CAT_POSES = ['stand', 'walk', 'wave', 'scared', 'offer_apple', 'sit_eat', 'cheer'];
export const DOG_CAT_EXPRS = ['happy', 'curious', 'scared', 'kind', 'yummy', 'excited'];
export const WOLF_POSES    = ['peek', 'stand', 'walk', 'wave', 'laugh', 'sad_hungry', 'eat_apple', 'sit_eat', 'cheer'];
export const WOLF_EXPRS    = ['mysterious', 'friendly', 'laugh', 'sad', 'surprised', 'yummy', 'happy'];

export const ENTITY_CATALOG = [
  { type: 'boy_leo',      icon: '👦', label: 'Bé Leo (Áo đỏ)',       kind: 'human',  poses: HUMAN_POSES,   exprs: HUMAN_EXPRS,   defaultScale: 1.02, hit: { rx: 90,  ry: 185, oy: -175 } },
  { type: 'girl_maya',    icon: '👧', label: 'Bé Maya (Váy vàng)',    kind: 'human',  poses: HUMAN_POSES,   exprs: HUMAN_EXPRS,   defaultScale: 1.00, hit: { rx: 90,  ry: 185, oy: -175 } },
  { type: 'little_dog',   icon: '🐶', label: 'Chó nhỏ (Little Dog)',  kind: 'animal', poses: DOG_CAT_POSES, exprs: DOG_CAT_EXPRS, defaultScale: 1.00, hit: { rx: 92,  ry: 145, oy: -140 } },
  { type: 'tabby_cat',    icon: '🐱', label: 'Mèo mướp (Tabby Cat)',  kind: 'animal', poses: DOG_CAT_POSES, exprs: DOG_CAT_EXPRS, defaultScale: 1.00, hit: { rx: 88,  ry: 145, oy: -138 } },
  { type: 'gray_wolf',    icon: '🐺', label: 'Bác Sói (Gray Wolf)',   kind: 'animal', poses: WOLF_POSES,    exprs: WOLF_EXPRS,    defaultScale: 1.00, hit: { rx: 122, ry: 205, oy: -195 } },
  { type: 'big_tree',     icon: '🌲', label: 'Cây cổ thụ lớn',        kind: 'mood',   moods: ['apples', 'plain', 'rustle'],      defaultScale: 1.00, hit: { rx: 225, ry: 310, oy: -310 } },
  { type: 'apple_basket', icon: '🧺', label: 'Giỏ táo đỏ',            kind: 'mood',   moods: ['full', 'half'],                   defaultScale: 1.00, hit: { rx: 78,  ry: 58,  oy: -42 } },
  { type: 'seed',         icon: '🌰', label: 'Hạt giống (Seed)',      kind: 'mood',   moods: ['sleep', 'hot', 'wake', 'sprout'], defaultScale: 1.08, hit: { rx: 60,  ry: 65,  oy: 0 } },
  { type: 'sun',          icon: '☀️', label: 'Mặt trời (Sun)',        kind: 'mood',   moods: ['warm', 'blaze'],                  defaultScale: 1.0,  hit: { rx: 145, ry: 145, oy: 0 } },
  { type: 'cloud',        icon: '☁️', label: 'Đám mây (Cloud)',       kind: 'mood',   moods: ['happy', 'wink', 'puff'],          defaultScale: 1.06, hit: { rx: 185, ry: 95,  oy: -20 } },
  { type: 'flower',       icon: '🌺', label: 'Bông hoa đỏ (Flower)',  kind: 'mood',   moods: ['bloom', 'full'],                  defaultScale: 1.08, hit: { rx: 130, ry: 240, oy: -250 } },
  { type: 'tree',         icon: '🌳', label: 'Cây xanh (Tree)',       kind: 'mood',   moods: ['apples', 'blossom', 'plain'],     defaultScale: 1.0,  hit: { rx: 155, ry: 210, oy: -200 } },
  { type: 'bird',         icon: '🐦', label: 'Chim nhỏ (Bird)',       kind: 'mood',   moods: ['perch', 'fly', 'sing'],           defaultScale: 1.0,  hit: { rx: 85,  ry: 65,  oy: -25 } },
  { type: 'apple',        icon: '🍎', label: 'Quả táo (Apple)',       kind: 'mood',   moods: ['happy', 'wink'],                  defaultScale: 1.0,  hit: { rx: 75,  ry: 78,  oy: -20 } },
  { type: 'house',        icon: '🏠', label: 'Ngôi nhà (House)',      kind: 'mood',   moods: ['day', 'lit'],                     defaultScale: 1.0,  hit: { rx: 190, ry: 170, oy: -165 } },
  { type: 'rainbow',      icon: '🌈', label: 'Cầu vồng (Rainbow)',    kind: 'mood',   moods: ['full'],                           defaultScale: 1.0,  hit: { rx: 280, ry: 140, oy: -80 } },
  { type: 'star',         icon: '⭐', label: 'Ngôi sao (Star)',       kind: 'mood',   moods: ['happy', 'wink'],                  defaultScale: 1.0,  hit: { rx: 85,  ry: 85,  oy: 0 } },
  { type: 'watering_can', icon: '🚿', label: 'Bình tưới cây',         kind: 'mood',   moods: ['idle'],                           defaultScale: 1.0,  hit: { rx: 90,  ry: 60,  oy: -42 } },
  { type: 'fence',        icon: '🪵', label: 'Hàng rào gỗ',           kind: 'mood',   moods: ['idle'],                           defaultScale: 1.0,  hit: { rx: 250, ry: 85,  oy: -80 } },
  { type: 'bush',         icon: '🌿', label: 'Bụi cây có hoa',        kind: 'mood',   moods: ['idle', 'rustle'],                 defaultScale: 1.0,  hit: { rx: 155, ry: 60,  oy: -52 } },
];

const OL = (C, w = 7, seed = 1, extra = {}) => ({ col: C.ink, w, p: 0.9, seed, wob: 1.0, ...extra });

function drawHeldCrayon(G, C, hx, hy, ang, col, sc, seed) {
  const len = 56 * sc, wid = 13 * sc;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const pt = (u, v) => [hx + u * ca - v * sa, hy + u * sa + v * ca];
  const body = [pt(-len * 0.35, -wid * 0.5), pt(len * 0.45, -wid * 0.5), pt(len * 0.72, 0), pt(len * 0.45, wid * 0.5), pt(-len * 0.35, wid * 0.5)];
  part(G, body, { col, p: 0.88, gap: 5, w: 7, over: 2, seed: seed + 41 }, OL(C, 4.5, seed + 42));
  const band = [pt(-len * 0.08, -wid * 0.52), pt(len * 0.16, -wid * 0.52), pt(len * 0.16, wid * 0.52), pt(-len * 0.08, wid * 0.52)];
  line(G.l, [band[0], band[3]], OL(C, 3.5, seed + 43));
  line(G.l, [band[1], band[2]], OL(C, 3.5, seed + 44));
}

// ——— SHARED HUMAN KID RIG (boy_leo & girl_maya) ———
function drawChild(G, C, x, y, o = {}, variant = 'boy') {
  const sc = o.sc ?? 1;
  const view = o.view || 'r34';
  const expr = o.expr || 'happy';
  let pose = o.pose || 'stand';
  const t = o.t ?? 0;
  const seed = o.seed ?? 10;

  // Support animated alternating poses ('colour_loop', 'cloud_loop')
  const alt2 = Math.floor(t * 4.5) % 2;
  if (pose === 'colour_loop') pose = alt2 ? 'colourA' : 'colourB';
  if (pose === 'cloud_loop')  pose = alt2 ? 'cloudA'  : 'cloudB';

  const flip = view === 'l34' ? -1 : 1;
  const faceShift = view === 'front' ? 0 : 12 * flip * sc;

  let bodyDx = 0, bodyDy = 0, bodyTilt = 0, headTilt = 0;
  let lFoot = [-28, 0], rFoot = [28, 0];
  let lKnee = [-26, -42], rKnee = [26, -42];
  let lHand = [-74, -142], lElb = [-60, -172];
  let rHand = [76, -142], rElb = [60, -172];
  let crayonCol = null, crayonAng = -0.6;

  if (pose === 'crouch') {
    bodyDy = 24; bodyTilt = 0.14 * flip; headTilt = 0.16 * flip;
    lKnee = [-34, -36]; rKnee = [36, -34];
    lHand = [-50, -96]; lElb = [-58, -138]; rHand = [54, -92]; rElb = [60, -136];
  } else if (pose === 'idea') {
    bodyDy = -6; headTilt = -0.08 * flip;
    lHand = [-66, -132]; lElb = [-56, -166];
    rHand = [92 * flip, -268]; rElb = [72 * flip, -206];
    crayonCol = C.yellow; crayonAng = flip > 0 ? -0.95 : -2.2;
  } else if (pose === 'colourA') {
    bodyDy = -4; bodyTilt = -0.06 * flip; headTilt = -0.18 * flip;
    lHand = [-62 * flip, -140]; lElb = [-54 * flip, -170];
    rHand = [108 * flip, -290]; rElb = [76 * flip, -222];
    crayonCol = C.yellow; crayonAng = flip > 0 ? -0.7 : -2.4;
  } else if (pose === 'colourB') {
    bodyDy = -8; bodyTilt = -0.09 * flip; headTilt = -0.22 * flip;
    lHand = [-68 * flip, -146]; lElb = [-58 * flip, -172];
    rHand = [84 * flip, -304]; rElb = [66 * flip, -230];
    crayonCol = C.yellow; crayonAng = flip > 0 ? -1.1 : -2.0;
  } else if (pose === 'hot') {
    bodyDy = 10; bodyTilt = -0.04 * flip; headTilt = 0.08 * flip;
    lHand = [-88, -192]; lElb = [-68, -160];
    rHand = [48, -254];  rElb = [72, -206];
  } else if (pose === 'ideaBlue') {
    bodyDy = -5; headTilt = -0.06 * flip;
    lHand = [-66 * flip, -142]; lElb = [-58 * flip, -168];
    rHand = [94 * flip, -230]; rElb = [70 * flip, -184];
    crayonCol = C.sky; crayonAng = flip > 0 ? -0.6 : -2.5;
  } else if (pose === 'cloudA') {
    bodyDy = -6; bodyTilt = -0.07 * flip; headTilt = -0.2 * flip;
    lHand = [-64 * flip, -148]; lElb = [-56 * flip, -172];
    rHand = [96 * flip, -296]; rElb = [70 * flip, -225];
    crayonCol = C.sky; crayonAng = flip > 0 ? -0.85 : -2.25;
  } else if (pose === 'cloudB') {
    bodyDy = -4; bodyTilt = -0.04 * flip; headTilt = -0.16 * flip;
    lHand = [-60 * flip, -140]; lElb = [-52 * flip, -168];
    rHand = [116 * flip, -278]; rElb = [82 * flip, -218];
    crayonCol = C.sky; crayonAng = flip > 0 ? -0.45 : -2.65;
  } else if (pose === 'rain') {
    bodyDy = -4; headTilt = -0.18 * flip;
    lHand = [-102, -214]; lElb = [-70, -180]; rHand = [104, -218]; rElb = [72, -182];
  } else if (pose === 'jumpA') {
    bodyDy = -48; bodyTilt = -0.04 * flip; headTilt = -0.12 * flip;
    lFoot = [-44, -36]; rFoot = [46, -42]; lKnee = [-36, -78]; rKnee = [38, -82];
    lHand = [-92, -310]; lElb = [-72, -242]; rHand = [96, -312]; rElb = [74, -244];
  } else if (pose === 'jumpB') {
    bodyDy = -16; bodyTilt = 0.04 * flip; headTilt = -0.04 * flip;
    lFoot = [-32, -4]; rFoot = [34, -4]; lKnee = [-34, -50]; rKnee = [36, -50];
    lHand = [-96, -246]; lElb = [-68, -206]; rHand = [98, -250]; rElb = [70, -208];
  }

  const L = (lx, ly) => {
    const cx = lx + bodyDx, cy = ly + bodyDy;
    const c = Math.cos(bodyTilt), s = Math.sin(bodyTilt);
    return [x + (cx * c - (cy + 140) * s) * sc, y + (cx * s + (cy + 140) * c - 140) * sc];
  };
  const P = (lx, ly) => [x + lx * sc, y + ly * sc];
  const isGirl = variant === 'girl';
  const topCol  = isGirl ? C.yellow : C.red;
  const legCol  = isGirl ? C.peach  : C.sky;
  const bootCol = isGirl ? C.red    : C.yellow;

  // Legs & boots
  const drawLeg = (hipL, kneeL, footL, sideSeed, bootDir) => {
    const legPts = curve([L(hipL[0], hipL[1]), P(kneeL[0], kneeL[1]), P(footL[0], footL[1] - 18)], 5);
    part(G, tube(legPts, 24 * sc, 21 * sc), { col: legCol, p: 0.82, gap: 8, w: 9, over: 4, seed: sideSeed, ang: 0.4 }, OL(C, 6, sideSeed + 1));
    const fx = x + footL[0] * sc, fy = y + footL[1] * sc, d = bootDir;
    const boot = smooth([
      [fx - 15 * d * sc, fy - 38 * sc], [fx + 14 * d * sc, fy - 38 * sc], [fx + 18 * d * sc, fy - 18 * sc],
      [fx + 36 * d * sc, fy - 10 * sc], [fx + 34 * d * sc, fy + 4 * sc], [fx - 18 * d * sc, fy + 4 * sc], [fx - 20 * d * sc, fy - 18 * sc]
    ], 5, true);
    part(G, boot, { col: bootCol, p: 0.88, gap: 7, w: 9, over: 4, seed: sideSeed + 2, ang: -0.3 }, OL(C, 6.5, sideSeed + 3));
    line(G.l, [[fx - 16 * d * sc, fy - 32 * sc], [fx + 14 * d * sc, fy - 32 * sc]], OL(C, 4.5, sideSeed + 4));
  };
  drawLeg([-24, -104], lKnee, lFoot, seed + 1, view === 'l34' ? -1 : -0.8);
  drawLeg([24, -104], rKnee, rFoot, seed + 7, view === 'l34' ? -1 : 1);

  const drawArm = (shL, elbL, handL, sideSeed, hasCrayon) => {
    const sh = L(shL[0], shL[1]), elb = L(elbL[0], elbL[1]), hnd = L(handL[0], handL[1]);
    part(G, tube(curve([sh, elb, hnd], 5), 27 * sc, 21 * sc), { col: topCol, p: 0.86, gap: 8, w: 9, over: 4, seed: sideSeed, ang: 0.7 }, OL(C, 6, sideSeed + 1));
    part(G, handCircle(hnd[0], hnd[1], 17 * sc, sideSeed + 2, 0.08, 22), { col: C.peach, p: 0.85, gap: 6, w: 8, over: 3, seed: sideSeed + 3 }, OL(C, 5.5, sideSeed + 4));
    if (hasCrayon && crayonCol) drawHeldCrayon(G, C, hnd[0], hnd[1], crayonAng, crayonCol, sc, sideSeed + 10);
  };
  drawArm([-46, -184], lElb, lHand, seed + 14, false);

  if (isGirl) {
    // Maya's sunny A-line pinafore dress with red pocket heart!
    const dress = smooth([
      L(-48, -196), L(0, -204), L(48, -196),
      L(68, -124), L(78, -86), L(0, -82), L(-78, -86), L(-68, -124)
    ], 6, true);
    part(G, dress, { col: C.yellow, p: 0.88, gap: 9, w: 10.5, over: 5, seed: seed + 20, ang: 0.5, cross: true, crossP: 0.45 }, OL(C, 7, seed + 21));
    // Cute coral sash + red bow dot
    line(G.f, [L(-58, -138), L(58, -138)], { col: C.pink, w: 14 * sc, p: 0.86, seed: seed + 22 });
    line(G.l, [L(-58, -138), L(58, -138)], OL(C, 4.5, seed + 23));
    dab(G.f, ...L(0, -138), 11 * sc, { col: C.red, p: 0.9, seed: seed + 24 });
  } else {
    // Leo's red jumper + sky-blue dungarees
    const jumper = smooth([L(-52, -196), L(0, -204), L(52, -196), L(60, -138), L(56, -102), L(0, -96), L(-56, -102), L(-60, -138)], 6, true);
    part(G, jumper, { col: C.red, p: 0.88, gap: 9, w: 10.5, over: 5, seed: seed + 20, ang: 0.55, cross: true, crossP: 0.45 }, OL(C, 7, seed + 21));
    const shorts = smooth([L(-52, -138), L(52, -138), L(56, -98), L(10, -94), L(0, -106), L(-10, -94), L(-56, -98)], 5, true);
    part(G, shorts, { col: C.sky, p: 0.84, gap: 8.5, w: 9.5, over: 4, seed: seed + 22, ang: -0.45 }, OL(C, 6.5, seed + 23));
    line(G.f, [L(-32, -194), L(-28, -136)], { col: C.sky, w: 13 * sc, p: 0.85, seed: seed + 24 });
    line(G.l, [L(-32, -194), L(-28, -136)], OL(C, 4.5, seed + 25));
    line(G.f, [L(32, -194), L(28, -136)], { col: C.sky, w: 13 * sc, p: 0.85, seed: seed + 26 });
    line(G.l, [L(32, -194), L(28, -136)], OL(C, 4.5, seed + 27));
    dab(G.f, ...L(-28, -136), 7 * sc, { col: C.yellow, p: 0.9, seed: seed + 28 });
    dab(G.f, ...L(28, -136), 7 * sc, { col: C.yellow, p: 0.9, seed: seed + 29 });
    line(G.l, smooth([L(-20, -130), L(20, -130), L(18, -108), L(0, -102), L(-18, -108)], 4, true), OL(C, 4.5, seed + 30));
  }

  drawArm([46, -184], rElb, rHand, seed + 32, true);

  // Head
  const hc = L(0, -276);
  const Hpt = (lx, ly) => {
    const c = Math.cos(headTilt), s = Math.sin(headTilt);
    return [hc[0] + (lx * c - ly * s) * sc, hc[1] + (lx * s + ly * c) * sc];
  };

  if (isGirl) {
    // Maya's adorable double hair buns behind ears!
    const bunL = handCircle(...Hpt(-72, -52), 28 * sc, seed + 45, 0.08, 22);
    const bunR = handCircle(...Hpt(72, -52), 28 * sc, seed + 46, 0.08, 22);
    part(G, bunL, { col: C.ink, p: 0.9, gap: 6, w: 8, over: 3, seed: seed + 47 }, OL(C, 6, seed + 48));
    part(G, bunR, { col: C.ink, p: 0.9, gap: 6, w: 8, over: 3, seed: seed + 49 }, OL(C, 6, seed + 50));
    dab(G.f, ...Hpt(-54, -44), 10 * sc, { col: C.red, p: 0.92, seed: seed + 43 });
    dab(G.f, ...Hpt(54, -44), 10 * sc, { col: C.red, p: 0.92, seed: seed + 44 });
  }

  part(G, handCircle(...Hpt(-72, 2), 14 * sc, seed + 49, 0.08, 16), { col: C.peach, p: 0.82, gap: 6, w: 7, over: 2, seed: seed + 51 }, OL(C, 5.5, seed + 52));
  part(G, handCircle(...Hpt(72, 2), 14 * sc, seed + 50, 0.08, 16), { col: C.peach, p: 0.82, gap: 6, w: 7, over: 2, seed: seed + 53 }, OL(C, 5.5, seed + 54));
  part(G, ellipse(0, 0, 74, 68, 36).map(([px, py]) => Hpt(px, py)), { col: C.peach, p: 0.78, gap: 9, w: 10, over: 4.5, seed: seed + 55, ang: 0.4 }, OL(C, 7, seed + 56));

  // Hair cap (outer crown edge ONLY — no headband line!)
  const hairOuter = isGirl
    ? smooth([Hpt(-74, 0), Hpt(-76, -46), Hpt(-48, -76), Hpt(0, -84), Hpt(48, -76), Hpt(76, -46), Hpt(74, 0), Hpt(52, -24), Hpt(24, -30), Hpt(0, -22), Hpt(-24, -30), Hpt(-52, -24)], 5, true)
    : smooth([Hpt(-72, -10), Hpt(-78, -44), Hpt(-54, -74), Hpt(-18, -84), Hpt(-6, -102), Hpt(14, -84), Hpt(34, -96), Hpt(48, -76), Hpt(74, -52), Hpt(74, -8), Hpt(58, -26), Hpt(34, -34), Hpt(12, -26), Hpt(-8, -36), Hpt(-34, -28), Hpt(-58, -24)], 5, true);
  erase(G.l, hairOuter); knock(G, hairOuter);
  fill(G.f, hairOuter, { col: C.ink, p: 0.9, gap: 7, w: 9, over: 3.5, seed: seed + 58, ang: 0.8, cross: true, crossP: 0.55 });
  const crownEdge = isGirl
    ? smooth([Hpt(-74, 0), Hpt(-76, -46), Hpt(-48, -76), Hpt(0, -84), Hpt(48, -76), Hpt(76, -46), Hpt(74, 0)], 5, false)
    : smooth([Hpt(-72, -10), Hpt(-78, -44), Hpt(-54, -74), Hpt(-18, -84), Hpt(-6, -102), Hpt(14, -84), Hpt(34, -96), Hpt(48, -76), Hpt(74, -52), Hpt(74, -8)], 5, false);
  line(G.l, crownEdge, OL(C, 6.5, seed + 59));

  // Face features
  const fx = faceShift / sc;
  const blushP = expr === 'hot' ? 0.92 : 0.65;
  const blushCol = expr === 'hot' ? C.red : C.pink;
  dab(G.f, ...Hpt(fx - 38, 18), (expr === 'hot' ? 20 : 15) * sc, { col: blushCol, p: blushP, sq: 0.72, seed: seed + 60 });
  dab(G.f, ...Hpt(fx + 38, 18), (expr === 'hot' ? 20 : 15) * sc, { col: blushCol, p: blushP, sq: 0.72, seed: seed + 61 });

  const eL = Hpt(fx - 22, -2), eR = Hpt(fx + 22, -2);
  if (expr === 'excited') {
    line(G.l, curve([Hpt(fx - 32, 0), Hpt(fx - 22, -12), Hpt(fx - 12, 0)], 5), OL(C, 6, seed + 62));
    line(G.l, curve([Hpt(fx + 12, 0), Hpt(fx + 22, -12), Hpt(fx + 32, 0)], 5), OL(C, 6, seed + 63));
  } else {
    const er = (expr === 'amazed' || expr === 'idea' ? 9.5 : 8) * sc;
    dab(G.l, eL[0], eL[1], er, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 62 });
    dab(G.l, eR[0], eR[1], er, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 63 });
    dab(G.l, eL[0] - 2.5 * sc, eL[1] - 3 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 64 });
    dab(G.l, eR[0] - 2.5 * sc, eR[1] - 3 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 65 });
  }
  if (expr === 'hot' || expr === 'uhoh') {
    line(G.l, [Hpt(fx - 33, -15), Hpt(fx - 13, -24)], OL(C, 4.8, seed + 66));
    line(G.l, [Hpt(fx + 13, -24), Hpt(fx + 33, -15)], OL(C, 4.8, seed + 67));
  } else if (expr === 'idea' || expr === 'amazed') {
    line(G.l, curve([Hpt(fx - 32, -20), Hpt(fx - 22, -28), Hpt(fx - 12, -21)], 4), OL(C, 4.5, seed + 66));
    line(G.l, curve([Hpt(fx + 12, -21), Hpt(fx + 22, -28), Hpt(fx + 32, -20)], 4), OL(C, 4.5, seed + 67));
  } else {
    line(G.l, curve([Hpt(fx - 30, -18), Hpt(fx - 22, -22), Hpt(fx - 14, -18)], 4), OL(C, 4.2, seed + 66));
    line(G.l, curve([Hpt(fx + 14, -18), Hpt(fx + 22, -22), Hpt(fx + 30, -18)], 4), OL(C, 4.2, seed + 67));
  }
  line(G.l, curve([Hpt(fx - 2, 8), Hpt(fx + 4 * flip, 12), Hpt(fx - 1, 15)], 4), OL(C, 4, seed + 68));

  if (expr === 'hot' || expr === 'uhoh') {
    line(G.l, curve([Hpt(fx - 16, 33), Hpt(fx - 6, 26), Hpt(fx + 6, 34), Hpt(fx + 16, 28)], 5), OL(C, 5.2, seed + 69));
    if (expr === 'hot') {
      const sd = smooth([Hpt(fx + 52, -22), Hpt(fx + 60, -8), Hpt(fx + 52, 0), Hpt(fx + 44, -8)], 4, true);
      part(G, sd, { col: C.sky, p: 0.85, gap: 4, w: 6, over: 1, seed: seed + 70 }, OL(C, 4, seed + 71));
    }
  } else if (expr === 'amazed') {
    part(G, ellipse(0, 0, 11, 13, 18).map(([px, py]) => Hpt(fx + px, 30 + py)), { col: C.pink, p: 0.78, gap: 4, w: 5, over: 1, seed: seed + 69 }, OL(C, 5, seed + 70));
  } else if (expr === 'curious') {
    line(G.l, curve([Hpt(fx - 10, 29), Hpt(fx, 32), Hpt(fx + 11, 27)], 4), OL(C, 5, seed + 69));
  } else if (expr === 'excited' || expr === 'idea') {
    const sm = smooth([Hpt(fx - 20, 24), Hpt(fx, 26), Hpt(fx + 20, 24), Hpt(fx + 14, 42), Hpt(fx, 46), Hpt(fx - 14, 42)], 4, true);
    part(G, sm, { col: C.pink, p: 0.82, gap: 4, w: 6, over: 1, seed: seed + 69 }, OL(C, 5.2, seed + 70));
  } else {
    line(G.l, curve([Hpt(fx - 18, 25), Hpt(fx, 38), Hpt(fx + 18, 25)], 5), OL(C, 5.4, seed + 69));
  }
}

// ——— NATURE & ENGLISH VOCABULARY PROPS ———
function drawSeed(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'sleep', drawP = o.draw ?? 1, fillP = o.fillP ?? 1, seed = o.seed ?? 120;
  if (drawP <= 0) return;
  const body = smooth([
    [x, y - 48 * sc], [x + 34 * sc, y - 16 * sc], [x + 40 * sc, y + 20 * sc], [x + 22 * sc, y + 42 * sc],
    [x, y + 46 * sc], [x - 22 * sc, y + 42 * sc], [x - 40 * sc, y + 20 * sc], [x - 34 * sc, y - 16 * sc]
  ], 6, true);
  knock(G, body);
  if (fillP > 0) {
    fill(G.f, body, { col: C.ochre, p: 0.86, gap: 7.5, w: 9.5, over: 4.5, seed: seed + 1, ang: 0.45, draw: fillP });
    if (fillP > 0.7) line(G.f, smooth([[x - 14 * sc, y - 24 * sc], [x - 20 * sc, y + 24 * sc]], 4, false), { col: C.yellow, w: 8 * sc, p: 0.45, seed: seed + 2 });
  }
  line(G.l, body, OL(C, 6.5, seed + 3, { draw: drawP, closed: true }));
  if (drawP < 0.85) return;
  dab(G.f, x - 21 * sc, y + 14 * sc, 9 * sc, { col: mood === 'hot' ? C.red : C.pink, p: 0.75, sq: 0.7, seed: seed + 4 });
  dab(G.f, x + 21 * sc, y + 14 * sc, 9 * sc, { col: mood === 'hot' ? C.red : C.pink, p: 0.75, sq: 0.7, seed: seed + 5 });
  if (mood === 'sleep') {
    line(G.l, curve([[x - 22 * sc, y + 2 * sc], [x - 14 * sc, y + 10 * sc], [x - 6 * sc, y + 2 * sc]], 4), OL(C, 5, seed + 6));
    line(G.l, curve([[x + 6 * sc, y + 2 * sc], [x + 14 * sc, y + 10 * sc], [x + 22 * sc, y + 2 * sc]], 4), OL(C, 5, seed + 7));
    line(G.l, curve([[x - 6 * sc, y + 20 * sc], [x, y + 24 * sc], [x + 6 * sc, y + 20 * sc]], 4), OL(C, 4, seed + 8));
  } else if (mood === 'hot') {
    line(G.l, [[x - 22 * sc, y - 2 * sc], [x - 9 * sc, y + 5 * sc], [x - 22 * sc, y + 11 * sc]], OL(C, 5, seed + 6));
    line(G.l, [[x + 22 * sc, y - 2 * sc], [x + 9 * sc, y + 5 * sc], [x + 22 * sc, y + 11 * sc]], OL(C, 5, seed + 7));
    line(G.l, curve([[x - 10 * sc, y + 24 * sc], [x, y + 18 * sc], [x + 10 * sc, y + 24 * sc]], 4), OL(C, 4.5, seed + 8));
    const blk = smooth([[x - 42 * sc, y - 6 * sc], [x - 26 * sc, y - 30 * sc], [x, y - 34 * sc], [x + 26 * sc, y - 30 * sc], [x + 42 * sc, y - 6 * sc], [x + 18 * sc, y - 14 * sc], [x - 18 * sc, y - 14 * sc]], 4, true);
    part(G, blk, { col: C.ochre, p: 0.72, gap: 6, w: 7, over: 2, seed: seed + 9 }, OL(C, 5, seed + 10));
  } else {
    dab(G.l, x - 14 * sc, y + 2 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 6 });
    dab(G.l, x + 14 * sc, y + 2 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 7 });
    dab(G.l, x - 16 * sc, y - 0.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 8 });
    dab(G.l, x + 12 * sc, y - 0.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 9 });
    line(G.l, curve([[x - 13 * sc, y + 18 * sc], [x, y + 29 * sc], [x + 13 * sc, y + 18 * sc]], 5), OL(C, 5, seed + 10));
  }
  const sp = o.sproutP ?? (mood === 'sprout' ? 1 : 0);
  if (sp > 0) {
    const stemH = 66 * sc * sp;
    const stem = curve([[x, y - 42 * sc], [x - 6 * sc, y - 42 * sc - stemH * 0.5], [x + 3 * sc, y - 42 * sc - stemH]], 5);
    line(G.l, stem, { col: C.green, w: 10 * sc, p: 0.92, seed: seed + 15 });
    line(G.l, stem, OL(C, 4.5, seed + 16));
    if (sp > 0.45) {
      const lp = clamp((sp - 0.45) / 0.55), top = [x + 3 * sc, y - 42 * sc - stemH];
      part(G, smooth([top, [top[0] - 28 * lp * sc, top[1] - 22 * lp * sc], [top[0] - 34 * lp * sc, top[1] + 2 * lp * sc], [top[0] - 8 * lp * sc, top[1] + 6 * lp * sc]], 4, true), { col: C.green, p: 0.88, gap: 6, w: 7, over: 2, seed: seed + 17 }, OL(C, 4.5, seed + 18));
      part(G, smooth([top, [top[0] + 28 * lp * sc, top[1] - 24 * lp * sc], [top[0] + 34 * lp * sc, top[1] + 2 * lp * sc], [top[0] + 8 * lp * sc, top[1] + 6 * lp * sc]], 4, true), { col: C.green, p: 0.88, gap: 6, w: 7, over: 2, seed: seed + 19 }, OL(C, 4.5, seed + 20));
    }
  }
}

function drawSun(G, C, x, y, o) {
  const sc = o.sc ?? 1, drawP = o.draw ?? 1, fillP = o.fillP ?? 1, heat = o.heat ?? (o.mood === 'blaze' ? 1 : 0), seed = o.seed ?? 200, rot = o.rot ?? 0;
  if (drawP <= 0) return;
  const R = 104 * sc, nRays = 12;
  for (let i = 0; i < nRays; i++) {
    const a = rot + (i / nRays) * Math.PI * 2;
    const r0 = R + 16 * sc, r1 = R + (56 + (i % 2) * 24 + heat * 42) * sc;
    const rp = clamp((drawP - 0.35 - (i / nRays) * 0.45) / 0.2);
    if (rp <= 0) continue;
    const col = heat > 0.45 && i % 2 === 0 ? C.red : C.yellow;
    const pts = curve([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a + 0.08 * Math.sin(i * 3)) * ((r0 + r1) * 0.5), y + Math.sin(a + 0.08 * Math.sin(i * 3)) * ((r0 + r1) * 0.5)], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], 4);
    line(G.f, pts, { col, w: (13 + heat * 5) * sc, p: 0.85, seed: seed + i * 3, draw: rp });
    line(G.l, pts, OL(C, 5.5, seed + i * 3 + 1, { draw: rp }));
  }
  const disc = handCircle(x, y, R, seed + 50, 0.1, 44);
  knock(G, disc);
  if (fillP > 0) {
    fill(G.f, disc, { col: C.yellow, p: 0.88, gap: 10, w: 12, over: 7, seed: seed + 51, ang: 0.52, draw: fillP, cross: true, crossP: 0.5 + heat * 0.3 });
    if (heat > 0.25) fill(G.f, handCircle(x, y, R * 0.88, seed + 52, 0.05, 32), { col: C.red, p: 0.32 * heat, gap: 14, w: 10, over: 3, seed: seed + 53, ang: -0.6, draw: heat });
  }
  line(G.l, disc, OL(C, 7, seed + 54, { draw: clamp(drawP / 0.55) }));
  if (drawP < 0.65) return;
  dab(G.f, x - 44 * sc, y + 18 * sc, (18 + heat * 8) * sc, { col: heat > 0.4 ? C.red : C.pink, p: 0.72 + heat * 0.2, sq: 0.75, seed: seed + 55 });
  dab(G.f, x + 44 * sc, y + 18 * sc, (18 + heat * 8) * sc, { col: heat > 0.4 ? C.red : C.pink, p: 0.72 + heat * 0.2, sq: 0.75, seed: seed + 56 });
  dab(G.l, x - 28 * sc, y - 10 * sc, 13 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 57 });
  dab(G.l, x + 28 * sc, y - 10 * sc, 13 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 58 });
  dab(G.l, x - 32 * sc, y - 14 * sc, 4.5 * sc, { col: C.white, p: 0.98, gap: 2, w: 3.5, over: 0, seed: seed + 59 });
  dab(G.l, x + 24 * sc, y - 14 * sc, 4.5 * sc, { col: C.white, p: 0.98, gap: 2, w: 3.5, over: 0, seed: seed + 60 });
  line(G.l, curve([[x - 42 * sc, y - 26 * sc], [x - 28 * sc, y - 34 * sc], [x - 14 * sc, y - 26 * sc]], 4), OL(C, 5, seed + 61));
  line(G.l, curve([[x + 14 * sc, y - 26 * sc], [x + 28 * sc, y - 34 * sc], [x + 42 * sc, y - 26 * sc]], 4), OL(C, 5, seed + 62));
  if (heat > 0.45) {
    part(G, smooth([[x - 28 * sc, y + 18 * sc], [x, y + 22 * sc], [x + 28 * sc, y + 18 * sc], [x + 20 * sc, y + 48 * sc], [x, y + 54 * sc], [x - 20 * sc, y + 48 * sc]], 4, true), { col: C.red, p: 0.8, gap: 5, w: 6, over: 1, seed: seed + 63 }, OL(C, 5.5, seed + 64));
  } else {
    line(G.l, curve([[x - 28 * sc, y + 22 * sc], [x, y + 42 * sc], [x + 28 * sc, y + 22 * sc]], 5), OL(C, 6, seed + 63));
  }
}

function drawCloud(G, C, x, y, o) {
  const sc = o.sc ?? 1, drawP = o.draw ?? 1, fillP = o.fillP ?? 1, mood = o.mood || 'happy', seed = o.seed ?? 300;
  if (drawP <= 0) return;
  const poly = smooth([
    [-168, 30], [-186, -8], [-152, -52], [-102, -58], [-64, -104], [8, -112], [68, -94],
    [118, -60], [174, -46], [190, 4], [156, 46], [88, 56], [10, 52], [-74, 58], [-142, 48]
  ].map(([px, py]) => [x + px * sc, y + py * sc]), 5, true);
  knock(G, poly);
  if (fillP > 0) {
    fill(G.f, poly, { col: C.sky, p: 0.86, gap: 11, w: 13, over: 7, seed: seed + 1, ang: 0.25, draw: fillP, cross: true, crossP: 0.45 });
    const belly = smooth([[x - 150 * sc, y + 6 * sc], [x - 40 * sc, y + 12 * sc], [x + 70 * sc, y + 8 * sc], [x + 162 * sc, y + 8 * sc], [x + 148 * sc, y + 44 * sc], [x + 80 * sc, y + 54 * sc], [x - 70 * sc, y + 56 * sc], [x - 138 * sc, y + 44 * sc]], 4, true);
    fill(G.f, belly, { col: C.rain, p: 0.72, gap: 10, w: 11, over: 4, seed: seed + 2, ang: -0.15, draw: clamp((fillP - 0.35) / 0.65) });
  }
  line(G.l, poly, OL(C, 7.5, seed + 3, { draw: drawP, closed: true }));
  if (drawP < 0.8) return;
  const chR = (mood === 'puff' ? 24 : 16) * sc;
  dab(G.f, x - 56 * sc, y + 8 * sc, chR, { col: C.pink, p: 0.72, sq: 0.8, seed: seed + 4 });
  dab(G.f, x + 56 * sc, y + 8 * sc, chR, { col: C.pink, p: 0.72, sq: 0.8, seed: seed + 5 });
  if (mood === 'wink') {
    line(G.l, curve([[x - 46 * sc, y - 14 * sc], [x - 32 * sc, y - 24 * sc], [x - 18 * sc, y - 14 * sc]], 4), OL(C, 6, seed + 6));
  } else {
    dab(G.l, x - 32 * sc, y - 16 * sc, 12 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 6 });
    dab(G.l, x - 36 * sc, y - 20 * sc, 4 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 7 });
  }
  dab(G.l, x + 32 * sc, y - 16 * sc, 12 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 8 });
  dab(G.l, x + 28 * sc, y - 20 * sc, 4 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 9 });
  if (mood === 'puff') {
    part(G, ellipse(x, y + 12 * sc, 10 * sc, 10 * sc, 16), { col: C.pink, p: 0.8, gap: 4, w: 5, over: 0, seed: seed + 10 }, OL(C, 5, seed + 11));
    line(G.l, curve([[x - 38 * sc, y - 2 * sc], [x - 48 * sc, y + 10 * sc], [x - 36 * sc, y + 22 * sc]], 4), OL(C, 4.5, seed + 12));
    line(G.l, curve([[x + 38 * sc, y - 2 * sc], [x + 48 * sc, y + 10 * sc], [x + 36 * sc, y + 22 * sc]], 4), OL(C, 4.5, seed + 13));
  } else {
    line(G.l, curve([[x - 24 * sc, y + 10 * sc], [x, y + 26 * sc], [x + 24 * sc, y + 10 * sc]], 5), OL(C, 5.5, seed + 10));
  }
}

function drawFlower(G, C, x, y, o) {
  const sc = o.sc ?? 1, stemP = clamp(o.stemP ?? 1), leafP = clamp(o.leafP ?? 1), petalP = clamp(o.petalP ?? 1), sway = o.sway ?? 0, seed = o.seed ?? 400;
  const rootY = o.rootY ?? (y + 8 * sc);
  if (stemP <= 0) return;
  const H = 435 * sc, topX = x + (16 + sway * 18) * sc, topY = y - H;
  const stemPts = curve([[x, rootY], [x - 4 * sc, (rootY + y) * 0.5], [x, y], [x - 24 * sc + sway * 5 * sc, y - H * 0.34], [x + 26 * sc + sway * 12 * sc, y - H * 0.68], [topX, topY]], 8);
  const visStem = stemPts.slice(0, Math.max(2, Math.floor(stemPts.length * stemP)));
  part(G, tube(visStem, 18 * sc, 13 * sc), { col: C.green, p: 0.9, gap: 6, w: 8, over: 3, seed: seed + 1, ang: 0.2 }, OL(C, 6, seed + 2));

  if (leafP > 0 && stemP > 0.48) {
    const p1 = stemPts[Math.floor(stemPts.length * 0.56)], lp1 = clamp(leafP / 0.7);
    part(G, smooth([p1, [p1[0] - 58 * lp1 * sc, p1[1] - 48 * lp1 * sc], [p1[0] - 118 * lp1 * sc, p1[1] - 16 * lp1 * sc], [p1[0] - 64 * lp1 * sc, p1[1] + 22 * lp1 * sc]], 5, true), { col: C.green, p: 0.88, gap: 8, w: 10, over: 4, seed: seed + 5, ang: 0.7 }, OL(C, 6, seed + 6));
    line(G.l, [p1, [p1[0] - 84 * lp1 * sc, p1[1] - 16 * lp1 * sc]], OL(C, 4, seed + 7));
  }
  if (leafP > 0.25 && stemP > 0.72) {
    const p2 = stemPts[Math.floor(stemPts.length * 0.76)], lp2 = clamp((leafP - 0.25) / 0.75);
    part(G, smooth([p2, [p2[0] + 62 * lp2 * sc, p2[1] - 52 * lp2 * sc], [p2[0] + 124 * lp2 * sc, p2[1] - 14 * lp2 * sc], [p2[0] + 68 * lp2 * sc, p2[1] + 24 * lp2 * sc]], 5, true), { col: C.green, p: 0.88, gap: 8, w: 10, over: 4, seed: seed + 8, ang: -0.7 }, OL(C, 6, seed + 9));
    line(G.l, [p2, [p2[0] + 88 * lp2 * sc, p2[1] - 14 * lp2 * sc]], OL(C, 4, seed + 10));
  }
  if (petalP > 0 && stemP >= 0.96) {
    const cx = topX, cy = topY - 12 * sc;
    for (let i = 0; i < 7; i++) {
      const pp = clamp((petalP - i * 0.06) / 0.58);
      if (pp <= 0) continue;
      const a = -Math.PI / 2 + (i / 7) * Math.PI * 2 + sway * 0.08;
      const pr = 78 * pp * sc, px = cx + Math.cos(a) * (62 * pp * sc), py = cy + Math.sin(a) * (62 * pp * sc);
      part(G, ellipse(px, py, pr * 0.66, pr * 0.52, 22, 0, Math.PI * 2, a), { col: C.red, p: 0.9, gap: 8.5, w: 10.5, over: 5, seed: seed + 20 + i * 3, ang: a + 0.4, cross: true, crossP: 0.45 }, OL(C, 6.5, seed + 21 + i * 3));
    }
    part(G, handCircle(cx, cy, 56 * clamp(petalP / 0.65) * sc, seed + 60, 0.1, 34), { col: C.yellow, p: 0.92, gap: 8, w: 10, over: 4, seed: seed + 61, ang: 0.5 }, OL(C, 6.5, seed + 62));
    if (petalP > 0.55) {
      dab(G.f, cx - 26 * sc, cy + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, sq: 0.75, seed: seed + 63 });
      dab(G.f, cx + 26 * sc, cy + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, sq: 0.75, seed: seed + 64 });
      dab(G.l, cx - 16 * sc, cy - 6 * sc, 8 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 65 });
      dab(G.l, cx + 16 * sc, cy - 6 * sc, 8 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 66 });
      dab(G.l, cx - 18.5 * sc, cy - 8.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 67 });
      dab(G.l, cx + 13.5 * sc, cy - 8.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 68 });
      line(G.l, curve([[cx - 16 * sc, cy + 12 * sc], [cx, cy + 25 * sc], [cx + 16 * sc, cy + 12 * sc]], 5), OL(C, 5.2, seed + 69));
    }
  }
}

function drawTree(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'apples', seed = o.seed ?? 500;
  const trunk = smooth([[x - 28 * sc, y], [x - 22 * sc, y - 165 * sc], [x + 22 * sc, y - 165 * sc], [x + 30 * sc, y]], 5, true);
  part(G, trunk, { col: C.ochre, p: 0.86, gap: 8, w: 10, over: 4, seed: seed + 1, ang: 1.45 }, OL(C, 6.5, seed + 2));
  const canopy = smooth([
    [x - 135 * sc, y - 195 * sc], [x - 148 * sc, y - 280 * sc], [x - 86 * sc, y - 360 * sc],
    [x, y - 385 * sc], [x + 92 * sc, y - 355 * sc], [x + 150 * sc, y - 275 * sc],
    [x + 132 * sc, y - 190 * sc], [x + 48 * sc, y - 162 * sc], [x - 52 * sc, y - 162 * sc]
  ], 5, true);
  part(G, canopy, { col: C.green, p: 0.88, gap: 11, w: 13, over: 7, seed: seed + 3, ang: 0.5, cross: true, crossP: 0.45 }, OL(C, 7, seed + 4));
  if (mood === 'apples' || mood === 'blossom') {
    const col = mood === 'apples' ? C.red : C.pink;
    [[-65, -245], [22, -305], [75, -235], [-18, -215], [-82, -300]].forEach(([dx, dy], i) => {
      part(G, handCircle(x + dx * sc, y + dy * sc, 18 * sc, seed + 10 + i, 0.08, 18), { col, p: 0.92, gap: 5, w: 7, over: 2, seed: seed + 20 + i }, OL(C, 4, seed + 30 + i));
    });
  }
}

function drawBird(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'perch', t = o.t ?? 0, seed = o.seed ?? 540;
  const flap = mood === 'fly' ? Math.sin(Math.floor(t * 12) * 1.4) * 32 : 0;
  const body = smooth([[x - 54 * sc, y], [x - 24 * sc, y - 42 * sc], [x + 36 * sc, y - 34 * sc], [x + 62 * sc, y - 6 * sc], [x + 28 * sc, y + 26 * sc], [x - 36 * sc, y + 24 * sc]], 5, true);
  part(G, body, { col: C.sky, p: 0.88, gap: 8, w: 9.5, over: 4, seed: seed + 1 }, OL(C, 6, seed + 2));
  // Wing
  const wing = smooth([[x - 16 * sc, y - 4 * sc], [x + 18 * sc, y - (28 + flap) * sc], [x + 36 * sc, y + (4 - flap * 0.4) * sc], [x - 8 * sc, y + 12 * sc]], 4, true);
  part(G, wing, { col: C.rain, p: 0.84, gap: 6, w: 8, over: 2, seed: seed + 3 }, OL(C, 5, seed + 4));
  // Yellow beak
  const beak = [[x - 50 * sc, y - 14 * sc], [x - 78 * sc, y - 6 * sc], [x - 48 * sc, y + 2 * sc]];
  part(G, beak, { col: C.yellow, p: 0.92, gap: 4, w: 6, over: 1, seed: seed + 5 }, OL(C, 4.5, seed + 6));
  dab(G.f, x - 20 * sc, y + 2 * sc, 9 * sc, { col: C.pink, p: 0.72, seed: seed + 7 });
  dab(G.l, x - 30 * sc, y - 14 * sc, 7 * sc, { col: C.ink, p: 0.96, gap: 2, w: 4, over: 0, seed: seed + 8 });
  dab(G.l, x - 32 * sc, y - 16 * sc, 2.5 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 2.5, over: 0, seed: seed + 9 });
  if (mood === 'perch') {
    line(G.l, [[x - 8 * sc, y + 24 * sc], [x - 10 * sc, y + 44 * sc]], OL(C, 4.5, seed + 10));
    line(G.l, [[x + 12 * sc, y + 24 * sc], [x + 14 * sc, y + 44 * sc]], OL(C, 4.5, seed + 11));
  }
}

function drawApple(G, C, x, y, o) {
  const sc = o.sc ?? 1, seed = o.seed ?? 570;
  const poly = smooth([[x, y - 56 * sc], [x + 48 * sc, y - 64 * sc], [x + 68 * sc, y - 8 * sc], [x + 42 * sc, y + 54 * sc], [x, y + 48 * sc], [x - 42 * sc, y + 54 * sc], [x - 68 * sc, y - 8 * sc], [x - 48 * sc, y - 64 * sc]], 5, true);
  part(G, poly, { col: C.red, p: 0.9, gap: 9, w: 11, over: 5, seed: seed + 1, cross: true, crossP: 0.45 }, OL(C, 6.5, seed + 2));
  line(G.l, curve([[x, y - 54 * sc], [x + 4 * sc, y - 84 * sc], [x + 14 * sc, y - 92 * sc]], 4), OL(C, 6, seed + 3));
  const leaf = smooth([[x + 6 * sc, y - 76 * sc], [x + 44 * sc, y - 98 * sc], [x + 56 * sc, y - 68 * sc], [x + 18 * sc, y - 64 * sc]], 4, true);
  part(G, leaf, { col: C.green, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 4 }, OL(C, 4.5, seed + 5));
  dab(G.f, x - 28 * sc, y + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, seed: seed + 6 });
  dab(G.f, x + 28 * sc, y + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, seed: seed + 7 });
  dab(G.l, x - 18 * sc, y - 8 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 8 });
  dab(G.l, x + 18 * sc, y - 8 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 9 });
  dab(G.l, x - 20 * sc, y - 10 * sc, 2.8 * sc, { col: C.white, p: 0.98, gap: 2, w: 2.5, over: 0, seed: seed + 10 });
  dab(G.l, x + 16 * sc, y - 10 * sc, 2.8 * sc, { col: C.white, p: 0.98, gap: 2, w: 2.5, over: 0, seed: seed + 11 });
  line(G.l, curve([[x - 16 * sc, y + 14 * sc], [x, y + 26 * sc], [x + 16 * sc, y + 14 * sc]], 5), OL(C, 5, seed + 12));
}

function drawHouse(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'day', seed = o.seed ?? 600;
  // Child-logic perspective: gable front + slanted side wall!
  const front = [[x - 140 * sc, y], [x - 140 * sc, y - 190 * sc], [x, y - 310 * sc], [x + 130 * sc, y - 190 * sc], [x + 130 * sc, y]];
  part(G, front, { col: C.peach, p: 0.84, gap: 11, w: 12, over: 5, seed: seed + 1 }, OL(C, 7.5, seed + 2));
  const side = [[x + 130 * sc, y], [x + 130 * sc, y - 190 * sc], [x + 215 * sc, y - 170 * sc], [x + 210 * sc, y - 14 * sc]];
  part(G, side, { col: C.ochre, p: 0.72, gap: 10, w: 11, over: 4, seed: seed + 3 }, OL(C, 7, seed + 4));
  const roof = [[x - 168 * sc, y - 182 * sc], [x, y - 332 * sc], [x + 158 * sc, y - 184 * sc], [x + 225 * sc, y - 168 * sc], [x + 82 * sc, y - 306 * sc], [x, y - 332 * sc]];
  part(G, roof, { col: C.red, p: 0.9, gap: 10, w: 12, over: 5, seed: seed + 5, cross: true, crossP: 0.45 }, OL(C, 7.5, seed + 6));
  const door = smooth([[x - 40 * sc, y], [x - 38 * sc, y - 102 * sc], [x, y - 114 * sc], [x + 38 * sc, y - 102 * sc], [x + 40 * sc, y]], 4, true);
  part(G, door, { col: C.ochre, p: 0.88, gap: 8, w: 9, over: 3, seed: seed + 7 }, OL(C, 6, seed + 8));
  const win = handCircle(x, y - 208 * sc, 34 * sc, seed + 9, 0.08, 24);
  part(G, win, { col: mood === 'lit' ? C.yellow : C.sky, p: 0.88, gap: 7, w: 9, over: 2, seed: seed + 10 }, OL(C, 5.5, seed + 11));
  line(G.l, [[x - 32 * sc, y - 208 * sc], [x + 32 * sc, y - 208 * sc]], OL(C, 4.5, seed + 12));
  line(G.l, [[x, y - 240 * sc], [x, y - 176 * sc]], OL(C, 4.5, seed + 13));
}

function drawRainbow(G, C, x, y, o) {
  const sc = o.sc ?? 1, drawP = o.draw ?? 1, seed = o.seed ?? 640;
  if (drawP <= 0) return;
  const cols = [C.red, C.yellow, C.green, C.sky];
  cols.forEach((col, i) => {
    const r = (255 - i * 32) * sc;
    const pts = [];
    for (let k = 0; k <= 28; k++) {
      const a = Math.PI + (k / 28) * Math.PI;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.82]);
    }
    line(G.f, pts, { col, w: 26 * sc, p: 0.84, seed: seed + i * 3, draw: drawP, streak: 2 });
    line(G.l, pts, OL(C, 3.5, seed + i * 3 + 1, { draw: drawP, p: 0.45 }));
  });
}

function drawStar(G, C, x, y, o) {
  const sc = o.sc ?? 1, seed = o.seed ?? 670;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = (i % 2 === 0 ? 84 : 40) * sc;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  part(G, pts, { col: C.yellow, p: 0.9, gap: 8, w: 10, over: 4, seed: seed + 1, cross: true, crossP: 0.45 }, OL(C, 6, seed + 2));
  dab(G.l, x - 16 * sc, y - 4 * sc, 6.5 * sc, { col: C.ink, p: 0.96, gap: 2, w: 4, over: 0, seed: seed + 3 });
  dab(G.l, x + 16 * sc, y - 4 * sc, 6.5 * sc, { col: C.ink, p: 0.96, gap: 2, w: 4, over: 0, seed: seed + 4 });
  dab(G.l, x - 18 * sc, y - 6 * sc, 2.5 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 2.5, over: 0, seed: seed + 5 });
  dab(G.l, x + 14 * sc, y - 6 * sc, 2.5 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 2.5, over: 0, seed: seed + 6 });
  line(G.l, curve([[x - 12 * sc, y + 12 * sc], [x, y + 22 * sc], [x + 12 * sc, y + 12 * sc]], 4), OL(C, 4.5, seed + 7));
}

function drawWateringCan(G, C, x, y, o) {
  const sc = o.sc ?? 1, seed = o.seed ?? 700;
  const body = [[x - 44 * sc, y - 76 * sc], [x + 42 * sc, y - 76 * sc], [x + 48 * sc, y], [x - 48 * sc, y]];
  part(G, body, { col: C.sky, p: 0.84, gap: 8, w: 10, over: 4, seed: seed + 1, ang: 0.4 }, OL(C, 6, seed + 2));
  line(G.f, [[x + 44 * sc, y - 24 * sc], [x + 98 * sc, y - 68 * sc]], { col: C.sky, w: 12 * sc, p: 0.85, seed: seed + 3 });
  line(G.l, [[x + 44 * sc, y - 24 * sc], [x + 98 * sc, y - 68 * sc]], OL(C, 5.5, seed + 4));
  part(G, ellipse(x + 104 * sc, y - 72 * sc, 12 * sc, 18 * sc, 14, 0, Math.PI * 2, 0.7), { col: C.yellow, p: 0.88, gap: 5, w: 6, over: 1, seed: seed + 5 }, OL(C, 4.5, seed + 6));
  line(G.l, curve([[x - 42 * sc, y - 64 * sc], [x - 84 * sc, y - 64 * sc], [x - 80 * sc, y - 16 * sc], [x - 44 * sc, y - 16 * sc]], 5), OL(C, 6, seed + 7));
}

function drawFence(G, C, x, y, o) {
  const sc = o.sc ?? 1, seed = o.seed ?? 720;
  for (let i = 0; i < 5; i++) {
    const fx = x + (i - 2) * 112 * sc, lean = (hash(i * 3.7 + seed) - 0.5) * 12 * sc;
    const post = [[fx - 16 * sc, y], [fx - 18 * sc + lean, y - 132 * sc], [fx + lean, y - 156 * sc], [fx + 18 * sc + lean, y - 132 * sc], [fx + 16 * sc, y]];
    part(G, post, { col: C.ochre, p: 0.76, gap: 9, w: 10, over: 4, seed: seed + i * 2, ang: 0.9 }, OL(C, 6, seed + i * 2 + 1));
  }
  line(G.l, [[x - 250 * sc, y - 95 * sc], [x + 255 * sc, y - 100 * sc]], OL(C, 7, seed + 20));
  line(G.l, [[x - 248 * sc, y - 40 * sc], [x + 252 * sc, y - 44 * sc]], OL(C, 7, seed + 21));
}

function drawBush(G, C, x, y, o) {
  const sc = o.sc ?? 1, seed = o.seed ?? 750, t = o.t ?? 0;
  const shake = o.mood === 'rustle' ? Math.sin(Math.floor(t * 12) * 2.4) * 14 * sc : 0;
  const bx = x + shake;
  const poly = smooth([[bx - 150 * sc, y], [bx - 135 * sc, y - 82 * sc], [bx - 65 * sc, y - 106 * sc], [bx, y - 90 * sc], [bx + 55 * sc, y - 110 * sc], [bx + 130 * sc, y - 78 * sc], [bx + 150 * sc, y]], 5, true);
  part(G, poly, { col: C.green, p: 0.84, gap: 10, w: 12, over: 6, seed: seed + 1 }, OL(C, 6.5, seed + 2));
  [[-85, -56, C.yellow], [10, -66, C.pink], [85, -48, C.yellow]].forEach(([dx, dy, bc], i) => {
    dab(G.f, bx + dx * sc, y + dy * sc, 14 * sc, { col: bc, p: 0.9, seed: seed + 10 + i });
  });
}

// ——— SMALL HELD RED APPLE HELPER (for Dog, Cat & Wolf poses) ———
function drawMiniApple(G, C, ax, ay, sc, seed, bitten = false) {
  const r = 24 * sc;
  const poly = smooth([
    [ax, ay - r * 0.82], [ax + r * 0.72, ay - r * 0.94], [ax + r * 1.02, ay - r * 0.12],
    [ax + r * 0.68, ay + r * 0.85], [ax, ay + r * 0.72], [ax - r * 0.68, ay + r * 0.85],
    [ax - r * 1.02, ay - r * 0.12], [ax - r * 0.72, ay - r * 0.94]
  ], 4, true);
  part(G, poly, { col: C.red, p: 0.92, gap: 5.5, w: 7, over: 3, seed: seed + 1, cross: true, crossP: 0.4 }, OL(C, 4.5, seed + 2));
  if (bitten) {
    // Cream-white crunchy bite mark on the right side!
    const bite = smooth([
      [ax + r * 0.42, ay - r * 0.54], [ax + r * 1.06, ay - r * 0.46],
      [ax + r * 1.12, ay + r * 0.28], [ax + r * 0.45, ay + r * 0.46],
      [ax + r * 0.22, ay + r * 0.12], [ax + r * 0.34, ay - r * 0.18]
    ], 3, true);
    part(G, bite, { col: C.white, p: 0.96, gap: 4, w: 6, over: 1, seed: seed + 3 }, OL(C, 3.8, seed + 4));
  }
  line(G.l, curve([[ax, ay - r * 0.78], [ax + 2 * sc, ay - r * 1.24], [ax + 8 * sc, ay - r * 1.34]], 3), OL(C, 4, seed + 5));
  const leaf = smooth([[ax + 3 * sc, ay - r * 1.05], [ax + 20 * sc, ay - r * 1.42], [ax + 26 * sc, ay - r * 0.96], [ax + 9 * sc, ay - r * 0.9]], 3, true);
  part(G, leaf, { col: C.green, p: 0.92, gap: 4, w: 5.5, over: 1, seed: seed + 6 }, OL(C, 3.4, seed + 7));
}

// ——— STORYBOOK BIG OAK TREE & APPLE BASKET ———
function drawBigTree(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'apples', t = o.t ?? 0, seed = o.seed ?? 780;
  const rustle = mood === 'rustle' ? Math.sin(Math.floor(t * 12) * 2.3) * 14 * sc : 0;
  const trunk = smooth([
    [x - 76 * sc, y + 8 * sc], [x - 52 * sc, y - 48 * sc], [x - 46 * sc, y - 320 * sc],
    [x - 78 * sc, y - 395 * sc], [x - 36 * sc, y - 375 * sc], [x + 36 * sc, y - 375 * sc],
    [x + 76 * sc, y - 395 * sc], [x + 48 * sc, y - 320 * sc], [x + 54 * sc, y - 48 * sc],
    [x + 82 * sc, y + 8 * sc], [x + 28 * sc, y - 6 * sc], [x - 24 * sc, y - 4 * sc]
  ], 5, true);
  part(G, trunk, { col: C.ochre, p: 0.88, gap: 10, w: 12, over: 5, seed: seed + 1, ang: 1.48, cross: true, crossP: 0.35 }, OL(C, 7.5, seed + 2));
  // Bark grain strokes
  line(G.l, curve([[x - 20 * sc, y - 46 * sc], [x - 16 * sc, y - 165 * sc], [x - 24 * sc, y - 285 * sc]], 5), OL(C, 4, seed + 3, { p: 0.58 }));
  line(G.l, curve([[x + 18 * sc, y - 65 * sc], [x + 14 * sc, y - 195 * sc], [x + 20 * sc, y - 300 * sc]], 5), OL(C, 4, seed + 4, { p: 0.55 }));

  const cx = x + rustle;
  // Fluffy multi-lobed storybook oak canopy (instead of a single flat dome)
  const canopy = smooth([
    [cx - 210 * sc, y - 325 * sc], [cx - 262 * sc, y - 385 * sc], [cx - 238 * sc, y - 462 * sc],
    [cx - 196 * sc, y - 498 * sc], [cx - 174 * sc, y - 562 * sc], [cx - 102 * sc, y - 588 * sc],
    [cx - 58 * sc,  y - 575 * sc], [cx,            y - 632 * sc], [cx + 68 * sc,  y - 595 * sc],
    [cx + 104 * sc, y - 580 * sc], [cx + 186 * sc, y - 560 * sc], [cx + 215 * sc, y - 492 * sc],
    [cx + 258 * sc, y - 442 * sc], [cx + 245 * sc, y - 365 * sc], [cx + 190 * sc, y - 320 * sc],
    [cx + 122 * sc, y - 302 * sc], [cx + 68 * sc,  y - 322 * sc], [cx,            y - 304 * sc],
    [cx - 68 * sc,  y - 322 * sc], [cx - 128 * sc, y - 300 * sc]
  ], 4, true);
  part(G, canopy, { col: C.green, p: 0.90, gap: 11, w: 13.5, over: 7, seed: seed + 6, ang: 0.42, cross: true, crossP: 0.48 }, OL(C, 7.5, seed + 7));
  // Subtle inner leaf cluster arcs
  line(G.l, curve([[cx - 110 * sc, y - 440 * sc], [cx - 65 * sc, y - 472 * sc], [cx - 18 * sc, y - 442 * sc]], 4), OL(C, 4, seed + 8, { p: 0.48 }));
  line(G.l, curve([[cx + 38 * sc, y - 490 * sc], [cx + 88 * sc, y - 518 * sc], [cx + 132 * sc, y - 486 * sc]], 4), OL(C, 4, seed + 9, { p: 0.48 }));

  if (mood === 'apples') {
    [[-135, -425], [-55, -515], [48, -460], [142, -415], [-22, -370], [105, -525]].forEach(([dx, dy], i) => {
      part(G, handCircle(cx + dx * sc, y + dy * sc, 21 * sc, seed + 15 + i, 0.08, 18), { col: C.red, p: 0.92, gap: 5.5, w: 7.5, over: 2.5, seed: seed + 25 + i }, OL(C, 4.2, seed + 35 + i));
    });
  }
}

function drawAppleBasket(G, C, x, y, o) {
  const sc = o.sc ?? 1, mood = o.mood || 'full', seed = o.seed ?? 810;
  // Back handle arch
  line(G.l, curve([[x - 58 * sc, y - 64 * sc], [x - 42 * sc, y - 122 * sc], [x, y - 134 * sc], [x + 42 * sc, y - 122 * sc], [x + 58 * sc, y - 64 * sc]], 6), OL(C, 8, seed + 1));
  // Apples nestled inside rim
  const apples = mood === 'half' ? [[-24, -68], [22, -66]] : [[-36, -68], [0, -76], [36, -68], [-18, -86], [20, -84]];
  apples.forEach(([dx, dy], i) => drawMiniApple(G, C, x + dx * sc, y + dy * sc, sc * 0.86, seed + 10 + i * 9));
  // Woven basket body in front
  const body = smooth([[x - 66 * sc, y - 66 * sc], [x + 66 * sc, y - 66 * sc], [x + 52 * sc, y], [x - 52 * sc, y]], 4, true);
  part(G, body, { col: C.ochre, p: 0.88, gap: 7, w: 9, over: 4, seed: seed + 60, ang: 0.12, cross: true, crossP: 0.45 }, OL(C, 6, seed + 61));
  // Rim lip + woven lines
  const rim = smooth([[x - 72 * sc, y - 72 * sc], [x + 72 * sc, y - 72 * sc], [x + 68 * sc, y - 54 * sc], [x - 68 * sc, y - 54 * sc]], 3, true);
  part(G, rim, { col: C.yellow, p: 0.72, gap: 6, w: 7, over: 2, seed: seed + 62 }, OL(C, 5.5, seed + 63));
  line(G.l, [[x - 56 * sc, y - 34 * sc], [x + 56 * sc, y - 34 * sc]], OL(C, 3.8, seed + 64, { p: 0.72 }));
  line(G.l, [[x - 24 * sc, y - 54 * sc], [x - 20 * sc, y - 2 * sc]], OL(C, 3.8, seed + 65, { p: 0.72 }));
  line(G.l, [[x + 24 * sc, y - 54 * sc], [x + 20 * sc, y - 2 * sc]], OL(C, 3.8, seed + 66, { p: 0.72 }));
}

// ——— 🐶 LITTLE DOG (Chú chó nhỏ vui vẻ & tốt bụng) ———
function drawLittleDog(G, C, x, y, o = {}) {
  const sc = o.sc ?? 1, view = o.view || 'r34', expr = o.expr || 'happy', pose = o.pose || 'stand';
  const t = o.t ?? 0, seed = o.seed ?? 900;
  const flip = view === 'l34' ? -1 : 1;
  const fsh = view === 'front' ? 0 : flip * 14 * sc;
  const step12 = Math.floor(t * 12);
  const walkPh = pose === 'walk' ? Math.sin(step12 * 1.15) : 0;
  const cheerPh = pose === 'cheer' ? Math.abs(Math.sin(step12 * 0.9)) : 0;
  const wag = pose === 'scared' ? -0.7 : Math.sin(step12 * 0.95) * (pose === 'cheer' || pose === 'wave' ? 0.55 : 0.35);

  const sitting = pose === 'sit_eat';
  const bodyDy = (sitting ? 34 : (pose === 'scared' ? 8 : (pose === 'cheer' ? -24 * cheerPh : -Math.abs(walkPh) * 8))) * sc;
  const bodyDx = (pose === 'scared' ? -flip * 10 : 0) * sc;
  const cx = x + bodyDx, cy = y + bodyDy;

  // 1. Wagging Tail behind hip
  const tx0 = cx - flip * 34 * sc, ty0 = cy - 66 * sc;
  const tailPts = pose === 'scared'
    ? curve([[tx0, ty0], [tx0 - flip * 24 * sc, ty0 + 22 * sc], [tx0 - flip * 12 * sc, ty0 + 44 * sc]], 5)
    : curve([[tx0, ty0], [tx0 - flip * (34 + wag * 14) * sc, ty0 - (24 + wag * 12) * sc], [tx0 - flip * (48 + wag * 24) * sc, ty0 - (54 - wag * 16) * sc]], 5);
  part(G, tube(tailPts, 17 * sc, 9 * sc), { col: C.ochre, p: 0.9, gap: 6, w: 8, over: 2.5, seed: seed + 1 }, OL(C, 5.5, seed + 2));

  // 2. Back Leg & Back Arm
  const bLegX = cx + flip * (18 + walkPh * 18) * sc;
  if (!sitting) {
    const bl = curve([[cx + flip * 14 * sc, cy - 52 * sc], [bLegX, cy - 26 * sc], [bLegX + flip * 4 * sc, y - 4 * sc]], 4);
    part(G, tube(bl, 22 * sc, 17 * sc), { col: C.ochre, p: 0.88, gap: 6, w: 8, over: 2, seed: seed + 3 }, OL(C, 5.5, seed + 4));
  }
  const shBack = [cx + flip * 28 * sc, cy - 124 * sc];
  let bPaw = [cx + flip * (54 - walkPh * 14) * sc, cy - 80 * sc];
  if (pose === 'wave') {
    const wv = Math.sin(step12 * 1.2) * 14 * sc;
    bPaw = [cx + flip * 82 * sc + wv, cy - 186 * sc];
  } else if (pose === 'scared')      bPaw = [cx + flip * 62 * sc, cy - 176 * sc];
  else if (pose === 'cheer')         bPaw = [cx + flip * 86 * sc, cy - 208 * sc];
  else if (pose === 'offer_apple')   bPaw = [cx + flip * 78 * sc, cy - 118 * sc];
  else if (pose === 'sit_eat')       bPaw = [cx + flip * 52 * sc, cy - 106 * sc];
  const ba = curve([shBack, [(shBack[0] + bPaw[0]) * 0.5 + flip * 8 * sc, (shBack[1] + bPaw[1]) * 0.5 + 8 * sc], bPaw], 4);
  part(G, tube(ba, 19 * sc, 15 * sc), { col: C.ochre, p: 0.88, gap: 6, w: 8, over: 2, seed: seed + 5 }, OL(C, 5.5, seed + 6));

  // 3. Plump Puppy Torso + Cream Belly
  const torso = smooth([
    [cx - 34 * sc, cy - 140 * sc], [cx + 34 * sc, cy - 140 * sc],
    [cx + 48 * sc, cy - 92 * sc],  [cx + 42 * sc, cy - 46 * sc],
    [cx,           cy - 38 * sc],  [cx - 42 * sc, cy - 46 * sc],
    [cx - 48 * sc, cy - 92 * sc]
  ], 5, true);
  part(G, torso, { col: C.ochre, p: 0.88, gap: 9, w: 11, over: 5, seed: seed + 7, cross: true, crossP: 0.42 }, OL(C, 6.5, seed + 8));
  const belly = ellipse(cx + fsh * 0.65, cy - 88 * sc, 25 * sc, 36 * sc, 20);
  fill(G.f, belly, { col: C.peach, p: 0.88, gap: 7, w: 9, over: 2, seed: seed + 9 });

  // 4. Front Leg (or cute tucked sitting paws)
  if (sitting) {
    part(G, ellipse(cx + flip * 24 * sc, y - 16 * sc, 22 * sc, 15 * sc, 18), { col: C.ochre, p: 0.9, gap: 5, w: 7, over: 2, seed: seed + 10 }, OL(C, 5.5, seed + 11));
    part(G, ellipse(cx - flip * 16 * sc, y - 14 * sc, 22 * sc, 15 * sc, 18), { col: C.ochre, p: 0.9, gap: 5, w: 7, over: 2, seed: seed + 12 }, OL(C, 5.5, seed + 13));
    dab(G.f, cx + flip * 26 * sc, y - 15 * sc, 8 * sc, { col: C.peach, p: 0.9, seed: seed + 14 });
    dab(G.f, cx - flip * 14 * sc, y - 13 * sc, 8 * sc, { col: C.peach, p: 0.9, seed: seed + 15 });
  } else {
    const fLegX = cx - flip * (16 + walkPh * 18) * sc;
    const fl = curve([[cx - flip * 14 * sc, cy - 52 * sc], [fLegX, cy - 26 * sc], [fLegX + flip * 4 * sc, y - 4 * sc]], 4);
    part(G, tube(fl, 22 * sc, 17 * sc), { col: C.ochre, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 10 }, OL(C, 5.5, seed + 11));
  }

  // 5. Ruby-Red Collar + Yellow Bell
  const colPoly = smooth([
    [cx - 38 * sc, cy - 148 * sc], [cx, cy - 134 * sc], [cx + 38 * sc, cy - 148 * sc],
    [cx + 36 * sc, cy - 132 * sc], [cx, cy - 118 * sc], [cx - 36 * sc, cy - 132 * sc]
  ], 4, true);
  part(G, colPoly, { col: C.red, p: 0.94, gap: 5, w: 7, over: 2, seed: seed + 16 }, OL(C, 5, seed + 17));
  part(G, handCircle(cx + fsh * 0.9, cy - 122 * sc, 10 * sc, seed + 18, 0.06, 14), { col: C.yellow, p: 0.96, gap: 3, w: 5, over: 1, seed: seed + 19 }, OL(C, 3.8, seed + 20));

  // 6. Head + Floppy Ears
  const hx = cx + (pose === 'scared' ? -flip * 4 : 0) * sc;
  const hy = cy - 196 * sc;
  const earLift = pose === 'scared' || pose === 'cheer' ? -18 * sc : 0;

  // Back floppy ear (behind head)
  const bEarX = hx + flip * 44 * sc;
  const bEar = smooth([
    [bEarX - flip * 8 * sc,  hy - 32 * sc],
    [bEarX + flip * 24 * sc, hy - 14 * sc + earLift],
    [bEarX + flip * 28 * sc, hy + 28 * sc + earLift * 0.6],
    [bEarX + flip * 6 * sc,  hy + 38 * sc + earLift * 0.4],
    [bEarX - flip * 10 * sc, hy + 8 * sc]
  ], 4, true);
  part(G, bEar, { col: C.ochre, p: 0.96, gap: 6, w: 8, over: 2, seed: seed + 21 }, OL(C, 5.8, seed + 22));

  // Main round puppy head
  const head = smooth([
    [hx - 54 * sc, hy - 12 * sc], [hx - 48 * sc, hy - 48 * sc], [hx, hy - 58 * sc],
    [hx + 48 * sc, hy - 48 * sc], [hx + 54 * sc, hy - 12 * sc], [hx + 58 * sc, hy + 24 * sc],
    [hx + 30 * sc, hy + 50 * sc], [hx, hy + 54 * sc], [hx - 30 * sc, hy + 50 * sc], [hx - 58 * sc, hy + 24 * sc]
  ], 5, true);
  part(G, head, { col: C.ochre, p: 0.86, gap: 9, w: 11, over: 5, seed: seed + 23, cross: true, crossP: 0.4 }, OL(C, 6.5, seed + 24));

  // Soft cream muzzle/snout patch
  const mx = hx + fsh * 1.15, my = hy + 16 * sc;
  const muzzle = ellipse(mx, my, 32 * sc, 24 * sc, 22);
  fill(G.f, muzzle, { col: C.peach, p: 0.92, gap: 6, w: 8, over: 2.5, seed: seed + 25 });
  line(G.l, muzzle, OL(C, 3.6, seed + 26, { p: 0.45 }));

  // Rosy cheeks
  dab(G.f, hx + fsh - 32 * sc, hy + 18 * sc, 11 * sc, { col: C.pink, p: 0.72, sq: 0.75, seed: seed + 27 });
  dab(G.f, hx + fsh + 32 * sc, hy + 18 * sc, 11 * sc, { col: C.pink, p: 0.72, sq: 0.75, seed: seed + 28 });

  // Eyes + Eyebrows
  const exL = hx + fsh - 20 * sc, exR = hx + fsh + 20 * sc, ey = hy - 10 * sc;
  if (expr === 'yummy' || expr === 'excited') {
    line(G.l, curve([[exL - 10 * sc, ey + 2 * sc], [exL, ey - 8 * sc], [exL + 10 * sc, ey + 2 * sc]], 4), OL(C, 5.2, seed + 29));
    line(G.l, curve([[exR - 10 * sc, ey + 2 * sc], [exR, ey - 8 * sc], [exR + 10 * sc, ey + 2 * sc]], 4), OL(C, 5.2, seed + 30));
  } else {
    const er = (expr === 'scared' ? 10 : 8.5) * sc;
    dab(G.l, exL, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 29 });
    dab(G.l, exR, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 30 });
    dab(G.l, exL - 2.5 * sc, ey - 2.5 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 31 });
    dab(G.l, exR - 2.5 * sc, ey - 2.5 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 32 });
  }
  if (expr === 'scared') {
    line(G.l, [[exL - 10 * sc, ey - 16 * sc], [exL + 6 * sc, ey - 24 * sc]], OL(C, 4.2, seed + 33));
    line(G.l, [[exR + 10 * sc, ey - 16 * sc], [exR - 6 * sc, ey - 24 * sc]], OL(C, 4.2, seed + 34));
  } else if (expr === 'curious' || expr === 'kind') {
    line(G.l, curve([[exL - 9 * sc, ey - 18 * sc], [exL, ey - 23 * sc], [exL + 9 * sc, ey - 18 * sc]], 3), OL(C, 4, seed + 33));
    line(G.l, curve([[exR - 9 * sc, ey - 18 * sc], [exR, ey - 23 * sc], [exR + 9 * sc, ey - 18 * sc]], 3), OL(C, 4, seed + 34));
  }

  // Button puppy nose + white shine
  part(G, ellipse(mx, my - 10 * sc, 11 * sc, 8 * sc, 16), { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0, seed: seed + 35 }, OL(C, 3.5, seed + 36));
  dab(G.l, mx - 3 * sc, my - 12 * sc, 2.5 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 2.5, over: 0, seed: seed + 37 });

  // Puppy mouth
  if (expr === 'scared') {
    part(G, ellipse(mx, my + 12 * sc, 8 * sc, 10 * sc, 14), { col: C.red, p: 0.78, gap: 3, w: 4, over: 0, seed: seed + 38 }, OL(C, 4.5, seed + 39));
  } else if (expr === 'excited' || pose === 'cheer') {
    const mo = smooth([[mx - 15 * sc, my + 2 * sc], [mx + 15 * sc, my + 2 * sc], [mx + 11 * sc, my + 20 * sc], [mx, my + 24 * sc], [mx - 11 * sc, my + 20 * sc]], 4, true);
    part(G, mo, { col: C.pink, p: 0.88, gap: 4, w: 5, over: 0, seed: seed + 38 }, OL(C, 4.5, seed + 39));
  } else {
    line(G.l, [[mx, my - 2 * sc], [mx, my + 6 * sc]], OL(C, 4, seed + 38));
    line(G.l, curve([[mx - 15 * sc, my + 6 * sc], [mx - 7 * sc, my + 14 * sc], [mx, my + 6 * sc], [mx + 7 * sc, my + 14 * sc], [mx + 15 * sc, my + 6 * sc]], 4), OL(C, 4.5, seed + 39));
  }

  // Front Floppy Ear (warm dark-ochre framing side of face)
  const fEarX = hx - flip * 46 * sc;
  const fEar = smooth([
    [fEarX + flip * 10 * sc, hy - 34 * sc],
    [fEarX - flip * 24 * sc, hy - 14 * sc + earLift],
    [fEarX - flip * 34 * sc, hy + 28 * sc + earLift * 0.5],
    [fEarX - flip * 8 * sc,  hy + 44 * sc + earLift * 0.3],
    [fEarX + flip * 14 * sc, hy + 14 * sc]
  ], 4, true);
  part(G, fEar, { col: C.ochre, p: 0.96, gap: 6, w: 8, over: 2.5, seed: seed + 40 }, OL(C, 6, seed + 41));

  // 7. Front Arm + Optional Apple
  const shFront = [cx - flip * 26 * sc, cy - 122 * sc];
  let fPaw = [cx - flip * (52 - walkPh * 16) * sc, cy - 76 * sc];
  let holdApple = false, biteApple = false;
  if (pose === 'wave') {
    fPaw = [cx - flip * 54 * sc, cy - 78 * sc];
  } else if (pose === 'scared') {
    fPaw = [cx - flip * 60 * sc, cy - 176 * sc];
  } else if (pose === 'offer_apple') {
    fPaw = [cx + flip * 86 * sc, cy - 124 * sc];
    holdApple = true;
  } else if (pose === 'sit_eat') {
    fPaw = [cx + flip * 44 * sc, cy - 120 * sc];
    holdApple = true; biteApple = true;
  } else if (pose === 'cheer') {
    fPaw = [cx - flip * 86 * sc, cy - 208 * sc];
  }
  const fElb = [
    pose === 'offer_apple' ? cx + flip * 20 * sc : (shFront[0] + fPaw[0]) * 0.5 - flip * 14 * sc,
    (shFront[1] + fPaw[1]) * 0.5 + 16 * sc
  ];
  const fa = curve([shFront, fElb, fPaw], 4);
  part(G, tube(fa, 20 * sc, 15 * sc), { col: C.ochre, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 42 }, OL(C, 5.5, seed + 43));

  if (holdApple) drawMiniApple(G, C, fPaw[0] + flip * 14 * sc, fPaw[1] - 10 * sc, sc * 0.95, seed + 50, biteApple);
}

// ——— 🐱 TABBY CAT (Chú mèo mướp thông minh & đáng yêu) ———
function drawTabbyCat(G, C, x, y, o = {}) {
  const sc = o.sc ?? 1, view = o.view || 'r34', expr = o.expr || 'happy', pose = o.pose || 'stand';
  const t = o.t ?? 0, seed = o.seed ?? 960;
  const flip = view === 'l34' ? -1 : 1;
  const fsh = view === 'front' ? 0 : flip * 13 * sc;
  const step12 = Math.floor(t * 12);
  const walkPh = pose === 'walk' ? Math.sin(step12 * 1.15 + 1.2) : 0;
  const cheerPh = pose === 'cheer' ? Math.abs(Math.sin(step12 * 0.9 + 0.6)) : 0;
  const sway = Math.sin(step12 * 0.7) * 10 * sc;

  const sitting = pose === 'sit_eat';
  const bodyDy = (sitting ? 32 : (pose === 'scared' ? 8 : (pose === 'cheer' ? -24 * cheerPh : -Math.abs(walkPh) * 7))) * sc;
  const bodyDx = (pose === 'scared' ? -flip * 10 : 0) * sc;
  const cx = x + bodyDx, cy = y + bodyDy;

  // 1. Long Graceful Striped S-Tail
  const tx0 = cx - flip * 32 * sc, ty0 = cy - 64 * sc;
  const tailPts = pose === 'scared'
    ? curve([[tx0, ty0], [tx0 - flip * 46 * sc, ty0 - 40 * sc], [tx0 - flip * 58 * sc, ty0 - 118 * sc]], 6)
    : curve([[tx0, ty0], [tx0 - flip * 44 * sc, ty0 - 22 * sc], [tx0 - flip * (62 + sway * 0.4) * sc, ty0 - 78 * sc], [tx0 - flip * (46 - sway * 0.5) * sc, ty0 - 114 * sc]], 6);
  part(G, tube(tailPts, 15 * sc, 11 * sc), { col: C.yellow, p: 0.9, gap: 6, w: 8, over: 2.5, seed: seed + 1 }, OL(C, 5.5, seed + 2));
  // Tabby rings on tail
  for (const idx of [3, 6, 9, 12]) {
    if (tailPts[idx] && tailPts[idx - 1]) {
      const pA = tailPts[idx - 1], pB = tailPts[idx];
      const ang = Math.atan2(pB[1] - pA[1], pB[0] - pA[0]) + Math.PI / 2;
      line(G.l, [[pA[0] - Math.cos(ang) * 9 * sc, pA[1] - Math.sin(ang) * 9 * sc], [pA[0] + Math.cos(ang) * 9 * sc, pA[1] + Math.sin(ang) * 9 * sc]], { col: C.ochre, w: 5.5 * sc, p: 0.92, seed: seed + 10 + idx });
    }
  }

  // 2. Back Leg & Back Arm
  if (!sitting) {
    const bLegX = cx + flip * (16 + walkPh * 17) * sc;
    const bl = curve([[cx + flip * 12 * sc, cy - 50 * sc], [bLegX, cy - 24 * sc], [bLegX + flip * 4 * sc, y - 4 * sc]], 4);
    part(G, tube(bl, 20 * sc, 15 * sc), { col: C.yellow, p: 0.88, gap: 6, w: 8, over: 2, seed: seed + 3 }, OL(C, 5.5, seed + 4));
  }
  const shBack = [cx + flip * 26 * sc, cy - 122 * sc];
  let bPaw = [cx + flip * (50 - walkPh * 13) * sc, cy - 78 * sc];
  if (pose === 'wave') {
    const wv = Math.sin(step12 * 1.2 + 0.5) * 14 * sc;
    bPaw = [cx + flip * 78 * sc + wv, cy - 182 * sc];
  } else if (pose === 'scared')      bPaw = [cx + flip * 60 * sc, cy - 172 * sc];
  else if (pose === 'cheer')         bPaw = [cx + flip * 82 * sc, cy - 204 * sc];
  else if (pose === 'offer_apple')   bPaw = [cx + flip * 74 * sc, cy - 116 * sc];
  else if (pose === 'sit_eat')       bPaw = [cx + flip * 46 * sc, cy - 104 * sc];
  const ba = curve([shBack, [(shBack[0] + bPaw[0]) * 0.5 + flip * 8 * sc, (shBack[1] + bPaw[1]) * 0.5 + 8 * sc], bPaw], 4);
  part(G, tube(ba, 17 * sc, 14 * sc), { col: C.yellow, p: 0.88, gap: 6, w: 8, over: 2, seed: seed + 5 }, OL(C, 5.5, seed + 6));

  // 3. Sleek Tabby Torso + Cream Chest + Side Tabby Stripes
  const torso = smooth([
    [cx - 31 * sc, cy - 138 * sc], [cx + 31 * sc, cy - 138 * sc],
    [cx + 43 * sc, cy - 90 * sc],  [cx + 38 * sc, cy - 46 * sc],
    [cx,           cy - 38 * sc],  [cx - 38 * sc, cy - 46 * sc],
    [cx - 43 * sc, cy - 90 * sc]
  ], 5, true);
  part(G, torso, { col: C.yellow, p: 0.88, gap: 9, w: 11, over: 5, seed: seed + 7, cross: true, crossP: 0.4 }, OL(C, 6.5, seed + 8));
  fill(G.f, ellipse(cx + fsh * 0.6, cy - 88 * sc, 21 * sc, 34 * sc, 18), { col: C.peach, p: 0.88, gap: 6, w: 8, over: 2, seed: seed + 9 });
  // Tabby stripes on hip sides
  line(G.f, [[cx - flip * 38 * sc, cy - 96 * sc], [cx - flip * 22 * sc, cy - 92 * sc]], { col: C.ochre, w: 6.5 * sc, p: 0.9, seed: seed + 10 });
  line(G.f, [[cx - flip * 36 * sc, cy - 76 * sc], [cx - flip * 20 * sc, cy - 73 * sc]], { col: C.ochre, w: 6.5 * sc, p: 0.9, seed: seed + 11 });

  // 4. Front Leg (or sitting paws)
  if (sitting) {
    part(G, ellipse(cx + flip * 22 * sc, y - 15 * sc, 20 * sc, 14 * sc, 18), { col: C.yellow, p: 0.9, gap: 5, w: 7, over: 2, seed: seed + 12 }, OL(C, 5.5, seed + 13));
    part(G, ellipse(cx - flip * 14 * sc, y - 13 * sc, 20 * sc, 14 * sc, 18), { col: C.yellow, p: 0.9, gap: 5, w: 7, over: 2, seed: seed + 14 }, OL(C, 5.5, seed + 15));
  } else {
    const fLegX = cx - flip * (15 + walkPh * 17) * sc;
    const fl = curve([[cx - flip * 13 * sc, cy - 50 * sc], [fLegX, cy - 24 * sc], [fLegX + flip * 4 * sc, y - 4 * sc]], 4);
    part(G, tube(fl, 20 * sc, 15 * sc), { col: C.yellow, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 12 }, OL(C, 5.5, seed + 13));
  }

  // 5. Sky-Blue Ribbon Bow Tie at Neck
  const bx = cx + fsh * 0.75, by = cy - 134 * sc;
  const bowL = smooth([[bx, by], [bx - 24 * sc, by - 14 * sc], [bx - 26 * sc, by + 14 * sc]], 3, true);
  const bowR = smooth([[bx, by], [bx + 24 * sc, by - 14 * sc], [bx + 26 * sc, by + 14 * sc]], 3, true);
  part(G, bowL, { col: C.sky, p: 0.94, gap: 4, w: 6, over: 1, seed: seed + 16 }, OL(C, 4.5, seed + 17));
  part(G, bowR, { col: C.sky, p: 0.94, gap: 4, w: 6, over: 1, seed: seed + 18 }, OL(C, 4.5, seed + 19));
  part(G, handCircle(bx, by, 8 * sc, seed + 20, 0.08, 12), { col: C.sky, p: 0.96, gap: 3, w: 5, over: 0, seed: seed + 21 }, OL(C, 4, seed + 22));

  // 6. Pointy Cat Ears (flatten slightly outward when scared!)
  const hx = cx, hy = cy - 192 * sc;
  const flat = pose === 'scared' ? 16 * sc : 0;
  const earL = smooth([[hx - 48 * sc, hy - 22 * sc], [hx - 54 * sc - flat, hy - 84 * sc + flat * 0.9], [hx - 12 * sc, hy - 48 * sc]], 3, true);
  const earR = smooth([[hx + 12 * sc, hy - 48 * sc], [hx + 54 * sc + flat, hy - 84 * sc + flat * 0.9], [hx + 48 * sc, hy - 22 * sc]], 3, true);
  part(G, earL, { col: C.yellow, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 23 }, OL(C, 6, seed + 24));
  part(G, earR, { col: C.yellow, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 25 }, OL(C, 6, seed + 26));
  // Pink inner ear triangles
  fill(G.f, [[hx - 42 * sc, hy - 30 * sc], [hx - 46 * sc - flat * 0.7, hy - 68 * sc + flat * 0.7], [hx - 20 * sc, hy - 44 * sc]], { col: C.pink, p: 0.85, gap: 4, w: 6, over: 1, seed: seed + 27 });
  fill(G.f, [[hx + 20 * sc, hy - 44 * sc], [hx + 46 * sc + flat * 0.7, hy - 68 * sc + flat * 0.7], [hx + 42 * sc, hy - 30 * sc]], { col: C.pink, p: 0.85, gap: 4, w: 6, over: 1, seed: seed + 28 });

  // 7. Round Tabby Head + Signature Forehead & Cheek Stripes
  const head = smooth([
    [hx - 56 * sc, hy - 8 * sc], [hx - 48 * sc, hy - 44 * sc], [hx, hy - 54 * sc],
    [hx + 48 * sc, hy - 44 * sc], [hx + 56 * sc, hy - 8 * sc], [hx + 60 * sc, hy + 20 * sc],
    [hx + 32 * sc, hy + 48 * sc], [hx, hy + 52 * sc], [hx - 32 * sc, hy + 48 * sc], [hx - 60 * sc, hy + 20 * sc]
  ], 5, true);
  part(G, head, { col: C.yellow, p: 0.88, gap: 9, w: 11, over: 5, seed: seed + 29, cross: true, crossP: 0.38 }, OL(C, 6.5, seed + 30));

  // 3 Forehead tabby stripes + cheek stripes
  const fhx = hx + fsh * 0.65;
  line(G.f, [[fhx - 14 * sc, hy - 51 * sc], [fhx - 12 * sc, hy - 31 * sc]], { col: C.ochre, w: 7 * sc, p: 0.94, seed: seed + 31 });
  line(G.f, [[fhx,           hy - 53 * sc], [fhx,           hy - 28 * sc]], { col: C.ochre, w: 7.5 * sc, p: 0.94, seed: seed + 32 });
  line(G.f, [[fhx + 14 * sc, hy - 51 * sc], [fhx + 12 * sc, hy - 31 * sc]], { col: C.ochre, w: 7 * sc, p: 0.94, seed: seed + 33 });
  line(G.f, [[hx - 56 * sc, hy + 6 * sc],  [hx - 38 * sc, hy + 10 * sc]], { col: C.ochre, w: 5.5 * sc, p: 0.9, seed: seed + 34 });
  line(G.f, [[hx - 54 * sc, hy + 20 * sc], [hx - 38 * sc, hy + 22 * sc]], { col: C.ochre, w: 5.5 * sc, p: 0.9, seed: seed + 35 });
  line(G.f, [[hx + 56 * sc, hy + 6 * sc],  [hx + 38 * sc, hy + 10 * sc]], { col: C.ochre, w: 5.5 * sc, p: 0.9, seed: seed + 36 });
  line(G.f, [[hx + 54 * sc, hy + 20 * sc], [hx + 38 * sc, hy + 22 * sc]], { col: C.ochre, w: 5.5 * sc, p: 0.9, seed: seed + 37 });

  // Soft cream lower muzzle blush + rosy cheeks
  const mx = hx + fsh, my = hy + 16 * sc;
  dab(G.f, mx - 28 * sc, hy + 16 * sc, 11 * sc, { col: C.pink, p: 0.74, sq: 0.75, seed: seed + 38 });
  dab(G.f, mx + 28 * sc, hy + 16 * sc, 11 * sc, { col: C.pink, p: 0.74, sq: 0.75, seed: seed + 39 });

  // Smart bright cat eyes
  const exL = mx - 21 * sc, exR = mx + 21 * sc, ey = hy - 6 * sc;
  if (expr === 'yummy' || expr === 'excited') {
    line(G.l, curve([[exL - 10 * sc, ey + 2 * sc], [exL, ey - 8 * sc], [exL + 10 * sc, ey + 2 * sc]], 4), OL(C, 5, seed + 40));
    line(G.l, curve([[exR - 10 * sc, ey + 2 * sc], [exR, ey - 8 * sc], [exR + 10 * sc, ey + 2 * sc]], 4), OL(C, 5, seed + 41));
  } else {
    const er = (expr === 'scared' ? 10.5 : 8.5) * sc;
    dab(G.l, exL, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 40 });
    dab(G.l, exR, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 41 });
    dab(G.l, exL - 2.5 * sc, ey - 2.8 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 42 });
    dab(G.l, exR - 2.5 * sc, ey - 2.8 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 43 });
    // Tiny cute eyelash flicks
    line(G.l, [[exL - 8 * sc, ey - 6 * sc], [exL - 14 * sc, ey - 11 * sc]], OL(C, 3.2, seed + 44));
    line(G.l, [[exR + 8 * sc, ey - 6 * sc], [exR + 14 * sc, ey - 11 * sc]], OL(C, 3.2, seed + 45));
  }
  if (expr === 'scared') {
    line(G.l, [[exL - 9 * sc, ey - 15 * sc], [exL + 7 * sc, ey - 23 * sc]], OL(C, 4, seed + 46));
    line(G.l, [[exR + 9 * sc, ey - 15 * sc], [exR - 7 * sc, ey - 23 * sc]], OL(C, 4, seed + 47));
  }

  // Pink triangular cat nose + cat mouth
  const nose = [[mx - 7 * sc, my - 10 * sc], [mx + 7 * sc, my - 10 * sc], [mx, my - 2 * sc]];
  part(G, nose, { col: C.pink, p: 0.96, gap: 3, w: 4, over: 0, seed: seed + 48 }, OL(C, 3.5, seed + 49));
  if (expr === 'scared') {
    part(G, ellipse(mx, my + 12 * sc, 7.5 * sc, 9.5 * sc, 14), { col: C.red, p: 0.78, gap: 3, w: 4, over: 0, seed: seed + 50 }, OL(C, 4.2, seed + 51));
  } else {
    line(G.l, curve([[mx - 14 * sc, my + 5 * sc], [mx - 7 * sc, my + 13 * sc], [mx, my + 4 * sc], [mx + 7 * sc, my + 13 * sc], [mx + 14 * sc, my + 5 * sc]], 4), OL(C, 4.4, seed + 50));
  }

  // 3 Delicate Whiskers each side
  [-1, 1].forEach(dir => {
    const wx = mx + dir * 28 * sc;
    line(G.l, [[wx, my - 2 * sc], [wx + dir * 32 * sc, my - 9 * sc]], OL(C, 3.0, seed + 52 + dir));
    line(G.l, [[wx, my + 5 * sc], [wx + dir * 34 * sc, my + 5 * sc]], OL(C, 3.0, seed + 55 + dir));
    line(G.l, [[wx, my + 12 * sc], [wx + dir * 30 * sc, my + 18 * sc]], OL(C, 3.0, seed + 58 + dir));
  });

  // 8. Front Arm + Optional Apple
  const shFront = [cx - flip * 25 * sc, cy - 120 * sc];
  let fPaw = [cx - flip * (48 - walkPh * 15) * sc, cy - 76 * sc];
  let holdApple = false, biteApple = false;
  if (pose === 'wave') {
    fPaw = [cx - flip * 50 * sc, cy - 78 * sc];
  } else if (pose === 'scared') {
    fPaw = [cx - flip * 58 * sc, cy - 172 * sc];
  } else if (pose === 'offer_apple') {
    fPaw = [cx + flip * 82 * sc, cy - 122 * sc];
    holdApple = true;
  } else if (pose === 'sit_eat') {
    fPaw = [cx + flip * 42 * sc, cy - 118 * sc];
    holdApple = true; biteApple = true;
  } else if (pose === 'cheer') {
    fPaw = [cx - flip * 82 * sc, cy - 204 * sc];
  }
  const fElb = [
    pose === 'offer_apple' ? cx + flip * 18 * sc : (shFront[0] + fPaw[0]) * 0.5 - flip * 14 * sc,
    (shFront[1] + fPaw[1]) * 0.5 + 16 * sc
  ];
  const fa = curve([shFront, fElb, fPaw], 4);
  part(G, tube(fa, 18 * sc, 14 * sc), { col: C.yellow, p: 0.9, gap: 6, w: 8, over: 2, seed: seed + 62 }, OL(C, 5.5, seed + 63));

  if (holdApple) drawMiniApple(G, C, fPaw[0] + flip * 14 * sc, fPaw[1] - 10 * sc, sc * 0.92, seed + 70, biteApple);
}

// ——— 🐺 GRAY WOLF (Bác sói xám to lớn nhưng có trái tim tốt bụng) ———
function drawGrayWolf(G, C, x, y, o = {}) {
  const sc = o.sc ?? 1, view = o.view || 'l34', expr = o.expr || 'friendly', pose = o.pose || 'stand';
  const t = o.t ?? 0, seed = o.seed ?? 1020;
  const flip = view === 'l34' ? -1 : 1;
  const fsh = view === 'front' ? 0 : flip * 22 * sc;
  const step12 = Math.floor(t * 12);
  const walkPh = pose === 'walk' ? Math.sin(step12 * 1.0) : 0;
  const laughBob = pose === 'laugh' ? Math.sin(step12 * 2.2) * 8 * sc : 0;
  const cheerPh = pose === 'cheer' ? Math.abs(Math.sin(step12 * 0.85)) : 0;
  const wag = pose === 'sad_hungry' ? -0.5 : Math.sin(step12 * 0.8) * (pose === 'cheer' || pose === 'eat_apple' ? 0.5 : 0.25);

  const sitting = pose === 'sit_eat';
  const sad = pose === 'sad_hungry' || expr === 'sad';
  const bodyDy = (sitting ? 68 : (sad ? 16 : (pose === 'cheer' ? -22 * cheerPh : laughBob - Math.abs(walkPh) * 9))) * sc;
  const bodyDx = (pose === 'peek' ? flip * 22 : 0) * sc;
  const cx = x + bodyDx, cy = y + bodyDy;

  // 1. Big Bushy Wolf Tail (droops gently when sad/hungry!)
  const tx0 = cx - flip * 52 * sc, ty0 = cy - 92 * sc;
  const tailPoly = sad ? smooth([
    [tx0, ty0], [tx0 - flip * 46 * sc, ty0 + 28 * sc], [tx0 - flip * 82 * sc, ty0 + 66 * sc],
    [tx0 - flip * 96 * sc, ty0 + 50 * sc], [tx0 - flip * 62 * sc, ty0 + 4 * sc], [tx0 - flip * 16 * sc, ty0 - 14 * sc]
  ], 4, true) : smooth([
    [tx0, ty0], [tx0 - flip * 58 * sc, ty0 - 8 * sc], [tx0 - flip * (104 + wag * 18) * sc, ty0 - (58 + wag * 16) * sc],
    [tx0 - flip * (96 + wag * 14) * sc, ty0 - (92 + wag * 12) * sc], [tx0 - flip * 56 * sc, ty0 - 60 * sc], [tx0 - flip * 18 * sc, ty0 - 24 * sc]
  ], 4, true);
  part(G, tailPoly, { col: C.rain, p: 0.9, gap: 9, w: 11, over: 4, seed: seed + 1, cross: true, crossP: 0.35 }, OL(C, 6.5, seed + 2));
  // Soft cream fluffy tail tip
  const tipX = sad ? tx0 - flip * 84 * sc : tx0 - flip * (92 + wag * 15) * sc;
  const tipY = sad ? ty0 + 54 * sc : ty0 - (70 + wag * 13) * sc;
  dab(G.f, tipX, tipY, 22 * sc, { col: C.peach, p: 0.9, seed: seed + 3 });

  // 2. Back Leg & Back Arm
  if (!sitting) {
    const bLegX = cx + flip * (26 + walkPh * 22) * sc;
    const bl = curve([[cx + flip * 22 * sc, cy - 78 * sc], [bLegX, cy - 38 * sc], [bLegX + flip * 6 * sc, y - 5 * sc]], 4);
    part(G, tube(bl, 30 * sc, 22 * sc), { col: C.rain, p: 0.88, gap: 7, w: 9, over: 2.5, seed: seed + 4 }, OL(C, 6.2, seed + 5));
  }
  const shBack = [cx + flip * 44 * sc, cy - 196 * sc];
  let bPaw = [cx + flip * (78 - walkPh * 16) * sc, cy - 122 * sc];
  if (pose === 'wave')           bPaw = [cx + flip * 108 * sc, cy - 266 * sc];
  else if (pose === 'peek')      bPaw = [cx + flip * 92 * sc,  cy - 178 * sc];
  else if (pose === 'laugh')     bPaw = [cx + flip * 44 * sc,  cy - 122 * sc];
  else if (pose === 'sad_hungry')bPaw = [cx + flip * 36 * sc,  cy - 118 * sc];
  else if (pose === 'eat_apple') bPaw = [cx + flip * 68 * sc,  cy - 144 * sc];
  else if (pose === 'sit_eat')   bPaw = [cx + flip * 62 * sc,  cy - 150 * sc];
  else if (pose === 'cheer')     bPaw = [cx + flip * 104 * sc, cy - 278 * sc];
  const ba = curve([shBack, [(shBack[0] + bPaw[0]) * 0.5 + flip * 16 * sc, (shBack[1] + bPaw[1]) * 0.5 + 14 * sc], bPaw], 4);
  part(G, tube(ba, 26 * sc, 20 * sc), { col: C.rain, p: 0.88, gap: 7, w: 9, over: 2.5, seed: seed + 6 }, OL(C, 6.2, seed + 7));

  // 3. Broad Cozy Wolf Torso + Fluffy Cream Chest Ruff
  const torso = smooth([
    [cx - 50 * sc, cy - 218 * sc], [cx + 50 * sc, cy - 218 * sc],
    [cx + 68 * sc, cy - 142 * sc], [cx + 62 * sc, cy - 72 * sc],
    [cx,           cy - 60 * sc],  [cx - 62 * sc, cy - 72 * sc],
    [cx - 68 * sc, cy - 142 * sc]
  ], 5, true);
  part(G, torso, { col: C.rain, p: 0.88, gap: 10, w: 12, over: 5.5, seed: seed + 8, cross: true, crossP: 0.42 }, OL(C, 7, seed + 9));

  // Fluffy cream chest ruff & belly
  const rfx = cx + fsh * 0.55;
  const ruff = smooth([
    [rfx - 42 * sc, cy - 214 * sc], [rfx + 42 * sc, cy - 214 * sc],
    [rfx + 46 * sc, cy - 172 * sc], [rfx + 28 * sc, cy - 156 * sc],
    [rfx + 34 * sc, cy - 114 * sc], [rfx,           cy - 88 * sc],
    [rfx - 34 * sc, cy - 114 * sc], [rfx - 28 * sc, cy - 156 * sc],
    [rfx - 46 * sc, cy - 172 * sc]
  ], 4, true);
  fill(G.f, ruff, { col: C.peach, p: 0.9, gap: 7.5, w: 9.5, over: 3, seed: seed + 10 });
  line(G.l, ruff, OL(C, 3.8, seed + 11, { p: 0.42 }));

  // 4. Front Leg (or sitting paws)
  if (sitting) {
    part(G, ellipse(cx + flip * 34 * sc, y - 20 * sc, 30 * sc, 20 * sc, 18), { col: C.rain, p: 0.9, gap: 6, w: 8, over: 2.5, seed: seed + 12 }, OL(C, 6, seed + 13));
    part(G, ellipse(cx - flip * 24 * sc, y - 18 * sc, 30 * sc, 20 * sc, 18), { col: C.rain, p: 0.9, gap: 6, w: 8, over: 2.5, seed: seed + 14 }, OL(C, 6, seed + 15));
    dab(G.f, cx + flip * 36 * sc, y - 19 * sc, 11 * sc, { col: C.peach, p: 0.88, seed: seed + 16 });
    dab(G.f, cx - flip * 22 * sc, y - 17 * sc, 11 * sc, { col: C.peach, p: 0.88, seed: seed + 17 });
  } else {
    const fLegX = cx - flip * (24 + walkPh * 22) * sc;
    const fl = curve([[cx - flip * 20 * sc, cy - 78 * sc], [fLegX, cy - 38 * sc], [fLegX + flip * 6 * sc, y - 5 * sc]], 4);
    part(G, tube(fl, 30 * sc, 22 * sc), { col: C.rain, p: 0.9, gap: 7, w: 9, over: 2.5, seed: seed + 12 }, OL(C, 6.2, seed + 13));
  }

  // 5. Tall Pointed Wolf Ears (droop softly outward when sad!)
  const hx = cx + (sad ? flip * 6 : 0) * sc;
  const hy = cy - 278 * sc + (sad ? 12 : 0) * sc;
  const droop = sad ? 38 * sc : 0;
  const earL = smooth([[hx - 54 * sc, hy - 28 * sc], [hx - 64 * sc - droop * 0.9, hy - 118 * sc + droop * 1.4], [hx - 14 * sc, hy - 62 * sc]], 3, true);
  const earR = smooth([[hx + 14 * sc, hy - 62 * sc], [hx + 64 * sc + droop * 0.9, hy - 118 * sc + droop * 1.4], [hx + 54 * sc, hy - 28 * sc]], 3, true);
  part(G, earL, { col: C.rain, p: 0.92, gap: 7, w: 9, over: 2.5, seed: seed + 18 }, OL(C, 6.5, seed + 19));
  part(G, earR, { col: C.rain, p: 0.92, gap: 7, w: 9, over: 2.5, seed: seed + 20 }, OL(C, 6.5, seed + 21));
  fill(G.f, [[hx - 48 * sc, hy - 36 * sc], [hx - 54 * sc - droop * 0.7, hy - 98 * sc + droop * 1.2], [hx - 22 * sc, hy - 56 * sc]], { col: C.pink, p: 0.78, gap: 5, w: 6.5, over: 1, seed: seed + 22 });
  fill(G.f, [[hx + 22 * sc, hy - 56 * sc], [hx + 54 * sc + droop * 0.7, hy - 98 * sc + droop * 1.2], [hx + 48 * sc, hy - 36 * sc]], { col: C.pink, p: 0.78, gap: 5, w: 6.5, over: 1, seed: seed + 23 });

  // 6. Fluffy Wolf Head with Cheek Fur Tufts
  const head = smooth([
    [hx - 64 * sc, hy - 26 * sc], [hx - 52 * sc, hy - 60 * sc], [hx, hy - 70 * sc],
    [hx + 52 * sc, hy - 60 * sc], [hx + 64 * sc, hy - 26 * sc],
    [hx + 82 * sc, hy + 4 * sc],  [hx + 68 * sc, hy + 20 * sc], [hx + 76 * sc, hy + 36 * sc],
    [hx + 40 * sc, hy + 58 * sc], [hx, hy + 62 * sc], [hx - 40 * sc, hy + 58 * sc],
    [hx - 76 * sc, hy + 36 * sc], [hx - 68 * sc, hy + 20 * sc], [hx - 82 * sc, hy + 4 * sc]
  ], 4, true);
  part(G, head, { col: C.rain, p: 0.88, gap: 10, w: 12, over: 5, seed: seed + 24, cross: true, crossP: 0.42 }, OL(C, 7, seed + 25));

  // Cream lower-cheek mask & projecting Wolf Snout!
  const mask = smooth([
    [hx - 62 * sc, hy + 14 * sc], [hx - 24 * sc, hy + 4 * sc], [hx, hy + 12 * sc],
    [hx + 24 * sc, hy + 4 * sc],  [hx + 62 * sc, hy + 14 * sc], [hx + 42 * sc, hy + 56 * sc],
    [hx, hy + 60 * sc], [hx - 42 * sc, hy + 56 * sc]
  ], 4, true);
  fill(G.f, mask, { col: C.peach, p: 0.9, gap: 7, w: 9, over: 2.5, seed: seed + 26 });

  const snX = hx + fsh * 1.55, snY = hy + 20 * sc;
  const snout = smooth([
    [snX - 38 * sc, snY - 12 * sc], [snX, snY - 22 * sc], [snX + 38 * sc, snY - 12 * sc],
    [snX + 34 * sc, snY + 22 * sc], [snX, snY + 32 * sc], [snX - 34 * sc, snY + 22 * sc]
  ], 4, true);
  part(G, snout, { col: C.peach, p: 0.92, gap: 6.5, w: 8.5, over: 2.5, seed: seed + 27 }, OL(C, 5.2, seed + 28));

  // Warm rosy cheeks (when laughing, eating, or friendly!)
  if (expr !== 'mysterious') {
    dab(G.f, hx + fsh * 0.7 - 36 * sc, hy + 16 * sc, 13 * sc, { col: C.pink, p: 0.65, sq: 0.75, seed: seed + 29 });
    dab(G.f, hx + fsh * 0.7 + 36 * sc, hy + 16 * sc, 13 * sc, { col: C.pink, p: 0.65, sq: 0.75, seed: seed + 30 });
  }

  // Expressive Wolf Eyes & Eyebrows
  const exL = hx + fsh * 0.75 - 24 * sc, exR = hx + fsh * 0.75 + 24 * sc, ey = hy - 14 * sc;
  if (expr === 'laugh' || expr === 'yummy' || expr === 'happy') {
    line(G.l, curve([[exL - 12 * sc, ey + 3 * sc], [exL, ey - 10 * sc], [exL + 12 * sc, ey + 3 * sc]], 4), OL(C, 6, seed + 31));
    line(G.l, curve([[exR - 12 * sc, ey + 3 * sc], [exR, ey - 10 * sc], [exR + 12 * sc, ey + 3 * sc]], 4), OL(C, 6, seed + 32));
  } else {
    const er = (expr === 'surprised' ? 11.5 : 9.5) * sc;
    dab(G.l, exL, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 5, over: 0, seed: seed + 31 });
    dab(G.l, exR, ey, er, { col: C.ink, p: 0.96, gap: 2.5, w: 5, over: 0, seed: seed + 32 });
    dab(G.l, exL - 3 * sc, ey - 3 * sc, 3.6 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 33 });
    dab(G.l, exR - 3 * sc, ey - 3 * sc, 3.6 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 34 });
  }
  // Eyebrows define the character arc (mysterious → warm & kind → sad & hungry!)
  if (expr === 'mysterious') {
    line(G.l, [[exL - 14 * sc, ey - 22 * sc], [exL + 12 * sc, ey - 14 * sc]], OL(C, 6.2, seed + 35));
    line(G.l, [[exR + 14 * sc, ey - 22 * sc], [exR - 12 * sc, ey - 14 * sc]], OL(C, 6.2, seed + 36));
  } else if (expr === 'sad') {
    line(G.l, [[exL - 14 * sc, ey - 14 * sc], [exL + 10 * sc, ey - 24 * sc]], OL(C, 5.2, seed + 35));
    line(G.l, [[exR + 14 * sc, ey - 14 * sc], [exR - 10 * sc, ey - 24 * sc]], OL(C, 5.2, seed + 36));
  } else {
    line(G.l, curve([[exL - 12 * sc, ey - 20 * sc], [exL, ey - 26 * sc], [exL + 12 * sc, ey - 20 * sc]], 3), OL(C, 4.8, seed + 35));
    line(G.l, curve([[exR - 12 * sc, ey - 20 * sc], [exR, ey - 26 * sc], [exR + 12 * sc, ey - 20 * sc]], 3), OL(C, 4.8, seed + 36));
  }

  // Big Cocoa Wolf Nose + Expressive Mouth
  const nx = snX + flip * (view === 'front' ? 0 : 12) * sc, ny = snY - 12 * sc;
  const wNose = smooth([[nx - 16 * sc, ny - 6 * sc], [nx + 16 * sc, ny - 6 * sc], [nx + 10 * sc, ny + 10 * sc], [nx, ny + 13 * sc], [nx - 10 * sc, ny + 10 * sc]], 3, true);
  part(G, wNose, { col: C.ink, p: 0.96, gap: 3, w: 5.5, over: 0, seed: seed + 37 }, OL(C, 4, seed + 38));
  dab(G.l, nx - 4 * sc, ny - 2 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 1.5, w: 3, over: 0, seed: seed + 39 });

  if (expr === 'laugh') {
    const lm = smooth([[snX - 24 * sc, snY + 4 * sc], [snX + 24 * sc, snY + 4 * sc], [snX + 18 * sc, snY + 30 * sc], [snX, snY + 36 * sc], [snX - 18 * sc, snY + 30 * sc]], 4, true);
    part(G, lm, { col: C.red, p: 0.85, gap: 5, w: 6, over: 0, seed: seed + 40 }, OL(C, 5.2, seed + 41));
  } else if (expr === 'sad') {
    line(G.l, curve([[snX - 18 * sc, snY + 22 * sc], [snX, snY + 12 * sc], [snX + 18 * sc, snY + 22 * sc]], 5), OL(C, 5.2, seed + 40));
  } else if (expr === 'surprised') {
    part(G, ellipse(snX, snY + 16 * sc, 10 * sc, 12 * sc, 16), { col: C.pink, p: 0.85, gap: 4, w: 5, over: 0, seed: seed + 40 }, OL(C, 5, seed + 41));
  } else {
    line(G.l, curve([[snX - 22 * sc, snY + 10 * sc], [snX, snY + 24 * sc], [snX + 22 * sc, snY + 10 * sc]], 5), OL(C, 5.2, seed + 40));
  }

  // 7. Front Arm + Optional Bitten Apple
  const shFront = [cx - flip * 40 * sc, cy - 194 * sc];
  let fPaw = [cx - flip * (72 - walkPh * 18) * sc, cy - 118 * sc];
  let holdApple = false;
  if (pose === 'wave') {
    const wv = Math.sin(step12 * 1.1) * 16 * sc;
    fPaw = [cx - flip * 102 * sc + wv, cy - 266 * sc];
  } else if (pose === 'peek') {
    fPaw = [cx - flip * 72 * sc, cy - 124 * sc];
  } else if (pose === 'laugh') {
    fPaw = [cx - flip * 12 * sc, cy - 118 * sc];
  } else if (pose === 'sad_hungry') {
    fPaw = [cx + flip * 12 * sc, cy - 114 * sc];
  } else if (pose === 'eat_apple') {
    fPaw = [cx + flip * 54 * sc, cy - 222 * sc];
    holdApple = true;
  } else if (pose === 'sit_eat') {
    fPaw = [cx + flip * 48 * sc, cy - 198 * sc];
    holdApple = true;
  } else if (pose === 'cheer') {
    fPaw = [cx - flip * 104 * sc, cy - 278 * sc];
  }
  const fElb = [
    (pose === 'sad_hungry' || pose === 'laugh') ? cx - flip * 68 * sc : (shFront[0] + fPaw[0]) * 0.5 - flip * 16 * sc,
    (shFront[1] + fPaw[1]) * 0.5 + 22 * sc
  ];
  const fa = curve([shFront, fElb, fPaw], 4);
  part(G, tube(fa, 26 * sc, 20 * sc), { col: C.rain, p: 0.9, gap: 7, w: 9, over: 2.5, seed: seed + 44 }, OL(C, 6.2, seed + 45));

  if (holdApple) drawMiniApple(G, C, fPaw[0] + flip * 14 * sc, fPaw[1] - 12 * sc, sc * 1.08, seed + 55, true);
}

// Unified dispatcher used by engine/scene.js & engine/sheet.js
export function drawEntity(G, C, ent, state, t) {
  const o = { ...state, sc: ent.scale ?? 1, t, seed: ent.seed ?? 10, rootY: ent.rootY };
  switch (ent.type) {
    case 'boy_leo':      return drawChild(G, C, ent.x, ent.y, o, 'boy');
    case 'girl_maya':    return drawChild(G, C, ent.x, ent.y, o, 'girl');
    case 'little_dog':   return drawLittleDog(G, C, ent.x, ent.y, o);
    case 'tabby_cat':    return drawTabbyCat(G, C, ent.x, ent.y, o);
    case 'gray_wolf':    return drawGrayWolf(G, C, ent.x, ent.y, o);
    case 'big_tree':     return drawBigTree(G, C, ent.x, ent.y, o);
    case 'apple_basket': return drawAppleBasket(G, C, ent.x, ent.y, o);
    case 'seed':         return drawSeed(G, C, ent.x, ent.y, o);
    case 'sun':          return drawSun(G, C, ent.x, ent.y, o);
    case 'cloud':        return drawCloud(G, C, ent.x, ent.y, o);
    case 'flower':       return drawFlower(G, C, ent.x, ent.y, o);
    case 'tree':         return drawTree(G, C, ent.x, ent.y, o);
    case 'bird':         return drawBird(G, C, ent.x, ent.y, o);
    case 'apple':        return drawApple(G, C, ent.x, ent.y, o);
    case 'house':        return drawHouse(G, C, ent.x, ent.y, o);
    case 'rainbow':      return drawRainbow(G, C, ent.x, ent.y, o);
    case 'star':         return drawStar(G, C, ent.x, ent.y, o);
    case 'watering_can': return drawWateringCan(G, C, ent.x, ent.y, o);
    case 'fence':        return drawFence(G, C, ent.x, ent.y, o);
    case 'bush':         return drawBush(G, C, ent.x, ent.y, o);
  }
}
