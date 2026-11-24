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

  for (const s of rawShapes) {
    if (!s || !ALLOWED_KINDS.has(s.kind)) continue;
    if (s.kind === 'poly' && Array.isArray(s.pts) && s.pts.length >= 3) {
      const pts = s.pts.slice(0, 24).map(p => [clampNum(p?.[0], -220, 220), clampNum(p?.[1], -320, 40)]);
      pts.forEach(([x, y]) => track(x, y));
      shapes.push({
        kind: 'poly', pts,
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
        kind: 'circle', x, y, r,
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
        kind: 'ellipse', x, y, rx, ry, rot: clampNum(s.rot, -3.15, 3.15, 0),
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
        kind: 'line', pts, col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 2.5, 14, 5), p: clampNum(s.p, 0.4, 0.96, 0.88),
        curve: Boolean(s.curve),
      });
    } else if (s.kind === 'dab') {
      const x = clampNum(s.x ?? s.cx, -200, 200), y = clampNum(s.y ?? s.cy, -300, 20), r = clampNum(s.r, 2, 40, 7);
      track(x - r, y - r); track(x + r, y + r);
      shapes.push({ kind: 'dab', x, y, r, col: cleanColor(s.col || s.fill, 'ink'), layer: s.layer === 'fill' ? 'fill' : 'line', p: clampNum(s.p, 0.5, 0.98, 0.94) });
    } else if (s.kind === 'tube' && Array.isArray(s.pts) && s.pts.length >= 2) {
      const pts = s.pts.slice(0, 12).map(p => [clampNum(p?.[0], -220, 220), clampNum(p?.[1], -320, 40)]);
      pts.forEach(([x, y]) => track(x, y));
      shapes.push({
        kind: 'tube', pts,
        r0: clampNum(s.r0, 5, 45, 14), r1: clampNum(s.r1, 4, 45, 11),
        fill: cleanColor(s.fill, 'ochre'), col: cleanColor(s.col || s.line, 'ink'),
        w: clampNum(s.w, 3, 10, 5.5), p: clampNum(s.p, 0.5, 0.96, 0.9),
      });
    }
  }

  const rx = Math.round(Math.max(55, (maxX - minX) * 0.55));
  const ry = Math.round(Math.max(55, (maxY - minY) * 0.55));
  const oy = Math.round((minY + maxY) * 0.5);
  const kws = Array.isArray(raw?.keywords) && raw.keywords.length
    ? raw.keywords.map(k => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 6)
    : [slug.replace(/^custom_/, '')];

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

/**
 * Analyze a story script with Gemini to choose the best world preset and auto-generate
 * up to 3 missing custom crayon props that aren't already in our built-in or saved library!
 */
export async function directScriptWithGemini(apiKey, { scriptText, existingTypes = [], model = 'gemini-2.5-flash', onLog = () => {} }) {
  const analysisPrompt = `You are the Art Director of a Crayon Picture Book video studio.
Read this children's story script and identify:
1. Best background world preset from ONLY: "cozy-room", "forest-clearing", "garden-cross-section", "sunny-meadow", "blank-page".
2. Up to 3 IMPORTANT visual props/objects/extra animals mentioned in the story that are NOT already in this available list:
   [${existingTypes.join(', ')}]

DO NOT list characters/props that are already in the available list (e.g. if "birthday_cake", "balloons", "door", "gift_box", "toy_car", "party_table", "little_dog", "tabby_cat", "gray_wolf" are already listed, do NOT put them in missingProps!).
If all important props are already available, return "missingProps": [].

Return STRICT JSON:
{
  "world": "cozy-room",
  "missingProps": [
    {"id": "snake_case_id", "query": "short visual description in English for crayon drawing"}
  ]
}

SCRIPT:
${String(scriptText || '').slice(0, 4500)}`;

  onLog('[Gemini] Đang phân tích bối cảnh và kiểm tra đạo cụ còn thiếu...');
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

  return {
    world: plan?.world || 'auto',
    generatedProps,
  };
}
