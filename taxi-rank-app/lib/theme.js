/**
 * lib/theme.js — E-RANK Design System
 * Single source of truth for all visual tokens.
 * Every component imports from here — no ad-hoc hex values in screen files.
 */

export const Colors = {
  // Backgrounds
  bgBase:     '#14161B',   // base app background
  bgCard:     '#1C1F26',   // cards / list items
  bgElevated: '#242832',   // modals, focused cards, dropdowns

  // Text
  textPrimary:   '#EDEEF0', // main readable text
  textSecondary: '#9BA1AC', // labels, timestamps, helper text
  textDisabled:  '#4A4F5C',

  // Brand
  accent:  '#D9A441',   // amber/gold — one primary action per screen only
  success: '#4CAF7D',   // muted green
  error:   '#E0685A',   // muted red-orange
  warning: '#D9A441',   // reuse amber for warnings

  // Structural
  border:    '#2E323C',
  separator: '#252830',

  // Overlay
  overlay: 'rgba(0,0,0,0.6)',
};

export const Typography = {
  // Font family — system sans-serif (Inter if loaded, otherwise OS default)
  family: undefined, // React Native uses system font by default

  // Sizes
  size: {
    xs:  12,
    sm:  14,
    md:  16,   // minimum body size
    lg:  18,
    xl:  22,
    xxl: 28,
    hero: 36,
  },

  // Weights — never below 400 on dark backgrounds
  weight: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },

  // Line heights
  lineHeight: {
    tight:   1.2,
    normal:  1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  // Base unit: 8px — all values are multiples
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm:  6,
  md:  10,
  lg:  16,
  xl:  24,
  full: 999,
};

export const Shadow = {
  // Subtle elevation for cards on dark backgrounds
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Minimum tap target — 44×44px, enforced on every interactive element
export const MIN_TAP_TARGET = 44;
