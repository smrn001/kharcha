import { NativeBlock } from '@/components/native-block';
import { Icon, ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { categoryDisplayName } from '@/lib/i18n';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount } from '@/lib/format';
import type { AnalyticsPeriod } from '@/lib/analytics';
import type { CategorySpending } from '@/lib/db/analytics-queries';
import { View } from 'react-native';

export function CategoryBreakdown({
  period,
  currency,
  categories,
  loading,
}: {
  period: AnalyticsPeriod;
  currency: string;
  categories: CategorySpending[];
  loading: boolean;
}) {
  const { t, lang } = useI18n();
  const colors = useTheme();

  if (loading && categories.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {t('common.loading')}
        </Text>
      </NativeBlock>
    );
  }
  if (categories.length === 0) {
    return (
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
          {t(period === 'week' ? 'an.noCatWeek' : period === 'month' ? 'an.noCatMonth' : 'an.noCatYear')}
        </Text>
      </NativeBlock>
    );
  }

  return (
    <View>
      {categories.map((category) => (
        <NativeBlock key={category.categoryId} matchContents={false}>
          <ListItem
            leading={<Icon name={categoryIcon(category.icon)} size={18} />}
            children={categoryDisplayName(category, lang)}
            supportingText={`${formatAmount(category.amount, currency)} · ${category.percentage}%`}
          />
        </NativeBlock>
      ))}
    </View>
  );
}