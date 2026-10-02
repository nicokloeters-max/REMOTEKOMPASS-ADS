import React from "react";
import { C, F } from "../theme";
import { clamp01, E, lerp, p, spring } from "../lib/anim";
import { CUE, S, W } from "../tl";
import { Words } from "../components/Words";
import { Blur, Card, Chip, Cursor, HalftoneArt } from "../components/ui";
import { Book3D } from "../components/Book";
import { ICONS } from "../components/icons";
import { markets, questions, template, trackerRows } from "../content";
import { GRID } from "./layout";

const w = (i: number) => W("kompass", i).s;
const wi = (i: number) => W("inhalt", i).s;

/* ---------- Phase A: Buch ---------- */
const BookHero: React.FC<{ t: number }> = ({ t }) => {
  const at = S.kompass.a + 0.05;
  const sp = spring(t, at, 1.7, 0.5);
  const leave = p(t, w(6) - 0.15, 0.45, E.in);
  const y = lerp(-900, 470, sp) - leave * 260;
  const x = 540 - 185 + leave * 620;
  const ry = lerp(-75, -18, sp) + Math.sin((t - at) * 1.3) * 4 - leave * 40;
  const vy = (lerp(-900, 470, spring(t, at, 1.7, 0.5)) - lerp(-900, 470, spring(t - 1 / 60, at, 1.7, 0.5))) * 0.6;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - leave * 0.5}) rotate(${(1 - sp) * -14 + leave * 18}deg)`, opacity: 1 - clamp01((leave - 0.7) / 0.3) }}>
      <Blur y={Math.min(30, Math.abs(vy))} x={leave * 30}>
        <div style={{ filter: "drop-shadow(0 40px 50px rgba(8,12,17,0.35))" }}>
          <Book3D w={370} ry={ry} rx={6} roseRot={(t - at) * 40} shine={clamp01((t - at - 0.4) / 1.2)} />
        </div>
      </Blur>
      <div style={{ position: "absolute", left: -40, top: -46, transform: `scale(${spring(t, at + 0.35, 3, 0.5)}) rotate(-6deg)` }}>
        <Chip bg={C.needle} color={C.ink} style={{ fontFamily: F.mono, fontWeight: 500, fontSize: 22 }}>
          // das system
        </Chip>
      </div>
    </div>
  );
};

/* ---------- Phase B/C: Vier Märkte ---------- */
const MarketCard: React.FC<{ t: number; i: number; at: number; focus: number; zoom: number }> = ({ t, i, at, focus, zoom }) => {
  if (t < at) return null;
  const m = markets[i];
  const sp = spring(t, at, 2.1, 0.55);
  const col = i % 2;
  const row = Math.floor(i / 2);
  const bx = 60 + col * 492;
  const by = 610 + row * 330;
  const dx = (1 - sp) * 900;
  const v = (spring(t, at, 2.1, 0.55) - spring(t - 1 / 60, at, 2.1, 0.5)) * 900;
  const isHidden = i === 3;
  const hi = isHidden ? focus : 0;
  const dim = isHidden ? 0 : focus;
  // Zoom-Sog in die nächste Phase (Referenz: Zoom-Blur)
  const zx = (bx + 234 - 540) * zoom * 1.6;
  const zy = (by + 150 - 900) * zoom * 1.6;
  return (
    <div
      style={{
        position: "absolute",
        left: bx + dx + zx,
        top: by + zy,
        transform: `rotate(${(1 - sp) * 14}deg) scale(${1 + hi * 0.06 + zoom * 1.4})`,
        transformOrigin: "50% 50%",
        opacity: (1 - dim * 0.55) * (1 - zoom),
        zIndex: isHidden ? 2 : 1,
      }}
    >
      <Blur x={Math.min(26, Math.abs(v) * 0.5) + zoom * 30} y={zoom * 30}>
        <Card
          w={468}
          h={306}
          label={`// markt ${m.n}`}
          num={m.n}
          style={{
            border: hi > 0.01 ? `${3 * hi}px solid ${C.needle}` : undefined,
            boxShadow: hi > 0.01 ? `0 0 0 ${10 * hi}px rgba(232,163,61,0.25), 0 30px 60px -20px rgba(8,12,17,0.35)` : undefined,
          }}
        >
          <div style={{ position: "absolute", right: 14, top: 44 }}>
            <HalftoneArt w={170} h={130} cell={5} draw={ICONS[m.icon]} />
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 760, fontSize: 42, letterSpacing: "-0.035em", color: C.ink, marginTop: 4, maxWidth: 250, lineHeight: 1.02 }}>
            {m.title}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 22, color: C.mute, marginTop: 8, maxWidth: 240 }}>{m.sub}</div>
          <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: F.mono, fontSize: 18, color: C.mute }}>mitbewerber</span>
            <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 44, letterSpacing: "-0.04em", color: isHidden ? C.needleDeep : C.ink }}>
              {m.rivals}
            </span>
          </div>
        </Card>
      </Blur>
    </div>
  );
};

/* ---------- Phase D: Raster ---------- */
const GridCard: React.FC<{ t: number; at: number; box: { x: number; y: number; w: number; h: number }; pulse?: number; children: React.ReactNode; label: string; num?: string; bare?: boolean }> = ({
  t,
  at,
  box,
  pulse = 0,
  children,
  label,
  num,
  bare,
}) => {
  if (t < at) return null;
  const sp = spring(t, at, 2.6, 0.6);
  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        transform: `scale(${lerp(0.86, 1, sp) + pulse * 0.035})`,
        opacity: clamp01(sp * 2.5),
      }}
    >
      <Card w={box.w} h={box.h} label={label} num={num} style={bare ? { background: "#fff" } : pulse > 0.01 ? { border: `${2 + pulse * 2}px solid ${C.needle}` } : undefined}>
        {children}
      </Card>
    </div>
  );
};

const pulseAt = (t: number, at: number) => (t < at ? 0 : Math.exp(-(t - at) * 3.2) * Math.min(1, (t - at) * 12));

const Template: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const all = template.lines.join("\n");
  const n = Math.floor(clamp01((t - at - 0.1) / 1.2) * all.length);
  const shown = all.slice(0, n).split("\n");
  const copied = t > wi(2) + 0.1;
  const render = (s: string) =>
    s.split(/(\[[^\]]*\]?)/g).map((part, i) =>
      part.startsWith("[") ? (
        <span key={i} style={{ background: "rgba(232,163,61,0.28)", color: C.needleDeep, borderRadius: 6, padding: "0 4px" }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  return (
    <>
      <div style={{ fontFamily: F.display, fontWeight: 760, fontSize: 36, letterSpacing: "-0.03em", color: C.ink }}>{template.title}</div>
      <div style={{ fontFamily: F.sans, fontSize: 23, lineHeight: 1.45, color: C.ink, marginTop: 12, minHeight: 140 }}>
        {shown.map((l, i) => (
          <div key={i}>{render(l)}</div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          right: 26,
          bottom: 22,
          height: 64,
          borderRadius: 16,
          background: copied ? C.signal : C.ink,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.sans,
          fontWeight: 650,
          fontSize: 26,
        }}
      >
        {copied ? "✓ Kopiert" : "Vorlage kopieren"}
      </div>
    </>
  );
};

const Tracker: React.FC<{ t: number; at: number }> = ({ t, at }) => (
  <div style={{ fontFamily: F.sans, fontSize: 23, color: C.ink }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.25fr 1.4fr", fontFamily: F.mono, fontSize: 17, color: C.mute, paddingBottom: 8, borderBottom: "1.5px solid #eee" }}>
      <span>firma</span>
      <span>kanal</span>
      <span>stufe</span>
      <span>nächster schritt</span>
    </div>
    {trackerRows.map((r, i) => {
      const ra = at + 0.15 + i * 0.22;
      const rp = p(t, ra, 0.35, E.out);
      const stage = Math.min(6, Math.floor(clamp01((t - ra - 0.2) / 1.1) * [4, 3, 2][i]) + 1);
      return (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1.25fr 1.4fr",
            alignItems: "center",
            height: 46,
            borderBottom: "1.5px solid #f2f2f2",
            opacity: rp,
            transform: `translateX(${(1 - rp) * 40}px)`,
          }}
        >
          <span style={{ fontWeight: 650 }}>{r.firm}</span>
          <span>{r.channel}</span>
          <span style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: 6 }, (_, k) => (
              <span key={k} style={{ width: 16, height: 16, borderRadius: 5, background: k < stage ? C.needle : "#e7e3da" }} />
            ))}
          </span>
          <span style={{ color: C.needleDeep, fontWeight: 600 }}>{r.step}</span>
        </div>
      );
    })}
  </div>
);

const Interview: React.FC<{ t: number; at: number }> = ({ t, at }) => (
  <div>
    {questions.map((q, i) => {
      const qa = at + 0.1 + i * 0.25;
      const on = t > qa + 0.25;
      const qp = p(t, qa, 0.3, E.out);
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, height: 54, opacity: qp, transform: `translateY(${(1 - qp) * 16}px)` }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              border: `2.5px solid ${on ? C.needle : "#cfcac0"}`,
              background: on ? C.needle : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.ink,
              fontWeight: 800,
              fontSize: 22,
              flex: "none",
            }}
          >
            {on ? "✓" : ""}
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 25, color: C.ink, whiteSpace: "nowrap" }}>{q}</span>
        </div>
      );
    })}
  </div>
);

/* ---------- Stempel „Mit System.“ (Referenz: „Handled.“) ---------- */
const Stamp: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  if (t < at - 0.12) return null;
  const hit = p(t, at - 0.12, 0.14, E.in);
  const settle = p(t, at + 0.42, 0.36, E.inOut);
  const s0 = lerp(3.2, 1, hit);
  const s = lerp(s0, 0.52, settle);
  const x = lerp(540, 790, settle);
  const y = lerp(760, 1110, settle);
  const ring = p(t, at + 0.55, 0.42, E.smooth);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${lerp(-14, -9, hit)}deg) scale(${s})`,
          opacity: clamp01(hit * 2),
          filter: hit < 1 ? `blur(${(1 - hit) * 22}px)` : undefined,
        }}
      >
        <div
          style={{
            padding: "6px 46px 22px",
            border: `9px solid ${C.needle}`,
            borderRadius: 26,
            background: "rgba(255,255,255,0.86)",
            fontFamily: F.editorial,
            fontStyle: "italic",
            fontWeight: 480,
            fontVariationSettings: "'opsz' 144",
            fontSize: 170,
            letterSpacing: "-0.03em",
            color: C.needleDeep,
            whiteSpace: "nowrap",
            lineHeight: 1.05,
          }}
        >
          Mit System.
        </div>
      </div>
      {ring > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle
            cx={790}
            cy={1110}
            r={330}
            fill="none"
            stroke={C.needle}
            strokeWidth={4}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - ring}
            transform="rotate(-100 790 1110)"
            opacity={0.8}
          />
        </svg>
      ) : null}
    </>
  );
};

export const S5System: React.FC<{ t: number }> = ({ t }) => {
  const marketsAt = w(7) - 0.1;
  const hiddenFocus = p(t, w(11) - 0.05, 0.4, E.smooth);
  const zoom = p(t, CUE.grid - 0.05, 0.3, E.in);
  const phaseB = t < CUE.grid + 0.3;
  const flash = clamp01(1 - Math.abs(t - (CUE.grid + 0.22)) / 0.14);
  // Kamera-Ruck beim Stempel
  const sh = t > CUE.stamp ? Math.exp(-(t - CUE.stamp) * 9) * Math.sin((t - CUE.stamp) * 70) * 16 : 0;
  const cursorIn = p(t, wi(2) - 0.6, 0.5, E.out);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translate(${sh}px, ${sh * 0.6}px)` }}>
      {phaseB ? (
        <>
          <Words
            t={t}
            x={72}
            y={240}
            size={104}
            exitAt={w(6) - 0.4}
            exitDur={0.28}
            lines={[
              [
                { text: "Remote", at: w(1) },
                { text: "Job", at: w(2) },
                { text: "Kompass", at: w(3), accent: true },
              ],
            ]}
          />
          <Words
            t={t}
            x={72}
            y={360}
            size={66}
            weight={600}
            exitAt={w(6) - 0.4}
            exitDur={0.28}
            lines={[
              [
                { text: "zeigt", at: w(4), color: C.mute },
                { text: "dir,", at: w(5), color: C.mute },
              ],
            ]}
          />
          <Words
            t={t}
            x={72}
            y={250}
            size={96}
            gaps={[1.05, 1.15, 1]}
            exitAt={w(11) - 0.42}
            exitDur={0.3}
            lines={[
              [
                { text: "Wo", at: w(6) },
                { text: "Remote-Jobs", at: w(7) },
              ],
              [{ text: "wirklich", at: w(8), accent: true, underline: true, k: 1.25 }],
              [
                { text: "vergeben", at: w(9) },
                { text: "werden.", at: w(10) },
              ],
            ]}
          />
          <Words
            t={t}
            x={72}
            y={250}
            size={86}
            gaps={[1.22, 1.08, 1]}
            exitAt={CUE.grid - 0.15}
            lines={[
              [
                { text: "Auch", at: w(11) },
                { text: "die,", at: w(12) },
                { text: "die", at: w(13) },
                { text: "nie", at: w(14), accent: true, underline: true, k: 1.3 },
              ],
              [{ text: "ausgeschrieben", at: w(15) }],
              [{ text: "werden.", at: w(16) }],
            ]}
          />
          {t < marketsAt + 0.1 ? <BookHero t={t} /> : null}
          {markets.map((_, i) => (
            <MarketCard key={i} t={t} i={i} at={marketsAt + i * 0.16} focus={hiddenFocus} zoom={zoom} />
          ))}
        </>
      ) : null}

      {t >= CUE.grid + 0.12 ? (
        <>
          <GridCard t={t} at={CUE.grid + 0.15} box={GRID.vorlage} label={template.label} num="kap. 7" pulse={pulseAt(t, wi(1))}>
            <Template t={t} at={CUE.grid + 0.2} />
          </GridCard>
          {/* Kachel selbst liegt unter der Figur (S5Back), hier nur die Beschriftung */}
          <div
            style={{
              position: "absolute",
              left: GRID.cam.x + 26,
              top: GRID.cam.y + 26,
              fontFamily: F.mono,
              fontSize: 19,
              color: "rgba(8,12,17,0.42)",
              opacity: p(t, CUE.grid + 0.3, 0.3, E.out),
            }}
          >
            <span style={{ color: C.needle }}>●</span> // du, mit plan
          </div>
          <GridCard t={t} at={CUE.grid + 0.25} box={GRID.tracker} label="// bewerbungs-tracker" num="kap. 6" pulse={pulseAt(t, wi(2))}>
            <Tracker t={t} at={wi(2) - 0.3} />
          </GridCard>
          <GridCard t={t} at={CUE.grid + 0.3} box={GRID.interview} label="// interview-fragen" num="kap. 8" pulse={pulseAt(t, wi(4))}>
            <Interview t={t} at={wi(4) - 0.3} />
          </GridCard>
          {cursorIn > 0 && t < CUE.stamp ? (
            <Cursor
              x={lerp(700, 300, cursorIn)}
              y={lerp(900, 640, cursorIn)}
              press={t > wi(2) ? clamp01((t - wi(2)) / 0.35) : 0}
            />
          ) : null}
        </>
      ) : null}

      {/* Lichtblitz beim Zoom-Sog */}
      {flash > 0 ? <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash * 0.9 }} /> : null}
      <Stamp t={t} at={CUE.stamp} />
    </div>
  );
};

/** Hintergrund-Ebene der Rasterphase (unter der Figur): die „on air“-Kachel selbst. */
export const S5Back: React.FC<{ t: number }> = ({ t }) => {
  if (t < CUE.grid + 0.12) return null;
  const sp = spring(t, CUE.grid + 0.2, 2.6, 0.6);
  return (
    <div
      style={{
        position: "absolute",
        left: GRID.cam.x,
        top: GRID.cam.y,
        width: GRID.cam.w,
        height: GRID.cam.h,
        borderRadius: GRID.cam.r,
        background: "#fff",
        transform: `scale(${lerp(0.86, 1, sp)})`,
        opacity: clamp01(sp * 2.5),
        boxShadow: "0 24px 48px -18px rgba(8,12,17,0.22)",
      }}
    />
  );
};
