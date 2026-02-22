import { colors, font } from "../tokens";

interface BubbleProps {
  message: string;
  role: "sent" | "received";
  time?: string;
  opacity?: number;
  scale?: number;
  translateY?: number;
}

export function WhatsAppBubble({
  message,
  role,
  time = "10:42",
  opacity = 1,
  scale = 1,
  translateY = 0,
}: BubbleProps) {
  const isSent = role === "sent";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isSent ? "flex-end" : "flex-start",
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transformOrigin: isSent ? "bottom right" : "bottom left",
      }}
    >
      <div
        style={{
          maxWidth: "65%",
          backgroundColor: isSent ? colors.whatsappSent : colors.whatsappSurface,
          borderRadius: isSent ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "12px 16px 8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        <p
          style={{
            fontFamily: font.family,
            fontSize: 28,
            color: "#E9EDEF",
            margin: 0,
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>
        <p
          style={{
            fontFamily: font.family,
            fontSize: 18,
            color: "rgba(233,237,239,0.5)",
            margin: "4px 0 0",
            textAlign: "right",
          }}
        >
          {time} {isSent && "✓✓"}
        </p>
      </div>
    </div>
  );
}

// Typing indicator dots
export function TypingIndicator({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", opacity }}>
      <div
        style={{
          backgroundColor: colors.whatsappSurface,
          borderRadius: "4px 16px 16px 16px",
          padding: "16px 20px",
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#8696A0",
            }}
          />
        ))}
      </div>
    </div>
  );
}
