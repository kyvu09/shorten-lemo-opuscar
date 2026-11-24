"""Data-driven foley, ambience, voice DSP, and stereo mix generator for Crayon Book Studio.
Usage: .venv/bin/python engine/mix_gen.py films/<slug>
Reads project.json + events.json + music/stems/*.wav + voices/*.wav -> writes out/mix.wav & subtitles_en_vi.srt.
"""
import os, sys, json, numpy as np, soundfile as sf, soxr
from scipy.ndimage import uniform_filter1d
from scipy.signal import fftconvolve, sosfilt as _sosfilt

if len(sys.argv) < 2:
    sys.exit('usage: mix_gen.py <project_dir>')

PROJ = os.path.abspath(sys.argv[1])
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))
from sfx import *

P = json.load(open(os.path.join(PROJ, 'project.json'), encoding='utf-8'))
ev_path = os.path.join(PROJ, 'events.json')
E = json.load(open(ev_path, encoding='utf-8')) if os.path.exists(ev_path) else {'dur': P['meta']['duration'], 'ev': []}
DUR = float(P.get('meta', {}).get('duration', E.get('dur', 30.0)))
EV = E.get('ev', [])
SILENCES = [(float(s['t0']), float(s['t1'])) for s in P.get('silences', [])]
GAINS = P.get('music', {}).get('gains', {})
N = int(round(DUR * SR))
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

def crayon(d, speed=1.0, v=1.0):
    n = nz(d)
    rate = max(4, int(SR / (70 + 90 * speed)))
    grain = uniform_filter1d((rng.random(len(n) // rate + 2) ** 3).repeat(rate)[:len(n)], rate // 3 + 1)
    x = bp(n, 1400 + 550 * speed, 6200, 2) * (0.35 + grain * 1.55) + bp(n, 320, 920, 1) * 0.16
    return fade(x * envelope(d, [(0, 0), (.08, 1), (.85, .9), (1, 0)]) * v * 0.24, .01, .04)

def scribble(d, rate=6.8, v=1.0):
    out = np.zeros(max(1, int(d * SR))); t = 0.0
    while t < d - 0.08:
        L = (1.0 / rate) * (0.8 + 0.4 * rng.random())
        s = crayon(min(L, d - t), 1.35, v * (0.72 + 0.28 * rng.random()))
        i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]; t += L
    return out

def write_fx(d, v=1.0):
    out = np.zeros(max(1, int(d * SR))); t = 0.0
    while t < d - 0.08:
        L = 0.065 + 0.095 * rng.random()
        s = crayon(L, 0.85, v); i = int(t * SR); out[i:i + len(s)] += s[:len(out) - i]; t += L + 0.03 * rng.random()
    return out

def boot_step(v=1.0, f=310):
    t = T(0.14)
    return fade((np.sin(2 * np.pi * (f * np.exp(-t * 8)) * t) * np.exp(-t / 0.032) * 0.45 + bp(nz(0.14), 900, 3200) * np.exp(-t / 0.025) * 0.25) * v * 0.65, .002, .03)

def idea_pop(v=1.0):
    t = T(0.16)
    return fade(np.sin(2 * np.pi * (680 + 950 * (1 - np.exp(-t / 0.025))) * t) * np.exp(-t / 0.045) * 0.30 * v, .002, .04)

def fabric_swish(d=0.45, v=1.0):
    n = nz(d); return lp(bp(n, 280, 2400), 2100) * (np.sin(np.linspace(0, np.pi, len(n))) ** 2) * 0.30 * v

def crayon_clink(v=1.0):
    t = T(0.20)
    wood = np.sin(2 * np.pi * 1120 * t) * np.exp(-t / 0.018) * 0.55 + np.sin(2 * np.pi * 2480 * t) * np.exp(-t / 0.010) * 0.35
    return fade((wood + bp(nz(0.20), 1800, 6000) * np.exp(-t / 0.008) * 0.22) * v * 0.85, .001, .03)

def cloud_puff(v=1.0):
    d = 0.42; return fade(lp(bp(nz(d), 220, 1400), 1100) * envelope(d, [(0, 0), (.18, 1), (.55, .60), (1, 0)]) * 0.30 * v, .02, .08)

def water_dip(v=1.0):
    t = T(0.26)
    x = np.sin(2 * np.pi * np.cumsum(760 + 1350 * np.exp(-t / 0.032)) / SR) * np.exp(-t / 0.055)
    return fade((x * 0.28 + bp(nz(0.26), 1800, 6500) * np.exp(-t / 0.022) * 0.09) * v)

def wet_brush(d, v=1.0):
    n = nz(d)
    wet = lp(n, 1750) * 0.52 + bp(n, 1750, 4600) * 0.18
    grain = uniform_filter1d(np.abs(rng.standard_normal(len(n))), 380) * 0.55 + 0.72
    return fade(wet * grain * envelope(d, [(0, 0), (.07, .9), (.35, 1), (.82, .85), (1, 0)]) * 0.25 * v, .03, .10)

def sprout_pop(v=1.0):
    t = T(0.32)
    f = 280 + 680 * (1 - np.exp(-t / 0.05))
    return fade((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.065) * 0.36 + bp(nz(0.32), 1400, 4800) * np.exp(-t / 0.022) * 0.16) * v, .002, .05)

def bloom_burst(v=1.0):
    d = 0.42; t = T(d)
    pop = np.sin(2 * np.pi * np.cumsum(360 + 820 * (1 - np.exp(-t / 0.04))) / SR) * np.exp(-t / 0.08) * 0.32
    return fade((pop + bp(nz(d), 1200, 5200) * envelope(d, [(0, 0), (.15, 1), (1, 0)]) * 0.22) * v, .004, .08)

def tape_crinkle(v=1.0):
    d = 0.45; n = nz(d)
    cr = (rng.random(len(n)) < 0.005) * rng.standard_normal(len(n)) * 2.2
    return fade((bp(n, 1200, 4800) * 0.14 + bp(cr, 2200, 7500) * 0.18) * envelope(d, [(0, 0), (.2, 1), (1, 0)]) * v)

def bush_rustle(d=1.35, v=1.0):
    n = nz(d)
    leaves = bp(n, 1400, 5600, 2) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 4.5 * T(d))))
    twig_t = T(d)
    snap = bp(nz(d), 750, 3200, 2) * np.exp(-np.abs(twig_t - d * 0.28) / 0.018) * 1.4
    return fade((leaves * 0.22 + snap * 0.34) * envelope(d, [(0, 0), (.12, 1), (.75, .8), (1, 0)]) * v, .02, .08)

def tummy_rumble(d=0.9, v=1.0):
    t = T(d)
    f = 108 - 28 * np.sin(np.pi * t / d) + 14 * np.sin(2 * np.pi * 6.5 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.55 + 0.45 * np.sin(2 * np.pi * 7.5 * t))
    return fade(lp(x, 380) * envelope(d, [(0, 0), (.15, 1), (.8, .85), (1, 0)]) * 0.30 * v, .03, .08)

def apple_crunch(v=1.0):
    d = 0.42; t = T(d); n = nz(d)
    b1 = np.exp(-np.abs(t - 0.08) / 0.028)
    b2 = np.exp(-np.abs(t - 0.24) / 0.032) * 0.85
    cr = (rng.random(len(n)) < 0.025) * rng.standard_normal(len(n)) * 1.8
    x = (bp(n, 1600, 6800, 2) * 0.30 + bp(cr, 2400, 8200, 2) * 0.28) * (b1 + b2)
    return fade(x * v, .005, .04)

def door_knock(v=1.0):
    d = 0.78; out = np.zeros(int(d * SR))
    for k, off in enumerate([0.04, 0.26, 0.48]):
        tk = T(0.14)
        wood = (np.sin(2 * np.pi * (240 * np.exp(-tk * 12)) * tk) * np.exp(-tk / 0.022) * 0.65
                + bp(nz(0.14), 420, 1450, 2) * np.exp(-tk / 0.015) * 0.32)
        i = int(off * SR); out[i:i + len(wood)] += wood[:len(out) - i] * (0.95 - k * 0.08)
    return fade(out * 0.75 * v, .002, .03)

def candle_blow(d=0.65, v=1.0):
    n = nz(d)
    return fade(lp(bp(n, 280, 2100, 2), 1800) * envelope(d, [(0, 0), (.18, 1), (.65, .7), (1, 0)]) * 0.34 * v, .02, .08)

def gift_unwrap(v=1.0):
    d = 0.55; n = nz(d)
    cr = (rng.random(len(n)) < 0.015) * rng.standard_normal(len(n)) * 2.0
    t = T(d)
    pop = np.sin(2 * np.pi * (520 + 780 * (1 - np.exp(-t / 0.03))) * t) * np.exp(-t / 0.05) * 0.24
    return fade((bp(n, 1500, 6200, 2) * 0.18 + bp(cr, 2200, 7800, 2) * 0.22 + pop) * envelope(d, [(0, 0), (.15, 1), (1, 0)]) * v, .005, .06)

buf = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(x, at, g=1.0, pan=0.0, b=None): add(buf if b is None else b, x.astype(np.float64), at, g, pan)

for e in EV:
    t, ty, pan = float(e.get('t', 0)), e.get('type'), float(e.get('pan', 0))
    if ty == 'scratch':    put(crayon(e.get('dur', 1.0), 1.1), t, 1.0, pan)
    elif ty == 'scribble': put(scribble(e.get('dur', 1.2)), t, 0.85, pan)
    elif ty == 'write':    put(write_fx(e.get('dur', 0.45)), t, 0.90, pan)
    elif ty == 'idea':     put(idea_pop(1.0), t, 0.95, pan)
    elif ty == 'swish':    put(fabric_swish(e.get('dur', 0.45)), t, 1.0, pan)
    elif ty == 'clink':    put(crayon_clink(1.0), t, 1.0, pan)
    elif ty == 'puff':     put(cloud_puff(1.0), max(0, t - 0.12), 1.0, pan)
    elif ty == 'dip':      put(water_dip(1.0), t, 1.0, pan)
    elif ty == 'sprout':   put(sprout_pop(1.0), t, 1.0, pan)
    elif ty == 'bloom':    put(bloom_burst(1.0), t, 1.0, pan)
    elif ty == 'hop':      put(boot_step(1.0, 290), t, 1.0, pan)
    elif ty == 'tape':     put(tape_crinkle(0.9), t, 0.9, pan)
    elif ty == 'rustle':   put(bush_rustle(e.get('dur', 1.35), 1.0), t, 1.0, pan)
    elif ty == 'rumble':   put(tummy_rumble(e.get('dur', 0.9), 1.0), t, 0.95, pan)
    elif ty == 'crunch':   put(apple_crunch(1.0), t, 1.0, pan)
    elif ty == 'knock':    put(door_knock(1.0), t, 1.0, pan)
    elif ty == 'blow':     put(candle_blow(e.get('dur', 0.65), 1.0), t, 1.0, pan)
    elif ty == 'gift_open':put(gift_unwrap(1.0), t, 1.0, pan)
    elif ty == 'brush':
        d = float(e.get('dur', 2.2)) + 0.22; x = wet_brush(d, 1.05)
        p0, p1 = (-0.80, 0.80) if e.get('dir', 1) > 0 else (0.80, -0.80)
        L = len(x); s = int(t * SR); pn = np.linspace(p0, p1, L)
        l, r = np.cos((pn + 1) * np.pi / 4) * 1.414, np.sin((pn + 1) * np.pi / 4) * 1.414
        e2 = min(N, s + L)
        if e2 > s:
            buf[s:e2, 0] += (x * l)[:e2 - s]; buf[s:e2, 1] += (x * r)[:e2 - s]

# Ambience (room air + soft rain wash if enabled, strictly muted during silences)
sil_amb = np.ones(N)
for t0, t1 in SILENCES:
    sil_amb *= np.maximum(np.clip((t0 - tt) / 0.08, 0.0, 1.0), np.clip((tt - t1) / 0.08, 0.0, 1.0))

air = lp(hp(nz(DUR), 400), 3400) * 0.0022
amb[:, 0] += air; amb[:, 1] += np.roll(air, 1700)
if P.get('palette', {}).get('washEnabled') and str(P.get('palette', {}).get('waxPreset', '')).startswith('rain'):
    ws = float(P['palette'].get('washStart', 30.0))
    rain_n = bp(nz(DUR), 900, 4800, 2) * 0.015
    rain_env = np.interp(tt, [max(0, ws - 0.4), ws + 0.6, ws + 9.5, ws + 11.8], [0.0, 1.0, 0.85, 0.0])
    amb[:, 0] += rain_n * rain_env; amb[:, 1] += np.roll(rain_n, 1300) * rain_env
amb *= sil_amb[:, None]

# Warm Voice DSP Chain
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
    eb = uniform_filter1d(np.abs(band), int(0.004 * SR)); ef = uniform_filter1d(np.abs(x), int(0.004 * SR))
    over = eb / (ef * thr_rel + 1e-9)
    g = uniform_filter1d(np.where(over > 1, np.maximum(over, 1e-6) ** (1 / ratio - 1), 1.0), int(0.003 * SR))
    return x - band + band * g

VO_RMS = 10 ** (-18.2 / 20) * float(GAINS.get('voice', 1.0))
vo = np.zeros((N, 2)); vmask = np.zeros(N); vo_count = 0
for s_item in P.get('subtitles', []):
    wp = os.path.join(PROJ, 'voices', f"{s_item['id']}.wav")
    if not os.path.exists(wp):
        continue
    a, sr = sf.read(wp)
    if a.ndim > 1: a = a.mean(1)
    if sr != SR: a = soxr.resample(a, sr, SR)
    a = hp(a, 75)
    a = compress(a / (np.abs(a).max() + 1e-9) * 0.8, thr=0.20, ratio=2.5, att=0.008, rel=0.14)
    a = biquad(a, 'low', 220, 1.5); a = biquad(a, 'peak', 3200, -2.0, 1.0); a = biquad(a, 'high', 6000, -4.0)
    a = deess(a)
    act = np.abs(a) > np.abs(a).max() * 0.05
    if act.any():
        a = a * VO_RMS / (np.sqrt(np.mean(a[act] ** 2)) + 1e-9)
    vt = float(s_item.get('vt', s_item.get('t0', 0)))
    add(vo, a, vt, 1.0, 0.0)
    s0 = max(0, int((vt - 0.18) * SR)); s1 = min(N, int(vt * SR) + len(a) + int(0.10 * SR))
    vmask[s0:s1] = 1.0
    vo_count += 1

if vo_count > 0:
    def warm_ir(seed):
        r = np.random.default_rng(seed); L = int(0.85 * SR); ir = np.zeros(L); pd = int(0.012 * SR)
        for ms, g in [(7, .5), (11, .38), (17, .3), (23, .22), (31, .16)]:
            ir[pd + int((ms + r.uniform(-1, 1)) * SR / 1000)] += g * r.choice([-1, 1])
        tt_ = np.arange(L - pd) / SR
        ir[pd:] += lp(r.standard_normal(L - pd) * np.exp(-tt_ / 0.10) * np.clip(tt_ / 0.02, 0, 1) * 0.35, 3200)
        return lp(ir, 4800)
    dry = vo.copy()
    for c in range(2):
        wet = fftconvolve(dry[:, c], warm_ir(41 + c), 'full')[:N]
        scale = (10 ** (-17.5 / 20)) * (np.sqrt(np.mean(dry[:, c] ** 2)) + 1e-12) / (np.sqrt(np.mean(wet ** 2)) + 1e-12)
        vo[:, c] += wet * scale

# Combine score stems using live GUI gain sliders
mus = np.zeros((N, 2))
defaults = {'ukulele': 0.92, 'marimba': 0.85, 'recorder': 0.95, 'bassoon': 0.78, 'glock': 1.25, 'perc': 0.72}
for k, dg in defaults.items():
    p = os.path.join(PROJ, 'music', 'stems', k + '.wav')
    if not os.path.exists(p): continue
    m, _ = sf.read(p)
    if m.ndim == 1: m = np.stack([m, m], 1)
    L = min(N, len(m))
    if k == 'glock':
        for c in range(2): m[:L, c] += bp(m[:L, c], 3200, 7200, 2) * 0.30
    mus[:L] += m[:L] * float(GAINS.get(k, dg))

duck = np.clip(uniform_filter1d(vmask, int(0.24 * SR)) * 1.65, 0.0, 1.0)
mus *= (1.0 - duck * (1.0 - 10 ** (-9.5 / 20)))[:, None] * sil_amb[:, None]
buf *= (1.0 - duck * (1.0 - 10 ** (-7.0 / 20)))[:, None] * sil_amb[:, None]

mix = mus * 0.78 + buf * float(GAINS.get('foley', 0.76)) + amb * 1.0 + vo * 1.0
for c in range(2):
    mix[:, c] = limit(mix[:, c], 0.94)

os.makedirs(os.path.join(PROJ, 'out'), exist_ok=True)
out_wav = os.path.join(PROJ, 'out', 'mix.wav')
sf.write(out_wav, mix.astype(np.float32), SR)

# Write bilingual SRT
def srt_ts(s):
    s = max(0.0, float(s)); h = int(s // 3600); m = int((s % 3600) // 60); sec = int(s % 60); ms = int(round((s - int(s)) * 1000))
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'

with open(os.path.join(PROJ, 'subtitles_en_vi.srt'), 'w', encoding='utf-8') as f:
    for i, s in enumerate(sorted(P.get('subtitles', []), key=lambda x: x.get('t0', 0)), 1):
        txt = f"{s.get('en','')}\n{s.get('vi','')}" if s.get('vi') else s.get('en', '')
        f.write(f"{i}\n{srt_ts(s.get('t0', 0))} --> {srt_ts(s.get('t1', 2))}\n{txt}\n\n")

def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f'mix_gen: {out_wav} | voices={vo_count} | mix RMS={db(mix):.1f} dB | peak={20*np.log10(np.abs(mix).max()+1e-12):.1f} dB')
