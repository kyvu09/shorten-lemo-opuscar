"""Full audio mix for "One Little Seed":
  CC0 score stems + procedural material foley (crayon stick-slip, zig-zag hatching, wet watercolour brush,
  wooden crayon clink, footsteps, cloud puff, sprout pop, leaf flip) + warm sunlit garden ambience
  + Kokoro English storytelling voice (compressed, warm EQ, de-essed, near-field reverb)
  -> out/mix.wav (48 kHz stereo) + subtitles_en_vi.srt.
"""
import os, sys, json, numpy as np, soundfile as sf, soxr
from scipy.ndimage import uniform_filter1d
from scipy.signal import fftconvolve, sosfilt as _sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *

E = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf-8'))
DUR = float(E['dur']); EV = E['ev']; N = int(DUR * SR)
tt = np.arange(N) / SR
rng = np.random.default_rng(42)

def nz(d): return rng.standard_normal(max(1, int(round(d * SR))))
def T(d): return np.arange(max(1, int(round(d * SR)))) / SR
def fade(x, a=.01, b=.03):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ib: x[-ib:] *= np.linspace(1, 0, ib)
    return x
def envelope(d, pts):
    k = np.array(pts, float)
    return np.interp(T(d), k[:, 0] * d, k[:, 1])

# ——— Material Foley Synthesizers (crayon wax on toothy paper, wet brush, wooden clink, garden pops) ———
def crayon(d, speed=1.0, v=1.0):
    n = nz(d)
    rate = max(4, int(SR / (70 + 90 * speed)))
    grain = uniform_filter1d((rng.random(len(n) // rate + 2) ** 3).repeat(rate)[:len(n)], rate // 3 + 1)
    x = bp(n, 1400 + 550 * speed, 6200, 2) * (0.35 + grain * 1.55) + bp(n, 320, 920, 1) * 0.16
    return fade(x * envelope(d, [(0, 0), (.08, 1), (.85, .9), (1, 0)]) * v * 0.24, .01, .04)

def scribble(d, rate=6.8, v=1.0):
    out = np.zeros(int(d * SR)); t = 0.0
    while t < d - 0.08:
        L = (1.0 / rate) * (0.8 + 0.4 * rng.random())
        s = crayon(min(L, d - t), 1.35, v * (0.72 + 0.28 * rng.random()))
        i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]
        t += L
    return out

def write_fx(d, v=1.0):
    out = np.zeros(int(d * SR)); t = 0.0
    while t < d - 0.08:
        L = 0.065 + 0.095 * rng.random()
        s = crayon(L, 0.85, v)
        i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]
        t += L + 0.03 * rng.random()
    return out

def paper_rustle(d=0.55, v=1.0):
    n = nz(d)
    cr = (rng.random(len(n)) < 0.004) * rng.standard_normal(len(n)) * 2.8
    return fade((hp(n, 900) * 0.22 + bp(cr, 1500, 7500)) * envelope(d, [(0, 0), (.2, 1), (1, 0)]) * v * 0.24)

def boot_step(v=1.0, f=320):
    t = T(0.14)
    thump = np.sin(2 * np.pi * (f * np.exp(-t * 8)) * t) * np.exp(-t / 0.032) * 0.45
    grass = bp(nz(0.14), 900, 3200) * np.exp(-t / 0.025) * 0.25
    return fade((thump + grass) * v * 0.65, .002, .03)

def idea_pop(v=1.0):
    t = T(0.16)
    x = np.sin(2 * np.pi * (680 + 950 * (1 - np.exp(-t / 0.025))) * t) * np.exp(-t / 0.045)
    return fade(x * 0.30 * v, .002, .04)

def fabric_swish(d=0.45, v=1.0):
    n = nz(d)
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    return lp(bp(n, 280, 2400), 2100) * e * 0.30 * v

def sweat_bloop(v=1.0):
    t = T(0.14)
    f = 420 + 780 * (t / 0.14) ** 1.4
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04)
    return fade(x * 0.26 * v, .002, .03)

def soil_tuck(v=1.0):
    t = T(0.22)
    return fade((lp(nz(0.22), 700) * np.exp(-t / 0.045) * 0.45 + np.sin(2 * np.pi * 135 * t) * np.exp(-t / 0.035) * 0.25) * v)

def crayon_clink(v=1.0):
    # Crisp single wooden/wax crayon set down onto table — first sound breaking Silence #1!
    t = T(0.20)
    wood = np.sin(2 * np.pi * 1120 * t) * np.exp(-t / 0.018) * 0.55 + np.sin(2 * np.pi * 2480 * t) * np.exp(-t / 0.010) * 0.35
    tap2 = np.zeros_like(t)
    i2 = int(0.052 * SR)
    t2 = np.arange(len(t) - i2) / SR
    tap2[i2:] = (np.sin(2 * np.pi * 1180 * t2) * np.exp(-t2 / 0.014) * 0.30)
    return fade((wood + tap2 + bp(nz(0.20), 1800, 6000) * np.exp(-t / 0.008) * 0.22) * v * 0.85, .001, .03)

def cloud_puff(v=1.0):
    d = 0.42; n = nz(d)
    e = envelope(d, [(0, 0), (.18, 1), (.55, .60), (1, 0)])
    return fade(lp(bp(n, 220, 1400), 1100) * e * 0.30 * v, .02, .08)

def water_dip(v=1.0):
    t = T(0.26)
    x = np.sin(2 * np.pi * np.cumsum(760 + 1350 * np.exp(-t / 0.032)) / SR) * np.exp(-t / 0.055)
    return fade((x * 0.28 + bp(nz(0.26), 1800, 6500) * np.exp(-t / 0.022) * 0.09) * v)

def wet_brush(d, v=1.0):
    n = nz(d)
    wet = lp(n, 1750) * 0.52 + bp(n, 1750, 4600) * 0.18
    grain = uniform_filter1d(np.abs(rng.standard_normal(len(n))), 380) * 0.55 + 0.72
    body = wet * grain * envelope(d, [(0, 0), (.07, .9), (.35, 1), (.82, .85), (1, 0)])
    return fade(body * 0.25 * v, .03, .10)

def sprout_pop(v=1.0):
    t = T(0.32)
    f = 280 + 680 * (1 - np.exp(-t / 0.05))
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.065) * 0.36
    crisp = bp(nz(0.32), 1400, 4800) * np.exp(-t / 0.022) * 0.16
    return fade((pop + crisp) * v, .002, .05)

def leaf_flip(v=1.0):
    d = 0.20; n = nz(d)
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 1.6
    return fade((bp(n, 700, 3600) * e * 0.26 + np.sin(2 * np.pi * (520 + 260 * T(d) / d) * T(d)) * np.exp(-T(d) / 0.04) * 0.15) * v)

def bloom_burst(v=1.0):
    d = 0.42; t = T(d)
    pop = np.sin(2 * np.pi * np.cumsum(360 + 820 * (1 - np.exp(-t / 0.04))) / SR) * np.exp(-t / 0.08) * 0.32
    rustle = bp(nz(d), 1200, 5200) * envelope(d, [(0, 0), (.15, 1), (1, 0)]) * 0.22
    return fade((pop + rustle) * v, .004, .08)

def birdsong(d=0.65, base_f=2750, v=1.0):
    # Gentle sunlit morning bird chirp (never harsh)
    out = np.zeros(int(d * SR))
    for k, (off, dur, f0, f1) in enumerate([(0.0, 0.11, base_f, base_f * 1.24), (0.16, 0.13, base_f * 1.18, base_f * 0.96), (0.34, 0.12, base_f * 1.05, base_f * 1.28)]):
        tc = T(dur)
        f = np.linspace(f0, f1, len(tc)) + 45 * np.sin(2 * np.pi * 24 * tc)
        chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tc / dur) ** 1.4
        i = int(off * SR); out[i:i + len(chirp)] += chirp[:len(out) - i]
    return lp(out, 5500) * 0.048 * v

def tape_crinkle(v=1.0):
    d = 0.45; n = nz(d)
    cr = (rng.random(len(n)) < 0.005) * rng.standard_normal(len(n)) * 2.2
    return fade((bp(n, 1200, 4800) * 0.14 + bp(cr, 2200, 7500) * 0.18) * envelope(d, [(0, 0), (.2, 1), (1, 0)]) * v)

# Place all timeline foley events!
buf = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(x, at, g=1.0, pan=0.0, b=None): add(buf if b is None else b, x.astype(np.float64), at, g, pan)

for e in EV:
    t, ty, pan = e['t'], e['type'], e.get('pan', 0.0)
    if ty == 'scratch':   put(crayon(e['dur'], 1.1), t, 1.0, pan)
    elif ty == 'scribble':put(scribble(e['dur']), t, 0.85, pan)
    elif ty == 'write':   put(write_fx(e['dur']), t, 0.90, pan)
    elif ty == 'paper':   put(paper_rustle(e.get('dur', 0.55)), t, 0.85, pan)
    elif ty == 'step':    put(boot_step(0.95), t, 1.0, pan)
    elif ty == 'idea':    put(idea_pop(1.0), t, 0.95, pan)
    elif ty == 'swish':   put(fabric_swish(e.get('dur', 0.45)), t, 1.0, pan)
    elif ty == 'sweat':   put(sweat_bloop(0.95), t, 0.95, pan)
    elif ty == 'tuck':    put(soil_tuck(1.0), t, 0.95, pan)
    elif ty == 'clink':   put(crayon_clink(1.0), t, 1.0, pan)
    elif ty == 'pickup':  put(crayon_clink(0.75), t, 0.85, pan); put(idea_pop(0.85), t + 0.04, 0.9, pan)
    elif ty == 'puff':    put(cloud_puff(1.0), t - 0.12, 1.0, pan)
    elif ty == 'dip':     put(water_dip(1.0), t, 1.0, pan)
    elif ty == 'brush':
        d = e['dur'] + 0.22; x = wet_brush(d, 1.05)
        p0, p1 = (-0.80, 0.80) if e['dir'] > 0 else (0.80, -0.80)
        L = len(x); s = int(t * SR); pn = np.linspace(p0, p1, L)
        l, r = np.cos((pn + 1) * np.pi / 4) * 1.414, np.sin((pn + 1) * np.pi / 4) * 1.414
        e2 = min(N, s + L); buf[s:e2, 0] += (x * l)[:e2 - s]; buf[s:e2, 1] += (x * r)[:e2 - s]
    elif ty == 'sprout':  put(sprout_pop(1.0), t, 1.0, pan)
    elif ty == 'leaf':    put(leaf_flip(0.95), t, 0.95, pan)
    elif ty == 'bloom':   put(bloom_burst(1.0), t, 1.0, pan)
    elif ty == 'hop':     put(boot_step(1.0, 290), t, 1.0, pan)
    elif ty == 'tape':    put(tape_crinkle(0.9), t, 0.9, pan)

# ——— Ambience Beds (strictly muted during Silence #1 & Silence #2!) ———
sil_amb = np.ones(N)
for t0, t1 in [(19.20, 20.45), (28.30, 29.60)]:
    a = np.clip((t0 - tt) / 0.08, 0.0, 1.0)
    b = np.clip((tt - t1) / 0.08, 0.0, 1.0)
    sil_amb *= np.maximum(a, b)

# 1. Very faint warm paper air room-tone (0 - 56 s)
air = lp(hp(nz(DUR), 400), 3400) * 0.0022
amb[:, 0] += air
amb[:, 1] += np.roll(air, 1700)

# 2. Morning garden birdsong (J-cut entering at 7.4 s, fading out before hot silence, returning joyfully for bloom & L-cut tail to 56 s!)
for bt, bf, pn in [(7.55, 2720, -0.55), (10.45, 2980, 0.50), (14.60, 2640, -0.45),
                   (41.80, 2850, 0.55), (44.90, 3100, -0.50), (49.20, 2760, 0.45), (54.45, 2680, -0.35)]:
    put(birdsong(0.65, bf, 0.90), bt, 1.0, pn, b=amb)

# 3. Soft cozy distant rain patter during the Sap-Green Wash (29.8 - 41.5 s)
rain_n = bp(nz(DUR), 900, 4800, 2) * 0.016
rain_env = np.interp(tt, [29.6, 30.6, 39.5, 41.8], [0.0, 1.0, 0.85, 0.0])
amb[:, 0] += rain_n * rain_env
amb[:, 1] += np.roll(rain_n, 1300) * rain_env

amb *= sil_amb[:, None]

# ——— Narration DSP Chain (STYLE.md §7 + TECHNIQUE.md §4) ———
def biquad(x, kind, f0, gain_db, q=0.707):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; cw, sw = np.cos(w), np.sin(w); al = sw / (2 * q)
    if kind == 'peak':
        b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]
    else:
        s2 = 2 * np.sqrt(A) * al; sg = 1 if kind == 'high' else -1
        b = [A * ((A + 1) + sg * (A - 1) * cw + s2), -2 * sg * A * ((A - 1) + sg * (A + 1) * cw), A * ((A + 1) + sg * (A - 1) * cw - s2)]
        a = [(A + 1) - sg * (A - 1) * cw + s2, 2 * sg * ((A - 1) - sg * (A + 1) * cw), (A + 1) - sg * (A - 1) * cw - s2]
    return _sosfilt(np.array([b + a]) / a[0], x)

def deess(x, lo=4800, hi=10000, thr_rel=0.5, ratio=4.0):
    band = bp(x, lo, hi, 2)
    eb = uniform_filter1d(np.abs(band), int(0.004 * SR))
    ef = uniform_filter1d(np.abs(x), int(0.004 * SR))
    over = eb / (ef * thr_rel + 1e-9)
    g = np.where(over > 1, over ** (1 / ratio - 1), 1.0)
    g = uniform_filter1d(g, int(0.003 * SR))
    return x - band + band * g, 20 * np.log10(g.min() + 1e-9)

VO_RMS = 10 ** (-18.2 / 20)
vo = np.zeros((N, 2)); vmask = np.zeros(N)
for e in [x for x in EV if x['type'] == 'voice']:
    a, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if a.ndim > 1: a = a.mean(1)
    a = soxr.resample(a, sr, SR)
    a = hp(a, 75)
    a = compress(a / (np.abs(a).max() + 1e-9) * 0.8, thr=0.20, ratio=2.5, att=0.008, rel=0.14)
    a = biquad(a, 'low', 220, 1.5)
    a = biquad(a, 'peak', 3200, -2.0, 1.0)
    a = biquad(a, 'high', 6000, -4.0)
    a, gr = deess(a)
    act = np.abs(a) > np.abs(a).max() * 0.05
    a = a * VO_RMS / (np.sqrt(np.mean(a[act] ** 2)) + 1e-9)
    add(vo, a, e['t'], 1.0, 0.0)
    # Pre-pad vmask by 0.18 s so lush wordless music ducks smoothly right before each spoken entry!
    s0 = max(0, int((e['t'] - 0.18) * SR))
    s1 = min(N, int(e['t'] * SR) + len(a) + int(0.10 * SR))
    vmask[s0:s1] = 1.0

# Warm near-field storybook reverb (~-17 dB under dry — scaled carefully so never boomy!)
def warm_ir(seed):
    r = np.random.default_rng(seed); L = int(0.85 * SR); ir = np.zeros(L); pd = int(0.012 * SR)
    for ms, g in [(7, .5), (11, .38), (17, .3), (23, .22), (31, .16)]:
        ir[pd + int((ms + r.uniform(-1, 1)) * SR / 1000)] += g * r.choice([-1, 1])
    tt_ = np.arange(L - pd) / SR
    tail = r.standard_normal(L - pd) * np.exp(-tt_ / 0.10) * np.clip(tt_ / 0.02, 0, 1) * 0.35
    ir[pd:] += lp(tail, 3200)
    return lp(ir, 4800)

dry = vo.copy()
for c in range(2):
    wet = fftconvolve(dry[:, c], warm_ir(41 + c), 'full')[:N]
    scale = (10 ** (-17.5 / 20)) * (np.sqrt(np.mean(dry[:, c] ** 2)) + 1e-12) / (np.sqrt(np.mean(wet ** 2)) + 1e-12)
    vo[:, c] += wet * scale

# ——— Combine Score Stems (with gentle metal high-sheen lift on glockenspiel/hand_chimes) ———
SG = {'ukulele': 0.92, 'marimba': 0.85, 'recorder': 0.95, 'bassoon': 0.78, 'glock': 1.25, 'perc': 0.72}
mus = np.zeros((N, 2))
for k, g in SG.items():
    p = os.path.join(HERE, 'music', 'stems', k + '.wav')
    m, msr = sf.read(p)
    if m.ndim == 1: m = np.stack([m, m], 1)
    L = min(N, len(m))
    if k == 'glock':
        for c in range(2): m[:L, c] += bp(m[:L, c], 3200, 7200, 2) * 0.30
    mus[:L] += m[:L] * g

# Smooth music ducking (-9.5 dB) & foley ducking (-7.0 dB) under voice narration
duck = uniform_filter1d(vmask, int(0.24 * SR)); duck = np.clip(duck * 1.65, 0.0, 1.0)
mus *= (1.0 - duck * (1.0 - 10 ** (-9.5 / 20)))[:, None]
buf *= (1.0 - duck * (1.0 - 10 ** (-7.0 / 20)))[:, None]

# Lift wordless musical bloom passage (41.5 - 47.4 s) smoothly by +4.0 dB!
mus *= (10 ** (np.interp(tt, [41.1, 41.7, 47.0, 47.6], [0.0, 4.0, 4.0, 0.0]) / 20))[:, None]

# Master stereo mix (clean headroom; ffmpeg mux two-pass loudnorm masters to -14 LUFS)
mix = mus * 0.78 + buf * 0.76 + amb * 1.0 + vo * 1.0
for c in range(2):
    mix[:, c] = limit(mix[:, c], 0.94)

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)

# ——— Export bilingual .srt (subtitles_en_vi.srt — separate name because subtitles are burned in!) ———
def srt_ts(s):
    h = int(s // 3600); m = int((s % 3600) // 60); sec = int(s % 60); ms = int(round((s - int(s)) * 1000))
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'

cues = [
    ( 2.45,  5.25, 'Here is a little seed.\nĐây là một hạt giống nhỏ.'),
    ( 5.40,  8.10, 'It is fast asleep.\nNó đang ngủ say giấc.'),
    ( 8.80, 11.75, 'Leo wants a flower.\nLeo muốn có một bông hoa.'),
    (12.45, 16.70, 'Wake up, seed! Here comes the sun.\nDậy đi hạt nhỏ! Mặt trời tới rồi.'),
    (20.40, 23.15, 'Oh no! Too hot!\nÔi không! Nóng quá!'),
    (23.85, 27.60, 'Leo draws a big blue cloud.\nLeo vẽ một đám mây xanh thật to.'),
    (30.45, 33.80, 'Down comes the cool rain!\nCơn mưa mát lành rơi xuống!'),
    (34.95, 39.20, 'Look! Hidden roots drink the water.\nNhìn kìa! Rễ cây ẩn mình đang uống nước.'),
    (47.50, 51.05, 'Hooray! A tall red flower!\nHoan hô! Một bông hoa đỏ thật cao!'),
    (51.45, 55.20, 'Well done, little seed.\nGiỏi lắm, hạt giống nhỏ ơi.'),
]
with open(os.path.join(HERE, 'subtitles_en_vi.srt'), 'w', encoding='utf-8') as f:
    for i, (a, b, txt) in enumerate(cues, 1):
        f.write(f'{i}\n{srt_ts(a)} --> {srt_ts(b)}\n{txt}\n\n')

# ——— Diagnostics: RMS per layer, silence checks, voice-vs-bed separation, low-end balance ———
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
for name, x in [('music', mus), ('foley', buf), ('amb', amb), ('voice', vo), ('mix', mix)]:
    print(f'{name:6s} RMS {db(x):6.1f} dB  peak {20*np.log10(np.abs(x).max()+1e-12):6.1f}')

print('Silences check:')
for lbl, a, b in [('Silence #1 (before clink)', 19.30, 20.10), ('Silence #2 (before drop)', 28.40, 29.50)]:
    s, e = int(a * SR), int(b * SR)
    print(f'  {lbl:28s} mix RMS {db(mix[s:e]):6.1f} dB')

# Spectral low-end balance check (20-120 Hz vs rest)
mono = mix.mean(1)
spec = np.abs(np.fft.rfft(mono)) ** 2
freqs = np.fft.rfftfreq(len(mono), 1 / SR)
lo_e = spec[(freqs >= 20) & (freqs <= 120)].sum()
hi_e = spec[(freqs > 120) & (freqs <= 16000)].sum()
print(f'Low-end balance (20-120 Hz vs 120-16k Hz): {10*np.log10((lo_e + 1e-12)/(hi_e + 1e-12)):+.1f} dB')

print('Per-line Voice vs Bed:')
durs = json.load(open(os.path.join(HERE, 'voices', 'dur.json'), encoding='utf-8'))
for e in [x for x in EV if x['type'] == 'voice']:
    s = int(e['t'] * SR); L = int(durs[e['id']] * SR)
    bed = mus[s:s + L] * 0.78 + buf[s:s + L] * 0.76 + amb[s:s + L]
    print(f'  {e["id"]}  vo {db(vo[s:s+L]):6.1f}  bed {db(bed):6.1f}  diff {db(vo[s:s+L]) - db(bed):+5.1f} dB')
