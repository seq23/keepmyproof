// iOS and the web: there is no review code. Google Play's reviewer path lives only in ReviewCode.android.tsx and
// review.android.ts, which Metro bundles for Android alone, so the App Store build has no code, wording or URL for it
// and behaves the same for App Review as for everyone else.
import type { Entitlement } from './provider';

export interface ReviewCodeProps {
  /** Store billing is live and the user is not on Plus. */
  eligible: boolean;
  busy: boolean;
  run: (job: () => Promise<void>) => void;
  setError: (message: string) => void;
  appUserId: () => Promise<string | null>;
  refresh: () => Promise<Entitlement>;
  onEntitlement: (next: Entitlement) => void;
}

export function ReviewCode(_: ReviewCodeProps): null { return null; }
