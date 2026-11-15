import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Share, Switch, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLocales } from 'expo-localization';
import * as ScreenCapture from 'expo-screen-capture';
import { copy, strings, type StringKey } from '../src/strings';
import { b64, decode, equal, open, phrase, recoveryKey } from '../src/core/crypto';
import { DEFAULT_ADD_FOLDER, LANGS, LANG_NAME, LOCALE, type Labels, allTags, appFolders, backupNudge, checked, folderLines, homeButtons, parseTags, phoneLang, searchItems, tickedBy, validate, type Item, type Lang } from '../src/core/model';
import { backupName, dateBoundary, inputDate, inputTime, resolveHappened, showHappened } from '../src/core/dates';
import { LockError } from '../src/core/lock';
import { FREE_LIMIT, Vault, mayAdd, newestFirst, type Draft, type Replacement } from '../src/core/vault';
import { BIO_NAME, bioKind, type BioKind } from '../src/core/bio';
import { FileView } from '../src/viewer';
import { activeLaunch, free, renewalDue, type Entitlement, type Product } from '../src/billing/provider';
import { purchases } from '../src/billing/revenuecat';
import * as device from '../src/native/storage';
import * as files from '../src/native/files';
import type { Picked } from '../src/native/files';
import * as photos from '../src/native/photos';
import { DEFAULT_REMOVE_PREF, readRemovePref, removeOriginals, shouldOffer, vaultLines, type RemovePref } from '../src/core/original';
const vaultCopy = vaultLines(photos.systemConfirm);
import { stateRulesUrl } from '../src/core/stateRules';
import { Button, Card, Field, LangContext, P, Theme, bodyFont, styles, textProps, usePalette } from '../src/ui';
import { PREVIEW_BUILD, sampleVault } from '../src/preview';
import { Glyph, folderGlyph, type GlyphName } from '../src/icons';
import { HEARD, readHeard, saveHeard, sendHeard, type Heard, type HeardAnswer } from '../src/core/heard';
const HEARD_KEY: Record<Heard, StringKey> = { google:'heardGoogle', ai:'heardAi', store:'heardStore', advocate:'heardAdvocate', friend:'heardFriend', social:'heardSocial', other:'heardOther' };

type Screen = 'first'|'setup'|'phrase'|'confirmPhrase'|'lock'|'reset'|'home'|'folder'|'add'|'detail'|'pdf'|'backup'|'restore'|'settings'|'plus'|'custom'|'heard'|'changeCode'|'renew'|'erase';
const blankDraft = (folder: string): Draft => ({ folder, checklist:null, kind:'note', title:'', note:'', happenedOn:null, filename:null, mime:null, bytes:null, tags:[] });
// First-launch picker: each choice in its own language.
const CONTINUE: Labels = { en: 'Continue in English ›', es: 'Continuar en español ›', zh: '继续使用简体中文 ›', ko: '한국어로 계속하기 ›' };
export default function App() {
  const palette = usePalette();
  const [lang, setLang] = useState<Lang>(phoneLang(getLocales()[0]));
  // The phone's own word for its biometric unlock fills {bio} in every line (finding 15).
  const [bio, setBio] = useState<BioKind>(bioKind(Platform.OS, []));
  const tl = copy(lang), t = (key: StringKey, values: Record<string, string|number> = {}) => tl(key, { bio: tl(BIO_NAME[bio]), ...values });
  const [screen, setScreen] = useState<Screen>('first');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [backupFailed, setBackupFailed] = useState(false);
  const [vault, setVault] = useState<Vault>(); const vaultRef = useRef<Vault | undefined>(undefined);
  const [, refresh] = useState(0);
  const [code, setCode] = useState(''), [codeAgain, setCodeAgain] = useState(''), [biometric, setBiometric] = useState(false);
  const [words, setWords] = useState(''), [wordInput, setWordInput] = useState('');
  const [folder, setFolder] = useState(DEFAULT_ADD_FOLDER), [itemId, setItemId] = useState('');
  const [draft, setDraft] = useState<Draft>(blankDraft(DEFAULT_ADD_FOLDER));
  const [dateInput, setDateInput] = useState(''), [timeInput, setTimeInput] = useState(''), [unknown, setUnknown] = useState(false), [editing, setEditing] = useState(false);
  const [dateError, setDateError] = useState(''), [tagInput, setTagInput] = useState('');
  // Several photos picked at once (finding 5); a replacement file while changing an item (finding 7).
  const [picked, setPicked] = useState<Picked[]>([]), [replacement, setReplacement] = useState<Replacement|null>(null);
  const [query, setQuery] = useState(''), [tagPick, setTagPick] = useState<string|null>(null);
  const [withHistory, setWithHistory] = useState(false), [backupShared, setBackupShared] = useState(false);
  const [wordsMode, setWordsMode] = useState<'setup'|'renew'>('setup'), [currentCode, setCurrentCode] = useState('');
  const [viewUri, setViewUri] = useState<string|null>(null), [zoom, setZoom] = useState(false);
  // What the app is doing while busy, said in words (sim review finding 9), and the Plus prices' state.
  const [busyLabel, setBusyLabel] = useState<StringKey>('working');
  const [productsState, setProductsState] = useState<'loading'|'ready'|'failed'|'missing'>('loading');
  const autoBio = useRef(false), biometricRef = useRef(false); biometricRef.current = biometric;
  const [confirm, setConfirm] = useState<'edit'|'remove'|null>(null), [newFolder, setNewFolder] = useState('');
  const [lineOpen, setLineOpen] = useState(false), [newLine, setNewLine] = useState('');
  // After a photo import: offer to remove the original from Photos (src/core/original.ts).
  const [removePref, setRemovePref] = useState<RemovePref>(DEFAULT_REMOVE_PREF);
  const [offer, setOffer] = useState<{ assetIds: string[]; itemIds: string[] }|null>(null);
  const [restoreData, setRestoreData] = useState<string|null>(null);
  // Preview only: the 123456 hint shows only while the sample vault is the one on screen, never after her own passcode.
  const [sample, setSample] = useState(false);
  const [checkData, setCheckData] = useState<string|null>(null);
  // "How did you hear about us?": kept on this phone (src/core/heard.ts); heardFrom = where Skip/Done returns.
  const [heard, setHeard] = useState<HeardAnswer|null>(null), [heardFrom, setHeardFrom] = useState<'home'|'settings'|'folder'>('home');
  const resume = useRef<Screen>('home'); const screenRef = useRef<Screen>(screen); screenRef.current = screen;
  const [ent, setEnt] = useState<Entitlement>(free), [products, setProducts] = useState<Product[]>([]);
  // Where Plus's Back / Not now returns: Home, or the half-filled add screen its locked Tags row opened it from.
  const [plusBack, setPlusBack] = useState<'home'|'add'>('home');
  const [selection, setSelection] = useState(false), [selected, setSelected] = useState<string[]>([]);
  const [from, setFrom] = useState(''), [to, setTo] = useState(''), [cover, setCover] = useState('');
  const busyRef = useRef(false), sharing = useRef(false), mounted = useRef(true);
  const billing = purchases();
  const acceptVault = (v: Vault) => {
    if (!mounted.current || AppState.currentState !== 'active') { v.lock(); return; }
    vaultRef.current = v; setVault(v); setCode(''); setCodeAgain(''); setCurrentCode(''); setWordInput(''); setWords(''); autoBio.current = false; setScreen(resume.current);
  };
  function lock() {
    resume.current = ['home','folder','add','detail','pdf','backup','restore','settings','plus','custom','heard'].includes(screenRef.current) ? screenRef.current : 'home';
    setViewUri(null);
    vaultRef.current?.lock(); vaultRef.current = undefined; setVault(undefined); setScreen('lock');
    setCode(''); setCodeAgain(''); setCurrentCode(''); setWordInput(''); setWords(''); setError(''); setNotice(''); setConfirm(null); setOffer(null); setPicked([]); setReplacement(null);
    if (!sharing.current) void device.cleanTemps().catch(() => {});
  }
  useEffect(() => {
    mounted.current = true;
    void device.bioTypes().then(types => { if (mounted.current) setBio(bioKind(Platform.OS, types)); });
    // The install check first: on a new install it clears what an earlier install left in the Keychain, so the
    // language, the Photos setting and the "how did you hear" answer are read only after that.
    // A new install has nothing to open: the first screen shows at once and the clean-up runs behind it
    // (device.startup; anything it would clear is written only after it finishes). Sim retest: 8s of "Opening your papers…".
    const start = device.startup();
    if (start.fresh) { setScreen('first'); setReady(true); }
    void start.done.then(async exists => {
      void device.langChoice.read().then(l => { if (l && mounted.current) setLang(l); }).catch(() => {});
      void readRemovePref(device.removePrefStore).then(p => { if (mounted.current) setRemovePref(p); });
      void readHeard(device.heardStore).then(h => { if (mounted.current) setHeard(h); }).catch(() => {});
      if (!start.fresh) setScreen(exists ? 'lock':'first');
      if (exists) setBiometric((await device.locks.read()).biometrics);
    }).catch(e => setError(t((e as Error).message in strings ? (e as Error).message as StringKey : 'error'))).finally(() => setReady(true));
    if (!PREVIEW_BUILD) void ScreenCapture.preventScreenCaptureAsync().catch(() => setError(t('error')));
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1).catch(() => setError(t('error')));
    const listener = AppState.addEventListener('change', state => {
      // Lock when the app leaves the screen. iOS 'inactive' is the Face ID prompt, a file picker or the
      // app switcher (whose preview is hidden); locking there would throw people out mid-task.
      if (state === 'background' && vaultRef.current) lock();
      if (state === 'active') tryBioRef.current();
    });
    return () => { mounted.current = false; listener.remove(); vaultRef.current?.lock(); };
  }, []);
  // Face ID / Touch ID / fingerprint starts by itself when the lock screen shows (finding 20), once per
  // lock; cancelling it leaves the passcode and the button.
  function tryBio() {
    if (screenRef.current !== 'lock' || !biometricRef.current || autoBio.current || busyRef.current || AppState.currentState !== 'active') return;
    autoBio.current = true;
    void device.unlockBiometric(t('useBio')).then(acceptVault).catch(() => {});
  }
  const tryBioRef = useRef(tryBio); tryBioRef.current = tryBio;
  useEffect(() => { tryBio(); }, [screen, biometric]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void device.langChoice.read().then(l => setLang(l ?? phoneLang(getLocales()[0]))).catch(() => {});
        void billing.entitlement().then(setEnt).catch(() => {});
      }
    }); return () => listener.remove();
  }, [billing]);
  useEffect(() => { void billing.entitlement().then(setEnt).catch(() => {}); }, [billing]);
  async function run(job: () => Promise<void>, label: StringKey = 'working') {
    if (busyRef.current) return;
    busyRef.current = true; setBusyLabel(label); setBusy(true); setError(''); setNotice('');
    try { await job(); refresh(n => n+1); }
    catch (e) {
      const key = (e as Error).message;
      if (key === 'ITEM_LIMIT' || key === 'PLUS_REQUIRED') navigate('plus');
      // A refused passcode or recovery phrase says how long to wait, in seconds or minutes (finding 10).
      else if (e instanceof LockError && e.seconds > 0) setError(`${e.seconds > 120 ? t('waitMinutes', { n: Math.ceil(e.seconds / 60) }) : t('waitSeconds', { n: e.seconds })}`);
      else if (!(e as { userCancelled?: boolean }).userCancelled) setError(t(key in strings ? key as StringKey : key === 'REVENUECAT_KEY_MISSING' ? 'mock' : 'error'));
    } finally { busyRef.current = false; setBusy(false); }
  }
  const doRun = (job: () => Promise<void>, label?: StringKey) => () => { void run(job, label); };
  function chooseLang(l: Lang) { setLang(l); void device.langChoice.write(l).catch(() => setError(copy(l)('error'))); }
  // Plus prices: "Getting the prices…" while they load; when the store cannot be reached, say so with
  // a Try again button instead of a general error (sim review finding 1).
  function loadProducts() {
    setProductsState('loading');
    // "Couldn't reach" only for a real network or StoreKit error; prices that came back but did not match say so.
    void billing.products().then(p => { setProducts(p); setProductsState('ready'); })
      .catch(e => { setProducts([]); setProductsState((e as Error).message === 'STORE_PRODUCTS_MISSING' ? 'missing' : 'failed'); });
  }
  useEffect(() => { if (screen === 'plus') loadProducts(); }, [screen, billing]);
  const storeName = Platform.OS === 'android' ? 'Google Play' : 'App Store';
  function navigate(next: Screen) { setError(''); setNotice(''); setConfirm(null); setOffer(null); setLineOpen(false); setNewLine(''); setScreen(next);

  }
  function back() {
    if (screen === 'phrase' || screen === 'confirmPhrase') { setWords(''); setWordInput(''); navigate(wordsMode === 'renew' ? 'settings' : 'setup'); }
    else if (screen === 'changeCode' || screen === 'renew' || screen === 'erase') navigate('settings');
    else if (screen === 'setup') navigate('first');
    else if (screen === 'reset') navigate('lock');
    else if (screen === 'add' || screen === 'detail' || screen === 'pdf') navigate('folder');
    else if (screen === 'restore') navigate(vault ? 'backup' : 'first');
    else if (screen === 'heard') navigate(heardFrom);
    else if (screen === 'plus' && plusBack === 'add') { setPlusBack('home'); navigate('add'); }
    else navigate('home');
  }
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => {
    if (!['home','first','lock'].includes(screen)) { back(); return true; } return false;
  }); return () => sub.remove(); }, [screen, vault]);
  const state = vault?.snapshot();
  const folderName = (id: string) => {
    const f = appFolders.find(x => x.id === id);
    return f ? f.display_name[lang] : state?.folders.find(x => x.id === id)?.title ?? '';
  };
  const title = folderName(folder);
  const lines = state ? folderLines(state, folder, lang) : [];
  const folderItems = state?.items.filter(i => i.folder === folder).sort(newestFirst) ?? [];
  const item = state?.items.find(i => i.id === itemId);
  const displayDate = (d: string | null) => d ? new Date(d).toLocaleString(LOCALE[lang]) : t('unknown');
  const displayDay = (d: string | null) => d ? showHappened(d, LOCALE[lang]) : t('unknown');
  // Typing a date or time unticks "I'm not sure of the date" (finding 3); a clash is refused inline, never dropped.
  const typedDate = (set: (v: string) => void) => (v: string) => { set(v); setDateError(''); if (v.trim()) setUnknown(false); };
  // The date opens the number pad and the slashes go in by themselves (finding 3; Field puts them in the box when she
  // leaves it, so fast typing never loses a digit); an empty date is "not sure".
  const dateFields = <><Field label={t('when')} placeholder={t('dateFormat')} value={dateInput} keyboard="date" onChange={typedDate(setDateInput)} />
    <Button quiet title={t('today')} onPress={() => { const d = new Date(); typedDate(setDateInput)(`${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`); }} />
    <Field label={t('timeLabel')} placeholder={t('timeFormat')} value={timeInput} onChange={typedDate(setTimeInput)} />
    <Button quiet checked={unknown} title={`${unknown ? '✓':'○'} ${t('unknownCheck')}`} onPress={() => { setUnknown(v => !v); setDateError(''); }} />
    {!!dateError && <Card tone="gold"><P>{dateError}</P></Card>}</>;
  // Shown again right above Save, so a refused date is never 750pt away from the button that was tapped.
  const dateErrorBySave = !!dateError && <Card tone="gold"><P>{dateError}</P></Card>;
  const nudge = state ? backupNudge(state, backupShared) : 'none';
  // Lists show only folders that are not hidden (finding 16); the one being added to always shows.
  const shownFolders = state ? [...appFolders.map(f => ({ id:f.id })), ...state.folders].filter(f => !state.hidden.includes(f.id) || f.id === draft.folder) : [];
  function addTo(id: string, kind: Draft['kind'] = 'note') {
    if (!state || !mayAdd(state.items.length, ent.plus)) { navigate('plus'); return; }
    setFolder(id); setDraft({ ...blankDraft(id), kind }); setPicked([]); setReplacement(null); setDateInput(''); setTimeInput(''); setDateError(''); setTagInput('');
    setUnknown(false); setEditing(false); navigate('add');
  }
  function startEdit(i: Item) {
    setDraft({ folder:i.folder, checklist:i.checklist, kind:i.kind, title:i.title, note:i.note, happenedOn:i.happenedOn,
      filename:i.filename, mime:i.mime, bytes:i.bytes, tags:i.tags });
    setDateInput(i.happenedOn ? inputDate(i.happenedOn) : ''); setTimeInput(i.happenedOn ? inputTime(i.happenedOn) : ''); setDateError('');
    setTagInput(i.tags.join(', ')); setPicked([]); setReplacement(null);
    setUnknown(false); setEditing(true); navigate('add');
  }
  async function saveDraft() {
    if (!vault) return;
    const several = !editing && picked.length > 1;
    if (draft.kind === 'note' && !draft.title.trim()) throw Error('noteNameRequired');
    if ((!several && !draft.title.trim()) || (draft.kind !== 'note' && !draft.bytes)) throw Error('fileRequired');
    let happenedOn: string | null;
    try { happenedOn = resolveHappened({ date:dateInput, time:timeInput, unknown }); }
    catch (e) { setDateError(t((e as Error).message as StringKey)); return; }
    const tags = parseTags(tagInput), first = vault.snapshot().items.length === 0;
    let savedIds: string[] = [];
    if (editing) await vault.edit(itemId, { title:draft.title.trim(), note:draft.note, happenedOn, checklist:draft.checklist, tags,
      folder:draft.folder, file:replacement ?? undefined }, true, ent.plus);
    else {
      const base = { ...draft, title:draft.title.trim(), happenedOn, tags, takenOn: picked[0]?.takenOn ?? null };
      const drafts = several ? picked.map((p, n) => ({ ...base, filename:p.filename, mime:p.mime, bytes:p.bytes, takenOn:p.takenOn ?? null,
        title: base.title ? `${base.title} (${n+1})` : p.takenOn ? t('photoTaken', { date:showHappened(p.takenOn, LOCALE[lang]) }) : p.filename })) : [base];
      savedIds = await vault.addMany(drafts, ent.plus);
    }
    const assetIds = picked.map(p => p.assetId).filter((a): a is string => !!a); setPicked([]); setReplacement(null);
    const ask = savedIds.length > 0 && assetIds.length === savedIds.length && assetIds.every(assetId => shouldOffer({ pref:removePref, kind:draft.kind, assetId, editing, systemConfirm:photos.systemConfirm }));
    if (vaultRef.current !== vault) return;
    setFolder(draft.folder); setDraft(blankDraft(draft.folder)); navigate('folder');
    if (ask) setOffer({ assetIds, itemIds:savedIds });
    // "How did you hear about KeepMyProof?" comes after the first save, not before it (finding 18).
    else if (first && heard === null) { setHeardFrom('folder'); navigate('heard'); }
  }
  async function pick(replace: boolean) {
    const got = await files.pickAttachment(draft.kind === 'photo', draft.kind === 'photo' && !replace); if (!got?.length) return;
    if (replace) { const { filename, mime, bytes } = got[0]; setReplacement({ filename, mime, bytes }); setDraft(d => ({ ...d, filename, mime, bytes })); return; }
    setPicked(got); const { filename, mime, bytes } = got[0];
    setDraft(d => ({ ...d, filename, mime, bytes, title: got.length > 1 ? d.title : d.title || filename }));
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
    <Card><P>{t('firstFree')}</P><P muted>{t('five', { n: appFolders.length })}</P></Card>
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
    <P muted>{t('wrongGuesses')}</P></>;
  else if (screen === 'phrase') body = <>{wordsMode === 'setup' && <P muted>{t('step3')}</P>}<P heading>{t('recovery')}</P><P>{t('loss')}</P><P>{t('writeWords')}</P>
    {/* Numbered 1 to 12 in two columns, read down then across like a list on paper (finding 5). */}
    <Card><View style={[styles.row,{ gap:16 }]}>{[0, 6].map(start => <View key={start} style={[styles.flex,{ gap:6 }]}>
      {words.split(' ').slice(start, start + 6).map((w, n) => <Text key={n} {...textProps(lang)} style={{ color:palette.fg, fontSize:17, lineHeight:24, fontFamily:bodyFont(lang, true) }}>
        <Text style={{ color:palette.muted, fontSize:13, fontFamily:bodyFont(lang) }}>{start + n + 1}.  </Text>{w}</Text>)}</View>)}</View></Card>
    <Button quiet title={t('copyWords')} onPress={() => void Share.share({ message: words.split(' ').map((w, n) => `${n + 1}. ${w}`).join('\n') }).catch(() => {})} />
    <P muted>{t('copyWordsHint')}</P>
    {btn('wroteWords', () => navigate('confirmPhrase'), false, true)}</>;
  else if (screen === 'confirmPhrase') body = <>{wordsMode === 'setup' && <P muted>{t('step4')}</P>}<P heading>{t('confirmWords')}</P><Field label={t('words')} value={wordInput} onChange={setWordInput} multiline />
    {btn('finish', doRun(async () => {
      if (!equal(b64(recoveryKey(words)), b64(recoveryKey(wordInput)))) throw Error('RECOVERY_INVALID');
      if (wordsMode === 'renew') {
        // New recovery words (finding 9): saved only after they are typed back; older backups need the old words.
        if (!vault) throw Error('LOCKED');
        await device.renewRecovery(currentCode, words); await vault.forgetBackup();
        setWords(''); setWordInput(''); setCurrentCode(''); setWordsMode('setup'); navigate('backup'); setNotice(t('wordsRenewed')); return;
      }
      resume.current = 'home'; setHeardFrom('home'); acceptVault(await device.setup(code, words, biometric));
    }), false, true)}</>;
  else if (screen === 'lock') body = <><P muted>KeepMyProof</P><P heading>{t('lockVault')}</P><P>{t('locked')}</P><Field label={t('passcode')} value={code} onChange={setCode} numeric secret />
    {btn('unlock', doRun(async () => acceptVault(await device.unlock(code)), 'workingCheck'), false, true)}
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
    {nudge !== 'none' && <Card tone="gold"><P>{t(nudge === 'check' ? 'checkNow' : 'newBackup', { n:state.items.length })}</P>{btn(nudge === 'check' ? 'backupCheck' : 'backUp', () => navigate('backup'))}</Card>}
    {renewalDue(ent) && <Card tone="gold"><P>{t('renewal', { date:displayDate(ent.renewsOn) })}</P></Card>}
    {state.items.length > 0 && <><Field label={t('search')} value={query} onChange={setQuery} />
      {!!query.trim() && (() => { const found = searchItems(state.items, query).sort(newestFirst);
        return found.length ? found.map(i => <Card key={i.id}><P>{i.title}</P><P muted>{folderName(i.folder)} · {t('happened')}: {displayDay(i.happenedOn)}</P>
          {btn('open', () => { setFolder(i.folder); setItemId(i.id); setViewUri(null); navigate('detail'); })}</Card>) : <P muted>{t('searchNone')}</P>; })()}</>}
    <BigButton glyph="camera" title={t('addPhotos')} sub={t('addPhotosSub')} go={t('addGo')} disabled={busy} onPress={() => addTo(DEFAULT_ADD_FOLDER, 'photo')} />
    <P section>{t('canKeep')}</P>
    {/* Each tile starts an add of that kind, asking which folder (finding 12). */}
    <View style={styles.tiles}>{([['page','keepLetters','file'],['phone','keepTexts','photo'],['receipt','keepBills','photo'],['camera','keepPhotos','photo'],['calendar','keepNotes','note'],['medical','keepSchool','file']] as [GlyphName, StringKey, Draft['kind']][])
      .map(([g,key,kind]) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={t(key)} disabled={busy} onPress={() => addTo(DEFAULT_ADD_FOLDER, kind)}
        style={({ pressed }) => [styles.tile,{ backgroundColor:palette.tile, opacity: pressed ? .7 : 1 }]}><Glyph name={g} bg={palette.tile} /><Text {...textProps(lang)} style={{ color:palette.fg, fontSize:12, lineHeight:16, textAlign:'center', fontFamily:bodyFont(lang) }}>{t(key)}</Text></Pressable>)}</View>
    <P section>{t('home')}</P>
    {homeButtons(state).map(b => b.kind === 'folder'
      ? <BigButton key={b.id} glyph={b.own ? 'folder' : folderGlyph[b.id] ?? 'folder'} title={folderName(b.id)} go={t('open')} disabled={busy}
          sub={b.done || b.items ? [b.done && t(b.done === 1 ? 'ticked1':'tickedN', { n:b.done }), b.items && t(b.items === 1 ? 'items1':'itemsN', { n:b.items })].filter(Boolean).join(' · ') : t('nothingYet')}
          onPress={() => { setFolder(b.id); setTagPick(null); navigate('folder'); }} />
      : <BigButton key="makeOwn" glyph="plus" dashed title={t('makeOwn')} tag={t('plusTag')} sub={t('makeOwnSub')} go={t('open')} disabled={busy}
          onPress={() => navigate(ent.plus ? 'custom' : 'plus')} />)}
    {btn('add', () => addTo(DEFAULT_ADD_FOLDER), false, true)}
    <P muted>{state.backup ? t('lastBackup',{ date:displayDate(state.backup.checkedOn) }):t('noBackup')}</P><P muted>{t('hideHint')}</P></>;
  else if (screen === 'folder') body = <>{offer && <Card><P heading>{t('removeAsk')}</P><P muted>{t('removeWhy')}</P>
      {btn('keepInPhotos', () => { setOffer(null); setNotice(t('keptNotice')); })}
      {btn('removeFromPhotos', doRun(async () => {
        const o = offer; setOffer(null);
        const items = vault.snapshot().items;
        const result = await removeOriginals(o.assetIds, o.itemIds.map(id => items.find(i => i.id === id)), photos.deleteFromPhotos);
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
    <P heading>{t('newest')}</P>
    {allTags(folderItems).length > 0 && <><P muted>{t('tagFilter')}</P><View style={[styles.row,{ flexWrap:'wrap' }]}>{[null, ...allTags(folderItems)].map(g =>
      <Button quiet key={g ?? ''} checked={tagPick === g} title={`${tagPick === g ? '✓ ':''}${g ?? t('allItems')}`} onPress={() => setTagPick(g)} />)}</View></>}
    {folderItems.length ? searchItems(folderItems, '', folderItems.some(i => tagPick !== null && i.tags.includes(tagPick)) ? tagPick : null).map(i => <Card key={i.id}>
      <View style={[styles.row,{ alignItems:'center', gap:12 }]}>{isPicture(i) && <Image source={{ uri:`data:${i.mime};base64,${i.bytes}` }} style={{ width:56, height:56, borderRadius:8 }} resizeMode="cover" accessibilityIgnoresInvertColors />}
        <View style={[styles.flex,{ gap:4 }]}><P>{i.title}</P><P muted>{t('happened')}: {displayDay(i.happenedOn)}</P>
          {i.tags.length > 0 && <P muted>{t('tagsShown')}: {i.tags.join(', ')}</P>}</View></View>
      {btn('open', () => { setItemId(i.id); setViewUri(null); navigate('detail'); })}</Card>) : <P muted>{t('empty')}</P>}
    {btn('folderPdf', () => { setSelection(false); setCover(''); setSelected(folderItems.map(i => i.id)); setWithHistory(false); navigate('pdf'); })}<P muted>{t(folder === 'va-disability-papers' ? 'vaDisclaimer':'folderFoot')}</P>{btn('add', () => addTo(folder), false, true)}</>;
  else if (screen === 'add') body = <><P heading>{editing ? t('edit'):t('addTo',{ folder:title })}</P>
    {/* Which folder: asked on every add and change, starting from the neutral one (findings 1, 7). */}
    <P section>{t('whichFolder')}</P>
    {shownFolders.map(f => <Button quiet key={f.id} checked={draft.folder === f.id} title={`${draft.folder === f.id ? '✓':'○'} ${folderName(f.id)}`} onPress={() => { setFolder(f.id); setDraft(d => ({...d,folder:f.id,checklist:null})); }} />)}
    {!editing && <View style={styles.row}>{(['photo','file','note'] as const).map(kind => <View key={kind} style={styles.flex}><Button title={t(kind)} checked={draft.kind===kind} onPress={() => { setPicked([]); setDraft(d => ({...d,kind,bytes:null,filename:null,mime:null})); }} /></View>)}</View>}
    {draft.kind !== 'note' && <>{!editing && btn(draft.kind === 'photo' ? 'pickPhoto':'pick', doRun(() => pick(false), draft.kind === 'photo' ? 'workingPhotos' : 'workingFile'))}
      {editing && btn('replaceFile', doRun(() => pick(true), draft.kind === 'photo' ? 'workingPhotos' : 'workingFile'))}{editing && replacement && <P muted>{t('replaceKept')}</P>}
      {draft.kind === 'photo' && !editing && <P muted>{t(vaultCopy.photo)}</P>}
      {picked.length > 1 ? <Card><P>{t('photosChosen', { n:picked.length })}</P></Card> : draft.filename && <Card><P>{draft.filename}</P><P muted>{t('kept')}</P></Card>}</>}
    <Field label={t(picked.length > 1 ? 'namesFromPhotos' : 'name')} value={draft.title} onChange={title => setDraft(d => ({...d,title}))} />{dateFields}
    <P muted>{t('line')}</P><Button quiet title={`${draft.checklist === null ? '✓':'○'} ${t('noLine')}`} onPress={() => setDraft(d => ({...d,checklist:null}))} />
    {lines.map(c => <Button quiet key={c.id} title={`${draft.checklist===c.id ? '✓':'○'} ${c.name}`} onPress={() => setDraft(d => ({...d,checklist:c.id}))} />)}
    <Field label={t('optionalNote')} value={draft.note} onChange={note => setDraft(d => ({...d,note}))} multiline />
    {ent.plus ? <Field label={t('tags')} value={tagInput} onChange={setTagInput} />
      : <Button quiet title={t('tagsLocked')} onPress={() => { setPlusBack('add'); navigate('plus'); }} disabled={busy} />}
    <P muted>{t('addingDate')}</P>
    {btn('cancel', () => { setDraft(blankDraft(folder)); setPicked([]); setReplacement(null); navigate(editing ? 'detail' : 'folder'); },true)}</>;
  else if (screen === 'detail' && item) body = <><P muted>{title}</P><P heading>{item.title}</P><Card>
    <P>{t('happened')}: {displayDay(item.happenedOn)} {item.happenedOn ? t('yourDate'):''}</P><P>{t('saved')}: {displayDate(item.savedOn)}</P>
    <P>{t('changed')}: {item.changedOn ? displayDate(item.changedOn):t('never')}</P></Card>
    {isPicture(item) && <><Pressable accessibilityRole="imagebutton" accessibilityLabel={`${item.title}. ${t('photoZoom')}`} onPress={() => setZoom(true)}>
      <Image source={{ uri:`data:${item.mime};base64,${item.bytes}` }} style={{width:'100%',height:240}} resizeMode="contain" /></Pressable><P muted>{t('photoZoom')}</P>
      {/* Full screen, pinch to zoom (iOS scroll view zoom), ✕ Close (finding 8). */}
      <Modal visible={zoom} animationType="fade" onRequestClose={() => setZoom(false)} supportedOrientations={['portrait','landscape']}>
        <SafeAreaView style={{ flex:1, backgroundColor:'#000' }}>
          <ZoomPhoto uri={`data:${item.mime};base64,${item.bytes}`} label={item.title} />
          <View style={{ padding:16 }}><Button title={t('closeView')} onPress={() => setZoom(false)} /></View>
        </SafeAreaView></Modal></>}
    {/* Saved documents open inside the app (finding 14). */}
    {item.bytes && item.kind === 'file' && !item.mime?.startsWith('image/') && (viewUri
      ? <FileView uri={viewUri} mime={item.mime} filename={item.filename} labels={{ openPdf:t('open'), cannotShow:t('cannotShow') }} />
      : <Button title={`${t('open')} ${item.filename ?? ''}`} onPress={doRun(async () => setViewUri(await files.viewFile(item)), 'workingFile')} disabled={busy} />)}
    {item.tags.length > 0 && <P muted>{t('tagsShown')}: {item.tags.join(', ')}</P>}
    {item.note.trim() ? <><P heading>{t('yourNote')}</P><Card><P>{item.note}</P></Card></> : <Button quiet title={t('addNote')} onPress={() => startEdit(item)} disabled={busy} />}<P muted>{t('dateHonesty')}</P>
    {item.history.map((r,n) => { const next = item.history[n+1] ?? item;
      return <Card key={n}><P>{t('earlier')} · {displayDate(r.changedOn)}</P><P>{r.title}</P><P>{r.note}</P><P muted>{t('happened')}: {displayDay(r.happenedOn)}</P>
        {r.folder !== undefined && r.folder !== next.folder && <P muted>{t('wasIn', { folder:folderName(r.folder) })}</P>}
        {r.sha256 !== undefined && r.sha256 !== next.sha256 && r.filename && <P muted>{t('wasFile', { name:r.filename })}</P>}</Card>; })}
    {btn('edit', () => startEdit(item))}{btn('folderPdf', () => {setSelection(false);setSelected(folderItems.map(i => i.id));setWithHistory(false);navigate('pdf');})}
    {item.bytes && btn('saveOriginals', doRun(async () => share(() => files.shareOriginals([item]))))}
    {confirm === 'remove' ? <Card><P>{t('confirmRemove')}</P>{btn('yesRemove', doRun(async () => { await vault.remove(item.id,true); if(vaultRef.current === vault)navigate('folder'); }))}{btn('keep', () => setConfirm(null),true)}</Card> : btn('remove', () => setConfirm('remove'),true)}</>;
  else if (screen === 'pdf') body = <><P heading>{t('pdfTitle',{folder:title})}</P><P>{t('pdfIntro',{n:folderItems.length})}</P>
    {/* Anyone can leave items out; earlier versions stay out unless switched on (finding 6). */}
    <P muted>{t('pdfPick')}</P>
    <Card>{folderItems.map(i => <Pressable key={i.id} accessibilityRole="checkbox" accessibilityState={{ checked:selected.includes(i.id) }} accessibilityLabel={i.title}
      onPress={() => setSelected(v => v.includes(i.id)?v.filter(id=>id!==i.id):[...v,i.id])}>
      <P>{selected.includes(i.id) ? '✓':'○'} {i.title}</P><P muted>{t('happened')}: {displayDay(i.happenedOn)} · {t('saved')}: {displayDate(i.savedOn)}</P></Pressable>)}</Card>
    <Card><P>{t('includeHistory')}</P><Switch accessibilityLabel={t('includeHistory')} value={withHistory} onValueChange={setWithHistory} /></Card>
    <P muted>{t('pdfWarning')}</P><P muted>{t('unsupportedPdf')}</P>
    {ent.plus && <><Button title={`${selection?'✓':'○'} ${t('chosen')}`} onPress={() => setSelection(!selection)} />
      {selection && <><Field label={t('from')} placeholder={t('dateFormat')} value={from} keyboard="date" onChange={setFrom} /><Field label={t('to')} placeholder={t('dateFormat')} value={to} keyboard="date" onChange={setTo} /><Field label={t('cover')} value={cover} onChange={setCover} multiline /></>}</>}
    {btn('savePdf', doRun(async () => {
      if (!selected.length) throw Error('NOTHING_CHOSEN');
      const items = vault.items(folder, { ids:selected, from:selection && from ? dateBoundary(from,false):undefined, to:selection && to ? dateBoundary(to,true):undefined }, ent.plus);
      await share(() => files.sharePdf(items,{title,madeOn:new Date().toISOString(),lang,cover:selection ? cover:undefined,history:withHistory}));
    }, 'workingPdf'), false, true)}{btn('saveOriginals', doRun(async () => share(() => files.shareOriginals(vault.items(folder, { ids:selected }, ent.plus)))))}
    <P muted>{t('plusPdf')}</P>{btn('seePlus', () => navigate('plus'),true)}</>;
  else if (screen === 'backup') body = <><P heading>{t('backup')}</P>
    <Card tone={state.backup ? 'ok':undefined}><P>{state.backup ? t('lastBackup',{date:displayDate(state.backup.checkedOn)}):t('noBackup')}</P></Card>
    {nudge !== 'none' && <Card tone="gold"><P>{t(nudge === 'check' ? 'checkNow' : 'newBackup',{n:state.items.length})}</P></Card>}<P>{t('backupDestination')}</P>
    {btn('backUp', doRun(async () => { const data = vault.backup(await device.backupKey());
      await share(() => files.shareBytes(data, backupName(new Date()), 'application/octet-stream')); setBackupShared(true); }), false, nudge !== 'check')}
    <P muted>{t('backupCheckHint')}</P>{btn('backupCheck', doRun(async () => {
      try { if (checkData) { await vault.checkBackup(checkData,await device.backupKey());setCheckData(null);setBackupFailed(false);setBackupShared(false);setNotice(t('backupDone')); } else setCheckData(await files.pickBackup()); }
      catch(e) { setBackupFailed(true);throw e; }
    }), false, nudge === 'check')}
    <Card><P>{t('recovery')}</P><P muted>{t('confirmed')}</P>{btn('renewWords', () => { setCurrentCode(''); navigate('renew'); })}</Card><P heading>{t('newPhone')}</P><P>{t('restoreHint')}</P><P muted>{t('loss')}</P>
    {btn('restore', () => {setRestoreData(null);setWordInput('');navigate('restore');})}<P muted>{t('restoreSafety')}</P></>;
  else if (screen === 'settings') body = <><P heading>{t('settings')}</P><P muted>{t('noAnalytics')}</P>
    <Card><P>{t('language')}</P>{LANGS.map(l => <Button quiet key={l} checked={lang === l} title={`${lang === l ? '✓':'○'} ${LANG_NAME[l]}`} onPress={() => chooseLang(l)} />)}</Card>
    <P section>{t('vaultSection')}</P>
    {photos.systemConfirm ? removeSwitch : <Card><P>{t('androidOriginal')}</P><P muted>{t('androidOriginalHow')}</P></Card>}
    <Card><P>{t('biometrics')}</P><Switch accessibilityLabel={t('biometrics')} value={biometric} onValueChange={v => void run(async () => { await device.setBiometrics(v,t('useBio'));setBiometric(v); })} /></Card>
    {btn('changeCode', () => { setCurrentCode(''); setCode(''); setCodeAgain(''); navigate('changeCode'); })}
    {btn('renewWords', () => { setCurrentCode(''); navigate('renew'); })}
    {[...appFolders, ...state.folders].map(f => <Card key={f.id}><P>{folderName(f.id)}</P><Button quiet title={t(state.hidden.includes(f.id)?'show':'hide')} onPress={doRun(async () => vault.hide(f.id,!state.hidden.includes(f.id)))} /></Card>)}
    <Card><P>{t('heardSettings')}</P><P muted>{heard && heard !== 'skip' ? t(HEARD_KEY[heard]) : t('heardNone')}</P>
      <Button quiet title={t('heardChange')} onPress={() => { setHeardFrom('settings'); navigate('heard'); }} disabled={busy} /></Card>
    {btn('ownFolder', () => ent.plus ? navigate('custom'):navigate('plus'))}{btn('seePlus', () => navigate('plus'))}
    {btn('restorePurchases', doRun(async () => { const next=await billing.restore();setEnt(next);setNotice(t(next.plus?'restoredPurchases':'noPurchase')); }))}
    {ent.managementURL && <Button title={t('manage')} onPress={() => void Linking.openURL(ent.managementURL!)} />}{legal}
    <Button quiet title={t('disclaimer')} onPress={() => void Linking.openURL(disclaimerUrl)} />{btn('lockNow', lock,true)}
    {btn('eraseOpen', () => { setCurrentCode(''); navigate('erase'); }, true)}</>;
  else if (screen === 'changeCode') body = <><P heading>{t('changeCode').replace(/\s*›$/, '')}</P>
    <Field label={t('currentCode')} value={currentCode} onChange={setCurrentCode} numeric secret />
    <Field label={t('newCode')} value={code} onChange={setCode} numeric secret /><Field label={t('confirmCode')} value={codeAgain} onChange={setCodeAgain} numeric secret />
    {btn('saveCode', doRun(async () => {
      if (!/^\d{6}$/.test(code) || code !== codeAgain) throw Error('PASSCODE_INVALID');
      await device.changePasscode(currentCode, code); setCurrentCode(''); setCode(''); setCodeAgain(''); navigate('settings'); setNotice(t('codeChanged'));
    }), false, true)}<P muted>{t('wrongGuesses')}</P></>;
  else if (screen === 'renew') body = <><P heading>{t('renewWords').replace(/\s*›$/, '')}</P><P>{t('renewWhy')}</P>
    <Field label={t('renewCode')} value={currentCode} onChange={setCurrentCode} numeric secret />
    {btn('continue', doRun(async () => {
      await device.appLock.unlock(currentCode); setWordsMode('renew'); setWordInput(''); setWords(phrase(device.random)); navigate('phrase');
    }), false, true)}</>;
  else if (screen === 'erase') body = <><P heading>{t('eraseTitle')}</P><Card tone="red"><P>{t('eraseWarn')}</P></Card>
    <Field label={t('eraseCode')} value={currentCode} onChange={setCurrentCode} numeric secret />
    {btn('eraseNow', doRun(async () => {
      await device.eraseAll(currentCode);
      vaultRef.current?.lock(); vaultRef.current = undefined; setVault(undefined); setCurrentCode(''); setBiometric(false); setHeard(null); setSample(false);
      setRemovePref(DEFAULT_REMOVE_PREF); setBackupShared(false); resume.current = 'home'; navigate('first'); setNotice(t('erased'));
    }))}{btn('cancel', () => navigate('settings'), true)}</>;
  else if (screen === 'heard') body = <><P heading>{t('heardTitle')}</P><P muted>{t('heardOptional')}</P>
    <Card>{HEARD.map(h => <Button quiet key={h} checked={heard === h} title={`${heard === h ? '✓':'○'} ${t(HEARD_KEY[h])}`}
      onPress={doRun(async () => { await saveHeard(device.heardStore, h); setHeard(h); })} />)}</Card>
    {heard && heard !== 'skip' && btn('heardSend', doRun(async () => {
      if (!(await sendHeard(heard, Linking))) setNotice(t('heardNoMail'));
    }))}
    {heard && heard !== 'skip' ? btn('heardDone', () => navigate(heardFrom), true)
      // Skip is instant: the answer is written to the Keychain after the screen has moved on.
      : btn('heardSkip', () => { setHeard('skip'); navigate(heardFrom); void saveHeard(device.heardStore, 'skip').catch(() => {}); }, true)}</>;
  else if (screen === 'custom') body = <><P heading>{t('custom')}</P><Field label={t('folderName')} value={newFolder} onChange={setNewFolder} />
    {btn('createFolder',doRun(async () => { const id = await vault.addFolder(newFolder.trim(),ent.plus);setFolder(id);setNewFolder('');navigate('folder'); }), false, true)}</>;
  else if (screen === 'plus') body = <><P heading>{t(state.items.length >= FREE_LIMIT ? 'limitTitle':'plusTitle')}</P><P>{t('keepsFree')}</P><P>{t('plusLets')}</P>
    <Card><P>{t('unlimited')}</P></Card><Card><P>{t('custom')}</P></Card><Card><P>{t('selectedPdf')}</P></Card>
    {billing.mode === 'mock' && <Card tone="gold"><P>{t('mock')}</P></Card>}
    {productsState === 'loading' && <P muted>{t('storeLoading', { store: storeName })}</P>}
    {productsState === 'missing' && <Card tone="gold"><P>{t('storeMissing', { store: storeName })}</P><Button title={t('retry')} onPress={loadProducts} disabled={busy} /></Card>}
    {productsState === 'failed' && <Card tone="gold"><P>{t('storeFailed', { store: storeName })}</P><Button title={t('retry')} onPress={loadProducts} disabled={busy} /></Card>}
    {products.map(p => { const launch=activeLaunch(p);const price=launch?.price ?? p.price;
      return <Card key={p.id}><P heading>{launch ? t('launch',{price,normal:launch.normalPrice}):t(p.plan==='lifetime'?'lifetimePrice':'annualPrice',{price})}</P>
        <P muted>{t(p.plan==='lifetime'?'lifetimeTerms':'annualTerms')}</P><Button title={t(p.plan==='lifetime'?'buyLifetime':'buyAnnual',{price})} disabled={busy||billing.mode==='mock'||ent.plus}
          onPress={doRun(async () => {setEnt(await billing.purchase(p.id));back();})} />{legal}</Card>;
    })}{btn('notNow', back,true)}<P muted>{t('storeConfirm')}</P>
    {btn('restorePurchases',doRun(async () => {const next=await billing.restore();setEnt(next);setNotice(t(next.plus?'restoredPurchases':'noPurchase'));}))}{legal}</>;
  else body = <P>{t('empty')}</P>;
  // The screen's main button stays in view at the bottom (finding 7: "Save passcode" was below the fold;
  // finding 3: a refused date showed far above Save).
  let footer: React.ReactNode = null;
  if (ready && screen === 'setup') footer = btn('saveCode', doRun(async () => {
    if (!/^\d{6}$/.test(code) || code !== codeAgain) throw Error('PASSCODE_INVALID');
    if (biometric && !(await device.biometricCheck(t('useBio')))) throw Error('BIOMETRIC_FAILED');
    setWordsMode('setup'); setWords(phrase(device.random)); navigate('phrase');
  }), false, true);
  else if (ready && screen === 'add' && vault) footer = <>{!!error && <Card tone="gold"><P>{error}</P></Card>}{dateErrorBySave}{busy && <P muted>{t(busyLabel)}</P>}
    {confirm === 'edit' ? <Card><P>{t('confirmEdit')}</P>{btn('yesSave', doRun(saveDraft, 'workingSave'))}{btn('keep', () => setConfirm(null),true)}</Card> :
      <Button primary title={editing ? t('saveChanges'):t('saveTo',{folder:title})} disabled={busy} onPress={editing ? () => setConfirm('edit'):doRun(saveDraft, 'workingSave')} />}</>;
  return <Theme.Provider value={palette}><LangContext.Provider value={lang}><SafeAreaView style={[styles.container,{backgroundColor:palette.bg}]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView key={screen} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {ready && !['first','home','lock','heard'].includes(screen) && <Button quiet title={['folder','backup','settings','custom'].includes(screen) || (screen === 'plus' && plusBack !== 'add')?t('backHome'):['add','detail','pdf'].includes(screen)&&title?t('backTo',{folder:title}):t('back')} onPress={back} disabled={busy} />}
      {!!error && screen !== 'add' && <Card tone="gold"><P>{error}</P></Card>}{backupFailed && <Card tone="red"><P>{t('backupFailed')}</P></Card>}
      {!!notice && <Card tone="ok"><P>{notice}</P></Card>}{busy && screen !== 'add' && <P muted>{t(busyLabel)}</P>}{body}
    </ScrollView>
    {footer && <View style={[styles.footer,{ backgroundColor:palette.bg, borderTopColor:palette.line }]}>{footer}</View>}
    </KeyboardAvoidingView>
    {vault && ['home','backup','settings'].includes(screen) && <View style={[styles.tabs,{backgroundColor:palette.card}]}>
      {(['home','backup','settings'] as const).map(tab => <View key={tab} style={styles.flex}><Button quiet checked={screen===tab} title={t(tab==='home'?'folders':tab)} onPress={() => navigate(tab)} disabled={busy} /></View>)}
    </View>}
  </SafeAreaView></LangContext.Provider></Theme.Provider>;
}

/** Full-screen photo: exactly the space left on screen, the picture contain-fit and centred in it, pinch to
 *  zoom (iOS scroll view zoom). A '100%' width with aspectRatio 1 made a 794pt square on a 402pt phone (sim retest). */
function ZoomPhoto({ uri, label }: { uri: string; label: string }) {
  const win = useWindowDimensions();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const size = area ?? { width: win.width, height: win.height * .7 };
  return <View style={{ flex:1 }} onLayout={e => { const { width, height } = e.nativeEvent.layout; if (width > 0 && height > 0) setArea({ width, height }); }}>
    <ScrollView style={{ flex:1 }} maximumZoomScale={5} minimumZoomScale={1} centerContent bouncesZoom
      showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ width:size.width, height:size.height, alignItems:'center', justifyContent:'center' }}>
      <Image source={{ uri }} style={{ width:size.width, height:size.height }} resizeMode="contain" accessibilityLabel={label} />
    </ScrollView></View>;
}
/** A saved photo or picture file that can be drawn in place. */
const isPicture = (i: Item) => !!i.bytes && (i.kind === 'photo' || !!i.mime?.startsWith('image/'));
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
