// Android: the window is marked secure (FLAG_SECURE), as in every Play build up to versionCode 4. Recents
// shows a blank card instead of an open vault, and screenshots and screen recording of the app are blocked.
// Apple 5.6 (why iOS has no block) is an App Store rule; Play reviews with the review code instead.
import * as ScreenCapture from 'expo-screen-capture';

export function guardScreen(): Promise<void> {
  return ScreenCapture.preventScreenCaptureAsync();
}
