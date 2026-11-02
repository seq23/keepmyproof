import type { Draft } from './core/vault';
// The simulator preview build (.github/workflows/preview.yml, docs/preview.md) sets
// EXPO_PUBLIC_KMP_PREVIEW=1 so its screenshots are not blanked by screenshot protection.
// A store build with it set is refused by the release gate (NAMED STOP PREVIEW_BUILD).
export const PREVIEW_BUILD = process.env.EXPO_PUBLIC_KMP_PREVIEW === '1';

// Invented sample papers for the preview build's "skip to a sample vault" (AGENTS.md: sample data is
// invented). Notes only, so no file bytes are needed.
export function sampleVault(): Draft[] {
  const note = (folder: string, checklist: string | null, title: string, text: string, happenedOn: string): Draft =>
    ({ folder, checklist, kind: 'note', title, note: text, happenedOn, filename: null, mime: null, bytes: null, tags: [] });
  return [
    note('divorce-prep', 'financial-statements', 'Joint checking statements, Jan to Jun', 'Six months, saved from the bank site.', '2026-07-01'),
    note('divorce-prep', null, 'Notes from the first lawyer call', 'Ask about the house appraisal and the school calendar.', '2026-10-14'),
    note('divorce-prep', 'household-expenses', 'Monthly household costs', 'Rent, childcare, groceries, car.', '2026-10-20'),
    note('workplace-evidence', 'messages-received', 'Schedule change message', 'Weekdays with me, alternate weekends.', '2026-09-30'),
    note('va-disability-papers', 'service-papers', 'DD-214 location', 'Original is in the fire safe; copy requested.', '2026-08-12'),
  ];
}
