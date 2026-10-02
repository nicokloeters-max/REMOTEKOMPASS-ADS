import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Mascot } from "./mascot/Mascot";
import { NEUTRAL, Expr } from "./mascot/face";
import { C } from "./theme";

const variants: { bg: string; e: Partial<Expr>; yaw?: number; laptop?: number; mug?: number }[] = [
  { bg: C.paper, e: {} },
  { bg: C.paper, e: { smile: -0.8, browTilt: 1, lid: 0.45, lookY: 0.7, lookX: -0.3, blush: 0.2, tear: 0.5 }, yaw: -0.15 },
  { bg: C.needle, e: { happy: 1, smile: 1, mouthOpen: 0.7, blush: 0.9, browY: 0.6 }, yaw: 0.2 },
  { bg: C.ink, e: { mouthO: 1, browY: 1, eyeOpen: 1.15 }, yaw: -0.25 },
  { bg: C.paper, e: { wink: 1, smile: 0.9, blush: 0.8 }, yaw: 0.25, laptop: 1, mug: 1 },
];

export const MascotTest: React.FC = () => {
  const f = useCurrentFrame();
  const v = variants[Math.min(variants.length - 1, f)];
  return (
    <AbsoluteFill style={{ background: v.bg }}>
      <Mascot
        state={{
          visible: true,
          blink: 0,
          expr: { ...NEUTRAL, ...v.e },
          pose: { x: 540, y: 900, scale: 1, yaw: v.yaw ?? 0.12, pitch: 0.05, roll: 0, stretch: 1, body: 1, laptop: v.laptop ?? 0, mug: v.mug ?? 0 },
          look: { cell: 7, ink: [0.04, 0.05, 0.06], paper: [1, 1, 1], opacity: 1 },
        }}
      />
    </AbsoluteFill>
  );
};
