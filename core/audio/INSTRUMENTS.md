# Storybook Instrument Palette (`core/audio/sampler.py`)

Lean CC0 1.0 sample pack curated specifically for **Crayon Picture Book** films (18 wooden, plucked, wind, and metal-toothed instruments — ~117 MB total, zero strings, zero grand piano, zero required CC-BY attributions).

```python
import sys; sys.path.insert(0, '.')
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit

mix = S.render([
    (0.0, 'ukulele',      'F4', 1.0, .60, -.25),
    (0.0, 'bassoon_stac', 'F3', 0.4, .55,  .20),
    (0.5, 'recorder',     'A5', 1.2, .65,  .10),
    (1.0, 'glockenspiel', 'C6', 1.5, .55,  .30),
    (1.5, 'woodblock',    'b',  None,.35, -.20),
], dur=4.0)
```

## Available CC0 Instruments (18)

| Name | Family | Source (CC0 1.0) | Range / Variants | Type |
|---|---|---|---|---|
| `ukulele` | Plucked | FreePats | B2–C6 | natural decay |
| `guitar_nylon` | Plucked | FreePats | G1–C6 | natural decay |
| `kalimba` | Pitched Perc | FreePats | F3–C#5 | natural decay |
| `recorder` | Woodwind | VCSL | F4–E6 | sustained, extendable |
| `ocarina` | Woodwind | VCSL | A4–C#6 | sustained, extendable |
| `flute` | Woodwind | VSCO 2 CE | C4–C7 | sustained, extendable |
| `flute_stac` | Woodwind | VSCO 2 CE | A4–C7 | natural decay |
| `clarinet` | Woodwind | VSCO 2 CE | D3–F#6 | sustained, extendable |
| `clarinet_stac` | Woodwind | VSCO 2 CE | D3–F6 | natural decay |
| `bassoon` | Woodwind | VSCO 2 CE | A#1–D#5 | sustained, extendable |
| `bassoon_stac` | Woodwind | VSCO 2 CE | A#1–C5 | natural decay |
| `glockenspiel` | Pitched Perc | VCSL | G5–C8 (alias `glock`, `celesta`) | natural decay |
| `xylophone` | Pitched Perc | VCSL | G4–C8 | natural decay |
| `marimba` | Pitched Perc | VCSL | F2–C7 | natural decay |
| `hand_chimes` | Pitched Perc | VCSL | C4–C7 | natural decay |
| `woodblock` | Unpitched | VCSL | `a`, `b`, `c` | hit |
| `shaker` | Unpitched | VCSL | `down`, `up`, `slap`, `roll` | hit |
| `triangle` | Unpitched | VCSL | `open`, `muted`, `semi`, `roll` | hit |

## Credits line
All 18 instruments are **CC0 1.0**:
`Samples (CC0): FreePats project (freepats.zenvoid.org), VS Chamber Orchestra: Community Edition (Versilian Studios / Sam Gossner), Versilian Community Sample Library (Versilian Studios)`
