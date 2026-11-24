#!/usr/bin/env node
/**
 * Automated Layout QA Audit for Crayon Picture Book films:
 *   node .agents/skills/crayon-story-director/scripts/layout_check.mjs <films/slug> [--size 1920x1080] [--step 0.5] [--strict]
 * Checks across the whole timeline (using pure window.LAYOUT(t), zero WebGL overhead):
 *   1. Text (title / vocabulary tag knock-out pad) overlapping character head/ears/body
 *   2. Text colliding with another text block
 *   3. Lingering partially clipped title or tag at viewport edges [0, W] x [0, H]
 */
import { openDemo, closeServer, requireDemo, takeSize } from '../../../../core/render/page.mjs';

const args = process.argv.slice(2);
const { w: VW, h: VH } = takeSize(args);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const strict = args.includes('--strict');
const dir = args[0];
requireDemo(dir);
const STEP = +opt('--step', 0.5);

const { browser, page } = await openDemo(dir, { w: VW, h: VH, gl: false });
const report = await page.evaluate(({ STEP }) => {
  if (typeof window.LAYOUT !== 'function') return { noLayout: true };
  const DUR = Number(window.DUR) || 0;
  const overlaps = new Map();
  const textHits = new Map();
  const clips = new Map();

  const inter = (a, b) => {
    const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return (ix > 0 && iy > 0) ? { ix, iy } : null;
  };
  const inView = (b, W, H) => b.x1 > 0 && b.x0 < W && b.y1 > 0 && b.y0 < H;
  const rec = (map, key, t, detail) => {
    const cur = map.get(key);
    if (!cur) map.set(key, { key, t0: t, t1: t, count: 1, detail });
    else { cur.t1 = t; cur.count++; }
  };

  for (let t = 0; t <= DUR; t += STEP) {
    const L = window.LAYOUT(t);
    if (!L || L.fridgeP > 0.05) continue;
    const { w: W, h: H, texts, actors } = L;

    for (let i = 0; i < texts.length; i++) {
      const tx = texts[i];
      if (!inView(tx, W, H)) continue;

      // 1. Lingering edge clipping (partially inside & partially outside viewport)
      const clipL = tx.x0 < -6 && tx.x1 > 18;
      const clipR = tx.x1 > W + 6 && tx.x0 < W - 18;
      const clipT = tx.y0 < -6 && tx.y1 > 18;
      const clipB = tx.y1 > H + 6 && tx.y0 < H - 18;
      if (clipL || clipR || clipT || clipB) {
        const sides = [clipL && 'left', clipR && 'right', clipT && 'top', clipB && 'bottom'].filter(Boolean).join('+');
        rec(clips, `${tx.id}:${sides}`, t, `${tx.id} ("${tx.text}") clipped at ${sides} edge (box ${Math.round(tx.x0)}..${Math.round(tx.x1)}, ${Math.round(tx.y0)}..${Math.round(tx.y1)})`);
      }

      // 2. Text vs Character head/ears/body overlap
      for (const act of actors) {
        if (!inView(act, W, H)) continue;
        const ov = inter(tx, act);
        if (ov && ov.ix >= 14 && ov.iy >= 14) {
          rec(overlaps, `${tx.id}::${act.id}`, t, `${tx.id} ("${tx.text}") overlaps ${act.id} (${act.type}) by ${Math.round(ov.ix)}x${Math.round(ov.iy)}px`);
        }
      }

      // 3. Text vs Text overlap
      for (let j = i + 1; j < texts.length; j++) {
        const tx2 = texts[j];
        if (!inView(tx2, W, H)) continue;
        const ov = inter(tx, tx2);
        if (ov && ov.ix >= 10 && ov.iy >= 10) {
          rec(textHits, `${tx.id}::${tx2.id}`, t, `${tx.id} ("${tx.text}") collides with ${tx2.id} ("${tx2.text}") by ${Math.round(ov.ix)}x${Math.round(ov.iy)}px`);
        }
      }
    }
  }

  const persist = (map, minHits) => [...map.values()].filter(x => x.count >= minHits);
  return {
    dur: DUR,
    charOverlaps: persist(overlaps, Math.max(2, Math.round(1.0 / STEP))),
    textOverlaps: persist(textHits, Math.max(2, Math.round(1.0 / STEP))),
    edgeClips:    persist(clips,    Math.max(3, Math.round(1.5 / STEP))),
  };
}, { STEP });

await browser.close();
closeServer();

if (report.noLayout) {
  console.log('LAYOUT QA: skipped (page does not expose window.LAYOUT)');
  process.exit(0);
}

const total = report.charOverlaps.length + report.textOverlaps.length + report.edgeClips.length;
if (total === 0) {
  console.log(`LAYOUT QA: OK — 0 text/character overlaps, 0 text collisions, 0 lingering edge clips (${report.dur.toFixed(1)}s checked)`);
  process.exit(0);
}

console.log(`LAYOUT QA: ${total} warning(s) found — inspect and adjust tag/title positions in storyboard.json:`);
for (const x of report.charOverlaps) console.log(`  [CHAR OVERLAP] ${x.t0.toFixed(1)}s..${x.t1.toFixed(1)}s  ${x.detail}`);
for (const x of report.textOverlaps) console.log(`  [TEXT COLLIDE] ${x.t0.toFixed(1)}s..${x.t1.toFixed(1)}s  ${x.detail}`);
for (const x of report.edgeClips)    console.log(`  [EDGE CLIP]    ${x.t0.toFixed(1)}s..${x.t1.toFixed(1)}s  ${x.detail}`);
process.exit(strict ? 1 : 0);
