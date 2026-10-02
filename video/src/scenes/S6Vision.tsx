import React from "react";
import { C, F } from "../theme";
import { clamp01, E, hash, lerp, p, spring } from "../lib/anim";
import { S, W } from "../tl";
import { Words } from "../components/Words";

const w = (i: number) => W("vision", i).s;

/** Warmes Morgenlicht hinter der Figur (unter der Figur). */
export const S6Back: React.FC<{ t: number }> = ({ t }) => {
  const sun = p(t, S.vision.a + 0.35, 1.6, E.smooth);
  const rot = (t - S.vision.a) * 6;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: sun }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, #0d0a07 0%, #2a1a0c ${lerp(70, 38, sun)}%, #a8681a ${lerp(120, 82, sun)}%, ${C.needle} 100%)`,
        }}
      />
      {/* Strahlen */}
      <div
        style={{
          position: "absolute",
          left: 540 - 1100,
          top: 1500 - 1100,
          width: 2200,
          height: 2200,
          borderRadius: "50%",
          background: `repeating-conic-gradient(from ${rot}deg, rgba(255,214,150,0.10) 0deg 7deg, rgba(255,214,150,0) 7deg 20deg)`,
          maskImage: "radial-gradient(closest-side, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(closest-side, black 20%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 700,
          top: 1180 - 520,
          width: 1400,
          height: 1040,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,200,120,0.55), rgba(255,200,120,0))",
          transform: `scale(${0.8 + sun * 0.25})`,
        }}
      />
      {/* Staub im Gegenlicht */}
      {Array.from({ length: 26 }, (_, i) => {
        const x0 = hash(i * 7.1) * 1080;
        const y0 = 500 + hash(i * 3.3) * 1300;
        const sp = 18 + hash(i * 1.9) * 30;
        const dt = t - S.vision.a;
        const y = y0 - dt * sp;
        const x = x0 + Math.sin(dt * 0.8 + i) * 22;
        const r = 2 + hash(i * 5.7) * 4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "rgba(255,226,170,0.85)",
              filter: `blur(${hash(i) * 2}px)`,
              opacity: 0.35 + 0.5 * Math.abs(Math.sin(dt * 1.3 + i)),
            }}
          />
        );
      })}
    </div>
  );
};

const Floating: React.FC<{ t: number; at: number; x: number; y: number; rot: number; children: React.ReactNode }> = ({ t, at, x, y, rot, children }) => {
  if (t < at) return null;
  const sp = spring(t, at, 2.4, 0.5);
  const bob = Math.sin((t - at) * 2.2) * 8;
  return (
    <div style={{ position: "absolute", left: x, top: y + bob + (1 - sp) * 60, transform: `rotate(${rot}deg) scale(${sp})`, opacity: clamp01(sp * 2) }}>
      {children}
    </div>
  );
};

export const S6Vision: React.FC<{ t: number }> = ({ t }) => {
  const second = w(10);
  const fadeAll = p(t, S.vision.b - 0.25, 0.25, E.in);
  const walk = clamp01((t - w(4) - 0.3) / 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fadeAll }}>
      <Words
        t={t}
        x={540}
        y={225}
        width={1000}
        align="center"
        size={46}
        weight={500}
        color="rgba(244,241,234,0.62)"
        exitAt={second - 0.25}
        lines={[
          [
            { text: "Stell", at: w(0) },
            { text: "dir", at: w(1) },
            { text: "vor:", at: w(2) },
          ],
        ]}
      />
      <Words
        t={t}
        x={540}
        y={305}
        width={1000}
        align="center"
        size={104}
        color={C.paper}
        accentColor={C.needle}
        gaps={[1.12, 1]}
        exitAt={second - 0.25}
        lines={[
          [
            { text: "Dein", at: w(3) },
            { text: "Arbeitsweg:", at: w(4) },
          ],
          [
            { text: "der", at: w(8), color: C.paper },
            { text: "Flur.", at: w(9), accent: true, underline: true, k: 1.7 },
          ],
        ]}
      />
      <Words
        t={t}
        x={540}
        y={250}
        width={1000}
        align="center"
        size={110}
        color={C.paper}
        accentColor={C.needle}
        gaps={[1.1, 1.05, 1]}
        lines={[
          [
            { text: "Und", at: w(10) },
            { text: "deine", at: w(11) },
            { text: "Zeit", at: w(12) },
          ],
          [
            { text: "gehört", at: w(13) },
            { text: "wieder", at: w(14) },
          ],
          [{ text: "dir.", at: w(15), accent: true, underline: true, k: 1.7 }],
        ]}
      />
      <Floating t={t} at={w(4) + 0.1} x={640} y={760} rot={4}>
        <div
          style={{
            background: "#fff",
            borderRadius: 22,
            padding: "16px 22px",
            width: 330,
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            opacity: 1 - p(t, second - 0.3, 0.3, E.in),
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 18, color: C.mute }}>// arbeitsweg</div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 52, letterSpacing: "-0.04em", color: C.ink, lineHeight: 1.1 }}>
            {Math.round(walk * 12)} Sek.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontFamily: F.sans, fontSize: 19, color: C.mute }}>
            <span>Bett</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#eee", overflow: "hidden" }}>
              <div style={{ width: `${walk * 100}%`, height: "100%", background: C.needle }} />
            </div>
            <span>Laptop</span>
          </div>
        </div>
      </Floating>
      <Floating t={t} at={w(12) - 0.1} x={90} y={880} rot={-5}>
        <div style={{ background: C.ink, color: C.paper, borderRadius: 999, padding: "14px 26px", fontFamily: F.sans, fontWeight: 600, fontSize: 30, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
          Mo · 08:58 · ☕
        </div>
      </Floating>
    </div>
  );
};
