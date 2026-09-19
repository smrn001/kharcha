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
 */
export function NativeBlock({ children, style, matchContents = true }: NativeBlockProps) {
  return (
    <Host
      style={style}
      colorScheme={useColorScheme() ?? undefined}
      matchContents={matchContents ? true : undefined}
    >
      {children}
    </Host>
  );
}