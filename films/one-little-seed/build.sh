#!/bin/sh
# One-command build for "One Little Seed" (Một Hạt Giống Nhỏ)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"

# 1. Self-hosted OFL fonts + CC0 sample packs needed by score.py
sh "$HERE/tools/fonts.sh"
"$LIB/.venv/bin/python" core/audio/sampler.py --need "$HERE/music/score.py"

# 2. Voice narration (Kokoro offline) + ASR check
"$LIB/.venv/bin/python" core/tts/tts.py "$HERE/lines.json" "$HERE/voices"
"$LIB/.venv/bin/python" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" --lang en

# 3. Timeline events + reading-time check
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"

# 4. Original CC0 score + foley/voice mix + subtitles_en_vi.srt
"$LIB/.venv/bin/python" "$HERE/music/score.py"
"$LIB/.venv/bin/python" "$HERE/mix.py"

# 5. Frame-by-frame 24 fps render + poster still
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
node core/render/still.mjs "$HERE" 51.25 --prefix poster_ --out "$HERE/out"
cp "$HERE/out/poster_51.25.jpg" "$HERE/poster.jpg"

# 6. Mux & master to -14 LUFS (grain = 0: anchored paper tooth is the grain), then optimize CRF 25 for sharing
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master_crf19.mp4" 24 0
ffmpeg -y -loglevel error -i "$HERE/out/master_crf19.mp4" -c:v libx264 -preset slow -crf 25 -c:a copy -movflags +faststart "$HERE/one-little-seed.mp4"
rm -f "$HERE/out/master_crf19.mp4"
