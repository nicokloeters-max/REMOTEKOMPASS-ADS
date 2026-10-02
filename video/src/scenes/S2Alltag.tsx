import React from "react";
import { C, F } from "../theme";
import { clamp01, E, lerp, p, spring } from "../lib/anim";
import { S, W } from "../tl";
import { Words } from "../components/Words";
import { Blur, Card, Chip } from "../components/ui";
import { boardItems } from "../content";

const ITEM_H = 132;

/** Handy mit endlos scrollender Jobbörse – überall „Hybrid“ und „Vor Ort“. */
const Phone: React.FC<{ t: number; at: number; out: number }> = ({ t, at, out }) => {
  const sp = spring(t, at, 2.4, 0.55);
  const x = lerp(-520, 90, sp) - out * 640;
  // Scrollen: erst schnell (Wischen), dann ruckweise
  const st = Math.max(0, t - at - 0.2);
  const scroll = st * 760 + Math.sin(st * 9) * 26;
  const vel = 760 / 60;
  const typed = "remote jobs".slice(0, Math.floor(clamp01((t - at) / 0.5) * 11));
  const items = [...boardItems, ...boardItems, ...boardItems, ...boardItems, ...boardItems];
  return (
    <div style={{ position: "absolute", left: x, top: 560, transform: `rotate(${-4 + sp * 2}deg)` }}>
      <div
        style={{
          width: 440,
          height: 840,
          borderRadius: 64,
          background: C.ink,
          padding: 16,
          boxSizing: "border-box",
          boxShadow: "0 40px 80px -20px rgba(8,12,17,0.45)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 50, background: "#fff", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", top: 14, left: "50%", marginLeft: -60, width: 120, height: 34, borderRadius: 20, background: C.ink, zIndex: 3 }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 170, background: "#fff", zIndex: 2, padding: "66px 24px 0", boxSizing: "border-box" }}>
            <div
              style={{
                height: 64,
                borderRadius: 18,
                background: "#f0eee8",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 18px",
                fontFamily: F.sans,
                fontSize: 26,
                color: C.ink,
              }}
            >
              <svg width={26} height={26} viewBox="0 0 24 24">
                <circle cx="10" cy="10" r="7" fill="none" stroke={C.ink} strokeWidth={2.4} />
                <path d="M15 15 L21 21" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" />
              </svg>
              {typed}
              <span style={{ width: 2, height: 30, background: C.ink, opacity: Math.floor(t * 3) % 2 }} />
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 17, color: C.mute, marginTop: 14 }}>2.418 Treffer · Remote-Filter: an</div>
          </div>
          <Blur y={Math.min(7, vel * 0.4)} style={{ position: "absolute", top: 170, left: 0, right: 0 }}>
            <div style={{ transform: `translateY(${-(scroll % (ITEM_H * boardItems.length))}px)` }}>
              {items.map((it, i) => (
                <div key={i} style={{ height: ITEM_H, padding: "18px 24px", boxSizing: "border-box", borderBottom: "1.5px solid #eee" }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 650, fontSize: 25, color: C.ink }}>{it.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <span
                      style={{
                        fontFamily: F.sans,
                        fontWeight: 600,
                        fontSize: 19,
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: it.tag === "Vor Ort" ? C.ink : "#e9e5dc",
                        color: it.tag === "Vor Ort" ? "#fff" : C.ink,
                      }}
                    >
                      {it.tag}
                    </span>
                    <span style={{ fontFamily: F.sans, fontSize: 20, color: C.mute }}>{it.meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </Blur>
        </div>
      </div>
      <div style={{ position: "absolute", left: 250, top: -40, transform: `rotate(6deg) scale(${spring(t, at + 0.25, 3, 0.5)})` }}>
        <Chip bg={C.ink} color={C.paper} style={{ fontSize: 30 }}>
          ☾ 23:41
        </Chip>
      </div>
    </div>
  );
};

const Alarm: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at) return null;
  const sp = spring(t, at, 2.6, 0.5);
  const ring = Math.sin((t - at) * 60) * 7 * Math.exp(-(t - at) * 0.6);
  return (
    <div style={{ position: "absolute", left: 80, top: 600, transform: `translateY(${(1 - sp) * 120}px) rotate(${-3 + ring * 0.3}deg)`, opacity: clamp01(sp * 2) }}>
      <Card w={450} h={230} label="// wecker" num="mo">
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width={86} height={86} viewBox="0 0 24 24" style={{ transform: `rotate(${ring}deg)` }}>
            <circle cx="12" cy="13" r="8" fill="none" stroke={C.ink} strokeWidth={2.2} />
            <path d="M12 9 v4 l3 2" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />
            <path d="M4 5 l3 -2.5 M20 5 l-3 -2.5" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 104, letterSpacing: "-0.05em", color: C.ink, lineHeight: 1 }}>06:30</div>
        </div>
      </Card>
    </div>
  );
};

const Traffic: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at) return null;
  const sp = spring(t, at, 2.4, 0.55);
  const crawl = (t - at) * 14;
  return (
    <div style={{ position: "absolute", left: 80, top: 860, transform: `translateX(${(1 - sp) * -500}px) rotate(2deg)` }}>
      <Card w={620} h={210} label="// pendeln · a40" num="+38 min">
        <div style={{ position: "relative", height: 70, overflow: "hidden", borderRadius: 12, background: "#f0eee8" }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: i % 2 ? 38 : 8,
                left: ((i * 96 + crawl) % 640) - 60,
                width: 72,
                height: 26,
                borderRadius: 9,
                background: i % 3 === 0 ? C.ink : "#b9b3a6",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontFamily: F.sans, fontSize: 24, color: C.ink }}>
          <span style={{ fontWeight: 650 }}>Stau · stockender Verkehr</span>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: C.needleDeep }}>■■■■■■□</span>
        </div>
      </Card>
    </div>
  );
};

export const S2Alltag: React.FC<{ t: number }> = ({ t }) => {
  const w = (i: number) => W("abend", i).s;
  const enter = S.abend.a + 0.28;
  const morning = w(4);
  const out = p(t, morning - 0.2, 0.4, E.in);
  const fadeAll = p(t, S.abend.b - 0.3, 0.3, E.in);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fadeAll }}>
      <Words
        t={t}
        x={72}
        y={250}
        size={112}
        color={C.ink}
        accentColor={C.white}
        exitAt={morning - 0.22}
        lines={[
          [
            { text: "Jeden", at: Math.max(enter, w(0)) },
            { text: "Abend", at: Math.max(enter + 0.05, w(1)) },
          ],
          [
            { text: "dieselben", at: w(2) },
            { text: "Jobbörsen.", at: w(3), accent: true },
          ],
        ]}
      />
      <Words
        t={t}
        x={72}
        y={250}
        size={112}
        color={C.ink}
        accentColor={C.white}
        lines={[
          [
            { text: "Jeden", at: morning },
            { text: "Morgen", at: w(5) },
          ],
          [
            { text: "derselbe", at: w(6) },
            { text: "Stau.", at: w(7), accent: true, underline: true },
          ],
        ]}
      />
      {out < 1 ? <Phone t={t} at={enter + 0.05} out={out} /> : null}
      <Alarm t={t} at={morning + 0.02} />
      <Traffic t={t} at={w(6) - 0.05} />
    </div>
  );
};
