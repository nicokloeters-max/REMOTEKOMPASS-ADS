import React from "react";
import { C } from "../theme";
import { E, p } from "../lib/anim";
import { S, W } from "../tl";
import { Words } from "../components/Words";

/** Wendepunkt: „Nein. Du hast nicht versagt. Dir fehlt nur ein System.“ */
export const S4Nein: React.FC<{ t: number }> = ({ t }) => {
  const w = (i: number) => W("nein", i).s;
  const exit = S.kompass.a - 0.05;
  const exitP = p(t, exit, 0.4, E.in);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateY(${-exitP * 220}px)`, opacity: 1 - exitP, filter: exitP > 0.02 ? `blur(${exitP * 14}px)` : undefined }}>
      <Words
        t={t}
        x={72}
        y={230}
        size={230}
        lines={[[{ text: "Nein.", at: w(0), slam: true }]]}
      />
      <Words
        t={t}
        x={78}
        y={505}
        size={92}
        gaps={[1.08, 1.06, 1.2]}
        lines={[
          [
            { text: "Du", at: w(1) },
            { text: "hast", at: w(2) },
            { text: "nicht", at: w(3) },
            { text: "versagt.", at: w(4), accent: true, color: C.ink },
          ],
          [
            { text: "Dir", at: w(5) },
            { text: "fehlt", at: w(6) },
            { text: "nur", at: w(7) },
            { text: "ein", at: w(8) },
          ],
          [{ text: "System.", at: w(9), accent: true, underline: true, k: 1.9 }],
        ]}
      />
    </div>
  );
};
