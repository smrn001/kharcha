import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PanelsTopLeft, TriangleAlert } from 'lucide-react-native';
import { View } from 'react-native';

type DatabaseUnavailableScreenProps = {
  kind: 'other-tab' | 'error';
  onRetry?: () => void;
};

export function DatabaseUnavailableScreen({ kind, onRetry }: DatabaseUnavailableScreenProps) {
  const { t } = useI18n();
  const isOtherTab = kind === 'other-tab';
  const title = isOtherTab ? t('dberr.tabTitle') : t('dberr.errTitle');
  const message = isOtherTab ? t('dberr.tabMsg') : t('dberr.errMsg');

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <View className="max-w-md items-center gap-4">
        <View className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          {isOtherTab ? (
            <PanelsTopLeft className="text-muted-foreground" size={28} strokeWidth={1.75} />
          ) : (
            <TriangleAlert className="text-muted-foreground" size={28} strokeWidth={1.75} />
          )}
        </View>
        <Text className="text-center text-2xl font-semibold text-foreground">{title}</Text>
        <Text className="text-center text-muted-foreground">{message}</Text>
        {onRetry && (
          <Button onPress={onRetry} className="mt-2">
            <Text>{t('common.retry')}</Text>
          </Button>
        )}
      </View>
    </View>
  );
}