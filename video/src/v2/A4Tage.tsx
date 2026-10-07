import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { F } from "../theme";
import { clamp01, E, hash, lerp, p, spring } from "../lib/anim";
import { Bokeh, Dawn, EndCard, Focus, Frame, Glass, N, Slug, Ticker, Title } from "./kit";
import TL from "./ads/a4.json";

const T = TL.t;

/* Beispielrechnung: 45 Min. × 2 × 5 Tage × 46 Wochen = 345 Std. ≈ 14,4 Tage */
const ROWS = [
  { at: T.m1, big: "45 Min.", label: "ARBEITSWEG" },
  { at: T.m2, big: "× 2", label: "HIN & ZURÜCK" },
  { at: T.m3, big: "× 5", label: "TAGE PRO WOCHE" },
  { at: T.m4, big: "× 46", label: "ARBEITSWOCHEN" },
];

const MathCard: React.FC<{ t: number }> = ({ t }) => (
  <Focus t={t} a={T.math} b={T.year + 0.2} rise={50}>
    <Slug t={t} at={T.math + 0.05} y={250} text="Beispielrechnung" />
    <div style={{ position: "absolute", left: 90, top: 320 }}>
      <Glass w={900} pad={48}>
        {ROWS.map((r, i) => {
          if (t < r.at) return <div key={i} style={{ height: 118 }} />;
          const s = spring(t, r.at, 3, 0.5);
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", height: 118, transform: `translateX(${(1 - s) * 60}px)`, opacity: clamp01(s * 2.5) }}>
              <span style={{ fontFamily: F.display, fontWeight: 760, fontSize: 96, letterSpacing: "-0.045em", color: N.cream }}>{r.big}</span>
              <span style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.1em", color: N.creamFaint }}>{r.label}</span>
            </div>
          );
        })}
        <div style={{ height: 3, background: "rgba(244,241,234,0.25)", margin: "14px 0 18px", transformOrigin: "0 50%", transform: `scaleX(${p(t, T.eq - 0.25, 0.35, E.out)})` }} />
        {t >= T.eq ? (
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 112, letterSpacing: "-0.05em", color: N.cream }}>
              = <Ticker t={t} at={T.eq} dur={0.8} to={345} /> Std.
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 22, letterSpacing: "0.1em", color: N.creamFaint }}>PRO JAHR</span>
          </div>
        ) : null}
        {t >= T.days ? (
          <div
            style={{
              marginTop: 10,
              fontFamily: F.editorial,
              fontStyle: "italic",
              fontSize: 120,
              color: N.amberHot,
              textShadow: "0 0 40px rgba(232,163,61,0.6)",
              transform: `scale(${lerp(1.4, 1, spring(t, T.days, 3, 0.45))})`,
              transformOrigin: "0 50%",
              opacity: clamp01((t - T.days) * 5),
            }}
          >
            ≈ 14 Tage
          </div>
        ) : null}
      </Glass>
    </div>
  </Focus>
);

/* Jahreskalender: 365 Felder, 14 davon leuchten auf */
const COLS = 19;
const CELL = 40;
const GAP = 8;
const GX = (1080 - (COLS * (CELL + GAP) - GAP)) / 2;
const GY = 380;
const LIT = (() => {
  const s = new Set<number>();
  let k = 0;
  while (s.size < 14) s.add(Math.floor(hash(k++ * 13.7 + 2) * 365));
  return [...s];
})();

const Year: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.year - 0.1 || t > T.moments + 1) return null;
  const out = p(t, T.moments - 0.3, 0.7, E.in);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, filter: out > 0.02 ? `blur(${out * 14}px)` : undefined, transform: `scale(${1 + out * 0.08})` }}>
      {Array.from({ length: 365 }, (_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        const appear = p(t, T.year + (c + r) * 0.018, 0.35, E.out);
        const li = LIT.indexOf(i);
        const lit = li >= 0 ? p(t, T.glow + li * 0.11, 0.25, E.out) : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: GX + c * (CELL + GAP),
              top: GY + r * (CELL + GAP),
              width: CELL,
              height: CELL,
              borderRadius: 9,
              background: lit > 0 ? `rgba(255,190,92,${0.25 + 0.75 * lit})` : "rgba(244,241,234,0.09)",
              border: lit > 0 ? "none" : "1px solid rgba(244,241,234,0.08)",
              boxShadow: lit > 0 ? `0 0 ${24 * lit}px rgba(255,170,70,${0.8 * lit})` : undefined,
              transform: `scale(${appear * (1 + lit * 0.15)})`,
              opacity: appear,
            }}
          />
        );
      })}
    </div>
  );
};

const MOMENTS = [
  ["☕\uFE0F", "Frühstück ohne Hektik"],
  ["🏃", "Laufen am Morgen"],
  ["🍝", "Abendessen. Zusammen."],
  ["📖", "Gute-Nacht-Geschichten"],
  ["🌅", "Zeit nur für dich"],
];

const Moments: React.FC<{ t: number }> = ({ t }) => (
  <Focus t={t} a={T.moments} b={T.back + 0.1}>
    {MOMENTS.map(([e, txt], i) => {
      const at = T.moments + 0.5 + i * 0.55;
      if (t < at) return null;
      const s = spring(t, at, 2.4, 0.55);
      const fl = Math.sin((t - at) * 1.6 + i) * 6;
      return (
        <div key={i} style={{ position: "absolute", left: i % 2 ? 150 : 90, top: 560 + i * 132 + fl, transform: `scale(${lerp(0.7, 1, s)})`, opacity: clamp01(s * 2) }}>
          <Glass w={i % 2 ? 840 : 900} pad={26} radius={999} style={{ display: "flex", alignItems: "center", gap: 22, background: "linear-gradient(160deg, rgba(255,214,150,0.18), rgba(255,255,255,0.05))", border: "1.5px solid rgba(255,214,150,0.28)" }}>
            <span style={{ fontSize: 52, fontFamily: "'Noto Color Emoji', sans-serif" }}>{e}</span>
            <span style={{ fontFamily: F.editorial, fontSize: 50, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{txt}</span>
          </Glass>
        </div>
      );
    })}
  </Focus>
);

export const A4Tage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <Frame t={t} bg="#05070a">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #141d2b 0%, #070a0f 60%, #030405 100%)" }} />
      <Bokeh t={t} n={14} color="255,190,120" opacity={0.3} seed={8} />
      <Dawn t={t} at={T.moments} dur={3} y={1650} />

      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.07, 1, p(t, 0, 3.2, E.out))})` }}>
        <Title t={t} at={-1.2} out={T.math - 0.4} y={420} size={250} lines={[[{ text: "14", accent: true }, { text: " Tage." }]]} stagger={0.05} dur={0.8} />
      </div>
      <Title t={t} at={T.sub} out={T.math - 0.4} y={760} size={64} lines={[[{ text: "So viel Lebenszeit kostet" }], [{ text: "ein Arbeitsweg von 45 Minuten." }]]} color={N.creamDim} stagger={0.012} glow={false} />
      <Slug t={t} at={T.sub + 1.2} out={T.math - 0.4} y={940} text="Pro Jahr" color="rgba(255,214,150,0.75)" />

      <MathCard t={t} />
      <Title t={t} at={T.year - 0.1} out={T.moments - 0.4} y={240} size={84} lines={[[{ text: "Jedes " }, { text: "Jahr.", accent: true }]]} stagger={0.025} />
      <Year t={t} />
      {t > T.glow ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1360, textAlign: "center", opacity: p(t, T.glow + 1.4, 0.5, E.out) * (1 - p(t, T.moments - 0.3, 0.5, E.in)), fontFamily: F.editorial, fontSize: 54, color: N.amberHot }}>
          14 Tage, die dir gehören könnten.
        </div>
      ) : null}

      <Title t={t} at={T.moments} out={T.back - 0.4} y={300} size={86} lines={[[{ text: "Was würdest du" }], [{ text: "damit " }, { text: "anfangen?", accent: true }]]} stagger={0.02} />
      <Moments t={t} />
      <Title t={t} at={T.back} out={T.end - 0.35} y={700} size={140} lines={[[{ text: "Hol sie dir" }], [{ text: "zurück.", accent: true }]]} stagger={0.035} />
      {t > T.end - 0.3 ? <div style={{ position: "absolute", inset: 0, background: "#05070a", opacity: p(t, T.end - 0.3, 0.4, E.inOut) * 0.7 }} /> : null}
      <EndCard t={t} at={T.end} tagline={[{ text: "Dein Weg zur " }, { text: "Remote-Arbeit.", accent: true }]} />
    </Frame>
  );
};
