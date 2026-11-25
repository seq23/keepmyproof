// Google Play's reviewer only. This file and ./review.android.ts exist only in the Android build: Metro picks
// ReviewCode.tsx (renders nothing) for iOS and the web, so the App Store build carries none of this code, wording
// or URL (scripts/bundle-scan.mjs checks the exported iOS and Android bundles).
// The collapsed "Have a review code?" link shows on the Plus screen while the user is not on Plus and
// keepmyproof.com says a Google Play review window is open. Plus comes only from RevenueCat afterwards.
import React, { useContext, useEffect, useState } from 'react';
import { LANGS } from '../core/model';
import { Button, Card, Field, LangContext, P, useTyped } from '../ui';
import { redeemReviewCode, reviewStrings, reviewWindowOpen, type ReviewResult } from './review.android';
import type { ReviewCodeProps } from './ReviewCode';

type Key = keyof typeof reviewStrings;
const SAYS: Record<Exclude<ReviewResult, 'unlocked'>, Key> = { wrong: 'reviewWrong', usedUp: 'reviewUsedUp', slow: 'reviewSlow', tryAgain: 'reviewTryAgain' };

export function ReviewCode({ eligible, busy, run, setError, appUserId, refresh, onEntitlement }: ReviewCodeProps) {
  const lang = useContext(LangContext), t = (k: Key) => reviewStrings[k][LANGS.indexOf(lang)];
  const [open, setOpen] = useState(false), [shown, setShown] = useState(false);
  const [code, setCode, codeNow] = useTyped('');
  useEffect(() => {
    if (!eligible) { setOpen(false); setShown(false); setCode(''); return; }
    let live = true; void reviewWindowOpen().then(o => { if (live) setOpen(o); }); return () => { live = false; };
  }, [eligible]);
  if (!eligible || !open) return null;
  if (!shown) return <Button quiet title={t('reviewLink')} onPress={() => setShown(true)} disabled={busy} />;
  return <Card><P>{t('reviewCode')}</P><P muted>{t('reviewWhy')}</P>
    <Field label={t('reviewCode')} value={code} onChange={setCode} numeric digits={10} />
    <Button title={t('reviewUse')} disabled={busy} onPress={() => run(async () => {
      // Plus comes only from RevenueCat's own answer after the server's grant, never from the 200 itself.
      const result = await redeemReviewCode(codeNow(), await appUserId());
      if (result !== 'unlocked') { setError(t(SAYS[result])); return; }
      const next = await refresh(); onEntitlement(next); setCode('');
      if (!next.plus) setError(t('reviewTryAgain'));
    })} /></Card>;
}
