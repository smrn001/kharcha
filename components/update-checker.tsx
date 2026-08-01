import { UpdateDialog, openDownloadUrl } from '@/components/update-dialog';
import { useUpdateChecker } from '@/hooks/use-update-checker';
import { Platform } from 'react-native';

export function UpdateChecker() {
  const { state, dismiss, skipVersion } = useUpdateChecker();

  if (Platform.OS !== 'android' || state.status !== 'available') {
    return null;
  }

  return (
    <UpdateDialog
      state={state}
      onDownload={(url) => openDownloadUrl(url)}
      onLater={dismiss}
      onSkip={skipVersion}
    />
  );
}
