import { Expr, NEUTRAL } from "./mascot/face";
import { Pose } from "./mascot/MascotRenderer";
import { MascotState } from "./mascot/Mascot";
import { clamp01, E, Ease, hash, lerp, noise1 } from "./lib/anim";
import { CUE, L, S, W } from "./tl";
import { GRID } from "./scenes/layout";
import { LOGO_BASE } from "./scenes/S7Cta";

/**
 * Choreografie der Figur: Schlüsselzustände an Wort-Zeitpunkten, dazwischen
 * weich überblendet. Darüber liegen Blinzeln, Atmen und Squash & Stretch.
 */
type RGB = [number, number, number];
type Clip = { x: number; y: number; w: number; h: number; r: number } | null;
type Key = {
  t: number;
  dur?: number;
  ease?: Ease;
  pose?: Partial<Pose>;
  expr?: Partial<Expr>;
  paper?: RGB;
  opacity?: number;
  /** Squash & Stretch beim Eintreffen */
  pop?: number;
  clip?: Clip;
};

const PAPER: RGB = [0.957, 0.945, 0.918];
const WHITE: RGB = [1, 1, 1];

const BASE_POSE: Pose = { x: 540, y: 1500, scale: 1, yaw: 0, pitch: 0, roll: 0, stretch: 1, body: 1, laptop: 0, mug: 0 };

const sad: Partial<Expr> = { smile: -0.55, browTilt: 0.8, lid: 0.3, blush: 0.12, mouthOpen: 0, mouthO: 0, happy: 0 };
const tired: Partial<Expr> = { smile: -0.25, browTilt: 0.45, lid: 0.58, blush: 0.05, mouthO: 0, happy: 0 };

const keysRaw: Key[] = [
  // 01 Funkstille – Figur ist ab dem ersten Bild da (Vorschaubild!)
  { t: 0, pose: { x: 860, y: 1500, scale: 1.0, yaw: -0.3, pitch: 0.1, roll: 0.05 }, expr: { ...sad, lookX: -0.5, lookY: 0.1 }, paper: PAPER, opacity: 1 },
  { t: 0.02, dur: 0.55, ease: E.out, pose: { x: 760, yaw: -0.22 } },
  { t: W("funk", 2).s, dur: 0.12, ease: E.out, pose: { roll: -0.07, yaw: -0.38 }, expr: { eyeOpen: 0.55, browTilt: 1, smile: -0.75, lookX: 0.6, lookY: -0.3 }, pop: 0.7 },
  { t: W("funk", 3).e + 0.05, dur: 0.3, pose: { roll: 0.03, yaw: -0.2 }, expr: { eyeOpen: 1, lookX: 0.4, lookY: -0.2 } },
  { t: W("funk", 5).s, dur: 0.5, pose: { pitch: 0.24, yaw: -0.08, roll: 0.06 }, expr: { lookY: 0.85, lookX: -0.1, lid: 0.5, browTilt: 1, smile: -0.7 } },
  { t: S.funk.b - 0.3, dur: 0.3, ease: E.in, pose: { y: 2500, stretch: 1.12 } },

  // 02 Alltag – Amber, müde
  { t: S.abend.a + 0.28, pose: { x: 800, y: 2400, scale: 0.92, yaw: -0.4, pitch: -0.05, roll: 0, stretch: 1 }, expr: { ...tired, lookX: -0.75, lookY: -0.35, eyeOpen: 1 }, paper: WHITE },
  { t: S.abend.a + 0.3, dur: 0.6, ease: E.backStrong, pose: { y: 1540 }, pop: 1 },
  { t: W("abend", 4).s - 0.05, dur: 0.25, pose: { pitch: -0.16, yaw: -0.15 }, expr: { mouthO: 1, eyeOpen: 0.15, lid: 0.2, browY: 0.5, browTilt: 0.2 } },
  { t: W("abend", 6).s, dur: 0.35, pose: { pitch: 0.18, yaw: -0.25, roll: 0.08 }, expr: { mouthO: 0, eyeOpen: 1, lid: 0.68, browY: 0, browTilt: 0.5, lookX: -0.3, lookY: 0.4 } },
  { t: S.abend.b - 0.25, dur: 0.25, ease: E.in, opacity: 0 },

  // 03 Zweifel – klein im Lichtkegel
  { t: S.mir.a + 0.15, pose: { x: 540, y: 1560, scale: 0.64, yaw: 0.05, pitch: 0.3, roll: 0.05, stretch: 1 }, expr: { ...sad, lid: 0.5, browTilt: 1, smile: -0.75, lookY: 0.9, lookX: 0.05 }, opacity: 0 },
  { t: S.mir.a + 0.2, dur: 0.5, opacity: 1 },
  { t: S.mir.a + 0.7, dur: S.mir.b - S.mir.a - 0.7, ease: E.linear, pose: { scale: 0.7, y: 1540 } },

  // 04 Wendepunkt – „Nein.“: Figur schnellt hoch und schaut auf
  { t: S.nein.a, pose: { x: 540, y: 2300, scale: 1.04, yaw: 0, pitch: -0.14, roll: 0 }, expr: { smile: 0, mouthO: 0.85, browY: 0.95, browTilt: 0.25, eyeOpen: 1.12, lid: 0, lookY: -0.65, lookX: 0, blush: 0.2 }, paper: PAPER, opacity: 1 },
  { t: S.nein.a + 0.02, dur: 0.55, ease: E.backStrong, pose: { y: 1500 }, pop: 1 },
  { t: W("nein", 1).s, dur: 0.4, pose: { pitch: -0.04, yaw: 0.1 }, expr: { mouthO: 0, smile: 0.1, browY: 0.3, browTilt: 0.55, eyeOpen: 1, lookY: -0.2, lookX: 0.1 } },
  { t: W("nein", 5).s, dur: 0.45, pose: { yaw: -0.05, roll: -0.04 }, expr: { smile: 0.55, browY: 0.45, browTilt: 0, lookY: -0.1, lookX: 0, blush: 0.6 } },
  { t: W("nein", 9).s, dur: 0.25, expr: { smile: 0.95, mouthOpen: 0.45, browY: 0.7, blush: 0.85 }, pop: 0.6 },

  // 05 Das System – Figur unten links, staunt über Buch und Karten
  { t: S.kompass.a, dur: 0.55, ease: E.out, pose: { x: 230, y: 1600, scale: 0.7, yaw: 0.5, pitch: -0.08, roll: 0 }, expr: { smile: 0.4, mouthOpen: 0, mouthO: 0.45, lookX: 0.7, lookY: -0.6, browY: 0.6, blush: 0.5 } },
  { t: W("kompass", 7).s, dur: 0.35, pose: { yaw: 0.6, pitch: -0.04 }, expr: { mouthO: 0, smile: 0.6, lookX: 0.95, lookY: -0.3 } },
  { t: W("kompass", 14).s, dur: 0.25, expr: { mouthO: 0.9, browY: 1, eyeOpen: 1.12, smile: 0 }, pop: 0.6 },
  { t: CUE.grid - 0.05, dur: 0.2, ease: E.in, pose: { y: 2300 } },
  // im Raster: „on air“-Kachel oben rechts
  {
    t: CUE.grid + 0.25,
    pose: { x: GRID.cam.x + GRID.cam.w / 2, y: GRID.cam.y + GRID.cam.h * 0.98, scale: 0.5, yaw: -0.15, pitch: 0.02 },
    expr: { mouthO: 0, eyeOpen: 1, smile: 0.7, browY: 0.3, lookX: -0.5, lookY: 0.2, blush: 0.6 },
    paper: WHITE,
    clip: GRID.cam,
  },
  { t: CUE.grid + 0.27, dur: 0.5, ease: E.backStrong, pose: { y: GRID.cam.y + GRID.cam.h * 0.5 }, pop: 0.8 },
  { t: W("inhalt", 2).s, dur: 0.25, expr: { lookX: -0.4, lookY: 0.7 } },
  { t: W("inhalt", 4).s, dur: 0.25, expr: { lookX: -0.6, lookY: 0.6 } },
  { t: CUE.stamp, dur: 0.15, expr: { happy: 1, smile: 1, mouthOpen: 0.55, blush: 0.9 }, pop: 0.9 },

  // 06 Stell dir vor – am Laptop, glücklich
  { t: S.vision.a + 0.42, pose: { x: 540, y: 1180, scale: 0.98, yaw: 0.14, pitch: 0.08, roll: 0, laptop: 1, mug: 1 }, expr: { happy: 1, smile: 0.85, mouthOpen: 0, blush: 0.9, browY: 0.2, lookX: 0, lookY: 0 }, paper: WHITE, clip: null, opacity: 0 },
  { t: S.vision.a + 0.45, dur: 0.6, opacity: 1 },
  { t: W("vision", 8).s, dur: 0.3, pose: { yaw: -0.05, pitch: 0 }, expr: { happy: 0, smile: 0.9, mouthOpen: 0.35, eyeOpen: 1, lookX: 0, lookY: 0.05 } },
  { t: W("vision", 11).s, dur: 0.45, pose: { roll: 0.1, yaw: 0.18 }, expr: { happy: 1, mouthOpen: 0, smile: 1 } },
  { t: S.vision.b - 0.25, dur: 0.25, ease: E.in, opacity: 0 },

  // 07 Angebot – Kopf schaut hinter dem Logo hervor, zwinkert
  {
    t: S.cta.a + 0.38,
    pose: { x: 540, y: 980, scale: 0.6, yaw: 0, pitch: 0, roll: 0, laptop: 0, mug: 0 },
    expr: { happy: 0, smile: 0.8, mouthOpen: 0, eyeOpen: 1, blush: 0.8, lookX: 0, lookY: 0 },
    paper: PAPER,
    opacity: 1,
    clip: { x: 0, y: 0, w: 1080, h: LOGO_BASE - 88, r: 0 },
  },
  { t: S.cta.a + 0.8, dur: 0.6, ease: E.backStrong, pose: { y: 505 }, pop: 0.8 },
  { t: W("cta", 3).s, dur: 0.3, pose: { yaw: 0.25, roll: 0.06 }, expr: { lookX: 0.6, lookY: 0.6 } },
  { t: W("cta", 8).s, dur: 0.2, pose: { yaw: 0, roll: -0.04 }, expr: { lookX: 0, lookY: 0, wink: 1, smile: 1, mouthOpen: 0.25 }, pop: 0.5 },
  { t: W("cta", 11).e + 0.25, dur: 0.25, expr: { wink: 0, mouthOpen: 0 } },
];

const keys = [...keysRaw].sort((a, b) => a.t - b.t);

type Full = { pose: Pose; expr: Expr; paper: RGB; opacity: number; clip: Clip };

// kumulierte Zielzustände je Schlüssel
const targets: Full[] = [];
{
  let cur: Full = { pose: BASE_POSE, expr: NEUTRAL, paper: PAPER, opacity: 1, clip: null };
  for (const k of keys) {
    cur = {
      pose: { ...cur.pose, ...k.pose },
      expr: { ...cur.expr, ...k.expr },
      paper: k.paper ?? cur.paper,
      opacity: k.opacity ?? cur.opacity,
      clip: k.clip !== undefined ? k.clip : cur.clip,
    };
    targets.push(cur);
  }
}

const mixObj = <T extends Record<string, number>>(a: T, b: T, x: number): T => {
  const o = {} as Record<string, number>;
  for (const key of Object.keys(b)) o[key] = lerp(a[key] ?? b[key], b[key], x);
  return o as T;
};

/** Blinzeln: deterministische Zeitpunkte alle ~2,4–3,6 s */
const blinkAt = (t: number) => {
  let bt = 0.9;
  let i = 0;
  while (bt < t + 1) {
    const d = t - bt;
    if (d >= 0 && d < 0.2) return d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.13;
    bt += 2.4 + hash(i++) * 1.2;
  }
  return 0;
};

export const mascotAt = (t: number): MascotState => {
  let i = -1;
  for (let j = 0; j < keys.length; j++) if (keys[j].t <= t) i = j;
  if (i < 0) i = 0;
  const k = keys[i];
  const to = targets[i];
  const from = i > 0 ? targets[i - 1] : to;
  const x = k.dur ? (k.ease ?? E.smooth)(clamp01((t - k.t) / k.dur)) : 1;
  const pose = mixObj(from.pose, to.pose, x);
  const expr = mixObj(from.expr, to.expr, x);
  const paper = [0, 1, 2].map((c) => lerp(from.paper[c], to.paper[c], x)) as RGB;
  const opacity = lerp(from.opacity, to.opacity, x);

  // Squash & Stretch: gedämpfte Schwingung nach jedem „pop“
  let stretch = pose.stretch;
  for (const kk of keys) {
    if (!kk.pop) continue;
    const d = t - kk.t - (kk.dur ?? 0) * 0.35;
    if (d < 0 || d > 1.2) continue;
    stretch += kk.pop * 0.14 * Math.exp(-d * 6) * Math.sin(d * 26);
  }
  pose.stretch = stretch;

  // Atmen + Mikrobewegung
  const breathe = Math.sin(t * Math.PI * 2 * 0.45);
  pose.y += breathe * 5 * pose.scale;
  pose.yaw += noise1(t * 0.7, 1) * 0.03;
  pose.roll += noise1(t * 0.5, 2) * 0.02;
  pose.pitch += noise1(t * 0.6, 3) * 0.015;
  // Schunkeln in der Vision-Szene
  if (t > S.vision.a && t < S.vision.b) pose.roll += Math.sin((t - S.vision.a) * 2.4) * 0.05;

  // Träne bei „Funkstille“
  const tearAt = W("funk", 6).s - 0.1;
  expr.tear = t > tearAt && t < S.funk.b ? clamp01((t - tearAt) / 1.7) : 0;

  const blink = expr.happy > 0.5 || expr.eyeOpen < 0.4 ? 0 : clamp01(blinkAt(t));

  return {
    visible: opacity > 0.01,
    blink,
    expr,
    pose,
    look: { cell: 6.5, ink: [0.031, 0.047, 0.067], paper, opacity },
    clip: to.clip,
  };
};

export const mascotHidden = (t: number) => t < 0 || t > L("cta").end + 10;
