/**
 * Design tokens — mirrors design/design-system.md.
 * Light liquid glass (canonical) + dark charcoal glass.
 * Ink = neutral emphasis (inverts in dark). red = drive/intensity,
 * green = progress/done. Everything else stays monochrome.
 */

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  // surfaces
  canvas: string; // page / device background
  glassBg: string; // frosted panel fill (used with a BlurView underneath)
  glassBorder: string;
  fieldBg: string;
  fillSoft: string; // subtle inset fill (e.g. macro chips)
  // emphasis
  ink: string; // primary buttons, selected cards, dial band
  onInk: string; // text/icon on ink
  // signal
  red: string;
  redText: string; // red readable on canvas
  green: string;
  greenText: string;
  // text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  // lines
  hairline: string;
  track: string;
  // blur radius for glass surfaces (expo-blur intensity is 0-100)
  blurIntensity: number;
  blurTint: 'light' | 'dark' | 'default';
}

export const light: Theme = {
  name: 'light',
  canvas: '#E6E7EA',
  glassBg: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.6)',
  fieldBg: 'rgba(255,255,255,0.5)',
  fillSoft: 'rgba(20,20,25,0.06)',
  ink: '#16171A',
  onInk: '#F7F7F8',
  red: '#FB2C36',
  redText: '#D81E28',
  green: '#10B981',
  greenText: '#0A8F63',
  textPrimary: '#1A1B1E',
  textSecondary: '#6C6F76',
  textMuted: '#8C9098',
  textDisabled: '#B4B7BD',
  hairline: 'rgba(20,20,25,0.06)',
  track: 'rgba(20,20,25,0.08)',
  blurIntensity: 40,
  blurTint: 'light',
};

export const dark: Theme = {
  name: 'dark',
  canvas: '#0A0B0D',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.10)',
  fieldBg: 'rgba(255,255,255,0.05)',
  fillSoft: 'rgba(255,255,255,0.06)',
  ink: '#F4F5F7', // inverted neutral emphasis
  onInk: '#0C0D0F',
  red: '#FF3B47',
  redText: '#FF6169',
  green: '#2DD576',
  greenText: '#4EE08C',
  textPrimary: '#F4F5F7',
  textSecondary: '#A6ABB2',
  textMuted: '#7C828A',
  textDisabled: '#4E545C',
  hairline: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.08)',
  blurIntensity: 30,
  blurTint: 'dark',
};

export const themes: Record<ThemeName, Theme> = { light, dark };

export const radius = {
  control: 14,
  card: 18,
  panel: 20,
  screen: 30,
  pill: 999,
} as const;

export const space = { xs: 6, sm: 10, md: 14, lg: 18, xl: 22 } as const;
