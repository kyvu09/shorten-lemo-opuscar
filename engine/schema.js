// Canonical project.json schema, voice catalog, palette presets, and SRT/lines converters.

export const DEFAULT_CRAYONS = {
  ink:    '#472e1e',   // Cocoa brown (outlines, never black)
  ochre:  '#c88a3b',   // Earth ochre
  yellow: '#f2be2c',   // Sunshine yellow
  red:    '#d94436',   // Apple red
  pink:   '#e8877d',   // Coral pink
  green:  '#5a9c46',   // Meadow green
  sky:    '#5da7d6',   // Sky blue
  rain:   '#6b7ca8',   // Rain periwinkle
  peach:  '#f5cca7',   // Warm peach
  white:  '#fbfaf4',   // Eye catchlights
};

export const VOICE_CATALOG = [
  { id: 'af_heart',            engine: 'kokoro',   lang: 'en-us', label: 'EN · Heart (Nữ ấm áp — Khuyến nghị, Offline)' },
  { id: 'af_bella',            engine: 'kokoro',   lang: 'en-us', label: 'EN · Bella (Nữ kể chuyện dịu dàng, Offline)' },
  { id: 'af_sky',              engine: 'kokoro',   lang: 'en-us', label: 'EN · Sky (Nữ trẻ trung, Offline)' },
  { id: 'af_nicole',           engine: 'kokoro',   lang: 'en-us', label: 'EN · Nicole (Nữ thì thầm êm ái, Offline)' },
  { id: 'am_adam',             engine: 'kokoro',   lang: 'en-us', label: 'EN · Adam (Nam ấm áp, Offline)' },
  { id: 'am_michael',          engine: 'kokoro',   lang: 'en-us', label: 'EN · Michael (Nam trầm hiền hậu, Offline)' },
  { id: 'bf_emma',             engine: 'kokoro',   lang: 'en-gb', label: 'EN-UK · Emma (Nữ Anh sáng rõ, Offline)' },
  { id: 'bm_george',           engine: 'kokoro',   lang: 'en-gb', label: 'EN-UK · George (Nam Anh kể chuyện, Offline)' },
  { id: 'vi-VN-HoaiMyNeural',  engine: 'edge-tts', lang: 'vi',    label: 'VI · Hoài My (Nữ Việt tự nhiên, Online)' },
  { id: 'vi-VN-NamMinhNeural', engine: 'edge-tts', lang: 'vi',    label: 'VI · Nam Minh (Nam Việt ấm áp, Online)' },
  { id: 'en-US-AnaNeural',     engine: 'edge-tts', lang: 'en',    label: 'EN · Ana (Giọng trẻ em Mỹ, Online)' },
  { id: 'en-US-JennyNeural',   engine: 'edge-tts', lang: 'en',    label: 'EN · Jenny (Nữ Mỹ rõ ràng, Online)' },
];

export const WASH_PRESETS = [
  { id: 'sap-green',    label: 'Sap Rain-Green (Mưa vườn xanh lá)', color: '#70b58f' },
  { id: 'ultramarine',  label: 'Ultramarine (Bầu trời đêm xanh thẫm)', color: '#2b3975' },
  { id: 'dawn-rose',    label: 'Dawn Rose (Bình minh hồng ấm)', color: '#d47c85' },
  { id: 'sky-aqua',     label: 'Rain Aqua (Mưa xanh biển nhẹ)', color: '#5fa4bd' },
];

export function aspectDimensions(aspect) {
  return aspect === '9:16' ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
}

export function createBlankProject(slug, { title = 'My Story', titleVi = 'Câu Chuyện Của Bé', aspect = '16:9', duration = 20.0 } = {}) {
  return {
    version: 1,
    meta: {
      slug,
      title,
      titleVi,
      titlePos: { x: 2450, y: 420, t: 0.8 },
      duration,
      fps: 24,
      aspect,
    },
    palette: {
      paper: '#f4efe3',
      crayons: { ...DEFAULT_CRAYONS },
      washColor: '#70b58f',
      washEnabled: true,
      washStart: Math.max(6, Math.round(duration * 0.55)),
      waxPreset: 'rain-and-stars',
    },
    world: {
      preset: 'sunny-meadow',
      horizonY: 1120,
    },
    camera: [
      { t: 0.0, x: 1600, y: 900, s: 0.72 },
      { t: Math.max(4, duration - 4), x: 1600, y: 900, s: 0.60 },
      { t: duration, x: 1600, y: 900, s: 0.60 },
    ],
    entities: [
      {
        id: 'hero', type: 'boy_leo', x: 1120, y: 1120, scale: 1.05, tStart: 0.0, drawDur: 0.0,
        states: [
          { t: 0.0, view: 'r34', expr: 'happy', pose: 'stand' },
          { t: Math.round(duration * 0.5), view: 'r34', expr: 'excited', pose: 'jumpA' },
        ]
      },
      {
        id: 'sun1', type: 'sun', x: 2220, y: 390, scale: 0.95, tStart: 1.2, drawDur: 1.2,
        states: [{ t: 0.0, mood: 'warm' }]
      },
      {
        id: 'tree1', type: 'tree', x: 1850, y: 1120, scale: 1.0, tStart: 0.4, drawDur: 1.0,
        states: [{ t: 0.0, mood: 'apples' }]
      },
    ],
    tags: [
      { id: 'tag_sun',  t: 2.0, x: 2220, y: 615, en: 'SUN',  vi: 'mặt trời', col: '#d98a16' },
      { id: 'tag_tree', t: 5.5, x: 2140, y: 920, en: 'TREE', vi: 'cái cây',  col: '#5a9c46' },
    ],
    subtitles: [
      { id: 'l01', vt: 1.5, dur: 1.8, t0: 1.3, t1: 4.8, en: 'Look at the bright sun!', vi: 'Nhìn ông mặt trời rực rỡ kìa!', key: 'sun', hiCol: '#d98a16', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l02', vt: 5.6, dur: 1.8, t0: 5.4, t1: 9.2, en: 'Here is a big green tree.', vi: 'Đây là một cái cây xanh thật to.', key: 'tree', hiCol: '#5a9c46', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
    ],
    silences: [],
    ending: { type: 'fridge', tStart: Math.max(8, duration - 4.2), tEnd: Math.max(10, duration - 1.2), fridgeColor: '#cbe3d7' },
    music: {
      preset: 'morning-garden',
      key: 'F',
      bpm: 108,
      gains: { ukulele: 0.90, marimba: 0.85, recorder: 0.92, bassoon: 0.76, glock: 1.20, perc: 0.70, foley: 0.75, voice: 1.0 }
    }
  };
}

export function createOneLittleSeedProject() {
  return {
    version: 1,
    meta: {
      slug: 'one-little-seed',
      title: 'One Little Seed',
      titleVi: 'Một Hạt Giống Nhỏ',
      titlePos: { x: 2715, y: 825, t: 1.80 },
      duration: 56.0,
      fps: 24,
      aspect: '16:9',
    },
    palette: {
      paper: '#f4efe3',
      crayons: { ...DEFAULT_CRAYONS },
      washColor: '#70b58f',
      washEnabled: true,
      washStart: 30.0,
      waxPreset: 'rain-and-roots',
    },
    world: {
      preset: 'garden-cross-section',
      horizonY: 1090,
      seedX: 1680,
      seedY: 1365,
    },
    camera: [
      { t:  0.00, x: 1680, y: 1365, s: 1.88 },
      { t:  0.45, x: 1680, y: 1365, s: 1.88 },
      { t:  2.55, x: 2245, y: 1175, s: 0.94 },
      { t:  7.55, x: 2220, y: 1165, s: 0.94 },
      { t:  9.00, x: 1280, y:  955, s: 1.06 },
      { t: 12.10, x: 1315, y:  945, s: 1.05 },
      { t: 13.45, x: 1980, y:  625, s: 0.86 },
      { t: 17.20, x: 2000, y:  615, s: 0.86 },
      { t: 18.00, x: 1350, y: 1125, s: 1.06 },
      { t: 23.25, x: 1350, y: 1125, s: 1.06 },
      { t: 24.35, x: 1460, y:  575, s: 1.01 },
      { t: 28.55, x: 1510, y:  560, s: 1.00 },
      { t: 29.35, x: 1510, y:  560, s: 1.00 },
      { t: 30.25, x: 1615, y: 1020, s: 0.66 },
      { t: 41.20, x: 1615, y: 1020, s: 0.66 },
      { t: 42.15, x: 1495, y: 1055, s: 1.04 },
      { t: 44.90, x: 1325, y:  765, s: 0.96 },
      { t: 47.25, x: 1325, y:  765, s: 0.96 },
      { t: 48.55, x: 1600, y:  900, s: 0.60 },
      { t: 56.00, x: 1600, y:  900, s: 0.60 },
    ],
    entities: [
      {
        id: 'sun', type: 'sun', x: 2420, y: 340, scale: 1.0, tStart: 12.20, drawDur: 1.4, fillDur: 2.5,
        states: [
          { t: 12.20, mood: 'warm' },
          { t: 16.40, mood: 'blaze' },
          { t: 25.80, mood: 'warm' },
        ]
      },
      {
        id: 'cloud', type: 'cloud', x: 1740, y: 330, scale: 1.06, tStart: 23.50, drawDur: 1.6, fillDur: 2.4,
        states: [
          { t: 23.50, mood: 'happy' },
          { t: 26.80, mood: 'wink' },
          { t: 27.70, mood: 'puff' },
          { t: 35.50, mood: 'happy' },
        ]
      },
      {
        id: 'seed', type: 'seed', x: 1680, y: 1365, scale: 1.08, tStart: 0.35, drawDur: 1.1, fillDur: 1.1,
        states: [
          { t:  0.00, mood: 'sleep' },
          { t: 17.50, mood: 'hot' },
          { t: 23.80, mood: 'sleep' },
          { t: 35.60, mood: 'wake' },
          { t: 38.60, mood: 'sprout' },
          { t: 41.55, mood: 'wake' },
        ]
      },
      {
        id: 'flower', type: 'flower', x: 1680, y: 1088, rootY: 1325, scale: 1.08, tStart: 41.45, drawDur: 2.85, fillDur: 1.85,
        states: [{ t: 41.45, mood: 'bloom' }]
      },
      {
        id: 'leo', type: 'boy_leo', x: 1100, y: 1095, scale: 1.02, tStart: 0.0, drawDur: 0.0,
        states: [
          { t:  0.00, view: 'r34',   expr: 'curious', pose: 'crouch' },
          { t:  9.50, view: 'r34',   expr: 'curious', pose: 'stand' },
          { t: 11.15, view: 'r34',   expr: 'idea',    pose: 'idea' },
          { t: 12.25, view: 'r34',   expr: 'happy',   pose: 'colour_loop' },
          { t: 16.50, view: 'r34',   expr: 'happy',   pose: 'stand' },
          { t: 17.50, view: 'r34',   expr: 'hot',     pose: 'hot' },
          { t: 20.40, view: 'r34',   expr: 'uhoh',    pose: 'stand' },
          { t: 22.30, view: 'r34',   expr: 'idea',    pose: 'ideaBlue' },
          { t: 23.50, view: 'r34',   expr: 'happy',   pose: 'cloud_loop' },
          { t: 27.20, view: 'r34',   expr: 'curious', pose: 'stand' },
          { t: 29.80, view: 'front', expr: 'amazed',  pose: 'rain' },
          { t: 38.60, view: 'front', expr: 'excited', pose: 'rain' },
          { t: 41.50, view: 'r34',   expr: 'amazed',  pose: 'stand' },
          { t: 44.50, view: 'r34',   expr: 'excited', pose: 'jumpB' },
          { t: 45.35, view: 'r34',   expr: 'excited', pose: 'jumpA' },
          { t: 45.88, view: 'r34',   expr: 'excited', pose: 'jumpB' },
          { t: 46.35, view: 'r34',   expr: 'excited', pose: 'jumpA' },
          { t: 46.92, view: 'r34',   expr: 'excited', pose: 'jumpB' },
          { t: 47.40, view: 'r34',   expr: 'happy',   pose: 'stand' },
        ]
      }
    ],
    tags: [
      { id: 'tag_seed',   t:  3.65, x: 1975, y: 1345, en: 'SEED',   vi: 'hạt giống', col: '#b07124' },
      { id: 'tag_sun',    t: 13.70, x: 2445, y:  580, en: 'SUN',    vi: 'mặt trời',  col: '#d98a16' },
      { id: 'tag_cloud',  t: 25.10, x: 1345, y:  325, en: 'CLOUD',  vi: 'đám mây',   col: '#4a8ec2' },
      { id: 'tag_rain',   t: 31.30, x: 1355, y:  655, en: 'RAIN',   vi: 'cơn mưa',   col: '#2f6d52' },
      { id: 'tag_roots',  t: 35.40, x: 1300, y: 1485, en: 'ROOTS',  vi: 'rễ cây',    col: '#2f6d52' },
      { id: 'tag_flower', t: 47.55, x: 2025, y:  625, en: 'FLOWER', vi: 'bông hoa',  col: '#d94436' },
    ],
    subtitles: [
      { id: 'l01', vt:  2.60, dur: 1.348, t0:  2.45, t1:  5.25, en: 'Here is a little seed.',              vi: 'Đây là một hạt giống nhỏ.',             key: 'seed',   hiCol: '#c88a3b', engine: 'kokoro', voice: 'af_heart', speed: 0.85 },
      { id: 'l02', vt:  5.50, dur: 1.361, t0:  5.40, t1:  8.10, en: 'It is fast asleep.',                  vi: 'Nó đang ngủ say giấc.',                  key: '',       hiCol: '#472e1e', engine: 'kokoro', voice: 'af_heart', speed: 0.84 },
      { id: 'l03', vt:  8.95, dur: 1.363, t0:  8.80, t1: 11.75, en: 'Leo wants a flower.',                 vi: 'Leo muốn có một bông hoa.',              key: 'flower', hiCol: '#d94436', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l04', vt: 12.60, dur: 2.339, t0: 12.45, t1: 16.70, en: 'Wake up, seed! Here comes the sun.',  vi: 'Dậy đi hạt nhỏ! Mặt trời tới rồi.',      key: 'sun',    hiCol: '#d98a16', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l05', vt: 20.55, dur: 1.408, t0: 20.40, t1: 23.15, en: 'Oh no! Too hot!',                     vi: 'Ôi không! Nóng quá!',                    key: 'hot',    hiCol: '#d94436', engine: 'kokoro', voice: 'af_heart', speed: 0.85 },
      { id: 'l06', vt: 24.00, dur: 1.853, t0: 23.85, t1: 27.60, en: 'Leo draws a big blue cloud.',         vi: 'Leo vẽ một đám mây xanh thật to.',       key: 'cloud',  hiCol: '#4a8ec2', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l07', vt: 30.60, dur: 1.548, t0: 30.45, t1: 33.80, en: 'Down comes the cool rain!',           vi: 'Cơn mưa mát lành rơi xuống!',            key: 'rain',   hiCol: '#3b785c', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l08', vt: 35.10, dur: 2.069, t0: 34.95, t1: 39.20, en: 'Look! Hidden roots drink the water.', vi: 'Nhìn kìa! Rễ cây ẩn mình đang uống nước.', key: 'roots', hiCol: '#3b785c', engine: 'kokoro', voice: 'af_heart', speed: 0.85 },
      { id: 'l09', vt: 47.65, dur: 1.836, t0: 47.50, t1: 51.05, en: 'Hooray! A tall red flower!',          vi: 'Hoan hô! Một bông hoa đỏ thật cao!',     key: 'flower', hiCol: '#d94436', engine: 'kokoro', voice: 'af_heart', speed: 0.86 },
      { id: 'l10', vt: 51.60, dur: 1.486, t0: 51.45, t1: 55.20, en: 'Well done, little seed.',             vi: 'Giỏi lắm, hạt giống nhỏ ơi.',            key: 'seed',   hiCol: '#c88a3b', engine: 'kokoro', voice: 'af_heart', speed: 0.82 },
    ],
    silences: [
      { id: 'sil_hot',   t0: 19.20, t1: 20.45 },
      { id: 'sil_cloud', t0: 28.30, t1: 29.60 },
    ],
    ending: {
      type: 'fridge',
      tStart: 50.80,
      tEnd: 54.40,
      fridgeColor: '#cbe3d7',
    },
    music: {
      preset: 'morning-garden',
      key: 'F',
      bpm: 108,
      gains: { ukulele: 0.92, marimba: 0.85, recorder: 0.95, bassoon: 0.78, glock: 1.25, perc: 0.72, foley: 0.76, voice: 1.0 }
    }
  };
}

export function projectToLines(project) {
  return (project.subtitles || []).map(s => {
    const vInfo = VOICE_CATALOG.find(v => v.id === s.voice);
    const engine = s.engine || vInfo?.engine || 'kokoro';
    const lang = vInfo?.lang || (engine === 'edge-tts' ? 'vi' : 'en-us');
    const text = (engine === 'edge-tts' && lang === 'vi' && s.vi) ? s.vi : s.en;
    return {
      id: s.id,
      text,
      en: s.en,
      vi: s.vi,
      key: s.key || '',
      engine,
      voice: s.voice || 'af_heart',
      speed: s.speed ?? 0.86,
      lang,
    };
  });
}

function srtTs(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function projectToSrt(project) {
  return (project.subtitles || [])
    .slice()
    .sort((a, b) => a.t0 - b.t0)
    .map((s, i) => {
      const txt = s.vi ? `${s.en}\n${s.vi}` : s.en;
      return `${i + 1}\n${srtTs(s.t0)} --> ${srtTs(s.t1)}\n${txt}\n`;
    })
    .join('\n');
}
