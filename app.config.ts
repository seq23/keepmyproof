import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'KeepMyProof', slug: 'keepmyproof', version: '1.0', scheme: 'keepmyproof', owner: 'seq23',
  orientation: 'portrait', userInterfaceStyle: 'automatic', icon: './assets/app/icon.png',
  ios: { bundleIdentifier: 'com.keepmyproof.app', supportsTablet: true,
    infoPlist: { ITSAppUsesNonExemptEncryption: false, UIFileSharingEnabled: false,
      LSSupportsOpeningDocumentsInPlace: true, CFBundleLocalizations: ['en', 'es'] } },
  android: { package: 'com.keepmyproof.app', allowBackup: false,
    // The brass seal on the lockbox green; the same foreground doubles as the Android 13+ themed icon.
    adaptiveIcon: { foregroundImage: './assets/app/adaptive-icon.png', monochromeImage: './assets/app/adaptive-icon.png', backgroundColor: '#0B6E4F' },
    // The first Android build (19 Nov 2026) still carried library permissions: photo/storage access (Play's photo
    // permission form) and draw-over-apps. The system photo picker and share sheet need none of them.
    blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.ACCESS_FINE_LOCATION', 'android.permission.READ_CONTACTS',
      'android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO', 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.READ_MEDIA_AUDIO', 'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE', 'android.permission.SYSTEM_ALERT_WINDOW'] },
  updates: { enabled: false },
  extra: { eas: { projectId: 'f58e7186-4f0e-4d7e-b7e1-d530ab54029e' } },
  plugins: ['expo-router', 'expo-localization', 'expo-sqlite',
    ['expo-secure-store', { configureAndroidBackup: true, faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-local-authentication', { faceIDPermission: 'Open your papers with Face ID. / Abra sus documentos con Face ID.' }],
    ['expo-image-picker', { photosPermission: 'Choose a photo to keep in KeepMyProof on this device, and remove the original from Photos only if you ask. / Elija una foto para guardar en KeepMyProof en este dispositivo; el original solo se quita de Fotos si usted lo pide.', cameraPermission: 'Take a photo straight into KeepMyProof on this device. It is not saved to Photos or uploaded. / Tome una foto directamente en KeepMyProof en este dispositivo. No se guarda en Fotos ni se sube.', microphonePermission: false }]],
};
export default config;
