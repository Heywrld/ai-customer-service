// Scene 2 (10–20s): AI Processing — Han thinks, then responds
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { colors, font, gradient } from "../tokens";
import { SignalBars } from "../components/SignalBars";

const STEPS = [
  { label: "FAQ matcher", result: "No match", icon: "⚡", color: colors.muted, time: 0.5 },
  { label: "Cache check", result: "Miss", icon: "🗄", color: colors.muted, time: 1.2 },
  { label: "Model router", result: "Haiku selected", icon: "🧠", color: "#A78BFA", time: 2.0 },
  { label: "Prompt compressed", result: "84 tokens", icon: "📦", color: colors.primary, time: 2.8 },
  { label: "Claude API", result: "Response ready", icon: "✓", color: colors.success, time: 4.0 },
];

export function Scene2() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = interpolate(frame, [0, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Big bars pulse animation
  const barScale = interpolate(
    (frame % (fps * 1.6)),
    [0, fps * 0.8, fps * 1.6],
    [1, 1.08, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Cost badge
  const costEntrance = spring({
    frame: frame - 6.5 * fps,
    fps,
    config: { damping: 15, stiffness: 160 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: font.family }}>

      {/* Glow */}
      <div style={{
        position: "absolute", top: "40%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 800, height: 500,
        background: "radial-gradient(ellipse, rgba(14,165,233,0.12) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Han branding */}
      <div style={{
        position: "absolute", top: 60, left: 80,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <SignalBars size={36} animate />
        <span style={{ fontSize: 32, fontWeight: 700, color: colors.white }}>Han</span>
      </div>

      {/* Title */}
      <div style={{
        position: "absolute", top: 120, left: 0, right: 0,
        textAlign: "center",
        opacity: titleEntrance,
        transform: `translateY(${interpolate(titleEntrance, [0, 1], [-20, 0])}px)`,
      }}>
        <p style={{ fontSize: 22, color: colors.primary, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
          AI Pipeline
        </p>
        <h2 style={{ fontSize: 60, fontWeight: 800, color: colors.white, margin: 0 }}>
          Han is thinking
          <span style={{
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>...</span>
        </h2>
      </div>

      {/* Large signal bars — center stage */}
      <div style={{
        position: "absolute", top: "38%", left: "50%",
        transform: `translate(-50%, -50%) scale(${barScale})`,
      }}>
        <SignalBars size={140} animate />
      </div>

      {/* Pipeline steps — scroll in from bottom */}
      <div style={{
        position: "absolute", bottom: 80, left: "50%",
        transform: "translateX(-50%)",
        width: 900,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {STEPS.map((step, i) => {
          const stepFrame = step.time * fps;
          const stepProgress = interpolate(frame, [stepFrame, stepFrame + fps * 0.4], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          });

          if (frame < stepFrame) return null;

          return (
            <div key={step.label} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: "14px 24px",
              opacity: stepProgress,
              transform: `translateX(${interpolate(stepProgress, [0, 1], [20, 0])}px)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 24 }}>{step.icon}</span>
                <span style={{ fontSize: 22, color: colors.muted }}>{step.label}</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 600, color: step.color }}>{step.result}</span>
            </div>
          );
        })}
      </div>

      {/* Cost badge — appears after pipeline completes */}
      {frame >= 6.5 * fps && (
        <div style={{
          position: "absolute", top: 60, right: 80,
          opacity: interpolate(costEntrance, [0, 1], [0, 1]),
          transform: `scale(${interpolate(costEntrance, [0, 1], [0.8, 1])})`,
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 100, padding: "10px 24px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20, color: colors.success }}>●</span>
          <span style={{ fontSize: 20, color: colors.success, fontWeight: 600 }}>Cost: ₦0.0009</span>
        </div>
      )}
    </AbsoluteFill>
  );
}
