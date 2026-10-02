import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { MascotTest } from "./MascotTest";
import { fontsReady } from "./lib/fonts";
import { T } from "./tl";
import { FPS, H, W } from "./theme";

void fontsReady;

export const Root: React.FC = () => (
  <>
    <Composition id="MetaAd" component={Main} durationInFrames={T.frames} fps={FPS} width={W} height={H} />
    <Composition id="MascotTest" component={MascotTest} durationInFrames={5} fps={FPS} width={W} height={H} />
  </>
);
