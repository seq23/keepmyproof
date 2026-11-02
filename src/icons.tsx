import React, { useContext } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Theme } from './ui';
// Simple line drawings made from plain Views (no image files, no icon font, nothing licensed).
// Every glyph sits in a square box of `size` points and is drawn in the theme's ink colour.
export type GlyphName = 'page'|'phone'|'receipt'|'camera'|'calendar'|'medical'|
  'rings'|'briefcase'|'medal'|'house'|'school'|'folder'|'plus';
export const folderGlyph: Record<string, GlyphName> = {
  'divorce-prep':'rings', 'workplace-evidence':'briefcase', 'va-disability-papers':'medal', 'executor-papers':'house', 'iep-binder':'school',
};
export function Glyph({ name, size = 40, bg }: { name: GlyphName; size?: number; bg?: string }) {
  const c = useContext(Theme), ink = c.fg, k = size / 40;
  const box = (s: ViewStyle) => <View style={{ position:'absolute', borderColor:ink, ...s }} />;
  const bar = (left: number, top: number, width: number, height = 2) => box({ left:left*k, top:top*k, width:width*k, height:height*k, backgroundColor:ink });
  const frame = (left: number, top: number, width: number, height: number, radius = 2, extra: ViewStyle = {}) =>
    box({ left:left*k, top:top*k, width:width*k, height:height*k, borderWidth:2, borderRadius:radius*k, ...extra });
  const lines = (left: number, tops: number[], widths: number[]) => tops.map((t, i) => <React.Fragment key={i}>{bar(left, t, widths[i])}</React.Fragment>);
  const parts: Record<GlyphName, React.ReactNode> = {
    page: <>{frame(8,5,24,30)}{lines(13,[12,18,24],[14,14,9])}</>,
    phone: <>{frame(11,4,18,32,4)}{lines(15,[11,17,23],[7,9,6])}</>,
    receipt: <>{frame(10,5,20,30,1,{ borderStyle:'dashed' })}{lines(15,[12,18,24],[10,10,6])}</>,
    camera: <>{frame(6,11,28,21,3)}{frame(14,15,12,12,6)}{frame(15,7,10,6,1)}</>,
    calendar: <>{frame(8,8,24,27)}{bar(8,15,24)}{bar(13,4,2,7)}{bar(25,4,2,7)}{lines(13,[21,27],[6,10])}</>,
    medical: <>{frame(8,5,24,30)}{bar(19,11,2,12)}{bar(14,16,12)}{bar(13,28,14)}</>,
    rings: <>{frame(5,12,17,17,9)}{frame(18,12,17,17,9)}</>,
    briefcase: <>{frame(6,14,28,19,3)}{frame(15,9,10,7,2)}{bar(6,22,28)}</>,
    medal: <>{bar(15,4,3,12)}{bar(22,4,3,12)}{frame(11,15,18,18,9)}{frame(16,20,8,8,4)}</>,
    house: <>{frame(11,7,18,18,1,{ transform:[{ rotate:'45deg' }] })}{frame(8,18,24,18,1,{ backgroundColor:bg ?? c.card })}{frame(16,26,8,10,1)}</>,
    school: <>{frame(9,4,22,22,1,{ transform:[{ scaleY:.5 },{ rotate:'45deg' }] })}{frame(12,17,16,10,2,{ borderTopWidth:0 })}{bar(31,14,2,10)}</>,
    folder: <>{frame(5,9,14,7,2)}{frame(5,13,30,21,3,{ backgroundColor:bg ?? c.card })}</>,
    plus: <>{bar(19,8,2,24)}{bar(8,19,24)}</>,
  };
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width:size, height:size }}>{parts[name]}</View>;
}
