"""Data-driven CC0 storybook score generator for Crayon Book Studio.
Usage: .venv/bin/python engine/score_gen.py films/<slug>
Reads project.json + events.json -> renders 6 stems (ukulele, marimba, recorder, bassoon, glock, perc) + score.wav.
Uses ONLY our 18 local CC0 storybook instruments (zero strings, zero grand piano).
"""
import os, sys, json, numpy as np, soundfile as sf

if len(sys.argv) < 2:
    sys.exit('usage: score_gen.py <project_dir>')

PROJ = os.path.abspath(sys.argv[1])
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, LIB)

from core.audio import sampler as S
from core.audio.sfx import SR, limit

P = json.load(open(os.path.join(PROJ, 'project.json'), encoding='utf-8'))
ev_path = os.path.join(PROJ, 'events.json')
E = json.load(open(ev_path, encoding='utf-8')) if os.path.exists(ev_path) else {'dur': P['meta']['duration'], 'ev': []}
DUR = float(P.get('meta', {}).get('duration', E.get('dur', 30.0)))
EV = E.get('ev', [])
SILENCES = [(float(s['t0']), float(s['t1'])) for s in P.get('silences', [])]
MUS = P.get('music', {})
PRESET = MUS.get('preset', 'morning-garden')
KEY = MUS.get('key', 'F')
BPM = float(MUS.get('bpm', 108))
B = 60.0 / max(50.0, min(180.0, BPM))

S.seed(2026)

# Key transposition offset relative to F Major (F=0)
KEY_SHIFT = {'C': -5, 'D': -3, 'Eb': -2, 'F': 0, 'G': 2, 'A': 4}.get(KEY, 0)
def tr(pitch):
    return S.midi(pitch) + KEY_SHIFT

stems_ev = {k: [] for k in ('ukulele', 'marimba', 'recorder', 'bassoon', 'glock', 'perc')}

def in_silence(t):
    return any((t0 - 0.05) <= t < (t1 - 0.02) for t0, t1 in SILENCES)

def add_ev(stem, t, inst, pitch, dur, vel, pan=0.0, **kw):
    if in_silence(t) or t < 0 or t >= DUR - 0.12:
        return
    p_val = tr(pitch) if (isinstance(pitch, str) and inst not in ('woodblock', 'shaker', 'triangle')) else pitch
    d = dict(t=round(t, 4), inst=inst, pitch=p_val, dur=dur, vel=vel, pan=pan)
    d.update(kw)
    stems_ev[stem].append(d)

# Choose instrument colouration per storybook mood preset (all 100% from our 18 local CC0 instruments!)
if PRESET == 'gentle-lullaby':
    PLUCK_INST, MALLET_INST, LEAD_INST, BASS_INST = 'kalimba', 'marimba', 'ocarina', 'clarinet'
elif PRESET == 'playful-adventure':
    PLUCK_INST, MALLET_INST, LEAD_INST, BASS_INST = 'guitar_nylon', 'xylophone', 'flute', 'clarinet_stac'
else:
    PLUCK_INST, MALLET_INST, LEAD_INST, BASS_INST = 'ukulele', 'marimba', 'recorder', 'bassoon_stac'

CHORDS = [
    (['F4', 'A4', 'C5', 'F5'],  'F3'),
    (['F4', 'Bb4', 'D5', 'F5'], 'Bb3'),
    (['G4', 'Bb4', 'C5', 'E5'], 'C3'),
    (['F4', 'A4', 'C5', 'F5'],  'F3'),
    (['F4', 'A4', 'D5', 'F5'],  'D3'),
    (['G4', 'Bb4', 'D5', 'G5'], 'G3'),
    (['G4', 'Bb4', 'C5', 'E5'], 'C3'),
    (['F4', 'A4', 'C5', 'G5'],  'F3'),
]

wash_t = float(P.get('palette', {}).get('washStart', 999)) if P.get('palette', {}).get('washEnabled') else 999.0
bloom_evs = [e['t'] for e in EV if e.get('type') == 'bloom']
bloom_t = bloom_evs[0] if bloom_evs else (DUR * 0.72)

bar_len = 4.0 * B
bar_idx = 0
t_bar = 0.0
while t_bar < DUR - 0.8:
    ch, bass = CHORDS[bar_idx % len(CHORDS)]
    # Soft intro in first 1-2 bars, lush shimmer during wash, full theme around bloom, tender cadence at end
    is_intro = t_bar < min(5.5, DUR * 0.14)
    is_wash  = wash_t <= t_bar < (wash_t + 10.5)
    is_bloom = (bloom_t - 3.0) <= t_bar <= (bloom_t + 3.5)
    is_end   = t_bar >= DUR - 5.5

    if is_intro:
        for k, p in enumerate([ch[0], ch[2], ch[1]]):
            add_ev('marimba', t_bar + k * B * 1.15, MALLET_INST, p, B * 1.4, 0.44, -0.18 + k * 0.14)
    elif is_end:
        for i, p in enumerate(ch):
            add_ev('ukulele', t_bar + i * 0.025, PLUCK_INST, p, 2.2, 0.50, -0.22)
        if t_bar >= DUR - 2.6:
            add_ev('glock', t_bar + 0.1, 'hand_chimes', 'F5', 2.0, 0.54, -0.15)
            add_ev('glock', t_bar + 0.28, 'hand_chimes', 'C6', 1.8, 0.50, 0.15)
            add_ev('glock', t_bar + 0.45, 'glockenspiel', 'F6', 1.6, 0.46, 0.0)
    elif is_wash:
        # Rolled chords + sparkling ripples under watercolour wash
        for i, p in enumerate(ch):
            add_ev('ukulele', t_bar + i * 0.025, PLUCK_INST, p, 1.9, 0.50, -0.28)
        add_ev('bassoon', t_bar, 'bassoon', bass, 1.7, 0.38, 0.20, attack=0.06)
        for k, p in enumerate(ch):
            add_ev('marimba', t_bar + 0.30 + k * B * 0.85, MALLET_INST, p, 0.7, 0.42, -0.2 + k * 0.14)
    else:
        # Main playful lilt
        pat = [0, 1, 2, 3, 2, 1, 3, 2]
        for i, idx in enumerate(pat):
            add_ev('ukulele', t_bar + i * B * 0.5, PLUCK_INST, ch[idx % len(ch)], B * 0.82,
                   (0.62 if is_bloom else 0.54) * (1.0 if i % 4 == 0 else 0.78), -0.26)
        add_ev('bassoon', t_bar, BASS_INST, bass, 0.38, 0.58 if is_bloom else 0.50, 0.22)
        add_ev('bassoon', t_bar + 2 * B, BASS_INST, bass, 0.38, 0.50, 0.22)
        if PRESET != 'gentle-lullaby':
            add_ev('perc', t_bar + B, 'woodblock', 'b', None, 0.34, 0.30)
            add_ev('perc', t_bar + 3 * B, 'woodblock', 'a', None, 0.28, -0.26)
            for k in range(4):
                add_ev('perc', t_bar + k * B, 'shaker', 'down' if k % 2 == 0 else 'up', None, 0.28 if is_bloom else 0.20, 0.34)
        if is_bloom:
            # Joyful singing lead melody during climax!
            mel = ['F5', 'A5', 'G5', 'F5'] if bar_idx % 2 == 0 else ['D5', 'Bb5', 'A5', 'G5']
            for k, mp in enumerate(mel):
                add_ev('recorder', t_bar + k * B, LEAD_INST, mp, B * 0.92, 0.72, 0.12, attack=0.03)
            for k, p in enumerate(ch):
                add_ev('marimba', t_bar + k * B, MALLET_INST, p, 0.55, 0.52, -0.15 + k * 0.1)

    t_bar += bar_len
    bar_idx += 1

# Event-locked sparkles, chimes, and comic reactions from events.json
for e in EV:
    ty, t, pan = e.get('type'), float(e.get('t', 0)), float(e.get('pan', 0))
    if ty == 'glint':
        add_ev('glock', t, 'glockenspiel', e.get('pitch', 'C6'), 1.4, 0.58, pan)
    elif ty == 'idea':
        add_ev('glock', t, 'glockenspiel', 'C6', 0.9, 0.60, pan)
        add_ev('glock', t + 0.18, 'glockenspiel', 'F6', 1.2, 0.65, pan)
    elif ty == 'bloom':
        add_ev('glock', t, 'hand_chimes', 'F5', 2.4, 0.72, -0.2)
        add_ev('glock', t + 0.08, 'hand_chimes', 'A5', 2.4, 0.70, 0.2)
        add_ev('glock', t + 0.16, 'hand_chimes', 'C6', 2.6, 0.72, 0.0)
    elif ty == 'sprout':
        add_ev('glock', t, 'glockenspiel', 'C6', 1.1, 0.62, 0.0)
        add_ev('glock', t + 0.25, 'glockenspiel', 'F6', 1.4, 0.66, 0.15)
    elif ty == 'write':
        add_ev('glock', t, 'glockenspiel', 'A5', 1.0, 0.44, pan)
    elif ty == 'dip':
        add_ev('glock', t, 'glockenspiel', 'F6', 1.7, 0.70, pan)

# Render stems with strict silence envelope
stems_dir = os.path.join(PROJ, 'music', 'stems')
os.makedirs(stems_dir, exist_ok=True)
N = int(round(DUR * SR))
tt = np.arange(N) / SR
sil_mask = np.ones(N, np.float32)
for t0, t1 in SILENCES:
    a = np.clip((t0 - tt) / 0.09, 0.0, 1.0)
    b = np.clip((tt - t1) / 0.04, 0.0, 1.0)
    sil_mask *= np.maximum(a, b)

full = np.zeros((N, 2), np.float32)
for name, evs in stems_ev.items():
    if not evs:
        buf = np.zeros((N, 2), np.float32)
    else:
        buf = S.render(evs, dur=DUR, master=False)
        buf = np.pad(buf, ((0, max(0, N - len(buf))), (0, 0)))[:N]
        rmix = 0.24 if name in ('glock', 'recorder') else (0.14 if name == 'perc' else 0.18)
        buf = S.room(buf, size=0.38, mix=rmix, predelay=0.012, damp=0.55)
    buf *= sil_mask[:, None]
    sf.write(os.path.join(stems_dir, f'{name}.wav'), buf.astype(np.float32), SR)
    full += buf

for c in range(2):
    full[:, c] = limit(full[:, c], 0.92)
sf.write(os.path.join(PROJ, 'music', 'score.wav'), full.astype(np.float32), SR)
used = sorted({e['inst'] for evs in stems_ev.values() for e in evs})
print(f'score_gen: {DUR:.1f}s ({PRESET}, key={KEY}, bpm={BPM:.0f}) | instruments: {", ".join(used)}')
