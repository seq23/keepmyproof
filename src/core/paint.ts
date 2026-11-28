/** Resolves once the screen has had a frame to draw what was just set (the busy line, a disabled button).
 *  Why: run() sets "Working…" and then starts the job. A job that begins with heavy synchronous work (opening a large
 *  backup: decrypt and JSON.parse on the JS thread) ran in the same turn as the state change, so the busy line was
 *  never drawn and the screen froze on the pressed button until the work ended (device gate runs 46158994320 and
 *  46163383574, group E: a 60 MB restore, no "Working…" for 40 s, the Restore button stuck half-pressed).
 *  A microtask is not enough: React Native draws between frames, so this waits for the next frame, then one more
 *  task. Without requestAnimationFrame (tests, the web build's server render) it waits one task. */
export function afterPaint(): Promise<void> {
  return new Promise(done => {
    const frame = (globalThis as { requestAnimationFrame?: (cb: () => void) => unknown }).requestAnimationFrame;
    const later = () => { setTimeout(done, 0); };
    if (typeof frame === 'function') frame(later); else later();
  });
}
