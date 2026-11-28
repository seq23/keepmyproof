import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useColorScheme, type HostInstance, type TextProps } from 'react-native';
import type { Lang } from './core/model';
import { typingDate } from './core/dates';
import { setPressedAnchor } from './anchor';
// The approved brand (design-keepmyproof, 6 Nov 2026): archive ground, graphite text, lockbox green for what
// you act on, brass-soft for nudges, deadline red only for a real failure. Light and dark follow the phone.
const palettes = {
  light: { bg:'#F3F4F1', fg:'#1E2326', muted:'#5B6266', card:'#FFFFFF', line:'#D9DDD8', gold:'#7A5512', goldbg:'#F6EBD3', ok:'#0B6E4F', onOk:'#FFFFFF', okbg:'#E3F1EA', red:'#B42318', redbg:'#FBE9E7', tile:'#E3F1EA' },
  dark: { bg:'#121615', fg:'#EEF0EC', muted:'#A9B0AC', card:'#1B201F', line:'#2E3533', gold:'#F0CF8A', goldbg:'#33290F', ok:'#4FC197', onOk:'#0B1F17', okbg:'#16291F', red:'#FF8A80', redbg:'#3A1C19', tile:'#16291F' },
};
export const Theme = createContext(palettes.light);
// The app's language, for text that must render differently in Chinese and Korean.
export const LangContext = createContext<Lang>('en');
/** Chinese and Korean use the system font (PingFang / Apple SD Gothic Neo; Noto CJK on Android): Georgia
 *  and Android's serif have no CJK glyphs, so a serif heading would fall back glyph by glyph. */
export const cjk = (lang: Lang) => lang === 'zh' || lang === 'ko';
/** Korean wraps between words, not inside a word (iOS; Android already breaks Hangul at spaces). */
export function textProps(lang: Lang): Pick<TextProps, 'lineBreakStrategyIOS'> { return lang === 'ko' ? { lineBreakStrategyIOS: 'hangul-word' } : {}; }
// Noto Serif 700 for headings and Noto Sans for everything read or tapped (brand type, loaded in app/_layout.tsx).
// Chinese and Korean keep the system CJK font, which these Latin Noto files do not cover.
export const headingFont = (lang: Lang) => cjk(lang) ? undefined : 'NotoSerif_700Bold';
export const bodyFont = (lang: Lang, bold = false) => cjk(lang) ? undefined : bold ? 'NotoSans_600SemiBold' : 'NotoSans_400Regular';
export function usePalette() { return palettes[useColorScheme() === 'dark' ? 'dark' : 'light']; }
// heading = the screen's own title (21); section = a heading inside the screen (18).
// id: a stable test id (the device gate finds elements by it, never by their words); a screen title is "kmp-heading".
export function P({ children, muted = false, heading = false, section = false, id }: { children: React.ReactNode; muted?: boolean; heading?: boolean; section?: boolean; id?: string }) {
  const c = useContext(Theme), lang = useContext(LangContext), head = heading || section;
  return <Text {...textProps(lang)} testID={id ?? (heading ? 'kmp-heading' : undefined)} style={{ color: muted ? c.muted : c.fg, fontSize: heading ? 21 : section ? 18 : muted ? 13 : 15, lineHeight: heading ? 28 : section ? 24 : 22,
    fontWeight: head ? (cjk(lang) ? '600' : '700') : '400', fontFamily: head ? headingFont(lang) : bodyFont(lang), marginTop: section ? 8 : 0 }}>{children}</Text>;
}
// One filled lockbox button per screen (primary): the thing the screen is for. Every other button is an outline.
// danger: anything that destroys papers (Erase everything) is drawn in the warning red, never the go-ahead green.
// aria-selected, never accessibilityState: react-native-web 0.21 drops accessibilityState, so the chosen
// language and the current tab were silent to a screen reader on the web build (tap-through, 22 Nov 2026).
// `disabled` already sets aria-disabled on both builds.
export function Button({ title, onPress, quiet, disabled, checked, primary, danger, id }: { title: string; onPress: () => void; quiet?: boolean; disabled?: boolean; checked?: boolean; primary?: boolean; danger?: boolean; id?: string }) {
  const c = useContext(Theme), lang = useContext(LangContext), ref = useRef<HostInstance>(null);
  return <Pressable ref={ref} testID={id} accessibilityRole="button" aria-selected={checked} disabled={disabled} onPress={onPress}
    onPressIn={() => ref.current?.measureInWindow((x, y, width, height) => setPressedAnchor({ x, y, width, height }))}
    style={({ pressed }) => ({ minHeight:48, borderRadius:12, borderWidth:1.5, borderColor: danger ? c.red : quiet ? c.line : c.ok, backgroundColor: primary ? c.ok : checked ? c.okbg : c.card,
      padding:12, justifyContent:'center', opacity: disabled ? .5 : pressed ? .7 : 1 })}>
    <Text {...textProps(lang)} style={{ color: danger ? c.red : primary ? c.onOk : quiet ? c.muted : c.ok, fontSize:16, lineHeight:20, fontWeight:quiet ? '400':'600', fontFamily: bodyFont(lang, !quiet), textAlign:'center' }}>{title}</Text>
  </Pressable>;
}
export function Card({ children, tone }: { children: React.ReactNode; tone?: 'gold' | 'red' | 'ok' }) {
  const c = useContext(Theme);
  return <View style={{ padding:12, gap:8, borderRadius:12, borderWidth:1, borderColor:c.line, backgroundColor: tone === 'gold' ? c.goldbg : tone === 'red' ? c.redbg : tone === 'ok' ? c.okbg : c.card }}>{children}</View>;
}
/** numeric: a 6-digit passcode (digits: another length, e.g. the 10-digit Android review code). keyboard="date": the number pad, for a date typed as digits (the app adds the slashes).
 *  Every text box in the app is this one. The phone's box owns the text (uncontrolled, `defaultValue`): the app never
 *  writes text back into it while she types. A controlled `value` on a screen that re-renders on each key fights the
 *  native box on React Native's new architecture, and the phone then drops change events (ApprovalPrep lost letters,
 *  14 Nov 2026). The parent hears every change, and again on blur / end of editing with the box's own text, so a
 *  change the phone never reported is still saved. The mask (digits only for a passcode, slashes for a date) is applied
 *  to what the parent hears on every key, but written into the box only when she leaves it, so it never fights her
 *  keys or moves the cursor. Only a genuinely new value from the parent (a cleared box, a loaded item) replaces the
 *  box, by re-creating it; the parent echoing something she typed a few keys ago is never mistaken for one.
 *  Every Save / Next / Unlock / Confirm calls `flushFields()` first and reads the typed value after it (see below). */
export function Field({ label, value, onChange, secret, multiline, numeric, digits = 6, placeholder, keyboard, id }: {
  id?: string; label: string; value: string; onChange: (value: string) => void; secret?: boolean; multiline?: boolean; numeric?: boolean; digits?: number; placeholder?: string; keyboard?: 'date';
}) {
  const c = useContext(Theme), lang = useContext(LangContext);
  // What the box holds now, as last reported by the phone (after the mask).
  const typed = useRef(value);
  // Values handed up since the parent last caught up: an echo of one of these is not a new value.
  const handed = useRef(new Set<string>());
  // The text a re-created box starts with, and its key.
  const [box, setBox] = useState({ text: value, n: 0 });
  useEffect(() => {
    if (value === typed.current) { handed.current.clear(); return; }
    if (handed.current.has(value)) return;
    typed.current = value; handed.current.clear(); setBox(b => ({ text: value, n: b.n + 1 }));
  }, [value]);
  const masked = (raw: string) => numeric ? raw.replace(/\D/g, '').slice(0, digits) : keyboard === 'date' ? typingDate(raw) : raw;
  const hand = (next: string) => { if (next === typed.current) return; typed.current = next; handed.current.add(next); onChange(next); };
  const settle = (raw: unknown) => {
    focused.current = false;
    if (typeof raw === 'string') {
      const next = masked(raw); hand(next);
      if (next !== raw) setBox(b => ({ text: next, n: b.n + 1 }));
    }
    // End of editing comes before blur, so the box's whole text is handed up before anyone waiting on it reads.
    for (const done of waiting.current.splice(0)) done();
  };
  const input = useRef<{ blur?(): void; isFocused?(): boolean } | null>(null);
  const focused = useRef(false);
  const waiting = useRef<(() => void)[]>([]);
  useEffect(() => {
    const me: OpenField = {
      focused: () => focused.current || !!input.current?.isFocused?.(),
      finish: wait => new Promise<void>(done => {
        // No end of editing in time: go on with what was heard. The box was told to blur, so it is closed, and a
        // box that never answers does not make every later Save wait.
        const timer = setTimeout(() => { focused.current = false; waiting.current = waiting.current.filter(w => w !== finished); done(); }, wait);
        const finished = () => { clearTimeout(timer); done(); };
        waiting.current.push(finished);
        input.current?.blur?.();
      }),
    };
    openFields.add(me);
    return () => { openFields.delete(me); };
  }, []);
  return <View style={{ gap:4 }}><P muted>{label}</P><TextInput key={box.n} ref={input as never} onFocus={() => { focused.current = true; }} accessibilityLabel={label} testID={id ?? label} defaultValue={box.text}
    onChangeText={raw => hand(masked(raw))} onEndEditing={e => settle(e?.nativeEvent?.text)}
    onBlur={e => settle((e?.nativeEvent as { text?: unknown } | undefined)?.text)}
    secureTextEntry={secret} multiline={multiline} keyboardType={numeric || keyboard === 'date' ? 'number-pad' : 'default'} autoCapitalize="none" autoCorrect={false}
    placeholder={placeholder} placeholderTextColor={c.muted}
    style={{ minHeight:48, padding:12, borderRadius:6, borderWidth:1, borderColor:c.muted, color:c.fg, backgroundColor:c.card, fontSize:15, fontFamily: bodyFont(lang),
      ...(multiline ? { minHeight:100, textAlignVertical:'top' as const } : {}) }} /></View>;
}
/** A Field on screen that a Save / Next / Unlock can make finish editing. */
interface OpenField { focused(): boolean; finish(wait: number): Promise<void> }
const openFields = new Set<OpenField>();
/** How long a Save waits for the box's end-of-editing text before going on with what it has. */
export const FLUSH_WAIT_MS = 500;
/** Call before reading any typed value on Save, Next, Unlock or Confirm. On a busy phone the box can hold letters
 *  whose change events have not reached the app yet (ApprovalPrep sim retest 2, 14 Nov 2026: "…shows the payment cle"
 *  saved for "…cleared March 2"). This ends editing in the focused box and waits for its end-of-editing event, which
 *  carries the box's whole text, so the screen has heard every letter when it resolves (or after `wait` ms at most). */
export function flushFields(wait = FLUSH_WAIT_MS): Promise<void> {
  return Promise.all([...openFields].filter(f => f.focused()).map(f => f.finish(wait))).then(() => {});
}
/** useState plus `now()`, which reads the newest value at once (after flushFields(), before the screen redraws). */
export function useTyped<T>(initial: T): [T, (next: T | ((prev: T) => T)) => void, () => T] {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);
  const set = (next: T | ((prev: T) => T)) => { latest.current = typeof next === 'function' ? (next as (prev: T) => T)(latest.current) : next; setValue(latest.current); };
  return [value, set, () => latest.current];
}
export const styles = StyleSheet.create({ container:{ flex:1 }, scroll:{ padding:16, gap:12, paddingBottom:32, width:'100%', maxWidth:560, alignSelf:'center' }, row:{ flexDirection:'row', gap:8 }, tabs:{ flexDirection:'row', gap:6, padding:10, width:'100%', maxWidth:560, alignSelf:'center' },
  footer:{ paddingHorizontal:16, paddingTop:10, paddingBottom:12, gap:8, borderTopWidth:1, width:'100%', maxWidth:560, alignSelf:'center' }, flex:{ flex:1 },
  tiles:{ flexDirection:'row', flexWrap:'wrap', gap:8 }, tile:{ width:'31%', flexGrow:1, borderRadius:12, paddingVertical:10, paddingHorizontal:6, alignItems:'center', gap:4 },
  big:{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderRadius:16, paddingVertical:12, paddingHorizontal:14, minHeight:76 },
  list:{ borderWidth:1, borderRadius:14, overflow:'hidden' },
  tickRow:{ flexDirection:'row', alignItems:'center', gap:12, minHeight:46, paddingVertical:8, paddingHorizontal:12 },
  box:{ width:24, height:24, borderWidth:2, borderRadius:7, alignItems:'center', justifyContent:'center' } });
