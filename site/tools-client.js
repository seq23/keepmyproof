// KeepMyProof free tools. Everything runs on this device: no network request, no storage.
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('[data-tool]'); if (!root) return;
  const L = JSON.parse($('#tool-strings').textContent), lang = document.documentElement.lang;
  const t = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => o[k] ?? m);
  const save = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); };
  const baseName = (n) => n.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 60) || 'photo';
  async function bitmap(file) { try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { return await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); }); } }
  const canvasOf = (img, max = 4000) => { const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c; };
  const blobOf = (c, type = 'image/jpeg', q = 0.92) => new Promise((ok) => c.toBlob(ok, type, q));
  // Look for EXIF location (GPS IFD pointer tag 0x8825) in the first 256 KB.
  async function hasGps(file) { const b = new Uint8Array(await file.slice(0, 262144).arrayBuffer()); for (let i = 0; i < b.length - 1; i++) if ((b[i] === 0x88 && b[i + 1] === 0x25) || (b[i] === 0x25 && b[i + 1] === 0x88)) return true; return false; }
  // Date stored in the photo (EXIF "YYYY:MM:DD HH:MM:SS"), else null.
  async function exifDate(file) { const s = new TextDecoder('latin1').decode(await file.slice(0, 262144).arrayBuffer()); const m = /(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(s); return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null; }
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isoTime = (d) => `${iso(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const tools = {
    'photo-privacy'() {
      const out = $('#pp-out');
      $('#pp-files').addEventListener('change', async (e) => {
        out.textContent = '';
        for (const f of e.target.files) {
          const gps = await hasGps(f), img = await bitmap(f), c = canvasOf(img), blob = await blobOf(c);
          const li = document.createElement('li'); li.textContent = `${f.name}: ${gps ? L.gpsFound : L.gpsNone} `;
          const b = document.createElement('button'); b.className = 'btn'; b.type = 'button'; b.textContent = L.download; b.onclick = () => save(blob, `${baseName(f.name)}-clean.jpg`);
          li.appendChild(b); out.appendChild(li);
        }
      });
      // Redact: drag boxes on the picture, then download a clean copy.
      const cv = $('#rd-canvas'), ctx = cv.getContext('2d'); let base = null, boxes = [], start = null;
      const draw = () => { if (!base) return; ctx.drawImage(base, 0, 0); for (const r of boxes) { if ($('#rd-mode').value === 'blur') { const s = Math.max(8, Math.round(Math.min(r.w, r.h) / 6)); const t = document.createElement('canvas'); t.width = Math.max(1, Math.round(Math.abs(r.w) / s)); t.height = Math.max(1, Math.round(Math.abs(r.h) / s)); t.getContext('2d').drawImage(cv, r.x, r.y, r.w, r.h, 0, 0, t.width, t.height); ctx.imageSmoothingEnabled = false; ctx.drawImage(t, 0, 0, t.width, t.height, r.x, r.y, r.w, r.h); ctx.imageSmoothingEnabled = true; } else { ctx.fillStyle = '#000'; ctx.fillRect(r.x, r.y, r.w, r.h); } } };
      const pt = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * cv.width / b.width, y: (e.clientY - b.top) * cv.height / b.height }; };
      $('#rd-file').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; base = canvasOf(await bitmap(f), 2400); cv.width = base.width; cv.height = base.height; boxes = []; cv.hidden = false; $('#rd-actions').hidden = false; draw(); });
      cv.addEventListener('pointerdown', (e) => { start = pt(e); cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointerup', (e) => { if (!start) return; const p = pt(e); const r = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) }; start = null; if (r.w > 4 && r.h > 4) { boxes.push(r); draw(); } });
      $('#rd-mode').addEventListener('change', draw);
      $('#rd-undo').onclick = () => { boxes.pop(); draw(); };
      $('#rd-save').onclick = async () => save(await blobOf(cv, 'image/png'), 'redacted.png');
    },
    'dated-pdf'() {
      $('#dp-files').addEventListener('change', async (e) => {
        const status = $('#dp-status'); status.textContent = L.working;
        const items = [];
        for (const f of e.target.files) { const d = await exifDate(f); items.push({ f, date: d || new Date(f.lastModified), from: d ? L.fromPhoto : L.fromFile }); }
        items.sort((a, b) => a.date - b.date);
        const pages = [];
        for (const it of items) { const c = canvasOf(await bitmap(it.f), 1800); const jpg = new Uint8Array(await (await blobOf(c, 'image/jpeg', 0.85)).arrayBuffer()); pages.push({ jpg, w: c.width, h: c.height, label: `${isoTime(it.date)} (${it.from}) ${baseName(it.f.name)}` }); }
        save(new Blob([pdf(pages)], { type: 'application/pdf' }), `photos-${iso(new Date())}.pdf`);
        status.textContent = t(L.done, { n: items.length });
      });
      // A minimal PDF: one page per photo (JPEG as-is), the date line in Helvetica at the top.
      function pdf(pages) {
        const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
        const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
        const objs = []; const obj = (body) => { objs.push(body); return objs.length; };
        const font = obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
        const kids = [];
        const pagesId = objs.length + 1 + pages.length * 3; // placeholder resolved below
        const ascii = (s) => s.replace(/[^\x20-\x7e]/g, '?').replace(/([\\()])/g, '\\$1');
        for (const p of pages) {
          const im = obj({ dict: `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>`, stream: p.jpg });
          const W = 612, H = 792, M = 36, top = 40, k = Math.min((W - 2 * M) / p.w, (H - 2 * M - top) / p.h), w = p.w * k, h = p.h * k;
          const content = `BT /F1 11 Tf ${M} ${H - M - 12} Td (${ascii(p.label)}) Tj ET q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${((W - w) / 2).toFixed(2)} ${(H - M - top - h).toFixed(2)} cm /Im Do Q`;
          const ct = obj({ dict: `<< /Length ${enc.encode(content).length} >>`, stream: enc.encode(content) });
          kids.push(obj(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> /XObject << /Im ${im} 0 R >> >> /Contents ${ct} 0 R >>`));
        }
        const pg = obj(`<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`);
        if (pg !== pagesId) throw Error('pdf ids');
        const cat = obj(`<< /Type /Catalog /Pages ${pg} 0 R >>`);
        push('%PDF-1.4\n');
        objs.forEach((o, i) => { offs.push(len); push(`${i + 1} 0 obj\n`); if (typeof o === 'string') push(o); else { push(`${o.dict}\nstream\n`); push(o.stream); push('\nendstream'); } push('\nendobj\n'); });
        const x = len; push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${x}\n%%EOF\n`);
        const all = new Uint8Array(len); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; } return all;
      }
    },
    calc() {
      const data = JSON.parse($('#calc-data').textContent), sel = $('#calc-state'), date = $('#calc-date'), out = $('#calc-out');
      const add = (d, n, u) => { const x = new Date(d); if (u === 'day') x.setDate(x.getDate() + n); else if (u === 'month') x.setMonth(x.getMonth() + n); else x.setFullYear(x.getFullYear() + n); return x; };
      const fmt = (d) => d.toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const run = () => {
        out.textContent = ''; const rows = data[sel.value] || []; if (!date.value || !rows.length) return;
        const [y, m, d] = date.value.split('-').map(Number), start = new Date(y, m - 1, d);
        for (const r of rows) {
          const box = document.createElement('div'); box.className = 'box';
          const p = document.createElement('p'); p.textContent = lang === 'es' ? r.es : r.en; box.appendChild(p);
          for (const x of r.d) { const q = document.createElement('p'); q.className = 'price'; q.textContent = x.kind === 'calendar' ? t(L.result, { n: x.n, unit: L.units[x.unit], date: fmt(add(start, x.n, x.unit)) }) : t(L.notCalendar, { n: x.n, kind: L.kinds[x.kind] }); box.appendChild(q); }
          const s = document.createElement('p'); s.className = 'sub'; const a = document.createElement('a'); a.href = r.src; a.rel = 'noopener'; a.textContent = r.name; s.append(L.source, ' ', a, `. ${L.checked} ${r.on}.`); box.appendChild(s);
          out.appendChild(box);
        }
        const n = document.createElement('p'); n.className = 'sub'; n.textContent = L.notAdvice; out.appendChild(n);
      };
      sel.addEventListener('change', run); date.addEventListener('change', run);
    },
    printable() {
      const body = $('#pr-rows'), tpl = $('#pr-row');
      const addRow = () => body.appendChild(tpl.content.cloneNode(true));
      for (let i = 0; i < 6; i++) addRow();
      $('#pr-add').onclick = addRow;
      $('#pr-print').onclick = () => window.print();
    },
  };
  tools[root.dataset.tool]?.();
})();
