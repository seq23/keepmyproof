import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useColorScheme, type TextProps } from 'react-native';
import type { Lang } from './core/model';
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
export function P({ children, muted = false, heading = false, section = false }: { children: React.ReactNode; muted?: boolean; heading?: boolean; section?: boolean }) {
  const c = useContext(Theme), lang = useContext(LangContext), head = heading || section;
  return <Text {...textProps(lang)} style={{ color: muted ? c.muted : c.fg, fontSize: heading ? 21 : section ? 18 : muted ? 13 : 15, lineHeight: heading ? 28 : section ? 24 : 22,
    fontWeight: head ? (cjk(lang) ? '600' : '700') : '400', fontFamily: head ? headingFont(lang) : bodyFont(lang), marginTop: section ? 8 : 0 }}>{children}</Text>;
}
// One filled lockbox button per screen (primary): the thing the screen is for. Every other button is an outline.
export function Button({ title, onPress, quiet, disabled, checked, primary }: { title: string; onPress: () => void; quiet?: boolean; disabled?: boolean; checked?: boolean; primary?: boolean }) {
  const c = useContext(Theme), lang = useContext(LangContext);
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: checked }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight:48, borderRadius:12, borderWidth:1.5, borderColor: quiet ? c.line : c.ok, backgroundColor: primary ? c.ok : checked ? c.okbg : c.card,
      padding:12, justifyContent:'center', opacity: disabled ? .5 : pressed ? .7 : 1 })}>
    <Text {...textProps(lang)} style={{ color: primary ? c.onOk : quiet ? c.muted : c.ok, fontSize:16, lineHeight:20, fontWeight:quiet ? '400':'600', fontFamily: bodyFont(lang, !quiet), textAlign:'center' }}>{title}</Text>
  </Pressable>;
}
export function Card({ children, tone }: { children: React.ReactNode; tone?: 'gold' | 'red' | 'ok' }) {
  const c = useContext(Theme);
  return <View style={{ padding:12, gap:8, borderRadius:12, borderWidth:1, borderColor:c.line, backgroundColor: tone === 'gold' ? c.goldbg : tone === 'red' ? c.redbg : tone === 'ok' ? c.okbg : c.card }}>{children}</View>;
}
export function Field({ label, value, onChange, secret, multiline, numeric, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; secret?: boolean; multiline?: boolean; numeric?: boolean; placeholder?: string;
}) {
  const c = useContext(Theme), lang = useContext(LangContext);
  return <View style={{ gap:4 }}><P muted>{label}</P><TextInput accessibilityLabel={label} testID={label} value={value} onChangeText={onChange}
    secureTextEntry={secret} multiline={multiline} keyboardType={numeric ? 'number-pad' : 'default'} autoCapitalize="none" autoCorrect={false}
    placeholder={placeholder} placeholderTextColor={c.muted} maxLength={numeric ? 6 : undefined}
    style={{ minHeight:48, padding:12, borderRadius:6, borderWidth:1, borderColor:c.muted, color:c.fg, backgroundColor:c.card, fontSize:15, fontFamily: bodyFont(lang),
      ...(multiline ? { minHeight:100, textAlignVertical:'top' as const } : {}) }} /></View>;
}
export const styles = StyleSheet.create({ container:{ flex:1 }, scroll:{ padding:16, gap:12, paddingBottom:32, width:'100%', maxWidth:560, alignSelf:'center' }, row:{ flexDirection:'row', gap:8 }, tabs:{ flexDirection:'row', gap:6, padding:10 }, flex:{ flex:1 },
  tiles:{ flexDirection:'row', flexWrap:'wrap', gap:8 }, tile:{ width:'31%', flexGrow:1, borderRadius:12, paddingVertical:10, paddingHorizontal:6, alignItems:'center', gap:4 },
  big:{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderRadius:16, paddingVertical:12, paddingHorizontal:14, minHeight:76 },
  list:{ borderWidth:1, borderRadius:14, overflow:'hidden' },
  tickRow:{ flexDirection:'row', alignItems:'center', gap:12, minHeight:46, paddingVertical:8, paddingHorizontal:12 },
  box:{ width:24, height:24, borderWidth:2, borderRadius:7, alignItems:'center', justifyContent:'center' } });
