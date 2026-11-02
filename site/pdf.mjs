// A one-page printable checklist as a PDF, with no dependencies (Cloudflare Pages builds site/ with
// plain Node). Helvetica with WinAnsi encoding covers English and Spanish (á é í ó ú ñ ü ¿ ¡).
const WIN = { '€': 0x80, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, '•': 0x95, '…': 0x85 };

function encode(s) {
  const out = [];
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    let b = WIN[ch] ?? (c < 256 ? c : null);
    if (b === null) throw Error(`NAMED STOP [PDF_CHAR] "${ch}" cannot be written in a WinAnsi PDF`);
    if (b === 0x28 || b === 0x29 || b === 0x5c) out.push(0x5c);
    out.push(b);
  }
  return Buffer.from(out).toString('latin1');
}

// Helvetica widths (per 1000 em) for wrapping; unknown glyphs use 556 (close enough to wrap safely).
const W = { ' ': 278, ',': 278, '.': 278, ':': 278, ';': 278, '(': 333, ')': 333, '-': 333, "'": 191, i: 222, l: 222, j: 222, t: 278, f: 278, r: 333, I: 278, m: 833, w: 722, M: 833, W: 944 };
const width = (s, size) => [...s].reduce((n, ch) => n + (W[ch] ?? (ch === ch.toUpperCase() && /\p{L}/u.test(ch) ? 667 : 556)), 0) * size / 1000;

function wrap(text, size, max) {
  const lines = []; let line = '';
  for (const word of String(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (width(next, size) > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** { title, intro, items: [string], dateLabel, footer: [string] } -> Buffer (application/pdf). */
export function checklistPdf({ title, intro, items, dateLabel, footer }) {
  const ops = [], L = 54, R = 558, top = 760;
  let y = top;
  const text = (s, x, yy, size, bold = false) => ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${yy} Td (${encode(s)}) Tj ET`);
  for (const l of wrap(title, 20, R - L)) { text(l, L, y, 20, true); y -= 26; }
  y -= 2;
  for (const l of wrap(intro, 10.5, R - L)) { text(l, L, y, 10.5); y -= 14; }
  y -= 14;
  text(dateLabel, R - 120, y + 2, 9, true);
  y -= 10;
  for (const item of items) {
    const lines = wrap(item, 12, R - L - 170);
    const h = Math.max(30, lines.length * 15 + 14);
    if (y - h < 90) throw Error('NAMED STOP [PDF_OVERFLOW] the checklist does not fit on one page');
    ops.push(`0.6 w ${L} ${y - 16} 12 12 re S`);
    lines.forEach((l, i) => text(l, L + 22, y - 14 - i * 15, 12));
    ops.push(`0.5 w ${R - 120} ${y - 16} m ${R} ${y - 16} l S`);
    ops.push(`0.3 w 0.8 G ${L} ${y - h + 4} m ${R} ${y - h + 4} l S 0 G`);
    y -= h;
  }
  y -= 6;
  for (const n of [0, 1, 2]) { ops.push(`0.6 w ${L} ${y - 16} 12 12 re S`); ops.push(`0.5 w ${L + 22} ${y - 16} m ${R - 140} ${y - 16} l S`); ops.push(`0.5 w ${R - 120} ${y - 16} m ${R} ${y - 16} l S`); y -= 28; }
  let fy = 72;
  for (const f of [...footer].reverse()) for (const l of wrap(f, 8.5, R - L).reverse()) { text(l, L, fy, 8.5); fy += 11; }
  const stream = ops.join('\n');
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${encode(title)}) /Producer (KeepMyProof) >>`,
  ];
  let pdf = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(pdf, 'latin1')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
