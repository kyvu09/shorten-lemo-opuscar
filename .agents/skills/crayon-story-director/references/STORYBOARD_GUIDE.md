# Bespoke Storyboard Directing Guide

When creating `films/<slug>/storyboard.json`, act as a **children's picture-book film director**. Every story deserves its own unique framing, camera movement, emotional rhythm, and acting — never repeat the same left-to-right walk!

## 1. Canvas & Safe Framing Math (`3200 × 1800` world)
- On `16:9` (`1920 × 1080`), visible world width at camera scale `s` is `1920 / s` (half-width = `960 / s`); visible height is `1080 / s` (half-height = `540 / s`).
  - At `s = 0.80`: visible box is `cam.x ± 1200`, `cam.y ± 675`.
  - At `s = 1.00`: visible box is `cam.x ± 960`, `cam.y ± 540`.
- Keep `cam.x ∈ [740, 2460]`, `cam.y ∈ [830, 1020]`, `cam.s ∈ [0.76, 1.08]`.
- Ground contact for standing characters is `y ≈ 1255..1280` (for `starry-hill` peak, `y ≈ 1225`).
- Keep characters at least **195–260 px apart horizontally** so they never overlap.
- Subtitle bar sits along the bottom (`~140 px` from bottom edge) — keep `cam.y ≤ 1020` so characters' feet sit comfortably above the subtitle strip!

## 2. Camera Variety Playbook (Mix & Match to Fit the Script!)
- **Discovery Push-In**: Start wide (`s: 0.82`) → push smoothly into warm close-up (`s: 1.04`) when a shy/lost/sad character speaks.
- **Center-Out Playful Swing**: Start centered (`x: 1600, s: 0.80`) → pan left (`x: 1180, s: 0.96`) → swing right (`x: 2040, s: 0.96`) → pull back center (`x: 1600, s: 0.78`) for a rainbow/group finale.
- **Right-to-Left Journey**: Start on the right (`x: 2240`) and travel left (`x: 1040`) toward a cottage, beach umbrella, or friend!
- **Skyward Tilt**: Start tight on hilltop (`y: 1010, s: 1.00`) → gently tilt up & widen (`y: 845, s: 0.80`) to reveal stars, moon, rainbow, or flying birds.
- **Indoor Room Staging**: Left door (`x: 430`), central action (`x: 1000..1550`), right celebration table (`x: 2040..2640`).

## 3. Title & Vocabulary Tags (Zero Overlap / 100% Readcheck Pass!)
- Place `titlePos` inside Shot 0's open sky (`y ≈ 480..555`), off to one side (e.g. `cam0.x - 360`) so it clears bunting/sun/rainbow AND scrolls cleanly off-screen during later close-ups.
- Add **3 to 6 bilingual vocabulary tags** (`en`, `vi`, `col`, `beat`, `x`, `y`).
- Place each tag cleanly inside the visible box of its beat's active shot (`y ∈ [640, 860]`), at least **380 px away from `titlePos`** and **230 px away from any other tag**!

## 4. `storyboard.json` Schema
```json
{
  "world": "world_sunny_beach",
  "horizonY": 1090,
  "titlePos": { "x": 640, "y": 500, "t": 0.5 },
  "wash": {
    "color": "#d47c85",
    "waxPreset": "friendship-hearts",
    "beatIndex": 6
  },
  "silences": [
    { "id": "sil_turn", "beforeBeat": 3, "dur": 1.05 }
  ],
  "scenery": [
    { "type": "sun", "x": 2580, "y": 295, "scale": 0.94, "mood": "warm" },
    { "type": "cloud", "x": 1150, "y": 320, "scale": 0.9, "mood": "fluffy" },
    { "type": "rainbow", "x": 2050, "y": 600, "scale": 1.0, "appearBeat": 6, "mood": "bright" }
  ],
  "shots": [
    {
      "beat": 0,
      "cam": { "x": 1120, "y": 950, "s": 0.84 },
      "actors": [
        { "type": "little_dog", "x": 920, "y": 1265, "view": "r34", "pose": "wave", "expr": "happy" },
        { "type": "tabby_cat",  "x": 1220, "y": 1265, "view": "l34", "pose": "stand", "expr": "happy" }
      ]
    },
    {
      "beat": 3,
      "cam": { "x": 1460, "y": 1005, "s": 1.02, "moveDur": 1.8 },
      "actors": [
        { "type": "little_dog", "x": 1160, "y": 1265, "view": "r34", "pose": "walk", "expr": "kind" },
        { "type": "tabby_cat",  "x": 1400, "y": 1265, "view": "r34", "pose": "look_up", "expr": "curious" },
        { "type": "custom_baby_elephant", "x": 1690, "y": 1268, "view": "l34", "pose": "stand", "expr": "cry" }
      ]
    },
    {
      "beat": 6,
      "cam": { "x": 1960, "y": 955, "s": 0.80, "moveDur": 2.0 },
      "actors": [
        { "type": "little_dog", "x": 1540, "y": 1265, "view": "front", "pose": "sit", "expr": "happy" },
        { "type": "tabby_cat",  "x": 1820, "y": 1265, "view": "front", "pose": "cheer", "expr": "excited" },
        { "type": "custom_baby_elephant", "x": 2160, "y": 1268, "view": "l34", "pose": "cheer", "expr": "excited" }
      ]
    }
  ],
  "tags": [
    { "beat": 0, "en": "BEACH",    "vi": "bãi biển", "x": 1420, "y": 690, "col": "#4a8ec2" },
    { "beat": 3, "en": "ELEPHANT", "vi": "voi con",  "x": 1700, "y": 770, "col": "#6b7ca8" },
    { "beat": 6, "en": "FRIENDS",  "vi": "bạn bè",   "x": 2180, "y": 730, "col": "#d94436" }
  ]
}
```

### Automatic Camera Hold Keyframes (`cam.moveDur`)
- `apply-storyboard` automatically inserts a **hold keyframe** `cam.moveDur` seconds (default `1.8s`) before each shot transition, so the camera stays rock-steady during dialogue and then glides briskly into the next framing!
- Set `"moveDur": 0` on a shot only if you intentionally want a continuous slow drift across the whole preceding beat span.

### Valid `wash.waxPreset` Values
`"friendship-hearts"` | `"birthday-confetti"` | `"rain-and-roots"` | `"starry-night"` | `"none"`

### Valid Actor `pose` & `expr` Values
- **Built-in animals (`little_dog`, `tabby_cat`, `gray_wolf`)**:
  - `pose`: `"stand"`, `"walk"`, `"wave"`, `"cheer"`, `"scared"`, `"sit"` (empty-handed sitting!), `"sit_eat"` (sitting eating apple), `"climb"` (12 fps climbing!), `"lift"` (raising paws to lift a small friend/prop!), `"look_up"` (tilted head & eyes gazing skyward!), `"offer_apple"`, `"sing"`, `"blow"` (dog), `"gift"` / `"peek"` / `"laugh"` / `"sad_hungry"` / `"eat_apple"` (wolf)
  - `expr`: `"happy"`, `"excited"`, `"curious"`, `"scared"`, `"kind"`, `"yummy"`, `"wish"`, `"sad"`, `"friendly"`, `"laugh"`, `"surprised"`, `"mysterious"`
  - Optional `"hat": true` for birthday party hats!
- **Custom AI models (`custom_*`)**:
  - `pose`: `"stand"`, `"walk"` / `"climb"` (12 fps hop), `"wave"` / `"lift"`, `"cheer"` (jump + sparkles)
  - `expr`: `"happy"`, `"excited"`, `"cry"` / `"sad"` (animated sky-blue teardrop dots)
  - `view`: `"r34"` (default) or `"l34"` (horizontal flip)
  - Part-level `"anim"` inside `shapes[]`: `"flap"`, `"wag"`, `"bob"`, `"sway"`!
