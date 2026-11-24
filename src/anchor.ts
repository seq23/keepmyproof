// Where the last button pressed sits on screen, so an iPad share popover points at the button that opened
// it rather than at an empty spot (iPad pass, 20 Nov 2026). Written by Button (src/ui.tsx) as it is
// pressed, read by the share calls (src/native/files.ts). iPhone and Android ignore the anchor.
export type Anchor = { x: number; y: number; width: number; height: number };
let last: Anchor | undefined;
export const setPressedAnchor = (rect: Anchor) => { last = rect; };
export const pressedAnchor = (): Anchor | undefined => last;
