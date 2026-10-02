import React from "react";
import { C, F } from "../theme";
import { E, p } from "../lib/anim";
import { S, W } from "../tl";
import { Words } from "../components/Words";

/** Tiefpunkt: kleine Figur im Lichtkegel, „Liegt's an mir?“ */
export const S3Back: React.FC<{ t: number }> = ({ t }) => {
  const on = p(t, S.mir.a + 0.05, 0.7, E.smooth);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: on }}>
      {/* Lichtkegel von oben */}
      <div
        style={{
          position: "absolute",
          left: 540 - 520,
          top: -100,
          width: 1040,
          height: 1900,
          background: "linear-gradient(180deg, rgba(244,241,234,0.0) 0%, rgba(244,241,234,0.07) 55%, rgba(244,241,234,0.13) 100%)",
          clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          filter: "blur(18px)",
        }}
      />
      {/* Lichtfleck am Boden */}
      <div
        style={{
          position: "absolute",
          left: 540 - 420,
          top: 1560,
          width: 840,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(244,241,234,0.22), rgba(244,241,234,0))",
        }}
      />
    </div>
  );
};

export const S3Zweifel: React.FC<{ t: number }> = ({ t }) => {
  const w = (i: number) => W("mir", i).s;
  const fade = p(t, S.mir.b - 0.15, 0.15, E.in);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Words
        t={t}
        x={540}
        y={300}
        width={1000}
        align="center"
        size={50}
        weight={500}
        color={C.fog}
        lines={[
          [
            { text: "Und", at: w(0) },
            { text: "du", at: w(1) },
            { text: "fragst", at: w(2) },
            { text: "dich:", at: w(3) },
          ],
        ]}
        style={{ fontFamily: F.sans }}
      />
      <Words
        t={t}
        x={540}
        y={420}
        width={1000}
        align="center"
        size={150}
        color={C.paper}
        accentColor={C.needle}
        gaps={[1.15, 1]}
        lines={[
          [
            { text: "Liegt's", at: w(4) },
            { text: "an", at: w(5) },
          ],
          [{ text: "mir?", at: w(6), accent: true, k: 1.6 }],
        ]}
      />
    </div>
  );
};
