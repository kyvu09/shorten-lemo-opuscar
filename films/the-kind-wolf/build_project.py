"""Build the complete choreographed films/the-kind-wolf/project.json, lines.json, subtitles_en_vi.srt, CREDITS, and build.sh
using measured bilingual EN+VI voice durations from voices/bilingual_durs.json."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
en_lines = json.load(open(os.path.join(ROOT, 'lines_en.json'), encoding='utf-8'))
vi_lines = json.load(open(os.path.join(ROOT, 'lines_vi.json'), encoding='utf-8'))
bi_durs  = json.load(open(os.path.join(ROOT, 'voices', 'bilingual_durs.json'), encoding='utf-8'))

vi_map = {x['id']: x for x in vi_lines}

# Display text overrides (keeps exact user story punctuation/emoji while TTS spoke cleanly!)
DISPLAY_EN = {
    'l12': "Please don't eat us!",
    'l13': "Hahaha! Don't be afraid. I am not going to hurt you.",
    'l27': "THE END! ❤️",
}
KEYWORDS = {
    'l01': ('forest', '#5a9c46'),
    'l02': ('morning', '#d98a16'),
    'l03': ('going', '#4a8ec2'),
    'l04': ('river', '#4a8ec2'),
    'l05': ('together', '#5a9c46'),
    'l06': ('sound', '#d94436'),
    'l07': ('sound', '#d94436'),
    'l08': ('scared', '#6b7ca8'),
    'l09': ('wolf', '#6b7ca8'),
    'l10': ('friends', '#5a9c46'),
    'l11': ('wolf', '#d94436'),
    'l12': ('eat', '#d94436'),
    'l13': ('afraid', '#5a9c46'),
    'l14': ('sad', '#6b7ca8'),
    'l15': ('sad', '#6b7ca8'),
    'l16': ('hungry', '#c88a3b'),
    'l17': ('apples', '#d94436'),
    'l18': ('Thank', '#5a9c46'),
    'l19': ('Here', '#d98a16'),
    'l20': ('delicious', '#d94436'),
    'l21': ('together', '#d94436'),
    'l22': ('friend', '#d94436'),
    'l23': ('love', '#d94436'),
    'l24': ('friend', '#d94436'),
    'l25': ('kind', '#5a9c46'),
    'l26': ('Friends', '#d94436'),
    'l27': ('END', '#d94436'),
}

# Breath gaps BEFORE each line (generous pauses for Act transitions & 2 silence beats!)
PRE_GAP = {
    'l01': 2.00,   # Opening forest view & book title
    'l06': 2.65,   # Walk to central oak + SILENCE BEAT #1 (1.25s) + rustle!
    'l09': 1.10,   # Dramatic pause before Wolf steps out
    'l14': 1.85,   # SILENCE BEAT #2 (1.15s) as Wolf's ears droop sadly
    'l20': 0.90,   # Crunch beat before "Yummy!"
    'l21': 1.65,   # Pan & transition to big apple tree picnic + start friendship wash
    'l27': 1.35,   # Begin fridge pull-out before "THE END!"
}

subtitles = []
T = {}  # id -> dict(vt, end, t0, t1, enDur, dur)
cur = 0.0
for L in en_lines:
    lid = L['id']
    d = bi_durs[lid]
    gap = PRE_GAP.get(lid, 0.72)
    vt = round(cur + gap, 2)
    tot = d['totalDur']
    en_d = d['enDur']
    t0 = round(max(0.0, vt - 0.14), 2)
    t1 = round(vt + tot + 0.42, 2)
    key, hi_col = KEYWORDS.get(lid, ('', '#472e1e'))
    subtitles.append({
        'id': lid,
        'vt': vt,
        'dur': tot,
        'enDur': en_d,
        't0': t0,
        't1': t1,
        'en': DISPLAY_EN.get(lid, L['text']),
        'vi': vi_map[lid]['text'],
        'key': key,
        'hiCol': hi_col,
        'engine': 'kokoro',
        'voice': L['voice'],
        'speed': L['speed'],
    })
    T[lid] = {'vt': vt, 'end': round(vt + tot, 2), 't0': t0, 't1': t1, 'enDur': en_d, 'dur': tot}
    cur = vt + tot

# Exact silence beats (zero music, zero voice, calm boil!)
sil1_t0 = round(T['l05']['end'] + 0.95, 2)
sil1_t1 = round(sil1_t0 + 1.25, 2)
sil2_t0 = round(T['l13']['end'] + 0.40, 2)
sil2_t1 = round(sil2_t0 + 1.15, 2)

wash_start = round(T['l21']['vt'] + 0.40, 2)
fridge_start = round(T['l26']['end'] + 0.75, 2)
fridge_end = round(fridge_start + 3.40, 2)
total_dur = round(max(T['l27']['t1'] + 1.85, fridge_end + 1.50), 1)

# Print beat schedule for director sanity check
print(f"Total duration: {total_dur:.1f}s | Silence #1: {sil1_t0}-{sil1_t1}s | Silence #2: {sil2_t0}-{sil2_t1}s | Wash: {wash_start}s | Fridge: {fridge_start}-{fridge_end}s")

camera = [
    # Act 1: Sunny morning forest path (Dog meets Cat)
    {'t': 0.00,                      'x': 740,  'y': 950,  's': 0.88},
    {'t': round(T['l01']['vt'], 2),  'x': 760,  'y': 955,  's': 0.88},
    {'t': round(T['l02']['vt'], 2),  'x': 820,  'y': 1020, 's': 1.02},
    {'t': round(T['l05']['end'], 2), 'x': 860,  'y': 1020, 's': 1.00},
    # Walk right to Central Oak Clearing (cleanly clears left title & FOREST tag!)
    {'t': round(sil1_t0 + 0.2, 2),   'x': 1490, 'y': 1005, 's': 0.98},
    {'t': round(T['l08']['end'], 2), 'x': 1500, 'y': 1005, 's': 0.98},
    # Wolf emerges from behind the big oak!
    {'t': round(T['l09']['vt'] + 1.5, 2), 'x': 1545, 'y': 995,  's': 0.96},
    {'t': round(T['l13']['end'], 2),      'x': 1545, 'y': 995,  's': 0.96},
    # Gentle empathetic push-in on Wolf looking sad & hungry
    {'t': round(T['l14']['vt'], 2),       'x': 1580, 'y': 1030, 's': 1.02},
    {'t': round(T['l16']['end'], 2),      'x': 1580, 'y': 1030, 's': 1.02},
    # Pull slightly back for offering & crunching the red apple
    {'t': round(T['l17']['vt'], 2),       'x': 1545, 'y': 1005, 's': 0.96},
    {'t': round(T['l20']['end'], 2),      'x': 1560, 'y': 1005, 's': 0.96},
    # Act 3: Glide to Big Apple Tree Picnic & Blue River + Warm Rose Wash!
    {'t': round(T['l21']['vt'], 2),       'x': 2300, 'y': 965,  's': 0.76},
    {'t': round(T['l23']['end'], 2),      'x': 2300, 'y': 965,  's': 0.76},
    # Celebration cheer & wide friendship tableau
    {'t': round(T['l24']['vt'], 2),       'x': 2280, 'y': 970,  's': 0.80},
    {'t': round(T['l26']['end'], 2),      'x': 2280, 'y': 970,  's': 0.80},
    # Grand full-forest ending panorama (shows the ENTIRE finished storybook page!)
    {'t': round(fridge_start, 2),         'x': 1600, 'y': 900,  's': 0.60},
    {'t': total_dur,                      'x': 1600, 'y': 900,  's': 0.60},
]

entities = [
    {'id': 'sun', 'type': 'sun', 'x': 2560, 'y': 295, 'scale': 0.94, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [{'t': 0.0, 'mood': 'warm'}]},
    {'id': 'bg_tree_l', 'type': 'tree', 'x': 210, 'y': 1110, 'scale': 1.08, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [{'t': 0.0, 'mood': 'plain'}]},
    {'id': 'big_oak_mid', 'type': 'big_tree', 'x': 1765, 'y': 1160, 'scale': 1.04, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'mood': 'plain'},
         {'t': round(sil1_t1 + 0.05, 2), 'mood': 'rustle'},
         {'t': round(T['l09']['vt'] - 0.1, 2), 'mood': 'plain'},
     ]},
    {'id': 'bush_mid', 'type': 'bush', 'x': 1595, 'y': 1170, 'scale': 0.92, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'mood': 'idle'},
         {'t': round(sil1_t1 + 0.05, 2), 'mood': 'rustle'},
         {'t': round(T['l09']['vt'] - 0.1, 2), 'mood': 'idle'},
     ]},
    {'id': 'picnic_tree', 'type': 'big_tree', 'x': 2390, 'y': 1168, 'scale': 1.16, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [{'t': 0.0, 'mood': 'apples'}]},
    {'id': 'bird', 'type': 'bird', 'x': 2155, 'y': 730, 'scale': 0.90, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'mood': 'perch'},
         {'t': round(T['l24']['vt'], 2), 'mood': 'fly'},
         {'t': round(T['l26']['vt'], 2), 'mood': 'perch'},
     ]},
    {'id': 'basket', 'type': 'apple_basket', 'x': 2260, 'y': 1285, 'scale': 0.96, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'mood': 'full'},
         {'t': round(T['l21']['vt'], 2), 'mood': 'half'},
     ]},
    # 🐶 LITTLE DOG
    {'id': 'dog', 'type': 'little_dog', 'x': 440, 'y': 1260, 'scale': 1.02, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'x': 440, 'y': 1260, 'view': 'r34', 'expr': 'happy', 'pose': 'walk'},
         {'t': round(T['l01']['vt'] + 0.2, 2), 'x': 710, 'y': 1260, 'moveDur': 4.4, 'view': 'r34', 'expr': 'happy', 'pose': 'walk'},
         {'t': round(T['l01']['vt'] + 4.8, 2), 'view': 'r34', 'expr': 'happy', 'pose': 'stand'},
         {'t': round(T['l02']['vt'], 2), 'view': 'r34', 'expr': 'excited', 'pose': 'wave'},
         {'t': round(T['l03']['vt'], 2), 'view': 'r34', 'expr': 'happy', 'pose': 'stand'},
         {'t': round(T['l04']['vt'], 2), 'view': 'r34', 'expr': 'happy', 'pose': 'wave'},
         {'t': round(T['l05']['vt'], 2), 'view': 'r34', 'expr': 'excited', 'pose': 'cheer'},
         # Walk together toward big oak
         {'t': round(T['l05']['end'] + 0.1, 2), 'x': 1125, 'y': 1260, 'moveDur': 1.9, 'view': 'r34', 'expr': 'happy', 'pose': 'walk'},
         {'t': round(sil1_t1, 2), 'view': 'r34', 'expr': 'scared', 'pose': 'scared'},
         {'t': round(T['l09']['vt'], 2), 'view': 'r34', 'expr': 'scared', 'pose': 'scared'},
         {'t': round(T['l13']['vt'] + 1.8, 2), 'view': 'r34', 'expr': 'curious', 'pose': 'stand'},
         {'t': round(T['l15']['vt'], 2), 'view': 'r34', 'expr': 'kind', 'pose': 'stand'},
         {'t': round(T['l17']['vt'], 2), 'view': 'r34', 'expr': 'happy', 'pose': 'stand'},
         {'t': round(T['l19']['vt'] - 0.1, 2), 'x': 1155, 'y': 1260, 'moveDur': 0.5, 'view': 'r34', 'expr': 'kind', 'pose': 'offer_apple'},
         {'t': round(T['l20']['vt'] + 0.2, 2), 'view': 'r34', 'expr': 'happy', 'pose': 'stand'},
         # Picnic under big apple tree
         {'t': round(T['l21']['vt'] - 0.5, 2), 'x': 2075, 'y': 1280, 'moveDur': 1.2, 'view': 'r34', 'expr': 'yummy', 'pose': 'sit_eat'},
         {'t': round(T['l24']['vt'], 2), 'x': 2075, 'y': 1265, 'view': 'front', 'expr': 'excited', 'pose': 'cheer'},
         {'t': round(T['l26']['end'], 2), 'view': 'r34', 'expr': 'happy', 'pose': 'wave'},
     ]},
    # 🐱 TABBY CAT
    {'id': 'cat', 'type': 'tabby_cat', 'x': 985, 'y': 1260, 'scale': 1.00, 'tStart': 0.0, 'drawDur': 0.0,
     'states': [
         {'t': 0.0, 'x': 985, 'y': 1260, 'view': 'l34', 'expr': 'happy', 'pose': 'stand'},
         {'t': round(T['l02']['vt'] + 0.4, 2), 'view': 'l34', 'expr': 'happy', 'pose': 'stand'},
         {'t': round(T['l03']['vt'], 2), 'view': 'l34', 'expr': 'happy', 'pose': 'wave'},
         {'t': round(T['l04']['vt'], 2), 'view': 'l34', 'expr': 'curious', 'pose': 'stand'},
         {'t': round(T['l05']['vt'], 2), 'view': 'l34', 'expr': 'excited', 'pose': 'cheer'},
         # Walk together toward big oak
         {'t': round(T['l05']['end'] + 0.1, 2), 'x': 1360, 'y': 1260, 'moveDur': 1.9, 'view': 'r34', 'expr': 'happy', 'pose': 'walk'},
         {'t': round(sil1_t1, 2), 'view': 'r34', 'expr': 'scared', 'pose': 'scared'},
         {'t': round(T['l13']['vt'] + 1.8, 2), 'view': 'r34', 'expr': 'curious', 'pose': 'stand'},
         {'t': round(T['l14']['vt'], 2), 'view': 'r34', 'expr': 'kind', 'pose': 'stand'},
         {'t': round(T['l17']['vt'] - 0.1, 2), 'view': 'r34', 'expr': 'kind', 'pose': 'offer_apple'},
         {'t': round(T['l19']['vt'], 2), 'view': 'r34', 'expr': 'happy', 'pose': 'stand'},
         # Picnic under big apple tree
         {'t': round(T['l21']['vt'] - 0.5, 2), 'x': 2410, 'y': 1280, 'moveDur': 1.2, 'view': 'r34', 'expr': 'happy', 'pose': 'sit_eat'},
         {'t': round(T['l22']['vt'], 2), 'view': 'r34', 'expr': 'kind', 'pose': 'sit_eat'},
         {'t': round(T['l24']['vt'], 2), 'x': 2410, 'y': 1265, 'view': 'front', 'expr': 'excited', 'pose': 'cheer'},
         {'t': round(T['l26']['vt'], 2), 'view': 'front', 'expr': 'excited', 'pose': 'cheer'},
     ]},
    # 🐺 GRAY WOLF
    {'id': 'wolf', 'type': 'gray_wolf', 'x': 1785, 'y': 1225, 'scale': 1.00, 'tStart': round(T['l09']['vt'] - 0.35, 2), 'drawDur': 0.55,
     'states': [
         {'t': 0.0, 'x': 1785, 'y': 1225, 'view': 'l34', 'expr': 'mysterious', 'pose': 'peek', 'layer': 'back'},
         {'t': round(T['l09']['vt'] + 0.65, 2), 'x': 1685, 'y': 1255, 'moveDur': 1.6, 'view': 'l34', 'expr': 'mysterious', 'pose': 'walk', 'layer': 'front'},
         {'t': round(T['l10']['vt'] - 0.1, 2), 'view': 'l34', 'expr': 'friendly', 'pose': 'wave', 'layer': 'front'},
         {'t': round(T['l11']['vt'], 2), 'view': 'l34', 'expr': 'surprised', 'pose': 'stand', 'layer': 'front'},
         {'t': round(T['l13']['vt'], 2), 'view': 'l34', 'expr': 'laugh', 'pose': 'laugh', 'layer': 'front'},
         {'t': round(sil2_t1 + 0.02, 2), 'view': 'l34', 'expr': 'sad', 'pose': 'sad_hungry', 'layer': 'front'},
         {'t': round(T['l17']['vt'] + 0.8, 2), 'view': 'l34', 'expr': 'surprised', 'pose': 'stand', 'layer': 'front'},
         {'t': round(T['l18']['vt'], 2), 'view': 'l34', 'expr': 'surprised', 'pose': 'wave', 'layer': 'front'},
         {'t': round(T['l20']['vt'] - 0.45, 2), 'view': 'l34', 'expr': 'yummy', 'pose': 'eat_apple', 'layer': 'front'},
         # Picnic under big apple tree
         {'t': round(T['l21']['vt'] - 0.5, 2), 'x': 2640, 'y': 1275, 'moveDur': 1.2, 'view': 'l34', 'expr': 'yummy', 'pose': 'sit_eat', 'layer': 'front'},
         {'t': round(T['l23']['vt'], 2), 'view': 'l34', 'expr': 'happy', 'pose': 'sit_eat', 'layer': 'front'},
         {'t': round(T['l24']['vt'], 2), 'x': 2640, 'y': 1260, 'view': 'front', 'expr': 'happy', 'pose': 'cheer', 'layer': 'front'},
         {'t': round(T['l25']['vt'], 2), 'view': 'l34', 'expr': 'happy', 'pose': 'wave', 'layer': 'front'},
         {'t': round(T['l26']['vt'], 2), 'view': 'front', 'expr': 'happy', 'pose': 'cheer', 'layer': 'front'},
     ]},
]

tags = [
    {'id': 'tag_forest',  't': round(T['l01']['vt'] + 2.2, 2), 'x': 240,  'y': 785,  'en': 'FOREST',  'vi': 'khu rừng', 'col': '#5a9c46'},
    {'id': 'tag_wolf',    't': round(T['l09']['vt'] + 1.4, 2), 'x': 1715, 'y': 765,  'en': 'WOLF',    'vi': 'bác sói',  'col': '#6b7ca8'},
    {'id': 'tag_hungry',  't': round(T['l16']['vt'] + 0.5, 2), 'x': 1915, 'y': 950,  'en': 'HUNGRY',  'vi': 'đói bụng', 'col': '#c88a3b'},
    {'id': 'tag_apple',   't': round(T['l17']['vt'] + 1.1, 2), 'x': 1420, 'y': 865,  'en': 'APPLE',   'vi': 'quả táo',  'col': '#d94436'},
    {'id': 'tag_river',   't': round(T['l21']['vt'] + 1.6, 2), 'x': 2875, 'y': 985,  'en': 'RIVER',   'vi': 'dòng sông','col': '#4a8ec2'},
    {'id': 'tag_friends', 't': round(T['l22']['vt'] + 0.8, 2), 'x': 2390, 'y': 755,  'en': 'FRIENDS', 'vi': 'bạn bè',   'col': '#d94436'},
]

project = {
    'version': 1,
    'meta': {
        'slug': 'the-kind-wolf',
        'title': 'The Kind Wolf',
        'titleVi': 'Bác Sói Tốt Bụng',
        'titlePos': {'x': 265, 'y': 500, 't': 0.55},
        'duration': total_dur,
        'fps': 24,
        'aspect': '16:9',
    },
    'palette': {
        'paper': '#f4efe3',
        'crayons': {
            'ink': '#472e1e',
            'ochre': '#c88a3b',
            'yellow': '#f2be2c',
            'red': '#d94436',
            'pink': '#e8877d',
            'green': '#5a9c46',
            'sky': '#5da7d6',
            'rain': '#7a8799',
            'peach': '#f5cca7',
            'white': '#fbfaf4',
        },
        'washColor': '#d47c85',
        'washEnabled': True,
        'washStart': wash_start,
        'waxPreset': 'friendship-hearts',
    },
    'world': {
        'preset': 'forest-clearing',
        'horizonY': 1090,
    },
    'camera': camera,
    'entities': entities,
    'tags': tags,
    'subtitles': subtitles,
    'silences': [
        {'id': 'sil_sound',  't0': sil1_t0, 't1': sil1_t1},
        {'id': 'sil_hungry', 't0': sil2_t0, 't1': sil2_t1},
    ],
    'ending': {
        'type': 'fridge',
        'tStart': fridge_start,
        'tEnd': fridge_end,
        'fridgeColor': '#cbe3d7',
    },
    'music': {
        'preset': 'morning-garden',
        'key': 'F',
        'bpm': 106,
        'gains': {
            'ukulele': 0.88,
            'marimba': 0.82,
            'recorder': 0.90,
            'bassoon': 0.82,
            'glock': 1.18,
            'perc': 0.68,
            'foley': 0.82,
            'voice': 1.00,
        },
    },
}

json.dump(project, open(os.path.join(ROOT, 'project.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
json.dump(en_lines, open(os.path.join(ROOT, 'lines.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

# Write bilingual SRT
def fmt_srt(s):
    h = int(s // 3600); m = int((s % 3600) // 60); sec = int(s % 60); ms = int(round((s - int(s)) * 1000))
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

srt_blocks = []
for i, s in enumerate(subtitles, 1):
    srt_blocks.append(f"{i}\n{fmt_srt(s['t0'])} --> {fmt_srt(s['t1'])}\n{s['en']}\n{s['vi']}")
open(os.path.join(ROOT, 'subtitles_en_vi.srt'), 'w', encoding='utf-8').write('\n\n'.join(srt_blocks) + '\n')

open(os.path.join(ROOT, 'CREDITS'), 'w', encoding='utf-8').write("""CREDITS — The Kind Wolf (Bác Sói Tốt Bụng)

Fonts (SIL Open Font License 1.1, Google Fonts): Patrick Hand, Mali
Audio Samples (CC0 1.0): FreePats project, VS Chamber Orchestra: Community Edition (Versilian Studios), Versilian Community Sample Library (Versilian Studios)
Voice Engines: Kokoro-82M (Apache 2.0, EN role-played voices) & Microsoft Edge-TTS (VI role-played voices)
Engine: Crayon Book Studio (MIT License)
""")

open(os.path.join(ROOT, 'build.sh'), 'w', encoding='utf-8', newline='\n').write("""#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
cd "$LIB"
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines_en.json" "$HERE/voices_en"
"$LIB/.venv/bin/python" core/tts/tts_zh.py "$HERE/lines_vi.json" "$HERE/voices_vi"
"$LIB/.venv/bin/python" "$HERE/join_bilingual.py"
"$LIB/.venv/bin/python" "$HERE/build_project.py"
node core/render/events.mjs "$HERE" --size 1920x1080
node core/render/readcheck.mjs "$HERE" --size 1920x1080
LEMO_FETCH=0 "$LIB/.venv/bin/python" engine/score_gen.py "$HERE"
"$LIB/.venv/bin/python" engine/mix_gen.py "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master_crf19.mp4" 24 0
ffmpeg -y -loglevel error -i "$HERE/out/master_crf19.mp4" -c:v libx264 -preset slow -crf 25 -c:a copy -movflags +faststart "$HERE/the-kind-wolf.mp4"
rm -f "$HERE/out/master_crf19.mp4"
""")

print("Wrote project.json, lines.json, subtitles_en_vi.srt, CREDITS, build.sh")
