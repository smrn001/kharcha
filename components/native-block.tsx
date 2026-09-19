import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export interface NativeBlockProps {
  children: ReactNode;
  /**
   * On Android this is forwarded to the Compose `Host`. Defaults to hugging
   * the content on both axes. When `false`, the host fills the parent's width
   * but hugs the content's height (`{ vertical: true }`) — Compose content
   * doesn't contribute to React Native's measure, so a full "fill the slot"
   * host collapses inside an RN ScrollView.
   * @defaultValue true
   */
  matchContents?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function NativeBlock({ children, style, matchContents }: NativeBlockProps) {
  void matchContents;
  return <View style={style}>{children}</View>;
}