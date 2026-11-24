// Gemini API Director & Declarative Crayon Prop Generator (zero external npm dependencies, uses Node fetch).
// Generates crash-proof JSON crayon shape recipes compatible with engine/library.js drawCustomProp()
// while strictly honoring STYLE.md invariants (10-crayon palette, never pure black, child-logic silhouette).

const ALLOWED_COLORS = new Set(['ink', 'ochre', 'yellow', 'red', 'pink', 'green', 'sky', 'rain', 'peach', 'white']);
const ALLOWED_KINDS = new Set(['poly', 'circle', 'ellipse', 'line', 'dab', 'tube']);

function cleanJsonText(raw) {
  let s = String(raw || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const first = s.indexOf('{'), last = s.lastIndexOf('}');
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  return JSON.parse(s);
}

export async function callGeminiJson(apiKey, prompt, model = 'gemini-2.5-flash') {
  if (!apiKey) throw new Error('Chưa nhập Gemini API Key trong Cài đặt AI');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.35,
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Gemini API error: ${msg}`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API không trả về dữ liệu JSON hợp lệ');
  return cleanJsonText(text);
}

export async function testGeminiConnection(apiKey, model = 'gemini-2.5-flash') {
  const out = await callGeminiJson(apiKey, 'Return JSON: {"ok": true, "msg": "ready"}', model);
  return { ok: Boolean(out?.ok), model };
}

function clampNum(v, lo, hi, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def;
}

function cleanColor(c, fallback = 'ochre') {
  const k = String(c || '').trim().toLowerCase();
  if (ALLOWED_COLORS.has(k)) return k;
  return fallback;
}

/**
 * Validate and sanitize a declarative crayon prop recipe so it can NEVER crash WebGL/Canvas2D
 * and always fits nicely on the storybook page anchored at (0, 0) = bottom center!
 */
export function sanitizeCustomProp(raw, fallbackId = 'prop') {
  const slug = String(raw?.id || raw?.type || fallbackId).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'prop';
  const type = slug.startsWith('custom_') ? slug : `custom_${slug}`;
  const rawShapes = Array.isArray(raw?.shapes) ? raw.shapes.slice(0, 28) : [];
  const shapes = [];
  let minX = -60, maxX = 60, minY = -120, maxY = 0;

  const track = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const cleanAnim = (s) => {
    const out = {};
    if (['flap', 'wag', 'bob', 'sway'].includes(s.anim)) out.anim = s.anim;
    if (Array.isArray(s.pivot) && s.pivot.length >= 2) out.pivot = [clampNum(s.pivot[0], -220, 220), clampNum(s.pivot[1], -320, 40)];
    if (Number.isFinite(Number(s.amp))) out.amp = clampNum(s.amp, 0.2, 2.5, 1);
    return out;
  };

  for (const s of rawShapes) {
    if (!s || !ALLOWED_KINDS.has(s.kind)) continue;
    const animFields = cleanAnim(s);
    if (s.kind === 'poly' && Array.isArray(s.pts) && s.pts.length >= 3) {
      const pts = s.pts.slice(0, 24).map(p => [clampNum(p?.[0], -220, 220), clampNum(p?.[1], -320, 40)]);
      pts.forEach(([x, y]) => track(x, y));
      shapes.push({
        kind: 'poly', pts, ...animFields,
        fill: s.fill ? cleanColor(s.fill) : undefined,
        col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 3, 12, 6),
        p: clampNum(s.p, 0.4, 0.96, 0.88),
        smooth: Boolean(s.smooth),
        noOutline: Boolean(s.noOutline),
      });
    } else if (s.kind === 'circle') {
      const x = clampNum(s.x ?? s.cx, -200, 200), y = clampNum(s.y ?? s.cy, -300, 20), r = clampNum(s.r, 4, 120, 24);
      track(x - r, y - r); track(x + r, y + r);
      shapes.push({
        kind: 'circle', x, y, r, ...animFields,
        fill: s.fill ? cleanColor(s.fill) : undefined,
        col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 3, 12, 5.5),
        p: clampNum(s.p, 0.4, 0.96, 0.9),
        noOutline: Boolean(s.noOutline),
      });
    } else if (s.kind === 'ellipse') {
      const x = clampNum(s.x ?? s.cx, -200, 200), y = clampNum(s.y ?? s.cy, -300, 20);
      const rx = clampNum(s.rx, 4, 140, 28), ry = clampNum(s.ry, 4, 140, 20);
      track(x - rx, y - ry); track(x + rx, y + ry);
      shapes.push({
        kind: 'ellipse', x, y, rx, ry, rot: clampNum(s.rot, -3.15, 3.15, 0), ...animFields,
        fill: s.fill ? cleanColor(s.fill) : undefined,
        col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 3, 12, 5.5),
        p: clampNum(s.p, 0.4, 0.96, 0.88),
        noOutline: Boolean(s.noOutline),
      });
    } else if (s.kind === 'line' && Array.isArray(s.pts) && s.pts.length >= 2) {
      const pts = s.pts.slice(0, 16).map(p => [clampNum(p?.[0], -220, 220), clampNum(p?.[1], -320, 40)]);
      pts.forEach(([x, y]) => track(x, y));
      shapes.push({
        kind: 'line', pts, ...animFields, col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 2.5, 14, 5), p: clampNum(s.p, 0.4, 0.96, 0.88),
        curve: Boolean(s.curve),
      });
    } else if (s.kind === 'dab') {
      const x = clampNum(s.x ?? s.cx, -200, 200), y = clampNum(s.y ?? s.cy, -300, 20), r = clampNum(s.r, 2, 40, 7);
      track(x - r, y - r); track(x + r, y + r);
      shapes.push({ kind: 'dab', x, y, r, ...animFields, col: cleanColor(s.col || s.fill, 'ink'), layer: s.layer === 'fill' ? 'fill' : 'line', p: clampNum(s.p, 0.5, 0.98, 0.94) });
    } else if (s.kind === 'tube' && Array.isArray(s.pts) && s.pts.length >= 2) {
      const pts = s.pts.slice(0, 12).map(p => [clampNum(p?.[0], -220, 220), clampNum(p?.[1], -320, 40)]);
      pts.forEach(([x, y]) => track(x, y));
      shapes.push({
        kind: 'tube', pts, ...animFields,
        r0: clampNum(s.r0, 5, 45, 14), r1: clampNum(s.r1, 4, 45, 11),
        fill: cleanColor(s.fill, 'ochre'), col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 3, 10, 5.5), p: clampNum(s.p, 0.5, 0.96, 0.9),
      });
    }
  }

  const rx = Math.round(Math.max(55, (maxX - minX) * 0.55));
  const ry = Math.round(Math.max(55, (maxY - minY) * 0.55));
  const oy = Math.round((minY + maxY) * 0.5);
  const GENERIC_KW_STOP = new Set([
    'red', 'blue', 'yellow', 'green', 'pink', 'white', 'brown', 'gray', 'grey', 'big', 'little', 'small',
    'happy', 'cute', 'nice', 'play', 'toy', 'friend', 'story', 'đỏ', 'xanh', 'vàng', 'hồng', 'trắng',
    'lớn', 'nhỏ', 'to', 'bé', 'vui', 'chơi', 'đồ chơi', 'bạn', 'mẹ', 'bố', 'mother', 'mom', 'dad', 'baby'
  ]);
  const rawKws = Array.isArray(raw?.keywords) && raw.keywords.length
    ? raw.keywords.map(k => String(k).trim().toLowerCase()).filter(k => k && !GENERIC_KW_STOP.has(k)).slice(0, 6)
    : [];
  const kws = rawKws.length ? rawKws : [slug.replace(/^custom_/, '')];

  return {
    type,
    id: slug.replace(/^custom_/, ''),
    icon: String(raw?.icon || '🎨').slice(0, 4),
    label: String(raw?.label || slug).slice(0, 48),
    keywords: kws,
    defaultScale: clampNum(raw?.defaultScale, 0.6, 1.5, 1.0),
    hit: { rx, ry, oy },
    shapes,
  };
}

/**
 * Ask Gemini to generate a charming, child-logic Crayon Picture Book prop recipe!
 */
export async function generateCustomPropWithGemini(apiKey, { query, idHint = '', model = 'gemini-2.5-flash' }) {
  const prompt = `You are a children's Crayon Picture Book illustrator (like Raymond Briggs / Eric Carle).
Design a cute, unmistakable, charming hand-drawn crayon illustration for: "${query}".

Output STRICT JSON matching this schema:
{
  "id": "short_snake_case_english_id",
  "icon": "single_matching_emoji",
  "label": "Tên tiếng Việt ngắn (English name)",
  "keywords": ["english_keyword", "vietnamese_keyword"],
  "shapes": [ ... 6 to 16 shapes drawn BACK-TO-FRONT ... ]
}

COORDINATE SYSTEM:
- (0, 0) is the BOTTOM-CENTER where the object rests on the ground or table.
- Negative y goes UPWARD (typical height y from 0 up to -180; width x from -100 to +100).
- Allowed colors ONLY (use exact color name strings, NEVER pure black):
  "ink" (cocoa brown outlines/eyes), "ochre" (wood/tan), "yellow", "red", "pink", "green", "sky" (blue), "rain" (slate gray-blue), "peach" (warm cream), "white" (highlights/eye catchlights).

ALLOWED SHAPE KINDS:
1. {"kind":"poly","pts":[[x,y],...],"fill":"red","col":"ink","w":6,"smooth":true}
2. {"kind":"circle","x":0,"y":-80,"r":40,"fill":"yellow","col":"ink","w":6}
3. {"kind":"ellipse","x":0,"y":-50,"rx":50,"ry":30,"rot":0,"fill":"sky","col":"ink","w":5.5}
4. {"kind":"tube","pts":[[x1,y1],[x2,y2],[x3,y3]],"r0":14,"r1":10,"fill":"green","col":"ink","w":5}
5. {"kind":"line","pts":[[x1,y1],[x2,y2]],"col":"ink","w":5,"curve":true}
6. {"kind":"dab","x":12,"y":-92,"r":6,"col":"ink"}  (for cute eyes/dots; add a small "white" dab offset (-2,-2) r:2.5 for eye catchlight if it's an animal/character!)

EXAMPLE (cute red mushroom):
{"id":"mushroom","icon":"🍄","label":"Cây nấm đỏ (Mushroom)","keywords":["mushroom","nấm"],"shapes":[
  {"kind":"poly","pts":[[-24,0],[-20,-72],[20,-72],[24,0]],"fill":"peach","col":"ink","w":6,"smooth":true},
  {"kind":"poly","pts":[[-78,-64],[-68,-126],[0,-148],[68,-126],[78,-64],[0,-56]],"fill":"red","col":"ink","w":6.5,"smooth":true},
  {"kind":"circle","x":-32,"y":-102,"r":14,"fill":"white","noOutline":true},
  {"kind":"circle","x":26,"y":-112,"r":16,"fill":"white","noOutline":true},
  {"kind":"circle","x":4,"y":-82,"r":11,"fill":"white","noOutline":true}
]}

Make the silhouette clear, playful, chunky, and recognizable at a glance!`;

  const raw = await callGeminiJson(apiKey, prompt, model);
  const spec = sanitizeCustomProp(raw, idHint || query);
  if (!spec.shapes.length) throw new Error(`Gemini trả về bản vẽ rỗng cho "${query}"`);
  return spec;
}

const ALLOWED_WORLDS = new Set(['cozy-room', 'forest-clearing', 'riverside-pond', 'sunny-meadow', 'starry-hill', 'garden-cross-section', 'blank-page']);
const ALLOWED_SCENERY = new Set(['sun', 'cloud', 'rainbow', 'house', 'fence', 'tree', 'big_tree', 'bush', 'bird', 'flower', 'star', 'watering_can', 'apple_basket', 'door', 'balloons', 'party_table', 'birthday_cake', 'gift_box', 'toy_car']);
const ALLOWED_POSES = new Set(['stand', 'walk', 'wave', 'cheer', 'scared', 'sad_hungry', 'laugh', 'offer_apple', 'eat_apple', 'sit', 'sit_eat', 'climb', 'lift', 'look_up', 'gift', 'sing', 'blow', 'peek', 'jumpA', 'idea']);
const ALLOWED_EXPRS = new Set(['happy', 'excited', 'curious', 'scared', 'sad', 'cry', 'kind', 'friendly', 'laugh', 'surprised', 'yummy', 'wish', 'mysterious']);
const ALLOWED_WASH_HEX = new Set(['#d47c85', '#70b58f', '#2b3975', '#e8b85a']);
const ALLOWED_WAX = new Set(['friendship-hearts', 'birthday-confetti', 'rain-and-roots', 'starry-night', 'none']);

function sanitizeGeminiStoryboard(plan, beatCount, generatedProps = [], existingTypes = []) {
  const world = ALLOWED_WORLDS.has(plan?.world) ? plan.world : null;
  const archetype = ['birthday', 'rescue_reunion', 'playtime_park', 'starry_adventure', 'forest_encounter', 'custom_storyboard'].includes(plan?.archetype)
    ? plan.archetype : null;

  const washColor = ALLOWED_WASH_HEX.has(plan?.wash?.color) ? plan.wash.color : null;
  const waxPreset = ALLOWED_WAX.has(plan?.wash?.waxPreset) ? plan.wash.waxPreset : null;
  const washBeatIndex = Number.isInteger(plan?.wash?.beatIndex) ? Math.max(0, Math.min(Math.max(0, beatCount - 1), plan.wash.beatIndex)) : null;

  const knownSet = new Set([...existingTypes, ...generatedProps.map(p => p.type)]);
  const resolveActorType = (rawType) => {
    const k = String(rawType || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (knownSet.has(k)) return k;
    if (knownSet.has(`custom_${k}`)) return `custom_${k}`;
    const bySub = [...knownSet].find(t => t.startsWith('custom_') && (t.includes(k) || k.includes(t.replace(/^custom_/, ''))));
    return bySub || null;
  };

  const scenery = [];
  if (Array.isArray(plan?.scenery)) {
    for (const s of plan.scenery.slice(0, 10)) {
      if (!s || !ALLOWED_SCENERY.has(s.type)) continue;
      const isSky = s.type === 'sun' || s.type === 'cloud' || s.type === 'rainbow' || s.type === 'star';
      scenery.push({
        type: s.type,
        x: Math.round(clampNum(s.x, 180, 3020, 1600)),
        y: Math.round(clampNum(s.y, isSky ? 220 : 1080, isSky ? 680 : 1310, isSky ? 340 : 1140)),
        scale: Number(clampNum(s.scale, 0.72, 1.30, 1.0).toFixed(2)),
        mood: String(s.mood || 'plain').slice(0, 20),
      });
    }
  }

  const shots = [];
  if (Array.isArray(plan?.shots)) {
    for (const sh of plan.shots.slice(0, 9)) {
      if (!sh || !sh.cam) continue;
      const beat = Math.max(0, Math.min(Math.max(0, beatCount - 1), Math.round(Number(sh.beat) || 0)));
      const cam = {
        x: Math.round(clampNum(sh.cam.x, 680, 2520, 1600)),
        y: Math.round(clampNum(sh.cam.y, 760, 1050, 960)),
        s: Number(clampNum(sh.cam.s, 0.74, 1.12, 0.88).toFixed(2)),
      };
      const actors = [];
      if (Array.isArray(sh.actors)) {
        for (const a of sh.actors.slice(0, 6)) {
          const type = resolveActorType(a?.type);
          if (!type) continue;
          actors.push({
            type,
            x: Math.round(clampNum(a.x, 360, 2840, cam.x)),
            y: Math.round(clampNum(a.y, 1180, 1300, 1265)),
            view: ['l34', 'r34', 'front'].includes(a.view) ? a.view : 'r34',
            pose: ALLOWED_POSES.has(a.pose) ? a.pose : 'stand',
            expr: ALLOWED_EXPRS.has(a.expr) ? a.expr : 'happy',
            hat: Boolean(a.hat),
          });
        }
        // Prevent actor overlap inside the same shot (keep >=185px horizontal gap!)
        actors.sort((a, b) => a.x - b.x);
        for (let k = 1; k < actors.length; k++) {
          if (actors[k].x - actors[k - 1].x < 185) {
            actors[k].x = Math.min(2840, actors[k - 1].x + 195);
          }
        }
      }
      shots.push({ beat, cam, actors });
    }
    shots.sort((a, b) => a.beat - b.beat);
  }

  const tags = [];
  const TAG_COLS = ['#d94436', '#4a8ec2', '#5a9c46', '#d98a16', '#e8877d', '#c88a3b'];
  if (Array.isArray(plan?.tags)) {
    plan.tags.slice(0, 6).forEach((tg, idx) => {
      if (!tg?.en) return;
      const beat = Math.max(0, Math.min(Math.max(0, beatCount - 1), Math.round(Number(tg.beat) || 0)));
      const col = /^#[0-9a-f]{6}$/i.test(String(tg.col || '')) ? tg.col : TAG_COLS[idx % TAG_COLS.length];
      tags.push({
        beat,
        en: String(tg.en).trim().toUpperCase().slice(0, 18),
        vi: String(tg.vi || '').trim().slice(0, 22),
        col,
      });
    });
  }

  return {
    world, archetype,
    wash: (washColor || waxPreset) ? { color: washColor, waxPreset, beatIndex: washBeatIndex } : null,
    scenery, shots, tags,
    generatedProps,
  };
}

/**
 * Analyze a story script with Gemini to design a BESPOKE Storyboard Blueprint:
 * unique world, varied camera framing/movement per act, character & custom-prop blocking,
 * tailored vocabulary tags, AND up to 3 auto-drawn missing Crayon props!
 */
export async function directScriptWithGemini(apiKey, { scriptText, beats = [], existingTypes = [], model = 'gemini-2.5-flash', onLog = () => {} }) {
  const beatSummary = beats.length
    ? beats.map((b, i) => `[${i}] (${b.speakerName || b.speakerType}): ${b.en}${b.vi ? ' | ' + b.vi : ''}`).join('\n')
    : String(scriptText || '').slice(0, 4200);

  const analysisPrompt = `You are the Film Director & Storyboard Artist of a Crayon Picture Book studio (3200x1800 canvas; ground sits around y=1260; sky is y=260..700).
Read this children's story script and design a UNIQUE, LIVELY, SCRIPT-SPECIFIC storyboard so EVERY story has its own distinct setting, camera staging, and character movement (NEVER repeat the same left-to-right walk!).

AVAILABLE CHARACTERS & PROPS ALREADY IN LIBRARY:
[${existingTypes.join(', ')}]

AVAILABLE WORLDS (pick the ONE that matches the script best):
- "cozy-room": indoor home/birthday room with bunting & sunlit window
- "riverside-pond": sunlit meadow with a cute duck pond, lily pads & reeds on the right (x=2360) — GREAT for duck, frog, fish, pond, water rescue stories!
- "sunny-meadow": bright open park/meadow with soft hills, flowers & central cream path (NO scary bush or river) — GREAT for ball, playtime, rainbow, house, park stories!
- "starry-hill": rolling twilight hill with fireflies & wide sky headroom — GREAT for bedtime, night, moon, star stories!
- "forest-clearing": woodland trail with trees & right river — ONLY for deep forest/wolf/adventure stories!
- "garden-cross-section": underground soil cross-section — ONLY for seed/roots/planting stories!

CAMERA VARIETY GUIDELINES (CRITICAL):
- Vary camera framing & direction to fit the emotional arc! Examples:
  * Start wide center (x:1600, s:0.80) and push into close-up (s:1.06) on a discovery/crying friend, then glide to reunion!
  * Or start right-to-left, or start intimate close-up (s:1.04) then pull back wide (s:0.78) to reveal the full scene/rainbow/family!
  * Keep cam.x in [760..2440], cam.y in [840..1020], cam.s in [0.76..1.08].
  * Place actors on ground y=1255..1280 with >=200px horizontal separation between them, INSIDE the shot's visible horizontal frame (cam.x +/- 750).
  * Give characters expressive poses ("stand","walk","wave","cheer","scared","sad_hungry","sit_eat","sing","blow","gift") and exprs ("happy","excited","curious","scared","sad","cry","kind","friendly","wish").
  * If a character (built-in OR custom/missing prop like a duckling or ball) moves between shots, update its x across shots so it ACTUALLY walks/reunites/plays on screen!

MISSING PROPS RULE:
- Identify up to 3 IMPORTANT visual props or extra animals mentioned in the script that are NOT in the AVAILABLE list above. If an equivalent prop/character (e.g. "custom_yellow_duckling", "custom_mother_duck", "little_dog", "tabby_cat", "birthday_cake") is ALREADY in the AVAILABLE list, reuse that exact type name and do NOT regenerate it!

Return STRICT JSON:
{
  "world": "riverside-pond",
  "archetype": "custom_storyboard",
  "wash": { "color": "#d47c85", "waxPreset": "friendship-hearts", "beatIndex": 6 },
  "scenery": [
    {"type": "sun", "x": 2480, "y": 310, "scale": 0.92, "mood": "warm"},
    {"type": "tree", "x": 420, "y": 1120, "scale": 1.05, "mood": "plain"}
  ],
  "shots": [
    {
      "beat": 0,
      "cam": {"x": 1180, "y": 960, "s": 0.84},
      "actors": [
        {"type": "little_dog", "x": 920, "y": 1265, "view": "r34", "pose": "wave", "expr": "happy"},
        {"type": "tabby_cat", "x": 1180, "y": 1265, "view": "l34", "pose": "stand", "expr": "happy"}
      ]
    }
  ],
  "tags": [
    {"beat": 1, "en": "DUCK", "vi": "vịt con", "col": "#d98a16"}
  ],
  "missingProps": [
    {"id": "snake_case_id", "query": "short visual description in English for crayon drawing"}
  ]
}

STORY BEATS:
${beatSummary}`;

  onLog('[Gemini] 🎬 Đang đạo diễn bố cục cảnh, góc máy riêng & kiểm tra đạo cụ...');
  const plan = await callGeminiJson(apiKey, analysisPrompt, model);
  const missing = Array.isArray(plan?.missingProps) ? plan.missingProps.slice(0, 3) : [];
  const generatedProps = [];

  for (const item of missing) {
    if (!item?.query) continue;
    const cleanId = String(item.id || item.query).toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (existingTypes.includes(cleanId) || existingTypes.includes(`custom_${cleanId}`)) continue;
    onLog(`[Gemini] ✨ Đang tự vẽ đạo cụ sáp màu mới: ${item.query}...`);
    try {
      const spec = await generateCustomPropWithGemini(apiKey, { query: item.query, idHint: cleanId, model });
      generatedProps.push(spec);
      onLog(`[Gemini] ✓ Đã vẽ xong ${spec.icon} ${spec.label} (${spec.shapes.length} nét sáp)`);
    } catch (e) {
      onLog(`[Gemini] ⚠ Bỏ qua "${item.query}": ${e.message}`);
    }
  }

  const sanitized = sanitizeGeminiStoryboard(plan, Math.max(1, beats.length || 12), generatedProps, existingTypes);
  if (sanitized.shots.length >= 2) {
    onLog(`[Gemini] 🎥 Đã dựng ${sanitized.shots.length} góc máy riêng trong bối cảnh "${sanitized.world || 'auto'}"!`);
  }
  return sanitized;
}
