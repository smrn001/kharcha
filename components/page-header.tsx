import { Column, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useTheme();
  return (
    <NativeBlock matchContents={false}>
      <Column style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 20 }} spacing={2}>
        <Text textStyle={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>{title}</Text>
        {subtitle ? (
          <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>{subtitle}</Text>
        ) : null}
      </Column>
    </NativeBlock>
  );
}