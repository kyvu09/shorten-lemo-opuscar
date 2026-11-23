// Original picture-book cast for "One Little Seed":
// Leo (5-year-old gardener, ~2.5 heads tall), Little Seed, Smiling Sun, Puffy Cloud, Tall Red Flower.
// Follows STYLE.md: child-logic proportions, cocoa outlines (never black), hair outlined on outer edge only,
// dot eyes with white-wax catchlights, tube limbs + mitten hands, knock-out backing behind every figure.
import { clamp, lerp, hash } from '/core/lib.js';
import { line, fill, dab, ellipse, handCircle, bez, smooth, xf } from './crayon.js';
import { part, tube, curve, erase, knock } from './rig.js';
import { C } from './pal.js';

const OL = (w = 7, seed = 1, extra = {}) => ({ col: C.ink, w, p: 0.9, seed, wob: 1.0, ...extra });

// Small helper: chunky wax crayon held in Leo's mitten hand
function drawHeldCrayon(G, hx, hy, ang, col, sc, seed) {
  const len = 56 * sc, wid = 13 * sc;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const pt = (u, v) => [hx + u * ca - v * sa, hy + u * sa + v * ca];
  const body = [pt(-len * 0.35, -wid * 0.5), pt(len * 0.45, -wid * 0.5), pt(len * 0.72, 0), pt(len * 0.45, wid * 0.5), pt(-len * 0.35, wid * 0.5)];
  part(G, body, { col, p: 0.88, gap: 5, w: 7, over: 2, seed: seed + 41 }, OL(4.5, seed + 42));
  // tiny paper wrapper band
  const band = [pt(-len * 0.08, -wid * 0.52), pt(len * 0.16, -wid * 0.52), pt(len * 0.16, wid * 0.52), pt(-len * 0.08, wid * 0.52)];
  line(G.l, [band[0], band[3]], OL(3.5, seed + 43));
  line(G.l, [band[1], band[2]], OL(3.5, seed + 44));
}

// ——— LEO: 5-year-old boy in red jumper, blue dungarees, yellow rain boots ———
// Origin (x, y) = center of feet on ground. Total height ≈ 355 * sc (~2.5 heads tall: head diameter ≈ 140 * sc).
export function drawLeo(G, x, y, o = {}) {
  const sc = o.sc ?? 1;
  const view = o.view || 'r34';       // 'front' | 'r34' | 'l34'
  const expr = o.expr || 'happy';     // 'curious' | 'happy' | 'idea' | 'hot' | 'uhoh' | 'excited' | 'amazed'
  const pose = o.pose || 'stand';     // 'stand' | 'crouch' | 'idea' | 'colourA' | 'colourB' | 'hot' | 'ideaBlue' | 'cloudA' | 'cloudB' | 'rain' | 'jumpA' | 'jumpB'
  const seed = o.seed ?? 10;
  const drawP = o.draw ?? 1;
  if (drawP <= 0) return;

  const flip = view === 'l34' ? -1 : 1;
  const faceShift = view === 'front' ? 0 : 12 * flip * sc;

  // Pose-driven body transform & limb targets (in local coords before x,y & sc)
  let bodyDx = 0, bodyDy = 0, bodyTilt = 0, headTilt = 0;
  let lFoot = [-28, 0], rFoot = [28, 0];
  let lKnee = [-26, -42], rKnee = [26, -42];
  let lHand = [-74, -142], lElb = [-60, -172];
  let rHand = [76, -142], rElb = [60, -172];
  let crayonCol = null, crayonAng = -0.6, crayonHand = 'r';

  if (pose === 'crouch') {
    bodyDy = 24; bodyTilt = 0.14 * flip; headTilt = 0.16 * flip;
    lKnee = [-34, -36]; rKnee = [36, -34];
    lHand = [-50, -96]; lElb = [-58, -138];
    rHand = [54, -92]; rElb = [60, -136];
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
    // Keep left arm fanning left and right arm wiping right brow regardless of flip so arms never cross neck!
    bodyDy = 10; bodyTilt = -0.04 * flip; headTilt = 0.08 * flip;
    lHand = [-88, -192]; lElb = [-68, -160];   // fanning hand on left
    rHand = [48, -254];  rElb = [72, -206];    // wiping brow on right
    crayonCol = null;
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
    lHand = [-102, -214]; lElb = [-70, -180];
    rHand = [104, -218]; rElb = [72, -182];
  } else if (pose === 'jumpA') {
    bodyDy = -48; bodyTilt = -0.04 * flip; headTilt = -0.12 * flip;
    lFoot = [-44, -36]; rFoot = [46, -42];
    lKnee = [-36, -78]; rKnee = [38, -82];
    lHand = [-92, -310]; lElb = [-72, -242];
    rHand = [96, -312]; rElb = [74, -244];
  } else if (pose === 'jumpB') {
    bodyDy = -16; bodyTilt = 0.04 * flip; headTilt = -0.04 * flip;
    lFoot = [-32, -4]; rFoot = [34, -4];
    lKnee = [-34, -50]; rKnee = [36, -50];
    lHand = [-96, -246]; lElb = [-68, -206];
    rHand = [98, -250]; rElb = [70, -208];
  }

  const L = (lx, ly) => {
    const cx = lx + bodyDx, cy = ly + bodyDy;
    const c = Math.cos(bodyTilt), s = Math.sin(bodyTilt);
    const rx = cx * c - (cy + 140) * s;
    const ry = cx * s + (cy + 140) * c - 140;
    return [x + rx * sc, y + ry * sc];
  };
  const P = (lx, ly) => [x + lx * sc, y + ly * sc];

  // 1. Legs & sunshine-yellow rain boots (drawn behind jumper)
  const drawLeg = (hipL, kneeL, footL, sideSeed, bootDir) => {
    const legPts = curve([L(hipL[0], hipL[1]), P(kneeL[0], kneeL[1]), P(footL[0], footL[1] - 18)], 5);
    const legPoly = tube(legPts, 24 * sc, 22 * sc);
    part(G, legPoly, { col: C.sky, p: 0.8, gap: 8, w: 9, over: 4, seed: sideSeed, ang: 0.4 }, OL(6, sideSeed + 1));

    // Chunky yellow rain boot
    const fx = x + footL[0] * sc, fy = y + footL[1] * sc;
    const d = bootDir;
    const boot = smooth([
      [fx - 15 * d * sc, fy - 42 * sc],
      [fx + 14 * d * sc, fy - 42 * sc],
      [fx + 18 * d * sc, fy - 18 * sc],
      [fx + 38 * d * sc, fy - 10 * sc],
      [fx + 35 * d * sc, fy + 4 * sc],
      [fx - 18 * d * sc, fy + 4 * sc],
      [fx - 20 * d * sc, fy - 18 * sc]
    ], 5, true);
    part(G, boot, { col: C.yellow, p: 0.88, gap: 7, w: 9, over: 4, seed: sideSeed + 2, ang: -0.3 }, OL(6.5, sideSeed + 3));
    // boot cuff line
    line(G.l, [[fx - 17 * d * sc, fy - 35 * sc], [fx + 15 * d * sc, fy - 35 * sc]], OL(4.5, sideSeed + 4));
  };
  drawLeg([-24, -104], lKnee, lFoot, seed + 1, view === 'l34' ? -1 : -0.8);
  drawLeg([24, -104], rKnee, rFoot, seed + 7, view === 'l34' ? -1 : 1);

  // 2. Back arm (drawn behind torso when reaching across)
  const drawArm = (shL, elbL, handL, sideSeed, hasCrayon) => {
    const sh = L(shL[0], shL[1]);
    const elb = L(elbL[0], elbL[1]);
    const hnd = L(handL[0], handL[1]);
    const armPts = curve([sh, elb, hnd], 5);
    const armPoly = tube(armPts, 28 * sc, 22 * sc);
    part(G, armPoly, { col: C.red, p: 0.86, gap: 8, w: 9, over: 4, seed: sideSeed, ang: 0.7 }, OL(6, sideSeed + 1));

    // Mitten hand
    const mPoly = handCircle(hnd[0], hnd[1], 17 * sc, sideSeed + 2, 0.08, 22);
    part(G, mPoly, { col: C.peach, p: 0.85, gap: 6, w: 8, over: 3, seed: sideSeed + 3 }, OL(5.5, sideSeed + 4));

    if (hasCrayon && crayonCol) {
      drawHeldCrayon(G, hnd[0], hnd[1], crayonAng, crayonCol, sc, sideSeed + 10);
    }
  };

  // Draw back arm first
  drawArm([-46, -184], lElb, lHand, seed + 14, crayonHand === 'l');

  // 3. Torso: cozy apple-red knitted jumper + sky-blue dungaree bib/shorts
  const jumper = smooth([
    L(-52, -196), L(0, -204), L(52, -196),
    L(60, -138), L(56, -102), L(0, -96), L(-56, -102), L(-60, -138)
  ], 6, true);
  part(G, jumper, { col: C.red, p: 0.88, gap: 9, w: 10.5, over: 5, seed: seed + 20, ang: 0.55, cross: true, crossP: 0.45 }, OL(7, seed + 21));

  // Sky-blue dungaree shorts & front bib (childlike cozy gardener outfit!)
  const shorts = smooth([
    L(-52, -138), L(52, -138), L(56, -98), L(10, -94), L(0, -106), L(-10, -94), L(-56, -98)
  ], 5, true);
  part(G, shorts, { col: C.sky, p: 0.84, gap: 8.5, w: 9.5, over: 4, seed: seed + 22, ang: -0.45 }, OL(6.5, seed + 23));

  // Dungaree straps + wooden ochre buttons
  const strapL = [L(-32, -194), L(-28, -136)];
  const strapR = [L(32, -194), L(28, -136)];
  line(G.f, strapL, { col: C.sky, w: 13 * sc, p: 0.85, seed: seed + 24 });
  line(G.l, strapL, OL(4.5, seed + 25));
  line(G.f, strapR, { col: C.sky, w: 13 * sc, p: 0.85, seed: seed + 26 });
  line(G.l, strapR, OL(4.5, seed + 27));
  const bL = L(-28, -136), bR = L(28, -136);
  dab(G.f, bL[0], bL[1], 7 * sc, { col: C.yellow, p: 0.9, seed: seed + 28 });
  dab(G.f, bR[0], bR[1], 7 * sc, { col: C.yellow, p: 0.9, seed: seed + 29 });

  // Small front pocket on dungarees
  const pock = smooth([L(-20, -130), L(20, -130), L(18, -108), L(0, -102), L(-18, -108)], 4, true);
  line(G.l, pock, OL(4.5, seed + 30));

  // 4. Front arm (drawn over torso so raised/drawing arm reads clearly!)
  drawArm([46, -184], rElb, rHand, seed + 32, crayonHand === 'r');

  // 5. Head (round child proportion ~2.5 heads tall!)
  const hc = L(0, -276);
  const Hpt = (lx, ly) => {
    const c = Math.cos(headTilt), s = Math.sin(headTilt);
    return [hc[0] + (lx * c - ly * s) * sc, hc[1] + (lx * s + ly * c) * sc];
  };

  // Little ears
  const earL = handCircle(...Hpt(-72, 2), 14 * sc, seed + 49, 0.08, 16);
  const earR = handCircle(...Hpt(72, 2), 14 * sc, seed + 50, 0.08, 16);
  part(G, earL, { col: C.peach, p: 0.82, gap: 6, w: 7, over: 2, seed: seed + 51 }, OL(5.5, seed + 52));
  part(G, earR, { col: C.peach, p: 0.82, gap: 6, w: 7, over: 2, seed: seed + 53 }, OL(5.5, seed + 54));

  // Round head shape
  const headPoly = ellipse(0, 0, 74, 68, 36).map(([px, py]) => Hpt(px, py));
  part(G, headPoly, { col: C.peach, p: 0.78, gap: 9, w: 10, over: 4.5, seed: seed + 55, ang: 0.4 }, OL(7, seed + 56));

  // 6. Tufted cocoa-brown hair mass:
  // CRITICAL STYLE RULE (STYLE.md §9): outline hair mass on OUTER EDGE ONLY — never a dark headband across forehead!
  const hairOuter = smooth([
    Hpt(-72, -10), Hpt(-78, -44), Hpt(-54, -74), Hpt(-18, -84),
    Hpt(-6, -102), Hpt(14, -84), Hpt(34, -96), Hpt(48, -76),
    Hpt(74, -52), Hpt(74, -8),
    Hpt(58, -26), Hpt(34, -34), Hpt(12, -26), Hpt(-8, -36), Hpt(-34, -28), Hpt(-58, -24)
  ], 5, true);
  // Fill the hair mass cleanly (erasing forehead top outline underneath it)
  erase(G.l, hairOuter);
  knock(G, hairOuter);
  fill(G.f, hairOuter, { col: C.ink, p: 0.9, gap: 7, w: 9, over: 3.5, seed: seed + 58, ang: 0.8, cross: true, crossP: 0.55 });
  // Outer crown outline ONLY (stops before forehead edge!)
  const crownEdge = smooth([
    Hpt(-72, -10), Hpt(-78, -44), Hpt(-54, -74), Hpt(-18, -84),
    Hpt(-6, -102), Hpt(14, -84), Hpt(34, -96), Hpt(48, -76),
    Hpt(74, -52), Hpt(74, -8)
  ], 5, false);
  line(G.l, crownEdge, OL(6.5, seed + 59));

  // 7. Face features: coral pink cheeks, dot eyes + white-wax catchlight, expressive brows & mouth
  const fx = faceShift / sc;
  const chL = Hpt(fx - 38, 18), chR = Hpt(fx + 38, 18);
  const blushP = expr === 'hot' ? 0.92 : 0.65;
  const blushCol = expr === 'hot' ? C.red : C.pink;
  dab(G.f, chL[0], chL[1], (expr === 'hot' ? 20 : 15) * sc, { col: blushCol, p: blushP, sq: 0.72, seed: seed + 60 });
  dab(G.f, chR[0], chR[1], (expr === 'hot' ? 20 : 15) * sc, { col: blushCol, p: blushP, sq: 0.72, seed: seed + 61 });

  // Eyes
  const eL = Hpt(fx - 22, -2), eR = Hpt(fx + 22, -2);
  if (expr === 'excited') {
    // Happy curved laughing eyes (^ ^)
    line(G.l, curve([Hpt(fx - 32, 0), Hpt(fx - 22, -12), Hpt(fx - 12, 0)], 5), OL(6, seed + 62));
    line(G.l, curve([Hpt(fx + 12, 0), Hpt(fx + 22, -12), Hpt(fx + 32, 0)], 5), OL(6, seed + 63));
  } else {
    const er = (expr === 'amazed' || expr === 'idea' ? 9.5 : 8) * sc;
    dab(G.l, eL[0], eL[1], er, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 62 });
    dab(G.l, eR[0], eR[1], er, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 63 });
    // White-wax catchlights (signature Crayon Picture Book sparkle!)
    dab(G.l, eL[0] - 2.5 * sc, eL[1] - 3 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 64 });
    dab(G.l, eR[0] - 2.5 * sc, eR[1] - 3 * sc, 3.2 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 65 });
  }

  // Eyebrows (carefully checked per DIRECTOR.md §9: worried slopes DOWN outward, angry slopes DOWN inward!)
  if (expr === 'hot' || expr === 'uhoh') {
    // Worried/hot brows: inner ends high, outer ends drooping down!
    line(G.l, [Hpt(fx - 33, -15), Hpt(fx - 13, -24)], OL(4.8, seed + 66));
    line(G.l, [Hpt(fx + 13, -24), Hpt(fx + 33, -15)], OL(4.8, seed + 67));
  } else if (expr === 'idea' || expr === 'amazed') {
    // High lifted delighted arches
    line(G.l, curve([Hpt(fx - 32, -20), Hpt(fx - 22, -28), Hpt(fx - 12, -21)], 4), OL(4.5, seed + 66));
    line(G.l, curve([Hpt(fx + 12, -21), Hpt(fx + 22, -28), Hpt(fx + 32, -20)], 4), OL(4.5, seed + 67));
  } else if (expr === 'curious') {
    line(G.l, curve([Hpt(fx - 31, -18), Hpt(fx - 22, -22), Hpt(fx - 13, -18)], 4), OL(4.2, seed + 66));
    line(G.l, curve([Hpt(fx + 13, -20), Hpt(fx + 22, -26), Hpt(fx + 31, -19)], 4), OL(4.2, seed + 67));
  } else {
    // Gentle soft brows
    line(G.l, curve([Hpt(fx - 30, -18), Hpt(fx - 22, -22), Hpt(fx - 14, -18)], 4), OL(4.2, seed + 66));
    line(G.l, curve([Hpt(fx + 14, -18), Hpt(fx + 22, -22), Hpt(fx + 30, -18)], 4), OL(4.2, seed + 67));
  }

  // Tiny button nose
  line(G.l, curve([Hpt(fx - 2, 8), Hpt(fx + 4 * flip, 12), Hpt(fx - 1, 15)], 4), OL(4, seed + 68));

  // Mouth
  if (expr === 'hot' || expr === 'uhoh') {
    // Wavy distressed "phew/uh-oh" mouth
    line(G.l, curve([Hpt(fx - 16, 33), Hpt(fx - 6, 26), Hpt(fx + 6, 34), Hpt(fx + 16, 28)], 5), OL(5.2, seed + 69));
    // Sweat drop beside temple!
    if (expr === 'hot') {
      const sd = smooth([Hpt(fx + 52, -22), Hpt(fx + 60, -8), Hpt(fx + 52, 0), Hpt(fx + 44, -8)], 4, true);
      part(G, sd, { col: C.sky, p: 0.85, gap: 4, w: 6, over: 1, seed: seed + 70 }, OL(4, seed + 71));
    }
  } else if (expr === 'amazed') {
    const om = ellipse(0, 0, 11, 13, 18).map(([px, py]) => Hpt(fx + px, 30 + py));
    part(G, om, { col: C.pink, p: 0.78, gap: 4, w: 5, over: 1, seed: seed + 69 }, OL(5, seed + 70));
  } else if (expr === 'curious') {
    line(G.l, curve([Hpt(fx - 10, 29), Hpt(fx, 32), Hpt(fx + 11, 27)], 4), OL(5, seed + 69));
  } else if (expr === 'excited' || expr === 'idea') {
    // Big joyful open grin
    const sm = smooth([Hpt(fx - 20, 24), Hpt(fx, 26), Hpt(fx + 20, 24), Hpt(fx + 14, 42), Hpt(fx, 46), Hpt(fx - 14, 42)], 4, true);
    part(G, sm, { col: C.pink, p: 0.82, gap: 4, w: 6, over: 1, seed: seed + 69 }, OL(5.2, seed + 70));
  } else {
    // Warm happy storybook smile
    line(G.l, curve([Hpt(fx - 18, 25), Hpt(fx, 38), Hpt(fx + 18, 25)], 5), OL(5.4, seed + 69));
  }
}

// ——— THE LITTLE SEED (plump ochre acorn-seed tucked underground) ———
export function drawSeed(G, x, y, o = {}) {
  const sc = o.sc ?? 1;
  const mood = o.mood || 'sleep';   // 'sleep' | 'hot' | 'wake' | 'sprout'
  const drawP = o.draw ?? 1;
  const fillP = o.fillP ?? 1;
  const seed = o.seed ?? 120;
  if (drawP <= 0) return;

  // Plump teardrop seed body
  const body = smooth([
    [x, y - 48 * sc],
    [x + 34 * sc, y - 16 * sc],
    [x + 40 * sc, y + 20 * sc],
    [x + 22 * sc, y + 42 * sc],
    [x, y + 46 * sc],
    [x - 22 * sc, y + 42 * sc],
    [x - 40 * sc, y + 20 * sc],
    [x - 34 * sc, y - 16 * sc]
  ], 6, true);

  knock(G, body);
  if (fillP > 0) {
    fill(G.f, body, { col: C.ochre, p: 0.86, gap: 7.5, w: 9.5, over: 4.5, seed: seed + 1, ang: 0.45, draw: fillP });
    // warm cozy belly stripe
    const stripe = smooth([[x - 14 * sc, y - 24 * sc], [x - 20 * sc, y + 24 * sc]], 4, false);
    if (fillP > 0.7) line(G.f, stripe, { col: C.yellow, w: 8 * sc, p: 0.45, seed: seed + 2 });
  }
  line(G.l, body, OL(6.5, seed + 3, { draw: drawP, closed: true }));

  if (drawP < 0.85) return;

  // Rosy tiny cheeks
  dab(G.f, x - 21 * sc, y + 14 * sc, 9 * sc, { col: mood === 'hot' ? C.red : C.pink, p: 0.75, sq: 0.7, seed: seed + 4 });
  dab(G.f, x + 21 * sc, y + 14 * sc, 9 * sc, { col: mood === 'hot' ? C.red : C.pink, p: 0.75, sq: 0.7, seed: seed + 5 });

  if (mood === 'sleep') {
    // Peaceful closed sleeping eyes (◡ ◡)
    line(G.l, curve([[x - 22 * sc, y + 2 * sc], [x - 14 * sc, y + 10 * sc], [x - 6 * sc, y + 2 * sc]], 4), OL(5, seed + 6));
    line(G.l, curve([[x + 6 * sc, y + 2 * sc], [x + 14 * sc, y + 10 * sc], [x + 22 * sc, y + 2 * sc]], 4), OL(5, seed + 7));
    line(G.l, curve([[x - 6 * sc, y + 20 * sc], [x, y + 24 * sc], [x + 6 * sc, y + 20 * sc]], 4), OL(4, seed + 8));
  } else if (mood === 'hot') {
    // Squinting tightly (> <) under a tiny dirt blanket!
    line(G.l, [[x - 22 * sc, y - 2 * sc], [x - 9 * sc, y + 5 * sc], [x - 22 * sc, y + 11 * sc]], OL(5, seed + 6));
    line(G.l, [[x + 22 * sc, y - 2 * sc], [x + 9 * sc, y + 5 * sc], [x + 22 * sc, y + 11 * sc]], OL(5, seed + 7));
    line(G.l, curve([[x - 10 * sc, y + 24 * sc], [x, y + 18 * sc], [x + 10 * sc, y + 24 * sc]], 4), OL(4.5, seed + 8));
    // Little soil blanket pulled over top of head
    const blk = smooth([[x - 42 * sc, y - 6 * sc], [x - 26 * sc, y - 30 * sc], [x, y - 34 * sc], [x + 26 * sc, y - 30 * sc], [x + 42 * sc, y - 6 * sc], [x + 18 * sc, y - 14 * sc], [x - 18 * sc, y - 14 * sc]], 4, true);
    part(G, blk, { col: C.ochre, p: 0.72, gap: 6, w: 7, over: 2, seed: seed + 9 }, OL(5, seed + 10));
  } else {
    // Wide-awake sparkling eyes (wake or sprout)!
    dab(G.l, x - 14 * sc, y + 2 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 6 });
    dab(G.l, x + 14 * sc, y + 2 * sc, 7.5 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4, over: 0, seed: seed + 7 });
    dab(G.l, x - 16 * sc, y - 0.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 8 });
    dab(G.l, x + 12 * sc, y - 0.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 9 });
    // Big happy smile
    line(G.l, curve([[x - 13 * sc, y + 18 * sc], [x, y + 29 * sc], [x + 13 * sc, y + 18 * sc]], 5), OL(5, seed + 10));
  }

  // Sprouting little baby green shoot cracking out of top!
  const sp = o.sproutP ?? (mood === 'sprout' ? 1 : 0);
  if (sp > 0) {
    const stemH = 66 * sc * sp;
    const stem = curve([[x, y - 42 * sc], [x - 6 * sc, y - 42 * sc - stemH * 0.5], [x + 3 * sc, y - 42 * sc - stemH]], 5);
    line(G.l, stem, { col: C.green, w: 10 * sc, p: 0.92, seed: seed + 15 });
    line(G.l, stem, OL(4.5, seed + 16));
    if (sp > 0.45) {
      const lp = clamp((sp - 0.45) / 0.55);
      const top = [x + 3 * sc, y - 42 * sc - stemH];
      const l1 = smooth([top, [top[0] - 28 * lp * sc, top[1] - 22 * lp * sc], [top[0] - 34 * lp * sc, top[1] + 2 * lp * sc], [top[0] - 8 * lp * sc, top[1] + 6 * lp * sc]], 4, true);
      const l2 = smooth([top, [top[0] + 28 * lp * sc, top[1] - 24 * lp * sc], [top[0] + 34 * lp * sc, top[1] + 2 * lp * sc], [top[0] + 8 * lp * sc, top[1] + 6 * lp * sc]], 4, true);
      part(G, l1, { col: C.green, p: 0.88, gap: 6, w: 7, over: 2, seed: seed + 17 }, OL(4.5, seed + 18));
      part(G, l2, { col: C.green, p: 0.88, gap: 6, w: 7, over: 2, seed: seed + 19 }, OL(4.5, seed + 20));
    }
  }
}

// ——— THE SMILING SUN (big child-drawn sun with rays, rosy cheeks, heat-blaze state) ———
export function drawSun(G, x, y, o = {}) {
  const sc = o.sc ?? 1;
  const drawP = o.draw ?? 1;
  const fillP = o.fillP ?? 1;
  const heat = o.heat ?? 0;         // 0 = sunny warm, 1 = blazing TOO HOT!
  const seed = o.seed ?? 200;
  const rot = o.rot ?? 0;
  if (drawP <= 0) return;

  const R = 104 * sc;
  const nRays = 12;
  // Rays drawn outside body
  for (let i = 0; i < nRays; i++) {
    const a = rot + (i / nRays) * Math.PI * 2;
    const r0 = R + 16 * sc;
    const r1 = R + (56 + (i % 2) * 24 + heat * 42) * sc;
    const rp = clamp((drawP - 0.35 - (i / nRays) * 0.45) / 0.2);
    if (rp <= 0) continue;
    const col = heat > 0.45 && i % 2 === 0 ? C.red : C.yellow;
    const p0 = [x + Math.cos(a) * r0, y + Math.sin(a) * r0];
    const pm = [x + Math.cos(a + 0.08 * Math.sin(i * 3)) * ((r0 + r1) * 0.5), y + Math.sin(a + 0.08 * Math.sin(i * 3)) * ((r0 + r1) * 0.5)];
    const p1 = [x + Math.cos(a) * r1, y + Math.sin(a) * r1];
    line(G.f, curve([p0, pm, p1], 4), { col, w: (13 + heat * 5) * sc, p: 0.85, seed: seed + i * 3, draw: rp });
    line(G.l, curve([p0, pm, p1], 4), OL(5.5, seed + i * 3 + 1, { draw: rp }));
  }

  // Sun disc
  const disc = handCircle(x, y, R, seed + 50, 0.1, 44);
  knock(G, disc);
  if (fillP > 0) {
    fill(G.f, disc, { col: C.yellow, p: 0.88, gap: 10, w: 12, over: 7, seed: seed + 51, ang: 0.52, draw: fillP, cross: true, crossP: 0.5 + heat * 0.3 });
    if (heat > 0.25) {
      // Extra warm red-orange heat scribble rim when too hot!
      fill(G.f, handCircle(x, y, R * 0.88, seed + 52, 0.05, 32), { col: C.red, p: 0.32 * heat, gap: 14, w: 10, over: 3, seed: seed + 53, ang: -0.6, draw: heat });
    }
  }
  line(G.l, disc, OL(7, seed + 54, { draw: clamp(drawP / 0.55) }));

  if (drawP < 0.65) return;
  // Face (objects with faces get big eyes + eyelids per STYLE.md §2!)
  dab(G.f, x - 44 * sc, y + 18 * sc, (18 + heat * 8) * sc, { col: heat > 0.4 ? C.red : C.pink, p: 0.72 + heat * 0.2, sq: 0.75, seed: seed + 55 });
  dab(G.f, x + 44 * sc, y + 18 * sc, (18 + heat * 8) * sc, { col: heat > 0.4 ? C.red : C.pink, p: 0.72 + heat * 0.2, sq: 0.75, seed: seed + 56 });

  const eyeR = 13 * sc;
  dab(G.l, x - 28 * sc, y - 10 * sc, eyeR, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 57 });
  dab(G.l, x + 28 * sc, y - 10 * sc, eyeR, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 58 });
  dab(G.l, x - 32 * sc, y - 14 * sc, 4.5 * sc, { col: C.white, p: 0.98, gap: 2, w: 3.5, over: 0, seed: seed + 59 });
  dab(G.l, x + 24 * sc, y - 14 * sc, 4.5 * sc, { col: C.white, p: 0.98, gap: 2, w: 3.5, over: 0, seed: seed + 60 });
  // Big cheerful eyelids/brows
  line(G.l, curve([[x - 42 * sc, y - 26 * sc], [x - 28 * sc, y - 34 * sc], [x - 14 * sc, y - 26 * sc]], 4), OL(5, seed + 61));
  line(G.l, curve([[x + 14 * sc, y - 26 * sc], [x + 28 * sc, y - 34 * sc], [x + 42 * sc, y - 26 * sc]], 4), OL(5, seed + 62));

  // Beaming grin (extra big open grin when blazing!)
  if (heat > 0.45) {
    const gr = smooth([[x - 28 * sc, y + 18 * sc], [x, y + 22 * sc], [x + 28 * sc, y + 18 * sc], [x + 20 * sc, y + 48 * sc], [x, y + 54 * sc], [x - 20 * sc, y + 48 * sc]], 4, true);
    part(G, gr, { col: C.red, p: 0.8, gap: 5, w: 6, over: 1, seed: seed + 63 }, OL(5.5, seed + 64));
  } else {
    line(G.l, curve([[x - 28 * sc, y + 22 * sc], [x, y + 42 * sc], [x + 28 * sc, y + 22 * sc]], 5), OL(6, seed + 63));
  }
}

// ——— THE PUFFY CLOUD (big friendly sky-blue & periwinkle cloud) ———
export function drawCloud(G, x, y, o = {}) {
  const sc = o.sc ?? 1;
  const drawP = o.draw ?? 1;
  const fillP = o.fillP ?? 1;
  const mood = o.mood || 'happy';   // 'happy' | 'puff' | 'wink'
  const seed = o.seed ?? 300;
  if (drawP <= 0) return;

  // Plump multi-lobed child-drawn cloud silhouette
  const pts = [
    [-168, 30], [-186, -8], [-152, -52], [-102, -58],
    [-64, -104], [8, -112], [68, -94],
    [118, -60], [174, -46], [190, 4], [156, 46],
    [88, 56], [10, 52], [-74, 58], [-142, 48]
  ].map(([px, py]) => [x + px * sc, y + py * sc]);
  const poly = smooth(pts, 5, true);

  knock(G, poly);
  if (fillP > 0) {
    // Upper sky-blue scribble fill (heavy enough to stay bright above sap wash)
    fill(G.f, poly, { col: C.sky, p: 0.86, gap: 11, w: 13, over: 7, seed: seed + 1, ang: 0.25, draw: fillP, cross: true, crossP: 0.45 });
    // Soft periwinkle rain-belly along bottom half
    const belly = smooth([
      [x - 150 * sc, y + 6 * sc], [x - 40 * sc, y + 12 * sc], [x + 70 * sc, y + 8 * sc], [x + 162 * sc, y + 8 * sc],
      [x + 148 * sc, y + 44 * sc], [x + 80 * sc, y + 54 * sc], [x - 70 * sc, y + 56 * sc], [x - 138 * sc, y + 44 * sc]
    ], 4, true);
    fill(G.f, belly, { col: C.rain, p: 0.72, gap: 10, w: 11, over: 4, seed: seed + 2, ang: -0.15, draw: clamp((fillP - 0.35) / 0.65) });
  }
  line(G.l, poly, OL(7.5, seed + 3, { draw: drawP, closed: true }));

  if (drawP < 0.8) return;

  // Big friendly picture-book cloud face
  const chR = (mood === 'puff' ? 24 : 16) * sc;
  dab(G.f, x - 56 * sc, y + 8 * sc, chR, { col: C.pink, p: 0.72, sq: 0.8, seed: seed + 4 });
  dab(G.f, x + 56 * sc, y + 8 * sc, chR, { col: C.pink, p: 0.72, sq: 0.8, seed: seed + 5 });

  // Eyes (left eye winks in 'wink' mood)
  if (mood === 'wink') {
    line(G.l, curve([[x - 46 * sc, y - 14 * sc], [x - 32 * sc, y - 24 * sc], [x - 18 * sc, y - 14 * sc]], 4), OL(6, seed + 6));
  } else {
    dab(G.l, x - 32 * sc, y - 16 * sc, 12 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 6 });
    dab(G.l, x - 36 * sc, y - 20 * sc, 4 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 7 });
  }
  dab(G.l, x + 32 * sc, y - 16 * sc, 12 * sc, { col: C.ink, p: 0.96, gap: 3, w: 5, over: 0.5, seed: seed + 8 });
  dab(G.l, x + 28 * sc, y - 20 * sc, 4 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 9 });

  // Mouth
  if (mood === 'puff') {
    // Cute round blowing 'o' mouth + little puffed cheek arcs!
    const om = ellipse(x, y + 12 * sc, 10 * sc, 10 * sc, 16);
    part(G, om, { col: C.pink, p: 0.8, gap: 4, w: 5, over: 0, seed: seed + 10 }, OL(5, seed + 11));
    line(G.l, curve([[x - 38 * sc, y - 2 * sc], [x - 48 * sc, y + 10 * sc], [x - 36 * sc, y + 22 * sc]], 4), OL(4.5, seed + 12));
    line(G.l, curve([[x + 38 * sc, y - 2 * sc], [x + 48 * sc, y + 10 * sc], [x + 36 * sc, y + 22 * sc]], 4), OL(4.5, seed + 13));
  } else {
    line(G.l, curve([[x - 24 * sc, y + 10 * sc], [x, y + 26 * sc], [x + 24 * sc, y + 10 * sc]], 5), OL(5.5, seed + 10));
  }
}

// ——— THE TALL RED FLOWER (grows continuously from seed underground up into the sunny sky!) ———
// Origin (x, y) = ground surface above seed; rootY (optional) connects stem straight down into the seed!
export function drawFlower(G, x, y, o = {}) {
  const sc = o.sc ?? 1;
  const stemP = clamp(o.stemP ?? 1);
  const leafP = clamp(o.leafP ?? 1);
  const petalP = clamp(o.petalP ?? 1);
  const sway = o.sway ?? 0;
  const seed = o.seed ?? 400;
  const rootY = o.rootY ?? (y + 8 * sc);
  if (stemP <= 0) return;

  const H = 435 * sc;
  const topX = x + (16 + sway * 18) * sc;
  const topY = y - H;
  const stemPts = curve([
    [x, rootY],
    [x - 4 * sc, (rootY + y) * 0.5],
    [x, y],
    [x - 24 * sc + sway * 5 * sc, y - H * 0.34],
    [x + 26 * sc + sway * 12 * sc, y - H * 0.68],
    [topX, topY]
  ], 8);

  // Sample partial stem for live upward growth
  const lim = Math.max(2, Math.floor(stemPts.length * stemP));
  const visStem = stemPts.slice(0, lim);
  const stemPoly = tube(visStem, 18 * sc, 13 * sc);
  part(G, stemPoly, { col: C.green, p: 0.9, gap: 6, w: 8, over: 3, seed: seed + 1, ang: 0.2 }, OL(6, seed + 2));

  // Two bouncy meadow-green leaves along stem (indices biased into above-ground portion)
  if (leafP > 0 && stemP > 0.48) {
    const p1 = stemPts[Math.floor(stemPts.length * 0.56)];
    const lp1 = clamp(leafP / 0.7);
    const leafL = smooth([
      p1,
      [p1[0] - 58 * lp1 * sc, p1[1] - 48 * lp1 * sc],
      [p1[0] - 118 * lp1 * sc, p1[1] - 16 * lp1 * sc],
      [p1[0] - 64 * lp1 * sc, p1[1] + 22 * lp1 * sc]
    ], 5, true);
    part(G, leafL, { col: C.green, p: 0.88, gap: 8, w: 10, over: 4, seed: seed + 5, ang: 0.7 }, OL(6, seed + 6));
    line(G.l, [p1, [p1[0] - 84 * lp1 * sc, p1[1] - 16 * lp1 * sc]], OL(4, seed + 7));
  }
  if (leafP > 0.25 && stemP > 0.72) {
    const p2 = stemPts[Math.floor(stemPts.length * 0.76)];
    const lp2 = clamp((leafP - 0.25) / 0.75);
    const leafR = smooth([
      p2,
      [p2[0] + 62 * lp2 * sc, p2[1] - 52 * lp2 * sc],
      [p2[0] + 124 * lp2 * sc, p2[1] - 14 * lp2 * sc],
      [p2[0] + 68 * lp2 * sc, p2[1] + 24 * lp2 * sc]
    ], 5, true);
    part(G, leafR, { col: C.green, p: 0.88, gap: 8, w: 10, over: 4, seed: seed + 8, ang: -0.7 }, OL(6, seed + 9));
    line(G.l, [p2, [p2[0] + 88 * lp2 * sc, p2[1] - 14 * lp2 * sc]], OL(4, seed + 10));
  }

  // Big blooming apple-red petals + smiling yellow center!
  if (petalP > 0 && stemP >= 0.96) {
    const cx = topX, cy = topY - 12 * sc;
    const nPet = 7;
    for (let i = 0; i < nPet; i++) {
      const pp = clamp((petalP - i * 0.06) / 0.58);
      if (pp <= 0) continue;
      const a = -Math.PI / 2 + (i / nPet) * Math.PI * 2 + sway * 0.08;
      const pr = 78 * pp * sc;
      const px = cx + Math.cos(a) * (62 * pp * sc);
      const py = cy + Math.sin(a) * (62 * pp * sc);
      const pet = ellipse(px, py, pr * 0.66, pr * 0.52, 22, 0, Math.PI * 2, a);
      part(G, pet, { col: C.red, p: 0.9, gap: 8.5, w: 10.5, over: 5, seed: seed + 20 + i * 3, ang: a + 0.4, cross: true, crossP: 0.45 }, OL(6.5, seed + 21 + i * 3));
    }

    // Smiling sunshine-yellow flower face
    const fcP = clamp(petalP / 0.65);
    const face = handCircle(cx, cy, 56 * fcP * sc, seed + 60, 0.1, 34);
    part(G, face, { col: C.yellow, p: 0.92, gap: 8, w: 10, over: 4, seed: seed + 61, ang: 0.5 }, OL(6.5, seed + 62));

    if (petalP > 0.55) {
      dab(G.f, cx - 26 * sc, cy + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, sq: 0.75, seed: seed + 63 });
      dab(G.f, cx + 26 * sc, cy + 10 * sc, 11 * sc, { col: C.pink, p: 0.78, sq: 0.75, seed: seed + 64 });
      dab(G.l, cx - 16 * sc, cy - 6 * sc, 8 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 65 });
      dab(G.l, cx + 16 * sc, cy - 6 * sc, 8 * sc, { col: C.ink, p: 0.96, gap: 2.5, w: 4.5, over: 0, seed: seed + 66 });
      dab(G.l, cx - 18.5 * sc, cy - 8.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 67 });
      dab(G.l, cx + 13.5 * sc, cy - 8.5 * sc, 3 * sc, { col: C.white, p: 0.98, gap: 2, w: 3, over: 0, seed: seed + 68 });
      line(G.l, curve([[cx - 16 * sc, cy + 12 * sc], [cx, cy + 25 * sc], [cx + 16 * sc, cy + 12 * sc]], 5), OL(5.2, seed + 69));
    }
  }
}
