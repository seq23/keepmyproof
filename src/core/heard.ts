// "How did you hear about us?" — asked once at the end of first setup, always optional.
// The answer is kept on this phone. Nothing is sent by the app: "Send my answer" opens the phone's own
// mail app with a ready email to the support address the site lists (site/config.mjs supportEmail);
// the person sends it, or not. No network call of the app's own (AGENTS.md; validator local-only).
export const HEARD = ['google', 'ai', 'store', 'advocate', 'friend', 'social', 'other'] as const;
export type Heard = typeof HEARD[number];
/** What the phone keeps: a choice, or 'skip'. null = never asked yet. */
export type HeardAnswer = Heard | 'skip';
export const SUPPORT_EMAIL = 'support@keepmyproof.com';
export const HEARD_SUBJECT = 'How I found KeepMyProof';
/** The email body: the choice only, in English so support can read every answer. */
export const HEARD_WORDS: Record<Heard, string> = {
  google: 'Google search', ai: 'ChatGPT or another AI tool', store: 'App Store or Google Play search',
  advocate: 'A lawyer, advocate or counsellor', friend: 'A friend or family member', social: 'Social media', other: 'Other',
};
export const isHeardAnswer = (v: unknown): v is HeardAnswer => v === 'skip' || (HEARD as readonly unknown[]).includes(v);
export interface HeardStore { read(): Promise<string | null>; write(value: HeardAnswer): Promise<void> }
export async function readHeard(store: HeardStore): Promise<HeardAnswer | null> {
  const v = await store.read(); return isHeardAnswer(v) ? v : null;
}
/** Choosing or skipping only saves on the phone. */
export async function saveHeard(store: HeardStore, answer: HeardAnswer) {
  if (!isHeardAnswer(answer)) throw Error('HEARD_INVALID');
  await store.write(answer);
}
export function heardMail(choice: Heard): string {
  if (!(HEARD as readonly string[]).includes(choice)) throw Error('HEARD_INVALID');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(HEARD_SUBJECT)}&body=${encodeURIComponent(HEARD_WORDS[choice])}`;
}
/** "Send my answer": hands a ready email to the phone's mail app. Returns false when no mail app is set up. */
export async function sendHeard(choice: Heard, mail: { canOpen(url: string): Promise<boolean>; open(url: string): Promise<unknown> }) {
  const url = heardMail(choice);
  if (!(await mail.canOpen(url))) return false;
  await mail.open(url); return true;
}
