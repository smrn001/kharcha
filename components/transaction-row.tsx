import { Icon, ListItem, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { useAppColors } from '@/lib/colors';
import { categoryIcon } from '@/lib/category-icons';
import { formatTime } from '@/lib/dates';
import { formatAmount } from '@/lib/format';
import { categoryDisplayName } from '@/lib/i18n';
import type { Category, Transaction } from '@/types';

export function TransactionRow({
  transaction,
  category,
  currency,
  onPress,
}: {
  transaction: Transaction;
  category?: Category;
  currency: string;
  onPress?: () => void;
}) {
  const colors = useAppColors();
  const isIncome = transaction.type === 'income';
  const { t, lang } = useI18n();
  const name = category ? categoryDisplayName(category, lang) : undefined;
  const supporting =
    name + (transaction.date ? ` · ${formatTime(transaction.date)}` : '');

  return (
    <ListItem
      leading={<Icon name={categoryIcon(category?.icon)} size={18} />}
      supportingText={supporting}
      trailing={
        <Text
          textStyle={{
            fontSize: 14,
            fontWeight: '600',
            color: isIncome ? colors.positive : undefined,
          }}
        >
          {isIncome ? '+' : '-'}
          {formatAmount(transaction.amount, currency)}
        </Text>
      }
      onPress={onPress}
    >
      {transaction.title ?? name ?? t('row.transaction')}
    </ListItem>
  );
}