// Single source of truth for "One Little Seed":
// sections, BPM grid, narration/subtitle cues, vocabulary reveals, and foley/music hit events.
export const DUR = 56.0;
export const BPM = 108;
export const BEAT = 60 / BPM;   // 0.55556 s

export const SECS = [
  { id: 'seed',   t:  0.0, dur:  8.0, bpm: 108 },
  { id: 'sun',    t:  8.0, dur:  9.5, bpm: 112 },
  { id: 'hot',    t: 17.5, dur:  6.0, bpm: 100 },
  { id: 'cloud',  t: 23.5, dur:  6.5, bpm: 118 },
  { id: 'rain',   t: 30.0, dur: 11.5, bpm:  96 },
  { id: 'bloom',  t: 41.5, dur:  6.0, bpm: 108 },
  { id: 'fridge', t: 47.5, dur:  8.5, bpm:  96 },
];

// Spoken narration + burned-in bilingual book subtitles (timings verified against voices/dur.json)
// Wordless bloom passage (41.5–47.4 s) intentionally has NO voice and NO subtitles.
export const SUBS = [
  { id: 'l01', vt:  2.60, dur: 1.348, t0:  2.45, t1:  5.25, en: 'Here is a little seed.',              vi: 'Đây là một hạt giống nhỏ.',             key: 'seed',   hiCol: '#c88a3b' },
  { id: 'l02', vt:  5.50, dur: 1.361, t0:  5.40, t1:  8.10, en: 'It is fast asleep.',                  vi: 'Nó đang ngủ say giấc.',                  key: null,     hiCol: '#472e1e' },
  { id: 'l03', vt:  8.95, dur: 1.363, t0:  8.80, t1: 11.75, en: 'Leo wants a flower.',                 vi: 'Leo muốn có một bông hoa.',              key: 'flower', hiCol: '#d94436' },
  { id: 'l04', vt: 12.60, dur: 2.339, t0: 12.45, t1: 16.70, en: 'Wake up, seed! Here comes the sun.',  vi: 'Dậy đi hạt nhỏ! Mặt trời tới rồi.',      key: 'sun',    hiCol: '#d98a16' },
  { id: 'l05', vt: 20.55, dur: 1.408, t0: 20.40, t1: 23.15, en: 'Oh no! Too hot!',                     vi: 'Ôi không! Nóng quá!',                    key: 'hot',    hiCol: '#d94436' },
  { id: 'l06', vt: 24.00, dur: 1.853, t0: 23.85, t1: 27.60, en: 'Leo draws a big blue cloud.',         vi: 'Leo vẽ một đám mây xanh thật to.',       key: 'cloud',  hiCol: '#4a8ec2' },
  { id: 'l07', vt: 30.60, dur: 1.548, t0: 30.45, t1: 33.80, en: 'Down comes the cool rain!',           vi: 'Cơn mưa mát lành rơi xuống!',            key: 'rain',   hiCol: '#3b785c' },
  { id: 'l08', vt: 35.10, dur: 2.069, t0: 34.95, t1: 39.20, en: 'Look! Hidden roots drink the water.', vi: 'Nhìn kìa! Rễ cây ẩn mình đang uống nước.', key: 'roots', hiCol: '#3b785c' },
  { id: 'l09', vt: 47.65, dur: 1.836, t0: 47.50, t1: 51.05, en: 'Hooray! A tall red flower!',          vi: 'Hoan hô! Một bông hoa đỏ thật cao!',     key: 'flower', hiCol: '#d94436' },
  { id: 'l10', vt: 51.60, dur: 1.486, t0: 51.45, t1: 55.20, en: 'Well done, little seed.',             vi: 'Giỏi lắm, hạt giống nhỏ ơi.',            key: 'seed',   hiCol: '#c88a3b' },
];

// On-page hand-lettered bilingual vocabulary tags (clean balanced placement, zero collisions!)
export const TAGS = [
  { id: 'tag_seed',   t:  3.65, x: 1975, y: 1345, en: 'SEED',   vi: 'hạt giống', col: '#b07124' },
  { id: 'tag_sun',    t: 13.70, x: 2445, y:  580, en: 'SUN',    vi: 'mặt trời',  col: '#d98a16' },
  { id: 'tag_cloud',  t: 25.10, x: 1345, y:  325, en: 'CLOUD',  vi: 'đám mây',   col: '#4a8ec2' },
  { id: 'tag_rain',   t: 31.30, x: 1355, y:  655, en: 'RAIN',   vi: 'cơn mưa',   col: '#2f6d52' },
  { id: 'tag_roots',  t: 35.40, x: 1300, y: 1485, en: 'ROOTS',  vi: 'rễ cây',    col: '#2f6d52' },
  { id: 'tag_flower', t: 47.55, x: 2025, y:  625, en: 'FLOWER', vi: 'bông hoa',  col: '#d94436' },
];

// Two deliberate real silences (music + ambience drop to pure zero)
export const SILENCES = [
  { id: 'sil_hot',   t0: 19.20, t1: 20.45 },   // after "too hot" comedic droop; crayon clink at 20.15
  { id: 'sil_cloud', t0: 28.30, t1: 29.60 },   // hushed breath before first raindrop & wet wash
];

// Deterministic sound & music events exported via window.EV -> events.json
export function buildEvents() {
  const ev = [
    // Section 1: Opening seed & title
    { t:  0.08, type: 'scratch',  dur: 1.55, pan:  0.0 },    // drawing soil burrow & seed outline
    { t:  0.90, type: 'scribble', dur: 0.95, pan:  0.0 },    // colouring seed ochre
    { t:  1.80, type: 'write',    dur: 0.90, pan:  0.35 },   // hand-lettering title
    { t:  3.65, type: 'write',    dur: 0.45, pan:  0.25 },   // writing SEED tag
    // J-cut #1: footsteps + cheerful garden enter early at 7.45 s before Shot 2 settles
    { t:  7.45, type: 'step',     pan: -0.35 },
    { t:  7.85, type: 'step',     pan: -0.30 },
    { t:  8.25, type: 'paper',    dur: 0.55, pan: -0.2 },

    // Section 2: Leo idea & colouring the Sun
    { t: 11.15, type: 'idea',     pan: -0.25 },              // bright idea chime!
    { t: 12.25, type: 'scratch',  dur: 1.20, pan:  0.45 },   // drawing sun outline & rays
    { t: 13.00, type: 'scribble', dur: 2.30, pan:  0.48 },   // energetic yellow zig-zag sun colouring
    { t: 13.70, type: 'write',    dur: 0.40, pan:  0.50 },   // writing SUN tag

    // Section 3: Too hot & Silence #1
    { t: 17.65, type: 'swish',    dur: 0.45, pan: -0.25 },   // Leo fanning face
    { t: 18.25, type: 'sweat',    pan: -0.20 },              // sweat drop pop
    { t: 18.60, type: 'tuck',     pan:  0.15 },              // seed pulling soil blanket up
    { t: 20.15, type: 'clink',    pan: -0.25 },              // FIRST SOUND AFTER SILENCE #1: setting yellow crayon down!
    { t: 22.35, type: 'pickup',   pan: -0.20 },              // picking up sky-blue crayon + spark

    // Section 4: Drawing Cloud & Silence #2
    { t: 23.55, type: 'scratch',  dur: 1.40, pan:  0.05 },   // drawing big cloud outline
    { t: 24.45, type: 'scribble', dur: 2.15, pan:  0.08 },   // shading sky-blue & periwinkle belly
    { t: 25.10, type: 'write',    dur: 0.45, pan: -0.25 },   // writing CLOUD tag
    { t: 27.95, type: 'puff',     pan:  0.05 },              // cloud puffing cheeks before silence #2

    // Section 5: SIGNATURE SHOT — J-cut raindrop + sap-green watercolour wash + wax resist!
    { t: 29.60, type: 'dip',      pan: -0.35 },              // FIRST SOUND AFTER SILENCE #2: wet brush dip + chime
    { t: 30.00, type: 'brush',    dur: 2.30, dir:  1 },      // wide wash band 1 (upper sky)
    { t: 31.30, type: 'write',    dur: 0.35, pan:  0.30 },   // RAIN tag
    { t: 31.90, type: 'brush',    dur: 2.40, dir: -1 },      // wide wash band 2 (lower sky + grass)
    { t: 33.80, type: 'brush',    dur: 2.50, dir:  1 },      // wide wash band 3 (deep underground soil -> ROOTS!)
    { t: 35.40, type: 'write',    dur: 0.40, pan: -0.30 },   // ROOTS tag
    // Sparkle glints timed to white-wax drops & roots uncovering under the wash (also drive glockenspiel notes!)
    { t: 30.45, type: 'glint',    pan: -0.45, pitch: 'A5' },
    { t: 30.90, type: 'glint',    pan: -0.15, pitch: 'C6' },
    { t: 31.40, type: 'glint',    pan:  0.20, pitch: 'D6' },
    { t: 31.85, type: 'glint',    pan:  0.45, pitch: 'F6' },
    { t: 32.55, type: 'glint',    pan:  0.30, pitch: 'E6' },
    { t: 33.10, type: 'glint',    pan: -0.20, pitch: 'C6' },
    { t: 34.25, type: 'glint',    pan: -0.35, pitch: 'A5' },
    { t: 34.70, type: 'glint',    pan: -0.10, pitch: 'C6' },
    { t: 35.15, type: 'glint',    pan:  0.15, pitch: 'D6' },
    { t: 35.65, type: 'glint',    pan:  0.35, pitch: 'F6' },
    { t: 36.20, type: 'glint',    pan:  0.00, pitch: 'G6' },
    { t: 38.75, type: 'sprout',   pan:  0.05 },              // seed wakes & sprouts!

    // Section 6: Wordless musical bloom
    { t: 41.55, type: 'scratch',  dur: 2.45, pan:  0.05 },   // green stem drawing upward live
    { t: 42.65, type: 'leaf',     pan: -0.15 },              // left leaf unfurls
    { t: 43.45, type: 'leaf',     pan:  0.20 },              // right leaf unfurls
    { t: 44.35, type: 'bloom',    pan:  0.05 },              // big red petals POP open!
    { t: 44.45, type: 'scribble', dur: 1.50, pan:  0.05 },   // vibrant red petal scribbling
    { t: 45.45, type: 'hop',      pan: -0.30 },              // Leo jump 1
    { t: 46.45, type: 'hop',      pan: -0.30 },              // Leo jump 2

    // Section 7: Final word & fridge pull-out
    { t: 47.55, type: 'write',    dur: 0.45, pan:  0.25 },   // FLOWER tag
    { t: 50.80, type: 'tape',     pan:  0.00 },              // soft paper/fridge pull-out ambient shift
  ];

  // Add all 10 voice lines from SUBS
  for (const s of SUBS) {
    ev.push({ t: s.vt, type: 'voice', id: s.id, dur: s.dur });
  }
  ev.sort((a, b) => a.t - b.t);
  return ev;
}
