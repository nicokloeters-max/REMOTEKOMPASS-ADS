import React, { useId, useLayoutEffect, useRef } from "react";
import { C, F, H, W } from "../theme";
import { clamp01, E, p } from "../lib/anim";

/** Gerichtete Bewegungsunschärfe über einen SVG-Filter (x/y in px). */
export const Blur: React.FC<{ x?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  x = 0,
  y = 0,
  children,
  style,
}) => {
  const id = "mb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const on = Math.abs(x) > 0.4 || Math.abs(y) > 0.4;
  return (
    <>
      {on ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={`${Math.abs(x)} ${Math.abs(y)}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{ ...style, filter: on ? `url(#${id})` : style?.filter }}>{children}</div>
    </>
  );
};

/** Karte im Stil der Referenz: weiß, fein umrandet, Mono-Label oben. */
export const Card: React.FC<{
  w: number;
  h: number;
  label?: string;
  num?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  pad?: number;
}> = ({ w, h, label, num, children, style, dark, pad = 26 }) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 26,
      background: dark ? C.inkRaised : "#ffffff",
      border: dark ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid rgba(8,12,17,0.08)",
      boxShadow: dark
        ? "0 30px 60px rgba(0,0,0,0.35)"
        : "0 2px 0 rgba(8,12,17,0.03), 0 24px 48px -18px rgba(8,12,17,0.22)",
      position: "relative",
      overflow: "hidden",
      padding: pad,
      boxSizing: "border-box",
      ...style,
    }}
  >
    {label ? (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F.mono,
          fontSize: 19,
          letterSpacing: "0.02em",
          color: dark ? "rgba(244,241,234,0.45)" : "rgba(8,12,17,0.42)",
          marginBottom: 14,
        }}
      >
        <span>{label}</span>
        <span>{num}</span>
      </div>
    ) : null}
    {children}
  </div>
);

/** Kleiner Status-Chip */
export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; style?: React.CSSProperties }> = ({
  children,
  bg = C.ink,
  color = C.paper,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 20px",
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: F.sans,
      fontWeight: 600,
      fontSize: 26,
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Halbton-Grafik auf der CPU: `draw` malt eine Graustufen-Szene (mit Verläufen
 * für Volumen), die dann in ein 45°-Punktraster übersetzt wird – passend zur Figur.
 */
export const HalftoneArt: React.FC<{
  w: number;
  h: number;
  cell?: number;
  ink?: string;
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void;
  style?: React.CSSProperties;
}> = ({ w, h, cell = 6, ink = C.ink, draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const og = off.getContext("2d")!;
    draw(og, w, h);
    const src = og.getImageData(0, 0, w, h).data;
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, w, h);
    g.fillStyle = ink;
    const lum = (x: number, y: number) => {
      const xi = Math.min(w - 1, Math.max(0, Math.round(x)));
      const yi = Math.min(h - 1, Math.max(0, Math.round(y)));
      const i = (yi * w + xi) * 4;
      const a = src[i + 3] / 255;
      const l = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]) / 255;
      return [l, a];
    };
    const c = Math.SQRT1_2;
    const span = Math.hypot(w, h);
    for (let v = -span; v < span; v += cell) {
      for (let u = -span; u < span; u += cell) {
        const cx = (u + cell / 2) * c - (v + cell / 2) * c + w / 2;
        const cy = (u + cell / 2) * c + (v + cell / 2) * c + h / 2;
        if (cx < -cell || cy < -cell || cx > w + cell || cy > h + cell) continue;
        const [l, a] = lum(cx, cy);
        if (a < 0.5) continue;
        const dark = 1 - Math.min(1, Math.max(0, (l - 0.06) / 0.88));
        if (dark < 0.03) continue;
        const r = Math.sqrt(dark) * cell * 0.74;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
      }
    }
    // reines Schwarz scharf nachzeichnen
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const inkRgb = hexRgb(ink);
    for (let i = 0; i < w * h; i++) {
      const l = (0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2]) / 255;
      if (src[i * 4 + 3] > 200 && l < 0.1) {
        d[i * 4] = inkRgb[0];
        d[i * 4 + 1] = inkRgb[1];
        d[i * 4 + 2] = inkRgb[2];
        d[i * 4 + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, cell, ink]);
  return <canvas ref={ref} width={w} height={h} style={{ width: w, height: h, display: "block", ...style }} />;
};

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Kopfzeile wie in der Referenz: Kapitel links, Marke + Timecode rechts. */
export const Hud: React.FC<{ t: number; label: string; tone: "light" | "dark"; opacity?: number }> = ({
  t,
  label,
  tone,
  opacity = 1,
}) => {
  const fps = 60;
  const total = Math.floor(t * fps);
  const ff = String(total % fps).padStart(2, "0");
  const ss = String(Math.floor(total / fps) % 60).padStart(2, "0");
  const color = tone === "light" ? "rgba(8,12,17,0.4)" : "rgba(244,241,234,0.42)";
  const st: React.CSSProperties = {
    position: "absolute",
    top: 64,
    fontFamily: F.mono,
    fontSize: 21,
    letterSpacing: "0.04em",
    color,
    opacity,
    textTransform: "uppercase",
  };
  return (
    <>
      <div style={{ ...st, left: 64 }}>// {label}</div>
      <div style={{ ...st, right: 64 }}>
        REMOTE JOB KOMPASS&nbsp;&nbsp;00:00:{ss}:{ff}
      </div>
    </>
  );
};

/** Wachsender Kreis mit weicher, bewegungsunscharfer Kante (Szenenwechsel). */
export const CircleWipe: React.FC<{
  t: number;
  at: number;
  dur?: number;
  cx: number;
  cy: number;
  color: string;
  from?: number;
}> = ({ t, at, dur = 0.55, cx, cy, color, from = 0 }) => {
  if (t < at) return null;
  const pr = p(t, at, dur, E.inOut);
  const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 80;
  const r = from + (maxR - from) * pr;
  const speed = clamp01(1 - Math.abs(pr - 0.5) * 2);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: color,
        filter: pr < 1 ? `blur(${4 + speed * 26}px)` : undefined,
      }}
    />
  );
};

/** Dither-Kreis (Punktraster wächst von innen) – Übergang ins Dunkle wie in der Referenz. */
export const DotWipe: React.FC<{
  t: number;
  at: number;
  dur?: number;
  cx: number;
  cy: number;
  color: string;
  cell?: number;
}> = ({ t, at, dur = 0.6, cx, cy, color, cell = 22 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const pr = p(t, at, dur, E.inSoft);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    if (pr <= 0) return;
    const maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 300;
    const R = pr * maxR;
    const edge = 260;
    g.fillStyle = color;
    for (let y = 0; y < H + cell; y += cell) {
      for (let x = 0; x < W + cell; x += cell) {
        const d = Math.hypot(x + cell / 2 - cx, y + cell / 2 - cy);
        const k = (R - d) / edge;
        if (k <= 0) continue;
        if (k >= 1) {
          g.fillRect(x, y, cell, cell);
          continue;
        }
        const r = Math.sqrt(k) * cell * 0.72;
        g.beginPath();
        g.arc(x + cell / 2, y + cell / 2, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  });
  if (t < at) return null;
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />;
};

/** Mauszeiger (Referenz: Klick auf „Get it now“) */
export const Cursor: React.FC<{ x: number; y: number; press?: number; scale?: number }> = ({ x, y, press = 0, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale * (1 - press * 0.15)})`, transformOrigin: "0 0" }}>
    {press > 0 ? (
      <div
        style={{
          position: "absolute",
          left: -40,
          top: -40,
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: `4px solid ${C.needle}`,
          opacity: 1 - press,
          transform: `scale(${0.4 + press * 1.2})`,
        }}
      />
    ) : null}
    <svg width={46} height={56} viewBox="0 0 23 28">
      <path d="M1 1 L1 22 L6.5 16.8 L10.4 26 L14 24.4 L10.2 15.4 L17.6 15.4 Z" fill={C.ink} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  </div>
);
