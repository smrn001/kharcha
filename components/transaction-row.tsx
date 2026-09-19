import { Button, Column, Icon, ListItem, Row, Spacer, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { categoryIcon } from '@/lib/category-icons';
import { formatTime } from '@/lib/dates';
import { formatAmount } from '@/lib/format';
import { categoryDisplayName, type DictionaryKey } from '@/lib/i18n';
import type { Category, Transaction } from '@/types';

/** Headline + supporting line shown by both row variants. */
function transactionText(
  transaction: Transaction,
  name: string | undefined,
  t: (key: DictionaryKey, params?: Record<string, string | number>) => string
) {
  const title = transaction.title ?? name ?? t('row.transaction');
  const supporting = name + (transaction.date ? ` · ${formatTime(transaction.date)}` : '');
  return { title, supporting };
}

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
  const colors = useTheme();
  const isIncome = transaction.type === 'income';
  const { t, lang } = useI18n();
  const name = category ? categoryDisplayName(category, lang) : undefined;
  const { title, supporting } = transactionText(transaction, name, t);

  return (
    <NativeBlock matchContents={false}>
      <ListItem
        leading={<Icon name={categoryIcon(category?.icon)} size={18} />}
        supportingText={supporting}
        trailing={
          <Text
            textStyle={{
              fontSize: 14,
              fontWeight: '600',
              color: isIncome ? colors.success : undefined,
            }}
          >
            {`${isIncome ? '+' : '-'}${formatAmount(transaction.amount, currency)}`}
          </Text>
        }
        onPress={onPress}
      >
        {title}
      </ListItem>
    </NativeBlock>
  );
}

/**
 * Variant for use inside a `FieldGroup.Section` (e.g. the transactions tab).
 * Renders pure universal components — it must sit directly under the section,
 * not behind a `NativeBlock` `Host`, so the section's own row styling
 * (surfaceContainer fill, rounded corners) applies.
 */
export function TransactionFieldRow({
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
  const colors = useTheme();
  const isIncome = transaction.type === 'income';
  const { t, lang } = useI18n();
  const name = category ? categoryDisplayName(category, lang) : undefined;
  const { title, supporting } = transactionText(transaction, name, t);

  return (
    <Button
      variant="text"
      onPress={onPress}
      style={{ paddingVertical: 0, paddingHorizontal: 0, borderRadius: 12 }}
    >
      <Row alignment="center" spacing={12}>
        <Icon name={categoryIcon(category?.icon)} size={18} />
        <Column spacing={2}>
          <Text textStyle={{ fontSize: 16, color: colors.text }}>{title}</Text>
          <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{supporting}</Text>
        </Column>
        <Spacer flexible />
        <Text
          textStyle={{
            fontSize: 14,
            fontWeight: '600',
            color: isIncome ? colors.success : colors.text,
          }}
        >
          {`${isIncome ? '+' : '-'}${formatAmount(transaction.amount, currency)}`}
        </Text>
      </Row>
    </Button>
  );
}