"""edge-tts voice (Microsoft neural voices; first choice for Chinese, reads other languages too):
    python core/tts/tts_zh.py lines.json out_dir [--voice zh-CN-XiaoxiaoNeural] [--rate +0%] [--pitch +0Hz]
lines.json = [{"id":..., "text":..., "voice":"zh-CN-YunxiNeural", "rate":"+10%", "pitch":"-2Hz", "say":"..."}, ...]
  "say" (optional) = the text actually sent to be spoken, default "text" (for numbers and abbreviations written out as read; subtitles still use text).
  Also takes tts.py's "speed" (a multiplier, 1.1 → +10%). Voice list: python -m edge_tts --list-voices
Output is the same as tts.py: out_dir/<id>.wav (24 kHz mono, leading/trailing silence trimmed) and out_dir/dur.json.
  The mp3s are cached in out_dir/.cache/; unchanged text/voice/rate is not fetched again (written to .part, then renamed, so Ctrl-C never
  leaves half a file that the next run takes as good; a damaged mp3 in the cache is deleted and fetched again).

Needs the internet: this is Microsoft's online speech service, not a local model. Check Microsoft's terms yourself before using the voices commercially.
Exits with an error when the network is down or blocked (exit code 2; bad input or configuration is 1). Offline alternative: tts.py with
"lang":"cmn" (Kokoro, plain timbre; check it with asr_check.py).
"""
import sys, io, json, os, re, time, asyncio, hashlib, subprocess, argparse, urllib.request, urllib.parse
import numpy as np, soundfile as sf
SR = 24000

EMOJI_RE = re.compile(r'[\U0001F300-\U0001FAFF\U00002600-\U000027BF\uFE0F\u200D]+')


def clean_tts_text(txt):
    s = EMOJI_RE.sub('', str(txt or '')).strip()
    s = re.sub(r'\s+', ' ', s)
    return s


def rate_of(L, default):
    r = L.get('rate')
    if r is None and 'speed' in L: r = float(L['speed'])
    if isinstance(r, (int, float)): r = f'{round((float(r) - 1) * 100):+d}%'   # a number means a speed multiplier
    return r or default


def lang_of_voice(voice):
    v = str(voice or '').lower()
    if v.startswith('vi-'): return 'vi'
    if v.startswith('zh-tw'): return 'zh-TW'
    if v.startswith('zh-'): return 'zh-CN'
    if v.startswith('ja-'): return 'ja'
    if v.startswith('ko-'): return 'ko'
    if v.startswith('fr-'): return 'fr'
    if v.startswith('es-'): return 'es'
    if v.startswith('en-'): return 'en'
    return 'vi'


def chunk_text(text, max_len=175):
    text = text.strip()
    if len(text) <= max_len: return [text]
    out, cur = [], ''
    for tok in re.split(r'(?<=[.!?。,;])\s+', text):
        if len(cur) + len(tok) + 1 <= max_len:
            cur = (cur + ' ' + tok).strip()
        else:
            if cur: out.append(cur)
            if len(tok) <= max_len:
                cur = tok
            else:
                words, wcur = tok.split(' '), ''
                for w in words:
                    if len(wcur) + len(w) + 1 <= max_len:
                        wcur = (wcur + ' ' + w).strip()
                    else:
                        if wcur: out.append(wcur)
                        wcur = w
                cur = wcur
    if cur: out.append(cur)
    return out or [text[:max_len]]


def synth_google_tts(text, lang, path):
    """Reliable zero-key Google Translate TTS fallback when Microsoft Edge-TTS throttles or returns NoAudioReceived."""
    part = path + '.part'
    chunks = chunk_text(text)
    raw = bytearray()
    try:
        for ch in chunks:
            url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + urllib.parse.quote(lang) + '&q=' + urllib.parse.quote(ch)
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                if not data: raise OSError('Google TTS returned empty audio')
                raw.extend(data)
            if len(chunks) > 1: time.sleep(0.15)
        with open(part, 'wb') as f:
            f.write(raw)
        if os.path.getsize(part) == 0: raise OSError('Google TTS wrote empty file')
        os.replace(part, path)
    finally:
        if os.path.exists(part): os.remove(part)


async def synth(text, voice, rate, pitch, path):
    """Download to path via Edge-TTS: write path.part first and rename only on success."""
    import edge_tts
    part = path + '.part'
    last = None
    try:
        for attempt in range(2):   # 2 quick attempts before falling back cleanly to Google TTS
            try:
                if attempt > 0: await asyncio.sleep(0.9)
                await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(part)
                if os.path.getsize(part) == 0: raise OSError('the service returned an empty file')
                os.replace(part, path); await asyncio.sleep(0.35); return
            except Exception as e:
                last = e
        raise last
    finally:
        if os.path.exists(part): os.remove(part)   # clean up on failure and on Ctrl-C


def to_wav(mp3, pitch_mul=1.0, tempo_mul=1.0):
    """Decode to 24 kHz mono with optional gentle pitch/tempo nuance for fallback voices."""
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3]
    af = []
    if abs(pitch_mul - 1.0) > 1e-3:
        af.append(f'asetrate={SR}*{pitch_mul:.4f}')
        af.append(f'aresample={SR}')
        comp_tempo = max(0.75, min(1.35, tempo_mul / pitch_mul))
        if abs(comp_tempo - 1.0) > 1e-3:
            af.append(f'atempo={comp_tempo:.4f}')
    elif abs(tempo_mul - 1.0) > 1e-3:
        af.append(f'atempo={max(0.75, min(1.35, tempo_mul)):.4f}')
    if af:
        cmd += ['-af', ','.join(af)]
    cmd += ['-ar', str(SR), '-ac', '1', '-f', 'wav', '-']
    try:
        r = subprocess.run(cmd, capture_output=True, check=True)
    except FileNotFoundError: sys.exit('tts_zh.py: ffmpeg is needed to decode the audio (install it and make sure it is on PATH)')
    except subprocess.CalledProcessError: return None
    try: a, sr = sf.read(io.BytesIO(r.stdout), dtype='float32')
    except Exception: return None
    return (a, sr) if len(a) else None


def plausible(decoded):
    """A cached mp3 must decode to something like a sentence: at least 0.15 s and not silent."""
    if decoded is None: return False
    a, sr = decoded; return len(a) >= 0.15 * sr and float(np.abs(a).max()) > 1e-3


def fallback_audio_tweaks(voice, rate_str, pitch_str):
    """Gentle pitch/speed nuance when Google TTS substitutes for a male/child Edge-TTS voice."""
    v = str(voice or '').lower()
    pitch_mul = 1.0
    if any(k in v for k in ('namminh', 'yunxi', 'guy', 'michael', 'adam')):
        pitch_mul = 0.91
    else:
        m = re.match(r'^([+-]?\d+)Hz$', str(pitch_str or '+0Hz'))
        hz = int(m.group(1)) if m else 0
        if hz >= 3: pitch_mul = 1.04
        elif hz <= -3: pitch_mul = 0.95
    mr = re.match(r'^([+-]?\d+)%$', str(rate_str or '+0%'))
    pct = int(mr.group(1)) if mr else 0
    tempo_mul = max(0.88, min(1.14, 1.0 + pct / 100.0))
    return pitch_mul, tempo_mul


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('lines'); ap.add_argument('out_dir')
    ap.add_argument('--voice', default='zh-CN-XiaoxiaoNeural'); ap.add_argument('--rate', default='+0%'); ap.add_argument('--pitch', default='+0Hz')
    a = ap.parse_args()
    lines = json.load(open(a.lines, encoding='utf-8'))
    for L in lines:
        r, p = rate_of(L, a.rate), L.get('pitch', a.pitch)
        if not re.fullmatch(r'[+-]\d+%', r): sys.exit(f"tts_zh.py: line '{L['id']}': rate must look like '+10%' or '-5%' (or a speed number like 1.1), got {r!r}")
        if not re.fullmatch(r'[+-]\d+Hz', p): sys.exit(f"tts_zh.py: line '{L['id']}': pitch must look like '-2Hz' or '+0Hz', got {p!r}")
    has_edge = True
    try: import edge_tts  # noqa: F401
    except ImportError: has_edge = False
    cache_dir = os.path.join(a.out_dir, '.cache')
    os.makedirs(cache_dir, exist_ok=True); dur = {}
    for n in os.listdir(cache_dir):
        if n.endswith('.part'): os.remove(os.path.join(cache_dir, n))   # partial file left by an interrupted previous run

    edge_fail_streak = 0
    for L in lines:
        voice, rate, pitch = L.get('voice', a.voice), rate_of(L, a.rate), L.get('pitch', a.pitch)
        raw_say = L.get('say', L['text'])
        say = clean_tts_text(raw_say)
        if not say or not re.search(r'[\w\u00C0-\u1EF9\u4E00-\u9FFF]', say):
            # Non-speakable line (punctuation/emoji only) -> short gentle 0.25s silence instead of crashing!
            y = np.zeros(int(0.25 * SR), dtype=np.float32)
            sf.write(os.path.join(a.out_dir, f"{L['id']}.wav"), y, SR); dur[L['id']] = 0.25
            print(L['id'], 0.25, '(silence)', flush=True)
            continue

        key_edge = hashlib.sha1(json.dumps([voice, rate, pitch, say], ensure_ascii=False).encode('utf-8')).hexdigest()[:16]
        mp3_edge = os.path.join(cache_dir, key_edge + '.mp3')
        lang = lang_of_voice(voice)
        key_gtts = hashlib.sha1(json.dumps(['gtts', lang, say], ensure_ascii=False).encode('utf-8')).hexdigest()[:16]
        mp3_gtts = os.path.join(cache_dir, key_gtts + '.mp3')

        decoded = None
        used_fallback = False
        if os.path.exists(mp3_edge):
            decoded = to_wav(mp3_edge)
            if not plausible(decoded):
                decoded = None
                os.remove(mp3_edge)

        # Tier 1: Try Microsoft Edge-TTS unless it already throttled 2 lines in a row this run
        if decoded is None and has_edge and edge_fail_streak < 2:
            try:
                asyncio.run(synth(say, voice, rate, pitch, mp3_edge))
                decoded = to_wav(mp3_edge)
                if plausible(decoded):
                    edge_fail_streak = 0
                else:
                    decoded = None
                    if os.path.exists(mp3_edge): os.remove(mp3_edge)
                    edge_fail_streak += 1
            except Exception as e:
                edge_fail_streak += 1
                print(f"tts_zh.py: Edge-TTS unavailable for '{L['id']}' ({type(e).__name__}); switching seamlessly to Google TTS ({lang})...", flush=True)

        # Tier 2: Seamless Google TTS fallback (with gentle voice pitch/rate nuance!)
        if decoded is None:
            used_fallback = True
            pm, tm = fallback_audio_tweaks(voice, rate, pitch)
            if os.path.exists(mp3_gtts):
                decoded = to_wav(mp3_gtts, pitch_mul=pm, tempo_mul=tm)
                if not plausible(decoded):
                    decoded = None
                    os.remove(mp3_gtts)
            if decoded is None:
                try:
                    synth_google_tts(say, lang, mp3_gtts)
                    decoded = to_wav(mp3_gtts, pitch_mul=pm, tempo_mul=tm)
                except Exception as ge:
                    print(f"tts_zh.py: both Edge-TTS and Google TTS failed for line '{L['id']}': {type(ge).__name__}: {str(ge)[:180]}", file=sys.stderr)
                    sys.exit(2)
            if not plausible(decoded):
                sys.exit(f"tts_zh.py: decoded audio for line '{L['id']}' was empty or unreadable")

        y, sr = decoded
        nz = np.where(np.abs(y) > (np.abs(y).max() if len(y) else 0) * .02)[0]
        if len(nz): y = y[max(0, nz[0] - int(.03 * sr)): nz[-1] + int(.10 * sr)]
        else: print('warning: line', L['id'], 'is silent', file=sys.stderr)
        sf.write(os.path.join(a.out_dir, f"{L['id']}.wav"), y, sr); dur[L['id']] = round(len(y) / sr, 3)
        tag = ' [Google TTS]' if used_fallback else ''
        print(f"{L['id']} {dur[L['id']]} {L['text']}{tag}", flush=True)
    json.dump(dur, open(os.path.join(a.out_dir, 'dur.json'), 'w', encoding='utf-8'), indent=1)


if __name__ == '__main__':
    main()
