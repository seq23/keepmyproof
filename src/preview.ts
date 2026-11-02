// The simulator preview build (.github/workflows/preview.yml, docs/preview.md) sets
// EXPO_PUBLIC_KMP_PREVIEW=1 so its screenshots are not blanked by screenshot protection.
// A store build with it set is refused by the release gate (NAMED STOP PREVIEW_BUILD).
export const PREVIEW_BUILD = process.env.EXPO_PUBLIC_KMP_PREVIEW === '1';
