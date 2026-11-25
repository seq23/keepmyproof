// The app's folders, for site copy that counts or names them. Two sources, the same two the app's Home list
// (src/core/model.ts appFolders) is built from: ../../topics.json (the launch folders, each with a suggested
// checklist) and ../../src/core/private-folder.json (Private, no checklist). Copy never types a number or list.
//   FOLDER_COUNT: folders WITH a suggested checklist ("seven folders, each with a suggested checklist").
//   APP_FOLDER_COUNT: every folder on Home ("All eight folders", "one of the eight folders").
import { readFileSync } from 'node:fs';

const topics = JSON.parse(readFileSync(new URL('../../topics.json', import.meta.url), 'utf8'));
export const PRIVATE = JSON.parse(readFileSync(new URL('../../src/core/private-folder.json', import.meta.url), 'utf8'));
export const LAUNCH = topics.topics.filter((t) => t.release === 'launch').sort((a, b) => a.folder_order - b.folder_order);
export const FOLDER_COUNT = topics.launch_folder_count;
if (LAUNCH.length !== FOLDER_COUNT) throw Error(`NAMED STOP [TOPICS_MISMATCH] ${LAUNCH.length} launch folders, topics.json says ${FOLDER_COUNT}`);
export const APP_FOLDER_COUNT = LAUNCH.length + 1;
/** The Private folder's name in that language, as Home shows it. */
export const privateName = (lang) => PRIVATE.display_name[lang] ?? PRIVATE.display_name.en;

const WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
  es: ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'],
  zh: ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
  ko: ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열한', '열두'],
};
/** The folder count as a word in that language ("seven", "siete", "七", "일곱"); capitalised on request. */
export function folderCount(lang, capital = false, n = FOLDER_COUNT) {
  const w = WORDS[lang]?.[n] ?? String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}
/** Every folder on Home (the checklist folders and Private), as a word in that language ("eight", "ocho"). */
export const appFolderCount = (lang, capital = false) => folderCount(lang, capital, APP_FOLDER_COUNT);
const JOIN = { en: [', ', ' and '], es: [', ', ' y '], zh: ['、', '和'], ko: [', ', ', '] };
/** Every launch folder's name in that language, in Home order, as one list ("A, B and C"). */
/** The launch folders' names, in folder order. */
export const folderList = (lang) => LAUNCH.map((t) => t.name[lang] ?? t.name.en);
export function folderNames(lang) {
  const names = LAUNCH.map((t) => t.name[lang] ?? t.name.en), [sep, last] = JOIN[lang] ?? JOIN.en;
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(sep)}${last}${names.at(-1)}`;
}
