import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { useI18n } from '@/hooks/use-i18n';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('nf.title') }} />
      <View>
        <Text>{t('nf.msg')}</Text>

        <Link href="/">
          <Text>{t('nf.home')}</Text>
        </Link>
      </View>
    </>
  );
}
