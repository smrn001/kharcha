import { NativeBlock } from '@/components/native-block';
import { Button, Icon, Text } from '@expo/ui';
import { useI18n } from '@/hooks/use-i18n';
import { SEARCH_ICON } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { View } from 'react-native';

/** Empty state for the transactions list: no data vs. no filter matches. */
export function TransactionListEmpty({
  hasActiveFilters,
  hasQuery,
  resultCount,
  loading,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  hasQuery: boolean;
  resultCount: number;
  loading: boolean;
  onClearFilters: () => void;
}) {
  const { t } = useI18n();
  const colors = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 12, paddingVertical: 64, paddingHorizontal: 20 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <NativeBlock>
          <Icon name={SEARCH_ICON} size={24} color={colors.textSecondary} />
        </NativeBlock>
      </View>
      <NativeBlock>
        <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
          {hasActiveFilters ? t('txns.noMatchTitle') : t('txns.emptyTitle')}
        </Text>
      </NativeBlock>
      <NativeBlock>
        <Text textStyle={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
          {hasActiveFilters ? t('txns.noMatchMsg') : t('txns.emptyMsg')}
        </Text>
      </NativeBlock>
      {hasQuery && !loading ? (
        <NativeBlock>
          <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
            {t('txns.found', { count: String(resultCount) })}
          </Text>
        </NativeBlock>
      ) : null}
      {hasActiveFilters ? (
        <NativeBlock>
          <Button label={t('txns.clearFilters')} variant="text" onPress={onClearFilters} />
        </NativeBlock>
      ) : null}
    </View>
  );
}