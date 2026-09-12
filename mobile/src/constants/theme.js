/**
 * Unified Theme Design Tokens
 * 100% parity with React web Tailwind styling
 */

export const COLORS = {
  // Brand Teals & Cyan
  primary: '#0f766e', // teal-700
  primaryDark: '#115e59', // teal-800
  primaryLight: '#0d9488', // teal-600
  primary50: '#f0fdfa', // teal-50
  primary100: '#ccfbf1', // teal-100
  primary200: '#99f6e4', // teal-200
  cyan500: '#06b6d4',
  cyan600: '#0891b2',
  cyan100: '#cffafe',

  // Emeralds & Greens
  emerald600: '#059669',
  emerald500: '#10b981',
  emerald100: '#d1fae5',
  emerald50: '#ecfdf5',

  // Secondary & Accents
  indigo600: '#4f46e5',
  indigo50: '#eef2ff',
  blue600: '#2563eb',
  blue500: '#3b82f6',
  blue100: '#dbeafe',
  blue50: '#eff6ff',

  // Alert & Risk Status
  red600: '#dc2626',
  red500: '#ef4444',
  red100: '#fee2e2',
  red50: '#fef2f2',

  orange600: '#ea580c',
  orange500: '#f97316',
  orange100: '#ffedd5',
  orange50: '#fff7ed',

  amber600: '#d97706',
  amber500: '#f59e0b',
  amber100: '#fef3c7',
  amber50: '#fffbeb',

  yellow500: '#eab308',
  yellow100: '#fef9c3',
  yellow50: '#fefce8',

  // Neutrals & Slate
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',

  white: '#ffffff',
  black: '#000000',
  border: '#e2e8f0',
  cardBg: '#ffffff',
  screenBg: '#f8fafc',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const STATUS_COLORS = {
  analyzing: { bg: COLORS.blue50, border: COLORS.blue100, text: COLORS.blue600, icon: COLORS.blue500 },
  stable: { bg: COLORS.emerald50, border: COLORS.emerald100, text: COLORS.emerald600, icon: COLORS.emerald500 },
  caution: { bg: COLORS.amber50, border: COLORS.amber100, text: COLORS.amber600, icon: COLORS.amber500 },
  uncertain: { bg: COLORS.amber50, border: COLORS.amber100, text: COLORS.amber600, icon: COLORS.amber500 },
  warning: { bg: COLORS.orange50, border: COLORS.orange100, text: COLORS.orange600, icon: COLORS.orange500 },
  critical: { bg: COLORS.red50, border: COLORS.red100, text: COLORS.red600, icon: COLORS.red500 },
};

export const RISK_BADGES = {
  CRITICAL: { bg: COLORS.red600, text: COLORS.white, lightBg: COLORS.red50, lightText: COLORS.red600 },
  HIGH: { bg: COLORS.orange500, text: COLORS.white, lightBg: COLORS.orange50, lightText: COLORS.orange600 },
  MEDIUM: { bg: COLORS.amber500, text: COLORS.white, lightBg: COLORS.amber50, lightText: COLORS.amber600 },
  LOW: { bg: COLORS.emerald500, text: COLORS.white, lightBg: COLORS.emerald50, lightText: COLORS.emerald600 },
};
