import { useColorScheme, Platform } from 'react-native';
import { getMaterialColors } from '@expo/ui/jetpack-compose';

/**
 * Centralized design tokens. Components consume these semantic tokens rather
 * than raw colors; platform-specific colour choices live here and here only.
 *
 * - iOS: Apple system-semantic values (systemBackground, label, separator,
 *   systemRed/Green/Orange/Blue...) picked per appearance.
 * - Android 12+: Material 3-aligned neutrals; the `@expo/ui` components
 *   additionally resolve the dynamic (wallpaper-derived) Material 3 palette
 *   inside their `Host`s, so component surfaces pick up dynamic colour
 *   automatically. Your scheme preference is pushed into every `Host` so the
 *   Compose palette always matches the React Native side.
 */
export interface ThemeTokens {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  destructive: string;
  success: string;
  warning: string;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  display: 34,
} as const;

const iosLight: ThemeTokens = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#6E6E73',
  border: '#C6C6C8',
  primary: '#007AFF',
  destructive: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
};

const iosDark: ThemeTokens = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  border: '#3A3A3C',
  primary: '#0A84FF',
  destructive: '#FF453A',
  success: '#30D158',
  warning: '#FF9F0A',
};

const androidLight: ThemeTokens = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#1C1C1E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#0A84FF',
  destructive: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

const androidDark: ThemeTokens = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  border: '#3A3A3C',
  primary: '#8AB4F8',
  destructive: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
};

export function useTheme(): ThemeTokens {
  const scheme = useColorScheme();

  if (Platform.OS === 'ios') {
    return scheme === 'dark' ? iosDark : iosLight;
  }

  // Mirror the palette the Compose `Host`s are themed with: on Android 12+
  // this is the wallpaper-derived (Material You) scheme, otherwise the Material
  // 3 baseline. `scheme` is pushed into every `Host` too, so the React Native
  // canvas and the Compose components always agree.
  if (Platform.OS === 'android') {
    const m3 = getMaterialColors({ scheme: scheme === 'dark' ? 'dark' : 'light' });
    return {
      background: m3.background,
      surface: m3.surfaceVariant,
      text: m3.onSurface,
      textSecondary: m3.onSurfaceVariant,
      border: m3.outlineVariant,
      primary: m3.primary,
      destructive: m3.error,
      success: scheme === 'dark' ? androidDark.success : androidLight.success,
      warning: scheme === 'dark' ? androidDark.warning : androidLight.warning,
    };
  }

  return scheme === 'dark' ? androidDark : androidLight;
}