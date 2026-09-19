import { Button, Icon, Text } from '@expo/ui';
import { useAppColors } from '@/lib/colors';
import { useI18n } from '@/hooks/use-i18n';
import { View } from 'react-native';

const PANELS_ICON = Icon.select({
  ios: 'square.grid.2x2',
  android: import('@expo/material-symbols/grid_view.xml'),
});

const ALERT_ICON = Icon.select({
  ios: 'exclamationmark.triangle',
  android: import('@expo/material-symbols/warning.xml'),
});

type DatabaseUnavailableScreenProps = {
  kind: 'other-tab' | 'error';
  onRetry?: () => void;
};

export function DatabaseUnavailableScreen({ kind, onRetry }: DatabaseUnavailableScreenProps) {
  const { t } = useI18n();
  const colors = useAppColors();
  const isOtherTab = kind === 'other-tab';
  const title = isOtherTab ? t('dberr.tabTitle') : t('dberr.errTitle');
  const message = isOtherTab ? t('dberr.tabMsg') : t('dberr.errMsg');

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center', gap: 16, maxWidth: 440 }}>
        <Icon name={isOtherTab ? PANELS_ICON : ALERT_ICON} size={40} />
        <Text textStyle={{ textAlign: 'center', fontSize: 22, fontWeight: '600' }}>{title}</Text>
        <Text textStyle={{ textAlign: 'center', fontSize: 15, color: colors.mutedForeground }}>
          {message}
        </Text>
        {onRetry ? <Button label={t('common.retry')} onPress={onRetry} /> : null}
      </View>
    </View>
  );
}