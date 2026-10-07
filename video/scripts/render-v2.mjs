// Rendert die fünf Ads der Kampagne „Nachtlicht“ und legt die Tonspur an.
//   node scripts/render-v2.mjs            → ../ADS-V2/*.mp4
//   node scripts/render-v2.mjs a2 a4      → nur einzelne
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const pw = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(pw) ? pw : null;
const chromiumOptions = { gl: process.env.GL ?? (browserExecutable ? "swangle" : "angle") };

const ADS = [
  { slug: "a1", id: "V2-A1-Auffuehrung", file: "REMOTE-JOB-KOMPASS-V2-01-AUFFUEHRUNG.mp4" },
  { slug: "a2", id: "V2-A2-Kompass", file: "REMOTE-JOB-KOMPASS-V2-02-KOMPASS.mp4" },
  { slug: "a3", id: "V2-A3-Hunderte", file: "REMOTE-JOB-KOMPASS-V2-03-HUNDERTE.mp4" },
  { slug: "a4", id: "V2-A4-14-Tage", file: "REMOTE-JOB-KOMPASS-V2-04-14-TAGE.mp4" },
  { slug: "a5", id: "V2-A5-Mail", file: "REMOTE-JOB-KOMPASS-V2-05-MAIL.mp4" },
];
const only = process.argv.slice(2);
const outDir = path.resolve("../ADS-V2");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync("out/v2", { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const ad of ADS.filter((a) => !only.length || only.includes(a.slug))) {
  const composition = await selectComposition({ serveUrl, id: ad.id, browserExecutable, chromiumOptions });
  const silent = path.resolve(`out/v2/${ad.slug}-silent.mp4`);
  const started = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 17,
    x264Preset: "medium",
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    muted: true,
    concurrency: Number(process.env.CONC ?? 4),
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 120000,
    outputLocation: silent,
  });
  const wav = path.resolve(`audio/out/v2/${ad.slug}-mix.wav`);
  const out = path.join(outDir, ad.file);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
    "-movflags", "+faststart", "-metadata", `title=Remote Job Kompass – ${ad.id} (Meta Ad 9:16)`, "-shortest", out]);
  console.log(`✓ ${ad.slug} ${((Date.now() - started) / 1000).toFixed(0)} s → ${out}`);
}
