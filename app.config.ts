import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'KeepMyProof', slug: 'keepmyproof', version: '0.1.0', scheme: 'keepmyproof',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.keepmyproof.app', supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: true, UIFileSharingEnabled: false,
      LSSupportsOpeningDocumentsInPlace: true, CFBundleLocalizations: ['en', 'es'] } },
  android: { package: 'com.keepmyproof.app', allowBackup: false,
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_CONTACTS'] },
  updates: { enabled: false },
  plugins: ['expo-router', 'expo-localization', 'expo-sqlite',
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-local-authentication', { faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-image-picker', { photosPermission: 'Choose a photo to keep on this phone. / Elija una foto para guardar en este teléfono.', cameraPermission: false, microphonePermission: false }]],
};
export default config;
