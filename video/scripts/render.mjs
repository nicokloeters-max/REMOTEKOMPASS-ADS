// Rendert das Video (stumm).
//   node scripts/render.mjs              → out/video-silent.mp4 (schnell)
//   FINAL=1 node scripts/render.mjs      → höhere Encoder-Qualität
//   RANGE=0-600 node scripts/render.mjs  → nur ein Ausschnitt (Frames)
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

// Vorinstalliertes Chromium der Cloud-Umgebung; lokal lädt Remotion seinen eigenen Browser.
const pw = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = fs.existsSync(pw) ? pw : null;
const chromiumOptions = { gl: process.env.GL ?? (browserExecutable ? "swangle" : "angle") };
const final = process.env.FINAL === "1";
fs.mkdirSync("out", { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: "MetaAd", browserExecutable, chromiumOptions });
const started = Date.now();
let last = -1;
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  crf: final ? 17 : 20,
  x264Preset: final ? "slow" : "veryfast",
  pixelFormat: "yuv420p",
  colorSpace: "bt709",
  muted: true,
  concurrency: Number(process.env.CONC ?? 4),
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 120000,
  frameRange: process.env.RANGE ? process.env.RANGE.split("-").map(Number) : undefined,
  outputLocation: path.resolve(process.env.OUT ?? "out/video-silent.mp4"),
  onProgress: ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct % 5 === 0 && pct !== last) {
      last = pct;
      console.log(`${pct}%  ${((Date.now() - started) / 1000).toFixed(0)}s`);
    }
  },
});
console.log("fertig", ((Date.now() - started) / 1000).toFixed(0), "s");
