import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'KeepMyProof', slug: 'keepmyproof', version: '1.0', scheme: 'keepmyproof', owner: 'seq23',
  orientation: 'portrait', userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'com.keepmyproof.app', supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false, UIFileSharingEnabled: false,
      LSSupportsOpeningDocumentsInPlace: true, CFBundleLocalizations: ['en', 'es'] } },
  android: { package: 'com.keepmyproof.app', allowBackup: false,
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_CONTACTS'] },
  updates: { enabled: false },
  extra: { eas: { projectId: 'f58e7186-4f0e-4d7e-b7e1-d530ab54029e' } },
  plugins: ['expo-router', 'expo-localization', 'expo-sqlite',
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-local-authentication', { faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-image-picker', { photosPermission: 'Choose a photo to keep on this phone, and remove the original from Photos only if you ask. / Elija una foto para guardar en este teléfono; el original solo se quita de Fotos si usted lo pide.', cameraPermission: false, microphonePermission: false }]],
};
export default config;
