import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { F } from "../theme";
import { clamp01, E, lerp, noise1, p, spring } from "../lib/anim";
import { Bokeh, Dawn, EndCard, Frame, Glass, N, Title, Topo } from "./kit";
import TL from "./ads/a2.json";

const T = TL.t;

/** Nadelwinkel: Chaos → Abbremsen → Einrasten auf Nord (mit Überschwingen). */
const needleAt = (t: number) => {
  const chaos = (x: number) => x * 520 + noise1(x * 1.9, 4) * 220 + Math.sin(x * 7.3) * 30;
  if (t < T.hush) return chaos(t);
  const h = chaos(T.hush);
  if (t < T.lock) return h + (t - T.hush) * 260 * (1 - (t - T.hush) / (T.lock - T.hush));
  const startA = h + (T.lock - T.hush) * 130;
  let wrapped = ((startA % 360) + 540) % 360 - 180;
  if (Math.abs(wrapped) < 60) wrapped += 360;
  return wrapped * (1 - spring(t, T.lock, 2.6, 0.32));
};

const Compass: React.FC<{ t: number; size: number; glow: number }> = ({ t, size, glow }) => {
  const a = needleAt(t);
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{ overflow: "visible", filter: `drop-shadow(0 40px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 ${40 * glow}px rgba(232,163,61,${0.7 * glow}))` }}>
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe2a8" />
          <stop offset="0.35" stopColor="#c9922f" />
          <stop offset="0.6" stopColor="#7a5418" />
          <stop offset="1" stopColor="#e8b45a" />
        </linearGradient>
        <radialGradient id="dial" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#1b2533" />
          <stop offset="1" stopColor="#070a0f" />
        </radialGradient>
        <linearGradient id="north" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffbe5c" />
          <stop offset="1" stopColor="#c9831f" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#brass)" />
      <circle cx="200" cy="200" r="182" fill="url(#dial)" />
      {ticks.map((i) => (
        <path
          key={i}
          d={i % 6 === 0 ? "M200 24 v18" : "M200 24 v9"}
          stroke={i % 18 === 0 ? "#ffbe5c" : "rgba(244,241,234,0.45)"}
          strokeWidth={i % 6 === 0 ? 2.4 : 1.2}
          transform={`rotate(${i * 5} 200 200)`}
        />
      ))}
      {[
        ["N", 0],
        ["O", 90],
        ["S", 180],
        ["W", 270],
      ].map(([l, r]) => (
        <text
          key={l as string}
          x="200"
          y="70"
          textAnchor="middle"
          fontFamily="Fraunces, serif"
          fontSize="30"
          fill={l === "N" ? "#ffbe5c" : "rgba(244,241,234,0.75)"}
          transform={`rotate(${r} 200 200)`}
        >
          {l}
        </text>
      ))}
      <circle cx="200" cy="200" r="110" fill="none" stroke="rgba(244,241,234,0.12)" strokeWidth="1" />
      <g transform={`rotate(${a} 200 200)`}>
        <path d="M200 52 L222 200 L200 214 L178 200 Z" fill="url(#north)" />
        <path d="M200 348 L222 200 L200 186 L178 200 Z" fill="#e9e4d8" />
        <path d="M200 52 L200 214 L178 200 Z" fill="rgba(0,0,0,0.18)" />
        <path d="M200 348 L200 186 L178 200 Z" fill="rgba(0,0,0,0.12)" />
      </g>
      <circle cx="200" cy="200" r="16" fill="url(#brass)" />
      <circle cx="200" cy="200" r="6" fill="#0b0f15" />
      {/* Glasreflex */}
      <path d="M70 130 A150 150 0 0 1 250 52 A170 170 0 0 0 70 170 Z" fill="rgba(255,255,255,0.07)" />
    </svg>
  );
};

const WORDS = ["Jobbörsen", "Absagen", "Lebenslauf", "Homeoffice?", "Anschreiben", "Quereinstieg?", "Gehalt?", "Profil"];

const Orbit: React.FC<{ t: number; fade: number }> = ({ t, fade }) => (
  <>
    {WORDS.map((w, i) => {
      const ang = (i / WORDS.length) * Math.PI * 2 + t * (1.1 + (i % 3) * 0.25);
      const rx = 360 + (i % 2) * 30;
      const ry = 170 + (i % 3) * 30;
      const depth = Math.sin(ang);
      const x = 540 + Math.cos(ang) * rx;
      const y = 900 + depth * ry - 40;
      const s = 0.75 + 0.35 * (depth + 1) / 2;
      const o = (0.25 + 0.75 * (depth + 1) / 2) * (1 - fade);
      return (
        <div
          key={w}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(-50%, -50%) scale(${s})`,
            fontFamily: F.display,
            fontWeight: 650,
            fontSize: 46,
            letterSpacing: "-0.02em",
            color: w === "Absagen" ? N.amber : N.cream,
            opacity: o,
            filter: depth < -0.2 ? `blur(${(-depth - 0.2) * 8}px)` : undefined,
            zIndex: depth > 0 ? 3 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {w}
        </div>
      );
    })}
  </>
);

/** Verirrter Pfad: Schleifen auf der Karte, kehrt zum Start zurück. */
const lostPath = (n = 240) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * Math.PI * 2;
    const r = 260 + 90 * Math.sin(3 * s) + 40 * Math.sin(7 * s + 1);
    pts.push([540 + Math.cos(s * 2 - Math.PI / 2) * r * 0.9, 700 + Math.sin(s * 2 - Math.PI / 2) * r * 0.75]);
  }
  return pts;
};
const LOST = lostPath();

/** Route von unten nach oben durch vier Wegpunkte. */
const ROUTE_H = 2600;
const routePts = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 300; i++) {
    const s = i / 300;
    pts.push([540 + Math.sin(s * Math.PI * 2.4 + 0.4) * 250 * (1 - s * 0.4), ROUTE_H - 260 - s * (ROUTE_H - 620)]);
  }
  return pts;
})();
const cumLen = (() => {
  const c = [0];
  for (let i = 1; i < routePts.length; i++)
    c.push(c[i - 1] + Math.hypot(routePts[i][0] - routePts[i - 1][0], routePts[i][1] - routePts[i - 1][1]));
  return c;
})();
const TOTAL = cumLen[cumLen.length - 1];
const pointAt = (s: number) => routePts[Math.round(clamp01(s) * 300)];
const toD = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

const WP = [
  { s: 0.18, n: "01", title: "Kurs bestimmen", sub: "Welche Rollen wirklich passen" },
  { s: 0.42, n: "02", title: "Karte lesen", sub: "Quellen jenseits der großen Portale" },
  { s: 0.66, n: "03", title: "Route planen", sub: "Unterlagen mit Remote-Signalen" },
  { s: 0.9, n: "04", title: "Ankommen", sub: "Fester Rhythmus, echte Zahlen" },
];

const Route: React.FC<{ t: number }> = ({ t }) => {
  const prog = lerp(0, 1, E.inOut(clamp01((t - T.route) / (T.arrive - T.route - 0.1))));
  const head = pointAt(prog);
  // Kamera folgt der Spitze der Route
  // Kamera hält die Spitze der Route auf Bildhöhe ~1050
  const top = Math.min(200, Math.max(1920 - ROUTE_H - 100, 1050 - head[1]));
  const leave = p(t, T.end - 0.4, 0.5, E.in);
  const settle = p(t, T.arrive - 0.15, 0.6, E.inOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - leave) * p(t, T.route - 0.2, 0.5, E.out) * (1 - settle * 0.55), filter: settle > 0.02 ? `blur(${settle * 5}px)` : undefined }}>
      <div style={{ position: "absolute", left: 0, top, width: 1080, height: ROUTE_H }}>
        <svg width={1080} height={ROUTE_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={toD(routePts)} fill="none" stroke="rgba(244,241,234,0.14)" strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" />
          <path
            d={toD(routePts)}
            fill="none"
            stroke="#ffbe5c"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={TOTAL}
            strokeDashoffset={TOTAL * (1 - prog)}
            style={{ filter: "drop-shadow(0 0 14px rgba(232,163,61,0.9))" }}
          />
          <circle cx={head[0]} cy={head[1]} r={18} fill="#fff4dc" style={{ filter: "drop-shadow(0 0 22px rgba(255,190,92,1))" }} />
          {/* Start */}
          <circle cx={routePts[0][0]} cy={routePts[0][1]} r={12} fill={N.cream} />
          <text x={routePts[0][0] + 26} y={routePts[0][1] + 10} fontFamily="JetBrains Mono, monospace" fontSize={26} fill="rgba(244,241,234,0.6)">
            DU · HEUTE
          </text>
        </svg>
        {WP.map((w, i) => {
          const [x, y] = pointAt(w.s);
          const on = prog >= w.s;
          const at = T.route + (w.s * (T.arrive - T.route - 0.1));
          const sp = on ? spring(t, at, 2.4, 0.55) : 0;
          const right = x < 540;
          return (
            <React.Fragment key={w.n}>
              <div
                style={{
                  position: "absolute",
                  left: x - 26,
                  top: y - 26,
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: on ? N.amber : "rgba(244,241,234,0.15)",
                  border: `3px solid ${on ? "#fff4dc" : "rgba(244,241,234,0.3)"}`,
                  boxShadow: on ? "0 0 40px rgba(232,163,61,0.9)" : undefined,
                  transform: `scale(${on ? lerp(0.6, 1, sp) : 0.7})`,
                }}
              />
              {on ? (
                <div style={{ position: "absolute", left: right ? x + 50 : x - 50 - 470, top: y - 72, transform: `translateX(${(1 - sp) * (right ? -40 : 40)}px)`, opacity: clamp01(sp * 2) }}>
                  <Glass w={470} pad={24} radius={28}>
                    <div style={{ fontFamily: F.mono, fontSize: 21, color: N.amber, letterSpacing: "0.1em" }}>ETAPPE {w.n}</div>
                    <div style={{ fontFamily: F.editorial, fontSize: 46, marginTop: 4, letterSpacing: "-0.02em" }}>{w.title}</div>
                    <div style={{ fontSize: 24, color: N.creamDim, marginTop: 4 }}>{w.sub}</div>
                  </Glass>
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
        {/* Ziel */}
        {(() => {
          const [x, y] = routePts[300];
          const on = prog > 0.985;
          const sp = on ? spring(t, T.arrive - 0.1, 2.2, 0.5) : 0;
          return (
            <div style={{ position: "absolute", left: x - 160, top: y - 210, width: 320, textAlign: "center", opacity: 0.35 + 0.65 * sp }}>
              <div style={{ fontSize: 96, transform: `scale(${0.7 + 0.3 * sp})`, filter: `drop-shadow(0 0 ${30 * sp}px rgba(255,190,92,1))` }}>⚑</div>
              <div style={{ fontFamily: F.display, fontWeight: 760, fontSize: 40, color: on ? N.amberHot : N.creamDim, letterSpacing: "-0.02em" }}>Remote-Job</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export const A2Kompass: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Kompass: groß im Zentrum → in der Kartenphase klein oben rechts → zum Einrasten zurück → verschwindet
  const toMap = p(t, T.map - 0.2, 0.7, E.inOut);
  const back = p(t, T.hush - 0.15, 0.45, E.inOut);
  const gone = p(t, T.route - 0.3, 0.6, E.inOut);
  const cx = lerp(lerp(540, 860, toMap), 540, back);
  const cy = lerp(lerp(900, 330, toMap), 900, back) - gone * 520;
  const size = lerp(lerp(620, 240, toMap), 640, back) * (1 - gone * 0.55);
  const lockGlow = p(t, T.lock, 0.25, E.out) * (1 - p(t, T.lock + 1.2, 1.2, E.smooth) * 0.6);
  const shake = t > T.lock && t < T.lock + 0.4 ? Math.sin((t - T.lock) * 90) * 10 * (1 - (t - T.lock) / 0.4) : 0;
  const spinBlur = t < T.hush ? 1.5 : 0;

  // Karte, auf der man im Kreis läuft
  const tilt = p(t, T.map - 0.1, 0.9, E.out);
  const mapOut = p(t, T.hush - 0.2, 0.4, E.in);
  const walk = clamp01((t - T.map) / (T.hush - T.map - 0.2));
  const walkN = Math.floor(walk * (LOST.length - 1));
  const walker = LOST[walkN];
  const ring = t > T.lock ? p(t, T.lock, 0.9, E.out) : 0;

  return (
    <Frame t={t} bg="#06090e">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, #121c2a 0%, #070a0f 60%, #040507 100%)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
        <Topo t={t} levels={12} speed={0.06} color="rgba(244,241,234,0.09)" highlight={p(t, T.route, 1.5, E.smooth) * 0.6} />
      </div>
      <Bokeh t={t} n={12} color="255,190,120" opacity={0.35} seed={4} />

      {/* 1: Im Kreis */}
      <Title t={t} at={T.l1} out={T.l2 - 0.25} y={290} size={96} lines={[[{ text: "Du bewirbst dich." }]]} stagger={0.016} dur={0.5} />
      <Title t={t} at={T.l2} out={T.l3 - 0.25} y={290} size={96} lines={[[{ text: "Und bewirbst dich." }]]} stagger={0.016} dur={0.5} />
      <Title t={t} at={T.l3} out={T.circle - 0.25} y={290} size={96} lines={[[{ text: "Und bewirbst dich …" }]]} stagger={0.016} dur={0.5} />
      <Title t={t} at={T.circle} out={T.map - 0.1} y={250} size={104} lines={[[{ text: "Und drehst dich" }], [{ text: "im Kreis.", accent: true }]]} stagger={0.03} />
      {t < T.map + 0.6 ? <Orbit t={t} fade={p(t, T.map - 0.3, 0.5, E.in)} /> : null}

      {/* 2: Karte in 3D, Pfad in Schleifen */}
      {t > T.map - 0.2 && t < T.hush + 0.3 ? (
        <div style={{ position: "absolute", inset: 0, opacity: tilt * (1 - mapOut), perspective: 1400 }}>
          <div style={{ position: "absolute", left: 0, top: 380, width: 1080, height: 1400, transform: `rotateX(${lerp(0, 52, tilt)}deg)`, transformOrigin: "50% 40%" }}>
            <Topo t={t} w={1080} h={1400} levels={14} color="rgba(244,241,234,0.22)" seed={7} speed={0.02} />
            <svg width={1080} height={1400} style={{ position: "absolute", inset: 0 }}>
              <path d={toD(LOST.slice(0, walkN + 1))} fill="none" stroke="rgba(244,241,234,0.75)" strokeWidth={5} strokeDasharray="10 12" strokeLinecap="round" />
              <circle cx={walker[0]} cy={walker[1]} r={16} fill={N.amber} style={{ filter: "drop-shadow(0 0 16px rgba(232,163,61,0.9))" }} />
              <circle cx={LOST[0][0]} cy={LOST[0][1]} r={10} fill="none" stroke={N.cream} strokeWidth={3} />
            </svg>
          </div>
        </div>
      ) : null}
      <Title t={t} at={T.lost} out={T.hush - 0.3} y={1270} size={86} lines={[[{ text: "Ohne Richtung kommst" }], [{ text: "du " }, { text: "nirgends", accent: true }, { text: " an." }]]} stagger={0.018} />

      {/* Kompass */}
      {gone < 1 ? (
        <div style={{ position: "absolute", left: cx - size / 2 + shake, top: cy - size / 2, opacity: 1 - gone, filter: spinBlur && t < T.hush - 0.2 ? undefined : undefined }}>
          <Compass t={t} size={size} glow={lockGlow} />
        </div>
      ) : null}
      {/* Schockwelle beim Einrasten */}
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 350 - ring * 500,
            top: 900 - 350 - ring * 500,
            width: 700 + ring * 1000,
            height: 700 + ring * 1000,
            borderRadius: "50%",
            border: `${6 * (1 - ring) + 1}px solid rgba(255,190,92,${0.9 * (1 - ring)})`,
            boxShadow: `0 0 60px rgba(255,190,92,${0.6 * (1 - ring)})`,
          }}
        />
      ) : null}
      {t > T.lock && t < T.lock + 0.25 ? <div style={{ position: "absolute", inset: 0, background: "#fff4dc", opacity: 0.35 * (1 - (t - T.lock) / 0.25) }} /> : null}
      <Title t={t} at={T.until} out={T.route - 0.3} y={1300} size={104} lines={[[{ text: "Bis du weißt," }], [{ text: "wohin.", accent: true }]]} stagger={0.03} />

      {/* 3: Route durch vier Etappen */}
      {t > T.route - 0.3 ? <Route t={t} /> : null}
      <Dawn t={t} at={T.arrive - 0.6} dur={2} y={1600} strength={0.9} />
      <Title t={t} at={T.arrive} out={T.end - 0.4} y={760} size={110} lines={[[{ text: "Nicht mehr suchen." }], [{ text: "Ankommen.", accent: true }]]} stagger={0.025} />
      {t > T.end - 0.3 ? <div style={{ position: "absolute", inset: 0, background: "#06090e", opacity: p(t, T.end - 0.3, 0.4, E.inOut) * 0.75 }} /> : null}
      <EndCard t={t} at={T.end} tagline={[{ text: "Ein klarer Kurs zum " }, { text: "Remote-Job.", accent: true }]} />
    </Frame>
  );
};
