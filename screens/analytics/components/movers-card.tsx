import { NativeBlock } from '@/components/native-block';
import { Icon, ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { categoryDisplayName } from '@/lib/i18n';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount } from '@/lib/format';
import type { CategoryMover } from '@/lib/analytics';
import { View } from 'react-native';

export function MoversCard({
  currency,
  movers,
  loading,
}: {
  currency: string;
  movers: CategoryMover[];
  loading: boolean;
}) {
  const { t, lang } = useI18n();
  const colors = useTheme();
  const visible = movers.filter((mover) => mover.diff !== 0);
  if (loading && movers.length === 0) return null;
  if (visible.length === 0) return null;

  return (
    <View>
      {visible.map((mover) => {
        const up = mover.diff > 0;
        return (
          <NativeBlock key={mover.categoryId} matchContents={false}>
            <ListItem
              leading={<Icon name={categoryIcon(mover.icon)} size={18} />}
              children={categoryDisplayName(mover, lang)}
              supportingText={t('an.was', { amount: formatAmount(mover.previous, currency) })}
              trailing={
                <Text
                  textStyle={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: up ? colors.destructive : colors.success,
                  }}
                >
                  {`${up ? '+' : '−'}${formatAmount(Math.abs(mover.diff), currency)}`}
                </Text>
              }
            />
          </NativeBlock>
        );
      })}
    </View>
  );
}