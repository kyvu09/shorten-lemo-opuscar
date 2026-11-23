// Universal Crayon Book Model Sheet renderer (?test=model&page=dog|cat|wolf|forest_cast)
import { hexToRgb01 } from './gl.js';
import { VIEW, CAM, BOIL, WMUL, layer, clear, text, line } from './crayon.js';
import { group, clearGroup } from './rig.js';
import { drawEntity } from './library.js';
import { DEFAULT_CRAYONS } from './schema.js';

export function renderModelSheet(comp, project, page = 'forest_cast') {
  const W = VIEW.w, H = VIEW.h;
  const C = { ...DEFAULT_CRAYONS, ...(project?.palette?.crayons || {}) };
  const paperRgb = hexToRgb01(project?.palette?.paper || '#f4efe3');

  CAM.x = W / 2; CAM.y = H / 2; CAM.s = 1;
  BOIL.step = 2; BOIL.amp = 0.65; WMUL.k = 0.88;
  comp.paperCam(W / 2, H / 2, 1);
  comp.begin(paperRgb);

  const G = group(); clearGroup(G);
  const T = layer(); clear(T);

  const drawRow = (title, items, yLine = 96) => {
    text(T, title, W / 2, 70, { font: 'Mali', weight: 700, size: 42, col: C.ink, seed: 1 });
    line(T, [[110, yLine], [W - 110, yLine]], { col: C.ochre, w: 4.5, p: 0.68, seed: 2 });
    items.forEach((it, i) => {
      drawEntity(G, C, { type: it.type, x: it.x, y: it.y, scale: it.sc ?? 1, seed: 30 + i * 31 }, it.st, 0.35);
      text(T, it.lbl, it.x, it.ly ?? (it.y + 44), { font: 'Patrick Hand', size: 28, col: C.ink, seed: 50 + i });
    });
  };

  if (page === 'dog') {
    drawRow('MODEL SHEET · LITTLE DOG (Chú Chó Nhỏ — Turnaround, Expressions & Poses)', [
      { type: 'little_dog', x: 260,  y: 500, sc: 1.12, st: { view: 'front', expr: 'happy',   pose: 'stand' },       lbl: 'Front · Happy' },
      { type: 'little_dog', x: 700,  y: 500, sc: 1.12, st: { view: 'r34',   expr: 'happy',   pose: 'walk' },        lbl: '3/4 Right · Walk' },
      { type: 'little_dog', x: 1160, y: 500, sc: 1.12, st: { view: 'r34',   expr: 'excited', pose: 'wave' },        lbl: 'Wave · "Hello!"' },
      { type: 'little_dog', x: 1620, y: 500, sc: 1.12, st: { view: 'l34',   expr: 'scared',  pose: 'scared' },      lbl: '3/4 Left · Scared!' },
      { type: 'little_dog', x: 380,  y: 970, sc: 1.12, st: { view: 'r34',   expr: 'kind',    pose: 'offer_apple' }, lbl: 'Offer Apple · "Here you are!"' },
      { type: 'little_dog', x: 960,  y: 970, sc: 1.12, st: { view: 'r34',   expr: 'yummy',   pose: 'sit_eat' },     lbl: 'Sit & Eat · Picnic' },
      { type: 'little_dog', x: 1520, y: 970, sc: 1.12, st: { view: 'front', expr: 'excited', pose: 'cheer' },       lbl: 'Cheer · "Yay! New Friend!"' },
    ]);
  } else if (page === 'cat') {
    drawRow('MODEL SHEET · TABBY CAT (Chú Mèo Mướp — Turnaround, Expressions & Poses)', [
      { type: 'tabby_cat', x: 260,  y: 500, sc: 1.12, st: { view: 'front', expr: 'happy',   pose: 'stand' },       lbl: 'Front · Happy' },
      { type: 'tabby_cat', x: 700,  y: 500, sc: 1.12, st: { view: 'r34',   expr: 'curious', pose: 'walk' },        lbl: '3/4 Right · Walk' },
      { type: 'tabby_cat', x: 1160, y: 500, sc: 1.12, st: { view: 'l34',   expr: 'happy',   pose: 'wave' },        lbl: '3/4 Left · "Good morning!"' },
      { type: 'tabby_cat', x: 1620, y: 500, sc: 1.12, st: { view: 'r34',   expr: 'scared',  pose: 'scared' },      lbl: 'Scared · "I am scared!"' },
      { type: 'tabby_cat', x: 380,  y: 970, sc: 1.12, st: { view: 'r34',   expr: 'kind',    pose: 'offer_apple' }, lbl: 'Offer Apple · Kind' },
      { type: 'tabby_cat', x: 960,  y: 970, sc: 1.12, st: { view: 'l34',   expr: 'yummy',   pose: 'sit_eat' },     lbl: 'Sit & Eat · Picnic' },
      { type: 'tabby_cat', x: 1520, y: 970, sc: 1.12, st: { view: 'front', expr: 'excited', pose: 'cheer' },       lbl: 'Cheer · "Friends help!"' },
    ]);
  } else if (page === 'wolf') {
    drawRow('MODEL SHEET · GRAY WOLF (Bác Sói Xám — Big Outside, Kind Heart Inside)', [
      { type: 'gray_wolf', x: 260,  y: 525, sc: 0.86, st: { view: 'l34',   expr: 'mysterious', pose: 'peek' },       lbl: 'Peek · Scary Entrance' },
      { type: 'gray_wolf', x: 700,  y: 525, sc: 0.86, st: { view: 'front', expr: 'friendly',   pose: 'wave' },       lbl: 'Front · "Hello friends!"' },
      { type: 'gray_wolf', x: 1170, y: 525, sc: 0.86, st: { view: 'l34',   expr: 'laugh',      pose: 'laugh' },      lbl: 'Laugh · "Hahaha!"' },
      { type: 'gray_wolf', x: 1640, y: 525, sc: 0.86, st: { view: 'l34',   expr: 'sad',        pose: 'sad_hungry' }, lbl: 'Sad & Hungry (Droopy Ears)' },
      { type: 'gray_wolf', x: 360,  y: 985, sc: 0.86, st: { view: 'l34',   expr: 'surprised',  pose: 'stand' },      lbl: 'Surprised · "Really?!"' },
      { type: 'gray_wolf', x: 960,  y: 985, sc: 0.86, st: { view: 'l34',   expr: 'yummy',      pose: 'eat_apple' },  lbl: 'Eat Apple · "Yummy!"' },
      { type: 'gray_wolf', x: 1560, y: 985, sc: 0.86, st: { view: 'front', expr: 'happy',      pose: 'sit_eat' },    lbl: 'Picnic · Sit & Share' },
    ]);
  } else {
    // Full Cast Size Lineup + Forest Props!
    drawRow('CAST LINEUP & PROPS · LITTLE DOG · TABBY CAT · GRAY WOLF (Relative Scale)', [
      { type: 'little_dog',   x: 330,  y: 860, sc: 1.05, st: { view: 'r34',   expr: 'happy',    pose: 'wave' },       lbl: 'Little Dog (1.0×)', ly: 915 },
      { type: 'tabby_cat',    x: 680,  y: 860, sc: 1.02, st: { view: 'r34',   expr: 'happy',    pose: 'offer_apple' },lbl: 'Tabby Cat (0.96×)', ly: 915 },
      { type: 'apple_basket', x: 960,  y: 860, sc: 1.05, st: { mood: 'full' },                                        lbl: 'Apple Basket', ly: 915 },
      { type: 'gray_wolf',    x: 1270, y: 860, sc: 1.02, st: { view: 'l34',   expr: 'friendly', pose: 'wave' },       lbl: 'Gray Wolf (1.42× Taller)', ly: 915 },
      { type: 'big_tree',     x: 1650, y: 860, sc: 0.92, st: { mood: 'apples' },                                      lbl: 'Big Apple Oak', ly: 915 },
    ]);
    // Ground baseline guide
    line(T, [[140, 864], [1780, 864]], { col: C.green, w: 5, p: 0.6, seed: 99 });
  }

  comp.group(G);
  comp.crayon(T.c);
  comp.finish({ vig: 0.14, emb: 0.52 });
}
