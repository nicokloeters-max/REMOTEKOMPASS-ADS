// Prüf-Standbilder: node scripts/stills.mjs [--comp=MetaAd] [--scale=0.5] 0 60 120 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const args = process.argv.slice(2);
const opt = Object.fromEntries(args.filter((a) => a.startsWith("--")).map((a) => a.slice(2).split("=")));
const frames = args.filter((a) => !a.startsWith("--")).map(Number);
const comp = opt.comp ?? "MetaAd";
const scale = Number(opt.scale ?? 0.5);
const outDir = path.resolve(opt.out ?? "out/stills");
fs.mkdirSync(outDir, { recursive: true });

const chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions, puppeteerInstance });
for (const frame of frames) {
  const output = path.join(outDir, `${comp}-${String(frame).padStart(4, "0")}.png`);
  const t = Date.now();
  await renderStill({ composition, serveUrl, frame, output, browserExecutable, chromiumOptions, scale, puppeteerInstance });
  console.log("still", output, Date.now() - t, "ms");
}
await puppeteerInstance.close({ silent: true });
