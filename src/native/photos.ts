import { Platform } from 'react-native';
import type { SystemDelete } from '../core/original';
/**
 * iOS only: Photos always shows its own "Allow KeepMyProof to delete this photo?" dialog and the photo
 * goes to Recently Deleted. Android's photo picker hands back a copy that the app cannot delete without
 * broad photo permissions, so the offer is not shown there (expo-media-library is not linked on Android).
 */
export const systemConfirm = Platform.OS === 'ios';
export const deleteFromPhotos: SystemDelete = async assetIds => {
  if (!systemConfirm) throw Error('UNSUPPORTED');
  // Loaded lazily: the native module exists only in the iOS build.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const media = require('expo-media-library') as typeof import('expo-media-library');
  const permission = await media.requestPermissionsAsync(false);
  if (!permission.granted) throw Error('PHOTOS_PERMISSION');
  // One "Allow KeepMyProof to delete these photos?" dialog for all of them; declining rejects.
  await media.Asset.delete(assetIds.map(id => new media.Asset(id.startsWith('ph://') ? id : `ph://${id}`)));
};
