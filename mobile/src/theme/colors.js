// CampusBridge Design System — Colors (Dark mode first, matching web app)
export const Colors = {
  // Primary brand gradient colors
  primary: '#6366f1',       // indigo-500
  primaryDark: '#4f46e5',   // indigo-600
  primaryLight: '#818cf8',  // indigo-400
  secondary: '#a855f7',     // purple-500
  secondaryDark: '#9333ea', // purple-600
  accent: '#22d3ee',        // cyan-400

  // Background layers (True AMOLED black theme)
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1a1a1a',
  surfaceBorder: '#2a2a2a',
  card: '#0a0a0a',
  cardHover: '#151515',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',

  // Status
  success: '#22c55e',
  successBg: 'rgba(34,197,94,0.15)',
  warning: '#f59e0b',
  warningBg: 'rgba(245,158,11,0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239,68,68,0.15)',
  info: '#3b82f6',
  infoBg: 'rgba(59,130,246,0.15)',

  // Gradients (use as array for LinearGradient)
  gradientPrimary: ['#6366f1', '#a855f7'],
  gradientDark: ['#000000', '#0a0a0a'],
  gradientCard: ['#0a0a0a', '#121212'],
  gradientHeader: ['#000000', '#0a0a0a'],

  // Tab bar
  tabActive: '#a855f7',
  tabInactive: '#64748b',
  tabBg: '#000000',
  tabBorder: '#1a1a1a',

  // Input
  inputBg: '#121212',
  inputBorder: '#2a2a2a',
  inputFocus: '#a855f7',
  inputText: '#f1f5f9',
  inputPlaceholder: '#64748b',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
  shimmer: '#252548',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const Shadow = {
  sm: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};
