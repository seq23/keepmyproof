// iOS (and the web, where it does nothing): the app switcher shows a blurred cover instead of the papers.
// Screenshots and screen recording keep working on iOS: App Review records the app everyone gets (Apple 5.6,
// 23 Nov 2026). Android gets its own file, screen.android.ts.
import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

export function guardScreen(): Promise<void> {
  return Platform.OS === 'ios' ? ScreenCapture.enableAppSwitcherProtectionAsync(1) : Promise.resolve();
}
