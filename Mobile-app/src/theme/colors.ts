// Design tokens extracted from Stitch project (925434934903259733)
// Primary: #1152D4, Font: Public Sans, Roundness: 8px, Saturation: 2

export const colors = {
  // Primary brand
  primary: '#1152D4',
  primaryLight: '#3A75E8',
  primaryDark: '#0D3FA3',
  primarySurface: '#E8EEFB',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0EA5E9',
  infoLight: '#E0F2FE',

  // Safety score gradient
  safetyHigh: '#16A34A',
  safetyMedium: '#F59E0B',
  safetyLow: '#DC2626',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Map overlays
  routeSafe: '#16A34A',
  routeModerate: '#F59E0B',
  routeDanger: '#DC2626',
  riskZoneOverlay: 'rgba(220, 38, 38, 0.2)',
  safeZoneOverlay: 'rgba(22, 163, 74, 0.15)',
};

export const lightColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
  statusBar: 'dark-content' as const,
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  mapOverlay: 'rgba(255, 255, 255, 0.9)',
  inputBackground: '#F3F4F6',
  skeleton: '#E5E7EB',
};

export const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  divider: '#1E293B',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  statusBar: 'light-content' as const,
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  mapOverlay: 'rgba(15, 23, 42, 0.9)',
  inputBackground: '#334155',
  skeleton: '#334155',
};
