import { Column, Icon, Row, Text } from '@expo/ui';
import { FieldRow } from '@/components/field-row';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { REFRESH_ICON } from '@/lib/icons';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { UpdateCheckerContextValue } from '@/hooks/use-update-checker';

export function AboutSection({
  updateState,
  isChecking,
  checkNow,
}: {
  updateState: UpdateCheckerContextValue['state'];
  isChecking: boolean;
  checkNow: () => void;
}) {
  const colors = useTheme();
  const { t } = useI18n();
  return (
    <>
      <Row alignment="center" spacing={8}>
        <Column spacing={2}>
          <Text textStyle={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {t('set.aboutName')}
          </Text>
          <Text textStyle={{ fontSize: 13, color: colors.textSecondary }}>
            {t('set.aboutDesc')}
          </Text>
          <Text textStyle={{ fontSize: 12, color: colors.textSecondary }}>
            {t('set.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
          </Text>
        </Column>
      </Row>
      {Platform.OS === 'android' ? (
        <FieldRow
          label={t('set.checkUpdates')}
          supporting={
            isChecking
              ? t('set.checking')
              : updateState.status === 'available'
                ? t('set.available', { version: updateState.latestVersion })
                : updateState.status === 'error'
                  ? t('set.checkFailed')
                  : t('set.upToDate')
          }
          trailing={<Icon name={REFRESH_ICON} size={16} color={colors.textSecondary} />}
          onPress={checkNow}
          disabled={isChecking}
        />
      ) : null}
    </>
  );
}