import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Selbst ausgelieferte Schriften wie auf der Landingpage (fontsource). */
const fonts = [
  { family: "Inter Tight", file: "inter-tight-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  { family: "Inter", file: "inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" },
  { family: "Fraunces", file: "fraunces-latin-full-italic.woff2", weight: "100 900", style: "italic" },
  { family: "Fraunces", file: "fraunces-latin-full-normal.woff2", weight: "100 900", style: "normal" },
  { family: "JetBrains Mono", file: "jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
] as const;

export const fontsReady = Promise.all(
  fonts.map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      style: f.style,
      format: "woff2",
    }),
  ),
);
