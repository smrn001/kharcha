import { Column, Text } from '@expo/ui';
import { Link, Stack } from 'expo-router';
import { NativeBlock } from '@/components/native-block';
import { useI18n } from '@/hooks/use-i18n';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('nf.title') }} />
      <NativeBlock matchContents={false}>
        <Column spacing={12} style={{ padding: 24 }}>
          <Text>{t('nf.msg')}</Text>
          <NativeBlock>
            <Link href="/">
              <Text>{t('nf.home')}</Text>
            </Link>
          </NativeBlock>
        </Column>
      </NativeBlock>
    </>
  );
}