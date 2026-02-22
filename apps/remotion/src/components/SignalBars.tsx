import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors, gradient } from "../tokens";

interface SignalBarsProps {
  size?: number;
  animate?: boolean;
  delay?: number;
}

export function SignalBars({ size = 40, animate = true, delay = 0 }: SignalBarsProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = [
    { heightRatio: 0.5, animDelay: delay },
    { heightRatio: 0.75, animDelay: delay + 0.2 * fps },
    { heightRatio: 1, animDelay: delay + 0.4 * fps },
  ];

  const barWidth = size * 0.3;
  const gap = size * 0.1;
  const totalWidth = barWidth * 3 + gap * 2;
  const cornerRadius = barWidth * 0.3;

  return (
    <div
      style={{
        width: totalWidth,
        height: size,
        display: "flex",
        alignItems: "flex-end",
        gap,
      }}
    >
      {bars.map((bar, i) => {
        const barHeight = size * bar.heightRatio;

        const floatY = animate
          ? interpolate(
              (frame - bar.animDelay + 1000) % (fps * 2.4),
              [0, fps * 1.2, fps * 2.4],
              [0, -size * 0.15, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          : 0;

        return (
          <div
            key={i}
            style={{
              width: barWidth,
              height: barHeight,
              borderRadius: cornerRadius,
              background: gradient,
              transform: `translateY(${floatY}px)`,
              boxShadow: `0 0 ${size * 0.4}px rgba(14, 165, 233, 0.4)`,
            }}
          />
        );
      })}
    </div>
  );
}
