import TL from "./timeline.json";

/**
 * Zugriff auf die gemeinsame Zeitachse (src/timeline.json, erzeugt von
 * scripts/timeline.mjs aus den Wort-Zeitstempeln des Voice-overs).
 */
export type Word = { w: string; s: number; e: number };
export type Line = { start: number; end: number; words: Word[]; text: string };
type LineId = "funk" | "abend" | "mir" | "nein" | "kompass" | "inhalt" | "vision" | "cta";

export const T = TL as unknown as {
  fps: number;
  width: number;
  height: number;
  duration: number;
  frames: number;
  lines: Record<LineId, Line>;
};

export const L = (id: LineId) => T.lines[id];
/** Wort `i` der Zeile `id` (negativ = von hinten). */
export const W = (id: LineId, i: number) => {
  const ws = T.lines[id].words;
  return ws[(i + ws.length) % ws.length];
};

/** Szenengrenzen (Sekunden). Übergänge beginnen kurz vor dem ersten Wort. */
export const S = {
  funk: { a: 0, b: L("abend").start - 0.32 },
  abend: { a: L("abend").start - 0.32, b: L("mir").start - 0.3 },
  mir: { a: L("mir").start - 0.3, b: W("nein", 0).s - 0.05 },
  nein: { a: W("nein", 0).s - 0.05, b: L("kompass").start - 0.28 },
  kompass: { a: L("kompass").start - 0.28, b: L("vision").start - 0.42 },
  vision: { a: L("vision").start - 0.42, b: L("cta").start - 0.32 },
  cta: { a: L("cta").start - 0.32, b: T.duration },
};

/** Zusätzliche Ereignisse innerhalb der Szenen (für Bild und Ton gleich). */
export const CUE = {
  grid: L("inhalt").start - 0.38,
  stamp: L("inhalt").end + 0.02,
};

export const CHAPTERS: { at: number; label: string }[] = [
  { at: S.funk.a, label: "01 — funkstille" },
  { at: S.abend.a, label: "02 — alltag" },
  { at: S.mir.a, label: "03 — zweifel" },
  { at: S.nein.a, label: "04 — wendepunkt" },
  { at: S.kompass.a, label: "05 — das system" },
  { at: S.vision.a, label: "06 — stell dir vor" },
  { at: S.cta.a, label: "07 — los" },
];
