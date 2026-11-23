"""Original CC0 storybook score for "One Little Seed" (56.0 s, 48 kHz stereo).
Instruments (all CC0, zero strings, zero grand piano — per STYLE.md §7):
  ukulele, marimba, recorder, bassoon, bassoon_stac, glockenspiel, hand_chimes, woodblock, shaker.
Locked directly to films/one-little-seed/events.json (single source of truth).
"""
import os, sys, json, numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(PROJ, '../..'))
sys.path.insert(0, LIB)

from core.audio import sampler as S
from core.audio.sfx import SR, limit

E = json.load(open(os.path.join(PROJ, 'events.json'), encoding='utf-8'))
DUR = float(E['dur'])
EV = E['ev']
S.seed(2026)

# Key: F Major (F G A Bb C D E) — bright, cozy picture-book warmth
# Base tempo: 108 BPM (beat = 0.55556 s, bar = 2.22222 s)
B = 60.0 / 108.0

stems_ev = {
    'ukulele': [],
    'marimba': [],
    'recorder': [],
    'bassoon': [],
    'glock': [],
    'perc': [],
}

def add_ev(stem, t, inst, pitch, dur, vel, pan=0.0, **kw):
    # Strictly respect our two real silences (19.20-20.45 s and 28.30-29.60 s)!
    if 19.15 <= t < 20.45:
        return
    if 28.25 <= t < 29.58:
        return
    if t < 0 or t >= DUR - 0.15:
        return
    d = dict(t=round(t, 4), inst=inst, pitch=pitch, dur=dur, vel=vel, pan=pan)
    d.update(kw)
    stems_ev[stem].append(d)

def uke_arp(t0, chord, beat_len, vel=0.56, pan=-0.28):
    # Gentle 4-note fingerpicked ukulele bar
    pat = [0, 1, 2, 3, 2, 1, 3, 2]
    for i, idx in enumerate(pat):
        p = chord[idx % len(chord)]
        add_ev('ukulele', t0 + i * beat_len * 0.5, 'ukulele', p, beat_len * 0.85,
               vel * (1.0 if i % 4 == 0 else 0.78), pan)

def uke_strum(t0, chord, dur, vel=0.62, pan=-0.25):
    for i, p in enumerate(chord):
        add_ev('ukulele', t0 + i * 0.022, 'ukulele', p, dur, vel * (0.9 + 0.04 * i), pan)

# Chord voicings in F Major (staying comfortably in ukulele/marimba sweet spot >= MIDI 53)
CH = {
    'F':    ['F4', 'A4', 'C5', 'F5'],
    'Bb':   ['F4', 'Bb4', 'D5', 'F5'],
    'C7':   ['G4', 'Bb4', 'C5', 'E5'],
    'Dm':   ['F4', 'A4', 'D5', 'F5'],
    'Gm':   ['G4', 'Bb4', 'D5', 'G5'],
    'Am':   ['E4', 'A4', 'C5', 'E5'],
    'Fmaj9':['F4', 'A4', 'C5', 'G5'],
}

# =====================================================================
# SECTION 1: OPENING SEED (0.0 - 7.4 s) — Sparse gentle marimba lullaby
# =====================================================================
s1_notes = [
    (0.15, 'F4', 0.9, .48), (0.75, 'C5', 0.8, .44), (1.35, 'A4', 1.1, .50),
    (2.15, 'G4', 0.9, .42), (2.75, 'C5', 0.8, .40), (3.45, 'A4', 1.0, .44),
    (4.30, 'Bb4', 0.9, .42), (4.95, 'D5', 0.9, .44), (5.65, 'C5', 1.1, .42),
    (6.50, 'A4', 0.8, .40),
]
for t, p, d, v in s1_notes:
    add_ev('marimba', t, 'marimba', p, d, v, -0.18)
# Delicate opening glockenspiel sparkles on title start (1.80 s) and SEED tag (3.65 s)
add_ev('glock', 1.80, 'glockenspiel', 'C6', 1.4, .45, 0.30)
add_ev('glock', 2.08, 'glockenspiel', 'F6', 1.6, .48, 0.35)
add_ev('glock', 3.65, 'glockenspiel', 'A5', 1.2, .46, 0.25)
add_ev('glock', 3.92, 'glockenspiel', 'C6', 1.3, .44, 0.28)

# =====================================================================
# SECTION 2: J-CUT INTO LEO & COLOURING THE SUN (7.4 - 17.5 s, 112 BPM)
# =====================================================================
B2 = 60.0 / 112.0   # 0.5357 s
s2_bars = [
    (7.40,  'F',  'F3'),
    (9.54,  'Bb', 'Bb3'),
    (11.68, 'C7', 'C3'),
    (13.82, 'F',  'F3'),
    (15.96, 'Gm', 'G3'),
]
for idx, (bt, ch, bass) in enumerate(s2_bars):
    uke_arp(bt, CH[ch], B2, vel=0.58 if idx > 0 else 0.50, pan=-0.28)
    # Playful staccato bassoon walking bounce on beats 1 and 3
    add_ev('bassoon', bt, 'bassoon_stac', bass, 0.35, 0.56, 0.22)
    add_ev('bassoon', bt + 2 * B2, 'bassoon_stac', bass, 0.35, 0.48, 0.22)
    # Light woodblock storybook click on beats 2 and 4
    add_ev('perc', bt + B2,     'woodblock', 'b', None, 0.34, 0.32)
    add_ev('perc', bt + 3 * B2, 'woodblock', 'a', None, 0.28, -0.25)

# Idea chime at 11.15 s!
add_ev('glock', 11.15, 'glockenspiel', 'C6', 1.0, 0.62, -0.20)
add_ev('glock', 11.35, 'glockenspiel', 'F6', 1.4, 0.68, -0.15)
# Brief cheerful recorder teaser motif as Sun draws & colours (12.4 - 16.4 s)
sun_mel = [
    (12.40, 'A4', 0.45, .52), (12.90, 'C5', 0.45, .56), (13.40, 'D5', 0.55, .58),
    (14.05, 'F5', 0.85, .60), (15.10, 'E5', 0.45, .52), (15.60, 'D5', 0.65, .50),
]
for t, p, d, v in sun_mel:
    add_ev('recorder', t, 'recorder', p, d, v, 0.16, attack=0.03)
add_ev('glock', 13.70, 'glockenspiel', 'D6', 1.1, 0.48, 0.42)

# =====================================================================
# SECTION 3: TOO HOT! COMIC FAILURE & SILENCE #1 (17.5 - 23.5 s)
# =====================================================================
# Comedic descending bassoon groan (17.85 -> 19.05 s) right into pure silence!
groan = [
    (17.85, 'D4', 0.32, .65), (18.18, 'C4', 0.32, .64),
    (18.50, 'B3', 0.32, .62), (18.82, 'A3', 0.34, .58),
]
for t, p, d, v in groan:
    add_ev('bassoon', t, 'bassoon', p, d, v, 0.08, release=0.06)
add_ev('marimba', 17.85, 'marimba', 'D4', 0.35, 0.45, -0.22)
add_ev('marimba', 18.50, 'marimba', 'A3', 0.45, 0.42, -0.22)

# ---> SILENCE #1: 19.20 - 20.45 s (ZERO MUSIC!) <---

# Playful tiptoe marimba & blue-crayon idea spark (21.6 - 23.4 s)
add_ev('marimba', 22.35, 'marimba', 'C5', 0.30, 0.58, -0.15)
add_ev('marimba', 22.60, 'marimba', 'E5', 0.30, 0.62, -0.10)
add_ev('marimba', 22.85, 'marimba', 'G5', 0.45, 0.66, -0.05)
add_ev('glock',   22.35, 'glockenspiel', 'G5', 0.90, 0.58, -0.20)
add_ev('glock',   22.62, 'glockenspiel', 'C6', 1.10, 0.64, -0.15)

# =====================================================================
# SECTION 4: DRAWING THE CLOUD (23.5 - 28.25 s, 118 BPM — brisk acceleration!)
# =====================================================================
B4 = 60.0 / 118.0   # 0.5085 s
s4_bars = [
    (23.50, 'Bb', 'Bb3'),
    (25.53, 'C7', 'C3'),
]
for bt, ch, bass in s4_bars:
    uke_arp(bt, CH[ch], B4, vel=0.60, pan=-0.26)
    add_ev('bassoon', bt, 'bassoon_stac', bass, 0.30, 0.58, 0.22)
    add_ev('bassoon', bt + 2 * B4, 'bassoon_stac', bass, 0.30, 0.54, 0.22)
    # Brisk playful shaker + woodblock driving the momentum forward!
    for k in range(4):
        add_ev('perc', bt + k * B4, 'shaker', 'down' if k % 2 == 0 else 'up', None, 0.30, 0.35)
    add_ev('perc', bt + B4, 'woodblock', 'c', None, 0.36, -0.30)
    add_ev('perc', bt + 3 * B4, 'woodblock', 'b', None, 0.32, 0.30)
# Rising joyful marimba cloud bounce
for i, p in enumerate(['F4', 'A4', 'Bb4', 'C5', 'D5', 'E5']):
    add_ev('marimba', 24.40 + i * 0.38, 'marimba', p, 0.42, 0.50, -0.15 + i * 0.06)
add_ev('glock', 25.10, 'glockenspiel', 'A5', 1.0, 0.50, -0.25)
# Final playful lift on 27.6 - 28.1 s right before Silence #2!
add_ev('ukulele', 27.60, 'ukulele', 'C5', 0.45, 0.55, -0.25)
add_ev('ukulele', 27.85, 'ukulele', 'E5', 0.40, 0.55, -0.20)

# ---> SILENCE #2: 28.30 - 29.60 s (Hushed breath before rain!) <---

# =====================================================================
# SECTION 5: SIGNATURE RAIN WASH & HIDDEN ROOTS (29.6 - 41.5 s, 96 BPM)
# =====================================================================
# FIRST SOUND AFTER SILENCE #2: crystalline raindrop glockenspiel chime at 29.60 s!
add_ev('glock', 29.60, 'glockenspiel', 'F6', 1.8, 0.72, -0.25)
add_ev('glock', 29.92, 'glockenspiel', 'C6', 1.6, 0.58, 0.15)

# Trigger a glockenspiel sparkle for EVERY 'glint' event in events.json!
for e in EV:
    if e['type'] == 'glint':
        add_ev('glock', e['t'], 'glockenspiel', e['pitch'], 1.45, 0.58, e.get('pan', 0.0))

# Lush spacious rolled ukulele chords & warm marimba ripples under the sap-green wash
B5 = 60.0 / 96.0    # 0.625 s
s5_chords = [
    (30.00, 'F',  'F3'),
    (32.50, 'Dm', 'D3'),
    (35.00, 'Bb', 'Bb3'),
    (37.50, 'Gm', 'G3'),
    (39.60, 'C7', 'C3'),
]
for bt, ch, bass in s5_chords:
    uke_strum(bt, CH[ch], 2.1, vel=0.52, pan=-0.28)
    add_ev('bassoon', bt, 'bassoon', bass, 1.85, 0.40, 0.20, attack=0.08)
    # Gentle water-ripple marimba arpeggios
    for k, p in enumerate(CH[ch]):
        add_ev('marimba', bt + 0.35 + k * 0.42, 'marimba', p, 0.75, 0.42, -0.22 + k * 0.15)

# Bright waking sprout fanfare at 38.75 - 41.3 s!
add_ev('glock', 38.75, 'glockenspiel', 'C6', 1.3, 0.64, 0.0)
add_ev('glock', 39.05, 'glockenspiel', 'D6', 1.3, 0.66, 0.1)
add_ev('glock', 39.35, 'glockenspiel', 'F6', 1.6, 0.70, 0.2)
add_ev('recorder', 39.70, 'recorder', 'C5', 0.55, 0.54, 0.10, attack=0.04)
add_ev('recorder', 40.30, 'recorder', 'D5', 0.55, 0.58, 0.10, attack=0.04)
add_ev('recorder', 40.90, 'recorder', 'E5', 0.55, 0.62, 0.10, attack=0.04)

# =====================================================================
# SECTION 6: WORDLESS MUSICAL BLOOM (41.5 - 47.5 s, 108 BPM — FULL THEME!)
# =====================================================================
# Main joyful singing recorder melody heard IN FULL FOR THE FIRST TIME!
B6 = 60.0 / 108.0   # 0.5556 s
s6_bars = [
    (41.50, 'F',  'F3'),
    (43.72, 'Bb', 'Bb3'),
    (45.94, 'C7', 'C3'),
]
for bt, ch, bass in s6_bars:
    uke_strum(bt, CH[ch], 0.95, vel=0.68, pan=-0.30)
    uke_strum(bt + B6, CH[ch], 0.50, vel=0.52, pan=-0.26)
    uke_strum(bt + 2 * B6, CH[ch], 0.95, vel=0.64, pan=-0.30)
    uke_strum(bt + 3 * B6, CH[ch], 0.50, vel=0.54, pan=-0.26)
    add_ev('bassoon', bt, 'bassoon_stac', bass, 0.45, 0.62, 0.22)
    add_ev('bassoon', bt + 2 * B6, 'bassoon_stac', bass, 0.45, 0.56, 0.22)
    for k in range(4):
        add_ev('perc', bt + k * B6, 'shaker', 'down' if k % 2 == 0 else 'up', None, 0.34, 0.32)
    add_ev('perc', bt + B6, 'woodblock', 'a', None, 0.38, -0.28)
    add_ev('perc', bt + 3 * B6, 'woodblock', 'b', None, 0.34, 0.28)
    # Joyful bouncing marimba harmonic accompaniment
    for k, p in enumerate(CH[ch]):
        add_ev('marimba', bt + k * B6, 'marimba', p, 0.55, 0.54, -0.15 + k * 0.10)

# Soaring, warm singing recorder melody across the entire 6-second wordless bloom!
bloom_mel = [
    (41.50, 'F5', 0.52, .72), (42.05, 'A5', 0.52, .74), (42.60, 'G5', 0.52, .70), (43.15, 'F5', 0.52, .72),
    (43.72, 'D5', 0.52, .70), (44.30, 'Bb5', 0.95, .78), (45.35, 'A5', 0.52, .74),
    (45.94, 'G5', 0.50, .72), (46.46, 'A5', 0.48, .75), (46.96, 'G5', 0.50, .70),
]
for t, p, d, v in bloom_mel:
    add_ev('recorder', t, 'recorder', p, d, v, 0.12, attack=0.03)

# Radiant hand_chimes + glockenspiel bloom burst right as the big red petals POP open (44.35 s)!
add_ev('glock', 44.35, 'hand_chimes', 'F5', 2.6, 0.72, -0.20)
add_ev('glock', 44.42, 'hand_chimes', 'A5', 2.6, 0.70,  0.20)
add_ev('glock', 44.50, 'hand_chimes', 'C6', 2.8, 0.72,  0.00)
add_ev('glock', 44.65, 'glockenspiel', 'F6', 1.8, 0.72, 0.15)
add_ev('glock', 45.45, 'glockenspiel', 'D6', 1.2, 0.58, -0.30)   # Leo jump 1
add_ev('glock', 46.45, 'glockenspiel', 'F6', 1.4, 0.62, -0.30)   # Leo jump 2

# =====================================================================
# SECTION 7: FRIDGE BOOKEND & TENDER CADENCE (47.5 - 56.0 s, 96 BPM)
# =====================================================================
add_ev('recorder', 47.55, 'recorder', 'F5', 1.55, 0.62, 0.12, attack=0.04)
uke_strum(47.55, CH['F'], 2.4, vel=0.58, pan=-0.26)
add_ev('bassoon', 47.55, 'bassoon', 'F3', 2.1, 0.46, 0.20, attack=0.06)
add_ev('glock',   47.55, 'glockenspiel', 'A5', 1.5, 0.56, 0.25)

uke_strum(50.20, CH['Bb'], 2.2, vel=0.50, pan=-0.24)
add_ev('marimba', 50.80, 'marimba', 'F4', 1.1, 0.46, -0.15)
add_ev('marimba', 51.40, 'marimba', 'A4', 1.1, 0.44,  0.00)
add_ev('marimba', 52.00, 'marimba', 'C5', 1.2, 0.44,  0.15)

# Tender bookend echo (echoing opening marimba + final warm Fmaj9 cadence!)
uke_strum(52.80, CH['Fmaj9'], 2.8, vel=0.52, pan=-0.22)
add_ev('recorder', 52.95, 'recorder', 'A4', 0.80, 0.44, 0.10, attack=0.06)
add_ev('recorder', 53.85, 'recorder', 'F5', 1.75, 0.46, 0.10, attack=0.06)
add_ev('glock',    53.95, 'hand_chimes', 'F5', 2.0, 0.56, -0.15)
add_ev('glock',    54.12, 'hand_chimes', 'C6', 1.8, 0.52,  0.15)
add_ev('glock',    54.30, 'glockenspiel', 'F6', 1.6, 0.48,  0.00)

# Render each stem individually with warm room reverb
os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
N = int(DUR * SR)
full = np.zeros((N, 2), np.float32)

# Silence envelope mask so decays never bleed into the two real silences!
tt = np.arange(N) / SR
sil_mask = np.ones(N, np.float32)
for t0, t1 in [(19.20, 20.45), (28.30, 29.60)]:
    # Smooth 90 ms fade out right at t0, 40 ms fade back in at t1
    a = np.clip((t0 - tt) / 0.09, 0.0, 1.0)
    b = np.clip((tt - t1) / 0.04, 0.0, 1.0)
    sil_mask *= np.maximum(a, b)

for name, evs in stems_ev.items():
    if not evs:
        buf = np.zeros((N, 2), np.float32)
    else:
        buf = S.render(evs, dur=DUR, master=False)
        if len(buf) < N:
            buf = np.pad(buf, ((0, N - len(buf)), (0, 0)))
        else:
            buf = buf[:N]
        # Warm small wooden room reverb (lighter on perc/bassoon, airier on glock/recorder)
        rmix = 0.24 if name in ('glock', 'recorder') else (0.14 if name == 'perc' else 0.18)
        buf = S.room(buf, size=0.38, mix=rmix, predelay=0.012, damp=0.55)
    buf *= sil_mask[:, None]
    sf.write(os.path.join(HERE, 'stems', f'{name}.wav'), buf.astype(np.float32), SR)
    full += buf

for c in range(2):
    full[:, c] = limit(full[:, c], 0.92)
sf.write(os.path.join(HERE, 'score.wav'), full.astype(np.float32), SR)

used = sorted({e['inst'] for evs in stems_ev.values() for e in evs})
print('score.wav written:', DUR, 's | instruments:', ', '.join(used))
print('CREDITS lines:')
for line in S.credits(used):
    print(' ', line)
