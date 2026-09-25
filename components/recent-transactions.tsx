import { NativeBlock } from '@/components/native-block';
import { TransactionFieldRow } from '@/components/transaction-row';
import { Button, Column, FieldGroup, Host, Icon, ListItem, Text } from '@expo/ui';
import { ARROW_RIGHT_ICON } from '@/lib/icons';
import { useI18n } from '@/hooks/use-i18n';
import { useTheme } from '@/lib/theme';
import { View, useColorScheme } from 'react-native';
import type { Category, Transaction } from '@/types';

/**
 * Recent-transactions section shared by Home (grouped FieldGroup list) and
 * Analytics (manually composed rows). Header, rows, and empty state are
 * identical; only the list container differs.
 *
 * NOTE (Android): the grouped variant's rows must stay direct Section
 * children — a wrapper returning several rows would collapse into a single
 * ListItem. Single-row components are safe direct children.
 */

/**
 * Corner radii mirroring `@expo/ui`'s internal `FieldSection` corner math
 * (20dp at a group's outer corners, 4dp between rows) so `ConnectedRow` rows
 * are visually indistinguishable from real `FieldGroup` section rows. If a
 * future `@expo/ui` release changes those values, update them here.
 */
const CORNER_FULL = 20;
const CORNER_SMALL = 4;

/**
 * Outer shell reproducing a FieldGroup row: surfaceContainer paint is applied
 * by the inner `ListItem`, this only provides the per-position corner clip.
 * Use for one row's content; siblings are spaced by the parent's gap.
 */
export function ConnectedRow({
  first,
  last,
  children,
}: {
  first: boolean;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderTopLeftRadius: first ? CORNER_FULL : CORNER_SMALL,
        borderTopRightRadius: first ? CORNER_FULL : CORNER_SMALL,
        borderBottomLeftRadius: last ? CORNER_FULL : CORNER_SMALL,
        borderBottomRightRadius: last ? CORNER_FULL : CORNER_SMALL,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}
export function RecentTransactions({
  title,
  subtitle,
  seeAllLabel,
  transactions,
  categoryById,
  currency,
  onSeeAll,
  onTransactionPress,
  variant,
  headerPaddingHorizontal = 0,
}: {
  title: string;
  subtitle?: string;
  seeAllLabel: string;
  transactions: Transaction[];
  categoryById: Map<string, Category>;
  currency: string;
  onSeeAll: () => void;
  onTransactionPress: (id: string) => void;
  variant: 'grouped' | 'divided';
  headerPaddingHorizontal?: number;
}) {
  const colors = useTheme();
  const scheme = useColorScheme();
  const { t } = useI18n();

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: headerPaddingHorizontal,
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 17, fontWeight: 'bold', color: colors.text }}>
              {title}
            </Text>
          </NativeBlock>
          {subtitle ? (
            <NativeBlock>
              <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{subtitle}</Text>
            </NativeBlock>
          ) : null}
        </View>
        <NativeBlock>
          <Button
            variant="text"
            onPress={onSeeAll}
            style={{ paddingVertical: 0, paddingHorizontal: 0 }}
          >
            <Text textStyle={{ fontSize: 14, fontWeight: '500', color: colors.primary }}>
              {seeAllLabel}
            </Text>
            <Icon name={ARROW_RIGHT_ICON} size={14} color={colors.primary} />
          </Button>
        </NativeBlock>
      </View>

      {variant === 'grouped' ? (
        <Host style={{ flex: 1 }} colorScheme={scheme ?? undefined}>
          <FieldGroup>
            <FieldGroup.Section>
              {transactions.length === 0 ? (
                <Column spacing={4}>
                  <Text
                    textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' }}
                  >
                    {t('home.emptyTitle')}
                  </Text>
                  <Text
                    textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}
                  >
                    {t('home.emptyMsg')}
                  </Text>
                </Column>
              ) : (
                transactions.map((transaction) => (
                  <TransactionFieldRow
                    key={transaction.id}
                    transaction={transaction}
                    category={
                      transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined
                    }
                    currency={currency}
                    onPress={() => onTransactionPress(transaction.id)}
                  />
                ))
              )}
            </FieldGroup.Section>
          </FieldGroup>
        </Host>
      ) : transactions.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: 20,
            paddingVertical: 24,
            paddingHorizontal: 20,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <NativeBlock>
            <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              {t('home.emptyTitle')}
            </Text>
          </NativeBlock>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              {t('home.emptyMsg')}
            </Text>
          </NativeBlock>
        </View>
      ) : (
        // Same native tree as the grouped variant's rows: an M3 ListItem
        // painted surfaceContainer holding the row in its headline slot. The
        // outer shell only reproduces the section's per-position corner clip.
        <View style={{ gap: 2 }}>
          {transactions.map((transaction, index) => (
            <ConnectedRow
              key={transaction.id}
              first={index === 0}
              last={index === transactions.length - 1}
            >
              <NativeBlock matchContents={false}>
                <ListItem colors={{ containerColor: colors.surfaceContainer }}>
                  <TransactionFieldRow
                    transaction={transaction}
                    category={
                      transaction.categoryId ? categoryById.get(transaction.categoryId) : undefined
                    }
                    currency={currency}
                    onPress={() => onTransactionPress(transaction.id)}
                  />
                </ListItem>
              </NativeBlock>
            </ConnectedRow>
          ))}
        </View>
      )}
    </>
  );
}