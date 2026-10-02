// Erzeugt das Voice-over mit ElevenLabs – Zeile für Zeile, mit Wort-Zeitstempeln.
//
//   ELEVENLABS_API_KEY=… node scripts/voice.mjs          → voice/out/*.mp3 + voice/vo.json
//   node scripts/voice.mjs --placeholder                  → nur geschätzte Zeiten (ohne Ton)
//
// Der Schlüssel kann auch in video/.env stehen (ELEVENLABS_API_KEY=…); die Datei ist
// per .gitignore vom Repo ausgeschlossen.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const script = JSON.parse(fs.readFileSync(path.join(root, "voice/script.json"), "utf8"));
const outDir = path.join(root, "voice/out");
fs.mkdirSync(outDir, { recursive: true });

const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const placeholder = process.argv.includes("--placeholder");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const key = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID ?? script.voiceId;
if (!placeholder && !key) {
  console.error("ELEVENLABS_API_KEY fehlt (Umgebungsvariable oder video/.env).");
  process.exit(1);
}

/** Zeichen-Zeitstempel → Wörter (Satzzeichen zählen nicht zur Wortdauer). */
const toWords = (chars, starts, ends) => {
  const words = [];
  let cur = null;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      if (cur) words.push(cur);
      cur = null;
      continue;
    }
    if (!cur) cur = { w: "", s: starts[i], e: ends[i] };
    cur.w += c;
    if (/[\p{L}\p{N}]/u.test(c)) cur.e = ends[i];
  }
  if (cur) words.push(cur);
  // reine Satzzeichen-Tokens („…“, „–“) an das vorige Wort hängen
  return words.reduce((acc, w) => {
    if (!/[\p{L}\p{N}]/u.test(w.w) && acc.length) acc[acc.length - 1].w += " " + w.w;
    else acc.push(w);
    return acc;
  }, []);
};

/** Grobe Schätzung für die Entwicklung ohne Ton. */
const estimate = (text) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const words = [];
  let t = 0.05;
  for (const tok of tokens) {
    const letters = tok.replace(/[^\p{L}\p{N}]/gu, "");
    if (!letters.length) {
      t += 0.3;
      if (words.length) words[words.length - 1].w += " " + tok;
      continue;
    }
    const d = 0.06 + letters.length * 0.05;
    words.push({ w: tok, s: t, e: t + d });
    t += d + 0.03;
    if (/[.?!]$/.test(tok)) t += 0.28;
    else if (/[,:;]$/.test(tok)) t += 0.12;
  }
  return { words, duration: t + 0.1 };
};

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      encoding: "utf8",
    }).trim(),
  );

const prevVo = fs.existsSync(path.join(root, "voice/vo.json"))
  ? JSON.parse(fs.readFileSync(path.join(root, "voice/vo.json"), "utf8"))
  : null;

const result = { source: placeholder ? "placeholder" : "elevenlabs", voiceId, lines: [] };
for (let i = 0; i < script.lines.length; i++) {
  const line = script.lines[i];
  if (placeholder) {
    result.lines.push({ id: line.id, file: null, ...estimate(line.text) });
    continue;
  }
  if (only && !only.includes(line.id)) {
    const keep = prevVo?.lines.find((l) => l.id === line.id && l.file);
    if (!keep) throw new Error(`Zeile ${line.id} fehlt in vo.json – ohne --only erneut ausführen.`);
    result.lines.push(keep);
    continue;
  }
  const body = {
    text: line.text,
    model_id: script.modelId,
    voice_settings: script.voiceSettings,
    previous_text: script.lines.slice(Math.max(0, i - 2), i).map((l) => l.text).join(" ") || undefined,
    next_text: script.lines[i + 1]?.text,
  };
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_192`;
  let res;
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status < 500) break;
    await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
  if (!res.ok) {
    const msg = await res.text();
    // mp3_44100_192 ist nur für bestimmte Tarife frei – dann mit 128 kbit/s erneut
    if (res.status === 403 || /output_format/i.test(msg)) {
      res = await fetch(url.replace("mp3_44100_192", "mp3_44100_128"), {
        method: "POST",
        headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
    } else {
      throw new Error(`ElevenLabs ${res.status}: ${msg}`);
    }
  }
  const data = await res.json();
  const file = path.join(outDir, `${line.id}.mp3`);
  fs.writeFileSync(file, Buffer.from(data.audio_base64, "base64"));
  fs.writeFileSync(path.join(outDir, `${line.id}.alignment.json`), JSON.stringify(data.alignment));
  const a = data.alignment;
  const words = toWords(a.characters, a.character_start_times_seconds, a.character_end_times_seconds);
  result.lines.push({ id: line.id, file: path.relative(root, file), duration: probe(file), words });
  console.log(`✓ ${line.id}: ${words.length} Wörter, ${probe(file).toFixed(2)} s`);
}

fs.writeFileSync(path.join(root, "voice/vo.json"), JSON.stringify(result, null, 2));
console.log(`voice/vo.json geschrieben (${result.source})`);
