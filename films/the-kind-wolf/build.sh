#!/bin/sh
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
