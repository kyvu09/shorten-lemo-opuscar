// Offline Multi-Theme Script Parser & Auto-Director for Crayon Book Studio
// + seamless integration with Gemini AI blueprints & declarative Custom Props!
import { DEFAULT_CRAYONS } from './schema.js';

const CAST_RULES = [
  {
    type: 'little_dog', defaultName: 'Little Dog', icon: '🐶',
    re: /🐶|🐕|\bdog\b|\bdoggy\b|\bpuppy\b|chó\s*nhỏ|chú\s*chó|cún/i,
    enVoice: 'af_sky', enSpeed: 0.90, enLang: 'en-us',
    viVoice: 'vi-VN-HoaiMyNeural', viRate: '+3%', viPitch: '+3Hz',
    defaultScale: 1.02, roleOrder: 1
  },
  {
    type: 'tabby_cat', defaultName: 'Tabby Cat', icon: '🐱',
    re: /🐱|🐈|\bcat\b|\bkitty\b|\btabby\b|\bkitten\b|mèo\s*mướp|chú\s*mèo|mèo\s*con/i,
    enVoice: 'bf_emma', enSpeed: 0.90, enLang: 'en-gb',
    viVoice: 'vi-VN-HoaiMyNeural', viRate: '+2%', viPitch: '+4Hz',
    defaultScale: 1.00, roleOrder: 2
  },
  {
    type: 'gray_wolf', defaultName: 'Gray Wolf', icon: '🐺',
    re: /🐺|\bwolf\b|mr\.?\s*(?:gray\s*)?wolf|bác\s*sói|con\s*sói|sói\s*xám/i,
    enVoice: 'am_michael', enSpeed: 0.85, enLang: 'en-us',
    viVoice: 'vi-VN-NamMinhNeural', viRate: '-5%', viPitch: '-3Hz',
    defaultScale: 1.00, roleOrder: 3, isBigEncounter: true
  },
  {
    type: 'boy_leo', defaultName: 'Leo', icon: '👦',
    re: /👦|\bleo\b|\bboy\b|bé\s*leo|cậu\s*bé/i,
    enVoice: 'af_sky', enSpeed: 0.88, enLang: 'en-us',
    viVoice: 'vi-VN-HoaiMyNeural', viRate: '+2%', viPitch: '+2Hz',
    defaultScale: 1.02, roleOrder: 1
  },
  {
    type: 'girl_maya', defaultName: 'Maya', icon: '👧',
    re: /👧|\bmaya\b|\bgirl\b|bé\s*maya|cô\s*bé/i,
    enVoice: 'af_bella', enSpeed: 0.88, enLang: 'en-us',
    viVoice: 'vi-VN-HoaiMyNeural', viRate: '+2%', viPitch: '+4Hz',
    defaultScale: 1.00, roleOrder: 2
  },
  {
    type: 'bird', defaultName: 'Little Bird', icon: '🐦',
    re: /🐦|🐤|\bbird\b|\bbirdie\b|chim\s*nhỏ|chú\s*chim/i,
    enVoice: 'af_nicole', enSpeed: 0.92, enLang: 'en-us',
    viVoice: 'vi-VN-HoaiMyNeural', viRate: '+4%', viPitch: '+5Hz',
    defaultScale: 0.95, roleOrder: 4
  }
];

const NARRATOR_VOICE = {
  enVoice: 'af_heart', enSpeed: 0.87, enLang: 'en-us',
  viVoice: 'vi-VN-HoaiMyNeural', viRate: '-4%', viPitch: '+0Hz'
};
const ALL_VOICE = {
  enVoice: 'af_bella', enSpeed: 0.92, enLang: 'en-us',
  viVoice: 'vi-VN-HoaiMyNeural', viRate: '+4%', viPitch: '+4Hz'
};

// Built-in storybook EN–VI vocabulary dictionary (includes Birthday, Forest, Garden, Daily Life!)
const VOCAB_DICT = [
  { en: 'BIRTHDAY', vi: 'sinh nhật',  col: '#d94436', re: /\bbirthday\b/i,                         zone: 'left_mid' },
  { en: 'BALLOONS', vi: 'bóng bay',   col: '#4a8ec2', re: /\bballoons?\b/i,                        zone: 'left_top' },
  { en: 'CAKE',     vi: 'bánh kem',   col: '#e8877d', re: /\bcakes?\b/i,                           zone: 'picnic' },
  { en: 'PRESENT',  vi: 'món quà',    col: '#d94436', re: /\bpresents?\b|\bgifts?\b/i,             zone: 'mid_left' },
  { en: 'TOY CAR',  vi: 'ô tô đỏ',    col: '#d94436', re: /\b(?:toy\s+)?cars?\b/i,                 zone: 'mid_right' },
  { en: 'CANDLES',  vi: 'ngọn nến',   col: '#d98a16', re: /\bcandles?\b/i,                         zone: 'sky_right' },
  { en: 'WISH',     vi: 'điều ước',   col: '#5a9c46', re: /\bwish(?:es)?\b/i,                      zone: 'sky_mid' },
  { en: 'DOOR',     vi: 'cánh cửa',   col: '#c88a3b', re: /\bdoor\b/i,                             zone: 'left_tree' },
  { en: 'PARTY',    vi: 'bữa tiệc',   col: '#d98a16', re: /\bparty\b/i,                            zone: 'left_mid' },
  { en: 'FOREST',   vi: 'khu rừng',   col: '#5a9c46', re: /\bforest\b|\bwoods\b/i,                 zone: 'left_tree' },
  { en: 'GARDEN',   vi: 'khu vườn',   col: '#5a9c46', re: /\bgarden\b/i,                           zone: 'left_tree' },
  { en: 'RIVER',    vi: 'dòng sông',  col: '#4a8ec2', re: /\briver\b|\bstream\b/i,                 zone: 'river' },
  { en: 'WOLF',     vi: 'bác sói',    col: '#6b7ca8', re: /\bwolf\b/i,                             zone: 'mid_tree' },
  { en: 'HUNGRY',   vi: 'đói bụng',   col: '#c88a3b', re: /\bhungry\b|\bfood\b/i,                  zone: 'mid_right' },
  { en: 'APPLE',    vi: 'quả táo',    col: '#d94436', re: /\bapples?\b/i,                          zone: 'mid_left' },
  { en: 'FRIENDS',  vi: 'bạn bè',     col: '#d94436', re: /\bfriends?\b/i,                         zone: 'picnic' },
  { en: 'KIND',     vi: 'tốt bụng',   col: '#5a9c46', re: /\bkind\b|\bhelp\b/i,                    zone: 'picnic' },
  { en: 'SUN',      vi: 'mặt trời',   col: '#d98a16', re: /\bsun\b|\bsunny\b/i,                    zone: 'sky_right' },
  { en: 'RAIN',     vi: 'cơn mưa',    col: '#4a8ec2', re: /\brain\b|\brainy\b/i,                   zone: 'sky_mid' },
  { en: 'CLOUD',    vi: 'đám mây',    col: '#4a8ec2', re: /\bclouds?\b/i,                          zone: 'sky_mid' },
  { en: 'FLOWER',   vi: 'bông hoa',   col: '#d94436', re: /\bflowers?\b/i,                         zone: 'picnic' },
  { en: 'TREE',     vi: 'cái cây',    col: '#5a9c46', re: /\btrees?\b/i,                           zone: 'mid_tree' },
  { en: 'HOUSE',    vi: 'ngôi nhà',   col: '#d94436', re: /\bhouse\b|\bhome\b/i,                   zone: 'mid_tree' },
  { en: 'DUCK',     vi: 'vịt con',    col: '#d98a16', re: /\bducks?\b|\bducklings?\b/i,          zone: 'mid_left' },
  { en: 'MOMMY',    vi: 'mẹ',         col: '#e8877d', re: /\bmomm?y\b|\bmother\b|\bmama\b/i,     zone: 'picnic' },
  { en: 'FAMILY',   vi: 'gia đình',   col: '#d94436', re: /\bfamily\b/i,                         zone: 'river' },
  { en: 'CRY',      vi: 'khóc',       col: '#4a8ec2', re: /\bcry(?:ing|ies)?\b/i,                zone: 'mid_tree' },
  { en: 'HELP',     vi: 'giúp đỡ',    col: '#5a9c46', re: /\bhelp(?:ing)?\b/i,                   zone: 'mid_right' },
  { en: 'BALL',     vi: 'quả bóng',   col: '#d94436', re: /\bballs?\b/i,                         zone: 'mid_left' },
  { en: 'PLAY',     vi: 'vui chơi',   col: '#d98a16', re: /\bplay(?:ing|s)?\b/i,                 zone: 'left_mid' },
  { en: 'POND',     vi: 'ao nước',    col: '#4a8ec2', re: /\bponds?\b|\blake\b/i,                zone: 'river' },
  { en: 'NIGHT',    vi: 'ban đêm',    col: '#6b7ca8', re: /\bnight\b|\bmoon\b/i,                 zone: 'sky_mid' },
  { en: 'STAR',     vi: 'ngôi sao',   col: '#d98a16', re: /\bstars?\b/i,                           zone: 'sky_right' },
  { en: 'RAINBOW',  vi: 'cầu vồng',   col: '#d94436', re: /\brainbow\b/i,                          zone: 'sky_mid' },
  { en: 'HAPPY',    vi: 'vui vẻ',     col: '#d98a16', re: /\bhappy\b|\byay\b|\bhooray\b/i,         zone: 'left_mid' },
];

// Built-in prop matchers (to know which mentioned objects are ALREADY built-in!)
const BUILTIN_PROP_MATCHERS = [
  { type: 'door',          re: /\bdoor\b|cánh cửa|gõ cửa/i },
  { type: 'balloons',      re: /\bballoons?\b|bóng bay/i },
  { type: 'birthday_cake', re: /\bcakes?\b|\bcandles?\b|bánh sinh nhật|bánh kem|bánh ngọt|ngọn nến/i },
  { type: 'gift_box',      re: /\bpresents?\b|\bgifts?\b|món quà|hộp quà/i },
  { type: 'toy_car',       re: /\b(?:toy\s+)?cars?\b|ô tô|xe hơi/i },
  { type: 'party_table',   re: /\btables?\b|quanh bàn|chiếc bàn/i },
  { type: 'apple_basket',  re: /\bapples?\b|\bbasket\b|quả táo|giỏ táo/i },
  { type: 'big_tree',      re: /\btrees?\b|cái cây|cây lớn/i },
  { type: 'house',         re: /\bhouse\b|ngôi nhà/i },
  { type: 'sun',           re: /\bsun\b|\bsunny\b|mặt trời/i },
  { type: 'cloud',         re: /\bclouds?\b|đám mây/i },
  { type: 'flower',        re: /\bflowers?\b|bông hoa/i },
  { type: 'rainbow',       re: /\brainbow\b|cầu vồng/i },
  { type: 'star',          re: /\bstars?\b|ngôi sao/i },
  { type: 'bird',          re: /\bbirds?\b|chú chim/i },
  { type: 'seed',          re: /\bseeds?\b|hạt giống/i },
  { type: 'watering_can',  re: /\bwatering can\b|bình tưới/i },
];

// Common storybook objects NOT built-in yet -> flagged as missing so Gemini AI can auto-draw them!
const EXTRA_OBJECT_WATCHLIST = [
  { id: 'bicycle',    label: 'Xe đạp (bicycle)',       re: /\bbicycles?\b|\bbikes?\b|xe đạp/i },
  { id: 'dinosaur',   label: 'Khủng long (dinosaur)',  re: /\bdinosaurs?\b|\bdino\b|khủng long/i },
  { id: 'rocket',     label: 'Tên lửa (rocket)',       re: /\brockets?\b|\bspaceships?\b|tên lửa|tàu vũ trụ/i },
  { id: 'boat',       label: 'Thuyền (boat)',          re: /\bboats?\b|\bships?\b|con thuyền|chiếc thuyền/i },
  { id: 'train',      label: 'Tàu hỏa (train)',        re: /\btrains?\b|tàu hỏa|xe lửa/i },
  { id: 'airplane',   label: 'Máy bay (airplane)',     re: /\bairplanes?\b|\bplanes?\b|máy bay/i },
  { id: 'kite',       label: 'Cánh diều (kite)',       re: /\bkites?\b|cánh diều|thả diều/i },
  { id: 'umbrella',   label: 'Chiếc ô (umbrella)',     re: /\bumbrellas?\b|chiếc ô(?!\s*tô)|cây dù/i },
  { id: 'guitar',     label: 'Đàn guitar (guitar)',    re: /\bguitars?\b|đàn guitar/i },
  { id: 'drum',       label: 'Cái trống (drum)',       re: /\bdrums?\b|cái trống/i },
  { id: 'ice_cream',  label: 'Que kem (ice cream)',    re: /\bice\s*creams?\b|que kem|cây kem/i },
  { id: 'pizza',      label: 'Bánh pizza (pizza)',     re: /\bpizzas?\b|bánh pizza/i },
  { id: 'cookie',     label: 'Bánh quy (cookie)',      re: /\bcookies?\b|bánh quy/i },
  { id: 'book',       label: 'Quyển sách (book)',      re: /\bbooks?\b|quyển sách|cuốn sách/i },
  { id: 'ball',       label: 'Quả bóng (ball)',        re: /\bballs?\b|\bfootballs?\b|\bsoccer\b|quả bóng/i },
  { id: 'teddy_bear', label: 'Gấu bông (teddy bear)',  re: /\bteddy\s*bears?\b|gấu bông/i },
  { id: 'dragon',     label: 'Chú rồng (dragon)',      re: /\bdragons?\b|con rồng/i },
  { id: 'butterfly',  label: 'Bướm xinh (butterfly)',  re: /\bbutterfl(?:y|ies)\b|con bướm/i },
  { id: 'fish',       label: 'Chú cá (fish)',          re: /\bfish(?:es)?\b|con cá|chú cá/i },
  { id: 'frog',       label: 'Chú ếch (frog)',         re: /\bfrogs?\b|con ếch|chú ếch/i },
  { id: 'rabbit',     label: 'Chú thỏ (rabbit)',       re: /\brabbits?\b|\bbunn(?:y|ies)\b|chú thỏ|con thỏ/i },
  { id: 'bear',       label: 'Chú gấu (bear)',         re: /\bbears?\b|chú gấu|con gấu/i },
  { id: 'fox',        label: 'Chú cáo (fox)',          re: /\bfox(?:es)?\b|chú cáo|con cáo/i },
  { id: 'duck',       label: 'Chú vịt (duck)',         re: /\bducks?\b|chú vịt|con vịt/i },
  { id: 'castle',     label: 'Lâu đài (castle)',       re: /\bcastles?\b|lâu đài/i },
  { id: 'tent',       label: 'Lều cắm trại (tent)',    re: /\btents?\b|lều cắm trại/i },
  { id: 'snowman',    label: 'Người tuyết (snowman)',  re: /\bsnowm[ae]n\b|người tuyết/i },
  { id: 'banana',     label: 'Quả chuối (banana)',     re: /\bbananas?\b|quả chuối/i },
  { id: 'watermelon', label: 'Dưa hấu (watermelon)',   re: /\bwatermelons?\b|dưa hấu/i },
  { id: 'crown',      label: 'Vương miện (crown)',     re: /\bcrowns?\b|vương miện/i },
  { id: 'robot',      label: 'Người máy (robot)',      re: /\brobots?\b|người máy/i },
  { id: 'school_bus', label: 'Xe buýt (bus)',          re: /\bbus(?:es)?\b|xe buýt/i },
];

const VI_DIACRITICS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
const isVietnamese = s => VI_DIACRITICS.test(s || '');
const stripEmoji = s => String(s || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, '').trim();
const startsWithQuote = s => /^["""'«]/.test(String(s || '').trim());
const cleanQuotes = s => String(s || '').trim().replace(/^["""'«]+|["""'»]+$/g, '').trim();
const stripParens = s => { const t = String(s || '').trim(); return (t.startsWith('(') && t.endsWith(')')) ? t.slice(1, -1).trim() : t; };

function matchCastRule(label, aliases = new Map()) {
  const norm = stripEmoji(label).toLowerCase();
  if (norm && aliases.has(norm)) return aliases.get(norm);
  for (const r of CAST_RULES) {
    if (r.re.test(label)) return r;
  }
  return null;
}

function ttsSafeEn(en) {
  let s = stripEmoji(en);
  s = s.replace(/\b[Hh]a(?:ha){2,}!/g, 'Ha ha ha!').replace(/\b[Hh]a(?:ha){2,}\b/g, 'Ha ha ha');
  s = s.replace(/\bTHE END\b/g, 'The end');
  s = s.replace(/\bdon't eat us\b/i, 'do not eat us');
  return s || 'The end.';
}

function ttsSafeVi(vi) {
  let s = stripEmoji(vi);
  s = s.replace(/\b[Hh]a(?:ha){2,}!/g, 'Ha ha ha!').replace(/\b[Hh]a(?:ha){2,}\b/g, 'Ha ha ha');
  s = s.replace(/\bDoggy\b/g, 'Đót ghi');
  return s;
}

function detectBeatMood(en, vi, theme) {
  const txt = `${en} ${vi}`;
  if (/\bthe end\b|hết chuyện|kết thúc/i.test(txt))                              return 'ending';
  if (/sit around the table|ngồi quanh bàn/i.test(txt))                           return 'sit_table';
  if (/knocks? on the door|knock,\s*knock|gõ cửa|cốc,\s*cốc/i.test(txt))          return 'knock_door';
  if (/can i come in|come in|it is me|bác có thể vào|mời bác vào/i.test(txt))     return 'door_open_enter';
  if (/balloons?|bóng bay/i.test(txt))                                           return 'show_balloons';
  if (/make a big cake|love cake|birthday cake|làm.*bánh|bánh sinh nhật/i.test(txt)) return 'show_cake';
  if (/have a present|for you|what is inside|món quà|bên trong có gì/i.test(txt)) return 'present_gift';
  if (/opens? the present|red.*car|toy car|mở món quà|ô tô/i.test(txt))           return 'open_gift_car';
  if (/sing a birthday song|hát bài hát sinh nhật/i.test(txt))                    return 'sing_birthday';
  if (/make a wish|blows? out|closes? his eyes|điều ước|thổi tắt|nhắm mắt/i.test(txt)) return 'blow_candles';
  if (theme !== 'birthday' && (/suddenly|loud sound|đột nhiên|tiếng động/i.test(txt))) return 'rustle_scare';
  if (/comes out|behind a tree|steps out|bước ra|phía sau/i.test(txt))            return 'reveal_big';
  if (/scared|oh no|don't eat|please don't|sợ quá|ôi không|ăn thịt/i.test(txt))   return 'scared';
  if (/hahaha|ha ha|not going to hurt|don't be afraid|đừng sợ|làm hại/i.test(txt)) return 'laugh_reassure';
  if (/looks? sad|why are you sad|buồn/i.test(txt))                               return 'sad';
  if (/hungry|can't find|no food|đói|thức ăn/i.test(txt))                         return 'hungry';
  if (/some apples|would you like|here you are|vài quả táo|của bác/i.test(txt))   return 'offer_apple';
  if (/really\?|thank you|thật sao|cảm ơn/i.test(txt))                            return 'surprised_thanks';
  if (/yummy|delicious|ngon quá|thật ngon/i.test(txt))                            return 'eat_yummy';
  if (/sit under|eat.*together|ngồi dưới|cùng nhau ăn/i.test(txt))                return 'picnic';
  if (/yay|hooray|happy birthday|new friend|let's eat cake|let's play|help each other|kind|hoan hô|chúc mừng sinh nhật|tốt bụng/i.test(txt)) return 'cheer_friend';
  if (/hello|good morning|hi\b|xin chào|chào buổi sáng/i.test(txt))               return 'greet';
  if (/walking|going to|come with me|let's go|together|prepare|đi dạo|cùng đi|chuẩn bị/i.test(txt)) return 'walk_invite';
  return 'talk';
}

function pickKeyword(en) {
  for (const v of VOCAB_DICT) {
    const m = v.re.exec(en);
    if (m) return { key: m[0], col: v.col };
  }
  const words = (en || '').match(/\b[A-Za-z]{5,}\b/g) || [];
  const skip = new Set(['there', 'where', 'going', 'would', 'please', 'their', 'about', 'after', 'before', 'could', 'should', 'today', 'inside']);
  for (const w of words) {
    if (!skip.has(w.toLowerCase())) return { key: w, col: '#c88a3b' };
  }
  return { key: '', col: '#472e1e' };
}

const GENERIC_PROP_STOP = new Set([
  'red', 'blue', 'yellow', 'green', 'pink', 'white', 'brown', 'gray', 'grey', 'big', 'little', 'small',
  'happy', 'cute', 'nice', 'play', 'toy', 'friend', 'story', 'đỏ', 'xanh', 'vàng', 'hồng', 'trắng',
  'lớn', 'nhỏ', 'to', 'bé', 'vui', 'chơi', 'đồ chơi', 'bạn', 'mẹ', 'bố', 'mother', 'mom', 'dad', 'baby'
]);

/**
 * Detect built-in matched props, saved custom props, and missing props that Gemini AI can auto-draw!
 */
export function detectStoryProps(fullText, customProps = []) {
  const matchedBuiltins = BUILTIN_PROP_MATCHERS.filter(m => m.re.test(fullText)).map(m => m.type);
  const matchedCustom = [];
  for (const cp of customProps || []) {
    const rawKws = (cp.keywords || [cp.id || cp.type.replace(/^custom_/, '')]).filter(Boolean);
    const filtered = rawKws.filter(w => !GENERIC_PROP_STOP.has(String(w).toLowerCase()));
    const kw = filtered.length ? filtered : [String(cp.id || cp.type.replace(/^custom_/, '')).replace(/_/g, ' ')];
    if (kw.some(w => new RegExp(`\\b${String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(fullText))) {
      matchedCustom.push(cp);
    }
  }
  const customKeySet = new Set(matchedCustom.flatMap(cp => (cp.keywords || [cp.id, cp.type.replace(/^custom_/, '')]).map(k => String(k || '').toLowerCase())));
  const missingProps = [];
  for (const w of EXTRA_OBJECT_WATCHLIST) {
    if (w.re.test(fullText) && !customKeySet.has(w.id)) {
      missingProps.push({ id: w.id, label: w.label });
    }
  }
  return { matchedBuiltins, matchedCustom, missingProps };
}

/**
 * Parse natural bilingual story script (supports multi-line dialogue blocks per speaker, ALL:, and aliases!).
 */
export function parseStoryScript(rawText, customProps = []) {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n').map(l => l.trim());
  const castMap = new Map();
  const aliases = new Map();
  const ensureCast = (rule, customName) => {
    if (!rule) return null;
    if (!castMap.has(rule.type)) {
      castMap.set(rule.type, { type: rule.type, name: customName || rule.defaultName, icon: rule.icon, rule });
    }
    return castMap.get(rule.type);
  };

  let inHeader = false, inStory = false;
  const bodyLines = [];

  for (const line of lines) {
    if (!line) { bodyLines.push(''); continue; }
    if (/^(nhân vật|characters?|cast)\s*:?$/i.test(line)) { inHeader = true; inStory = false; continue; }
    if (/^(câu chuyện|story|kịch bản|script)\s*:?$/i.test(line)) { inHeader = false; inStory = true; continue; }
    if (inHeader && !inStory) {
      if (/^[-•*]/.test(line) || matchCastRule(line, aliases)) {
        const cleaned = line.replace(/^[-•*\s]+/, '');
        const label = cleaned.split(':')[0].trim();
        const rule = matchCastRule(cleaned, aliases);
        if (rule) {
          const cleanName = stripEmoji(label);
          if (cleanName) aliases.set(cleanName.toLowerCase(), rule);
          ensureCast(rule, cleanName);
        }
        continue;
      }
    }
    bodyLines.push(line);
  }

  // Group body lines accurately, keeping speaker active across multi-line quoted speech!
  const rawBeats = [];
  const guestSpeakers = new Map();
  const hasEmoji = s => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s || '');
  const pickGuestVoice = (name) => {
    const n = String(name || '').toLowerCase();
    if (/dad|father|papa|bear|lion|king|giant|ông|bố|gấu|sư tử/i.test(n)) {
      return { enVoice: 'am_adam', enSpeed: 0.87, enLang: 'en-us', viVoice: 'vi-VN-NamMinhNeural', viRate: '-4%', viPitch: '-2Hz' };
    }
    if (/mom|mother|mama|queen|mẹ|bà/i.test(n)) {
      return { enVoice: 'af_nova', enSpeed: 0.88, enLang: 'en-us', viVoice: 'vi-VN-HoaiMyNeural', viRate: '-2%', viPitch: '+1Hz' };
    }
    return { enVoice: 'af_bella', enSpeed: 0.92, enLang: 'en-us', viVoice: 'vi-VN-HoaiMyNeural', viRate: '+4%', viPitch: '+5Hz' };
  };
  const ensureGuestSpeaker = (rawLeft, cleanName) => {
    const key = cleanName.toLowerCase();
    if (guestSpeakers.has(key)) return guestSpeakers.get(key);
    const em = (rawLeft.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u) || ['🎭'])[0];
    // Try linking to an AI-drawn custom prop if available!
    const matchedProp = (customProps || []).find(cp => {
      const kws = [cp.id, cp.label, ...(cp.keywords || [])].map(x => String(x || '').toLowerCase());
      return kws.some(k => k && !GENERIC_PROP_STOP.has(k) && key.includes(k));
    });
    const guest = {
      type: matchedProp?.type || ('guest_' + key.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')),
      name: cleanName,
      icon: matchedProp?.icon || em,
      isGuest: true,
      rule: pickGuestVoice(cleanName),
    };
    guestSpeakers.set(key, guest);
    return guest;
  };
  let curSpeaker = null; // null = Narrator, 'all' = ALL, or cast/guest object
  let speakerAwaitFirst = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const ln = bodyLines[i];
    if (!ln) continue;

    // 1. Check "Speaker:" header or "Speaker: line" (supports built-in cast AND any new guest/AI character like "🐥 Little Duck:")
    const spMatch = /^([^:]{1,42}):\s*(.*)$/.exec(ln);
    if (spMatch) {
      const left = spMatch[1].trim(), right = spMatch[2].trim();
      const leftClean = stripEmoji(left);
      const isNarratorLbl = /^(narrator|người kể|dẫn chuyện|kể chuyện)$/i.test(leftClean);
      const isAllLbl = /^(all|everyone|cả nhóm|tất cả|cả ba)$/i.test(leftClean);
      const isMetaLbl = /^(scene|act|title|note|moral|lesson|bài học|cảnh|tiêu đề|ghi chú)\b/i.test(leftClean);
      const rule = (isNarratorLbl || isAllLbl || isMetaLbl) ? null : matchCastRule(left, aliases);
      const wordCount = leftClean ? leftClean.split(/\s+/).length : 0;
      const looksLikeGuestSpeaker = !rule && !isNarratorLbl && !isAllLbl && !isMetaLbl && leftClean.length >= 2 && wordCount <= 4 && !/[.!?]/.test(leftClean) && (
        right === '' || hasEmoji(left) || startsWithQuote(right)
      );
      if (isNarratorLbl || isAllLbl || rule || looksLikeGuestSpeaker) {
        curSpeaker = isNarratorLbl ? null : (isAllLbl ? 'all' : (rule ? ensureCast(rule, leftClean) : ensureGuestSpeaker(left, leftClean)));
        speakerAwaitFirst = Boolean(curSpeaker);
        if (right) {
          speakerAwaitFirst = false;
          if (right.includes('|')) {
            const [a, b] = right.split('|').map(x => cleanQuotes(stripParens(x)));
            rawBeats.push({ speaker: curSpeaker, en: a, vi: b });
          } else if (isVietnamese(right)) {
            rawBeats.push({ speaker: curSpeaker, en: '', vi: cleanQuotes(stripParens(right)) });
          } else {
            rawBeats.push({ speaker: curSpeaker, en: cleanQuotes(right), vi: '' });
          }
        }
        continue;
      }
    }

    // 2. Pipe-separated "EN | VI"
    if (ln.includes('|')) {
      const [a, b] = ln.split('|').map(x => cleanQuotes(stripParens(x)));
      const sp = (startsWithQuote(a) || speakerAwaitFirst) ? curSpeaker : null;
      speakerAwaitFirst = false;
      rawBeats.push({ speaker: sp, en: a, vi: b });
      continue;
    }

    // 3. Parenthesized or Vietnamese translation attaching to previous EN beat
    const isParen = ln.startsWith('(') && ln.endsWith(')');
    const quoted = startsWithQuote(ln);
    const textClean = cleanQuotes(stripParens(ln));
    const prev = rawBeats[rawBeats.length - 1];

    if ((isParen || (!quoted && isVietnamese(textClean))) && prev && prev.en && !prev.vi) {
      prev.vi = textClean;
      // IMPORTANT: keep curSpeaker intact so multi-line quoted speech under the same speaker stays attributed!
      continue;
    }

    // 4. Closing "THE END!"
    if (/^the end\b/i.test(textClean)) {
      curSpeaker = null; speakerAwaitFirst = false;
      rawBeats.push({ speaker: null, en: textClean, vi: 'Hết chuyện rồi!' });
      continue;
    }

    // 5. Dialogue vs Narration detection:
    // Quoted line -> stays with curSpeaker; unquoted line after speaker already spoke -> switches back to Narrator!
    if (!quoted && !speakerAwaitFirst) {
      curSpeaker = null;
    }
    speakerAwaitFirst = false;

    if (isVietnamese(textClean)) {
      rawBeats.push({ speaker: curSpeaker, en: '', vi: textClean });
    } else {
      rawBeats.push({ speaker: curSpeaker, en: textClean, vi: '' });
    }
  }

  const fullText = rawBeats.map(b => `${b.en} ${b.vi}`).join(' ');
  for (const r of CAST_RULES) {
    if (r.re.test(fullText)) ensureCast(r);
  }
  if (castMap.size === 0) ensureCast(CAST_RULES[0]);
  const cast = [...castMap.values()].sort((a, b) => a.rule.roleOrder - b.rule.roleOrder);

  // Detect rich story archetype & world automatically (so different stories NEVER repeat the same camera!)
  const isBirthday = /\bbirthday\b|\bcake\b|\bballoons?\b|\bcandles?\b|\bparty\b|sinh nhật|bánh sinh nhật|bóng bay|thổi tắt/i.test(fullText);
  const isRescue   = /\bcry(?:ing)?\b|\blost\b|can't find|\bfound you\b|\bmommy\b|\bfamily\b|\bhelp you\b|khóc|lạc|tìm thấy mẹ|đoàn tụ|giúp bạn/i.test(fullText);
  const hasPond    = /\bducks?\b|\bducklings?\b|\bfrogs?\b|\bfish\b|\bponds?\b|\bswim/i.test(fullText) || /vịt|ếch|ao nước|bơi/i.test(fullText);
  const hasNight   = /\bnight\b|\bstars?\b|\bmoon\b|\bbedtime\b|\bdream\b|ban đêm|ngôi sao|mặt trăng|đi ngủ/i.test(fullText);
  const hasGarden  = /\bseed\b|\broots?\b|\bwatering\b|\bplant\b|hạt giống|rễ cây|tưới cây/i.test(fullText);
  const hasWolfEnc = /\bwolf\b|\bloud sound\b|\bbehind a tree\b|\bscared\b|\bdon't eat\b|con sói|tiếng động lớn|phía sau cái cây/i.test(fullText);
  const hasForest  = /\bforest\b|\bwoods\b|\briver\b|trong rừng|bờ sông/i.test(fullText);

  const theme = isBirthday
    ? 'birthday'
    : (isRescue
      ? 'rescue_reunion'
      : (hasNight
        ? 'starry_adventure'
        : (hasGarden
          ? 'garden'
          : ((hasWolfEnc || (hasForest && /\bapples?\b|\briver\b|quả táo|bờ sông/i.test(fullText)))
            ? 'forest_encounter'
            : 'playtime_park'))));

  const suggestedWorld = isBirthday
    ? 'cozy-room'
    : (hasPond
      ? 'riverside-pond'
      : (hasNight
        ? 'starry-hill'
        : (hasGarden
          ? 'garden-cross-section'
          : (theme === 'forest_encounter' ? 'forest-clearing' : 'sunny-meadow'))));

  const suggestedWash = hasNight
    ? { color: '#2b3975', waxPreset: 'starry-night' }
    : (isBirthday
      ? { color: '#d47c85', waxPreset: 'birthday-confetti' }
      : (hasGarden && /\brain\b|mưa/i.test(fullText)
        ? { color: '#70b58f', waxPreset: 'rain-and-roots' }
        : { color: '#d47c85', waxPreset: 'friendship-hearts' }));

  const propCheck = detectStoryProps(fullText, customProps);

  const beats = rawBeats.map((b, idx) => {
    const id = 'l' + String(idx + 1).padStart(2, '0');
    const en = b.en || b.vi;
    const vi = b.vi || '';
    const mood = detectBeatMood(en, vi, theme);
    const kw = pickKeyword(en);
    const isAll = b.speaker === 'all';
    const vInfo = isAll ? ALL_VOICE : (b.speaker ? b.speaker.rule : NARRATOR_VOICE);
    return {
      id,
      speakerType: isAll ? 'all' : (b.speaker ? b.speaker.type : 'narrator'),
      speakerName: isAll ? 'Everyone' : (b.speaker ? b.speaker.name : 'Narrator'),
      speakerIcon: isAll ? '🎉' : (b.speaker ? b.speaker.icon : '📖'),
      en, vi,
      sayEn: ttsSafeEn(en),
      sayVi: ttsSafeVi(vi),
      mood,
      key: kw.key,
      hiCol: kw.col,
      enVoice: vInfo.enVoice, enSpeed: vInfo.enSpeed, enLang: vInfo.enLang,
      viVoice: vInfo.viVoice, viRate: vInfo.viRate, viPitch: vInfo.viPitch,
    };
  });

  return {
    cast, beats, fullText, theme,
    hints: {
      theme, isBirthday, hasForest, hasGarden, hasNight,
      hasApples: /\bapples?\b|quả táo/i.test(fullText),
      hasHouse: /\bhouse\b|ngôi nhà/i.test(fullText),
      suggestedWorld, suggestedWash,
      ...propCheck
    }
  };
}

function estimateBeatDur(beat, narrationMode) {
  const enWords = (beat.en || '').split(/\s+/).filter(Boolean).length;
  const viWords = (beat.vi || '').split(/\s+/).filter(Boolean).length;
  const enDur = Math.max(0.95, Number((enWords * 0.36 + 0.35).toFixed(2)));
  const viDur = viWords ? Math.max(0.95, Number((viWords * 0.27 + 0.35).toFixed(2))) : 0;
  if (narrationMode === 'en') return { enDur, viDur: 0, totalDur: enDur };
  if (narrationMode === 'vi') return { enDur: 0, viDur: viDur || enDur, totalDur: viDur || enDur };
  return { enDur, viDur, totalDur: Number((enDur + (viDur ? 0.30 + viDur : 0)).toFixed(2)) };
}

function dedupStates(states) {
  states.sort((a, b) => a.t - b.t);
  const out = [];
  for (const s of states) {
    if (out.length && Math.abs(out[out.length - 1].t - s.t) < 0.08) {
      out[out.length - 1] = { ...out[out.length - 1], ...s };
    } else out.push(s);
  }
  return out;
}

/**
 * Choreograph Birthday / Cozy Room Party theme!
 */
function buildBirthdayScene({ cast, B, silences, finalWash, totalDur, fridgeStart, customProps, geminiPlan }) {
  const findIdx = pred => B.findIndex(pred);
  const iBalloons   = findIdx(b => b.mood === 'show_balloons');
  const iCakeMake   = findIdx(b => b.mood === 'show_cake');
  const iKnock      = findIdx(b => b.mood === 'knock_door');
  const iDoorOpen   = findIdx((b, i) => i >= Math.max(0, iKnock) && (b.mood === 'door_open_enter' || b.speakerType === 'gray_wolf'));
  const iPresent    = findIdx(b => b.mood === 'present_gift');
  const iOpenGift   = findIdx(b => b.mood === 'open_gift_car');
  const iTable      = findIdx(b => b.mood === 'sit_table');
  const iSing       = findIdx(b => b.mood === 'sing_birthday');
  const iWish       = findIdx(b => b.mood === 'blow_candles');
  const iBlowActual = findIdx(b => /blows? out|thổi tắt/i.test(`${b.en} ${b.vi}`));
  const iBlow       = iBlowActual >= 0 ? iBlowActual : iWish;
  const iAllYay     = findIdx((b, i) => i >= Math.max(0, iBlow) && (b.speakerType === 'all' || b.mood === 'cheer_friend'));

  const tBalloons = iBalloons >= 0 ? B[iBalloons].vt : 4.0;
  const tCake     = iCakeMake >= 0 ? B[iCakeMake].vt : (iTable >= 0 ? B[iTable].vt - 0.5 : 10.0);
  const tKnock    = iKnock    >= 0 ? B[iKnock].vt : -1;
  const tDoorOpen = iDoorOpen >= 0 ? B[iDoorOpen].vt : (tKnock >= 0 ? tKnock + 4.0 : 12.0);
  const tPresent  = iPresent  >= 0 ? B[iPresent].vt : tDoorOpen + 2.5;
  const tOpenGift = iOpenGift >= 0 ? B[iOpenGift].vt : tPresent + 4.0;
  const tGiftSet  = Number(Math.max(tPresent + 0.4, tOpenGift - 0.7).toFixed(2));
  const tTable    = iTable    >= 0 ? B[iTable].vt : tOpenGift + 5.0;
  const tSing     = iSing     >= 0 ? B[iSing].vt : tTable + 4.0;
  const tBlow     = iBlow     >= 0 ? B[iBlow].vt : tSing + 4.0;
  const washStart = Number((tSing > 0 ? tSing : tTable).toFixed(2));

  const entities = [];

  // 1. Wooden Door on the left wall (closed → knocks → swings open for Gray Wolf!)
  const doorStates = [{ t: 0.0, mood: 'closed' }];
  if (tKnock >= 0) doorStates.push({ t: Number(Math.max(0.1, tKnock - 0.25).toFixed(2)), mood: 'knock' });
  doorStates.push({ t: Number(Math.max(0.2, tDoorOpen - 0.2).toFixed(2)), mood: 'open' });
  entities.push({ id: 'door', type: 'door', x: 430, y: 1125, scale: 1.0, tStart: 0.0, drawDur: 0.0, states: dedupStates(doorStates) });

  // 2. Colorful Red / Blue / Yellow Balloons (appear right when Cat mentions balloons!)
  entities.push({ id: 'balloons', type: 'balloons', x: 960, y: 1118, scale: 1.05, tStart: tBalloons, drawDur: 1.1, fillDur: 1.0, states: [{ t: 0.0, mood: 'float' }] });

  // 3. Party Table & Big 5-Candle Birthday Cake (candles stay lit until Little Dog actually blows them out!)
  entities.push({ id: 'party_table', type: 'party_table', x: 2040, y: 1295, scale: 1.05, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'idle' }] });
  entities.push({
    id: 'birthday_cake', type: 'birthday_cake', x: 2040, y: 1142, scale: 1.05, tStart: tCake, drawDur: 1.1, fillDur: 1.1,
    states: [
      { t: 0.0, mood: 'lit' },
      { t: Number((tBlow + 1.10).toFixed(2)), mood: 'blown' }
    ]
  });

  // 4. Birthday Present Gift Box (set down cleanly right as Wolf hands it over → pops open!) & Red Toy Car!
  entities.push({
    id: 'gift_box', type: 'gift_box', x: 1185, y: 1275, scale: 0.96, tStart: tGiftSet, drawDur: 0.45, fillDur: 0.45,
    states: [
      { t: 0.0, mood: 'closed' },
      { t: Number(Math.max(tGiftSet + 0.25, tOpenGift).toFixed(2)), mood: 'open' }
    ]
  });
  entities.push({
    id: 'toy_car', type: 'toy_car', x: 1335, y: 1275, scale: 0.96, tStart: Number((tOpenGift + 0.45).toFixed(2)), drawDur: 0.85, fillDur: 0.8,
    states: [
      { t: 0.0, mood: 'idle' },
      { t: Number((tOpenGift + 3.2).toFixed(2)), mood: 'zoom' },
      { t: Number((tTable - 0.3).toFixed(2)), mood: 'idle' }
    ]
  });

  // 5. Choreograph Cast (Dog wears Birthday Hat, Cat prepares party clear of toy car, Wolf enters door with present!)
  const dog  = cast.find(c => c.type === 'little_dog') || cast[0];
  const cat  = cast.find(c => c.type === 'tabby_cat') || cast[1];
  const wolf = cast.find(c => c.type === 'gray_wolf') || cast[2];

  if (dog) {
    const st = [{ t: 0.0, x: 1040, y: 1265, view: 'r34', expr: 'happy', pose: 'wave', hat: true }];
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      if (b.mood === 'knock_door') st.push({ t: b.vt, view: 'l34', expr: 'curious', pose: 'stand', hat: true });
      else if (b.mood === 'door_open_enter') st.push({ t: b.vt, x: 1020, y: 1265, moveDur: 0.8, view: 'l34', expr: 'happy', pose: 'wave', hat: true });
      else if (b.mood === 'open_gift_car') st.push({ t: b.vt, x: 1000, y: 1265, view: 'r34', expr: 'excited', pose: 'cheer', hat: true });
      else if (b.mood === 'sit_table') st.push({ t: Number(Math.max(0, b.vt - 0.5).toFixed(2)), x: 1715, y: 1275, moveDur: 1.3, view: 'r34', expr: 'happy', pose: 'stand', hat: true });
      else if (b.mood === 'sing_birthday') st.push({ t: b.vt, view: 'r34', expr: 'excited', pose: 'sing', hat: true });
      else if (i === iBlow) st.push({ t: b.vt, x: 1765, y: 1275, moveDur: 0.45, view: 'r34', expr: 'wish', pose: 'blow', hat: true });
      else if (b.mood === 'blow_candles') st.push({ t: b.vt, view: 'r34', expr: 'wish', pose: 'stand', hat: true });
      else if (b.speakerType === 'all' || (b.speakerType === dog.type && b.mood === 'cheer_friend')) st.push({ t: b.vt, view: 'front', expr: 'excited', pose: 'cheer', hat: true });
      else if (b.speakerType === dog.type) st.push({ t: b.vt, view: b.vt >= tTable ? 'r34' : (b.vt >= tKnock && b.vt < tOpenGift ? 'l34' : 'r34'), expr: 'happy', pose: b.mood === 'show_cake' ? 'cheer' : 'wave', hat: true });
    }
    entities.push({ id: dog.type, type: dog.type, x: 1040, y: 1265, scale: 1.02, tStart: 0.0, drawDur: 0.0, states: dedupStates(st) });
  }

  if (cat) {
    const st = [{ t: 0.0, x: 1520, y: 1265, view: 'l34', expr: 'happy', pose: 'wave', hat: true }];
    for (const b of B) {
      if (b.mood === 'knock_door') st.push({ t: b.vt, view: 'l34', expr: 'curious', pose: 'stand', hat: true });
      else if (b.mood === 'show_balloons') st.push({ t: b.vt, view: 'l34', expr: 'excited', pose: 'cheer', hat: true });
      else if (b.mood === 'sit_table') st.push({ t: Number(Math.max(0, b.vt - 0.5).toFixed(2)), x: 2365, y: 1275, moveDur: 1.3, view: 'l34', expr: 'happy', pose: 'stand', hat: true });
      else if (b.mood === 'sing_birthday') st.push({ t: b.vt, view: 'l34', expr: 'excited', pose: 'sing', hat: true });
      else if (b.mood === 'blow_candles') st.push({ t: b.vt, view: 'l34', expr: 'kind', pose: 'stand', hat: true });
      else if (b.speakerType === 'all' || (b.speakerType === cat.type && b.mood === 'cheer_friend')) st.push({ t: b.vt, view: 'front', expr: 'excited', pose: 'cheer', hat: true });
      else if (b.speakerType === cat.type) st.push({ t: b.vt, view: 'l34', expr: 'happy', pose: 'wave', hat: true });
    }
    entities.push({ id: cat.type, type: cat.type, x: 1520, y: 1265, scale: 1.00, tStart: 0.0, drawDur: 0.0, states: dedupStates(st) });
  }

  if (wolf) {
    const st = [
      { t: 0.0, x: 430, y: 1235, view: 'r34', expr: 'friendly', pose: 'wave', hat: true },
      { t: Number((tDoorOpen + 0.25).toFixed(2)), x: 695, y: 1265, moveDur: 1.2, view: 'r34', expr: 'friendly', pose: 'walk', hat: true },
      { t: Number((tDoorOpen + 1.50).toFixed(2)), view: 'r34', expr: 'happy', pose: 'gift', hat: true },
      { t: tGiftSet, view: 'r34', expr: 'happy', pose: 'stand', hat: true },
    ];
    for (const b of B) {
      if (b.vt < tDoorOpen) continue;
      if (b.mood === 'present_gift') st.push({ t: b.vt, x: 735, y: 1265, moveDur: 0.8, view: 'r34', expr: 'happy', pose: 'gift', hat: true });
      else if (b.mood === 'open_gift_car') st.push({ t: b.vt, view: 'r34', expr: 'happy', pose: 'stand', hat: true });
      else if (b.mood === 'sit_table') st.push({ t: Number(Math.max(tDoorOpen + 1, b.vt - 0.5).toFixed(2)), x: 2635, y: 1270, moveDur: 1.4, view: 'l34', expr: 'happy', pose: 'stand', hat: true });
      else if (b.mood === 'sing_birthday') st.push({ t: b.vt, view: 'l34', expr: 'happy', pose: 'sing', hat: true });
      else if (b.mood === 'blow_candles') st.push({ t: b.vt, view: 'l34', expr: 'happy', pose: 'stand', hat: true });
      else if (b.speakerType === 'all' || (b.speakerType === wolf.type && b.mood === 'cheer_friend')) st.push({ t: b.vt, view: 'front', expr: 'happy', pose: 'cheer', hat: true });
      else if (b.speakerType === wolf.type && b.vt >= tGiftSet) st.push({ t: b.vt, view: b.vt >= tTable ? 'l34' : 'r34', expr: 'happy', pose: 'wave', hat: true });
    }
    entities.push({ id: wolf.type, type: wolf.type, x: 430, y: 1235, scale: 0.98, tStart: tDoorOpen, drawDur: 0.45, states: dedupStates(st) });
  }

  // Smooth Birthday Room Camera Path
  const cam = [
    { t: 0.00,                                        x: 1120, y: 950,  s: 0.88 },
    { t: Number(Math.max(2.0, tBalloons).toFixed(2)), x: 1140, y: 940,  s: 0.86 },
    { t: Number(Math.max(4.0, tCake).toFixed(2)),     x: 1500, y: 970,  s: 0.80 },
    ...(tKnock >= 0 ? [{ t: Number(Math.max(5.0, tKnock - 0.3).toFixed(2)), x: 860, y: 975, s: 0.92 }] : []),
    { t: Number(Math.max(6.0, tDoorOpen).toFixed(2)), x: 960,  y: 985,  s: 0.90 },
    { t: Number(Math.max(8.0, tOpenGift).toFixed(2)), x: 1140, y: 1005, s: 0.92 },
    { t: Number(Math.max(10.0, tTable).toFixed(2)),   x: 2240, y: 970,  s: 0.84 },
    { t: Number(Math.max(12.0, tBlow).toFixed(2)),    x: 2180, y: 980,  s: 0.90 },
    ...(iAllYay >= 0 ? [{ t: B[iAllYay].vt, x: 2240, y: 970, s: 0.82 }] : []),
    { t: Number(fridgeStart.toFixed(2)),              x: 1600, y: 900,  s: 0.60 },
    { t: totalDur,                                    x: 1600, y: 900,  s: 0.60 },
  ];

  // Cleanly spaced Birthday Vocabulary Tags (zero collisions with bunting, title, balloons, window, or cast!)
  const tags = [
    { id: 'tag_birthday', t: Number((B[0]?.vt + 1.5 || 2.0).toFixed(2)), x: 1430, y: 650, en: 'BIRTHDAY', vi: 'sinh nhật', col: '#d94436' },
    { id: 'tag_balloons', t: Number((tBalloons + 0.6).toFixed(2)),        x: 960,  y: 635, en: 'BALLOONS', vi: 'bóng bay',  col: '#4a8ec2' },
    { id: 'tag_present',  t: Number((tPresent + 0.5).toFixed(2)),         x: 760,  y: 735, en: 'PRESENT',  vi: 'món quà',   col: '#d94436' },
    { id: 'tag_car',      t: Number((tOpenGift + 0.8).toFixed(2)),        x: 1340, y: 845, en: 'TOY CAR',  vi: 'ô tô đỏ',   col: '#d94436' },
    { id: 'tag_cake',     t: Number((tTable + 0.8).toFixed(2)),           x: 2110, y: 845, en: 'CAKE',     vi: 'bánh kem',  col: '#e8877d' },
    { id: 'tag_wish',     t: Number((tBlow + 0.5).toFixed(2)),            x: 2470, y: 740, en: 'WISH',     vi: 'điều ước',  col: '#5a9c46' },
  ].filter(tg => tg.t < totalDur - 2.0);

  return { entities, camera: cam, tags, washStart, titlePos: { x: 520, y: 495, t: 0.5 } };
}

/**
 * Helper: Pick clean bilingual vocabulary tags for non-birthday scenes, placed cleanly inside each beat's shot!
 */
function pickSmartTags(B, slots, totalDur, excludeTitleBox = null) {
  const tags = [];
  const used = new Set();
  for (const v of VOCAB_DICT) {
    if (tags.length >= Math.min(6, slots.length)) break;
    const hitBeat = B.find(b => v.re.test(b.en));
    if (!hitBeat || used.has(v.en)) continue;
    used.add(v.en);
    const slot = slots[tags.length];
    let tx = slot.x, ty = slot.y;
    if (excludeTitleBox && Math.abs(tx - excludeTitleBox.x) < 480 && Math.abs(ty - excludeTitleBox.y) < 175) {
      ty += 185;
    }
    const tgT = Number(Math.min(totalDur - 2.6, hitBeat.vt + Math.min(1.0, hitBeat.dur * 0.25)).toFixed(2));
    if (tgT > 0.4) {
      tags.push({ id: 'tag_' + v.en.toLowerCase().replace(/\s+/g, '_'), t: tgT, x: tx, y: ty, en: v.en, vi: v.vi, col: v.col });
    }
  }
  return tags.sort((a, b) => a.t - b.t);
}

/**
 * Choreograph GEMINI AI BESPOKE STORYBOARD (unique camera framing, scenery, moving AI actors, custom tags!)
 */
function buildGeminiStoryboardScene({ cast, B, geminiPlan, allCustomProps, totalDur, fridgeStart, finalWorld }) {
  const shots = geminiPlan.shots || [];
  const entities = [];

  // 1. Curated scenery from Gemini (guaranteed at least sun/star sky anchor if not indoors)
  const scList = geminiPlan.scenery || [];
  if (finalWorld !== 'cozy-room' && !scList.some(s => s.type === 'sun' || s.type === 'star')) {
    entities.push(finalWorld === 'starry-hill'
      ? { id: 'sc_star_0', type: 'star', x: 1620, y: 310, scale: 1.0, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'twinkle' }] }
      : { id: 'sc_sun_0', type: 'sun', x: 2540, y: 295, scale: 0.92, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'warm' }] });
  }
  scList.forEach((s, i) => {
    entities.push({
      id: `sc_${s.type}_${i}`, type: s.type, x: s.x, y: s.y, scale: s.scale ?? 1.0,
      tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: s.mood || 'plain' }]
    });
  });

  // 2. Build dynamic state timelines for every actor appearing across Gemini's shots!
  const actorMap = new Map();
  const castScale = new Map(cast.map(c => [c.type, c.rule?.defaultScale || 1.0]));
  const customMap = new Map(allCustomProps.map(cp => [cp.type, cp]));

  shots.forEach((sh, si) => {
    const bt = B[Math.min(B.length - 1, sh.beat)] || B[0] || { vt: si * 3.0 };
    const tShot = si === 0 ? 0.0 : Number(Math.max(0.2, bt.vt - 0.35).toFixed(2));
    for (const a of (sh.actors || [])) {
      if (!actorMap.has(a.type)) {
        const sc = castScale.get(a.type) || customMap.get(a.type)?.defaultScale || 1.0;
        actorMap.set(a.type, {
          id: a.type, type: a.type, x: a.x, y: a.y, scale: sc,
          tStart: si === 0 ? 0.0 : tShot,
          drawDur: si === 0 ? 0.0 : 0.65,
          fillDur: si === 0 ? 0.0 : 0.60,
          states: [],
        });
      }
      const rec = actorMap.get(a.type);
      const prevSt = rec.states[rec.states.length - 1];
      const moved = prevSt && (Math.abs(prevSt.x - a.x) > 35 || Math.abs(prevSt.y - a.y) > 20);
      rec.states.push({
        t: tShot, x: a.x, y: a.y,
        ...(moved ? { moveDur: 1.25 } : {}),
        view: a.view || 'r34',
        pose: a.pose || 'stand',
        expr: a.expr || 'happy',
        ...(a.hat ? { hat: true } : {}),
      });
    }
  });

  // Ensure main cast members appear even if Gemini omitted one
  const shot0 = shots[0] || { cam: { x: 1600, y: 960, s: 0.84 } };
  let fallbackOff = -260;
  for (const c of cast) {
    if (!actorMap.has(c.type)) {
      const fx = Math.max(420, Math.min(2780, shot0.cam.x + fallbackOff));
      fallbackOff += 240;
      actorMap.set(c.type, {
        id: c.type, type: c.type, x: fx, y: 1265, scale: c.rule?.defaultScale || 1.0,
        tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, x: fx, y: 1265, view: 'r34', pose: 'stand', expr: 'happy' }]
      });
    }
  }
  for (const ent of actorMap.values()) {
    ent.states = dedupStates(ent.states);
    entities.push(ent);
  }

  // 3. Camera path directly from Gemini's shots + smooth fridge pull-back
  const camera = [];
  shots.forEach((sh, si) => {
    const bt = B[Math.min(B.length - 1, sh.beat)] || B[0] || { vt: si * 3.0 };
    const tShot = si === 0 ? 0.0 : Number(Math.max(0.25, bt.vt - 0.35).toFixed(2));
    camera.push({ t: tShot, x: sh.cam.x, y: sh.cam.y, s: sh.cam.s });
    // Hold gently on final shot before fridge zoom-out
    if (si === shots.length - 1 && fridgeStart - tShot > 2.2) {
      camera.push({ t: Number((fridgeStart - 1.2).toFixed(2)), x: sh.cam.x, y: sh.cam.y, s: sh.cam.s });
    }
  });
  camera.push({ t: Number(fridgeStart.toFixed(2)), x: 1600, y: 900, s: 0.60 });
  camera.push({ t: totalDur, x: 1600, y: 900, s: 0.60 });

  // 4. Title placed cleanly inside Shot 0 top-left/top sky + Gemini tags placed cleanly above their shots!
  const titleX = Math.max(540, Math.min(2620, Math.round(shot0.cam.x - 280)));
  const titlePos = { x: titleX, y: 490, t: 0.50 };

  const tags = [];
  const usedTagPos = [];
  const rawTags = (geminiPlan.tags && geminiPlan.tags.length) ? geminiPlan.tags : [];
  for (const tg of rawTags) {
    const bt = B[Math.min(B.length - 1, tg.beat)] || B[0];
    if (!bt) continue;
    // Find active shot for this beat so the tag is GUARANTEED inside frame!
    let activeShot = shots[0];
    for (const sh of shots) { if (sh.beat <= tg.beat) activeShot = sh; }
    let tx = Math.max(460, Math.min(2740, activeShot.cam.x + ((tags.length % 2 === 0) ? 180 : -140)));
    let ty = 690 + (tags.length % 2) * 105;
    if (Math.abs(tx - titlePos.x) < 360 && Math.abs(ty - titlePos.y) < 175) {
      tx = Math.min(2720, activeShot.cam.x + 310);
      ty = 720;
    }
    for (const prev of usedTagPos) {
      if (Math.abs(prev.x - tx) < 230 && Math.abs(prev.y - ty) < 120) {
        tx = tx + 240 <= 2740 ? tx + 240 : Math.max(480, tx - 240);
        ty = ty < 770 ? ty + 110 : ty - 105;
      }
    }
    usedTagPos.push({ x: tx, y: ty });
    const tgT = Number(Math.min(totalDur - 2.6, bt.vt + Math.min(0.9, bt.dur * 0.25)).toFixed(2));
    if (tgT > 0.4) {
      tags.push({ id: 'tag_' + tg.en.toLowerCase().replace(/[^a-z0-9]+/g, '_'), t: tgT, x: Math.round(tx), y: Math.round(ty), en: tg.en, vi: tg.vi, col: tg.col });
    }
  }

  const washIdx = Number.isInteger(geminiPlan.wash?.beatIndex) ? geminiPlan.wash.beatIndex : Math.floor(B.length * 0.65);
  const washBeat = B[Math.min(B.length - 1, Math.max(0, washIdx))] || B[B.length - 1] || { vt: 10 };
  const washStart = Number((washBeat.vt + 0.35).toFixed(2));

  return { entities, camera, tags, washStart, titlePos };
}

/**
 * Choreograph RESCUE & REUNION story (e.g. Lost Little Duckling -> Comfort Close-up -> Duck Pond Family Reunion!)
 */
function buildRescueReunionScene({ cast, B, allCustomProps, totalDur, fridgeStart, finalWorld }) {
  const findIdx = pred => B.findIndex(pred);
  const iFindLost = Math.max(1, findIdx(b => /cry|lost|can't find|little duck|vịt nhỏ|khóc|lạc/i.test(`${b.en} ${b.vi}`)));
  const iHelp     = findIdx((b, i) => i >= iFindLost && /help|don't worry|giúp|đừng lo/i.test(`${b.en} ${b.vi}`));
  const iSpotMom  = findIdx((b, i) => i >= Math.max(iFindLost + 1, iHelp) && /is that your|found you|mommy!|mẹ bạn|tìm thấy mẹ/i.test(`${b.en} ${b.vi}`));
  const iCheer    = findIdx((b, i) => i >= Math.max(1, iSpotMom) && /hooray|yay|family|happy|helping|hoan hô|đoàn tụ|hạnh phúc/i.test(`${b.en} ${b.vi}`));

  const tLost    = B[Math.min(B.length - 1, iFindLost)]?.vt ?? 4.0;
  const tHelp    = iHelp >= 0 ? B[iHelp].vt : tLost + 5.0;
  const tReunion = iSpotMom >= 0 ? B[iSpotMom].vt : Math.max(tHelp + 4.0, B[Math.floor(B.length * 0.6)]?.vt ?? 14.0);
  const tCheer   = iCheer >= 0 ? B[iCheer].vt : tReunion + 3.0;
  const washStart = Number((tReunion + 0.35).toFixed(2));

  const entities = [
    { id: 'sun', type: 'sun', x: 2660, y: 295, scale: 0.92, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'warm' }] },
    { id: 'tree_left', type: 'tree', x: 340, y: 1125, scale: 1.06, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'plain' }] },
    { id: 'cloud_l', type: 'cloud', x: 1120, y: 310, scale: 0.90, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'fluffy' }] },
    { id: 'bird_pond', type: 'bird', x: 2740, y: 740, scale: 0.88, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'perch' }, { t: tReunion, mood: 'fly' }] },
  ];
  if (finalWorld !== 'riverside-pond') {
    entities.push({ id: 'house_far', type: 'house', x: 2740, y: 1120, scale: 0.95, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'day' }] });
  }

  // Detect custom baby/lost animal & parent animal (e.g. custom_yellow_duckling + custom_mother_duck!)
  const childCustom  = allCustomProps.find(cp => /duckling|baby|little|puppy|kitten|bunny|vịt con/i.test(`${cp.type} ${cp.label}`)) || allCustomProps[0] || null;
  const parentCustom = allCustomProps.find(cp => cp !== childCustom && /mother|mom|mama|parent|dad|mẹ/i.test(`${cp.type} ${cp.label}`)) || null;

  // Main helpers (e.g. Little Dog & Tabby Cat)
  const helpers = cast.filter(c => c.type !== 'bird').slice(0, 3);
  const startXs = [780, 1080, 560];
  const comfortXs = [1040, 1265, 840];
  const pondXs = [1710, 1955, 1500];

  helpers.forEach((c, ci) => {
    const isAnimal = c.type === 'little_dog' || c.type === 'tabby_cat' || c.type === 'gray_wolf';
    const st = [
      { t: 0.0, x: startXs[ci], y: 1265, view: ci === 1 ? 'l34' : 'r34', expr: 'happy', pose: 'wave' },
      { t: Number(Math.max(0.5, tLost - 0.3).toFixed(2)), x: comfortXs[ci], y: 1265, moveDur: 1.2, view: 'r34', expr: 'curious', pose: isAnimal ? 'walk' : 'stand' },
      { t: Number((tLost + 1.0).toFixed(2)), view: 'r34', expr: 'kind', pose: 'stand' },
      { t: tHelp, view: 'r34', expr: 'kind', pose: 'wave' },
      { t: Number(Math.max(tHelp + 0.5, tReunion - 1.1).toFixed(2)), x: pondXs[ci], y: 1265, moveDur: 1.5, view: 'r34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' },
      { t: Number((tReunion + 0.4).toFixed(2)), view: 'r34', expr: 'excited', pose: 'wave' },
      { t: tCheer, view: 'front', expr: 'excited', pose: 'cheer' },
    ];
    entities.push({ id: c.type, type: c.type, x: startXs[ci], y: 1265, scale: c.rule?.defaultScale || 1.0, tStart: 0.0, drawDur: 0.0, states: dedupStates(st) });
  });

  // Animate Lost Baby Animal (crying teardrops -> hops along -> runs happily to Mommy!)
  if (childCustom) {
    const cSt = [
      { t: 0.0, x: 1545, y: 1272, view: 'l34', expr: 'cry', pose: 'stand' },
      { t: tHelp, x: 1545, y: 1272, view: 'l34', expr: 'happy', pose: 'wave' },
      { t: Number(Math.max(tHelp + 0.6, tReunion - 0.9).toFixed(2)), x: 2235, y: 1272, moveDur: 1.45, view: 'r34', expr: 'excited', pose: 'walk' },
      { t: Number((tReunion + 0.65).toFixed(2)), x: 2235, y: 1272, view: 'r34', expr: 'excited', pose: 'cheer' },
      { t: tCheer, view: 'front', expr: 'excited', pose: 'cheer' },
    ];
    entities.push({
      id: childCustom.type, type: childCustom.type, x: 1545, y: 1272, scale: Number(childCustom.defaultScale || 1.0),
      tStart: Number(Math.max(0, tLost - 0.4).toFixed(2)), drawDur: 0.65, fillDur: 0.6, states: dedupStates(cSt)
    });
  }

  // Animate Parent Animal waiting by the duck pond (waves & cheers on reunion!)
  if (parentCustom) {
    const pSt = [
      { t: 0.0, x: 2495, y: 1268, view: 'l34', expr: 'happy', pose: 'stand' },
      { t: Number((tReunion + 0.2).toFixed(2)), x: 2465, y: 1268, moveDur: 0.8, view: 'l34', expr: 'excited', pose: 'wave' },
      { t: tCheer, view: 'front', expr: 'excited', pose: 'cheer' },
    ];
    entities.push({
      id: parentCustom.type, type: parentCustom.type, x: 2495, y: 1268, scale: Number(parentCustom.defaultScale || 1.12),
      tStart: 0.0, drawDur: 0.0, states: dedupStates(pSt)
    });
  }

  // Distinct Rescue Camera: Opening Mid-Wide -> Emotional Close-up Push-in on Crying Friend -> Pond Glide -> Reunion Pull-Back!
  const camera = [
    { t: 0.00,                                            x: 1020, y: 950,  s: 0.84 },
    { t: Number(Math.max(1.5, tLost - 0.4).toFixed(2)),   x: 1320, y: 1010, s: 1.04 },
    { t: Number(Math.max(3.0, tHelp).toFixed(2)),         x: 1300, y: 1005, s: 1.02 },
    { t: Number(Math.max(5.0, tReunion - 0.6).toFixed(2)), x: 2140, y: 980,  s: 0.86 },
    { t: Number(Math.max(6.5, tCheer).toFixed(2)),        x: 2110, y: 960,  s: 0.78 },
    { t: Number(fridgeStart.toFixed(2)),                  x: 1600, y: 900,  s: 0.60 },
    { t: totalDur,                                        x: 1600, y: 900,  s: 0.60 },
  ];

  const titlePos = { x: 470, y: 540, t: 0.50 };
  const tagSlots = [
    { x: 1340, y: 690 }, { x: 1590, y: 805 }, { x: 1120, y: 795 },
    { x: 2120, y: 695 }, { x: 2440, y: 775 }, { x: 1840, y: 650 },
  ];
  const tags = pickSmartTags(B, tagSlots, totalDur, titlePos);

  return { entities, camera, tags, washStart, titlePos };
}

/**
 * Choreograph PLAYTIME PARK / SUNNY MEADOW story (Center-out camera, cottage, fence, rainbow — NO scary bush or river!)
 */
function buildPlaytimeParkScene({ cast, B, allCustomProps, totalDur, fridgeStart }) {
  const n = Math.max(1, B.length);
  const tMid1 = B[Math.floor(n * 0.28)]?.vt ?? 5.0;
  const tMid2 = B[Math.floor(n * 0.55)]?.vt ?? 10.0;
  const tClimax = B[Math.floor(n * 0.74)]?.vt ?? 14.0;
  const washStart = Number((tClimax + 0.35).toFixed(2));

  const entities = [
    { id: 'sun', type: 'sun', x: 2580, y: 290, scale: 0.94, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'warm' }] },
    { id: 'cottage', type: 'house', x: 520, y: 1125, scale: 0.96, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'day' }] },
    { id: 'fence_park', type: 'fence', x: 1060, y: 1128, scale: 0.92, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'idle' }] },
    { id: 'tree_park_r', type: 'tree', x: 2740, y: 1125, scale: 1.08, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'apples' }] },
    { id: 'rainbow_park', type: 'rainbow', x: 2060, y: 620, scale: 1.02, tStart: tClimax, drawDur: 1.3, fillDur: 1.1, states: [{ t: 0.0, mood: 'bright' }] },
  ];

  // Center-focused playful blocking (characters play right-to-left & center-out!)
  const players = cast.filter(c => c.type !== 'bird').slice(0, 4);
  const posA = [1320, 1860, 1020, 2140];
  const posB = [1060, 1520, 820, 1820];
  const posC = [1740, 2240, 1480, 2480];
  const posEnd = [1360, 1680, 1080, 1980];

  players.forEach((c, ci) => {
    const isAnimal = c.type === 'little_dog' || c.type === 'tabby_cat' || c.type === 'gray_wolf';
    const st = [
      { t: 0.0, x: posA[ci], y: 1265, view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'happy', pose: 'wave' },
      { t: tMid1, x: posB[ci], y: 1265, moveDur: 1.25, view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' },
      { t: Number((tMid1 + 1.35).toFixed(2)), view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'excited', pose: 'wave' },
      { t: tMid2, x: posC[ci], y: 1265, moveDur: 1.35, view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' },
      { t: Number((tMid2 + 1.45).toFixed(2)), view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'happy', pose: 'stand' },
      { t: tClimax, x: posEnd[ci], y: 1265, moveDur: 1.25, view: 'front', expr: 'excited', pose: 'cheer' },
    ];
    entities.push({ id: c.type, type: c.type, x: posA[ci], y: 1265, scale: c.rule?.defaultScale || 1.0, tStart: 0.0, drawDur: 0.0, states: dedupStates(st) });
  });

  // If there's an AI toy/ball prop, bounce it playfully between the friends across the 3 zones!
  if (allCustomProps.length) {
    const toy = allCustomProps[0];
    entities.push({
      id: toy.type, type: toy.type, x: 1590, y: 1272, scale: Number(toy.defaultScale || 0.95),
      tStart: 0.0, drawDur: 0.6, fillDur: 0.5,
      states: [
        { t: 0.0, x: 1590, y: 1272, pose: 'wave' },
        { t: tMid1, x: 1290, y: 1272, moveDur: 1.1, pose: 'walk' },
        { t: tMid2, x: 1990, y: 1272, moveDur: 1.2, pose: 'walk' },
        { t: tClimax, x: 1525, y: 1272, moveDur: 1.0, pose: 'cheer' },
      ]
    });
  }

  // Distinct Playtime Camera: Wide Center -> Push Left -> Swing Right -> Pull-back Center Rainbow!
  const camera = [
    { t: 0.00,                           x: 1600, y: 945,  s: 0.80 },
    { t: Number(tMid1.toFixed(2)),       x: 1280, y: 1005, s: 0.98 },
    { t: Number(tMid2.toFixed(2)),       x: 1980, y: 1000, s: 0.96 },
    { t: Number(tClimax.toFixed(2)),     x: 1600, y: 925,  s: 0.78 },
    { t: Number(fridgeStart.toFixed(2)), x: 1600, y: 900,  s: 0.60 },
    { t: totalDur,                       x: 1600, y: 900,  s: 0.60 },
  ];

  const titlePos = { x: 1050, y: 550, t: 0.50 };
  const tagSlots = [
    { x: 1260, y: 810 }, { x: 2120, y: 765 }, { x: 1640, y: 825 },
    { x: 1680, y: 655 }, { x: 2380, y: 660 }, { x: 1020, y: 825 },
  ];
  const tags = pickSmartTags(B, tagSlots, totalDur, titlePos);

  return { entities, camera, tags, washStart, titlePos };
}

/**
 * Choreograph STARRY HILL / NIGHTTIME ADVENTURE (Intimate hilltop -> slow upward skyward tilt to glowing stars!)
 */
function buildStarryAdventureScene({ cast, B, totalDur, fridgeStart }) {
  const n = Math.max(1, B.length);
  const tMid = B[Math.floor(n * 0.40)]?.vt ?? 6.0;
  const tSky = B[Math.floor(n * 0.68)]?.vt ?? 11.0;
  const washStart = Number((tMid + 0.35).toFixed(2));

  const entities = [
    { id: 'star_main', type: 'star', x: 1600, y: 310, scale: 1.15, tStart: tMid, drawDur: 1.0, fillDur: 0.9, states: [{ t: 0.0, mood: 'twinkle' }] },
    { id: 'star_l', type: 'star', x: 1180, y: 410, scale: 0.80, tStart: tMid + 0.5, drawDur: 0.8, fillDur: 0.7, states: [{ t: 0.0, mood: 'twinkle' }] },
    { id: 'star_r', type: 'star', x: 2040, y: 385, scale: 0.85, tStart: tMid + 0.8, drawDur: 0.8, fillDur: 0.7, states: [{ t: 0.0, mood: 'twinkle' }] },
    { id: 'hill_tree', type: 'tree', x: 640, y: 1095, scale: 1.06, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'plain' }] },
  ];

  const friends = cast.filter(c => c.type !== 'bird').slice(0, 3);
  const xs = [1380, 1780, 1120];
  friends.forEach((c, ci) => {
    entities.push({
      id: c.type, type: c.type, x: xs[ci], y: 1225, scale: c.rule?.defaultScale || 1.0, tStart: 0.0, drawDur: 0.0,
      states: [
        { t: 0.0, x: xs[ci], y: 1225, view: ci % 2 === 0 ? 'r34' : 'l34', expr: 'happy', pose: 'stand' },
        { t: tMid, view: 'front', expr: 'curious', pose: 'wave' },
        { t: tSky, view: 'front', expr: 'excited', pose: 'cheer' },
      ]
    });
  });

  // Unique Starry Camera: Close-up on Hilltop -> Slow Skyward Tilt Upward to Stars!
  const camera = [
    { t: 0.00,                           x: 1580, y: 1010, s: 1.00 },
    { t: Number(tMid.toFixed(2)),        x: 1600, y: 925,  s: 0.90 },
    { t: Number(tSky.toFixed(2)),        x: 1600, y: 845,  s: 0.80 },
    { t: Number(fridgeStart.toFixed(2)), x: 1600, y: 900,  s: 0.60 },
    { t: totalDur,                       x: 1600, y: 900,  s: 0.60 },
  ];

  const titlePos = { x: 1600, y: 625, t: 0.50 };
  const tagSlots = [
    { x: 1060, y: 815 }, { x: 2140, y: 815 }, { x: 1240, y: 935 },
    { x: 1960, y: 935 }, { x: 1600, y: 830 },
  ];
  const tags = pickSmartTags(B, tagSlots, totalDur, titlePos);

  return { entities, camera, tags, washStart, titlePos };
}

/**
 * Build a complete, ready-to-render, Studio-editable project.json from any pasted story script!
 * Supports 6 distinct story worlds & camera archetypes offline + full Gemini AI bespoke storyboarding!
 */
export function buildAutoDirectedProject(opts = {}) {
  const {
    slug = 'my-crayon-story',
    title = 'My Crayon Story',
    titleVi = 'Câu Chuyện Sáp Màu',
    aspect = '16:9',
    narrationMode = 'bilingual',
    worldPreset = 'auto',
    washPreset = 'auto',
    scriptText = '',
    measuredDurs = null,
    customProps = [],
    geminiPlan = null,
  } = opts;

  const allKnownCustom = [...(customProps || [])];
  for (const gp of (geminiPlan?.generatedProps || [])) {
    if (gp?.type && !allKnownCustom.some(x => x.type === gp.type)) allKnownCustom.push(gp);
  }

  const parsed = parseStoryScript(scriptText, allKnownCustom);
  const { cast, beats, hints, theme } = parsed;

  const VALID_WORLDS = ['cozy-room', 'forest-clearing', 'riverside-pond', 'sunny-meadow', 'starry-hill', 'garden-cross-section', 'blank-page'];
  const finalWorld = worldPreset !== 'auto'
    ? worldPreset
    : (geminiPlan?.world && VALID_WORLDS.includes(geminiPlan.world)
      ? geminiPlan.world
      : hints.suggestedWorld);

  const washMap = {
    'auto':         (geminiPlan?.wash?.color || geminiPlan?.wash?.waxPreset)
      ? { color: geminiPlan.wash.color || hints.suggestedWash.color, waxPreset: geminiPlan.wash.waxPreset || hints.suggestedWash.waxPreset }
      : hints.suggestedWash,
    'dawn-rose':    { color: '#d47c85', waxPreset: finalWorld === 'cozy-room' ? 'birthday-confetti' : 'friendship-hearts' },
    'sap-green':    { color: '#70b58f', waxPreset: 'rain-and-roots' },
    'ultramarine':  { color: '#2b3975', waxPreset: 'starry-night' },
    'none':         { color: '#d47c85', waxPreset: 'none', disabled: true },
  };
  const finalWash = washMap[washPreset] || hints.suggestedWash;

  // 1. Identify structural beats & schedule exact/estimated timings
  const n = Math.max(1, beats.length);
  let idxPause1 = beats.findIndex(b => b.mood === 'knock_door' || b.mood === 'rustle_scare' || b.mood === 'reveal_big');
  let idxPause2 = beats.findIndex((b, i) => i > Math.max(0, idxPause1) && (b.mood === 'sad' || b.mood === 'hungry' || b.mood === 'blow_candles'));
  let idxClimax = beats.findIndex((b, i) => i > Math.max(0, idxPause1) && (b.mood === 'picnic' || b.mood === 'sit_table' || b.mood === 'sing_birthday'));
  if (idxPause1 < 0) idxPause1 = Math.max(1, Math.floor(n * 0.30));
  if (idxClimax < 0) idxClimax = Math.max(idxPause1 + 1, Math.floor(n * 0.72));
  const idxEnding = beats.findIndex(b => b.mood === 'ending');

  const subtitles = [];
  const B = [];
  let cur = 0.0;
  for (let i = 0; i < beats.length; i++) {
    const bt = beats[i];
    const d = (measuredDurs && measuredDurs[bt.id]) ? measuredDurs[bt.id] : estimateBeatDur(bt, narrationMode);
    let gap = 0.68;
    if (i === 0) gap = 1.85;
    else if (i === idxPause1) gap = 2.15;
    else if (i === idxPause2) gap = 1.65;
    else if (i === idxClimax) gap = 1.45;
    else if (i === idxEnding) gap = 1.25;
    else if (bt.mood === 'reveal_big' || bt.mood === 'open_gift_car') gap = 1.00;

    const vt = Number((cur + gap).toFixed(2));
    const tot = Number(d.totalDur);
    const enDur = narrationMode === 'bilingual' ? Number(d.enDur || 0) : 0;
    const t0 = Number(Math.max(0, vt - 0.14).toFixed(2));
    const t1 = Number((vt + tot + 0.42).toFixed(2));

    subtitles.push({
      id: bt.id, vt, dur: tot, ...(enDur > 0 ? { enDur } : {}), t0, t1,
      en: bt.en, vi: bt.vi, sayEn: bt.sayEn, sayVi: bt.sayVi,
      key: bt.key, hiCol: bt.hiCol, speaker: bt.speakerType,
      engine: narrationMode === 'vi' ? 'edge-tts' : 'kokoro',
      voice: narrationMode === 'vi' ? bt.viVoice : bt.enVoice,
      speed: bt.enSpeed, enLang: bt.enLang,
      viVoice: bt.viVoice, viRate: bt.viRate, viPitch: bt.viPitch,
    });
    B.push({ ...bt, vt, end: Number((vt + tot).toFixed(2)), t0, t1, dur: tot, enDur });
    cur = vt + tot;
  }

  // Silence beats (up to 2 beats of crisp storybook quiet!)
  const silences = [];
  let sil1End = B[idxPause1] ? B[idxPause1].vt - 0.15 : 0;
  if (idxPause1 > 0 && B[idxPause1] && B[idxPause1 - 1]) {
    const s0 = Number((B[idxPause1 - 1].end + 0.55).toFixed(2));
    const s1 = Number(Math.min(B[idxPause1].vt - 0.18, s0 + 1.15).toFixed(2));
    if (s1 - s0 >= 0.65) { silences.push({ id: 'sil_act2', t0: s0, t1: s1 }); sil1End = s1; }
  }
  let sil2End = (idxPause2 > 0 && B[idxPause2]) ? B[idxPause2].vt - 0.12 : 0;
  if (idxPause2 > 0 && B[idxPause2] && B[idxPause2 - 1]) {
    const s0 = Number((B[idxPause2 - 1].end + 0.30).toFixed(2));
    const s1 = Number(Math.min(B[idxPause2].vt - 0.14, s0 + 1.05).toFixed(2));
    if (s1 - s0 >= 0.65) { silences.push({ id: 'sil_tender', t0: s0, t1: s1 }); sil2End = s1; }
  }

  const lastContentBeat = B[idxEnding > 0 ? idxEnding - 1 : B.length - 1] || B[B.length - 1] || { end: 15 };
  const finalBeat = B[B.length - 1] || { t1: 20 };
  const fridgeStart = Number((lastContentBeat.end + 0.75).toFixed(2));
  const fridgeEnd = Number((fridgeStart + 3.40).toFixed(2));
  const totalDur = Number(Math.max(finalBeat.t1 + 1.85, fridgeEnd + 1.45, 8.0).toFixed(1));

  let entities, camera, tags, washStart, titlePos;
  let directorMode = theme;
  const matchedAndGenCustom = [];
  for (const cp of [...(hints.matchedCustom || []), ...(geminiPlan?.generatedProps || [])]) {
    if (cp?.type && !matchedAndGenCustom.some(x => x.type === cp.type)) matchedAndGenCustom.push(cp);
  }

  if (geminiPlan?.shots?.length >= 2 && theme !== 'birthday') {
    // Full Gemini AI bespoke storyboard!
    directorMode = 'gemini-storyboard';
    const gs = buildGeminiStoryboardScene({ cast, B, geminiPlan, allCustomProps: allKnownCustom, totalDur, fridgeStart, finalWorld });
    ({ entities, camera, tags, washStart, titlePos } = gs);
  } else if (finalWorld === 'cozy-room' || theme === 'birthday') {
    const bday = buildBirthdayScene({ cast, B, silences, finalWash, totalDur, fridgeStart, customProps: allKnownCustom, geminiPlan });
    ({ entities, camera, tags, washStart, titlePos } = bday);
  } else if (theme === 'rescue_reunion' || finalWorld === 'riverside-pond') {
    const resc = buildRescueReunionScene({ cast, B, allCustomProps: matchedAndGenCustom, totalDur, fridgeStart, finalWorld });
    ({ entities, camera, tags, washStart, titlePos } = resc);
  } else if (theme === 'starry_adventure' || finalWorld === 'starry-hill') {
    const star = buildStarryAdventureScene({ cast, B, totalDur, fridgeStart });
    ({ entities, camera, tags, washStart, titlePos } = star);
  } else if (theme === 'playtime_park' && finalWorld !== 'forest-clearing') {
    const park = buildPlaytimeParkScene({ cast, B, allCustomProps: matchedAndGenCustom, totalDur, fridgeStart });
    ({ entities, camera, tags, washStart, titlePos } = park);
  } else {
    // Classic Forest Encounter / Garden choreography (only for wolf/forest/apples/garden stories!)
    const picnicBeat = B[idxClimax] || B[B.length - 1] || { vt: 15, end: 18 };
    washStart = Number((picnicBeat.vt + 0.40).toFixed(2));
    titlePos = { x: 265, y: 500, t: 0.55 };

    entities = [{ id: 'sun', type: 'sun', x: 2560, y: 295, scale: 0.94, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'warm' }] }];
    if (finalWorld === 'forest-clearing' || finalWorld === 'sunny-meadow') {
      entities.push({ id: 'bg_tree_l', type: 'tree', x: 210, y: 1110, scale: 1.08, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'plain' }] });
      const hasRustle = B.some(b => b.mood === 'rustle_scare');
      const rustleStart = silences[0] ? Number((silences[0].t1 + 0.05).toFixed(2)) : (B[idxPause1]?.vt ?? 10);
      const revB = B.find((b, i) => i >= idxPause1 && b.mood === 'reveal_big') || B[Math.min(B.length - 1, idxPause1 + 2)];
      const rustleEnd = revB ? Number(Math.max(rustleStart + 1.5, revB.vt - 0.1).toFixed(2)) : rustleStart + 3.0;
      entities.push({
        id: 'big_oak_mid', type: 'big_tree', x: 1765, y: 1160, scale: 1.04, tStart: 0.0, drawDur: 0.0,
        states: hasRustle ? [{ t: 0.0, mood: 'plain' }, { t: rustleStart, mood: 'rustle' }, { t: rustleEnd, mood: 'plain' }] : [{ t: 0.0, mood: 'plain' }]
      });
      entities.push({
        id: 'bush_mid', type: 'bush', x: 1595, y: 1170, scale: 0.92, tStart: 0.0, drawDur: 0.0,
        states: hasRustle ? [{ t: 0.0, mood: 'idle' }, { t: rustleStart, mood: 'rustle' }, { t: rustleEnd, mood: 'idle' }] : [{ t: 0.0, mood: 'idle' }]
      });
      entities.push({ id: 'picnic_tree', type: 'big_tree', x: 2390, y: 1168, scale: 1.16, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: hints.hasApples ? 'apples' : 'plain' }] });
      entities.push({ id: 'bird', type: 'bird', x: 2155, y: 730, scale: 0.90, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'perch' }, { t: Number((picnicBeat.vt + 3.0).toFixed(2)), mood: 'fly' }] });
      if (hints.hasApples) entities.push({ id: 'basket', type: 'apple_basket', x: 2260, y: 1285, scale: 0.96, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'full' }, { t: picnicBeat.vt, mood: 'half' }] });
      if (hints.hasHouse) entities.push({ id: 'house_bg', type: 'house', x: 640, y: 1120, scale: 0.92, tStart: 0.0, drawDur: 0.0, states: [{ t: 0.0, mood: 'day' }] });
    }

    const mainFriends = cast.filter(c => !c.rule.isBigEncounter && c.type !== 'bird');
    const encounterChar = cast.find(c => c.rule.isBigEncounter);
    const act1Xs = [710, 985, 560, 1120], act2Xs = [1125, 1360, 960, 1490], act3Xs = [2075, 2410, 1920, 2560];

    mainFriends.forEach((c, ci) => {
      const isAnimal = c.type === 'little_dog' || c.type === 'tabby_cat';
      const x1 = act1Xs[ci % 4], x2 = act2Xs[ci % 4], x3 = act3Xs[ci % 4];
      const startX = ci === 0 ? Math.max(380, x1 - 260) : x1;
      const states = [];
      if (ci === 0 && B[0]) {
        states.push({ t: 0.0, x: startX, y: 1260, view: 'r34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' });
        states.push({ t: Number((B[0].vt + 0.2).toFixed(2)), x: x1, y: 1260, moveDur: Math.min(4.0, Math.max(1.5, B[0].dur * 0.45)), view: 'r34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' });
        states.push({ t: Number((B[0].vt + Math.min(4.4, Math.max(1.8, B[0].dur * 0.5))).toFixed(2)), view: 'r34', expr: 'happy', pose: 'stand' });
      } else {
        states.push({ t: 0.0, x: x1, y: 1260, view: ci % 2 === 1 ? 'l34' : 'r34', expr: 'happy', pose: 'stand' });
      }
      if (idxPause1 > 0 && B[idxPause1 - 1]) {
        states.push({ t: Number((B[idxPause1 - 1].end + 0.1).toFixed(2)), x: x2, y: 1260, moveDur: 1.85, view: 'r34', expr: 'happy', pose: isAnimal ? 'walk' : 'stand' });
      }
      for (let i = 0; i < B.length; i++) {
        const b = B[i], isMe = b.speakerType === c.type || b.speakerType === 'all';
        const inAct1 = i < idxPause1, inAct3 = i >= idxClimax;
        const view = inAct1 ? (ci % 2 === 1 ? 'l34' : 'r34') : (inAct3 && b.mood === 'cheer_friend' ? 'front' : 'r34');
        if (i === idxClimax) {
          states.push({ t: Number(Math.max(0.1, b.vt - 0.5).toFixed(2)), x: x3, y: 1280, moveDur: 1.2, view: 'r34', expr: ci === 0 ? 'yummy' : 'happy', pose: isAnimal ? 'sit_eat' : 'stand' });
          continue;
        }
        if (isAnimal) {
          if (b.mood === 'rustle_scare' || b.mood === 'scared' || b.mood === 'reveal_big') states.push({ t: b.vt, view: 'r34', expr: 'scared', pose: 'scared' });
          else if (b.mood === 'laugh_reassure') states.push({ t: Number((b.vt + Math.min(1.6, b.dur * 0.35)).toFixed(2)), view: 'r34', expr: 'curious', pose: 'stand' });
          else if (b.mood === 'sad' || b.mood === 'hungry') states.push({ t: b.vt, view: 'r34', expr: 'kind', pose: 'stand' });
          else if (b.mood === 'offer_apple' && isMe) states.push({ t: Number(Math.max(0, b.vt - 0.1).toFixed(2)), view: 'r34', expr: 'kind', pose: 'offer_apple' });
          else if (b.mood === 'eat_yummy') states.push({ t: b.vt, view: 'r34', expr: 'happy', pose: 'stand' });
          else if (b.mood === 'cheer_friend') states.push({ t: b.vt, x: inAct3 ? x3 : undefined, y: inAct3 ? 1265 : undefined, view: inAct3 ? 'front' : view, expr: 'excited', pose: 'cheer' });
          else if ((b.mood === 'greet' || b.mood === 'walk_invite') && isMe) states.push({ t: b.vt, view, expr: 'happy', pose: 'wave' });
        }
      }
      entities.push({ id: c.type, type: c.type, x: startX, y: 1260, scale: c.rule.defaultScale, tStart: 0.0, drawDur: 0.0, states: dedupStates(states) });
    });

    if (encounterChar) {
      const revBeat = B.find(b => b.mood === 'reveal_big') || B.find(b => b.speakerType === encounterChar.type) || B[idxPause1] || B[0];
      const tReveal = revBeat ? Number(Math.max(0, revBeat.vt - 0.35).toFixed(2)) : 0;
      const wStates = [
        { t: 0.0, x: 1785, y: 1225, view: 'l34', expr: 'mysterious', pose: 'peek', layer: 'back' },
        { t: Number((tReveal + 1.0).toFixed(2)), x: 1685, y: 1255, moveDur: 1.55, view: 'l34', expr: 'mysterious', pose: 'walk', layer: 'front' },
      ];
      for (let i = 0; i < B.length; i++) {
        const b = B[i];
        if (b.vt < tReveal) continue;
        if (i === idxClimax) {
          wStates.push({ t: Number(Math.max(tReveal + 1, b.vt - 0.5).toFixed(2)), x: 2640, y: 1275, moveDur: 1.2, view: 'l34', expr: 'yummy', pose: 'sit_eat', layer: 'front' });
          continue;
        }
        if (b.mood === 'greet' && b.speakerType === encounterChar.type) wStates.push({ t: b.vt, view: 'l34', expr: 'friendly', pose: 'wave', layer: 'front' });
        else if (b.mood === 'laugh_reassure') wStates.push({ t: b.vt, view: 'l34', expr: 'laugh', pose: 'laugh', layer: 'front' });
        else if (b.mood === 'sad' || b.mood === 'hungry') wStates.push({ t: (i === idxPause2 && sil2End > 0) ? Number((sil2End + 0.02).toFixed(2)) : b.vt, view: 'l34', expr: 'sad', pose: 'sad_hungry', layer: 'front' });
        else if (b.mood === 'surprised_thanks') wStates.push({ t: b.vt, view: 'l34', expr: 'surprised', pose: 'wave', layer: 'front' });
        else if (b.mood === 'eat_yummy') wStates.push({ t: Number(Math.max(tReveal + 1, b.vt - 0.4).toFixed(2)), view: 'l34', expr: 'yummy', pose: 'eat_apple', layer: 'front' });
        else if (b.mood === 'cheer_friend') wStates.push({ t: b.vt, x: i >= idxClimax ? 2640 : undefined, y: i >= idxClimax ? 1260 : undefined, view: 'front', expr: 'happy', pose: 'cheer', layer: 'front' });
      }
      entities.push({ id: encounterChar.type, type: encounterChar.type, x: 1785, y: 1225, scale: encounterChar.rule.defaultScale, tStart: tReveal, drawDur: 0.55, states: dedupStates(wStates) });
    }

    const ZONE_SLOTS = {
      left_tree: { x: 240, y: 785 }, left_mid: { x: 840, y: 760 }, left_top: { x: 960, y: 660 },
      mid_left: { x: 1420, y: 865 }, mid_tree: { x: 1715, y: 765 }, mid_right: { x: 1915, y: 950 },
      picnic: { x: 2390, y: 755 }, river: { x: 2875, y: 985 }, sky_mid: { x: 1480, y: 510 }, sky_right: { x: 2560, y: 545 },
    };
    const usedZones = new Set();
    tags = [];
    for (const v of VOCAB_DICT) {
      if (tags.length >= 6 || usedZones.has(v.zone)) continue;
      const hitBeat = B.find(b => v.re.test(b.en));
      if (!hitBeat) continue;
      let tgT = Number((hitBeat.vt + Math.min(1.4, hitBeat.dur * 0.25)).toFixed(2));
      if ((v.zone === 'river' || v.zone === 'picnic' || v.zone === 'sky_right') && tgT < picnicBeat.vt) tgT = Number((picnicBeat.vt + 1.2 + tags.length * 0.4).toFixed(2));
      usedZones.add(v.zone);
      tags.push({ id: 'tag_' + v.en.toLowerCase().replace(/\s+/g, '_'), t: tgT, x: ZONE_SLOTS[v.zone].x, y: ZONE_SLOTS[v.zone].y, en: v.en, vi: v.vi, col: v.col });
    }
    tags.sort((a, b) => a.t - b.t);

    const tAct1End = B[Math.max(0, idxPause1 - 1)]?.end ?? 10;
    const tAct2Mid = (idxPause2 > 0 && B[idxPause2]) ? B[idxPause2].vt : ((B[idxPause1]?.vt ?? 12) + 8);
    const tAct2End = B[Math.max(0, idxClimax - 1)]?.end ?? (picnicBeat.vt - 1);
    camera = [
      { t: 0.00, x: 740, y: 950, s: 0.88 },
      { t: Number((B[0]?.vt ?? 2.0).toFixed(2)), x: 760, y: 955, s: 0.88 },
      { t: Number(Math.min(tAct1End, (B[1]?.vt ?? 6.0)).toFixed(2)), x: 820, y: 1020, s: 1.00 },
      { t: Number(tAct1End.toFixed(2)), x: 860, y: 1020, s: 1.00 },
      { t: Number((sil1End > 0 ? sil1End - 0.9 : tAct1End + 0.8).toFixed(2)), x: 1520, y: 1000, s: 0.96 },
      { t: Number(Math.max(tAct2Mid, tAct1End + 2.0).toFixed(2)), x: 1565, y: 1025, s: 1.00 },
      { t: Number(Math.max(tAct2End, tAct2Mid + 1.0).toFixed(2)), x: 1550, y: 1005, s: 0.96 },
      { t: Number(picnicBeat.vt.toFixed(2)), x: 2300, y: 965, s: 0.76 },
      { t: Number(Math.max(picnicBeat.end, fridgeStart - 2.0).toFixed(2)), x: 2260, y: 970, s: 0.78 },
      { t: Number(fridgeStart.toFixed(2)), x: 1600, y: 900, s: 0.60 },
      { t: totalDur, x: 1600, y: 900, s: 0.60 },
    ];
  }

  // Place any matched/generated AI Custom Props not yet placed by the scene builder!
  const placedTypes = new Set(entities.map(e => e.type));
  const customSlots = [[1260, 1265], [1620, 1265], [2520, 1265], [820, 1265]];
  let cIdx = 0;
  for (const cp of matchedAndGenCustom) {
    if (!cp || !cp.type || placedTypes.has(cp.type)) continue;
    placedTypes.add(cp.type);
    const kws = (cp.keywords || [cp.id, cp.type.replace(/^custom_/, '')]).filter(k => k && !GENERIC_PROP_STOP.has(String(k).toLowerCase()));
    const hitBeat = B.find(b => kws.some(w => new RegExp(`\\b${String(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'i').test(`${b.en} ${b.vi}`)));
    const [cx, cy] = customSlots[cIdx++ % customSlots.length];
    entities.push({
      id: cp.type, type: cp.type, x: cx, y: cy, scale: Number(cp.defaultScale || 1.0),
      tStart: hitBeat ? Number(hitBeat.vt.toFixed(2)) : 1.0, drawDur: 0.9, fillDur: 0.8,
      states: [{ t: 0.0, mood: 'idle' }]
    });
  }
  // Ensure every custom prop referenced in entities has its full drawing recipe embedded in project.customProps!
  const finalEntityTypes = new Set(entities.map(e => e.type));
  const usedCustomProps = allKnownCustom.filter(cp => cp?.type && finalEntityTypes.has(cp.type));

  // Clean strictly increasing camera keyframes
  camera.sort((a, b) => a.t - b.t);
  const cleanCam = [];
  for (const kf of camera) {
    if (!cleanCam.length || kf.t > cleanCam[cleanCam.length - 1].t + 0.15) cleanCam.push(kf);
  }

  const project = {
    version: 1,
    meta: { slug, title, titleVi, titlePos, duration: totalDur, fps: 24, aspect, narrationMode },
    palette: {
      paper: '#f4efe3',
      crayons: { ...DEFAULT_CRAYONS, rain: '#7a8799' },
      washColor: finalWash.color,
      washEnabled: !finalWash.disabled,
      washStart,
      waxPreset: finalWash.waxPreset,
    },
    world: { preset: finalWorld, horizonY: 1090 },
    camera: cleanCam,
    entities,
    tags,
    subtitles,
    silences,
    customProps: usedCustomProps,
    ending: { type: 'fridge', tStart: fridgeStart, tEnd: fridgeEnd, fridgeColor: '#cbe3d7' },
    music: {
      preset: 'morning-garden', key: 'F', bpm: 106,
      gains: { ukulele: 0.88, marimba: 0.82, recorder: 0.90, bassoon: 0.82, glock: 1.18, perc: 0.68, foley: 0.82, voice: 1.00 },
    },
  };

  return {
    project,
    summary: {
      theme,
      cast: cast.map(c => ({ type: c.type, name: c.name, icon: c.icon, enVoice: c.rule.enVoice, viVoice: c.rule.viVoice })),
      lineCount: subtitles.length,
      estimatedDuration: totalDur,
      tags: tags.map(t => `${t.en} (${t.vi})`),
      world: finalWorld,
      washColor: finalWash.color,
      waxPreset: finalWash.waxPreset,
      silencesCount: silences.length,
      matchedProps: [...hints.matchedBuiltins, ...usedCustomProps.map(p => p.label || p.type)],
      missingProps: hints.missingProps,
    }
  };
}
