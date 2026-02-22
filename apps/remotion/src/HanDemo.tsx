// HanDemo — stitches all 4 scenes into the full 45-second video
import { AbsoluteFill, Series } from "remotion";
import { FRAMES } from "./tokens";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";

export function HanDemo() {
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence durationInFrames={FRAMES.s1}>
          <Scene1 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FRAMES.s2}>
          <Scene2 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FRAMES.s3}>
          <Scene3 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={FRAMES.s4}>
          <Scene4 />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
