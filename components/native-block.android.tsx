import { Host } from '@expo/ui';
import { useColorScheme } from 'react-native';
import type { NativeBlockProps } from './native-block';

/**
 * Android: every universal `@expo/ui` component must be a direct descendant
 * of a Compose `Host` — an interposed React Native `View` breaks the Compose
 * composition boundary (`ExpoComposeView.validateHostingAncestor`). This
 * wrapper provides that boundary. The `Host` must hold exactly one child.
 *
 * `colorScheme` is pinned to the RN-reported scheme so the Material 3 palette
 * (dynamic wallpaper colours included) always matches the rest of the app.
 *
 * Sizing: by default the host hugs the content on both axes. `matchContents`
 * set to `false` is reinterpreted as fill-width / hug-height (`{ vertical:
 * true }`): the Compose content does not contribute to React Native's
 * measurement, so "fill the parent slot" collapses to zero height inside an
 * RN-measured ScrollView. Height from Compose, width from the parent (which
 * stretches in ScrollViews and columns), keeps rows full-width and visible.
 */
export function NativeBlock({ children, style, matchContents = true }: NativeBlockProps) {
  const hostMatch = matchContents === false ? ({ vertical: true } as const) : true;
  return (
    <Host
      style={style}
      colorScheme={useColorScheme() ?? undefined}
      matchContents={hostMatch}
    >
      {children}
    </Host>
  );
}