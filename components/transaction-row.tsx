import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { categoryIcon } from '@/lib/category-icons';
import { formatTime } from '@/lib/dates';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Category, Transaction } from '@/types';
import { View } from 'react-native';

export function TransactionRow({
  transaction,
  category,
  currency,
}: {
  transaction: Transaction;
  category?: Category;
  currency: string;
}) {
  const IconComponent = categoryIcon(category?.icon);
  const isIncome = transaction.type === 'income';

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="bg-muted h-10 w-10 items-center justify-center rounded-full">
        <Icon as={IconComponent} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium" numberOfLines={1}>
          {transaction.title ?? category?.name ?? 'Transaction'}
        </Text>
        <Text variant="muted" className="text-xs">
          {category?.name}
          {transaction.date ? ` · ${formatTime(transaction.date)}` : ''}
        </Text>
      </View>
      <Text
        className={cn(
          'text-sm font-semibold',
          isIncome ? 'text-green-600 dark:text-green-400' : 'text-foreground'
        )}
      >
        {isIncome ? '+' : '-'}
        {formatAmount(transaction.amount, currency)}
      </Text>
    </View>
  );
}
