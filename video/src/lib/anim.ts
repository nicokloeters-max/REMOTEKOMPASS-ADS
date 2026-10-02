/**
 * Animations-Helfer. Alles rechnet in Sekunden (t), damit die Zeitpunkte direkt
 * aus den Wort-Zeitstempeln des Voice-overs übernommen werden können.
 */
export type Ease = (x: number) => number;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

const bezier = (x1: number, y1: number, x2: number, y2: number): Ease => {
  // Newton-Raphson auf der x-Kurve, dann y auswerten (wie CSS cubic-bezier).
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    t = clamp01(t);
    return sy(t);
  };
};

export const E = {
  linear: (x: number) => x,
  out: bezier(0.16, 1, 0.3, 1), // expo-out
  snap: bezier(0.22, 1, 0.36, 1),
  inOut: bezier(0.83, 0, 0.17, 1),
  smooth: bezier(0.65, 0, 0.35, 1),
  in: bezier(0.7, 0, 0.84, 0),
  inSoft: bezier(0.5, 0, 0.75, 0),
  back: bezier(0.34, 1.56, 0.64, 1),
  backStrong: bezier(0.3, 1.9, 0.5, 1),
};

/** Fortschritt 0..1 ab `start` über `dur` Sekunden. */
export const p = (t: number, start: number, dur: number, ease: Ease = E.out) =>
  ease(clamp01((t - start) / dur));

/** Lineare Abbildung mit Clamping und Kurve. */
export const map = (t: number, a: number, b: number, from: number, to: number, ease: Ease = E.out) =>
  lerp(from, to, ease(clamp01((t - a) / (b - a))));

/** Mehrstufige Keyframes [zeit, wert], je Abschnitt dieselbe Kurve. */
export const keys = (t: number, pts: [number, number][], ease: Ease = E.smooth) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t <= t1) return lerp(v0, v1, ease(clamp01((t - t0) / (t1 - t0))));
  }
  return pts[pts.length - 1][1];
};

/**
 * Gedämpfte Feder (analytisch), 0 → 1 ab `start`. Überschwingt je nach Dämpfung.
 * `freq` in Hz, `damp` 0..1 (Dämpfungsgrad).
 */
export const spring = (t: number, start: number, freq = 2.2, damp = 0.45) => {
  const x = t - start;
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const z = damp;
  if (z >= 1) return 1 - Math.exp(-w * x) * (1 + w * x);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
};

/** Deterministisches Pseudo-Rauschen. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Glattes 1D-Rauschen −1..1. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i + seed * 101.3) * 2 - 1;
  const b = hash(i + 1 + seed * 101.3) * 2 - 1;
  return lerp(a, b, u);
};

export const inRange = (t: number, a: number, b: number) => t >= a && t < b;

/** Ein-/Ausblend-Hüllkurve: 0 → 1 in [a, a+fin], 1 → 0 in [b-fout, b]. */
export const env = (t: number, a: number, b: number, fin = 0.25, fout = 0.25, ease: Ease = E.out) =>
  Math.min(p(t, a, fin, ease), 1 - p(t, b - fout, fout, E.inSoft));
