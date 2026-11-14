export function userDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('invalidDate');
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || editableDate(date.toISOString()) !== value) throw Error('invalidDate');
  return date;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function editableDate(value: string): string {
  if (DAY.test(value)) return value;
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function dateBoundary(value: string, end: boolean): string {
  const date = userDate(value); date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0); return date.toISOString();
}
/** "Happened" is a calendar day, not an instant: stored as YYYY-MM-DD so it is the same day in every
 *  time zone. Records made before 14 Nov 2026 hold the picked day at local noon as an ISO instant;
 *  those read back as their day in the phone's zone. */
export function calendarDay(value: string): string { return editableDate(value); }
/** The day in the phone's date format, with no time (a date-only value has none). */
export function showDay(value: string, locale: string): string {
  const [y, m, d] = calendarDay(value).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale);
}
