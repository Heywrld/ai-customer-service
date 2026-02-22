// Scene 1 (0–10s): Customer sends a WhatsApp message
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { colors, font, gradient, FRAMES } from "../tokens";
import { SignalBars } from "../components/SignalBars";
import { WhatsAppBubble, TypingIndicator } from "../components/WhatsAppBubble";

const MESSAGE = "Abeg, you get size 12 sandals?\nHow much e go cost?";
const REPLY = "Hi! Yes we get size 12 👟\nThe Lagos Blue sandal dey ₦18,500.\nWe fit deliver to you tomorrow!";

const PHONE_W = 420;
const PHONE_H = 740;

export function Scene1() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slide in
  const phoneEntrance = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const phoneY = interpolate(phoneEntrance, [0, 1], [80, 0]);
  const phoneOpacity = interpolate(phoneEntrance, [0, 1], [0, 1]);

  // Customer message appears at 2s
  const msgProgress = spring({
    frame: frame - 2 * fps,
    fps,
    config: { damping: 20, stiffness: 150 },
  });

  // Left label slides in at 1s
  const labelProgress = interpolate(frame, [fps * 1, fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Title fade in
  const titleProgress = interpolate(frame, [0, fps * 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: font.family }}>

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />

      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "30%", left: "20%",
        width: 600, height: 400,
        background: "radial-gradient(ellipse, rgba(14,165,233,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />

      {/* Han branding — top left */}
      <div style={{
        position: "absolute", top: 60, left: 80,
        display: "flex", alignItems: "center", gap: 16,
        opacity: titleProgress,
      }}>
        <SignalBars size={36} animate />
        <span style={{ fontSize: 32, fontWeight: 700, color: colors.white }}>Han</span>
      </div>

      {/* Left side — headline */}
      <div style={{
        position: "absolute", left: 120, top: 0, bottom: 0,
        width: 600,
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 20,
        opacity: labelProgress,
        transform: `translateX(${interpolate(labelProgress, [0, 1], [-30, 0])}px)`,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(14,165,233,0.1)",
          border: "1px solid rgba(14,165,233,0.2)",
          borderRadius: 100, padding: "8px 20px", width: "fit-content",
        }}>
          <span style={{ fontSize: 20, color: "#25D366" }}>●</span>
          <span style={{ fontSize: 20, color: colors.primary, fontWeight: 500 }}>
            WhatsApp · Live
          </span>
        </div>

        <h1 style={{
          fontSize: 72, fontWeight: 800, color: colors.white,
          margin: 0, lineHeight: 1.1,
        }}>
          Customer
          <br />
          <span style={{
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            messages.
          </span>
        </h1>

        <p style={{ fontSize: 28, color: colors.muted, margin: 0, lineHeight: 1.5, maxWidth: 480 }}>
          A customer reaches out on WhatsApp — in English, Pidgin, or both.
        </p>
      </div>

      {/* Phone mockup — right side */}
      <div style={{
        position: "absolute", right: 160, top: "50%",
        transform: `translateY(calc(-50% + ${phoneY}px))`,
        opacity: phoneOpacity,
        width: PHONE_W,
        height: PHONE_H,
        borderRadius: 40,
        background: colors.whatsappBg,
        border: `1px solid rgba(255,255,255,0.1)`,
        boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* WhatsApp header */}
        <div style={{
          background: colors.whatsappSurface,
          padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: `linear-gradient(135deg, #0EA5E9, #06B6D4)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <SignalBars size={20} animate={false} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#E9EDEF" }}>Zara Lagos</p>
            <p style={{ margin: 0, fontSize: 16, color: "#8696A0" }}>online</p>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 22, color: "#25D366" }}>●</div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          padding: "20px 16px",
          display: "flex", flexDirection: "column",
          justifyContent: "flex-end", gap: 10,
          overflow: "hidden",
        }}>
          <WhatsAppBubble
            message={MESSAGE}
            role="sent"
            opacity={interpolate(msgProgress, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            scale={interpolate(msgProgress, [0, 1], [0.92, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            translateY={interpolate(msgProgress, [0, 1], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
            time="10:42"
          />

          {/* Typing dots — appear at 5s */}
          {frame > 5 * fps && frame < 8 * fps && (
            <TypingIndicator
              opacity={interpolate(frame, [5 * fps, 5.5 * fps], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}
            />
          )}

          {/* Han reply — at 8s */}
          {frame >= 8 * fps && (
            <WhatsAppBubble
              message={REPLY}
              role="received"
              opacity={interpolate(frame, [8 * fps, 8.5 * fps], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}
              scale={interpolate(frame, [8 * fps, 8.5 * fps], [0.92, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}
              time="10:42"
            />
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}
