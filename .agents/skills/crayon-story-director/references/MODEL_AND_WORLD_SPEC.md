# Model & World JSON Specification

All custom models (`engine/custom_props.json`) and custom worlds (`engine/custom_worlds.json`) render natively through WebGL2 paper-tooth, wax adhesion, and knock-out backing (`engine/library.js` `drawCustomProp()` & `engine/scene.js` `drawCustomWorld()`). Zero `eval()`, crash-proof, and 100% reusable by both AI Agents and Web Studio.

---

## 1. Allowed 10-Crayon Palette (NEVER pure black!)

Use exact color names (pure black `#000000` is strictly forbidden and auto-remapped to `"ink"`):
- `"ink"` (`#472e1e`) — Warm cocoa brown for outlines, eyes, paws, wood darks
- `"ochre"` (`#c88a3b`) — Warm tan / wood / puppy fur / sand / autumn earth
- `"yellow"` (`#f2be2c`) — Sunshine / duckling / stars / lemon / ribbon
- `"red"` (`#d94436`) — Apples / ruby roof / toy car / scarf / berries
- `"pink"` (`#e8877d`) — Rosy cheeks / lotus / frosting / cherry blossoms
- `"green"` (`#5a9c46`) — Leaves / grass / frog / dinosaur / pine trees
- `"sky"` (`#5da7d6`) — Pond water / ocean / window sky / blue shirt / ice
- `"rain"` (`#7a8799`) — Soft slate gray-blue for wolf fur, elephant, rocks, clouds
- `"peach"` (`#f5cca7`) — Warm cream / belly / muzzle / sandstone / cottage wall
- `"white"` (`#fbfaf4`) — Glossy highlights, snow, eye catchlights, clouds, icing

---

## 2. Custom Model Recipe (`engine/custom_props.json`)

### Coordinate System & Scale
- `(0, 0)` is **BOTTOM-CENTER** resting on the ground or table.
- Negative `y` goes **UPWARD**:
  - Small animal / prop (duckling, rabbit, ball, basket): width `x ∈ [-70, +70]`, height `y ∈ [0, -145]`.
  - Medium character (fox, penguin, baby bear, bicycle): width `x ∈ [-95, +95]`, height `y ∈ [0, -210]`.
  - Tall hero / big animal (elephant, giraffe, friendly dragon, snowman): width `x ∈ [-130, +130]`, height `y ∈ [0, -270]`.
- Draw shapes **BACK-TO-FRONT** (shadow/tail/back limbs → torso → belly/stripes → head → ears/beak/face → eyes + white catchlight!).
- Right-facing (`+x`) is the canonical orientation (`view: "r34"`). Setting `view: "l34"` automatically mirrors the entire model horizontally!

### Shape Primitives (`shapes[]`, recommended 10–22 shapes)
1. **Filled/outlined polygon**:
   `{"kind":"poly","pts":[[x,y],...],"fill":"yellow","col":"ink","w":6,"smooth":true}`
   (`"smooth":true` for organic curves; `"smooth":false` for crisp boxes/roofs; `"noOutline":true` for soft belly patches!)
2. **Circle**:
   `{"kind":"circle","x":0,"y":-115,"r":38,"fill":"rain","col":"ink","w":6}`
3. **Ellipse**:
   `{"kind":"ellipse","x":0,"y":-55,"rx":58,"ry":42,"rot":0,"fill":"rain","col":"ink","w":6}`
4. **Tube limb / tail / trunk**:
   `{"kind":"tube","pts":[[x1,y1],[x2,y2],[x3,y3]],"r0":18,"r1":12,"fill":"rain","col":"ink","w":5.5}`
5. **Line / smile / whisker / detail**:
   `{"kind":"line","pts":[[x1,y1],[x2,y2],[x3,y3]],"col":"ink","w":4.5,"curve":true}`
6. **Dab (eyes, rosy cheeks, berries, shine)**:
   `{"kind":"dab","x":18,"y":-122,"r":6.5,"col":"ink"}`
   Always pair animal eyes with a white catchlight offset `(-2, -2)`:
   `{"kind":"dab","x":16,"y":-124,"r":2.5,"col":"white"}`
   And rosy cheeks on `"layer":"fill"`:
   `{"kind":"dab","x":12,"y":-108,"r":10,"col":"pink","layer":"fill"}`

### Built-in Animation Hooks & Progressive Reveal (Automatic!)
Any model saved in `engine/custom_props.json` automatically supports:
- **Progressive crayon stroke reveal**: respects `drawDur` / `fillDur` (`st.draw` / `st.fillP`), sketching shapes stroke-by-stroke onto the paper tooth instead of popping in abruptly!
- **Whole-body acting**:
  - `view: "r34" | "l34" | "front"` (horizontal flip)
  - `pose: "stand" | "walk" | "climb" | "wave" | "lift" | "cheer" | "sing"` (12 fps rhythmic hop / joyful jump + sparkles)
  - `expr: "happy" | "excited" | "sad" | "cry"` (gentle tremble + animated sky-blue teardrop dots when `cry`/`sad`!)
- **Part-level 12 fps animation** (optional per-shape fields inside `shapes[]`):
  - `"anim": "flap"` — wing flapping rotation around `"pivot": [px, py]` (defaults to shape's first point/center), ideal for birds, butterflies, bees, dragons!
  - `"anim": "wag"` — rhythmic tail wagging rotation around `"pivot": [px, py]`.
  - `"anim": "bob"` — gentle vertical floating/breathing bounce.
  - `"anim": "sway"` — gentle horizontal breeze sway for leaves, flames, ribbons, or antenna.
  - `"amp": 0.2..2.5` — optional amplitude multiplier (default `1.0`).

### Example Model JSON
```json
{
  "id": "baby_elephant",
  "icon": "🐘",
  "label": "Voi con dễ thương (Baby Elephant)",
  "keywords": ["elephant", "voi", "voi con"],
  "defaultScale": 1.05,
  "shapes": [
    {"kind":"tube","pts":[[-56,-56],[-78,-42],[-82,-22]],"r0":8,"r1":6,"fill":"rain","col":"ink","w":4.5},
    {"kind":"poly","pts":[[-42,0],[-44,-46],[-20,-46],[-18,0]],"fill":"rain","col":"ink","w":5.5,"smooth":true},
    {"kind":"poly","pts":[[16,0],[14,-46],[38,-46],[40,0]],"fill":"rain","col":"ink","w":5.5,"smooth":true},
    {"kind":"ellipse","x":-6,"y":-66,"rx":62,"ry":46,"fill":"rain","col":"ink","w":6.5},
    {"kind":"ellipse","x":-6,"y":-64,"rx":34,"ry":26,"fill":"peach","noOutline":true},
    {"kind":"ellipse","x":14,"y":-124,"rx":46,"ry":44,"fill":"rain","col":"ink","w":6},
    {"kind":"ellipse","x":14,"y":-122,"rx":28,"ry":28,"fill":"pink","noOutline":true},
    {"kind":"circle","x":46,"y":-124,"r":38,"fill":"rain","col":"ink","w":6.5},
    {"kind":"tube","pts":[[74,-114],[102,-96],[112,-68],[96,-58]],"r0":18,"r1":11,"fill":"rain","col":"ink","w":5.5},
    {"kind":"dab","x":56,"y":-132,"r":6.5,"col":"ink"},
    {"kind":"dab","x":54,"y":-134,"r":2.5,"col":"white"},
    {"kind":"dab","x":48,"y":-114,"r":10,"col":"pink","layer":"fill"}
  ]
}
```

### Keyword Rules (Important!)
- Put ONLY specific object/character nouns in `keywords` (e.g. `["elephant", "voi"]`).
- NEVER add generic colors/adjectives/verbs (`"red"`, `"big"`, `"little"`, `"play"`, `"happy"`, `"mẹ"`, `"nhỏ"`, `"đỏ"`) to `keywords` so it never triggers falsely in unrelated stories.

---

## 3. Custom World Recipe (`engine/custom_worlds.json`)

The storybook world canvas is `3200 × 1800` (with overscan `x ∈ [-420, 3760]`, ground horizon around `y = 1090`, ground floor `y ∈ [1090, 1940]`, sky `y ∈ [150, 1090]`).

### Schema
```json
{
  "id": "sunny_beach",
  "icon": "🏖️",
  "label": "Bãi biển nắng vàng (Sunny Beach)",
  "keywords": ["beach", "ocean", "sea", "sand", "bãi biển", "biển"],
  "horizonY": 1090,
  "groundCol": "yellow",
  "groundP": 0.48,
  "groundLine": true,
  "grassTufts": false,
  "shapes": [
    {"kind":"poly","pts":[[-420,1090],[3760,1090],[3760,840],[-420,840]],"fill":"sky","p":0.64,"gap":12,"w":13,"cross":true},
    {"kind":"line","pts":[[-420,840],[3760,840]],"col":"ink","w":5.5,"p":0.72},
    {"kind":"line","pts":[[260,920],[780,920]],"col":"white","w":6,"p":0.86,"wave":true},
    {"kind":"line","pts":[[1320,975],[1960,975]],"col":"white","w":6,"p":0.86,"wave":true},
    {"kind":"line","pts":[[2280,910],[2860,910]],"col":"white","w":6,"p":0.86,"wave":true},
    {"kind":"ellipse","x":680,"y":1310,"rx":18,"ry":12,"fill":"pink","col":"ink","w":3.5},
    {"kind":"ellipse","x":2480,"y":1280,"rx":22,"ry":14,"fill":"peach","col":"ink","w":3.5}
  ]
}
```
- `groundCol`: crayon name (`"green"`, `"yellow"`, `"peach"`, `"white"`, `"ochre"`, or `"none"`).
- `shapes[]` supports `poly` (`smooth`, `cross`, `gap`, `ang`), `ellipse`, `circle`, `line` (`curve`, `wave` for animated water ripples), and `dab` (`bob` for floating fireflies/snowflakes).
- Always leave `y ∈ [380, 820]` airy and warm-paper light so the title, vocabulary tags, and white-wax watercolour wash stay effortlessly legible!
