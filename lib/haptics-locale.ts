/**
 * App-wide haptics kill-switch, mirroring `lib/format-locale.ts`: screens do
 * not thread the setting through props; `SettingsProvider` syncs it from
 * Settings on load and on every change.
 */

let enabled = true;

export function setDefaultHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function getDefaultHapticsEnabled(): boolean {
  return enabled;
}
