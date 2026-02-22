import { Composition } from "remotion";
import { FPS, WIDTH, HEIGHT, FRAMES } from "./tokens";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { HanDemo } from "./HanDemo";

export function RemotionRoot() {
  return (
    <>
      {/* Full 45-second product demo */}
      <Composition
        id="HanDemo"
        component={HanDemo}
        durationInFrames={FRAMES.total}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Individual scenes for iteration */}
      <Composition
        id="Scene1"
        component={Scene1}
        durationInFrames={FRAMES.s1}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Scene2"
        component={Scene2}
        durationInFrames={FRAMES.s2}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Scene3"
        component={Scene3}
        durationInFrames={FRAMES.s3}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Scene4"
        component={Scene4}
        durationInFrames={FRAMES.s4}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
}
