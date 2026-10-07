import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { F } from "../theme";
import { clamp01, E, lerp, p, spring } from "../lib/anim";
import { Bokeh, Dawn, EndCard, Focus, Frame, Glass, N, Slug, Title, Topo } from "./kit";
import TL from "./ads/a1.json";

const T = TL.t;

/** Vibration: kurzes Zittern nach Eingang einer Nachricht. */
const buzz = (t: number, at: number) => (t > at && t < at + 0.45 ? Math.sin((t - at) * 140) * 7 * (1 - (t - at) / 0.45) : 0);

const AppIcon: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      background: "linear-gradient(160deg, #ffc56b, #e8a33d)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
    }}
  >
    <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24">
      <path d="M12 3C6.5 3 2 6.6 2 11c0 2.4 1.3 4.6 3.5 6L4.6 21l4.3-2.4c1 .3 2 .4 3.1.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z" fill="#fff" />
    </svg>
  </div>
);

const Notification: React.FC<{ t: number; at: number; y: number; text: string; when?: string }> = ({ t, at, y, text, when = "jetzt" }) => {
  if (t < at) return null;
  const s = spring(t, at, 2.6, 0.62);
  return (
    <div style={{ position: "absolute", left: 60, top: lerp(y - 140, y, s), opacity: clamp01(s * 2.5), transform: `translateX(${buzz(t, at)}px) scale(${lerp(0.94, 1, s)})` }}>
      <Glass w={960} pad={28} radius={40}>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <AppIcon />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.mono, fontSize: 21, letterSpacing: "0.08em", color: N.creamFaint }}>
              <span>NACHRICHTEN</span>
              <span style={{ letterSpacing: 0 }}>{when}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 36, marginTop: 6 }}>Mia 🧡</div>
            <div style={{ fontSize: 34, lineHeight: 1.3, color: "rgba(244,241,234,0.92)", marginTop: 2 }}>{text}</div>
          </div>
        </div>
      </Glass>
    </div>
  );
};

/** Sperrbildschirm (POV): Datum, Uhrzeit, Benachrichtigungen. */
const LockScreen: React.FC<{ t: number }> = ({ t }) => {
  const k = p(t, T.calendar - 0.2, 0.6, E.inOut);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-k * 420}px) scale(${1 - k * 0.08})`, opacity: 1 - k, filter: k > 0.02 ? `blur(${k * 16}px)` : undefined }}>
      <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 500, fontSize: 38, color: N.creamDim }}>
        Donnerstag, 9. Oktober
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: F.display, fontWeight: 300, fontSize: 250, letterSpacing: "-0.05em", color: N.cream, lineHeight: 1 }}>
        16:42
      </div>
      <Notification t={t} at={T.notif1} y={640} text="Kommst du heute zu meiner Aufführung? 🥺" />
      <Notification t={t} at={T.notif2} y={860} text="Ich hab dir einen Platz freigehalten 🎭" />
    </div>
  );
};

/** Tagesansicht: Meeting, Aufführung und Heimweg kollidieren. */
const Calendar: React.FC<{ t: number }> = ({ t }) => {
  const a = T.calendar;
  const H0 = 15;
  const px = 150; // Pixel pro Stunde
  const top = 140;
  const y = (h: number) => top + (h - H0) * px;
  const grow = (at: number) => p(t, at, 0.5, E.out);
  const conflict = p(t, a + 1.25, 0.35, E.out);
  const pulse = 0.5 + 0.5 * Math.sin((t - a) * 9);
  return (
    <Focus t={t} a={a} b={T.chat + 0.1} rise={60}>
      <Slug t={t} at={a + 0.05} y={250} text="Heute · 16:42" />
      <div style={{ position: "absolute", left: 60, top: 310 }}>
        <Glass w={960} h={930} pad={36}>
          <div style={{ fontFamily: F.display, fontWeight: 720, fontSize: 44, letterSpacing: "-0.03em" }}>Donnerstag</div>
          {[15, 16, 17, 18, 19, 20].map((h) => (
            <div key={h} style={{ position: "absolute", left: 36, right: 36, top: y(h), borderTop: "1.5px solid rgba(255,255,255,0.08)" }}>
              <span style={{ position: "absolute", top: -14, fontFamily: F.mono, fontSize: 22, color: N.creamFaint, background: "transparent" }}>{h}:00</span>
            </div>
          ))}
          {/* Meeting */}
          <div style={{ position: "absolute", left: 150, width: 380, top: y(15), height: (y(18.5) - y(15)) * grow(a + 0.25), borderRadius: 18, background: "rgba(244,241,234,0.14)", border: "1.5px solid rgba(244,241,234,0.22)", padding: "16px 20px", boxSizing: "border-box", overflow: "hidden" }}>
            <div style={{ fontWeight: 700, fontSize: 30 }}>Quartalsmeeting</div>
            <div style={{ fontSize: 24, color: N.creamDim }}>15:00 – 18:30 · Büro</div>
          </div>
          {/* Heimweg */}
          <div style={{ position: "absolute", left: 150, width: 380, top: y(18.5), height: (y(19.37) - y(18.5)) * grow(a + 0.6), borderRadius: 18, background: "repeating-linear-gradient(135deg, rgba(244,241,234,0.08) 0 12px, rgba(244,241,234,0.03) 12px 24px)", border: "1.5px dashed rgba(244,241,234,0.25)", padding: "12px 20px", boxSizing: "border-box", overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 26, color: N.creamDim }}>Heimweg · 52 Min.</div>
          </div>
          {/* Aufführung */}
          <div
            style={{
              position: "absolute",
              left: 560,
              width: 364,
              top: y(18),
              height: (y(19) - y(18)) * grow(a + 0.9),
              borderRadius: 18,
              background: "rgba(232,163,61,0.18)",
              border: `2.5px solid ${N.amber}`,
              padding: "14px 18px",
              boxSizing: "border-box",
              overflow: "hidden",
              boxShadow: `0 0 ${30 + 30 * pulse * conflict}px rgba(232,163,61,${0.35 * conflict})`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 29, color: N.amberHot }}>Mias Aufführung 🎭</div>
            <div style={{ fontSize: 23, color: N.creamDim }}>18:00 · Schulaula</div>
          </div>
          {/* Konfliktlinie */}
          <div style={{ position: "absolute", left: 150, width: 774 * conflict, top: y(18) - 2, height: 4, background: N.amber, boxShadow: "0 0 18px rgba(232,163,61,0.9)" }} />
          <div style={{ position: "absolute", left: 560, top: y(19) + 30, opacity: conflict, fontFamily: F.mono, fontSize: 24, letterSpacing: "0.06em", color: N.amberHot }}>
            ⚠ ÜBERSCHNEIDUNG
          </div>
        </Glass>
      </div>
    </Focus>
  );
};

const Bubble: React.FC<{ t: number; at: number; mine?: boolean; children: React.ReactNode; warm?: boolean }> = ({ t, at, mine, children, warm }) => {
  if (t < at) return null;
  const s = spring(t, at, 3, 0.6);
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginTop: 18 }}>
      <div
        style={{
          maxWidth: 700,
          padding: "22px 30px",
          borderRadius: 38,
          borderBottomRightRadius: mine ? 10 : 38,
          borderBottomLeftRadius: mine ? 38 : 10,
          background: mine ? (warm ? `linear-gradient(160deg, ${N.amberHot}, ${N.amber})` : "rgba(244,241,234,0.88)") : "rgba(255,255,255,0.12)",
          color: mine ? N.night : N.cream,
          fontFamily: F.sans,
          fontSize: 38,
          lineHeight: 1.3,
          transform: `scale(${lerp(0.6, 1, s)})`,
          transformOrigin: mine ? "100% 100%" : "0% 100%",
          opacity: clamp01(s * 2.5),
          border: mine ? "none" : "1.5px solid rgba(255,255,255,0.1)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Dots: React.FC<{ t: number; a: number; b: number }> = ({ t, a, b }) => {
  if (t < a || t > b) return null;
  return (
    <div style={{ display: "flex", marginTop: 18 }}>
      <div style={{ padding: "26px 30px", borderRadius: 38, borderBottomLeftRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 14, height: 14, borderRadius: 7, background: N.cream, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t - a) * 9 - i * 0.9)) }} />
        ))}
      </div>
    </div>
  );
};

const ChatHeader: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 22, borderBottom: "1.5px solid rgba(255,255,255,0.08)" }}>
    <div style={{ width: 76, height: 76, borderRadius: 38, background: "linear-gradient(160deg, #ffc56b, #c9831f)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 36, color: N.night }}>
      M
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 36 }}>Mia 🧡</div>
      <div style={{ fontSize: 24, color: N.creamFaint }}>online</div>
    </div>
  </div>
);

/** Chat: Antwort tippen, löschen, neu tippen, senden. */
const Chat: React.FC<{ t: number }> = ({ t }) => {
  const draft1 = "Ich versuch's, aber";
  const draft2 = "Schaff ich leider nicht 😔";
  let typed = "";
  if (t >= T.type1 && t < T.del) typed = Array.from(draft1).slice(0, Math.floor((t - T.type1) * 16)).join("");
  else if (t >= T.del && t < T.type2) typed = Array.from(draft1).slice(0, Math.max(0, draft1.length - Math.floor((t - T.del) * 40))).join("");
  else if (t >= T.type2 && t < T.send) typed = Array.from(draft2).slice(0, Math.floor((t - T.type2) * 17)).join("");
  const sendPress = t > T.send - 0.12 && t < T.send + 0.1;
  const dim = p(t, T.howOften - 0.3, 0.6, E.inOut);
  return (
    <Focus t={t} a={T.chat} b={T.dawn + 0.2} fout={0.6}>
      <div style={{ position: "absolute", inset: 0, filter: dim > 0.01 ? `blur(${dim * 14}px)` : undefined, opacity: 1 - dim * 0.65 }}>
        <div style={{ position: "absolute", left: 60, top: 230 }}>
          <Glass w={960} h={1050} pad={40}>
            <ChatHeader />
            <Bubble t={t} at={T.chat + 0.05}>Kommst du heute zu meiner Aufführung? 🥺</Bubble>
            <Bubble t={t} at={T.chat + 0.2}>Ich hab dir einen Platz freigehalten 🎭</Bubble>
            <Bubble t={t} at={T.send} mine>
              Schaff ich leider nicht 😔
            </Bubble>
            {t > T.send + 0.4 ? <div style={{ textAlign: "right", fontSize: 22, color: N.creamFaint, marginTop: 8 }}>Zugestellt</div> : null}
            <Dots t={t} a={T.dots} b={T.okay} />
            <Bubble t={t} at={T.okay}>okay.</Bubble>
            {/* Eingabefeld */}
            <div style={{ position: "absolute", left: 40, right: 40, bottom: 40, height: 96, borderRadius: 48, border: "1.5px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", padding: "0 30px", fontSize: 34, color: N.cream }}>
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden" }}>
                {typed}
                {t < T.send ? <span style={{ display: "inline-block", width: 3, height: 40, marginLeft: 3, background: N.amber, verticalAlign: "middle", opacity: Math.floor(t * 3) % 2 ? 1 : 0.15 }} /> : null}
                {!typed && t >= T.send ? <span style={{ color: N.creamFaint }}>Nachricht</span> : null}
              </span>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: typed ? N.amber : "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sendPress ? 0.85 : 1})` }}>
                <svg width={30} height={30} viewBox="0 0 24 24">
                  <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke={typed ? N.night : N.creamFaint} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </Glass>
        </div>
      </div>
      <Title t={t} at={T.howOften} out={T.dawn - 0.25} y={690} size={150} lines={[[{ text: "Wie oft " }, { text: "noch?", accent: true }]]} stagger={0.045} />
    </Focus>
  );
};

/** „Stell dir vor“: derselbe Chat, andere Antwort – warm beleuchtet. */
const Imagine: React.FC<{ t: number }> = ({ t }) => (
  <Focus t={t} a={T.imagine} b={T.end + 0.15}>
    <Slug t={t} at={T.imagine} y={250} text="Stell dir vor:" color="rgba(255,214,150,0.8)" />
    <div style={{ position: "absolute", left: 60, top: 330 }}>
      <Glass w={960} h={760} pad={40} style={{ background: "linear-gradient(160deg, rgba(255,214,150,0.16), rgba(255,255,255,0.05))" }}>
        <ChatHeader />
        <Bubble t={t} at={T.imagine + 0.25}>Kommst du heute? 🥺</Bubble>
        <Bubble t={t} at={T.reply} mine warm>
          Bin schon da. Erste Reihe. 🧡
        </Bubble>
        <Bubble t={t} at={T.hearts}>❤️❤️❤️</Bubble>
      </Glass>
    </div>
  </Focus>
);

export const A1Auffuehrung: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const push = lerp(1.04, 1, p(t, 0, 3, E.out));
  return (
    <Frame t={t}>
      {/* Wallpaper: Stadt bei Nacht, unscharf */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, #182233 0%, #0a0f16 55%, #05070a 100%)", transform: `scale(${push})` }}>
        <Bokeh t={t} n={26} color="255,190,120" opacity={0.75} seed={2} rise={6} />
        <Bokeh t={t} n={14} color="140,170,220" opacity={0.5} seed={9} rise={4} />
      </div>
      <Dawn t={t} at={T.dawn} dur={2.6} y={1700} />
      {t > T.dawn ? (
        <div style={{ position: "absolute", inset: 0, opacity: 0.6 * p(t, T.dawn, 2, E.smooth) }}>
          <Topo t={t} color="rgba(255,214,150,0.12)" levels={9} seed={5} />
        </div>
      ) : null}
      {t < T.calendar + 0.6 ? <LockScreen t={t} /> : null}
      <Calendar t={t} />
      <Chat t={t} />
      <Title
        t={t}
        at={T.flur}
        out={T.imagine - 0.45}
        y={640}
        size={104}
        lines={[[{ text: "Was, wenn dein" }], [{ text: "Arbeitsweg nur" }], [{ text: "der " }, { text: "Flur", accent: true }, { text: " wäre?" }]]}
        stagger={0.02}
      />
      <Imagine t={t} />
      <EndCard t={t} at={T.end} />
    </Frame>
  );
};
