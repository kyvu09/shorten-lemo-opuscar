// Model sheet renderer for Step 4 (Prove the Look): ?test=model&page=leo or ?test=model&page=cast
import { W, H, CAM, BOIL, WMUL, layer, clear, text, line } from './crayon.js';
import { group, clearGroup } from './rig.js';
import { drawLeo, drawSeed, drawSun, drawCloud, drawFlower } from './chars.js';
import { PAPER, C } from './pal.js';

export function renderModelSheet(comp, page) {
  CAM.x = W / 2; CAM.y = H / 2; CAM.s = 1;
  BOIL.step = 2; BOIL.amp = 0.7; WMUL.k = 0.88;
  comp.paperCam(W / 2, H / 2, 1);
  comp.begin(PAPER);

  const G = group(); clearGroup(G);
  const T = layer(); clear(T);

  if (page === 'leo') {
    text(T, 'MODEL SHEET · LEO (Turnaround, Expressions & Key Poses)', 960, 74, { font: 'Mali', weight: 700, size: 42, col: C.ink, seed: 1 });
    line(T, [[120, 96], [1800, 96]], { col: C.ochre, w: 4, p: 0.65, seed: 2 });

    // Top row: 4 poses + views
    const row1 = [
      { x: 250, y: 520, sc: 0.95, view: 'front', expr: 'happy', pose: 'stand', lbl: 'Front · Happy' },
      { x: 640, y: 520, sc: 0.95, view: 'r34', expr: 'curious', pose: 'crouch', lbl: '3/4 R · Curious' },
      { x: 1050, y: 520, sc: 0.95, view: 'r34', expr: 'idea', pose: 'idea', lbl: 'Idea (Yellow Crayon)' },
      { x: 1520, y: 520, sc: 0.95, view: 'l34', expr: 'hot', pose: 'hot', lbl: '3/4 L · Too Hot!' },
    ];
    row1.forEach((p, i) => {
      drawLeo(G, p.x, p.y, { sc: p.sc, view: p.view, expr: p.expr, pose: p.pose, seed: 10 + i * 25 });
      text(T, p.lbl, p.x, 565, { font: 'Patrick Hand', size: 30, col: C.ink, seed: 20 + i });
    });

    // Bottom row: key action poses
    const row2 = [
      { x: 270, y: 990, sc: 0.95, view: 'r34', expr: 'idea', pose: 'ideaBlue', lbl: 'Blue Crayon Idea' },
      { x: 690, y: 990, sc: 0.95, view: 'r34', expr: 'happy', pose: 'cloudA', lbl: 'Drawing Cloud' },
      { x: 1130, y: 990, sc: 0.95, view: 'front', expr: 'amazed', pose: 'rain', lbl: 'Catching Rain' },
      { x: 1570, y: 990, sc: 0.95, view: 'r34', expr: 'excited', pose: 'jumpA', lbl: 'Joy Jump!' },
    ];
    row2.forEach((p, i) => {
      drawLeo(G, p.x, p.y, { sc: p.sc, view: p.view, expr: p.expr, pose: p.pose, seed: 110 + i * 25 });
      text(T, p.lbl, p.x, 1038, { font: 'Patrick Hand', size: 30, col: C.ink, seed: 30 + i });
    });
  } else {
    text(T, 'CAST & VOCABULARY PROPS · SEED · SUN · CLOUD · FLOWER', 960, 74, { font: 'Mali', weight: 700, size: 42, col: C.ink, seed: 40 });
    line(T, [[120, 96], [1800, 96]], { col: C.ochre, w: 4, p: 0.65, seed: 41 });

    // Row 1: Seed 4 states
    const seeds = [
      { x: 230, y: 310, mood: 'sleep', lbl: 'SEED · Sleep' },
      { x: 520, y: 310, mood: 'hot', lbl: 'SEED · Too Hot' },
      { x: 810, y: 310, mood: 'wake', lbl: 'SEED · Drinking' },
      { x: 1100, y: 310, mood: 'sprout', lbl: 'SEED · Sprout!' },
    ];
    seeds.forEach((s, i) => {
      drawSeed(G, s.x, s.y, { sc: 1.15, mood: s.mood, seed: 120 + i * 20 });
      text(T, s.lbl, s.x, 420, { font: 'Patrick Hand', size: 28, col: C.ink, seed: 50 + i });
    });

    // Sun normal & blazing (cleanly separated from flower!)
    drawSun(G, 1580, 290, { sc: 0.78, heat: 0.0, seed: 200 });
    text(T, 'SUN · Warm', 1580, 445, { font: 'Patrick Hand', size: 28, col: C.ink, seed: 55 });

    // Row 2: Blazing Sun, Cloud (puff + wink), Tall Red Flower
    drawSun(G, 300, 770, { sc: 0.85, heat: 0.95, seed: 240 });
    text(T, 'SUN · Too Hot!', 300, 965, { font: 'Patrick Hand', size: 28, col: C.ink, seed: 56 });

    drawCloud(G, 860, 750, { sc: 0.95, mood: 'puff', seed: 300 });
    text(T, 'CLOUD · Puffing Rain', 860, 895, { font: 'Patrick Hand', size: 28, col: C.ink, seed: 57 });

    drawFlower(G, 1540, 995, { sc: 0.88, stemP: 1, leafP: 1, petalP: 1, seed: 400 });
    text(T, 'FLOWER · Red Bloom', 1540, 1045, { font: 'Patrick Hand', size: 28, col: C.ink, seed: 58 });
  }

  comp.group(G);
  comp.crayon(T.c);
  comp.finish({ vig: 0.16, emb: 0.54 });
}
