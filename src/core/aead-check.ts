// A fixed AES-256-GCM known answer in the v1 box layout (ciphertext || 16-byte tag, purpose as AAD).
// The phone's native AES-GCM must reproduce it before first use (src/core/aead.native.ts), and
// tests/aead.test.ts proves the JS implementation does too, so a box made by either opens with the other.
export const AEAD_CHECK = {
  key: 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=',
  nonce: 'oKGio6Slpqeoqaqr',
  aad: 'a21wLWFlYWQtY2hlY2s=',
  data: 'S2VlcE15UHJvb2YgdjEgYm94',
  box: '8rRYFrDMCnYQYcRLh7QA5jivNoWdeav1QlCP999sAtM3lA==',
} as const;
