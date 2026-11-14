import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Image, Linking, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocales } from 'expo-localization';
import * as ScreenCapture from 'expo-screen-capture';
import { copy, strings, type StringKey } from '../src/strings';
import { b64, decode, equal, open, phrase, recoveryKey } from '../src/core/crypto';
import { LANGS, LANG_NAME, LOCALE, checked, contentDigest, folderLines, homeButtons, launchFolders, phoneLang, tickedBy, validate, type Item, type Labels, type Lang } from '../src/core/model';
import { userDate, editableDate, dateBoundary } from '../src/core/dates';
import { FREE_LIMIT, Vault, mayAdd, type Draft } from '../src/core/vault';
import { activeLaunch, free, renewalDue, type Entitlement, type Product } from '../src/billing/provider';
import { purchases } from '../src/billing/revenuecat';
import * as device from '../src/native/storage';
import * as files from '../src/native/files';
import * as photos from '../src/native/photos';
import { DEFAULT_REMOVE_PREF, readRemovePref, removeOriginal, shouldOffer, vaultLines, type RemovePref } from '../src/core/original';
const vaultCopy = vaultLines(photos.systemConfirm);
import { stateRulesUrl } from '../src/core/stateRules';
import { Button, Card, Field, LangContext, P, Theme, bodyFont, styles, textProps, usePalette } from '../src/ui';
import { PREVIEW_BUILD, sampleVault } from '../src/preview';
import { Glyph, folderGlyph, type GlyphName } from '../src/icons';

type Screen = 'first'|'setup'|'phrase'|'confirmPhrase'|'lock'|'reset'|'home'|'folder'|'add'|'detail'|'pdf'|'backup'|'restore'|'settings'|'plus'|'custom';
const blankDraft = (folder: string): Draft => ({ folder, checklist:null, kind:'note', title:'', note:'', happenedOn:null, filename:null, mime:null, bytes:null, tags:[] });
const parseDate = (v: string) => userDate(v).toISOString();
// First-launch picker: each choice in its own language.
const CONTINUE: Labels = { en: 'Continue in English ›', es: 'Continuar en español ›', zh: '继续使用简体中文 ›', ko: '한국어로 계속하기 ›' };
export default function App() {
  const palette = usePalette();
  const [lang, setLang] = useState<Lang>(phoneLang(getLocales()[0]));
  const t = copy(lang);
  const [screen, setScreen] = useState<Screen>('first');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [backupFailed, setBackupFailed] = useState(false);
  const [vault, setVault] = useState<Vault>(); const vaultRef = useRef<Vault | undefined>(undefined);
  const [, refresh] = useState(0);
  const [code, setCode] = useState(''), [codeAgain, setCodeAgain] = useState(''), [biometric, setBiometric] = useState(false);
  const [words, setWords] = useState(''), [wordInput, setWordInput] = useState('');
  const [folder, setFolder] = useState(launchFolders[0].id), [itemId, setItemId] = useState('');
  const [draft, setDraft] = useState<Draft>(blankDraft(launchFolders[0].id));
  const [dateInput, setDateInput] = useState(''), [unknown, setUnknown] = useState(true), [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<'edit'|'remove'|null>(null), [newFolder, setNewFolder] = useState('');
  const [lineOpen, setLineOpen] = useState(false), [newLine, setNewLine] = useState('');
  // After a photo import: offer to remove the original from Photos (src/core/original.ts).
  const [removePref, setRemovePref] = useState<RemovePref>(DEFAULT_REMOVE_PREF), [pickedAsset, setPickedAsset] = useState<string|null>(null);
  const [offer, setOffer] = useState<{ assetId: string; itemId: string }|null>(null);
  const [restoreData, setRestoreData] = useState<string|null>(null);
  // Preview only: the 123456 hint shows only while the sample vault is the one on screen, never after her own passcode.
  const [sample, setSample] = useState(false);
  const [checkData, setCheckData] = useState<string|null>(null);
  const resume = useRef<Screen>('home'); const screenRef = useRef<Screen>(screen); screenRef.current = screen;
  const [ent, setEnt] = useState<Entitlement>(free), [products, setProducts] = useState<Product[]>([]);
  const [selection, setSelection] = useState(false), [selected, setSelected] = useState<string[]>([]);
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [cover, setCover] = useState('');
  const busyRef = useRef(false), sharing = useRef(false), mounted = useRef(true);
  const billing = purchases();
  const acceptVault = (v: Vault) => {
    if (!mounted.current || AppState.currentState !== 'active') { v.lock(); return; }
    vaultRef.current = v; setVault(v); setCode(''); setCodeAgain(''); setWordInput(''); setWords(''); setScreen(resume.current);
  };
  function lock() {
    resume.current = ['home','folder','add','detail','pdf','backup','restore','settings','plus','custom'].includes(screenRef.current) ? screenRef.current : 'home';
    vaultRef.current?.lock(); vaultRef.current = undefined; setVault(undefined); setScreen('lock');
    setCode(''); setCodeAgain(''); setWordInput(''); setError(''); setNotice(''); setConfirm(null); setOffer(null); setPickedAsset(null);
    if (!sharing.current) void device.cleanTemps().catch(() => {});
  }
  useEffect(() => {
    mounted.current = true;
    void device.langChoice.read().then(l => { if (l && mounted.current) setLang(l); }).catch(() => {});
    void readRemovePref(device.removePrefStore).then(p => { if (mounted.current) setRemovePref(p); });
    void device.cleanStartupTemps().then(device.hasSetup).then(async exists => {
      setScreen(exists ? 'lock':'first');
      if (exists) setBiometric((await device.locks.read()).biometrics);
    }).catch(e => setError(t((e as Error).message in strings ? (e as Error).message as StringKey : 'error'))).finally(() => setReady(true));
    if (!PREVIEW_BUILD) void ScreenCapture.preventScreenCaptureAsync().catch(() => setError(t('error')));
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() => setError(t('error')));
    const listener = AppState.addEventListener('change', state => {
      // Lock when the app leaves the screen. iOS 'inactive' is the Face ID prompt, a file picker or the
      // app switcher (whose preview is hidden); locking there would throw people out mid-task.
      if (state === 'background' && vaultRef.current) lock();
    });
    return () => { mounted.current = false; listener.remove(); vaultRef.current?.lock(); };
  }, []);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void device.langChoice.read().then(l => setLang(l ?? phoneLang(getLocales()[0]))).catch(() => {});
        void billing.entitlement().then(setEnt).catch(() => {});
      }
    }); return () => listener.remove();
  }, [billing]);
  useEffect(() => { void billing.entitlement().then(setEnt).catch(() => {}); }, [billing]);
  async function run(job: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try { await job(); refresh(n => n+1); }
    catch (e) {
      const key = (e as Error).message;
      if (key === 'ITEM_LIMIT' || key === 'PLUS_REQUIRED') navigate('plus');
      else if (!(e as { userCancelled?: boolean }).userCancelled) setError(t(key in strings ? key as StringKey : key === 'REVENUECAT_KEY_MISSING' ? 'mock' : 'error'));
    } finally { busyRef.current = false; setBusy(false); }
  }
  const doRun = (job: () => Promise<void>) => () => { void run(job); };
  function chooseLang(l: Lang) { setLang(l); void device.langChoice.write(l).catch(() => setError(copy(l)('error'))); }
  useEffect(() => { if (screen === 'plus') void billing.products().then(setProducts).catch(() => setError(t('error'))); }, [screen, billing]);
  function navigate(next: Screen) { setError(''); setNotice(''); setConfirm(null); setOffer(null); setLineOpen(false); setNewLine(''); setScreen(next);

  }
  function back() {
    if (screen === 'phrase' || screen === 'confirmPhrase') { setWords(''); setWordInput(''); navigate('setup'); }
    else if (screen === 'setup') navigate('first');
    else if (screen === 'reset') navigate('lock');
    else if (screen === 'add' || screen === 'detail' || screen === 'pdf') navigate('folder');
    else if (screen === 'restore') navigate(vault ? 'backup' : 'first');
    else navigate('home');
  }
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (!['home','first','lock'].includes(screen)) { back(); return true; } return false;
  }); return () => sub.remove(); }, [screen, vault]);
  const state = vault?.snapshot();
  const folderName = (id: string) => {
    const f = launchFolders.find(x => x.id === id);
    return f ? (f.display_name as Labels)[lang] : state?.folders.find(x => x.id === id)?.title ?? '';
  };
  const title = folderName(folder);
  const lines = state ? folderLines(state, folder, lang) : [];
  const folderItems = state?.items.filter(i => i.folder === folder).sort((a,b) => b.savedOn.localeCompare(a.savedOn)) ?? [];
  const item = state?.items.find(i => i.id === itemId);
  const displayDate = (d: string | null) => d ? new Date(d).toLocaleString(LOCALE[lang]) : t('unknown');
  const dateFields = <><Field label={t('when')} placeholder={t('dateFormat')} value={dateInput} onChange={setDateInput} />
    <Button quiet title={`${unknown ? '✓':'○'} ${t('unknownCheck')}`} onPress={() => setUnknown(v => !v)} /></>;
  const backupStale = state && state.backup?.digest !== contentDigest(state);
  function addTo(id: string, kind: Draft['kind'] = 'note') {
    if (!state || !mayAdd(state.items.length, ent.plus)) { navigate('plus'); return; }
    setFolder(id); setDraft({ ...blankDraft(id), kind }); setPickedAsset(null); setDateInput(''); setUnknown(true); setEditing(false); navigate('add');
  }
  function startEdit(i: Item) {
    setDraft({ folder:i.folder, checklist:i.checklist, kind:i.kind, title:i.title, note:i.note, happenedOn:i.happenedOn,
      filename:i.filename, mime:i.mime, bytes:i.bytes, tags:i.tags });
    setDateInput(i.happenedOn ? editableDate(i.happenedOn) : '');
    setUnknown(i.happenedOn === null); setEditing(true); navigate('add');
  }
  async function saveDraft() {
    if (!vault || !draft.title.trim() || (draft.kind !== 'note' && !draft.bytes)) throw Error('fileRequired');
    const happenedOn = unknown ? null : parseDate(dateInput);
    if (editing) { await vault.edit(itemId, { title:draft.title.trim(), note:draft.note, happenedOn, checklist:draft.checklist, tags:draft.tags.filter(Boolean) }, true, ent.plus); }
    const savedId = editing ? null : await vault.add({ ...draft, title:draft.title.trim(), happenedOn, tags:draft.tags.filter(Boolean) }, ent.plus);
    const assetId = pickedAsset; setPickedAsset(null);
    const ask = savedId !== null && assetId !== null && shouldOffer({ pref:removePref, kind:draft.kind, assetId, editing, systemConfirm:photos.systemConfirm });
    if (vaultRef.current === vault) { setDraft(blankDraft(folder)); navigate('folder'); if (ask) setOffer({ assetId:assetId!, itemId:savedId! }); }
  }
  async function share(job: () => Promise<void>) { sharing.current = true; try { await job(); } finally { sharing.current = false; await device.cleanTemps(); } }
  const btn = (key: StringKey, action: () => void, quiet = false, primary = false) => <Button title={t(key)} onPress={action} quiet={quiet} primary={primary} disabled={busy} />;
  // The disclaimer opens the site page (Spanish has its own; Chinese and Korean read the English page).
  const disclaimerUrl = lang === 'es' ? 'https://keepmyproof.com/es/aviso-legal' : 'https://keepmyproof.com/disclaimer';
  const legal = <><Button quiet title={t('terms')} onPress={() => void Linking.openURL('https://keepmyproof.com/terms')} />
    <Button quiet title={t('privacy')} onPress={() => void Linking.openURL('https://keepmyproof.com/privacy')} /></>;
  const removeSwitch = <Card><P>{t('removeSetting')}</P><P muted>{t('removeSettingHint')}</P><Switch accessibilityLabel={t('removeSetting')} value={removePref === 'ask'}
    onValueChange={v => void run(async () => { const next: RemovePref = v ? 'ask':'never'; await device.removePrefStore.write(next); setRemovePref(next); })} /></Card>;
  let body: React.ReactNode;
  if (!ready) body = <P>{t('loading')}</P>;
  else if (screen === 'first') body = <><P muted>{t('step1')}</P><P muted>KeepMyProof</P><P heading>{t('vaultTitle')}</P><P muted>{t(vaultCopy.lock)}</P><P section>{t('firstTitle')}</P>
    <Card><P>{t('noAccount')}</P><P muted>{t('start')}</P></Card><Card><P>{t('stays')}</P><P muted>{t('local')}</P></Card>
    <Card><P>{t('firstFree')}</P><P muted>{t('five')}</P></Card>
    {PREVIEW_BUILD && <Button title="Preview only: skip to a sample vault ›" onPress={doRun(async () => {
      // Appetize's free sessions last 3 minutes, too short to set up a vault by hand. Preview builds only:
      // the release gate refuses a store build with PREVIEW_BUILD set (NAMED STOP PREVIEW_BUILD).
      setLang('en'); resume.current = 'home';
      const v = await device.setup('123456', phrase(device.random), false);
      for (const d of sampleVault()) await v.add(d, false);
      setSample(true); acceptVault(v);
    })} />}
    {LANGS.map(l => <Button key={l} title={CONTINUE[l]} onPress={() => { chooseLang(l); navigate('setup'); }} />)}
    <P muted>{t('lawFirm')}</P><P muted>{t('loss')}</P>{btn('restore', () => { setRestoreData(null); navigate('restore'); }, true)}{legal}</>;
  else if (screen === 'setup') body = <><P muted>{t('step2')}</P><P heading>{t('lockTitle')}</P><P>{t('six')}</P>
    <Field label={t('passcode')} value={code} onChange={setCode} numeric secret /><Field label={t('confirmCode')} value={codeAgain} onChange={setCodeAgain} numeric secret />
    {photos.systemConfirm && removeSwitch}
    <Card><P>{t('biometrics')}</P><Switch accessibilityLabel={t('biometrics')} value={biometric} onValueChange={setBiometric} /><P muted>{t('codeWorks')}</P></Card>
    <P muted>{t('wrongGuesses')}</P>{btn('saveCode', doRun(async () => {
      if (!/^\d{6}$/.test(code) || code !== codeAgain) throw Error('PASSCODE_INVALID');
      if (biometric && !(await device.biometricCheck(t('useBio')))) throw Error('BIOMETRIC_FAILED');
      setWords(phrase(device.random)); navigate('phrase');
    }), false, true)}</>;
  else if (screen === 'phrase') body = <><P heading>{t('recovery')}</P><P>{t('loss')}</P><P>{t('writeWords')}</P><Card><P>{words}</P></Card>
    {btn('wroteWords', () => navigate('confirmPhrase'), false, true)}</>;
  else if (screen === 'confirmPhrase') body = <><P heading>{t('confirmWords')}</P><Field label={t('words')} value={wordInput} onChange={setWordInput} multiline />
    {btn('finish', doRun(async () => {
      if (!equal(b64(recoveryKey(words)), b64(recoveryKey(wordInput)))) throw Error('RECOVERY_INVALID');
      resume.current = 'home'; acceptVault(await device.setup(code, words, biometric));
    }), false, true)}</>;
  else if (screen === 'lock') body = <><P muted>KeepMyProof</P><P heading>{t('lockVault')}</P><P>{t('locked')}</P><Field label={t('passcode')} value={code} onChange={setCode} numeric secret />
    {btn('unlock', doRun(async () => acceptVault(await device.unlock(code))), false, true)}
    {biometric && btn('useBio', doRun(async () => acceptVault(await device.unlockBiometric(t('useBio')))))}
    {btn('forgot', () => navigate('reset'), true)}<P muted>{t('wrongGuesses')}</P>
    {PREVIEW_BUILD && sample && <P muted>Preview only: the sample vault opens with 123456.</P>}</>;
  else if (screen === 'reset') body = <><P heading>{t('newCode')}</P><Field label={t('newCode')} value={code} onChange={setCode} secret numeric />
    <Field label={t('confirmCode')} value={codeAgain} onChange={setCodeAgain} numeric secret />
    <Field label={t('words')} value={wordInput} onChange={setWordInput} multiline />
    {btn('reset', doRun(async () => { if (code !== codeAgain) throw Error('PASSCODE_INVALID');
      await device.appLock.reset(code, { words:wordInput }, () => device.biometricCheck(t('useBio')), device.random); setSample(false); acceptVault(await device.loadVault()); }), false, true)}
    {biometric && btn('useBio', doRun(async () => { if (code !== codeAgain) throw Error('PASSCODE_INVALID');
      await device.appLock.reset(code, { biometric:true }, () => device.biometricCheck(t('useBio')), device.random); setSample(false); acceptVault(await device.loadVault()); }))}<P muted>{t('wrongGuesses')}</P></>;
  else if (screen === 'restore') body = <><P heading>{t('restore').replace(/\s*›$/, '')}</P><P>{t('restoreSafety')}</P>
    <Field label={t('words')} value={wordInput} onChange={setWordInput} multiline />
    {!vault && <><Field label={t('newCode')} value={code} onChange={setCode} numeric secret /><Field label={t('confirmCode')} value={codeAgain} onChange={setCodeAgain} numeric secret /></>}
    {btn('restoreChoose', doRun(async () => { setRestoreData(await files.pickBackup()); }))}
    {restoreData && btn('restore', doRun(async () => {
      validate(JSON.parse(decode(open(restoreData, recoveryKey(wordInput), 'backup-v1'))));
      if (!vault && (!/^\d{6}$/.test(code) || code !== codeAgain)) throw Error('PASSCODE_INVALID');
      resume.current = 'home';
      const v = vault ?? await device.setup(code, wordInput, false);
      await v.restore(restoreData, wordInput);
      // Existing vaults keep their confirmed phrase; a new install adopts the backup phrase at setup.
      setRestoreData(null); setWordInput(''); acceptVault(v); setNotice(t('restoreDone'));
    }), false, true)}<P muted>{t('loss')}</P></>;
  else if (!state || !vault) body = <P>{t('locked')}</P>;
  else if (screen === 'home') body = <>
    <P heading>KeepMyProof</P><P muted>{t(ent.plus ? 'plusCount':'homeIntro', { n:state.items.length })}</P>
    {backupStale && <Card tone="gold"><P>{t('newBackup', { n:state.items.length })}</P>{btn('backUp', () => navigate('backup'))}</Card>}
    {renewalDue(ent) && <Card tone="gold"><P>{t('renewal', { date:displayDate(ent.renewsOn) })}</P></Card>}
    <BigButton glyph="camera" title={t('addPhotos')} sub={t('addPhotosSub')} go={t('addGo')} disabled={busy} onPress={() => addTo(folder, 'photo')} />
    <P section>{t('canKeep')}</P>
    <View style={styles.tiles}>{([['page','keepLetters'],['phone','keepTexts'],['receipt','keepBills'],['camera','keepPhotos'],['calendar','keepNotes'],['medical','keepSchool']] as [GlyphName, StringKey][])
      .map(([g,key]) => <View key={key} style={[styles.tile,{ backgroundColor:palette.tile }]}><Glyph name={g} bg={palette.tile} /><Text {...textProps(lang)} style={{ color:palette.fg, fontSize:12, lineHeight:16, textAlign:'center', fontFamily:bodyFont(lang) }}>{t(key)}</Text></View>)}</View>
    <P section>{t('home')}</P>
    {homeButtons(state).map(b => b.kind === 'folder'
      ? <BigButton key={b.id} glyph={b.own ? 'folder' : folderGlyph[b.id] ?? 'folder'} title={folderName(b.id)} go={t('open')} disabled={busy}
          sub={b.done || b.items ? [b.done && t(b.done === 1 ? 'ticked1':'tickedN', { n:b.done }), b.items && t(b.items === 1 ? 'items1':'itemsN', { n:b.items })].filter(Boolean).join(' · ') : t('nothingYet')}
          onPress={() => { setFolder(b.id); navigate('folder'); }} />
      : <BigButton key="makeOwn" glyph="plus" dashed title={t('makeOwn')} tag={t('plusTag')} sub={t('makeOwnSub')} go={t('open')} disabled={busy}
          onPress={() => navigate(ent.plus ? 'custom' : 'plus')} />)}
    {btn('add', () => addTo(folder), false, true)}
    <P muted>{state.backup ? t('lastBackup',{ date:displayDate(state.backup.checkedOn) }):t('noBackup')}</P><P muted>{t('hideHint')}</P></>;
  else if (screen === 'folder') body = <>{offer && <Card><P heading>{t('removeAsk')}</P><P muted>{t('removeWhy')}</P>
      {btn('keepInPhotos', () => { setOffer(null); setNotice(t('keptNotice')); })}
      {btn('removeFromPhotos', doRun(async () => {
        const o = offer; setOffer(null);
        const result = await removeOriginal(o.assetId, vault.snapshot().items.find(i => i.id === o.itemId), photos.deleteFromPhotos);
        setNotice(t(result === 'removed' ? 'removedNotice' : 'keptNotice'));
      }), true)}</Card>}<P heading>{title}</P><P muted>{t('suggested')}</P>
    {folder === 'va-disability-papers' && <Card><P>{t('vaScope')}</P><P>{t('vaHelp')}</P><Button title={t('vaLink')} onPress={() => void Linking.openURL('https://www.va.gov/get-help-from-accredited-representative/')} /></Card>}
    <P section>{t('checklist')}</P>
    <View style={[styles.list,{ borderColor:palette.line, backgroundColor:palette.card }]}>
      {lines.map((l, n) => { const how = tickedBy(state, folder, l.id);
        return <TickRow key={l.id} first={n === 0} done={checked(state,folder,l.id)} title={l.name} disabled={busy}
          sub={how === 'paper' ? t('byPaper') : how === 'hand' ? t('byHand') : undefined}
          onPress={doRun(async () => vault.tick(folder,l.id,!checked(state,folder,l.id)))} />; })}
      <TickRow add first={!lines.length} title={t('addLine')} tag={ent.plus ? undefined : t('plusTag')} disabled={busy}
        onPress={() => ent.plus ? setLineOpen(true) : navigate('plus')} />
    </View>
    {lineOpen && ent.plus && <Card><Field label={t('lineName')} value={newLine} onChange={setNewLine} />
      {btn('saveLine', doRun(async () => { await vault.addLine(folder, newLine, ent.plus); setNewLine(''); setLineOpen(false); }))}
      {btn('cancel', () => { setNewLine(''); setLineOpen(false); }, true)}</Card>}
    <P muted>{t('autoTick')}</P>
    {stateRulesUrl(folder, lang) && <Button title={t('stateRules')} disabled={busy} onPress={() => void Linking.openURL(stateRulesUrl(folder, lang)!)} />}
    <P heading>{t('newest')}</P>{folderItems.length ? folderItems.map(i => <Card key={i.id}><P>{i.title}</P><P muted>{t('happened')}: {displayDate(i.happenedOn)}</P>
      {btn('open', () => { setItemId(i.id); navigate('detail'); })}</Card>) : <P muted>{t('empty')}</P>}
    {btn('folderPdf', () => { setSelection(false); setCover(''); navigate('pdf'); })}<P muted>{t(folder === 'va-disability-papers' ? 'vaDisclaimer':'folderFoot')}</P>{btn('add', () => addTo(folder), false, true)}</>;
  else if (screen === 'add') body = <><P heading>{editing ? t('edit'):t('addTo',{ folder:title })}</P>
    {!editing && <>{[...launchFolders.map(f => ({id:f.id})), ...state.folders].map(f => <Button quiet key={f.id} title={`${draft.folder === f.id ? '✓':'○'} ${folderName(f.id)}`} onPress={() => { setFolder(f.id); setDraft(d => ({...d,folder:f.id,checklist:null})); }} />)}
      <View style={styles.row}>{(['photo','file','note'] as const).map(kind => <View key={kind} style={styles.flex}><Button title={t(kind)} checked={draft.kind===kind} onPress={() => { setPickedAsset(null); setDraft(d => ({...d,kind,bytes:null,filename:null,mime:null})); }} /></View>)}</View>
      {draft.kind !== 'note' && <>{btn(draft.kind === 'photo' ? 'pickPhoto':'pick', doRun(async () => {
        const picked = await files.pickAttachment(draft.kind === 'photo'); if (!picked) return;
        const { assetId, ...file } = picked; setPickedAsset(assetId ?? null); setDraft(d => ({...d,...file,title:d.title || file.filename}));
      }))}{draft.kind === 'photo' && <P muted>{t(vaultCopy.photo)}</P>}{draft.filename && <Card><P>{draft.filename}</P><P muted>{t('kept')}</P></Card>}</>}
    </>}
    <Field label={t('name')} value={draft.title} onChange={title => setDraft(d => ({...d,title}))} />{dateFields}
    <P muted>{t('line')}</P><Button quiet title={`${draft.checklist === null ? '✓':'○'} ${t('noLine')}`} onPress={() => setDraft(d => ({...d,checklist:null}))} />
    {lines.map(c => <Button quiet key={c.id} title={`${draft.checklist===c.id ? '✓':'○'} ${c.name}`} onPress={() => setDraft(d => ({...d,checklist:c.id}))} />)}
    <Field label={t('optionalNote')} value={draft.note} onChange={note => setDraft(d => ({...d,note}))} multiline />
    {ent.plus && <Field label={t('tags')} value={draft.tags.join(',')} onChange={v => setDraft(d => ({...d,tags:v.split(',').map(s=>s.trim())}))} />}
    <P muted>{t('addingDate')}</P>
    {confirm === 'edit' ? <Card><P>{t('confirmEdit')}</P>{btn('yesSave', doRun(saveDraft))}{btn('keep', () => setConfirm(null),true)}</Card> :
      <Button primary title={editing ? t('saveChanges'):t('saveTo',{folder:title})} disabled={busy} onPress={editing ? () => setConfirm('edit'):doRun(saveDraft)} />}
    {btn('cancel', () => { setDraft(blankDraft(folder)); navigate('folder'); },true)}</>;
  else if (screen === 'detail' && item) body = <><P muted>{title}</P><P heading>{item.title}</P><Card>
    <P>{t('happened')}: {displayDate(item.happenedOn)} {item.happenedOn ? t('yourDate'):''}</P><P>{t('saved')}: {displayDate(item.savedOn)}</P>
    <P>{t('changed')}: {item.changedOn ? displayDate(item.changedOn):t('never')}</P></Card>
    {item.kind === 'photo' && item.bytes && <Image source={{ uri:`data:${item.mime};base64,${item.bytes}` }} style={{width:'100%',height:240}} resizeMode="contain" accessibilityLabel={item.title} />}
    <P heading>{t('yourNote')}</P><Card><P>{item.note}</P></Card><P muted>{t('dateHonesty')}</P>
    {item.history.map((r,n) => <Card key={n}><P>{t('earlier')} · {displayDate(r.changedOn)}</P><P>{r.title}</P><P>{r.note}</P><P muted>{t('happened')}: {displayDate(r.happenedOn)}</P></Card>)}
    {btn('edit', () => startEdit(item))}{btn('folderPdf', () => {setSelection(false);navigate('pdf');})}
    {item.bytes && btn('saveOriginals', doRun(async () => share(() => files.shareOriginals([item]))))}
    {confirm === 'remove' ? <Card><P>{t('confirmRemove')}</P>{btn('yesRemove', doRun(async () => { await vault.remove(item.id,true); if(vaultRef.current === vault)navigate('folder'); }))}{btn('keep', () => setConfirm(null),true)}</Card> : btn('remove', () => setConfirm('remove'),true)}</>;
  else if (screen === 'pdf') body = <><P heading>{t('pdfTitle',{folder:title})}</P><P>{t('pdfIntro',{n:folderItems.length})}</P>
    <Card>{folderItems.map((i,n) => <View key={i.id}><P>{n+1}. {i.title}</P><P muted>{t('happened')}: {displayDate(i.happenedOn)} · {t('saved')}: {displayDate(i.savedOn)}</P></View>)}</Card>
    <P muted>{t('pdfWarning')}</P><P muted>{t('unsupportedPdf')}</P>
    {ent.plus && <><Button title={`${selection?'✓':'○'} ${t('chosen')}`} onPress={() => {setSelection(!selection);setSelected(folderItems.map(i=>i.id));}} />
      {selection && <>{folderItems.map(i => <Button quiet key={i.id} title={`${selected.includes(i.id)?'✓':'○'} ${i.title}`} onPress={() => setSelected(v => v.includes(i.id)?v.filter(id=>id!==i.id):[...v,i.id])} />)}
        <Field label={t('from')} value={from} onChange={setFrom} /><Field label={t('to')} value={to} onChange={setTo} /><Field label={t('cover')} value={cover} onChange={setCover} multiline /></>}</>}
    {btn('savePdf', doRun(async () => {
      const selectionOptions = selection ? { ids:selected, from:from ? dateBoundary(from,false):undefined, to:to ? dateBoundary(to,true):undefined }:undefined;
      const items = vault.items(folder, selectionOptions, ent.plus);
      await share(() => files.sharePdf(items,{title,madeOn:new Date().toISOString(),lang,cover:selection ? cover:undefined}));
    }), false, true)}{btn('saveOriginals', doRun(async () => share(() => files.shareOriginals(vault.items(folder)))))}
    <P muted>{t('plusPdf')}</P>{btn('seePlus', () => navigate('plus'),true)}</>;
  else if (screen === 'backup') body = <><P heading>{t('backup')}</P>
    <Card tone={state.backup ? 'ok':undefined}><P>{state.backup ? t('lastBackup',{date:displayDate(state.backup.checkedOn)}):t('noBackup')}</P></Card>
    {backupStale && <Card tone="gold"><P>{t('newBackup',{n:state.items.length})}</P></Card>}<P>{t('backupDestination')}</P>
    {btn('backUp', doRun(async () => { const data = vault.backup(await device.backupKey()); await share(() => files.shareBytes(data,`KeepMyProof-${Date.now()}.kmp`,'application/octet-stream')); }), false, true)}
    <P muted>{t('backupCheckHint')}</P>{btn('backupCheck', doRun(async () => {
      try { if (checkData) { await vault.checkBackup(checkData,await device.backupKey());setCheckData(null);setBackupFailed(false);setNotice(t('backupDone')); } else setCheckData(await files.pickBackup()); }
      catch(e) { setBackupFailed(true);throw e; }
    }))}
    <Card><P>{t('recovery')}</P><P muted>{t('confirmed')}</P></Card><P heading>{t('newPhone')}</P><P>{t('restoreHint')}</P><P muted>{t('loss')}</P>
    {btn('restore', () => {setRestoreData(null);setWordInput('');navigate('restore');})}<P muted>{t('restoreSafety')}</P></>;
  else if (screen === 'settings') body = <><P heading>{t('settings')}</P><P muted>{t('noAnalytics')}</P>
    <Card><P>{t('language')}</P>{LANGS.map(l => <Button quiet key={l} checked={lang === l} title={`${lang === l ? '✓':'○'} ${LANG_NAME[l]}`} onPress={() => chooseLang(l)} />)}</Card>
    <P section>{t('vaultSection')}</P>
    {photos.systemConfirm ? removeSwitch : <Card><P>{t('androidOriginal')}</P><P muted>{t('androidOriginalHow')}</P></Card>}
    <Card><P>{t('biometrics')}</P><Switch accessibilityLabel={t('biometrics')} value={biometric} onValueChange={v => void run(async () => { await device.setBiometrics(v,t('useBio'));setBiometric(v); })} /></Card>
    {[...launchFolders, ...state.folders].map(f => <Card key={f.id}><P>{folderName(f.id)}</P><Button quiet title={t(state.hidden.includes(f.id)?'show':'hide')} onPress={doRun(async () => vault.hide(f.id,!state.hidden.includes(f.id)))} /></Card>)}
    {btn('ownFolder', () => ent.plus ? navigate('custom'):navigate('plus'))}{btn('seePlus', () => navigate('plus'))}
    {btn('restorePurchases', doRun(async () => { const next=await billing.restore();setEnt(next);setNotice(t(next.plus?'restoredPurchases':'noPurchase')); }))}
    {ent.managementURL && <Button title={t('manage')} onPress={() => void Linking.openURL(ent.managementURL!)} />}{legal}
    <Button quiet title={t('disclaimer')} onPress={() => void Linking.openURL(disclaimerUrl)} />{btn('lockNow', lock,true)}</>;
  else if (screen === 'custom') body = <><P heading>{t('custom')}</P><Field label={t('folderName')} value={newFolder} onChange={setNewFolder} />
    {btn('createFolder',doRun(async () => { const id = await vault.addFolder(newFolder.trim(),ent.plus);setFolder(id);setNewFolder('');navigate('folder'); }), false, true)}</>;
  else if (screen === 'plus') body = <><P heading>{t(state.items.length >= FREE_LIMIT ? 'limitTitle':'plusTitle')}</P><P>{t('keepsFree')}</P><P>{t('plusLets')}</P>
    <Card><P>{t('unlimited')}</P></Card><Card><P>{t('custom')}</P></Card><Card><P>{t('selectedPdf')}</P></Card>
    {billing.mode === 'mock' && <Card tone="gold"><P>{t('mock')}</P></Card>}
    {products.map(p => { const launch=activeLaunch(p);const price=launch?.price ?? p.price;
      return <Card key={p.id}><P heading>{launch ? t('launch',{price,normal:launch.normalPrice}):t(p.plan==='lifetime'?'lifetimePrice':'annualPrice',{price})}</P>
        <P muted>{t(p.plan==='lifetime'?'lifetimeTerms':'annualTerms')}</P><Button title={t(p.plan==='lifetime'?'buyLifetime':'buyAnnual',{price})} disabled={busy||billing.mode==='mock'||ent.plus}
          onPress={doRun(async () => {setEnt(await billing.purchase(p.id));navigate('home');})} />{legal}</Card>;
    })}{btn('notNow', () => navigate('home'),true)}<P muted>{t('storeConfirm')}</P>
    {btn('restorePurchases',doRun(async () => {const next=await billing.restore();setEnt(next);setNotice(t(next.plus?'restoredPurchases':'noPurchase'));}))}{legal}</>;
  else body = <P>{t('empty')}</P>;
  return <Theme.Provider value={palette}><LangContext.Provider value={lang}><SafeAreaView style={[styles.container,{backgroundColor:palette.bg}]}>
    <ScrollView key={screen} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {ready && !['first','home','lock'].includes(screen) && <Button quiet title={['folder','backup','settings','plus','custom'].includes(screen)?t('backHome'):['add','detail','pdf'].includes(screen)&&title?t('backTo',{folder:title}):t('back')} onPress={back} disabled={busy} />}
      {!!error && <Card tone="gold"><P>{error}</P></Card>}{backupFailed && <Card tone="red"><P>{t('backupFailed')}</P></Card>}
      {!!notice && <Card tone="ok"><P>{notice}</P></Card>}{busy && <P muted>{t('working')}</P>}{body}
    </ScrollView>
    {vault && ['home','backup','settings'].includes(screen) && <View style={[styles.tabs,{backgroundColor:palette.card}]}>
      {(['home','backup','settings'] as const).map(tab => <View key={tab} style={styles.flex}><Button quiet checked={screen===tab} title={t(tab==='home'?'folders':tab)} onPress={() => navigate(tab)} disabled={busy} /></View>)}
    </View>}
  </SafeAreaView></LangContext.Provider></Theme.Provider>;
}

// One big tappable folder door on Home: drawing, name, one grey sub line, "Open ›" on the right.
function BigButton({ glyph, title, sub, go, tag, dashed, disabled, onPress }: {
  glyph: GlyphName; title: string; sub: string; go: string; tag?: string; dashed?: boolean; disabled?: boolean; onPress: () => void;
}) {
  const c = React.useContext(Theme), lang = React.useContext(LangContext), tp = textProps(lang);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${sub}`} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.big, { backgroundColor:c.card, borderColor: dashed ? c.muted : c.ok, borderStyle: dashed ? 'dashed' : 'solid', opacity: disabled ? .5 : pressed ? .7 : 1 }]}>
    <Glyph name={glyph} size={44} />
    <View style={styles.flex}><Text {...tp} style={{ color:c.fg, fontSize:16, lineHeight:22, fontWeight:'600', fontFamily:bodyFont(lang, true) }}>{title}{tag ? '  ' : ''}{tag && <Text style={{ color:c.gold, fontSize:11 }}>{tag}</Text>}</Text>
      <Text {...tp} style={{ color:c.muted, fontSize:13, lineHeight:18, fontFamily:bodyFont(lang) }}>{sub}</Text></View>
    <Text style={{ color:c.ok, fontSize:15, fontWeight:'600', fontFamily:bodyFont(lang, true) }}>{go}</Text>
  </Pressable>;
}
// One compact checklist line: a small tick box and one line of text (a grey sub line says how it got ticked).
function TickRow({ title, sub, done, add, tag, first, disabled, onPress }: {
  title: string; first?: boolean; sub?: string; done?: boolean; add?: boolean; tag?: string; disabled?: boolean; onPress: () => void;
}) {
  const c = React.useContext(Theme), lang = React.useContext(LangContext), tp = textProps(lang);
  return <Pressable accessibilityRole={add ? 'button' : 'checkbox'} accessibilityState={{ checked: add ? undefined : !!done, disabled }} accessibilityLabel={title}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.tickRow, { borderTopColor:c.line, borderTopWidth: first ? 0 : 1, opacity: disabled ? .5 : pressed ? .7 : 1 }]}>
    <View style={[styles.box, { borderColor: add || done ? c.ok : c.muted, borderStyle: add ? 'dashed' : 'solid', backgroundColor: done ? c.ok : 'transparent' }]}>
      <Text style={{ color: done ? c.card : c.ok, fontSize:15, fontWeight:'700', lineHeight:18 }}>{done ? '✓' : add ? '+' : ''}</Text></View>
    <View style={styles.flex}><Text {...tp} style={{ color: add ? c.ok : c.fg, fontSize:15, lineHeight:20, fontWeight: add ? '600' : '400', fontFamily:bodyFont(lang, !!add) }}>{add ? title.replace(/^\+\s*/, '') : title}{tag ? '  ' : ''}{tag && <Text style={{ color:c.gold, fontSize:11, fontWeight:'600' }}>{tag}</Text>}</Text>
      {sub && <Text {...tp} style={{ color:c.muted, fontSize:12, lineHeight:16, fontFamily:bodyFont(lang) }}>{sub}</Text>}</View>
  </Pressable>;
}
