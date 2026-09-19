import { Button, Icon } from '@expo/ui';
import { FloatingActionButton, Host, Icon as ComposeIcon } from '@expo/ui/jetpack-compose';
import { useI18n } from '@/hooks/use-i18n';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

const PLUS_ICON = Icon.select({
  ios: 'plus',
  android: import('@expo/material-symbols/add.xml'),
});

/**
 * Floating "add transaction" button. Android renders the native Material 3
 * `FloatingActionButton`; iOS renders a circular accent-filled `Button`.
 */
export function FloatingAddButton() {
  const { t } = useI18n();
  const onPress = () => router.push('/transaction/new');

  if (Platform.OS === 'android') {
    return (
      <View style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 10 }}>
        <Host matchContents={{ vertical: true }}>
          <FloatingActionButton onClick={onPress}>
            <FloatingActionButton.Icon>
              <ComposeIcon source={require('@expo/material-symbols/add.xml')} />
            </FloatingActionButton.Icon>
          </FloatingActionButton>
        </Host>
      </View>
    );
  }

  return (
    <View style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 10 }}>
      <Button variant="filled" onPress={onPress} style={{ width: 56, height: 56, borderRadius: 28, padding: 0 }}>
        <Icon name={PLUS_ICON} size={22} />
      </Button>
    </View>
  );
}