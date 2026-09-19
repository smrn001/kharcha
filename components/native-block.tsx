import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export interface NativeBlockProps {
  children: ReactNode;
  /**
   * On Android this is forwarded to the Compose `Host`. When `true` the host
   * hugs its single child's intrinsic size instead of filling the React
   * layout slot.
   * @defaultValue true
   */
  matchContents?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function NativeBlock({ children, style, matchContents }: NativeBlockProps) {
  void matchContents;
  return <View style={style}>{children}</View>;
}