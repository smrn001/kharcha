import * as Haptics from 'expo-haptics';
import { getDefaultHapticsEnabled, setDefaultHapticsEnabled } from './haptics-locale';

/**
 * Haptic helpers (expo-animation §8). One per user action, always paired
 * with a visual, never the only feedback. All calls are best-effort:
 * unsupported platforms and users with haptics off system-wide resolve
 * silently. The in-app `haptics` setting gates everything here.
 */

export { getDefaultHapticsEnabled, setDefaultHapticsEnabled };

async function run(fn: () => Promise<void>): Promise<void> {
  if (!getDefaultHapticsEnabled()) return;
  try {
    await fn();
  } catch {
    // Haptics are decorative; never break the action.
  }
}

/** A value ticked past a step: segmented control, chip, picker. */
export function hapticSelection(): Promise<void> {
  return run(() => Haptics.selectionAsync());
}

/** A destructive action fired: delete, reset. */
export function hapticMediumImpact(): Promise<void> {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** An operation succeeded: transaction saved, import finished. */
export function hapticSuccess(): Promise<void> {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** An operation failed: save or import error. */
export function hapticError(): Promise<void> {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
