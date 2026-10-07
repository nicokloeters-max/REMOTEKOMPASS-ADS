import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { F } from "../theme";
import { clamp01, E, keys, lerp, p, spring } from "../lib/anim";
import { Book3D } from "../components/Book";
import { Bokeh, Dawn, EndCard, Frame, Glass, N, Slug, Title } from "./kit";
import TL from "./ads/a5.json";

const T = TL.t;

const Avatar: React.FC<{ label: string; warm?: boolean; size?: number }> = ({ label, warm, size = 72 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      flex: "none",
      background: warm ? "linear-gradient(160deg, #ffc56b, #c9831f)" : "rgba(244,241,234,0.14)",
      color: warm ? N.night : N.creamDim,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: F.display,
      fontWeight: 800,
      fontSize: size * 0.38,
    }}
  >
    {label}
  </div>
);

const Row: React.FC<{ from: string; subject: string; preview: string; when: string; unread?: boolean; warm?: boolean; avatar: string; dim?: number }> = ({
  from,
  subject,
  preview,
  when,
  unread,
  warm,
  avatar,
  dim = 0,
}) => (
  <div style={{ display: "flex", gap: 22, padding: "26px 0", borderBottom: "1.5px solid rgba(255,255,255,0.07)", opacity: 1 - dim }}>
    <Avatar label={avatar} warm={warm} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: unread ? 750 : 500, fontSize: 32, color: unread ? N.cream : N.creamDim }}>{from}</span>
        <span style={{ fontSize: 24, color: unread ? N.amber : N.creamFaint }}>{when}</span>
      </div>
      <div style={{ fontWeight: unread ? 650 : 400, fontSize: 30, color: unread ? N.cream : N.creamDim, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {subject}
      </div>
      <div style={{ fontSize: 26, color: N.creamFaint, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{preview}</div>
    </div>
    {unread ? <div style={{ width: 18, height: 18, borderRadius: 9, background: N.amber, marginTop: 14, boxShadow: "0 0 16px rgba(232,163,61,0.9)", flex: "none" }} /> : null}
  </div>
);

const Inbox: React.FC<{ t: number }> = ({ t }) => {
  const open = p(t, T.open, 0.55, E.inOut);
  if (open >= 1) return null;
  const s = spring(t, T.arrive, 2.6, 0.6);
  const press = t > T.tap - 0.1 && t < T.tap + 0.15 ? 0.97 : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - open, filter: open > 0.02 ? `blur(${open * 14}px)` : undefined, transform: `scale(${1 + open * 0.1})` }}>
      <div style={{ position: "absolute", left: 60, top: 330 }}>
        <Glass w={960} pad={40}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontFamily: F.display, fontWeight: 760, fontSize: 52, letterSpacing: "-0.03em" }}>Posteingang</span>
            <span style={{ fontFamily: F.mono, fontSize: 22, color: N.creamFaint }}>1 NEU</span>
          </div>
          <div style={{ height: t < T.arrive ? 0 : 168 * clamp01(s * 1.4), overflow: "hidden" }}>
            <div
              style={{
                transform: `translateY(${(1 - s) * -40}px) scale(${press})`,
                background: `rgba(232,163,61,${0.1 + 0.08 * Math.max(0, Math.sin((t - T.arrive) * 4))})`,
                borderRadius: 24,
                margin: "0 -16px",
                padding: "0 16px",
              }}
            >
              <Row warm unread avatar="Du" from="Du · in 12 Monaten" when="jetzt" subject="Danke, dass du heute angefangen hast." preview="Hey du, heute ist Montag, 8:57 …" />
            </div>
          </div>
          <Row avatar="J" from="Jobportal" when="09:12" subject="24 neue Stellen für dich" preview="Hybrid · 3 Tage Büro · Vor Ort …" dim={0.35} />
          <Row avatar="F" from="Firma XY" when="gestern" subject="Ihre Bewerbung" preview="Leider müssen wir Ihnen mitteilen …" dim={0.45} />
          <Row avatar="K" from="Kalender" when="Mo" subject="Pendeln · 07:05 – 07:52" preview="Wiederholt sich jeden Werktag" dim={0.55} />
        </Glass>
      </div>
      {t > T.tap - 0.1 && t < T.tap + 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 60,
            top: 560 - 60,
            width: 120,
            height: 120,
            borderRadius: 60,
            border: `4px solid ${N.amber}`,
            opacity: 1 - (t - T.tap + 0.1) / 0.6,
            transform: `scale(${0.4 + (t - T.tap + 0.1) * 2.5})`,
          }}
        />
      ) : null}
    </div>
  );
};

/* Brieftext: Absätze mit Startzeit, Schreibmaschine mit Cursor */
const PARAS: { at: number; text: string; accent?: boolean }[] = [
  { at: T.l1, text: "Hey du," },
  { at: T.l2, text: "heute ist Montag, 8:57." },
  { at: T.l3, text: "Ich sitze am Küchentisch. Kaffee in der Hand." },
  { at: T.l4, text: "Kein Stau. Kein Wecker um sechs." },
  { at: T.l5, text: "Ich hab endlich wieder Zeit." },
  { at: T.l6, text: "Und weißt du, wie es angefangen hat?" },
  { at: T.l7, text: "Mit einem Plan. Und dem Mut, heute anzufangen.", accent: true },
  { at: T.sign, text: "– Du 🧡" },
];
const CPS = 30;

const Letter: React.FC<{ t: number }> = ({ t }) => {
  const open = p(t, T.open, 0.6, E.out);
  if (t < T.open) return null;
  const out = p(t, T.plan - 0.2, 0.6, E.in);
  const scroll = keys(t, [
    [T.l5 - 0.2, 0],
    [T.l5 + 0.4, -130],
    [T.l6 + 0.4, -220],
    [T.l7 + 0.4, -330],
    [T.sign + 0.4, -400],
  ]);
  const active = PARAS.reduce((a, pa, i) => (t >= pa.at ? i : a), -1);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: open * (1 - out), filter: out > 0.02 ? `blur(${out * 16}px)` : undefined, transform: `scale(${lerp(0.94, 1, open) + out * 0.05})` }}>
      <div style={{ position: "absolute", left: 60, top: 230 }}>
        <Glass w={960} h={1080} pad={48} style={{ overflow: "hidden" }}>
          <div style={{ fontFamily: F.sans, fontSize: 26, color: N.creamFaint, lineHeight: 1.6 }}>
            <div>
              <span style={{ color: N.creamDim }}>Von:</span> Du <span style={{ color: N.amber }}>(in 12 Monaten)</span>
            </div>
            <div>
              <span style={{ color: N.creamDim }}>An:</span> Du (heute)
            </div>
            <div style={{ fontWeight: 650, fontSize: 32, color: N.cream, marginTop: 8 }}>Danke, dass du heute angefangen hast.</div>
          </div>
          <div style={{ height: 1.5, background: "rgba(255,255,255,0.1)", margin: "26px 0 30px" }} />
          <div
            style={{
              height: 740,
              overflow: "hidden",
              maskImage: "linear-gradient(180deg, transparent 0, transparent 30px, black 150px)",
              WebkitMaskImage: "linear-gradient(180deg, transparent 0, transparent 30px, black 150px)",
              margin: "-40px 0 0",
              paddingTop: 40,
            }}
          >
          <div style={{ transform: `translateY(${scroll}px)` }}>
            {PARAS.map((pa, i) => {
              if (t < pa.at) return null;
              const chars = Array.from(pa.text);
              const n = Math.min(chars.length, Math.floor((t - pa.at) * CPS));
              const done = n >= chars.length;
              const typing = i === active && !done;
              const caret = i === active && (typing || Math.floor(t * 2.5) % 2 === 0);
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: F.editorial,
                    fontStyle: pa.accent ? "italic" : "normal",
                    fontSize: 52,
                    lineHeight: 1.3,
                    letterSpacing: "-0.015em",
                    color: pa.accent ? N.amberHot : N.cream,
                    textShadow: pa.accent ? "0 0 30px rgba(232,163,61,0.5)" : undefined,
                    marginBottom: 22,
                    opacity: i < active - 2 ? 0.45 : 1,
                  }}
                >
                  {chars.slice(0, n).join("")}
                  {caret ? <span style={{ display: "inline-block", width: 4, height: 50, marginLeft: 4, background: N.amber, verticalAlign: "-6px" }} /> : null}
                </div>
              );
            })}
          </div>
          </div>
        </Glass>
      </div>
    </div>
  );
};

const Plan: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.plan || t > T.end + 0.2) return null;
  const s = spring(t, T.plan + 0.1, 1.6, 0.55);
  const out = p(t, T.end - 0.35, 0.45, E.in);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <Slug t={t} at={T.plan + 0.1} y={300} text="Der Plan:" color="rgba(255,214,150,0.85)" />
      <div style={{ position: "absolute", left: 540 - 170, top: lerp(520, 400, s), opacity: clamp01(s * 2), filter: "drop-shadow(0 50px 60px rgba(0,0,0,0.6)) drop-shadow(0 0 50px rgba(232,163,61,0.45))" }}>
        <Book3D w={340} ry={lerp(-60, -14, s) + Math.sin((t - T.plan) * 0.9) * 4} rx={5} roseRot={(t - T.plan) * 30} shine={clamp01((t - T.plan - 0.4) / 1.4)} />
      </div>
    </div>
  );
};

export const A5Mail: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <Frame t={t} bg="#05070a">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 35%, #152030 0%, #080b11 60%, #030405 100%)" }} />
      <Bokeh t={t} n={18} color="255,190,120" opacity={0.45} seed={12} rise={8} />
      <Dawn t={t} at={T.l3} dur={8} y={1750} strength={0.9} />
      <Slug t={t} at={-0.7} out={T.open} y={250} text="Eine Mail, die du dir in einem Jahr schreiben könntest" />
      <Inbox t={t} />
      <Letter t={t} />
      <Plan t={t} />
      <Title t={t} at={T.today} out={T.end - 0.35} y={1010} size={150} lines={[[{ text: "Fang " }, { text: "heute", accent: true }, { text: " an." }]]} stagger={0.035} />
      {t > T.end - 0.3 ? <div style={{ position: "absolute", inset: 0, background: "#05070a", opacity: p(t, T.end - 0.3, 0.4, E.inOut) * 0.7 }} /> : null}
      <EndCard t={t} at={T.end} tagline={[{ text: "Dein Plan für den " }, { text: "Remote-Job.", accent: true }]} />
    </Frame>
  );
};
