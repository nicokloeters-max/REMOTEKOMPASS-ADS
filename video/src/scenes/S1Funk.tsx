import React from "react";
import { C, F } from "../theme";
import { clamp01, E, lerp, map, p } from "../lib/anim";
import { S, W } from "../tl";
import { Words } from "../components/Words";
import { Blur, Card, Chip, HalftoneArt } from "../components/ui";
import { drawMail } from "../components/icons";

/** Fluchtpunkt, in dem die Bewerbungen verschwinden – aus ihm öffnet sich Szene 2. */
export const VP = { x: 950, y: 300 };

const SENT = [0.0, 0.42, 0.84];

const SentCard: React.FC<{ t: number; at: number; n: number }> = ({ t, at, n }) => {
  if (t < at - 0.02) return null;
  const pr = p(t, at, 1.15, E.inSoft);
  if (pr >= 1) return null;
  const x0 = 470;
  const y0 = 1180;
  const x = lerp(x0, VP.x - 150, pr);
  const y = lerp(y0, VP.y - 40, pr);
  const s = lerp(1, 0.04, pr);
  const v = map(t, at, at + 1.15, 0, 1, E.linear);
  const blurY = 6 + pr * 14;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s}) rotate(${-8 + pr * 20}deg)`, transformOrigin: "50% 50%", opacity: 1 - clamp01((pr - 0.85) / 0.15) }}>
      <Blur x={blurY * 0.5} y={blurY * v}>
        <Card w={300} h={92} pad={18} style={{ borderRadius: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width={38} height={38} viewBox="0 0 24 24">
              <path d="M2 11 L22 2 L15 22 L11 13 Z" fill={C.ink} />
              <path d="M11 13 L22 2" stroke="#fff" strokeWidth={1.5} />
            </svg>
            <div>
              <div style={{ fontFamily: F.sans, fontWeight: 650, fontSize: 22, color: C.ink }}>Bewerbung #{n}</div>
              <div style={{ fontFamily: F.mono, fontSize: 17, color: C.mute }}>gesendet ✓</div>
            </div>
          </div>
        </Card>
      </Blur>
    </div>
  );
};

const RejectCard: React.FC<{ t: number; at: number; i: number; dim: number; out: number }> = ({ t, at, i, dim, out }) => {
  if (t < at) return null;
  const pr = p(t, at, 0.22, E.out);
  const s = lerp(1.7, 1, pr);
  const blur = (1 - pr) * 18;
  const rot = [-7, 4, -2][i];
  const x = 520 + i * 26;
  const y = 990 + i * 84;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + out * 500,
        transform: `rotate(${rot + out * 18}deg) scale(${s})`,
        transformOrigin: "50% 50%",
        opacity: clamp01(pr * 3) * (1 - dim * 0.65) * (1 - out),
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}
    >
      <Card w={480} h={150} pad={20}>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <HalftoneArt w={86} h={70} cell={5} draw={drawMail} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Chip bg={C.ink} style={{ fontSize: 18, padding: "5px 12px" }}>
                ABSAGE
              </Chip>
              <span style={{ fontFamily: F.mono, fontSize: 17, color: C.mute }}>Re: Ihre Bewerbung</span>
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 22, color: C.ink, marginTop: 10, lineHeight: 1.3 }}>
              „Leider müssen wir Ihnen mitteilen, dass wir uns …“
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Inbox: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at) return null;
  const pr = p(t, at, 0.5, E.out);
  const spin = (t - at) * 300;
  return (
    <div style={{ position: "absolute", left: 540, top: 1010, transform: `translateY(${(1 - pr) * 60}px)`, opacity: pr }}>
      <Card w={470} h={190} label="// posteingang" num="↻">
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={52} height={52} viewBox="0 0 24 24" style={{ transform: `rotate(${spin}deg)` }}>
            <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M20 4v5h-5" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 760, fontSize: 44, letterSpacing: "-0.03em", color: C.ink }}>0 neue</div>
            <div style={{ fontFamily: F.sans, fontSize: 24, color: C.mute }}>Nachrichten · seit 23 Tagen</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const S1Funk: React.FC<{ t: number }> = ({ t }) => {
  const w = (i: number) => W("funk", i).s;
  const absage = w(2);
  const funk = w(6);
  // alles wird zum Schluss in den Fluchtpunkt gesogen
  const suck = p(t, S.funk.b - 0.42, 0.42, E.in);
  const dim = p(t, funk - 0.05, 0.4, E.smooth);
  const out = p(t, funk + 0.15, 0.5, E.in);
  const big = lerp(1.06, 1, p(t, 0, 0.6, E.out));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: `${VP.x}px ${VP.y}px`,
        transform: `scale(${1 - suck * 0.85})`,
        opacity: 1 - clamp01((suck - 0.6) / 0.4),
        filter: suck > 0.02 ? `blur(${suck * 16}px)` : undefined,
      }}
    >
      {/* 47 – ab dem ersten Bild sichtbar (Vorschaubild) */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 205,
          fontFamily: F.display,
          fontWeight: 820,
          fontSize: 430,
          lineHeight: 1,
          letterSpacing: "-0.07em",
          color: C.ink,
          transform: `scale(${big})`,
          transformOrigin: "0 50%",
        }}
      >
        47
      </div>
      <Words
        t={t}
        x={72}
        y={612}
        size={100}
        gaps={[1.12, 1.12, 1.2]}
        lines={[
          [{ text: "Bewerbungen.", at: w(1) }],
          [
            { text: "3", at: w(2), slam: true },
            { text: "Absagen.", at: w(3) },
          ],
          [
            { text: "44×", at: w(5), slam: true },
            { text: "Funkstille.", at: funk, accent: true, underline: true, k: 1.18 },
          ],
        ]}
      />
      {SENT.map((at, i) => (
        <SentCard key={i} t={t} at={at} n={45 + i} />
      ))}
      {[0, 1, 2].map((i) => (
        <RejectCard key={i} t={t} at={absage + i * 0.17} i={i} dim={dim} out={out} />
      ))}
      <Inbox t={t} at={funk + 0.25} />
    </div>
  );
};
