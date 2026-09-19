import { BottomSheet, Button, Icon, Text } from '@expo/ui';
import { NativeBlock } from '@/components/native-block';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/hooks/use-i18n';
import type { UpdateState } from '@/hooks/use-update-checker';
import { View } from 'react-native';

const CHECK_ICON = Icon.select({
  ios: 'checkmark',
  android: import('@expo/material-symbols/check.xml'),
});

const ARROW_RIGHT_ICON = Icon.select({
  ios: 'arrow.right',
  android: import('@expo/material-symbols/arrow_forward.xml'),
});

type UpdateDialogProps = {
  state: Extract<UpdateState, { status: 'available' }>;
  onDownload: (url: string) => void;
  onOpenLink: (url: string) => void;
  onLater: () => void;
  onSkip: () => void;
};

function parseReleaseNotes(notes: string): { bullets: string[]; changelogUrl: string | null } {
  const bullets: string[] = [];
  let changelogUrl: string | null = null;

  for (const raw of notes.split('\n')) {
    const line = raw.trim();
    const url = line.match(/https?:\/\/\S+/)?.[0];
    if (url && /compare|changelog|releases|pull/i.test(line)) {
      changelogUrl = url;
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '');
      if (text) {
        bullets.push(text);
      }
    }
  }

  return { bullets, changelogUrl };
}

export function UpdateDialog({ state, onDownload, onOpenLink, onLater, onSkip }: UpdateDialogProps) {
  const { t } = useI18n();
  const colors = useTheme();
  const { bullets, changelogUrl } = parseReleaseNotes(state.notes);

  return (
    <BottomSheet
      isPresented
      onDismiss={onLater}
      snapPoints={['half', 'full']}
      contentPadding={24}
    >
      <View style={{ gap: 20 }}>
        <View style={{ gap: 4 }}>
          <NativeBlock>
            <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>{t('upd.title')}</Text>
          </NativeBlock>
          <NativeBlock>
            <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
              {t('upd.desc', { version: state.latestVersion })}
            </Text>
          </NativeBlock>
        </View>

        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, gap: 4, borderRadius: 10, backgroundColor: colors.surface, padding: 14 }}>
              <NativeBlock>
                <Text textStyle={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
                  {t('upd.installed')}
                </Text>
              </NativeBlock>
              <NativeBlock>
                <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>{`v${state.currentVersion}`}</Text>
              </NativeBlock>
            </View>
            <View style={{ flex: 1, gap: 4, borderRadius: 10, padding: 14 }}>
              <NativeBlock>
                <Text textStyle={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary }}>
                  {t('upd.available')}
                </Text>
              </NativeBlock>
              <NativeBlock>
                <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>{`v${state.latestVersion}`}</Text>
              </NativeBlock>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <NativeBlock>
              <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('upd.whatsNew')}</Text>
            </NativeBlock>
            {bullets.length > 0 ? (
              <View style={{ gap: 10 }}>
                {bullets.map((bullet, index) => (
                  <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
                    <NativeBlock>
                      <Icon name={CHECK_ICON} size={16} />
                    </NativeBlock>
                    <NativeBlock>
                      <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                        {bullet}
                      </Text>
                    </NativeBlock>
                  </View>
                ))}
              </View>
            ) : (
              <NativeBlock>
                <Text textStyle={{ fontSize: 14, color: colors.textSecondary }}>
                  {t('upd.noNotes')}
                </Text>
              </NativeBlock>
            )}
            {changelogUrl ? (
              <View style={{ alignItems: 'flex-start' }}>
                <NativeBlock>
                  <Button variant="text" onPress={() => onOpenLink(changelogUrl)}>
                    <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('upd.changelog')}</Text>
                    <Icon name={ARROW_RIGHT_ICON} size={14} />
                  </Button>
                </NativeBlock>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ gap: 16 }}>
          <NativeBlock matchContents={false}>
            <Button
              label={t('upd.download')}
              onPress={() => onDownload(state.downloadUrl)}
              disabled={!state.downloadUrl}
            />
          </NativeBlock>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <NativeBlock>
              <Button variant="text" label={t('upd.later')} onPress={onLater} />
            </NativeBlock>
            <View style={{ width: 1, height: 12, backgroundColor: colors.border }} />
            <NativeBlock>
              <Button variant="text" label={t('upd.skip')} onPress={onSkip} />
            </NativeBlock>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}