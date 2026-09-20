import { Icon } from '@expo/ui';

/** Shared `@expo/ui`/Material icon constants, resolved once per platform. */

export const CHEVRON_ICON = Icon.select({
  ios: 'chevron.right',
  android: import('@expo/material-symbols/chevron_right.xml'),
});

export const CHECK_ICON = Icon.select({
  ios: 'checkmark',
  android: import('@expo/material-symbols/check.xml'),
});

export const X_ICON = Icon.select({
  ios: 'xmark',
  android: import('@expo/material-symbols/close.xml'),
});

export const SEARCH_ICON = Icon.select({
  ios: 'magnifyingglass',
  android: import('@expo/material-symbols/search.xml'),
});

export const PLUS_ICON = Icon.select({
  ios: 'plus',
  android: import('@expo/material-symbols/add.xml'),
});

export const ARROW_RIGHT_ICON = Icon.select({
  ios: 'arrow.right',
  android: import('@expo/material-symbols/arrow_forward.xml'),
});

export const RECEIPT_ICON = Icon.select({
  ios: 'receipt',
  android: import('@expo/material-symbols/receipt_long.xml'),
});

export const REFRESH_ICON = Icon.select({
  ios: 'arrow.clockwise',
  android: import('@expo/material-symbols/refresh.xml'),
});

export const CHEVRON_DOWN_ICON = Icon.select({
  ios: 'chevron.down',
  android: import('@expo/material-symbols/keyboard_arrow_down.xml'),
});

export const CHEVRON_UP_ICON = Icon.select({
  ios: 'chevron.up',
  android: import('@expo/material-symbols/keyboard_arrow_up.xml'),
});