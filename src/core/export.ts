import { zipSync } from 'fflate';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { unb64 } from './crypto';
import { LOCALE, type Item, type Lang } from './model';
import { copy } from '../strings';
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// Georgia and Arial have no Chinese or Korean glyphs: name the system CJK faces so the PDF never
// depends on the print engine's own fallback.
const CJK_FONTS = '"PingFang SC","Apple SD Gothic Neo","Noto Sans CJK SC","Noto Sans CJK KR"';
export interface ExportOptions { title: string; madeOn: string; lang: Lang; cover?: string }
export function exportHtml(items: Item[], options: ExportOptions): string {
  const t = copy(options.lang);
  const date = (s: string | null) => s === null ? t('unknown') : new Date(s).toLocaleString(LOCALE[options.lang]);
  const dates = (i: Item) => `<p>${escape(t('happened'))}: ${escape(date(i.happenedOn))}<br>${escape(t('saved'))}: ${escape(date(i.savedOn))}<br>${escape(t('changed'))}: ${escape(i.changedOn ? date(i.changedOn) : t('never'))}</p>`;
  return `<!doctype html><html lang="${LOCALE[options.lang].replace(/-US$/, '')}"><head><meta charset="utf-8"><style>@page{margin:42px}body{font:15px -apple-system,Arial,${CJK_FONTS},sans-serif;color:#2a251f}h1{font:28px Georgia,${CJK_FONTS},serif}h2{font:21px Georgia,${CJK_FONTS},serif}${options.lang === 'ko' ? 'body{word-break:keep-all}' : ''}p{white-space:pre-wrap;overflow-wrap:anywhere}section{break-before:page}li{margin:12px 0}</style></head><body>
    <h1>${escape(options.title)}</h1><p>${escape(date(options.madeOn))} · ${items.length} ${escape(t('items'))}</p>
    ${options.cover ? `<p>${escape(options.cover)}</p>` : ''}<p>${escape(t('dateHonesty'))}</p><p>${escape(t('educational'))}</p>
    <h2>${escape(t('contents'))}</h2><ol>${items.map(i => `<li>${escape(i.title)}${dates(i)}</li>`).join('')}</ol>
    ${items.map(i => `<section><h2>${escape(i.title)}</h2>${dates(i)}<p>${escape(i.note)}</p>${i.filename ? `<p>${escape(i.filename)}</p>` : ''}
      ${i.history.map(r => `<h3>${escape(t('earlier'))} · ${escape(date(r.changedOn))}</h3><p>${escape(r.title)}<br>${escape(r.note)}<br>${escape(t('happened'))}: ${escape(date(r.happenedOn))}</p>`).join('')}</section>`).join('')}</body></html>`;
}
export async function assemblePdf(metadataPdf: Uint8Array, items: Item[], convertPhoto?: (item: Item) => Promise<Uint8Array>): Promise<Uint8Array> {
  const out = await PDFDocument.load(metadataPdf);
  for (const item of items) {
    if (!item.bytes) continue;
    const bytes = unb64(item.bytes);
    if (item.mime === 'application/pdf' || item.filename?.toLowerCase().endsWith('.pdf')) {
      const source = await PDFDocument.load(bytes);
      for (const page of await out.copyPages(source, source.getPageIndices())) out.addPage(page);
    } else if (item.kind === 'photo' || item.mime?.startsWith('image/')) {
      let image;
      if (bytes[0] === 0xff && bytes[1] === 0xd8) image = await out.embedJpg(bytes);
      else if (bytes[0] === 0x89 && bytes[1] === 0x50) image = await out.embedPng(bytes);
      else if (convertPhoto) image = await out.embedPng(await convertPhoto(item));
      else throw Error('IMAGE_UNSUPPORTED');
      const page = out.addPage([612,792]); const scale = Math.min(528/image.width, 708/image.height);
      page.drawImage(image, { x: 42, y: 750-image.height*scale, width: image.width*scale, height: image.height*scale });
    }
  }
  const font = await out.embedFont(StandardFonts.Helvetica);
  out.getPages().forEach((page, i) => page.drawText(`${i+1} / ${out.getPageCount()}`, { x: 36, y: 20, size: 9, font, color: rgb(.3,.3,.3) }));
  return out.save();
}

export function originalArchive(items: Item[]): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  items.forEach((i, n) => { if (i.bytes !== null) files[`${n+1}-${(i.filename ?? i.id).replace(/[/\\\u0000-\u001f]/g, '_')}`] = unb64(i.bytes); });
  if (!Object.keys(files).length) throw Error('NO_ORIGINALS');
  return zipSync(files, { level: 0 });
}
