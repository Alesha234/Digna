export const colors = {
  page: '#F4F8F7',
  surface: '#FFFFFF',
  ink: '#10201D',
  muted: '#5E6F6C',
  mint: '#0EC49A',
  mintDark: '#0A8F8A',
  midnight: '#0C1F2E',
  midnightInk: '#E8F3F0',
  line: '#E1EBE9',
  // The earlier screens' names, in the new palette, so screens this design didn't restyle still build and match.
  primary: '#0EC49A',
  primaryDark: '#0A8F8A',
  primarySoft: '#E3F7F1',
  background: '#F4F8F7',
  text: '#10201D',
  textMuted: '#5E6F6C',
  border: '#E1EBE9',
  success: '#0A8F8A',
  warning: '#D97706',
  danger: '#DC2626',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const radii = {
  card: 14,
  pill: 999,
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const shadows = {
  soft: '0 8px 24px rgba(16,32,29,0.08)',
  lift: '0 12px 32px rgba(16,32,29,0.12)',
  card: '0 8px 24px rgba(16,32,29,0.08)',
} as const;

export const typography = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "'Figtree', system-ui, sans-serif",
  fontFamily: "'Figtree', system-ui, sans-serif",
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
