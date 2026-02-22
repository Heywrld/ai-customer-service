// Scene 4 (34–45s): Stats + CTA
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
import { StatNumber } from "../components/StatNumber";

export function Scene4() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgProgress = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const logoProgress = spring({
    frame: frame - fps * 0.3,
    fps,
    config: { damping: 15, stiffness: 120 },
  });

  const ctaProgress = interpolate(frame, [fps * 7, fps * 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Divider line grows in
  const lineProgress = interpolate(frame, [fps * 1.5, fps * 2.2], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: font.family, overflow: "hidden" }}>

      {/* Background gradient bloom */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(14,165,233,0.07) 0%, transparent 70%)`,
        opacity: bgProgress,
      }} />

      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      {/* Center layout */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 60,
      }}>
        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 20,
          opacity: interpolate(logoProgress, [0, 1], [0, 1]),
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.8, 1])})`,
        }}>
          <SignalBars size={60} animate />
          <span style={{ fontSize: 64, fontWeight: 800, color: colors.white, letterSpacing: "-0.02em" }}>Han</span>
        </div>

        {/* Divider */}
        <div style={{
          width: 800, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)`,
          transform: `scaleX(${lineProgress})`,
        }} />

        {/* Stats grid */}
        <div style={{ display: "flex", gap: 100, alignItems: "flex-start" }}>
          <StatNumber label="Chats handled today" value="47" sublabel="WhatsApp + Voice" delay={fps * 1.5} />
          <StatNumber label="Human agent cost" value="₦0" sublabel="saved ₦15,000/month" delay={fps * 2.5} accent />
          <StatNumber label="Response time" value="<3s" sublabel="avg. response" delay={fps * 3.5} />
        </div>

        {/* Divider 2 */}
        <div style={{
          width: 600, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`,
        }} />

        {/* CTA */}
        <div style={{
          textAlign: "center",
          opacity: ctaProgress,
          transform: `translateY(${interpolate(ctaProgress, [0, 1], [20, 0])}px)`,
        }}>
          <p style={{
            fontSize: 36, fontWeight: 700, color: colors.white,
            margin: "0 0 12px",
          }}>
            Set up in 10 minutes.
          </p>
          <p style={{
            fontSize: 28,
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0, fontWeight: 600,
          }}>
            han.ai → Get started free
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}
