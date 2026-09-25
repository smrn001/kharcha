import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';
import { ARROW_RIGHT_ICON } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { Button, Icon, Text } from '@expo/ui';
import { View } from 'react-native';
import type { ReactNode } from 'react';

/** Tonal rounded surface used for each analytics block. */
export function Card({ children }: { children: ReactNode }) {
  const colors = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surfaceContainer,
        borderRadius: 20,
        padding: 20,
      }}
    >
      {children}
    </View>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const colors = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <NativeBlock>
          <Text textStyle={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
            {title}
          </Text>
        </NativeBlock>
        {subtitle ? (
          <NativeBlock>
            <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>{subtitle}</Text>
          </NativeBlock>
        ) : null}
      </View>
      {action}
    </View>
  );
}

/** "See all ›" text action for a card header. */
export function SeeAllAction({ onPress }: { onPress: () => void }) {
  const { t } = useI18n();
  const colors = useTheme();
  return (
    <NativeBlock>
      <Button variant="text" onPress={onPress} style={{ paddingVertical: 0, paddingHorizontal: 0 }}>
        <Text textStyle={{ fontSize: 14, fontWeight: '500', color: colors.primary }}>
          {t('an.seeAll')}
        </Text>
        <Icon name={ARROW_RIGHT_ICON} size={14} color={colors.primary} />
      </Button>
    </NativeBlock>
  );
}
