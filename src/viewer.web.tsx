import React from 'react';
// Browser stand-in for viewer.tsx (free web preview only): the saved file in a frame, from memory.
export function FileView({ uri, filename }: { uri: string; mime: string | null; filename: string | null; labels: { openPdf: string; cannotShow: string } }) {
  return React.createElement('iframe', { src: uri, title: filename ?? 'file', sandbox: '', style: { width: '100%', height: 480, border: 0 } });
}
