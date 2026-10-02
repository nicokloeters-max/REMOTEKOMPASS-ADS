/**
 * Gesicht des Maskottchens als 2D-Zeichnung. Die Leinwand wird als Textur auf
 * einen Kugelausschnitt vor dem Kopf gelegt (±1 rad horizontal und vertikal),
 * daher entspricht 1 rad = FACE_PX / 2 Pixeln.
 */
export type Expr = {
  /** 1 offen, 0 geschlossen */
  eyeOpen: number;
  /** 0..1 Augen werden zu fröhlichen Bögen ^ ^ */
  happy: number;
  /** Blickrichtung −1..1 */
  lookX: number;
  lookY: number;
  /** Oberlid 0..1 (müde/traurig, schräg nach außen hängend) */
  lid: number;
  /** Augenbrauen: Höhe −1..1, Neigung (+ = traurig, innen hoch; − = entschlossen) */
  browY: number;
  browTilt: number;
  /** Mund: −1 traurig .. 1 Lächeln */
  smile: number;
  /** 0..1 Mund offen (Freude/Staunen) */
  mouthOpen: number;
  /** 0..1 runder „O“-Mund */
  mouthO: number;
  /** 0..1 Wangen */
  blush: number;
  /** 0..1 linkes Auge zwinkert (Sicht des Betrachters: rechts) */
  wink: number;
  /** 0..1 Träne läuft (Fortschritt) – 0 = keine */
  tear: number;
};

export const NEUTRAL: Expr = {
  eyeOpen: 1,
  happy: 0,
  lookX: 0,
  lookY: 0,
  lid: 0,
  browY: 0,
  browTilt: 0,
  smile: 0.25,
  mouthOpen: 0,
  mouthO: 0,
  blush: 0.55,
  wink: 0,
  tear: 0,
};

export const FACE_PX = 1024;
const R = FACE_PX / 2; // Pixel pro rad
const cx = FACE_PX / 2;
const cy = FACE_PX / 2;

const INK = "#0b0b0b";

const eye = (
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: -1 | 1,
  e: Expr,
  close: number,
) => {
  const w = 0.13 * R;
  const h = 0.18 * R;
  const open = Math.max(0, e.eyeOpen * (1 - close));
  const lx = e.lookX * 0.06 * R;
  const ly = e.lookY * 0.05 * R;
  const ex = x + lx;
  const ey = y + ly;

  if (e.happy > 0.5 || close > 0.98) {
    // Bogen ^  (fröhlich) oder ‿ (geschlossen beim Zwinkern/Blinzeln)
    const k = e.happy > 0.5 ? clampN((e.happy - 0.5) * 2) : 1;
    g.save();
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = 0.05 * R;
    g.beginPath();
    if (e.happy > 0.5 && close < 0.98) {
      const up = 0.07 * R * k;
      g.moveTo(ex - w * 1.05, ey + up * 0.55);
      g.quadraticCurveTo(ex, ey - up * 1.35, ex + w * 1.05, ey + up * 0.55);
    } else {
      g.moveTo(ex - w * 1.05, ey);
      g.quadraticCurveTo(ex, ey + 0.05 * R, ex + w * 1.05, ey);
    }
    g.stroke();
    g.restore();
    return;
  }

  const sh = h * Math.max(0.08, open) * (1 - Math.max(0, e.happy) * 1.6);
  g.save();
  // Oberlid: schräge Kante, außen tiefer (traurig/müde)
  if (e.lid > 0.01) {
    const top = ey - sh + e.lid * sh * 1.25;
    const slope = 0.35 * e.lid * sh;
    g.beginPath();
    g.moveTo(ex - w * 2, top - slope * side * -1 * 2);
    g.lineTo(ex + w * 2, top + slope * side * -1 * -2);
    g.lineTo(ex + w * 2, ey + h * 2);
    g.lineTo(ex - w * 2, ey + h * 2);
    g.closePath();
    g.clip();
  }
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(ex, ey, w, Math.max(2, sh), 0, 0, Math.PI * 2);
  g.fill();
  // Glanzlichter
  if (open > 0.35) {
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(ex - w * 0.32 + lx * 0.15, ey - sh * 0.38, w * 0.34, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(ex + w * 0.3, ey + sh * 0.36, w * 0.13, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  if (e.lid > 0.01) {
    // Lidkante
    const top = ey - sh + e.lid * sh * 1.25;
    const slope = 0.35 * e.lid * sh;
    g.save();
    g.strokeStyle = INK;
    g.lineCap = "round";
    g.lineWidth = 0.022 * R;
    g.beginPath();
    g.moveTo(ex - w * 1.15, top - slope * side * -1 * 1.15);
    g.lineTo(ex + w * 1.15, top + slope * side * -1 * -1.15);
    g.stroke();
    g.restore();
  }
};

const clampN = (x: number) => Math.min(1, Math.max(0, x));

export const drawFace = (g: CanvasRenderingContext2D, e: Expr, blink: number) => {
  g.clearRect(0, 0, FACE_PX, FACE_PX);

  // Wangen (werden im Raster zu gepunkteten Bäckchen wie in der Referenz)
  if (e.blush > 0.01) {
    for (const s of [-1, 1]) {
      const x = cx + s * 0.5 * R;
      const y = cy + 0.2 * R;
      const gr = g.createRadialGradient(x, y, 0, x, y, 0.16 * R);
      gr.addColorStop(0, `rgba(120,120,120,${0.75 * e.blush})`);
      gr.addColorStop(0.6, `rgba(150,150,150,${0.4 * e.blush})`);
      gr.addColorStop(1, "rgba(160,160,160,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, 0.16 * R, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Augen
  const ey = cy - 0.06 * R;
  const blinkClose = blink;
  eye(g, cx - 0.3 * R, ey, -1, e, blinkClose);
  eye(g, cx + 0.3 * R, ey, 1, e, Math.max(blinkClose, e.wink));

  // Augenbrauen
  g.save();
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineWidth = 0.045 * R;
  for (const s of [-1, 1]) {
    const bx = cx + s * 0.3 * R;
    const by = cy - (0.3 + 0.07 * e.browY) * R - (s === 1 ? e.wink * 0.03 * R : 0);
    const tilt = e.browTilt * 0.07 * R; // + : innen hoch
    const inner = bx - s * 0.1 * R;
    const outer = bx + s * 0.1 * R;
    g.beginPath();
    g.moveTo(inner, by - tilt);
    g.quadraticCurveTo(bx, by - 0.02 * R - tilt * 0.2, outer, by + tilt * 0.6);
    g.stroke();
  }
  g.restore();

  // Mund
  const my = cy + 0.33 * R;
  const mw = (0.13 + 0.05 * Math.max(0, e.smile) + 0.04 * e.mouthOpen) * R * (1 - 0.45 * e.mouthO);
  g.save();
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineJoin = "round";
  if (e.mouthO > 0.05) {
    const rw = (0.05 + 0.03 * e.mouthO) * R;
    const rh = (0.06 + 0.05 * e.mouthO) * R;
    g.beginPath();
    g.ellipse(cx, my, rw, rh, 0, 0, Math.PI * 2);
    g.fill();
  } else if (e.mouthOpen > 0.03) {
    const curve = e.smile * 0.06 * R;
    const depth = (0.04 + 0.12 * e.mouthOpen) * R;
    g.beginPath();
    g.moveTo(cx - mw, my - curve * 0.6);
    g.quadraticCurveTo(cx, my + curve * 0.5, cx + mw, my - curve * 0.6);
    g.quadraticCurveTo(cx, my + depth + curve, cx - mw, my - curve * 0.6);
    g.closePath();
    g.fill();
    // Zunge
    g.save();
    g.clip();
    g.fillStyle = "#7a7a7a";
    g.beginPath();
    g.ellipse(cx, my + depth * 0.95 + curve * 0.5, mw * 0.55, depth * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else {
    const curve = e.smile * 0.075 * R;
    g.lineWidth = 0.038 * R;
    g.beginPath();
    g.moveTo(cx - mw, my - curve * 0.5);
    g.quadraticCurveTo(cx, my + curve * 1.3, cx + mw, my - curve * 0.5);
    g.stroke();
  }
  g.restore();

  // Träne
  if (e.tear > 0.001 && e.tear < 0.999) {
    const tx = cx + 0.36 * R;
    const ty = ey + 0.1 * R + e.tear * 0.42 * R;
    const a = Math.min(1, e.tear * 6) * Math.min(1, (1 - e.tear) * 5);
    const s = 0.045 * R * (0.7 + 0.3 * Math.min(1, e.tear * 3));
    g.save();
    g.globalAlpha = a;
    g.fillStyle = "#ffffff";
    g.strokeStyle = INK;
    g.lineWidth = 0.014 * R;
    g.beginPath();
    g.moveTo(tx, ty - s * 1.9);
    g.bezierCurveTo(tx + s * 0.25, ty - s * 1.1, tx + s, ty - s * 0.3, tx + s, ty + s * 0.2);
    g.arc(tx, ty + s * 0.2, s, 0, Math.PI);
    g.bezierCurveTo(tx - s, ty - s * 0.3, tx - s * 0.25, ty - s * 1.1, tx, ty - s * 1.9);
    g.fill();
    g.stroke();
    g.restore();
  }
};

/** Brust-Emblem: kleine Kompassrose im abgerundeten Quadrat (statt der Brusttasche der Referenz). */
export const drawBody = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = "#c4c4c4";
  g.fillRect(0, 0, w, h);
  // feine Strickrippen
  g.globalAlpha = 0.07;
  g.fillStyle = "#000";
  for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 2, h);
  g.globalAlpha = 1;
  // Emblem auf der Brust: u≈0.555 (Vorderseite, leicht rechts), v≈0.33
  const ex = w * 0.555;
  const ey = h * 0.665;
  const s = 30;
  g.save();
  g.translate(ex, ey);
  g.strokeStyle = "#111";
  g.lineWidth = s * 0.12;
  const r = s * 0.25;
  g.beginPath();
  g.moveTo(-s + r, -s);
  g.arcTo(s, -s, s, s, r);
  g.arcTo(s, s, -s, s, r);
  g.arcTo(-s, s, -s, -s, r);
  g.arcTo(-s, -s, s, -s, r);
  g.closePath();
  g.stroke();
  // Stern
  g.fillStyle = "#111";
  const k = s * 0.72;
  const q = s * 0.18;
  g.beginPath();
  g.moveTo(0, -k);
  g.lineTo(q, -q);
  g.lineTo(k, 0);
  g.lineTo(q, q);
  g.lineTo(0, k);
  g.lineTo(-q, q);
  g.lineTo(-k, 0);
  g.lineTo(-q, -q);
  g.closePath();
  g.fill();
  g.restore();
};
