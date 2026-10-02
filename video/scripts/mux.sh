#!/bin/sh
# Führt das stumme Video mit der gemischten Tonspur zusammen.
set -e
cd "$(dirname "$0")/.."
OUT="${OUT:-../REMOTE-JOB-KOMPASS-META-AD-FUNKSTILLE.mp4}"
ffmpeg -v error -y -i out/video-silent.mp4 -i audio/out/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 \
  -movflags +faststart -metadata title="Remote Job Kompass – Funkstille (Meta Ad 9:16)" \
  -shortest "$OUT"
echo "$OUT"
