import { Column, Text } from '@expo/ui';
import { Link, Stack } from 'expo-router';
import { useI18n } from '@/hooks/use-i18n';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('nf.title') }} />
      <Column spacing={12} style={{ padding: 24 }}>
        <Text>{t('nf.msg')}</Text>
        <Link href="/">
          <Text>{t('nf.home')}</Text>
        </Link>
      </Column>
    </>
  );
}