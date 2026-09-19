import { Host } from '@expo/ui';
import type { NativeBlockProps } from './native-block';

/**
 * Android: every universal `@expo/ui` component must be a direct descendant
 * of a Compose `Host` — an interposed React Native `View` breaks the Compose
 * composition boundary (`ExpoComposeView.validateHostingAncestor`). This
 * wrapper provides that boundary. The `Host` must hold exactly one child.
 */
export function NativeBlock({ children, style, matchContents = true }: NativeBlockProps) {
  return (
    <Host style={style} matchContents={matchContents ? true : undefined}>
      {children}
    </Host>
  );
}