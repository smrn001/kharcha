import { Column, Text } from '@expo/ui';
import { useAppColors } from '@/lib/colors';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useAppColors();
  return (
    <Column style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 20 }} spacing={2}>
      <Text textStyle={{ fontSize: 24, fontWeight: 'bold' }}>{title}</Text>
      {subtitle ? (
        <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>{subtitle}</Text>
      ) : null}
    </Column>
  );
}