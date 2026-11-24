"""Unified TTS runner for Crayon Book Studio Auto-Director.
Usage: .venv/Scripts/python.exe engine/bilingual_tts.py films/<slug> [--mode bilingual|en|vi]
Synthesizes EN (Kokoro offline), VI (Edge-TTS online), or joined RMS-balanced EN -> 0.30s -> VI clips into voices/,
writing voices/dur.json and voices/bilingual_durs.json.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np, soundfile as sf

LIB = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PY = sys.executable
SR = 24000
PAUSE_S = 0.30
TARGET_RMS = 10 ** (-18.5 / 20.0)
EMOJI_RE = re.compile(r'[\U0001F300-\U0001FAFF\U00002600-\U000027BF\uFE0F\u200D]+')


def clean_speech(txt):
    return re.sub(r'\s+', ' ', EMOJI_RE.sub('', str(txt or ''))).strip()


def norm_rms(a):
    rms = float(np.sqrt(np.mean(a * a))) + 1e-9
    g = TARGET_RMS / rms
    peak = float(np.abs(a).max()) + 1e-9
    g = min(g, 0.88 / peak)
    return (a * g).astype(np.float32)


def run_cmd(args):
    r = subprocess.run(args, cwd=LIB)
    if r.returncode != 0:
        sys.exit(r.returncode)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('proj_dir')
    ap.add_argument('--mode', default='', choices=['', 'bilingual', 'en', 'vi'])
    a = ap.parse_args()

    proj = os.path.abspath(a.proj_dir)
    P = json.load(open(os.path.join(proj, 'project.json'), encoding='utf-8'))
    subs = P.get('subtitles', [])
    if not subs:
        sys.exit('bilingual_tts.py: project has no subtitles')

    mode = a.mode or P.get('meta', {}).get('narrationMode', 'bilingual')
    voices_dir = os.path.join(proj, 'voices')
    en_dir = os.path.join(proj, 'voices_en')
    vi_dir = os.path.join(proj, 'voices_vi')
    os.makedirs(voices_dir, exist_ok=True)

    en_lines = []
    vi_lines = []
    vi_ids = set()
    for s in subs:
        lid = s['id']
        en_txt = clean_speech(s.get('sayEn') or s.get('en') or '')
        vi_raw = clean_speech(s.get('sayVi') or s.get('vi') or '')
        en_voice = s.get('voice') if str(s.get('voice', '')).startswith(('af_', 'am_', 'bf_', 'bm_')) else 'af_heart'
        en_lang = s.get('enLang') or ('en-gb' if en_voice.startswith(('bf_', 'bm_')) else 'en-us')
        en_lines.append({
            'id': lid, 'text': en_txt or 'Hello.', 'voice': en_voice,
            'speed': float(s.get('speed', 0.88)), 'lang': en_lang
        })
        # In bilingual mode, only synthesize Vietnamese clips for lines that actually have Vietnamese text!
        if mode == 'vi' or vi_raw:
            vi_say = vi_raw or en_txt or 'Xin chào.'
            vi_ids.add(lid)
            vi_lines.append({
                'id': lid, 'text': clean_speech(s.get('vi') or s.get('en') or 'Xin chào.'), 'say': vi_say,
                'voice': s.get('viVoice') or 'vi-VN-HoaiMyNeural',
                'rate': s.get('viRate') or '+0%', 'pitch': s.get('viPitch') or '+0Hz'
            })

    en_json = os.path.join(proj, 'lines_en.json')
    vi_json = os.path.join(proj, 'lines_vi.json')
    json.dump(en_lines, open(en_json, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(vi_lines, open(vi_json, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    if mode in ('bilingual', 'en'):
        print(f'[TTS] Synthesizing {len(en_lines)} English clips (Kokoro offline)...', flush=True)
        run_cmd([PY, os.path.join(LIB, 'core', 'tts', 'tts.py'), en_json, en_dir if mode == 'bilingual' else voices_dir])

    if mode in ('bilingual', 'vi') and vi_lines:
        print(f'[TTS] Synthesizing {len(vi_lines)} Vietnamese clips (Edge-TTS + Google fallback)...', flush=True)
        run_cmd([PY, os.path.join(LIB, 'core', 'tts', 'tts_zh.py'), vi_json, vi_dir if mode == 'bilingual' else voices_dir])

    durs, bi_durs = {}, {}
    pause = np.zeros(int(PAUSE_S * SR), dtype=np.float32)

    for s in subs:
        lid = s['id']
        if mode == 'bilingual':
            a_en, sr1 = sf.read(os.path.join(en_dir, f'{lid}.wav'), dtype='float32')
            if a_en.ndim > 1: a_en = a_en.mean(axis=1)
            a_en = norm_rms(a_en)
            has_vi = lid in vi_ids and os.path.exists(os.path.join(vi_dir, f'{lid}.wav'))
            if has_vi:
                a_vi, sr2 = sf.read(os.path.join(vi_dir, f'{lid}.wav'), dtype='float32')
                if a_vi.ndim > 1: a_vi = a_vi.mean(axis=1)
                a_vi = norm_rms(a_vi)
                joined = np.concatenate([a_en, pause, a_vi])
                vi_d = round(len(a_vi) / SR, 3)
            else:
                joined = a_en
                vi_d = 0.0
            sf.write(os.path.join(voices_dir, f'{lid}.wav'), joined, SR)
            en_d = round(len(a_en) / SR, 3)
            tot_d = round(len(joined) / SR, 3)
            durs[lid] = tot_d
            bi_durs[lid] = {'enDur': en_d, 'viDur': vi_d, 'pause': PAUSE_S if has_vi else 0.0, 'totalDur': tot_d}
        else:
            a_one, sr1 = sf.read(os.path.join(voices_dir, f'{lid}.wav'), dtype='float32')
            if a_one.ndim > 1: a_one = a_one.mean(axis=1)
            tot_d = round(len(a_one) / sr1, 3)
            durs[lid] = tot_d
            bi_durs[lid] = {'enDur': tot_d if mode == 'en' else 0.0, 'viDur': tot_d if mode == 'vi' else 0.0, 'pause': 0.0, 'totalDur': tot_d}

    json.dump(durs, open(os.path.join(voices_dir, 'dur.json'), 'w', encoding='utf-8'), indent=2)
    json.dump(bi_durs, open(os.path.join(voices_dir, 'bilingual_durs.json'), 'w', encoding='utf-8'), indent=2)
    print(f'[TTS] Ready: {len(durs)} clips ({mode}) -> {voices_dir}', flush=True)


if __name__ == '__main__':
    main()
