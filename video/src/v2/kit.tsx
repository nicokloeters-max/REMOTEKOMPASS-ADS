/**
 * Bausteine für die Kampagne „Nachtlicht“ (V2): filmischer, dunkler Look mit
 * einem warmen Licht als Hoffnungsträger. Alles ist eine reine Funktion der
 * Zeit t (Sekunden) – deterministisch und framegenau renderbar.
 */
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { C, F, H, W } from "../theme";
import { clamp01, E, Ease, hash, lerp, p, spring } from "../lib/anim";
import { Book3D } from "../components/Book";

export const N = {
  night: "#05070a",
  night2: "#0a0f16",
  navy: "#0e1622",
  cream: "#f4f1ea",
  creamDim: "rgba(244,241,234,0.62)",
  creamFaint: "rgba(244,241,234,0.32)",
  amber: C.needle,
  amberHot: "#ffbe5c",
  amberDeep: C.needleDeep,
  glass: "rgba(255,255,255,0.07)",
  glassLine: "rgba(255,255,255,0.13)",
};

/* ------------------------------------------------------------------ Typo */

export type Seg = { text: string; accent?: boolean; color?: string; mono?: boolean; sans?: boolean };

/**
 * Kino-Titel: Buchstaben kommen aus der Unschärfe, steigen leicht auf.
 * Akzente sind kursive Fraunces in Amber mit warmem Glühen.
 */
export const Title: React.FC<{
  t: number;
  at: number;
  lines: Seg[][];
  size: number;
  x?: number;
  y: number;
  width?: number;
  align?: "left" | "center";
  color?: string;
  stagger?: number;
  dur?: number;
  out?: number;
  outDur?: number;
  weight?: number;
  lineHeight?: number;
  glow?: boolean;
  sans?: boolean;
}> = ({
  t,
  at,
  lines,
  size,
  x = 540,
  y,
  width = 960,
  align = "center",
  color = N.cream,
  stagger = 0.022,
  dur = 0.7,
  out,
  outDur = 0.45,
  weight = 380,
  lineHeight = 1.08,
  glow = true,
  sans = false,
}) => {
  if (t < at - 0.05) return null;
  if (out !== undefined && t > out + outDur + 0.6) return null;
  let k = 0;
  const left = align === "center" ? x - width / 2 : x;
  return (
    <div style={{ position: "absolute", left, top: y, width, textAlign: align }}>
      {lines.map((line, li) => (
        <div key={li} style={{ lineHeight, whiteSpace: "nowrap" }}>
          {line.map((seg, si) => {
            const fam = seg.mono ? F.mono : seg.accent ? F.editorial : sans || seg.sans ? F.display : F.editorial;
            const italic = !!seg.accent;
            const segColor = seg.color ?? (seg.accent ? N.amber : color);
            return (
              <span key={si}>
                {Array.from(seg.text).map((ch, ci) => {
                  const idx = k++;
                  const pr = p(t, at + idx * stagger, dur, E.out);
                  const ex = out !== undefined ? p(t, out + idx * stagger * 0.4, outDur, E.in) : 0;
                  const blur = (1 - pr) * 16 + ex * 18;
                  return (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                        fontFamily: fam,
                        fontStyle: italic ? "italic" : "normal",
                        fontWeight: sans || seg.sans ? 720 : italic ? 400 : weight,
                        fontVariationSettings: fam === F.editorial ? "'opsz' 144, 'SOFT' 40" : undefined,
                        fontSize: italic ? size * 1.06 : size,
                        letterSpacing: sans || seg.sans ? "-0.04em" : "-0.025em",
                        color: segColor,
                        opacity: clamp01(pr * 1.6) * (1 - ex),
                        transform: `translateY(${(1 - pr) * size * 0.28 - ex * size * 0.2}px) scale(${1 + (1 - pr) * 0.06})`,
                        filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
                        textShadow:
                          glow && italic ? `0 0 ${size * 0.35}px rgba(232,163,61,${0.45 * pr * (1 - ex)})` : undefined,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Kleine Mono-Zeile (Ort/Zeit-Marke wie im Film-Insert). */
export const Slug: React.FC<{ t: number; at: number; text: string; x?: number; y: number; out?: number; align?: "left" | "center"; color?: string }> = ({
  t,
  at,
  text,
  x = 540,
  y,
  out,
  align = "center",
  color = N.creamFaint,
}) => {
  if (t < at) return null;
  const n = Math.floor(clamp01((t - at) / 0.6) * text.length);
  const o = out !== undefined ? 1 - p(t, out, 0.3, E.in) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - 500 : x,
        width: align === "center" ? 1000 : undefined,
        top: y,
        textAlign: align,
        fontFamily: F.mono,
        fontSize: 24,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        opacity: o,
      }}
    >
      {text.slice(0, n)}
      <span style={{ opacity: n < text.length ? 1 : 0 }}>▍</span>
    </div>
  );
};

/** Zahl, die hochzählt (de-DE Format). */
export const Ticker: React.FC<{ t: number; at: number; dur: number; from?: number; to: number; ease?: Ease; style?: React.CSSProperties; suffix?: string; decimals?: number }> = ({
  t,
  at,
  dur,
  from = 0,
  to,
  ease = E.out,
  style,
  suffix = "",
  decimals = 0,
}) => {
  const v = lerp(from, to, ease(clamp01((t - at) / dur)));
  const s = v.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {s}
      {suffix}
    </span>
  );
};

/* ------------------------------------------------------------------ Licht & Film */

/** Filmkorn: vorberechnete Rauschkacheln, je Frame versetzt. */
export const Grain: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 0.13 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const tiles = useMemo(() => {
    const out: HTMLCanvasElement[] = [];
    for (let k = 0; k < 4; k++) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const g = c.getContext("2d")!;
      const img = g.createImageData(256, 256);
      let s = 1234 + k * 977;
      for (let i = 0; i < 256 * 256; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const v = (s >>> 24) & 255;
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      out.push(c);
    }
    return out;
  }, []);
  const frame = Math.round(t * 30);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    const tile = tiles[frame % 4];
    const ox = Math.floor(hash(frame * 1.7) * 256);
    const oy = Math.floor(hash(frame * 3.1) * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) g.drawImage(tile, x, y);
  });
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity, pointerEvents: "none" }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.7 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Weiche Lichtflecken (Bokeh), driftend. */
export const Bokeh: React.FC<{ t: number; n?: number; color?: string; opacity?: number; seed?: number; rise?: number }> = ({
  t,
  n = 22,
  color = "255,196,120",
  opacity = 1,
  seed = 1,
  rise = 14,
}) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const r = 18 + hash(i * 3.7 + seed) * 70;
      const x = hash(i * 7.1 + seed) * W + Math.sin(t * 0.3 + i) * 30;
      const y = ((hash(i * 1.3 + seed) * (H + 300) - t * (rise + hash(i) * 20)) % (H + 300) + H + 300) % (H + 300) - 150;
      const a = (0.1 + hash(i * 9.1 + seed) * 0.28) * opacity * (0.6 + 0.4 * Math.sin(t * 0.8 + i * 2));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x - r,
            top: y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${color},${a}) 0%, rgba(${color},${a * 0.6}) 45%, rgba(${color},0) 72%)`,
          }}
        />
      );
    })}
  </>
);

/** Warmes Licht, das „aufgeht“ – der Hoffnungsmoment jeder Ad. */
export const Dawn: React.FC<{ t: number; at: number; dur?: number; y?: number; strength?: number }> = ({ t, at, dur = 2.2, y = 1500, strength = 1 }) => {
  const k = p(t, at, dur, E.smooth) * strength;
  if (k <= 0) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 540 - 1100,
          top: y - 900 + (1 - k) * 300,
          width: 2200,
          height: 1800,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, rgba(255,190,100,${0.55 * k}), rgba(232,163,61,${0.22 * k}) 45%, rgba(232,163,61,0) 100%)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(232,163,61,${0.18 * k}) 100%)`,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
};

/** Lichtleck, das diagonal durchs Bild wischt (Übergänge). */
export const LightLeak: React.FC<{ t: number; at: number; dur?: number; color?: string }> = ({ t, at, dur = 0.9, color = "255,170,80" }) => {
  if (t < at || t > at + dur) return null;
  const k = (t - at) / dur;
  const a = Math.sin(k * Math.PI);
  return (
    <div
      style={{
        position: "absolute",
        left: lerp(-900, 900, k),
        top: -300,
        width: 1100,
        height: 2600,
        transform: "rotate(18deg)",
        background: `radial-gradient(closest-side, rgba(${color},${0.75 * a}), rgba(${color},0))`,
        mixBlendMode: "screen",
        filter: "blur(30px)",
      }}
    />
  );
};

/* ------------------------------------------------------------------ Karten-Motiv */

const vnoise = (x: number, y: number, s: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (a: number, b: number) => hash(a * 157.31 + b * 311.7 + s * 71.3);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
};

/** Höhenlinien (Marching Squares über ein Rauschfeld) – das Kartenmotiv der Landingpage. */
export const Topo: React.FC<{
  t: number;
  w?: number;
  h?: number;
  step?: number;
  levels?: number;
  color?: string;
  lineWidth?: number;
  speed?: number;
  scale?: number;
  seed?: number;
  style?: React.CSSProperties;
  highlight?: number; // 0..1: eine Linie leuchtet in Amber
}> = ({ t, w = W, h = H, step = 14, levels = 11, color = "rgba(244,241,234,0.16)", lineWidth = 1.6, speed = 0.05, scale = 0.0021, seed = 3, style, highlight = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, w, h);
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;
    const vals = new Float32Array(cols * rows);
    const z = t * speed;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const x = i * step * scale;
        const y = j * step * scale;
        vals[j * cols + i] =
          vnoise(x + z, y - z * 0.6, seed) * 0.6 + vnoise(x * 2.1 - z, y * 2.1, seed + 1) * 0.28 + vnoise(x * 4.3, y * 4.3 + z, seed + 2) * 0.12;
      }
    const hiLevel = Math.floor(levels * 0.55);
    for (let L = 0; L < levels; L++) {
      const iso = 0.22 + (L / levels) * 0.56;
      g.beginPath();
      for (let j = 0; j < rows - 1; j++)
        for (let i = 0; i < cols - 1; i++) {
          const a = vals[j * cols + i];
          const b = vals[j * cols + i + 1];
          const c = vals[(j + 1) * cols + i + 1];
          const d = vals[(j + 1) * cols + i];
          const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x0 = i * step;
          const y0 = j * step;
          const lerpE = (v1: number, v2: number) => (iso - v1) / (v2 - v1 || 1e-6);
          const top = [x0 + lerpE(a, b) * step, y0];
          const right = [x0 + step, y0 + lerpE(b, c) * step];
          const bottom = [x0 + lerpE(d, c) * step, y0 + step];
          const left = [x0, y0 + lerpE(a, d) * step];
          const seg = (p1: number[], p2: number[]) => {
            g.moveTo(p1[0], p1[1]);
            g.lineTo(p2[0], p2[1]);
          };
          switch (idx) {
            case 1: case 14: seg(left, bottom); break;
            case 2: case 13: seg(bottom, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(top, right); break;
            case 5: seg(left, top); seg(bottom, right); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, top); break;
            case 10: seg(top, right); seg(left, bottom); break;
          }
        }
      const hi = L === hiLevel && highlight > 0;
      g.strokeStyle = hi ? `rgba(232,163,61,${0.25 + 0.7 * highlight})` : color;
      g.lineWidth = hi ? lineWidth * (1 + highlight * 1.4) : lineWidth;
      g.stroke();
    }
  });
  return <canvas ref={ref} width={w} height={h} style={{ position: "absolute", left: 0, top: 0, ...style }} />;
};

/* ------------------------------------------------------------------ UI */

export const Glass: React.FC<{ w: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties; radius?: number; pad?: number; blur?: boolean }> = ({
  w,
  h,
  children,
  style,
  radius = 34,
  pad = 28,
  blur = true,
}) => (
  <div
    style={{
      width: w,
      height: h,
      boxSizing: "border-box",
      padding: pad,
      borderRadius: radius,
      background: "linear-gradient(160deg, rgba(255,255,255,0.13), rgba(255,255,255,0.05))",
      border: `1.5px solid ${N.glassLine}`,
      boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
      backdropFilter: blur ? "blur(22px) saturate(1.3)" : undefined,
      color: N.cream,
      fontFamily: F.sans,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Sanftes Ein-/Ausblenden einer Ebene mit Tiefenunschärfe (Rack-Focus). */
export const Focus: React.FC<{ t: number; a: number; b: number; fin?: number; fout?: number; children: React.ReactNode; style?: React.CSSProperties; rise?: number }> = ({
  t,
  a,
  b,
  fin = 0.5,
  fout = 0.45,
  children,
  style,
  rise = 30,
}) => {
  if (t < a - 0.02 || t > b + 0.02) return null;
  const i = p(t, a, fin, E.out);
  const o = p(t, b - fout, fout, E.in);
  const blur = (1 - i) * 18 + o * 22;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: i * (1 - o),
        filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
        transform: `translateY(${(1 - i) * rise - o * rise}px) scale(${1 + o * 0.04})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Federndes Einblenden (Skalierung) für Karten/Chips. */
export const Pop: React.FC<{ t: number; at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ t, at, children, style, from = 0.6 }) => {
  if (t < at) return null;
  const s = spring(t, at, 2.4, 0.55);
  return (
    <div style={{ transform: `scale(${lerp(from, 1, s)})`, opacity: clamp01(s * 2.2), ...style }}>{children}</div>
  );
};

/* ------------------------------------------------------------------ End-Card */

export const EndCard: React.FC<{ t: number; at: number; tagline?: Seg[] }> = ({
  t,
  at,
  tagline = [{ text: "Dein Fahrplan zum " }, { text: "Remote-Job.", accent: true }],
}) => {
  if (t < at) return null;
  const d = t - at;
  const bookS = spring(t, at + 0.05, 1.6, 0.6);
  const btn = spring(t, at + 1.25, 2.4, 0.5);
  const pulse = 1 + Math.sin(d * 5) * 0.015 * clamp01(d - 1.6);
  const priceS = spring(t, at + 0.85, 2.6, 0.5);
  const shine = clamp01((d - 0.5) / 1.6);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* Lichtkranz hinter dem Buch */}
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: 500 - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(232,163,61,0.42), rgba(232,163,61,0.12) 50%, rgba(232,163,61,0))",
          opacity: p(t, at, 1.2, E.smooth),
          transform: `scale(${0.85 + 0.15 * p(t, at, 2, E.out)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 150,
          top: lerp(380, 280, bookS),
          opacity: clamp01(bookS * 2),
          filter: `drop-shadow(0 50px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 40px rgba(232,163,61,${0.35 * clamp01(d)}))`,
        }}
      >
        <Book3D w={300} ry={lerp(-50, -16, bookS) + Math.sin(d * 0.9) * 4} rx={5} roseRot={d * 25} shine={shine} />
      </div>
      <Title t={t} at={at + 0.4} y={738} size={84} lines={[[{ text: "Remote Job " }, { text: "Kompass", accent: true }]]} stagger={0.018} />
      <Title t={t} at={at + 0.7} y={846} size={40} lines={[tagline]} color={N.creamDim} stagger={0.01} glow={false} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 922,
          textAlign: "center",
          transform: `scale(${lerp(1.3, 1, priceS)})`,
          opacity: clamp01(priceS * 2.5),
          filter: priceS < 0.5 ? `blur(${(0.5 - priceS) * 20}px)` : undefined,
        }}
      >
        <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 120, letterSpacing: "-0.05em", color: N.cream }}>39</span>
        <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 84, color: N.amber, marginLeft: 6 }}>€</span>
        <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 30, color: N.creamDim, marginTop: -6, letterSpacing: "0.01em" }}>
          einmalig · kein Abo · sofort als Download
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - 320,
          top: 1112,
          width: 640,
          height: 112,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${N.amberHot}, ${N.amber})`,
          color: N.night,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: F.display,
          fontWeight: 780,
          fontSize: 46,
          letterSpacing: "-0.02em",
          transform: `scale(${btn * pulse})`,
          opacity: clamp01(btn * 2),
          boxShadow: "0 20px 60px rgba(232,163,61,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
          overflow: "hidden",
        }}
      >
        Jetzt sichern <span>→</span>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 120,
            left: lerp(-200, 800, ((d - 1.8) % 2.4) / 1.0),
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55), rgba(255,255,255,0))",
            transform: "skewX(-20deg)",
            opacity: d > 1.8 ? 1 : 0,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1252 + Math.sin(d * 6) * 5,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 24,
          letterSpacing: "0.1em",
          color: N.creamFaint,
          opacity: p(t, at + 1.6, 0.4, E.out),
        }}
      >
        ↓ LINK UNTEN
      </div>
    </div>
  );
};

/** Gemeinsamer Rahmen: Hintergrund, Inhalt, Licht, Korn, Vignette, Aus-/Einblende. */
export const Frame: React.FC<{ t: number; bg?: string; children: React.ReactNode; grain?: number; vignette?: number }> = ({
  t,
  bg = N.night,
  children,
  grain = 0.12,
  vignette = 0.75,
}) => {
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      {children}
      <Vignette strength={vignette} />
      <Grain t={t} opacity={grain} />
    </div>
  );
};
