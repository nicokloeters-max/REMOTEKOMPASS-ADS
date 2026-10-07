import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { MascotTest } from "./MascotTest";
import { fontsReady } from "./lib/fonts";
import { T } from "./tl";
import { V2 } from "./v2/registry";
import { FPS, H, W } from "./theme";

void fontsReady;

export const Root: React.FC = () => (
  <>
    <Composition id="MetaAd" component={Main} durationInFrames={T.frames} fps={FPS} width={W} height={H} />
    <Composition id="MascotTest" component={MascotTest} durationInFrames={5} fps={FPS} width={W} height={H} />
    {V2.map((a) => (
      <Composition key={a.id} id={a.id} component={a.component} durationInFrames={Math.round(a.dur * 30)} fps={30} width={W} height={H} />
    ))}
  </>
);
