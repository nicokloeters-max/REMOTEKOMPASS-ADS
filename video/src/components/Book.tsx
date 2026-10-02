import React from "react";
import { brand } from "../content";
import { C, F } from "../theme";

/** Kompassrose des Ebook-Covers (ebook/assets/kompassrose.svg), Stern drehbar. */
export const EbookRose: React.FC<{ size: number; rot?: number }> = ({ size, rot = 0 }) => {
  const light = { fill: C.coverPaper };
  const dark = { fill: "rgba(242,239,232,0.3)" };
  return (
    <svg viewBox="0 0 400 400" width={size} height={size}>
      <circle cx="200" cy="200" r="188" fill="none" stroke="rgba(232,236,234,0.28)" strokeWidth={1} />
      <circle cx="200" cy="200" r="118" fill="none" stroke="rgba(232,236,234,0.28)" strokeWidth={0.6} />
      {Array.from({ length: 48 }, (_, i) => (
        <path
          key={i}
          d={i % 6 === 0 ? "M200 18 v16" : "M200 18 v10"}
          stroke={i % 6 === 0 ? "rgba(232,236,234,0.6)" : "rgba(232,236,234,0.34)"}
          strokeWidth={i % 6 === 0 ? 1.4 : 1}
          transform={`rotate(${i * 7.5} 200 200)`}
        />
      ))}
      <g transform={`rotate(${rot} 200 200)`}>
        {[45, 135, 225, 315].map((r) => (
          <g key={r} transform={`rotate(${r} 200 200)`}>
            <path d="M200 62 L200 200 L166 166 Z" {...dark} />
            <path d="M200 62 L200 200 L234 166 Z" {...light} opacity={0.55} />
          </g>
        ))}
        <path d="M200 22 L200 200 L152 152 Z" fill={C.coverNorthDark} />
        <path d="M200 22 L200 200 L248 152 Z" fill={C.coverRule} />
        {[90, 180, 270].map((r) => (
          <g key={r} transform={`rotate(${r} 200 200)`}>
            <path d="M200 22 L200 200 L152 152 Z" {...dark} />
            <path d="M200 22 L200 200 L248 152 Z" {...light} />
          </g>
        ))}
      </g>
      <circle cx="200" cy="200" r="15" fill="none" stroke="rgba(232,236,234,0.55)" strokeWidth={1.2} />
      <circle cx="200" cy="200" r="4" fill={C.coverPaper} />
    </svg>
  );
};

/** Cover im Stil von ebook/theme/cover.css. */
export const Cover: React.FC<{ w: number; roseRot?: number; shine?: number }> = ({ w, roseRot = 0, shine = 0 }) => {
  const h = w * 1.414;
  const u = w / 600;
  return (
    <div
      style={{
        width: w,
        height: h,
        background: `radial-gradient(circle at 50% 38%, ${C.coverMid} 0%, ${C.coverBg} 58%, ${C.coverDeep} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${78 * u}px ${50 * u}px`,
        boxSizing: "border-box",
        color: C.coverPaper,
        position: "relative",
        overflow: "hidden",
        borderRadius: 6 * u,
      }}
    >
      <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 17 * u, letterSpacing: "0.32em", color: C.coverMint }}>
        {brand.kicker}
      </div>
      <div style={{ marginTop: 70 * u }}>
        <EbookRose size={270 * u} rot={roseRot} />
      </div>
      <div
        style={{
          marginTop: 52 * u,
          fontFamily: F.editorial,
          fontWeight: 400,
          fontVariationSettings: "'opsz' 144, 'SOFT' 50",
          fontSize: 84 * u,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          textAlign: "center",
        }}
      >
        {brand.coverTitle[0]}
        <br />
        {brand.coverTitle[1]}
      </div>
      <div style={{ width: 62 * u, height: 3 * u, background: C.coverRule, margin: `${32 * u}px auto` }} />
      <div
        style={{
          fontFamily: F.editorial,
          fontSize: 22 * u,
          lineHeight: 1.4,
          textAlign: "center",
          color: "rgba(242,239,232,0.72)",
          maxWidth: 430 * u,
        }}
      >
        {brand.coverSub}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(115deg, rgba(255,255,255,0) ${shine * 160 - 40}%, rgba(255,255,255,0.18) ${shine * 160 - 20}%, rgba(255,255,255,0) ${shine * 160}%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)",
        }}
      />
    </div>
  );
};

/** Buch mit Rücken und Seitenschnitt (CSS-3D). */
export const Book3D: React.FC<{ w: number; ry: number; rx?: number; rz?: number; roseRot?: number; shine?: number }> = ({
  w,
  ry,
  rx = 0,
  rz = 0,
  roseRot,
  shine,
}) => {
  const h = w * 1.414;
  const d = w * 0.085;
  const face: React.CSSProperties = { position: "absolute", left: 0, top: 0, backfaceVisibility: "hidden" };
  return (
    <div style={{ width: w, height: h, perspective: 2400 }}>
      <div
        style={{
          width: w,
          height: h,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        }}
      >
        <div style={{ ...face, transform: `translateZ(${d / 2}px)` }}>
          <Cover w={w} roseRot={roseRot} shine={shine} />
        </div>
        <div style={{ ...face, width: w, height: h, background: C.coverDeep, transform: `rotateY(180deg) translateZ(${d / 2}px)`, borderRadius: 6 }} />
        {/* Rücken */}
        <div
          style={{
            ...face,
            width: d,
            height: h,
            left: -d / 2,
            background: `linear-gradient(90deg, ${C.coverDeep}, ${C.coverMid} 50%, ${C.coverDeep})`,
            transform: `rotateY(-90deg)`,
          }}
        />
        {/* Seitenschnitt */}
        <div
          style={{
            ...face,
            width: d,
            height: h - 8,
            top: 4,
            left: w - d / 2,
            background: "repeating-linear-gradient(90deg, #f3efe6 0px, #f3efe6 2px, #d9d3c6 3px)",
            transform: `rotateY(90deg)`,
          }}
        />
      </div>
    </div>
  );
};
