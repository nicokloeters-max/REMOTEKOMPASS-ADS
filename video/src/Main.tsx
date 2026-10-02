import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { CHAPTERS, CUE, S } from "./tl";
import { Mascot } from "./mascot/Mascot";
import { mascotAt } from "./mascotTrack";
import { CircleWipe, DotWipe, Hud } from "./components/ui";
import { S1Funk, VP } from "./scenes/S1Funk";
import { S2Alltag } from "./scenes/S2Alltag";
import { S3Back, S3Zweifel } from "./scenes/S3Zweifel";
import { S4Nein } from "./scenes/S4Nein";
import { S5Back, S5System } from "./scenes/S5System";
import { S6Back, S6Vision } from "./scenes/S6Vision";
import { S7Cta } from "./scenes/S7Cta";
import { E, p } from "./lib/anim";

/** Übergänge: wann welche Hintergrundfarbe vollständig steht. */
const BG = {
  amber: S.abend.a + 0.3,
  ink: S.mir.a + 0.15,
  paper2: S.nein.a + 0.12,
  dark: S.vision.a + 0.4,
  paper3: S.cta.a + 0.36,
};

const bgAt = (t: number) => {
  if (t < BG.amber) return C.paper;
  if (t < BG.ink) return C.needle;
  if (t < BG.paper2) return C.ink;
  if (t < BG.dark) return C.paper;
  if (t < BG.paper3) return "#0d0a07";
  return C.paper;
};

const toneAt = (t: number): "light" | "dark" => {
  const bg = bgAt(t);
  return bg === C.ink || bg === "#0d0a07" ? "dark" : "light";
};

const inRange = (t: number, a: number, b: number) => t >= a && t <= b;

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const m = mascotAt(t);
  const chapter = [...CHAPTERS].reverse().find((c) => t >= c.at)!;

  return (
    <AbsoluteFill style={{ background: bgAt(t), overflow: "hidden" }}>
      {/* Ebene 1: Hintergründe unter der Figur */}
      {inRange(t, S.mir.a, BG.paper2) ? <S3Back t={t} /> : null}
      {inRange(t, CUE.grid, BG.dark) ? <S5Back t={t} /> : null}
      {inRange(t, S.vision.a, BG.paper3) ? <S6Back t={t} /> : null}

      {/* Ebene 2: die Figur */}
      <Mascot state={m} />

      {/* Ebene 3: Inhalte über der Figur */}
      {inRange(t, 0, BG.amber) ? <S1Funk t={t} /> : null}
      {inRange(t, BG.amber - 0.1, BG.ink) ? <S2Alltag t={t} /> : null}
      {inRange(t, S.mir.a, BG.paper2) ? <S3Zweifel t={t} /> : null}
      {inRange(t, S.nein.a - 0.05, S.kompass.a + 0.6) ? <S4Nein t={t} /> : null}
      {inRange(t, S.kompass.a - 0.1, BG.dark) ? <S5System t={t} /> : null}
      {inRange(t, S.vision.a + 0.3, BG.paper3) ? <S6Vision t={t} /> : null}
      {inRange(t, S.cta.a + 0.25, 999) ? <S7Cta t={t} /> : null}

      {/* Ebene 4: Szenenwechsel, die alles überdecken */}
      {inRange(t, S.abend.a - 0.25, BG.amber) ? <CircleWipe t={t} at={S.abend.a - 0.22} dur={0.5} cx={VP.x} cy={VP.y} color={C.needle} /> : null}
      {inRange(t, S.mir.a - 0.45, BG.ink) ? <DotWipe t={t} at={S.mir.a - 0.42} dur={0.55} cx={540} cy={1050} color={C.ink} /> : null}
      {inRange(t, S.nein.a - 0.08, BG.paper2) ? <CircleWipe t={t} at={S.nein.a - 0.08} dur={0.2} cx={540} cy={1500} color={C.paper} from={120} /> : null}
      {inRange(t, S.vision.a - 0.25, BG.dark) ? <DotWipe t={t} at={S.vision.a - 0.24} dur={0.62} cx={790} cy={1110} color="#0d0a07" /> : null}
      {inRange(t, S.cta.a - 0.16, BG.paper3) ? <CircleWipe t={t} at={S.cta.a - 0.16} dur={0.5} cx={540} cy={1250} color={C.paper} /> : null}

      <Hud t={t} label={chapter.label} tone={toneAt(t)} opacity={p(t, 0, 0.3, E.out)} />
    </AbsoluteFill>
  );
};
