// Baut die gemeinsame Zeitachse für Bild UND Ton: src/timeline.json
// Eingang: voice/script.json (Pausen) + voice/vo.json (Wort-Zeitstempel je Zeile).
//   node scripts/timeline.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const script = JSON.parse(fs.readFileSync(path.join(root, "voice/script.json"), "utf8"));
const vo = JSON.parse(fs.readFileSync(path.join(root, "voice/vo.json"), "utf8"));
const FPS = 60;

const lines = {};
const clips = [];
let cursor = 0;
for (const sl of script.lines) {
  const v = vo.lines.find((l) => l.id === sl.id);
  if (!v) throw new Error(`Zeile ${sl.id} fehlt in vo.json`);
  const first = v.words[0].s;
  const last = v.words[v.words.length - 1].e;
  const start = cursor + sl.gapBefore;
  const offset = start - first; // Position des Clips auf der Zeitachse
  const words = v.words.map((w) => ({ w: w.w, s: +(offset + w.s).toFixed(4), e: +(offset + w.e).toFixed(4) }));
  const end = offset + last;
  lines[sl.id] = { start: +start.toFixed(4), end: +end.toFixed(4), words, text: sl.text };
  if (v.file) clips.push({ id: sl.id, file: v.file, at: +offset.toFixed(4) });
  cursor = end;
}
const duration = cursor + script.tail;

// Erwartete Wortzahl je Zeile – die Szenen greifen per Index auf Wörter zu.
const expected = { funk: 7, abend: 8, mir: 7, nein: 10, kompass: 17, inhalt: 5, vision: 16, cta: 12 };
for (const [id, n] of Object.entries(expected)) {
  if (lines[id].words.length !== n)
    console.warn(`⚠ ${id}: ${lines[id].words.length} statt ${n} Wörter → ${lines[id].words.map((w) => w.w).join(" | ")}`);
}

const out = {
  fps: FPS,
  width: 1080,
  height: 1920,
  duration: +duration.toFixed(4),
  frames: Math.ceil(duration * FPS),
  source: vo.source,
  lines,
  clips,
};
fs.writeFileSync(path.join(root, "src/timeline.json"), JSON.stringify(out, null, 2));
console.log(`src/timeline.json: ${duration.toFixed(2)} s, ${out.frames} Frames (${vo.source})`);
for (const [id, l] of Object.entries(lines)) console.log(`  ${id.padEnd(8)} ${l.start.toFixed(2)} → ${l.end.toFixed(2)}`);
