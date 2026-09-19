import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Native file glue for offline backup: write export files and share them,
 * pick import files. Pure backup logic lives in `@/lib/db/backup`.
 */

export type BackupFileKind = 'json' | 'csv';

export function backupFileName(kind: BackupFileKind): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  return kind === 'json' ? `kharcha-backup-${stamp}.json` : `kharcha-transactions-${stamp}.csv`;
}

/**
 * Export text content: on native write to cache and open the share sheet
 * (Save to Files, Drive, Bluetooth, …); on web trigger a download since
 * there is no share sheet or app cache directory.
 */
export async function exportTextFile(options: {
  fileName: string;
  contents: string;
  mimeType: string;
}): Promise<void> {
  if (Platform.OS === 'web') {
    downloadTextOnWeb(options.fileName, options.contents, options.mimeType);
    return;
  }
  const directory = FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('File export is not available on this device.');
  }
  const uri = `${directory}${options.fileName}`;
  await FileSystem.writeAsStringAsync(uri, options.contents);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, {
    mimeType: options.mimeType,
    dialogTitle: options.fileName,
  });
}

function downloadTextOnWeb(fileName: string, contents: string, mimeType: string): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export interface PickedBackupFile {
  name: string;
  text: string;
}

/**
 * Let the user pick a .json or .csv file. Returns null when cancelled.
 */
export async function pickBackupFile(): Promise<PickedBackupFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/csv', 'text/comma-separated-values', 'text/plain'],
    // Letting the picker copy into its cache would land the file in Expo Go's
    // host cache, which the filesystem module refuses to read. Without a copy
    // Android returns the granted `content://` URI instead, which is readable.
    copyToCacheDirectory: false,
  });
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  const text = await readAssetText(asset);
  return { name: asset.name ?? 'import', text };
}

async function readAssetText(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
  if (Platform.OS === 'web' && asset.file) {
    return asset.file.text();
  }
  // The returned URI is a SAF `content://` URI on Android (read-granted) and a
  // readable `file://` in the app tmp dir on iOS. The new `File` API bridges
  // both; stage a copy in our own cache if a particular provider refuses a
  // direct read.
  const uri = asset.uri;
  try {
    return await new File(uri).text();
  } catch {
    // fall through to staging a copy
  }
  const staging = `${Paths.cache.uri}kharcha-import-${Date.now()}`;
  await new File(uri).copy(new File(staging));
  return new File(staging).text();
}

export function detectBackupKind(fileName: string, text: string): BackupFileKind {
  if (/\.csv$/i.test(fileName)) return 'csv';
  if (/\.json$/i.test(fileName)) return 'json';
  return text.trimStart().startsWith('{') ? 'json' : 'csv';
}
