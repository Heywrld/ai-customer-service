// Han brand tokens — shared across all Remotion scenes
export const colors = {
  bg: "#050A14",
  surface: "#0F172A",
  surface2: "#1E293B",
  surface3: "#273548",
  border: "rgba(255,255,255,0.06)",
  primary: "#0EA5E9",
  cyan: "#06B6D4",
  white: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#475569",
  whatsapp: "#25D366",
  whatsappBg: "#0B141A",
  whatsappSurface: "#1F2C34",
  whatsappSent: "#005C4B",
  success: "#22C55E",
  warning: "#F59E0B",
};

export const gradient = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.cyan} 100%)`;
export const gradientDark = `linear-gradient(135deg, #38BDF8 0%, #22D3EE 100%)`;

export const font = {
  family: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

// Video config
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene durations in seconds
export const SCENE_DURATIONS = {
  s1: 10, // WhatsApp typing
  s2: 10, // AI processing + reply
  s3: 14, // Dashboard view
  s4: 11, // Stats
} as const;

// Converted to frames
export const FRAMES = {
  s1: SCENE_DURATIONS.s1 * FPS,
  s2: SCENE_DURATIONS.s2 * FPS,
  s3: SCENE_DURATIONS.s3 * FPS,
  s4: SCENE_DURATIONS.s4 * FPS,
  total: Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) * FPS,
} as const;
