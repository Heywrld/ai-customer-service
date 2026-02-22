"use client";

import dynamic from "next/dynamic";
import { FRAMES, FPS, WIDTH, HEIGHT } from "@han/remotion/tokens";
import type { ComponentType } from "react";

// @remotion/player must be client-only (uses browser APIs)
const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false }
) as ComponentType<any>;

// Lazy-load the heavy Remotion composition bundle
const HanDemo = dynamic(
  () => import("@han/remotion/HanDemo").then((m) => m.HanDemo),
  { ssr: false }
) as ComponentType<Record<string, never>>;

export function RemotionPlayer() {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <Player
        component={HanDemo}
        durationInFrames={FRAMES.total}
        fps={FPS}
        compositionWidth={WIDTH}
        compositionHeight={HEIGHT}
        style={{ width: "100%", aspectRatio: `${WIDTH}/${HEIGHT}` }}
        controls
        loop
        clickToPlay
        showVolumeControls={false}
        inputProps={{}}
      />
    </div>
  );
}
