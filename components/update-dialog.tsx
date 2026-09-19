import { BottomSheet, Button, Icon, ScrollView, Text } from '@expo/ui';
import { useAppColors } from '@/lib/colors';
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
  const colors = useAppColors();
  const { bullets, changelogUrl } = parseReleaseNotes(state.notes);

  return (
    <BottomSheet isPresented detents={['half', 'full']} contentPadding={24}>
      <View style={{ gap: 20 }}>
        <View style={{ gap: 4 }}>
          <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>{t('upd.title')}</Text>
          <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
            {t('upd.desc', { version: state.latestVersion })}
          </Text>
        </View>

        <ScrollView style={{ maxHeight: 320 }}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 4, borderRadius: 10, backgroundColor: colors.mutedBackground, padding: 14 }}>
                <Text textStyle={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground }}>
                  {t('upd.installed')}
                </Text>
                <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>v{state.currentVersion}</Text>
              </View>
              <View style={{ flex: 1, gap: 4, borderRadius: 10, padding: 14 }}>
                <Text textStyle={{ fontSize: 12, fontWeight: '500', color: colors.mutedForeground }}>
                  {t('upd.available')}
                </Text>
                <Text textStyle={{ fontSize: 18, fontWeight: '600' }}>v{state.latestVersion}</Text>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('upd.whatsNew')}</Text>
              {bullets.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {bullets.map((bullet, index) => (
                    <View key={index} style={{ flexDirection: 'row', gap: 10 }}>
                      <Icon name={CHECK_ICON} size={16} />
                      <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
                        {bullet}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text textStyle={{ fontSize: 14, color: colors.mutedForeground }}>
                  {t('upd.noNotes')}
                </Text>
              )}
              {changelogUrl ? (
                <Button
                  variant="text"
                  onPress={() => onOpenLink(changelogUrl)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Text textStyle={{ fontSize: 14, fontWeight: '500' }}>{t('upd.changelog')}</Text>
                  <Icon name={ARROW_RIGHT_ICON} size={14} />
                </Button>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View style={{ gap: 16 }}>
          <Button
            label={t('upd.download')}
            onPress={() => onDownload(state.downloadUrl)}
            disabled={!state.downloadUrl}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Button variant="text" label={t('upd.later')} onPress={onLater} />
            <View style={{ width: 1, height: 12, backgroundColor: colors.separator }} />
            <Button variant="text" label={t('upd.skip')} onPress={onSkip} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}