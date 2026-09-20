import { Icon, ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { categoryDisplayName } from '@/lib/i18n';
import { categoryIcon } from '@/lib/category-icons';
import { formatAmount } from '@/lib/format';
import type { CategoryMover } from '@/lib/analytics';

// Single section row — map directly under FieldGroup.Section.
export function MoverRow({ currency, mover }: { currency: string; mover: CategoryMover }) {
  const { t, lang } = useI18n();
  const colors = useTheme();
  const up = mover.diff > 0;
  return (
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
  );
}