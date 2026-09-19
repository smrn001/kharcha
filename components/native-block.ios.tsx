import { View } from 'react-native';
import type { NativeBlockProps } from './native-block';

export function NativeBlock({ children, style }: NativeBlockProps) {
  return <View style={style}>{children}</View>;
}