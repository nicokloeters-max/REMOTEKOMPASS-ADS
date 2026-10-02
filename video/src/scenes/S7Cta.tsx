import React from "react";
import { C, F } from "../theme";
import { clamp01, E, hash, lerp, p, spring } from "../lib/anim";
import { L, S, W } from "../tl";
import { brand } from "../content";
import { Book3D } from "../components/Book";
import { Cursor } from "../components/ui";

const w = (i: number) => W("cta", i).s;
export const LOGO_BASE = 742;

/** Logo: Buchstaben fallen einzeln ein und federn nach (Referenz: „Pocketsflow“). */
const Logo: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const parts = [
    { s: "Remote Job ", italic: false },
    { s: "Kompass", italic: true },
  ];
  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: LOGO_BASE - 112,
        textAlign: "center",
        fontFamily: F.editorial,
        fontSize: 118,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: C.ink,
        whiteSpace: "pre",
      }}
    >
      {parts.map((part, pi) => (
        <span key={pi} style={{ fontStyle: part.italic ? "italic" : "normal", fontWeight: part.italic ? 440 : 520, color: part.italic ? C.needleDeep : C.ink, fontVariationSettings: "'opsz' 144" }}>
          {part.s.split("").map((ch, i) => {
            const d = at + k++ * 0.035;
            const sp = spring(t, d, 2.8, 0.42);
            const jitter = (hash(k * 3.1) - 0.5) * 24;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  transform: `translateY(${(1 - sp) * -160}px) rotate(${(1 - sp) * jitter}deg)`,
                  opacity: clamp01((t - d) * 8),
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

export const S7Cta: React.FC<{ t: number }> = ({ t }) => {
  const logoAt = Math.max(S.cta.a + 0.32, w(0) - 0.05);
  const tagP = p(t, w(2), 0.5, E.out);
  const bookSp = spring(t, w(3) - 0.1, 2, 0.5);
  const priceSp = spring(t, w(4), 3, 0.42);
  const aboP = p(t, w(6), 0.4, E.out);
  const btnSp = spring(t, w(8) - 0.05, 2.6, 0.5);
  const click = w(11);
  const press = t > click ? clamp01((t - click) / 0.3) : 0;
  const btnScale = 1 - (t > click && t < click + 0.15 ? Math.sin(((t - click) / 0.15) * Math.PI) * 0.06 : 0) + Math.sin(t * 5) * 0.012 * clamp01(t - click);
  const cursorP = p(t, click - 0.55, 0.5, E.out);
  const arrow = Math.sin(t * 7) * 10;
  const endHold = t > L("cta").end;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Logo t={t} at={logoAt} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: LOGO_BASE + 28,
          textAlign: "center",
          fontFamily: F.sans,
          fontSize: 38,
          color: "rgba(8,12,17,0.72)",
          opacity: tagP,
          transform: `translateY(${(1 - tagP) * 20}px)`,
        }}
      >
        {brand.tagline[0]}{" "}
        <span style={{ fontFamily: F.editorial, fontStyle: "italic", fontSize: 42, color: C.ink }}>{brand.tagline[1]}</span>
      </div>

      {/* Buch + Preis */}
      <div style={{ position: "absolute", left: 130, top: 862, transform: `translateX(${(1 - bookSp) * -400}px) rotate(${-6 + (1 - bookSp) * -20}deg)`, opacity: clamp01(bookSp * 2) }}>
        <div style={{ filter: "drop-shadow(0 26px 30px rgba(8,12,17,0.3))" }}>
          <Book3D w={185} ry={-22} rx={4} roseRot={t * 30} shine={clamp01((t - w(3)) / 1.4)} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 420, top: 880 }}>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 820,
            fontSize: 188,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: C.ink,
            transform: `scale(${lerp(1.6, 1, priceSp)})`,
            transformOrigin: "0 60%",
            opacity: clamp01(priceSp * 3),
            filter: priceSp < 0.6 ? `blur(${(0.6 - priceSp) * 20}px)` : undefined,
          }}
        >
          {brand.price}
          <span style={{ fontSize: 120, color: C.needleDeep, marginLeft: 6 }}>{brand.currency}</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 14, opacity: aboP, transform: `translateY(${(1 - aboP) * 16}px)` }}>
          {["einmalig", "kein Abo", "sofort"].map((s, i) => (
            <span
              key={s}
              style={{
                fontFamily: F.sans,
                fontWeight: 600,
                fontSize: 26,
                padding: "8px 16px",
                borderRadius: 999,
                border: `2px solid ${i === 1 ? C.needle : "rgba(8,12,17,0.16)"}`,
                background: i === 1 ? "rgba(232,163,61,0.18)" : "transparent",
                color: C.ink,
                opacity: clamp01((t - w(6) - i * 0.12) * 5),
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Button */}
      <div
        style={{
          position: "absolute",
          left: 540 - 330,
          top: 1140,
          width: 660,
          height: 116,
          borderRadius: 999,
          background: C.needle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: F.display,
          fontWeight: 780,
          fontSize: 48,
          letterSpacing: "-0.02em",
          color: C.ink,
          transform: `scale(${btnSp * btnScale})`,
          opacity: clamp01(btnSp * 2),
          boxShadow: `0 18px 40px -12px rgba(201,131,31,0.7), 0 0 0 ${press * 22}px rgba(232,163,61,${0.35 * (1 - press)})`,
        }}
      >
        {brand.cta} <span style={{ fontSize: 52 }}>→</span>
      </div>
      {cursorP > 0 ? <Cursor x={lerp(900, 640, cursorP)} y={lerp(1400, 1194, cursorP)} press={press} /> : null}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1290 + arrow * 0.4,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 26,
          color: "rgba(8,12,17,0.55)",
          opacity: p(t, w(9), 0.4, E.out),
        }}
      >
        ↓ {brand.linkHint}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1350,
          textAlign: "center",
          fontFamily: F.mono,
          fontSize: 20,
          color: "rgba(8,12,17,0.38)",
          opacity: endHold ? p(t, L("cta").end, 0.5, E.out) : 0,
        }}
      >
        {brand.delivery}
      </div>
    </div>
  );
};
