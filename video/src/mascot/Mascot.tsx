import React, { useLayoutEffect, useRef } from "react";
import { continueRender, delayRender } from "remotion";
import { Expr } from "./face";
import { Look, MascotRenderer, Pose } from "./MascotRenderer";
import { H, W } from "../theme";

export type MascotState = {
  pose: Pose;
  expr: Expr;
  blink: number;
  look: Look;
  visible: boolean;
  /** Sichtbarer Ausschnitt (z. B. Kachel im Raster), null = ganzes Bild */
  clip?: { x: number; y: number; w: number; h: number; r: number } | null;
};

/** Bildgroße WebGL-Leinwand mit der Halbton-Figur. */
export const Mascot: React.FC<{ state: MascotState; style?: React.CSSProperties }> = ({ state, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const r = useRef<MascotRenderer | null>(null);

  useLayoutEffect(() => {
    const handle = delayRender("mascot-init");
    r.current = new MascotRenderer(ref.current!, W, H);
    continueRender(handle);
    return () => {
      r.current?.dispose();
      r.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!r.current || !state.visible) return;
    r.current.render(state.pose, state.expr, state.blink, state.look);
  });

  const c = state.clip;
  const clipPath = c ? `inset(${c.y}px ${W - c.x - c.w}px ${H - c.y - c.h}px ${c.x}px round ${c.r}px)` : undefined;
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: state.visible ? 1 : 0, clipPath, ...style }}
    />
  );
};
