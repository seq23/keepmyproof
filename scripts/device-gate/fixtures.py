# Invented files for the device gate, written into Files › On My iPhone on the Simulator: a one-page PDF and a
# small PNG (real formats, so the app's import and PDF paths treat them as a person's files).
import sys, zlib, struct, os
d = sys.argv[1]
pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 52>>stream\nBT /F1 18 Tf 30 100 Td (Invented gate paper) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
open(os.path.join(d, 'gate-paper.pdf'), 'wb').write(pdf)
w, h = 64, 48
raw = b''.join(b'\x00' + b''.join(bytes((x * 4 % 256, y * 5 % 256, 120)) for x in range(w)) for y in range(h))
chunk = lambda t, b: struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
open(os.path.join(d, 'gate-photo.png'), 'wb').write(png)
print('fixtures: gate-paper.pdf, gate-photo.png in', d)
