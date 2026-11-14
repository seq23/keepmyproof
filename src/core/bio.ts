// Which word the phone uses for its own biometric unlock (user review 14 Nov 2026, finding 15): an
// iPhone says Face ID or Touch ID, Android says fingerprint (or face unlock on a face-only phone).
// types: expo-local-authentication's supportedAuthenticationTypesAsync (1 fingerprint, 2 face, 3 iris).
export type BioKind = 'faceId' | 'touchId' | 'fingerprint' | 'face';
export function bioKind(os: string, types: number[]): BioKind {
  if (os === 'android') return !types.includes(1) && types.includes(2) ? 'face' : 'fingerprint';
  // iPhone (and the web preview, which stands in for the iPhone build).
  return types.includes(1) && !types.includes(2) ? 'touchId' : 'faceId';
}
/** The strings key naming each kind. */
export const BIO_NAME = { faceId: 'bioFaceId', touchId: 'bioTouchId', fingerprint: 'bioFingerprint', face: 'bioFace' } as const;
