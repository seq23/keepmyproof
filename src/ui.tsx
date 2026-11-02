import React, { createContext, useContext } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, useColorScheme, type TextProps } from 'react-native';
import type { Lang } from './core/model';
const palettes = {
  light: { bg:'#f7f3ec', fg:'#1f1b16', muted:'#6d6458', card:'#fffdf9', line:'#e6ddcf', gold:'#7d611f', goldbg:'#f6eedb', ok:'#2e6b3f', okbg:'#e7f2ea', red:'#b3261e', redbg:'#fbe9e7', tile:'#efe7da' },
  dark: { bg:'#16130f', fg:'#f2ece2', muted:'#b3a897', card:'#201c17', line:'#3a332a', gold:'#e2c27f', goldbg:'#33290f', ok:'#8fd19e', okbg:'#1d2e22', red:'#ff8a80', redbg:'#3a1c19', tile:'#2c2620' },
};
export const Theme = createContext(palettes.light);
// The app's language, for text that must render differently in Chinese and Korean.
export const LangContext = createContext<Lang>('en');
/** Chinese and Korean use the system font (PingFang / Apple SD Gothic Neo; Noto CJK on Android): Georgia
 *  and Android's serif have no CJK glyphs, so a serif heading would fall back glyph by glyph. */
export const cjk = (lang: Lang) => lang === 'zh' || lang === 'ko';
/** Korean wraps between words, not inside a word (iOS; Android already breaks Hangul at spaces). */
export function textProps(lang: Lang): Pick<TextProps, 'lineBreakStrategyIOS'> { return lang === 'ko' ? { lineBreakStrategyIOS: 'hangul-word' } : {}; }
export const headingFont = (lang: Lang) => cjk(lang) ? undefined : Platform.select({ ios:'Georgia', android:'serif' });
export function usePalette() { return palettes[useColorScheme() === 'dark' ? 'dark' : 'light']; }
// heading = the screen's own title (21); section = a heading inside the screen (18).
export function P({ children, muted = false, heading = false, section = false }: { children: React.ReactNode; muted?: boolean; heading?: boolean; section?: boolean }) {
  const c = useContext(Theme), lang = useContext(LangContext), head = heading || section;
  return <Text {...textProps(lang)} style={{ color: muted ? c.muted : c.fg, fontSize: heading ? 21 : section ? 18 : muted ? 13 : 15, lineHeight: heading ? 28 : section ? 24 : 22,
    fontWeight: head ? '600' : '400', fontFamily: head ? headingFont(lang) : undefined, marginTop: section ? 8 : 0 }}>{children}</Text>;
}
export function Button({ title, onPress, quiet, disabled, checked }: { title: string; onPress: () => void; quiet?: boolean; disabled?: boolean; checked?: boolean }) {
  const c = useContext(Theme), lang = useContext(LangContext);
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: checked }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({ minHeight:48, borderRadius:10, borderWidth:1, borderColor: quiet ? c.line : c.ok, backgroundColor: checked ? c.okbg : c.card,
      padding:12, justifyContent:'center', opacity: disabled ? .5 : pressed ? .7 : 1 })}>
    <Text {...textProps(lang)} style={{ color: quiet ? c.muted : c.ok, fontSize:15, fontWeight:quiet ? '400':'600', textAlign:'center' }}>{title}</Text>
  </Pressable>;
}
export function Card({ children, tone }: { children: React.ReactNode; tone?: 'gold' | 'red' | 'ok' }) {
  const c = useContext(Theme);
  return <View style={{ padding:12, gap:8, borderRadius:12, borderWidth:1, borderColor:c.line, backgroundColor: tone === 'gold' ? c.goldbg : tone === 'red' ? c.redbg : tone === 'ok' ? c.okbg : c.card }}>{children}</View>;
}
export function Field({ label, value, onChange, secret, multiline, numeric, placeholder }: {
  label: string; value: string; onChange: (value: string) => void; secret?: boolean; multiline?: boolean; numeric?: boolean; placeholder?: string;
}) {
  const c = useContext(Theme);
  return <View style={{ gap:4 }}><P muted>{label}</P><TextInput accessibilityLabel={label} testID={label} value={value} onChangeText={onChange}
    secureTextEntry={secret} multiline={multiline} keyboardType={numeric ? 'number-pad' : 'default'} autoCapitalize="none" autoCorrect={false}
    placeholder={placeholder} placeholderTextColor={c.muted} maxLength={numeric ? 6 : undefined}
    style={{ minHeight:48, padding:12, borderRadius:10, borderWidth:1, borderColor:c.line, color:c.fg, backgroundColor:c.card, fontSize:15,
      ...(multiline ? { minHeight:100, textAlignVertical:'top' as const } : {}) }} /></View>;
}
export const styles = StyleSheet.create({ container:{ flex:1 }, scroll:{ padding:16, gap:12, paddingBottom:32, width:'100%', maxWidth:560, alignSelf:'center' }, row:{ flexDirection:'row', gap:8 }, tabs:{ flexDirection:'row', gap:6, padding:10 }, flex:{ flex:1 },
  tiles:{ flexDirection:'row', flexWrap:'wrap', gap:8 }, tile:{ width:'31%', flexGrow:1, borderRadius:12, paddingVertical:10, paddingHorizontal:6, alignItems:'center', gap:4 },
  big:{ flexDirection:'row', alignItems:'center', gap:12, borderWidth:1.5, borderRadius:16, paddingVertical:12, paddingHorizontal:14, minHeight:76 },
  list:{ borderWidth:1, borderRadius:14, overflow:'hidden' },
  tickRow:{ flexDirection:'row', alignItems:'center', gap:12, minHeight:46, paddingVertical:8, paddingHorizontal:12 },
  box:{ width:24, height:24, borderWidth:2, borderRadius:7, alignItems:'center', justifyContent:'center' } });
