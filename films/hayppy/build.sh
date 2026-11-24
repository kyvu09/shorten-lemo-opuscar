#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1920x1080
"$LIB/.venv/bin/python" engine/score_gen.py "$HERE"
"$LIB/.venv/bin/python" engine/mix_gen.py "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size 1920x1080 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/out/master_crf19.mp4" 24 0
ffmpeg -y -loglevel error -i "$HERE/out/master_crf19.mp4" -c:v libx264 -preset slow -crf 25 -c:a copy -movflags +faststart "$HERE/hayppy.mp4"
rm -f "$HERE/out/master_crf19.mp4"
