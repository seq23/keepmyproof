export function userDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('invalidDate');
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime()) || editableDate(date.toISOString()) !== value) throw Error('invalidDate');
  return date;
}
export function editableDate(value: string): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function dateBoundary(value: string, end: boolean): string {
  const date = userDate(value); date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0); return date.toISOString();
}
