export function userDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('invalidDate');
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || editableDate(date.toISOString()) !== value) throw Error('invalidDate');
  return date;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export function editableDate(value: string): string {
  if (DAY.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function dateBoundary(value: string, end: boolean): string {
  const date = userDate(parseUserDate(value)); date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0); return date.toISOString();
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
/** A day typed by the person: 11/03/2026 or 11/3/2026 (US order, the app's locales are all US), or
 *  2026-11-03. Returns YYYY-MM-DD; anything else, or a day that does not exist, throws invalidDate. */
export function parseUserDate(input: string): string {
  const v = input.trim();
  const us = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(v);
  const day = us ? `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}` : v;
  userDate(day); return day;
}
/** An optional time of day: 6pm, 6:30 pm, 18:00, 6:30. Returns HH:MM (24 h), null when empty. */
export function parseTime(input: string): string | null {
  const v = input.trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (!v) return null;
  const m = /^(\d{1,2})(?::(\d{2}))?(am|pm|a|p)?$/.exec(v);
  if (!m) throw Error('invalidTime');
  let h = Number(m[1]); const min = Number(m[2] ?? '0'), ap = m[3];
  if (!m[2] && !ap) throw Error('invalidTime');
  if (ap) { if (h < 1 || h > 12) throw Error('invalidTime'); h = h % 12 + (ap.startsWith('p') ? 12 : 0); }
  if (h > 23 || min > 59) throw Error('invalidTime');
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
/** A day with the time the person typed, as wall-clock time with no zone: YYYY-MM-DDTHH:MM. */
const WALL = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;
export const timeOf = (value: string): string | null => WALL.exec(value)?.[2] ?? null;
/**
 * What the Add screen saves as "happened". A typed date is never dropped: typing one while
 * "I'm not sure of the date" is ticked is refused (dateConflict), and leaving both empty asks for one.
 */
export function resolveHappened(o: { date: string; time: string; unknown: boolean }): string | null {
  const typed = o.date.trim() !== '' || o.time.trim() !== '';
  if (o.unknown && typed) throw Error('dateConflict');
  if (o.unknown) return null;
  if (!o.date.trim()) throw Error(o.time.trim() ? 'timeNoDate' : 'dateMissing');
  const day = parseUserDate(o.date), time = parseTime(o.time);
  return time ? `${day}T${time}` : day;
}
/** A stored "happened" value as kept: a day, or a day with its typed time. Old ISO instants become their day. */
export function happenedValue(value: string | null): string | null {
  if (value === null) return null;
  return WALL.test(value) ? value : calendarDay(value);
}
/** For the date box when changing an item: MM/DD/YYYY. */
export function inputDate(value: string): string {
  const [y, m, d] = calendarDay(value).split('-');
  return `${m}/${d}/${y}`;
}
/** For the time box when changing an item: 6:30 PM style, or empty. */
export function inputTime(value: string): string {
  const t = timeOf(value); if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
/** "Happened" in the phone's format: the day, plus the time only when the person typed one. */
export function showHappened(value: string, locale: string): string {
  const t = timeOf(value); if (!t) return showDay(value, locale);
  const [y, mo, d] = calendarDay(value).split('-').map(Number), [h, mi] = t.split(':').map(Number);
  const at = new Date(y, mo - 1, d, h, mi);
  return `${at.toLocaleDateString(locale)} ${at.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}`;
}
/** Sort key for "happened": the day, then the typed time (an untimed day sorts before timed ones that day). */
export const happenedKey = (value: string) => calendarDay(value) + (timeOf(value) ?? '');
/** The backup file's name, by the phone's own date: KeepMyProof-backup-2026-11-14.kmp. */
export function backupName(now: Date): string {
  return `KeepMyProof-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.kmp`;
}
/** A photo's own "taken" time from its EXIF (2026:11:03 18:05:09), as YYYY-MM-DDTHH:MM; null if absent or odd. */
export function exifTime(value: unknown): string | null {
  const m = typeof value === 'string' ? /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/.exec(value) : null;
  if (!m) return null;
  try { userDate(`${m[1]}-${m[2]}-${m[3]}`); } catch { return null; }
  return Number(m[4]) < 24 && Number(m[5]) < 60 ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : null;
}
