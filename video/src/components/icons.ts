/**
 * Graustufen-Zeichnungen mit Volumen (Verläufe), die HalftoneArt in Punktraster
 * übersetzt – das Pendant zu den gerasterten 3D-Objekten auf den Karten der Referenz.
 */
type G = CanvasRenderingContext2D;

const shade = (g: G, x0: number, y0: number, x1: number, y1: number, a: string, b: string) => {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
};

const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};

const ball = (g: G, x: number, y: number, r: number) => {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, "#f4f4f4");
  gr.addColorStop(0.55, "#9a9a9a");
  gr.addColorStop(1, "#2a2a2a");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
};

/** Gestapelte Anzeigen-Kacheln */
export const drawBoards = (g: G, w: number, h: number) => {
  for (let i = 3; i >= 0; i--) {
    const x = w * 0.16 + i * w * 0.06;
    const y = h * 0.18 + i * h * 0.1;
    g.fillStyle = shade(g, x, y, x + w * 0.6, y + h * 0.4, "#f2f2f2", "#8a8a8a");
    rr(g, x, y, w * 0.58, h * 0.36, 14);
    g.fill();
    g.fillStyle = "#3a3a3a";
    rr(g, x + 18, y + 20, w * 0.3, 10, 5);
    g.fill();
    g.fillStyle = "#7a7a7a";
    rr(g, x + 18, y + 42, w * 0.42, 8, 4);
    g.fill();
    rr(g, x + 18, y + 60, w * 0.22, 8, 4);
    g.fill();
  }
};

/** Bürogebäude mit Fensterraster */
export const drawBuilding = (g: G, w: number, h: number) => {
  const x = w * 0.26;
  const y = h * 0.12;
  const bw = w * 0.36;
  const bh = h * 0.78;
  g.fillStyle = shade(g, x, y, x + bw, y, "#efefef", "#9a9a9a");
  g.fillRect(x, y, bw, bh);
  g.fillStyle = shade(g, x + bw, y, x + bw + w * 0.14, y, "#6a6a6a", "#3a3a3a");
  g.beginPath();
  g.moveTo(x + bw, y);
  g.lineTo(x + bw + w * 0.14, y + h * 0.06);
  g.lineTo(x + bw + w * 0.14, y + bh);
  g.lineTo(x + bw, y + bh);
  g.closePath();
  g.fill();
  g.fillStyle = "#2a2a2a";
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 3; c++) g.fillRect(x + 14 + c * (bw - 28) / 3 + 4, y + 16 + r * (bh - 30) / 7, (bw - 28) / 3 - 10, (bh - 30) / 7 - 12);
  g.fillStyle = shade(g, 0, y + bh, 0, h, "#b0b0b0", "#ffffff");
  g.fillRect(w * 0.12, y + bh, w * 0.76, h * 0.04);
};

/** Drei verbundene Köpfe */
export const drawNetwork = (g: G, w: number, h: number) => {
  const pts: [number, number, number][] = [
    [w * 0.3, h * 0.36, w * 0.13],
    [w * 0.7, h * 0.32, w * 0.11],
    [w * 0.52, h * 0.7, w * 0.14],
  ];
  g.strokeStyle = "#2a2a2a";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  g.lineTo(pts[1][0], pts[1][1]);
  g.lineTo(pts[2][0], pts[2][1]);
  g.closePath();
  g.stroke();
  for (const [x, y, r] of pts) ball(g, x, y, r);
};

/** Eisberg: kleine Spitze über, riesige Masse unter der Wasserlinie */
export const drawIceberg = (g: G, w: number, h: number) => {
  const wl = h * 0.32;
  g.fillStyle = shade(g, w * 0.3, h * 0.08, w * 0.7, wl, "#ffffff", "#9a9a9a");
  g.beginPath();
  g.moveTo(w * 0.36, wl);
  g.lineTo(w * 0.47, h * 0.1);
  g.lineTo(w * 0.55, h * 0.18);
  g.lineTo(w * 0.64, wl);
  g.closePath();
  g.fill();
  g.fillStyle = shade(g, w * 0.2, wl, w * 0.8, h * 0.95, "#6a6a6a", "#121212");
  g.beginPath();
  g.moveTo(w * 0.34, wl);
  g.lineTo(w * 0.66, wl);
  g.lineTo(w * 0.86, h * 0.5);
  g.lineTo(w * 0.8, h * 0.78);
  g.lineTo(w * 0.56, h * 0.93);
  g.lineTo(w * 0.3, h * 0.86);
  g.lineTo(w * 0.14, h * 0.6);
  g.closePath();
  g.fill();
  g.fillStyle = "#1a1a1a";
  g.fillRect(w * 0.06, wl - 3, w * 0.88, 6);
};

/** Briefumschlag mit Absage-Strich */
export const drawMail = (g: G, w: number, h: number) => {
  g.fillStyle = shade(g, 0, 0, w, h, "#f6f6f6", "#9a9a9a");
  rr(g, w * 0.1, h * 0.2, w * 0.8, h * 0.6, 12);
  g.fill();
  g.strokeStyle = "#2a2a2a";
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(w * 0.12, h * 0.24);
  g.lineTo(w * 0.5, h * 0.55);
  g.lineTo(w * 0.88, h * 0.24);
  g.stroke();
};

export const ICONS = {
  boards: drawBoards,
  building: drawBuilding,
  network: drawNetwork,
  iceberg: drawIceberg,
  mail: drawMail,
} as const;
