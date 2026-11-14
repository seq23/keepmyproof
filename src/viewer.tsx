import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import { Button, P } from './ui';
// A saved file shown inside the app (user review 14 Nov 2026, finding 14). iPhone: the system web view
// shows PDFs, pictures and most documents. Android's web view cannot show PDFs, so a PDF opens in the
// phone's own print preview, where every page can be read. Only the local file is ever loaded: no page,
// script or address from outside the phone.
export function FileView({ uri, mime, filename, labels }: { uri: string; mime: string | null; filename: string | null;
  labels: { openPdf: string; cannotShow: string } }) {
  const pdf = mime === 'application/pdf' || !!filename?.toLowerCase().endsWith('.pdf');
  if (Platform.OS === 'android' && pdf) return <Button title={labels.openPdf} onPress={() => void Print.printAsync({ uri }).catch(() => {})} />;
  if (Platform.OS === 'android' && !mime?.startsWith('image/') && !mime?.startsWith('text/')) return <P muted>{labels.cannotShow}</P>;
  const dir = uri.slice(0, uri.lastIndexOf('/') + 1);
  return <WebView source={{ uri }} originWhitelist={['file://*']} allowingReadAccessToURL={dir} allowFileAccess javaScriptEnabled={false}
    onShouldStartLoadWithRequest={r => r.url.startsWith('file://')} style={{ width: '100%', height: 480 }} />;
}
