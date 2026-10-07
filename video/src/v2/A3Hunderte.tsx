import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { F, H, W } from "../theme";
import { clamp01, E, hash, lerp, p } from "../lib/anim";
import { Bokeh, Dawn, EndCard, Frame, Glass, N, Ticker, Title } from "./kit";
import { markets } from "../content";
import TL from "./ads/a3.json";

const T = TL.t;

/* Verteilung der Punkte auf die vier Märkte (Größenordnung wie im Buch, Kap. 4) */
const COUNTS = [900, 150, 8, 4];
const NTOT = COUNTS.reduce((a, b) => a + b, 0);
const COLX = [205, 430, 660, 880];
const BASE = 1150;
const SP = 10;
const PER = [16, 14, 4, 4];

const colOf = (i: number) => {
  let acc = 0;
  for (let c = 0; c < 4; c++) {
    if (i < acc + COUNTS[c]) return [c, i - acc] as const;
    acc += COUNTS[c];
  }
  return [3, 0] as const;
};

const target = (c: number, k: number): [number, number] => {
  const per = PER[c];
  const sp = c >= 2 ? 26 : SP;
  const row = Math.floor(k / per);
  const col = k % per;
  const inRow = c >= 2 ? Math.min(per, COUNTS[c] - row * per + (c === 3 ? 1 : 0)) : per;
  return [COLX[c] - ((inRow - 1) / 2) * sp + col * sp, BASE - row * sp - (c >= 2 ? 6 : 0)];
};

const CX = 540;
const CY = 1060;

const cloud = (i: number, t: number): [number, number] => {
  const a = hash(i * 1.37) * Math.PI * 2;
  const r = Math.sqrt(hash(i * 2.91));
  const swirl = (t - T.zoom) * (0.1 + 0.35 * (1 - r)) * (1 + p(t, T.turn, 2, E.inSoft) * 1.8);
  return [CX + Math.cos(a + swirl) * r * 470, CY + Math.sin(a + swirl) * r * 500];
};

/** Bahn des eigenen Punkts in der Wolke: nah am Zentrum, damit das Auge ihm folgt. */
const heroCloud = (t: number): [number, number] => {
  const k = clamp01((t - T.zoom) / 1.2);
  const a = (t - T.zoom) * 0.35 + 0.8;
  return [CX + Math.cos(a) * 140 * k, CY + Math.sin(a) * 110 * k];
};

/* Der eigene Punkt: Startet groß im Zentrum, verschwindet in der Masse, taucht im verdeckten Markt wieder auf. */
const HERO_SLOT = target(0, 470);
const HERO_END = target(3, 4);

const Particles: React.FC<{ t: number }> = ({ t }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    const zoom = lerp(2.6, 1, E.inOut(clamp01((t - T.zoom) / 1.2)));
    const sc = (x: number, y: number): [number, number] => [CX + (x - CX) * zoom, CY + (y - CY) * zoom];
    const dimOthers = p(t, T.travel + 0.3, 0.8, E.smooth);
    const fadeAll = p(t, T.where + 0.6, 0.8, E.in);
    // Masse
    for (let i = 0; i < NTOT; i++) {
      const born = T.zoom + 0.1 + (i / NTOT) * 1.6;
      if (t < born) continue;
      const b = clamp01((t - born) / 0.35);
      const [c, k] = colOf(i);
      const q = E.inOut(clamp01((t - T.sort - hash(i * 5.3) * 0.7) / 1.4));
      const [x0, y0] = cloud(i, t);
      const [x1, y1] = target(c, k);
      const [x, y] = sc(lerp(x0, x1, q), lerp(y0, y1, q));
      const isHidden = c === 3;
      let a = (0.55 + 0.35 * hash(i * 7.7)) * b;
      if (c !== 3) a *= 1 - dimOthers * 0.72;
      a *= 1 - fadeAll;
      g.fillStyle = isHidden ? `rgba(255,214,150,${a})` : `rgba(244,241,234,${a})`;
      g.beginPath();
      g.arc(x, y, (isHidden ? 6 : 3.6) * (0.6 + 0.4 * b), 0, Math.PI * 2);
      g.fill();
    }
    // eigener Punkt
    const lost = p(t, T.among, 2.6, E.inOut); // geht in der Masse unter
    const travel = E.inOut(clamp01((t - T.travel) / 1.3));
    let hx: number, hy: number;
    if (t < T.sort) {
      [hx, hy] = heroCloud(t);
    } else {
      const q = E.inOut(clamp01((t - T.sort) / 1.4));
      const [cx0, cy0] = heroCloud(t);
      hx = lerp(cx0, HERO_SLOT[0], q);
      hy = lerp(cy0, HERO_SLOT[1], q);
    }
    if (travel > 0) {
      const mx = (HERO_SLOT[0] + HERO_END[0]) / 2;
      const my = Math.min(HERO_SLOT[1], HERO_END[1]) - 420;
      const u = travel;
      hx = (1 - u) * (1 - u) * HERO_SLOT[0] + 2 * (1 - u) * u * mx + u * u * HERO_END[0];
      hy = (1 - u) * (1 - u) * HERO_SLOT[1] + 2 * (1 - u) * u * my + u * u * HERO_END[1];
    }
    const [sx, sy] = sc(hx, hy);
    const vis = travel > 0 ? 1 : 1 - lost * 0.98;
    const r = lerp(30, 4, clamp01((t - T.zoom) / 1.2)) * (travel > 0 ? 1 + travel * 0.9 : 1);
    if (vis > 0.02) {
      const glowR = r * 5;
      const gr = g.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      gr.addColorStop(0, `rgba(255,190,92,${0.6 * vis})`);
      gr.addColorStop(1, "rgba(255,190,92,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(sx, sy, glowR, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(255,214,150,${vis})`;
      g.beginPath();
      g.arc(sx, sy, r, 0, Math.PI * 2);
      g.fill();
    }
    // Ring um den eigenen Punkt, solange er noch auffindbar ist
    const ringA = (1 - lost) * clamp01((t - 0.2) / 0.4);
    if (ringA > 0.02 && travel === 0) {
      g.strokeStyle = `rgba(255,190,92,${ringA * 0.9})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(sx, sy, r + 26 + Math.sin(t * 6) * 4, 0, Math.PI * 2);
      g.stroke();
    }
    // Spur beim Wechsel in den verdeckten Markt
    if (travel > 0 && travel < 1) {
      g.strokeStyle = "rgba(255,190,92,0.55)";
      g.lineWidth = 4;
      g.setLineDash([2, 14]);
      g.beginPath();
      const mx = (HERO_SLOT[0] + HERO_END[0]) / 2;
      const my = Math.min(HERO_SLOT[1], HERO_END[1]) - 420;
      for (let s = 0; s <= travel; s += 0.02) {
        const x = (1 - s) * (1 - s) * HERO_SLOT[0] + 2 * (1 - s) * s * mx + s * s * HERO_END[0];
        const y = (1 - s) * (1 - s) * HERO_SLOT[1] + 2 * (1 - s) * s * my + s * s * HERO_END[1];
        if (s === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.setLineDash([]);
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0 }} />;
};

export const A3Hunderte: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const labels = p(t, T.labels, 0.6, E.out) * (1 - p(t, T.where + 0.4, 0.6, E.in));
  const spot = p(t, T.travel + 0.9, 0.8, E.smooth) * (1 - p(t, T.where + 0.6, 0.8, E.in));
  const card = p(t, T.zoom + 0.3, 0.5, E.out) * (1 - p(t, T.noone - 0.2, 0.5, E.in));
  return (
    <Frame t={t} bg="#05070a">
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, #111a27 0%, #06090e 60%, #030405 100%)" }} />
      <Bokeh t={t} n={10} color="140,170,220" opacity={0.3} seed={6} />
      {/* Lichtkegel auf den verdeckten Markt */}
      {spot > 0 ? (
        <div
          style={{
            position: "absolute",
            left: COLX[3] - 260,
            top: 0,
            width: 520,
            height: BASE + 120,
            background: "linear-gradient(180deg, rgba(255,214,150,0) 0%, rgba(255,214,150,0.10) 60%, rgba(255,214,150,0.24) 100%)",
            clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0 100%)",
            filter: "blur(16px)",
            opacity: spot,
          }}
        />
      ) : null}
      <Particles t={t} />

      {/* Stellenanzeige mit Zähler (Beispiel) */}
      {card > 0 ? (
        <div style={{ position: "absolute", left: 60, top: 230, opacity: card, transform: `translateY(${(1 - card) * -30}px)` }}>
          <Glass w={960} pad={28} radius={30}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: "0.1em", color: N.creamFaint }}>REMOTE · BEISPIEL-ANZEIGE</div>
                <div style={{ fontWeight: 700, fontSize: 36, marginTop: 6 }}>Marketing Manager (m/w/d)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: F.mono, fontSize: 20, color: N.creamFaint, letterSpacing: "0.08em" }}>BEWERBUNGEN</div>
                <Ticker t={t} at={T.zoom + 0.2} dur={3.6} from={1} to={1847} ease={E.inOut} style={{ fontFamily: F.display, fontWeight: 800, fontSize: 64, letterSpacing: "-0.04em", color: N.amberHot }} />
              </div>
            </div>
          </Glass>
        </div>
      ) : null}

      <Title t={t} at={T.dot} out={T.zoom - 0.1} y={330} size={104} lines={[[{ text: "Das ist deine" }], [{ text: "Bewerbung.", accent: true }]]} stagger={0.02} />
      {t < T.zoom ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: CY + 70, textAlign: "center", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.1em", color: "rgba(255,214,150,0.8)", opacity: p(t, 0.5, 0.4, E.out) }}>
          GESENDET ✓ · 08:14
        </div>
      ) : null}
      <Title t={t} at={T.among} out={T.hundreds - 0.25} y={460} size={88} lines={[[{ text: "Und das hier ist sie –" }]]} stagger={0.016} />
      <Title t={t} at={T.hundreds} out={T.noone - 0.25} y={440} size={96} lines={[[{ text: "unter " }, { text: "Hunderten.", accent: true }]]} stagger={0.025} />
      <Title t={t} at={T.noone} out={T.turn - 0.25} y={300} size={96} lines={[[{ text: "Kein Wunder," }], [{ text: "dass dich keiner sieht." }]]} stagger={0.018} />
      <Title t={t} at={T.turn} out={T.travel + 0.4} y={280} size={100} lines={[[{ text: "Aber es gibt" }], [{ text: "andere Wege.", accent: true }]]} stagger={0.025} />
      <Title t={t} at={T.seen} out={T.where - 0.25} y={280} size={104} lines={[[{ text: "Hier wirst du" }], [{ text: "gesehen.", accent: true }]]} stagger={0.03} />
      <Title t={t} at={T.where} out={T.end - 0.3} y={290} size={92} lines={[[{ text: "Der Kompass zeigt dir," }], [{ text: "wo du " }, { text: "suchen", accent: true }, { text: " musst." }]]} stagger={0.02} />

      {/* Beschriftung der Märkte */}
      {labels > 0 ? (
        <>
          {markets.map((m, i) => (
            <div
              key={m.n}
              style={{
                position: "absolute",
                left: COLX[i] - 120,
                width: 240,
                top: BASE + 34,
                textAlign: "center",
                opacity: labels * (i === 3 ? 1 : 1 - spot * 0.55),
                transform: `translateY(${(1 - labels) * 20}px)`,
              }}
            >
              <div style={{ fontFamily: F.display, fontWeight: 720, fontSize: 33, color: i === 3 ? N.amberHot : N.cream, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{m.title}</div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: i === 3 ? N.amber : N.creamDim, marginTop: 8, letterSpacing: "-0.02em" }}>{m.rivals}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: BASE + 175, textAlign: "center", fontFamily: F.mono, fontSize: 20, letterSpacing: "0.06em", color: N.creamFaint, opacity: labels }}>
            TYPISCHE MITBEWERBER JE STELLE · LAUT BUCH, KAP. 4
          </div>
        </>
      ) : null}
      <Dawn t={t} at={T.seen} dur={2.4} y={1700} strength={0.7} />
      {t > T.end - 0.3 ? <div style={{ position: "absolute", inset: 0, background: "#05070a", opacity: p(t, T.end - 0.3, 0.4, E.inOut) * 0.7 }} /> : null}
      <EndCard t={t} at={T.end} tagline={[{ text: "Bewirb dich da, wo du " }, { text: "gesehen", accent: true }, { text: " wirst." }]} />
    </Frame>
  );
};
