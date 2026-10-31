export const colors = {
  page: '#F6F7F9',
  surface: '#FFFFFF',
  ink: '#0E1726',
  muted: '#5B6475',
  mint: '#FFB020',
  mintDark: '#8A5300',
  midnight: '#0E1726',
  midnightInk: '#E9ECF3',
  line: '#E6E8EE',
  // The earlier screens' names, in the new palette, so screens this design didn't restyle still build and match.
  primary: '#FFB020',
  primaryDark: '#8A5300',
  primarySoft: '#FFF3D6',
  background: '#F6F7F9',
  text: '#0E1726',
  textMuted: '#5B6475',
  border: '#E6E8EE',
  success: '#8A5300',
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
