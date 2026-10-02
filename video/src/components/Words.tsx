import React from "react";
import { C, F } from "../theme";
import { clamp01, E, p } from "../lib/anim";

/**
 * Kinetische Typo im Stil der Referenz: Jedes Wort steigt hinter einer Maske
 * auf (mit kurzer Unschärfe), Akzentwörter sind kursive Fraunces in Amber und
 * bekommen auf Wunsch eine handgezeichnete Unterstreichung.
 * `at` ist der Wortanfang im Voice-over – Bild und Stimme sind dadurch synchron.
 */
export type Tok = {
  text: string;
  at: number;
  accent?: boolean;
  underline?: boolean;
  color?: string;
  /** Größenfaktor relativ zur Zeile */
  k?: number;
  /** Wort kommt mit Einschlag statt Aufsteigen (Zahlen, „Nein.“) */
  slam?: boolean;
};

type Props = {
  t: number;
  lines: Tok[][];
  x: number;
  y: number;
  size: number;
  lineHeight?: number;
  color?: string;
  accentColor?: string;
  weight?: number;
  align?: "left" | "center";
  width?: number;
  exitAt?: number;
  exitDur?: number;
  /** Zeilenabstand je Zeile überschreiben (Faktor der Schriftgröße) */
  gaps?: number[];
  style?: React.CSSProperties;
};

const REVEAL = 0.42;

/** Handgezeichnete Unterstreichung, passt sich der Wortbreite an. */
export const Underline: React.FC<{ progress: number; color: string; thickness?: number; bottom?: number }> = ({
  progress,
  color,
  thickness = 7,
  bottom = -16,
}) => (
  <svg
    viewBox="0 0 100 26"
    preserveAspectRatio="none"
    style={{ position: "absolute", left: "2%", width: "98%", height: 26, bottom, overflow: "visible" }}
  >
    <path
      d="M 1 15 C 22 7, 48 21, 74 11 S 96 9, 100 13"
      fill="none"
      stroke={color}
      strokeWidth={thickness}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - progress}
    />
  </svg>
);

export const Words: React.FC<Props> = ({
  t,
  lines,
  x,
  y,
  size,
  lineHeight = 1.02,
  color = C.ink,
  accentColor = C.needleDeep,
  weight = 760,
  align = "left",
  width = 920,
  exitAt,
  exitDur = 0.32,
  gaps,
  style,
}) => {
  let wordIndex = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - width / 2 : x,
        top: y,
        width,
        textAlign: align,
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            justifyContent: align === "center" ? "center" : "flex-start",
            alignItems: "baseline",
            gap: size * 0.24,
            height: size * (gaps?.[li] ?? lineHeight),
          }}
        >
          {line.map((tok, ti) => {
            const idx = wordIndex++;
            const k = tok.k ?? (tok.accent ? 1.1 : 1);
            const fs = size * k;
            const pr = p(t, tok.at - 0.04, REVEAL, E.out);
            const ex = exitAt !== undefined ? p(t, exitAt + idx * 0.018, exitDur, E.in) : 0;
            if (t < tok.at - 0.05) return <span key={ti} style={{ width: 0 }} />;
            const blur = (1 - clamp01(pr * 1.4)) * 10 + ex * 14;
            let transform: string;
            if (tok.slam) {
              const s = 1 + (1 - p(t, tok.at - 0.02, 0.22, E.out)) * 0.9;
              transform = `scale(${s})`;
            } else {
              transform = `translateY(${(1 - pr) * 105}%) rotate(${tok.accent ? (1 - pr) * 6 : 0}deg)`;
            }
            const ul = tok.underline ? p(t, tok.at + 0.28, 0.45, E.smooth) : 0;
            return (
              <span
                key={ti}
                style={{
                  display: "inline-block",
                  flexShrink: 0,
                  overflow: tok.slam ? "visible" : "hidden",
                  padding: `${size * 0.1}px ${size * 0.08}px ${size * 0.16}px`,
                  margin: `${-size * 0.1}px ${-size * 0.08}px ${-size * 0.16}px`,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    transform: `${transform} translateY(${-ex * 50}px)`,
                    transformOrigin: "50% 80%",
                    opacity: (tok.slam ? clamp01(pr * 3) : 1) * (1 - ex),
                    filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                    fontFamily: tok.accent ? F.editorial : F.display,
                    fontStyle: tok.accent ? "italic" : "normal",
                    fontWeight: tok.accent ? 420 : weight,
                    fontVariationSettings: tok.accent ? "'opsz' 144, 'SOFT' 30" : undefined,
                    letterSpacing: tok.accent ? "-0.02em" : "-0.045em",
                    fontSize: fs,
                    lineHeight: 1,
                    color: tok.color ?? (tok.accent ? accentColor : color),
                    whiteSpace: "nowrap",
                    position: "relative",
                  }}
                >
                  {tok.text}
                  {tok.underline && ul > 0 ? (
                    <Underline progress={ul} color={tok.color ?? accentColor} thickness={Math.max(4, fs * 0.055)} />
                  ) : null}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
