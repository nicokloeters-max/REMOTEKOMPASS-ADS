import React from "react";
import { A1Auffuehrung } from "./A1Auffuehrung";
import { A2Kompass } from "./A2Kompass";
import { A3Hunderte } from "./A3Hunderte";
import { A4Tage } from "./A4Tage";
import { A5Mail } from "./A5Mail";
import a1 from "./ads/a1.json";
import a2 from "./ads/a2.json";
import a3 from "./ads/a3.json";
import a4 from "./ads/a4.json";
import a5 from "./ads/a5.json";

/** Die fünf Ads der Kampagne „Nachtlicht“ (30 fps). */
export const V2: { id: string; slug: string; component: React.FC; dur: number; title: string }[] = [
  { id: "V2-A1-Auffuehrung", slug: "a1", component: A1Auffuehrung, dur: a1.dur, title: a1.title },
  { id: "V2-A2-Kompass", slug: "a2", component: A2Kompass, dur: a2.dur, title: a2.title },
  { id: "V2-A3-Hunderte", slug: "a3", component: A3Hunderte, dur: a3.dur, title: a3.title },
  { id: "V2-A4-14-Tage", slug: "a4", component: A4Tage, dur: a4.dur, title: a4.title },
  { id: "V2-A5-Mail", slug: "a5", component: A5Mail, dur: a5.dur, title: a5.title },
];
