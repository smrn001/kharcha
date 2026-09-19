import { useColorScheme } from 'react-native';

/**
 * Semantic colors that the native UI defaults cannot express: money
 * (income vs. spending), errors, and softly muted surfaces. Everything else
 * is left to the device-adaptive `@expo/ui` defaults.
 */
export interface AppColors {
  positive: string;
  destructiveError: string;
  mutedForeground: string;
  mutedBackground: string;
  separator: string;
}

const light: AppColors = {
  positive: '#16A34A',
  destructiveError: '#DC2626',
  mutedForeground: '#6B7280',
  mutedBackground: '#F3F4F6',
  separator: '#E5E7EB',
};

const dark: AppColors = {
  positive: '#4ADE80',
  destructiveError: '#F87171',
  mutedForeground: '#9CA3AF',
  mutedBackground: '#1F2937',
  separator: '#374151',
};

export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}