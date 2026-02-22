import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { colors, font, gradient } from "../tokens";

interface StatNumberProps {
  label: string;
  value: string;
  sublabel?: string;
  delay?: number;
  accent?: boolean;
}

export function StatNumber({
  label,
  value,
  sublabel,
  delay = 0,
  accent = false,
}: StatNumberProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = interpolate(frame, [delay, delay + fps * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: font.family,
          fontSize: 18,
          fontWeight: 500,
          color: colors.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: "0 0 12px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: font.family,
          fontSize: 96,
          fontWeight: 800,
          margin: 0,
          lineHeight: 1,
          background: accent ? gradient : undefined,
          WebkitBackgroundClip: accent ? "text" : undefined,
          WebkitTextFillColor: accent ? "transparent" : colors.white,
          color: accent ? "transparent" : colors.white,
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p
          style={{
            fontFamily: font.family,
            fontSize: 22,
            color: colors.faint,
            margin: "12px 0 0",
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
