// Scene 3 (20–34s): Dashboard view — conversation logged
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

function DashboardCard({
  label,
  value,
  sub,
  accentColor,
  delay,
}: {
  label: string;
  value: string;
  sub?: string;
  accentColor: string;
  delay: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140 } });

  return (
    <div style={{
      flex: 1,
      background: colors.surface,
      border: `1px solid rgba(255,255,255,0.05)`,
      borderRadius: 20, padding: "28px 32px",
      opacity: interpolate(progress, [0, 1], [0, 1]),
      transform: `translateY(${interpolate(progress, [0, 1], [24, 0])}px)`,
    }}>
      <p style={{ fontSize: 18, color: colors.muted, margin: "0 0 12px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontSize: 56, fontWeight: 800, margin: 0, color: accentColor, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 18, color: colors.faint, margin: "8px 0 0" }}>{sub}</p>}
    </div>
  );
}

function ConversationRow({
  name, preview, model, cost, delay, isNew
}: {
  name: string; preview: string; model: string;
  cost: string; delay: number; isNew?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 150 } });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "18px 24px",
      background: isNew ? "rgba(14,165,233,0.05)" : "transparent",
      borderRadius: 14,
      border: isNew ? "1px solid rgba(14,165,233,0.12)" : "1px solid transparent",
      opacity: interpolate(progress, [0, 1], [0, 1]),
      transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
    }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: isNew ? gradient : colors.surface3,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: colors.white, fontWeight: 700, flexShrink: 0,
      }}>
        {name[0]}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: isNew ? colors.white : colors.muted }}>{name}</p>
        <p style={{ margin: "2px 0 0", fontSize: 18, color: colors.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {preview}
        </p>
      </div>
      {/* Model badge */}
      <span style={{
        padding: "4px 14px", borderRadius: 100, fontSize: 16, fontWeight: 600,
        background: model === "Haiku" ? "rgba(14,165,233,0.1)" : "rgba(167,139,250,0.1)",
        color: model === "Haiku" ? colors.primary : "#A78BFA",
        border: `1px solid ${model === "Haiku" ? "rgba(14,165,233,0.2)" : "rgba(167,139,250,0.2)"}`,
      }}>
        {model === "Haiku" ? "⚡" : "🧠"} {model}
      </span>
      {/* Cost */}
      <span style={{ fontSize: 20, color: colors.success, fontWeight: 600, minWidth: 100, textAlign: "right" }}>
        {cost}
      </span>
    </div>
  );
}

export function Scene3() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = interpolate(frame, [0, fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily: font.family }}>

      {/* Sidebar */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        width: 280,
        background: colors.surface,
        borderRight: `1px solid rgba(255,255,255,0.04)`,
        display: "flex", flexDirection: "column",
        padding: "40px 0",
        opacity: headerProgress,
      }}>
        {/* Logo */}
        <div style={{ padding: "0 32px 40px", display: "flex", alignItems: "center", gap: 12 }}>
          <SignalBars size={28} animate />
          <span style={{ fontSize: 26, fontWeight: 700, color: colors.white }}>Han</span>
        </div>

        {/* Nav items */}
        {[
          { icon: "🏠", label: "Dashboard", active: false },
          { icon: "💬", label: "Conversations", active: true },
          { icon: "⚡", label: "FAQs", active: false },
          { icon: "📊", label: "Analytics", active: false },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 32px",
            background: item.active ? "rgba(14,165,233,0.08)" : "transparent",
            borderLeft: item.active ? "3px solid #0EA5E9" : "3px solid transparent",
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 20, color: item.active ? colors.white : colors.faint, fontWeight: item.active ? 600 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: "absolute", left: 280, top: 0, right: 0, bottom: 0,
        padding: "48px 56px",
        display: "flex", flexDirection: "column", gap: 32,
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          opacity: headerProgress,
        }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 800, color: colors.white, margin: "0 0 4px" }}>
              Conversations
            </h1>
            <p style={{ fontSize: 20, color: colors.muted, margin: 0 }}>
              Today · 47 total
            </p>
          </div>
          <div style={{
            display: "flex", gap: 12, alignItems: "center",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 100, padding: "10px 24px",
          }}>
            <span style={{ fontSize: 18, color: colors.success }}>●</span>
            <span style={{ fontSize: 18, color: colors.success, fontWeight: 600 }}>AI active</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 20 }}>
          <DashboardCard label="Chats today" value="47" sub="+12 vs yesterday" accentColor={colors.white} delay={fps * 0.3} />
          <DashboardCard label="Avg cost" value="₦0.18" sub="per conversation" accentColor={colors.success} delay={fps * 0.5} />
          <DashboardCard label="Resolved by AI" value="89%" sub="10 need attention" accentColor={colors.primary} delay={fps * 0.7} />
          <DashboardCard label="Cache hits" value="61%" sub="saves ₦4.20/day" accentColor="#A78BFA" delay={fps * 0.9} />
        </div>

        {/* Conversations list */}
        <div style={{
          flex: 1,
          background: colors.surface,
          borderRadius: 20,
          border: `1px solid rgba(255,255,255,0.05)`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: colors.white }}>Recent conversations</p>
          </div>
          <div style={{ padding: "8px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
            <ConversationRow name="Adunola B." preview="Abeg, you get size 12 sandals?" model="Haiku" cost="₦0.0009" delay={fps * 1.2} isNew />
            <ConversationRow name="Tunde O." preview="Do you deliver to Ikeja?" model="Haiku" cost="₦0.0007" delay={fps * 1.8} />
            <ConversationRow name="Chioma A." preview="My order never reach, abeg" model="Sonnet" cost="₦0.0043" delay={fps * 2.4} />
            <ConversationRow name="Kemi F." preview="How much is the red bag?" model="Haiku" cost="₦0.0006" delay={fps * 3.0} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
