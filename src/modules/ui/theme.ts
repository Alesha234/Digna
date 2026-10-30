export const colors = {
  primary: "#2F6FED",
  primaryDark: "#1E54C8",
  primarySoft: "#E8EFFD",
  background: "#F6F8FB",
  surface: "#FFFFFF",
  text: "#1A2333",
  textMuted: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  white: "#FFFFFF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const shadows = {
  soft: "0 1px 2px rgba(16, 24, 40, 0.06)",
  card: "0 4px 16px rgba(16, 24, 40, 0.08)",
} as const;

export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 20,
  sizeXl: 24,
  weightRegular: 400,
  weightMedium: 500,
  weightBold: 700,
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
} as const;
