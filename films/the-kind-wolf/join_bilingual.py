"""Join EN (Kokoro) + 0.30s natural breath + VI (Edge-TTS) into unified bilingual WAVs in voices/."""
import json, os, sys
import numpy as np, soundfile as sf

ROOT = os.path.dirname(os.path.abspath(__file__))
EN_DIR = os.path.join(ROOT, 'voices_en')
VI_DIR = os.path.join(ROOT, 'voices_vi')
OUT_DIR = os.path.join(ROOT, 'voices')
os.makedirs(OUT_DIR, exist_ok=True)

TARGET_RMS = 10 ** (-18.5 / 20.0)
PAUSE_S = 0.30
SR = 24000


def norm_rms(a):
    rms = float(np.sqrt(np.mean(a * a))) + 1e-9
    g = TARGET_RMS / rms
    peak = float(np.abs(a).max()) + 1e-9
    g = min(g, 0.88 / peak)
    return (a * g).astype(np.float32)


def main():
    en_lines = json.load(open(os.path.join(ROOT, 'lines_en.json'), encoding='utf-8'))
    durs, bi_durs = {}, {}
    pause = np.zeros(int(PAUSE_S * SR), dtype=np.float32)

    for L in en_lines:
        lid = L['id']
        a_en, sr1 = sf.read(os.path.join(EN_DIR, f'{lid}.wav'), dtype='float32')
        a_vi, sr2 = sf.read(os.path.join(VI_DIR, f'{lid}.wav'), dtype='float32')
        if a_en.ndim > 1: a_en = a_en.mean(axis=1)
        if a_vi.ndim > 1: a_vi = a_vi.mean(axis=1)
        assert sr1 == SR and sr2 == SR, f'SR mismatch on {lid}: {sr1}, {sr2}'
        a_en = norm_rms(a_en)
        a_vi = norm_rms(a_vi)
        joined = np.concatenate([a_en, pause, a_vi])
        sf.write(os.path.join(OUT_DIR, f'{lid}.wav'), joined, SR)
        en_d = round(len(a_en) / SR, 3)
        vi_d = round(len(a_vi) / SR, 3)
        tot_d = round(len(joined) / SR, 3)
        durs[lid] = tot_d
        bi_durs[lid] = {'enDur': en_d, 'viDur': vi_d, 'pause': PAUSE_S, 'totalDur': tot_d}
        print(f'{lid}: EN {en_d:5.2f}s + 0.30s + VI {vi_d:5.2f}s = {tot_d:5.2f}s')

    json.dump(durs, open(os.path.join(OUT_DIR, 'dur.json'), 'w', encoding='utf-8'), indent=2)
    json.dump(bi_durs, open(os.path.join(OUT_DIR, 'bilingual_durs.json'), 'w', encoding='utf-8'), indent=2)
    print(f'Joined {len(durs)} bilingual clips -> {OUT_DIR}')


if __name__ == '__main__':
    main()
