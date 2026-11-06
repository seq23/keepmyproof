// Landing pages (owner, 6 Nov 2026): the six pages the search decision lists
// (https://claude.ai/artifact/9BrXsLTbTThSmzA6zNvSkZ, section 4), the /vault hub, and the photo-vault
// landing pages (section 7, angles A and B: "a private vault for photos and documents"). EN + ES, like the
// guides; the /vault hub also in Chinese and Korean, because the homes in those languages link to it.
// Same shape as the guides (site/guides.mjs): answer first (40–60 words), question headings, steps or a
// table where they fit, FAQ, sources, the store block. Never a legal outcome, never a claim that the app is
// hidden from the phone or beats forensic recovery; the build's banned-word check reads every page.
import { SRC, src } from './guides.mjs';

const CORNELL = (sec) => ({ en: `https://www.law.cornell.edu/cfr/text/34/${sec}`, es: `https://www.law.cornell.edu/cfr/text/34/${sec}` });
const same = (u) => ({ en: u, es: u });
const S = {
  iepDef: src('34 CFR 300.320: Definition of individualized education program (Cornell LII)', CORNELL('300.320')),
  iepReview: src('34 CFR 300.324: Development, review, and revision of IEP (Cornell LII)', CORNELL('300.324')),
  iepParents: src('34 CFR 300.322: Parent participation (Cornell LII)', CORNELL('300.322')),
  iepEval: src('34 CFR 300.301: Initial evaluations (Cornell LII)', CORNELL('300.301')),
  iepReeval: src('34 CFR 300.303: Reevaluations (Cornell LII)', CORNELL('300.303')),
  ptic: src('Center for Parent Information and Resources: Find your Parent Center', same('https://www.parentcenterhub.org/find-your-center/')),
  iepMeet: src('Center for Parent Information and Resources: Meetings of the IEP team', same('https://www.parentcenterhub.org/meetings/')),
  caCustody: src('California Courts Self-Help Guide: Child custody', same('https://selfhelp.courts.ca.gov/child-custody')),
  css: src('U.S. Office of Child Support Services: Information for parents', same('https://www.acf.hhs.gov/css/parents')),
  irs452: src('IRS Topic 452: Alimony and separate maintenance', same('https://www.irs.gov/taxtopics/tc452')),
  w2w: src('CDC: Where to write for vital records', same('https://www.cdc.gov/nchs/w2w/index.htm')),
  irs1041: src('IRS: Filing the estate income tax return, Form 1041', same('https://www.irs.gov/individuals/deceased-taxpayers-filing-the-estate-income-tax-return-form-1041')),
  cfpbDebt: src('CFPB: What happens to my debts when I die?', same('https://www.consumerfinance.gov/ask-cfpb/what-happens-to-my-debts-when-i-die-en-2049/')),
  fre901: src('Federal Rule of Evidence 901: Authenticating or identifying evidence (Cornell LII)', same('https://www.law.cornell.edu/rules/fre/rule_901')),
  fre1002: src('Federal Rule of Evidence 1002: Requirement of the original (Cornell LII)', same('https://www.law.cornell.edu/rules/fre/rule_1002')),
  appleHide: src('Apple: Hide photos with the Hidden album', SRC.APPLE_HIDE),
  appleDeleted: src('Apple: If you are missing photos or videos in the Photos app', SRC.APPLE_MISSING),
  appleLock: src('Apple: Lock or hide an app on iPhone', SRC.APPLE_LOCK_APP),
  gLocked: src('Google Photos Help: Hide sensitive photos and videos in Locked Folders (Android)', SRC.G_LOCKED),
  gDelete: src('Google Photos Help: Delete photos and videos (Android)', SRC.G_DELETE),
  gSafe: src('Files by Google Help: Protect your files with Safe folder', SRC.G_SAFE),
};

/** What every vault page says KeepMyProof does, so no page says more than the app does. */
const APP = {
  en: 'KeepMyProof keeps photos, screenshots, files and notes in folders, encrypted on your phone and opened with a six-digit passcode, plus Face ID or a fingerprint if you turn it on. It locks when you leave it and hides its preview in the app switcher. It is a normal app on your home screen, not a disguised one.',
  es: 'KeepMyProof guarda fotos, capturas, archivos y notas en carpetas, cifrados en su teléfono y abiertos con un código de seis dígitos, y con Face ID o huella si lo activa. Se bloquea cuando sale de la app y oculta su vista previa al cambiar de app. Es una app normal en su pantalla de inicio, no una app disfrazada.',
};
const IPHONE = {
  en: 'On iPhone, after you add a photo from your library, KeepMyProof asks "Remove the original from Photos?". Keep it in Photos is the first choice; if you tap Remove, your iPhone asks you to confirm, and the photo stays in Recently Deleted for 30 days. On Android, delete the original in Google Photos yourself.',
  es: 'En iPhone, después de agregar una foto de su fototeca, KeepMyProof pregunta "¿Quitar el original de Fotos?". Dejarla en Fotos es la primera opción; si toca Quitar, su iPhone le pide confirmar, y la foto queda en Eliminado recientemente durante 30 días. En Android, borre usted el original en Google Fotos.',
};
export const LIMITS = {
  en: ['Anyone who knows your passcode can open the app, so use one only you know.', 'The app shows on your home screen like any app; it is not hidden from the phone.', 'Deleting a photo is not a guarantee that no copy is left anywhere: backups, shared albums and other devices can keep copies.'],
  es: ['Quien sepa su código puede abrir la app, así que use uno que solo usted conozca.', 'La app se ve en su pantalla de inicio como cualquier app; no está oculta del teléfono.', 'Borrar una foto no garantiza que no quede ninguna copia: las copias de seguridad, los álbumes compartidos y otros dispositivos pueden guardarlas.'],
};

/** The /vault hub: the page every vault page links up to. */
export const VAULT_HUB = {
  path: { en: '/vault', es: '/es/boveda', zh: '/zh/vault', ko: '/ko/vault' },
  en: {
    title: 'Private vault for photos and documents | KeepMyProof', h1: 'A private vault for photos and documents',
    desc: 'A private vault for photos, screenshots, texts, letters and scans, locked behind a passcode or Face ID, in dated folders and out of your camera roll.',
    answer: 'KeepMyProof is a private vault for papers, not just pictures: photos, screenshots, texts, letters and scans, locked behind a passcode or Face ID and kept out of your camera roll. Photo vaults hide pictures. KeepMyProof keeps the photos and the papers you need to keep, in dated folders, so you can find them and share one PDF later.',
    howH: 'How does the vault work?', how: ['Add a photo, screenshot, file or note to a folder (divorce, workplace, VA, executor or IEP, or your own).', 'Write the date it happened; the app adds the date you saved it, side by side.', 'On iPhone, choose whether to remove the original from Photos. On Android, delete it in Google Photos yourself.', 'Open the vault with your passcode, Face ID or fingerprint. It locks again when you leave.', 'When someone asks, turn a folder into one PDF with an index, or export the originals.'],
    diffH: 'How is it different from a photo vault?', diff: 'A photo vault hides pictures; this vault keeps records in order.',
    table: { head: ['', 'Photo vault app', 'KeepMyProof'], rows: [['Photos and screenshots', 'Yes', 'Yes'], ['Files, letters, scans and notes', 'Varies by app', 'Yes'], ['Folders with a checklist for one life event', 'No', 'Yes, five folders'], ['Date it happened next to date saved', 'No', 'Yes'], ['One PDF of a folder', 'No', 'Yes'], ['Disguised as another app', 'Often', 'No: a normal, locked app']] },
    limitsH: 'What the vault does not do', pagesH: 'Vault guides and pages', iphone: IPHONE.en,
    faq: [
      ['Is KeepMyProof a photo vault?', 'Yes, and more: it locks photos and screenshots like a photo vault, and it also keeps letters, scans, files and notes in folders with checklists. Each item has the date it happened next to the date you saved it, and a folder becomes one PDF when a lawyer, a school or a VA representative asks for it.'],
      ['Does it take photos out of my camera roll?', 'On iPhone, after you add a photo, it offers to remove the original from Photos; nothing is removed unless you tap Remove and your iPhone confirms, and the photo stays in Recently Deleted for 30 days. On Android, the app keeps its own copy, and you delete the original in Google Photos yourself.'],
      ['Is the vault free?', 'Yes, for your first 25 items. Adding stops at 25 on the free plan, but viewing, PDFs, export, backup and restore never lock. KeepMyProof Plus adds unlimited items, your own folders and tags, and PDFs of chosen items or dates. The app is coming soon to the App Store and Google Play.'],
    ],
  },
  es: {
    title: 'Bóveda privada para fotos y documentos | KeepMyProof', h1: 'Una bóveda privada para fotos y documentos',
    desc: 'Una bóveda privada para fotos, capturas, mensajes, cartas y escaneos, protegida con código o Face ID, en carpetas con fecha y fuera de su carrete.',
    answer: 'KeepMyProof es una bóveda privada para papeles, no solo para fotos: fotos, capturas, mensajes, cartas y escaneos, protegidos con un código o Face ID y fuera de su carrete. Las bóvedas de fotos ocultan fotos. KeepMyProof guarda las fotos y los papeles que necesita conservar, en carpetas con fecha, para encontrarlos y compartir un PDF después.',
    howH: '¿Cómo funciona la bóveda?', how: ['Agregue una foto, captura, archivo o nota a una carpeta (divorcio, trabajo, VA, albacea o IEP, o una suya).', 'Escriba la fecha en que pasó; la app agrega la fecha en que lo guardó, una junto a la otra.', 'En iPhone, elija si quita el original de Fotos. En Android, bórrelo usted en Google Fotos.', 'Abra la bóveda con su código, Face ID o huella. Se vuelve a bloquear cuando sale.', 'Cuando alguien se lo pida, convierta una carpeta en un PDF con índice, o exporte los originales.'],
    diffH: '¿En qué se diferencia de una bóveda de fotos?', diff: 'Una bóveda de fotos oculta fotos; esta bóveda mantiene los registros en orden.',
    table: { head: ['', 'App de bóveda de fotos', 'KeepMyProof'], rows: [['Fotos y capturas', 'Sí', 'Sí'], ['Archivos, cartas, escaneos y notas', 'Depende de la app', 'Sí'], ['Carpetas con lista para un momento de la vida', 'No', 'Sí, cinco carpetas'], ['Fecha en que pasó junto a la fecha de guardado', 'No', 'Sí'], ['Un PDF de una carpeta', 'No', 'Sí'], ['Disfrazada como otra app', 'A menudo', 'No: una app normal y bloqueada']] },
    limitsH: 'Lo que la bóveda no hace', pagesH: 'Guías y páginas de la bóveda', iphone: IPHONE.es,
    faq: [
      ['¿KeepMyProof es una bóveda de fotos?', 'Sí, y más: bloquea fotos y capturas como una bóveda de fotos, y además guarda cartas, escaneos, archivos y notas en carpetas con listas. Cada documento tiene la fecha en que pasó junto a la fecha en que lo guardó, y una carpeta se convierte en un PDF cuando un abogado, la escuela o un representante del VA lo pide.'],
      ['¿Saca las fotos de mi carrete?', 'En iPhone, después de agregar una foto, le ofrece quitar el original de Fotos; no se quita nada a menos que toque Quitar y su iPhone lo confirme, y la foto queda en Eliminado recientemente durante 30 días. En Android, la app guarda su propia copia y usted borra el original en Google Fotos.'],
      ['¿La bóveda es gratis?', 'Sí, para sus primeros 25 documentos. En el plan gratis ya no puede agregar más al llegar a 25, pero ver, hacer PDF, exportar, respaldar y restaurar nunca se bloquean. KeepMyProof Plus agrega documentos ilimitados, carpetas y etiquetas propias, y PDF de documentos o fechas elegidos. La app llega muy pronto al App Store y Google Play.'],
    ],
  },
  zh: {
    title: '照片和文件的私密保险箱 | KeepMyProof 私密文件手机应用', h1: '照片和文件的私密保险箱',
    desc: 'KeepMyProof 是照片和文件的私密保险箱：照片、截图、短信、信件和扫描件用密码或 Face ID 锁住，按日期放进文件夹，不留在相册里。即将登陆 App Store 和 Google Play。',
    answer: 'KeepMyProof 是保存文件而不只是照片的私密保险箱：照片、截图、短信、信件和扫描件都用密码或 Face ID 锁住，不留在相册里。普通的照片保险箱只是把照片藏起来；KeepMyProof 把您需要保留的照片和文件按日期放进文件夹，方便以后查找，并可导出成一个 PDF。',
    howH: '保险箱怎么用？', how: ['把照片、截图、文件或笔记加入一个文件夹（离婚、职场、VA、遗产执行或 IEP，或您自己的文件夹）。', '写下事情发生的日期；应用会在旁边记下您保存的日期。', '在 iPhone 上，可以选择是否从“照片”中删除原件。在 Android 上，请您自己在 Google 相册中删除原件。', '用密码、Face ID 或指纹打开保险箱。离开应用后会再次锁住。', '有人需要时，把一个文件夹做成带目录的 PDF，或导出原件。'],
    diffH: '它和照片保险箱有什么不同？', diff: '照片保险箱只藏照片；这个保险箱把记录整理好。',
    table: { head: ['', '照片保险箱应用', 'KeepMyProof'], rows: [['照片和截图', '是', '是'], ['文件、信件、扫描件和笔记', '因应用而异', '是'], ['为某件人生大事准备的带清单文件夹', '否', '是，五个文件夹'], ['发生日期和保存日期并列', '否', '是'], ['一个文件夹导出成一个 PDF', '否', '是'], ['伪装成其他应用', '常见', '否：普通的、上锁的应用']] },
    limitsH: '保险箱不做什么', pagesH: '保险箱指南（英文）',
    iphone: '仅限 iPhone：从图库添加照片后，应用会问“要从照片中删除原件吗？”。默认选项是保留在照片中；如果您点“删除”，iPhone 会要求您确认，照片会在“最近删除”中保留 30 天。在 Android 上，请您自己在 Google 相册中删除原件。',
    limits: ['知道您密码的人可以打开应用，所以请使用只有您知道的密码。', '应用像普通应用一样显示在主屏幕上，并没有对手机隐藏。', '删除照片并不保证任何地方都没有副本：备份、共享相簿和其他设备可能仍有副本。'],
    faq: [
      ['KeepMyProof 是照片保险箱吗？', '是的，而且不只是照片保险箱。它像照片保险箱一样锁住照片和截图，同时把信件、扫描件、文件和笔记放进带清单的文件夹。每一项都记下事情发生的日期和您保存的日期。律师、学校或 VA 代表需要时，一个文件夹可以导出成一个 PDF。'],
      ['它会把照片从相册里拿走吗？', '在 iPhone 上，添加照片后应用会提出从“照片”中删除原件；只有您点“删除”并在 iPhone 上确认后才会删除，照片会在“最近删除”中保留 30 天。在 Android 上，应用保存自己的副本，原件需要您自己在 Google 相册中删除。'],
      ['保险箱免费吗？', '前 25 项免费。免费版到 25 项后不能再添加，但查看、导出 PDF、导出原件、备份和恢复永远不会锁住。KeepMyProof Plus 提供无限项目、自定义文件夹和标签，以及按所选项目或日期导出 PDF。应用即将登陆 App Store 和 Google Play。'],
    ],
  },
  ko: {
    title: '사진과 문서를 위한 비공개 보관함 | KeepMyProof 비공개 서류 앱', h1: '사진과 문서를 위한 비공개 보관함',
    desc: 'KeepMyProof는 사진과 문서를 위한 비공개 보관함입니다. 사진, 스크린샷, 문자, 편지, 스캔본을 암호나 Face ID로 잠그고 날짜별 폴더에 보관하며 카메라 롤 밖에 둡니다. App Store와 Google Play 출시 예정입니다.',
    answer: 'KeepMyProof는 사진만이 아니라 서류를 위한 비공개 보관함입니다. 사진, 스크린샷, 문자, 편지, 스캔본을 암호나 Face ID로 잠그고 카메라 롤 밖에 보관합니다. 사진 보관함은 사진을 숨길 뿐입니다. KeepMyProof는 보관해야 할 사진과 서류를 날짜별 폴더에 정리해 나중에 찾고 PDF 하나로 공유할 수 있게 합니다.',
    howH: '보관함은 어떻게 작동하나요?', how: ['사진, 스크린샷, 파일 또는 메모를 폴더(이혼, 직장, VA, 유언 집행, IEP 또는 직접 만든 폴더)에 추가합니다.', '일이 일어난 날짜를 적으면 앱이 저장한 날짜를 옆에 기록합니다.', 'iPhone에서는 사진 앱의 원본을 지울지 선택합니다. Android에서는 Google 포토에서 직접 원본을 지웁니다.', '암호, Face ID 또는 지문으로 보관함을 엽니다. 앱을 나가면 다시 잠깁니다.', '누군가 요청하면 폴더를 목차가 있는 PDF 하나로 만들거나 원본을 내보냅니다.'],
    diffH: '사진 보관함과 무엇이 다른가요?', diff: '사진 보관함은 사진을 숨기고, 이 보관함은 기록을 정리합니다.',
    table: { head: ['', '사진 보관함 앱', 'KeepMyProof'], rows: [['사진과 스크린샷', '예', '예'], ['파일, 편지, 스캔본, 메모', '앱마다 다름', '예'], ['인생의 한 사건을 위한 체크리스트 폴더', '아니요', '예, 다섯 개 폴더'], ['일어난 날짜와 저장한 날짜를 나란히', '아니요', '예'], ['폴더 하나를 PDF 하나로', '아니요', '예'], ['다른 앱으로 위장', '흔함', '아니요: 평범한 잠금 앱']] },
    limitsH: '보관함이 하지 않는 일', pagesH: '보관함 가이드(영어)',
    iphone: 'iPhone 전용: 사진 보관함에서 사진을 추가하면 앱이 "사진 앱에서 원본을 삭제할까요?"라고 묻습니다. 기본 선택은 사진 앱에 그대로 두기입니다. 삭제를 누르면 iPhone이 확인을 요청하고, 사진은 최근 삭제된 항목에 30일 동안 남습니다. Android에서는 Google 포토에서 직접 원본을 삭제하세요.',
    limits: ['암호를 아는 사람은 앱을 열 수 있으니 본인만 아는 암호를 쓰세요.', '앱은 다른 앱처럼 홈 화면에 보이며 휴대폰에서 숨겨지지 않습니다.', '사진을 삭제해도 어디에도 사본이 남지 않는다는 보장은 없습니다. 백업, 공유 앨범, 다른 기기에 사본이 있을 수 있습니다.'],
    faq: [
      ['KeepMyProof는 사진 보관함인가요?', '네, 그 이상입니다. 사진 보관함처럼 사진과 스크린샷을 잠그고, 편지, 스캔본, 파일, 메모도 체크리스트가 있는 폴더에 보관합니다. 항목마다 일어난 날짜와 저장한 날짜가 나란히 있고, 변호사나 학교, VA 대리인이 요청하면 폴더를 PDF 하나로 만들 수 있습니다.'],
      ['카메라 롤에서 사진을 빼 주나요?', 'iPhone에서는 사진을 추가한 뒤 사진 앱의 원본 삭제를 제안합니다. 삭제를 누르고 iPhone에서 확인해야만 삭제되며, 사진은 최근 삭제된 항목에 30일 동안 남습니다. Android에서는 앱이 자체 사본을 보관하고, 원본은 Google 포토에서 직접 삭제해야 합니다.'],
      ['보관함은 무료인가요?', '처음 25개 항목까지 무료입니다. 무료 요금제는 25개에서 추가가 멈추지만 보기, PDF, 내보내기, 백업, 복원은 절대 잠기지 않습니다. KeepMyProof Plus는 무제한 항목, 직접 만드는 폴더와 태그, 선택한 항목이나 날짜의 PDF를 제공합니다. App Store와 Google Play 출시 예정입니다.'],
    ],
  },
};

/**
 * Landing pages. kind: 'vault' (links up to /vault) or a folder key (divorce, iep, executor) whose hub,
 * printable and checklist PDF it links. path: { en, es }.
 */
export const LANDINGS = [
  // ---------- photo-vault landing pages (section 7) ----------
  {
    id: 'private-photo-vault-app', kind: 'vault', path: { en: '/private-photo-vault-app', es: '/es/app-boveda-privada-de-fotos' },
    sources: [S.appleHide, S.gLocked, S.appleDeleted],
    en: {
      title: 'Private photo vault app for photos and documents | KeepMyProof',
      desc: 'A private photo vault app that keeps photos, screenshots and documents locked on your phone, in dated folders, with no account and no ads.',
      h1: 'A private photo vault app for photos and documents',
      answer: 'A private photo vault app keeps pictures locked behind a passcode or Face ID so they are not in your camera roll. KeepMyProof is a private vault for photos and documents: it locks photos and screenshots too, and also keeps letters, scans and notes in dated folders with checklists, encrypted on your phone, with no account and no ads.',
      bestFor: 'someone looking for a photo vault who also has screenshots, letters or scans to keep in order.',
      sections: [
        { h: 'What does a private photo vault app do?', a: 'It moves pictures behind a lock, so they stop showing in the main Photos grid.', list: ['Locks with a passcode, Face ID or a fingerprint.', 'Keeps its own copy of each picture inside the app.', 'Often offers a way to remove the original from the camera roll.'] },
        { h: 'What does KeepMyProof add?', a: 'Folders, dates and one PDF, for the photos and papers that matter later.', list: [APP.en, 'Five folders with suggested checklists: divorce prep, workplace, VA claim papers, after a parent dies, and an IEP binder.', 'The date something happened next to the date you saved it.'] },
        { h: 'Can it take photos out of my camera roll?', a: 'On iPhone it offers to; on Android you delete the original yourself.', list: [IPHONE.en] },
        { h: 'What does it not do?', a: 'It is a locked app, not an invisible one.', list: LIMITS.en },
      ],
      faq: [
        ['Is KeepMyProof a photo vault app?', 'Yes. It locks photos and screenshots behind a passcode, Face ID or fingerprint, like a photo vault. It also keeps letters, scans, files and notes, sorted into folders with checklists and two dates on every item, and turns a folder into one PDF. It is coming soon to the App Store and Google Play.'],
        ['Does a photo vault app keep my photos off the cloud?', 'KeepMyProof keeps what you add encrypted on your phone and never uploads it. Its backup is an encrypted file you save to your own cloud drive. The original photo in your library is a separate copy: if iCloud Photos or Google Photos backs it up, delete it there too.'],
        ['Is a photo vault app free?', 'KeepMyProof is free for your first 25 items, and viewing, PDFs, export, backup and restore never lock. KeepMyProof Plus adds unlimited items, your own folders and tags, and PDFs of chosen items or dates, for a yearly price or once for life. There are no ads and no account.'],
      ],
    },
    es: {
      title: 'App de bóveda privada de fotos y documentos | KeepMyProof',
      desc: 'Una app de bóveda privada de fotos que guarda fotos, capturas y documentos bloqueados en su teléfono, en carpetas con fecha, sin cuenta ni anuncios.',
      h1: 'Una app de bóveda privada para fotos y documentos',
      answer: 'Una app de bóveda privada de fotos guarda las fotos bloqueadas con un código o Face ID para que no estén en su carrete. KeepMyProof es una bóveda privada para fotos y documentos: también bloquea fotos y capturas, y además guarda cartas, escaneos y notas en carpetas con fecha y listas, cifrados en su teléfono, sin cuenta ni anuncios.',
      bestFor: 'quien busca una bóveda de fotos y además tiene capturas, cartas o escaneos que necesita tener en orden.',
      sections: [
        { h: '¿Qué hace una app de bóveda privada de fotos?', a: 'Pone las fotos detrás de un bloqueo, para que dejen de verse en Fotos.', list: ['Se bloquea con un código, Face ID o huella.', 'Guarda su propia copia de cada foto dentro de la app.', 'A menudo ofrece quitar el original del carrete.'] },
        { h: '¿Qué agrega KeepMyProof?', a: 'Carpetas, fechas y un PDF, para las fotos y los papeles que importan después.', list: [APP.es, 'Cinco carpetas con listas sugeridas: divorcio, trabajo, papeles del reclamo del VA, cuando muere un padre o una madre, y la carpeta del IEP.', 'La fecha en que algo pasó junto a la fecha en que lo guardó.'] },
        { h: '¿Puede sacar las fotos de mi carrete?', a: 'En iPhone se lo ofrece; en Android usted borra el original.', list: [IPHONE.es] },
        { h: '¿Qué no hace?', a: 'Es una app bloqueada, no una app invisible.', list: LIMITS.es },
      ],
      faq: [
        ['¿KeepMyProof es una app de bóveda de fotos?', 'Sí. Bloquea fotos y capturas con un código, Face ID o huella, como una bóveda de fotos. Además guarda cartas, escaneos, archivos y notas en carpetas con listas y dos fechas en cada documento, y convierte una carpeta en un PDF. Llega muy pronto al App Store y Google Play.'],
        ['¿Una bóveda de fotos mantiene mis fotos fuera de la nube?', 'KeepMyProof guarda lo que agrega cifrado en su teléfono y nunca lo sube. Su respaldo es un archivo cifrado que usted guarda en su propia nube. La foto original de su fototeca es otra copia: si Fotos de iCloud o Google Fotos la respaldan, bórrela también ahí.'],
        ['¿Una app de bóveda de fotos es gratis?', 'KeepMyProof es gratis para sus primeros 25 documentos, y ver, hacer PDF, exportar, respaldar y restaurar nunca se bloquean. KeepMyProof Plus agrega documentos ilimitados, carpetas y etiquetas propias, y PDF de documentos o fechas elegidos, por un precio anual o una sola vez. No hay anuncios ni cuenta.'],
      ],
    },
  },
  {
    id: 'hide-photos-iphone', kind: 'vault', path: { en: '/hide-photos-on-iphone', es: '/es/ocultar-fotos-en-iphone' },
    sources: [S.appleHide, S.appleDeleted, S.appleLock],
    en: {
      title: 'How to hide photos on iPhone (and documents) | KeepMyProof',
      desc: 'Hide photos on iPhone with the locked Hidden album, step by step from Apple, or keep photos and documents in a private vault with dated folders.',
      h1: 'How to hide photos on iPhone, and keep photos and documents private',
      answer: 'To hide a photo on iPhone, touch and hold it in Photos, tap Hide and confirm; it moves to the Hidden album, which Apple locks with Face ID or Touch ID on iOS 16 and later. For photos and documents you need to keep in order, KeepMyProof keeps them in a locked, dated folder instead.',
      bestFor: 'iPhone users who want a photo out of sight today, and people keeping screenshots and papers for a divorce, a job or a school.',
      sections: [
        { h: 'How do I hide a photo on iPhone?', a: 'Use Hide in the Photos app.', steps: ['Open Photos and find the photo.', 'Touch and hold it, or open it and tap the More button.', 'Tap Hide, then confirm. It moves to the Hidden album under Utilities.'] },
        { h: 'How do I lock or hide the Hidden album?', a: 'It is locked by default on iOS 16 and later; you can also turn it off in Settings.', steps: ['Open Settings, then Apps, then Photos.', 'Turn off Show Hidden Album to remove it from Photos until you turn it back on.'] },
        { h: 'When is a private vault better than the Hidden album?', a: 'When the photos are records you will need again, with documents beside them.', list: ['The Hidden album keeps photos only, next to your other pictures.', APP.en, IPHONE.en] },
        { h: 'What does hiding not do?', a: 'Hiding is not deleting.', list: ['With iCloud Photos, a hidden photo is hidden on your other devices too, not removed (Apple).', 'Anyone who can unlock the Hidden album or knows your passcode can see it.', 'Deleted photos stay in Recently Deleted for 30 days (Apple).'] },
      ],
      faq: [
        ['Is the Hidden album on iPhone locked?', 'Yes. Apple says that on iOS 16 and later the Hidden album is locked by default and opens with Face ID or Touch ID after you tap View Album. If you also turn off Show Hidden Album in Settings, the album does not appear in Photos at all until you turn it back on.'],
        ['Can I hide documents on iPhone too?', 'The Files app has no hidden folder, but Apple lets you lock the Files app with Face ID or hide it in a locked Hidden folder of the App Library. KeepMyProof keeps documents, scans and screenshots together in folders, locked behind its own passcode, Face ID or fingerprint, with the date of each.'],
        ['Does KeepMyProof delete the original photo?', 'Only if you ask. After you add a photo from your library, it asks whether to remove the original from Photos; Keep it in Photos is the first choice, and your iPhone asks you to confirm a removal. The photo then stays in Recently Deleted for 30 days, where you can still recover it.'],
      ],
    },
    es: {
      title: 'Cómo ocultar fotos en iPhone (y documentos) | KeepMyProof',
      desc: 'Oculte fotos en iPhone con el álbum Oculto bloqueado, paso a paso según Apple, o guarde fotos y documentos en una bóveda privada con carpetas con fecha.',
      h1: 'Cómo ocultar fotos en iPhone y mantener privados fotos y documentos',
      answer: 'Para ocultar una foto en iPhone, mantenga el dedo sobre ella en Fotos, toque Ocultar y confirme; pasa al álbum Oculto, que Apple bloquea con Face ID o Touch ID desde iOS 16. Para fotos y documentos que necesita tener en orden, KeepMyProof los guarda en una carpeta bloqueada y con fecha.',
      bestFor: 'quien usa iPhone y quiere sacar una foto de la vista hoy, y quien guarda capturas y papeles para un divorcio, un trabajo o la escuela.',
      sections: [
        { h: '¿Cómo oculto una foto en iPhone?', a: 'Use Ocultar en la app Fotos.', steps: ['Abra Fotos y busque la foto.', 'Mantenga el dedo sobre ella, o ábrala y toque el botón Más.', 'Toque Ocultar y confirme. Pasa al álbum Oculto, en Utilidades.'] },
        { h: '¿Cómo bloqueo u oculto el álbum Oculto?', a: 'Está bloqueado de forma predeterminada desde iOS 16; también puede desactivarlo en Ajustes.', steps: ['Abra Ajustes, luego Apps y luego Fotos.', 'Desactive Mostrar álbum Oculto para quitarlo de Fotos hasta que lo vuelva a activar.'] },
        { h: '¿Cuándo conviene una bóveda privada en vez del álbum Oculto?', a: 'Cuando las fotos son registros que va a necesitar, con documentos al lado.', list: ['El álbum Oculto solo guarda fotos, junto a sus otras fotos.', APP.es, IPHONE.es] },
        { h: '¿Qué no hace ocultar?', a: 'Ocultar no es borrar.', list: ['Con Fotos de iCloud, una foto oculta también queda oculta en sus otros dispositivos, no borrada (Apple).', 'Quien pueda desbloquear el álbum Oculto o sepa su código puede verla.', 'Las fotos borradas quedan en Eliminado recientemente durante 30 días (Apple).'] },
      ],
      faq: [
        ['¿El álbum Oculto del iPhone está bloqueado?', 'Sí. Apple dice que desde iOS 16 el álbum Oculto está bloqueado de forma predeterminada y se abre con Face ID o Touch ID después de tocar Ver álbum. Si además desactiva Mostrar álbum Oculto en Ajustes, el álbum no aparece en Fotos hasta que lo vuelva a activar.'],
        ['¿También puedo ocultar documentos en iPhone?', 'La app Archivos no tiene una carpeta oculta, pero Apple permite bloquear Archivos con Face ID u ocultarla en una carpeta Oculto bloqueada de la biblioteca de apps. KeepMyProof guarda documentos, escaneos y capturas juntos en carpetas, con su propio código, Face ID o huella, y la fecha de cada uno.'],
        ['¿KeepMyProof borra la foto original?', 'Solo si usted lo pide. Después de agregar una foto de su fototeca, pregunta si quita el original de Fotos; Dejarla en Fotos es la primera opción, y su iPhone le pide confirmar. La foto queda en Eliminado recientemente durante 30 días, donde todavía puede recuperarla.'],
      ],
    },
  },
  {
    id: 'hide-photos-android', kind: 'vault', path: { en: '/hide-photos-on-android', es: '/es/ocultar-fotos-en-android' },
    sources: [S.gLocked, S.gSafe, S.gDelete],
    en: {
      title: 'How to hide photos on Android (and documents) | KeepMyProof',
      desc: 'Hide photos on Android with Locked Folder in Google Photos, step by step from Google, or keep photos and documents in a private vault with dated folders.',
      h1: 'How to hide photos on Android, and keep photos and documents private',
      answer: 'To hide photos on Android, move them to Locked Folder in Google Photos, which opens with your screen lock; for documents, Files by Google has Safe folder. When the photos and documents are records you need to keep in order, KeepMyProof keeps them together in a locked, dated folder, encrypted on your phone.',
      bestFor: 'Android users who want photos out of the main grid, and people keeping screenshots and papers for a divorce, a job or a school.',
      sections: [
        { h: 'How do I hide a photo on Android?', a: 'Use Locked Folder in Google Photos.', steps: ['Open Google Photos and select the photo.', 'Tap More, then Move to Locked Folder (the wording can change with an update).', 'Open Locked Folder later from Collections or Utilities with your screen lock.'] },
        { h: 'How do I hide documents on Android?', a: 'Use Safe folder in Files by Google.', steps: ['Open Files by Google and find Safe folder under Collections.', 'Set a PIN or pattern for it.', 'Move the document into Safe folder.'] },
        { h: 'When is a private vault better?', a: 'When the photos and papers belong together, with dates, for someone who will ask for them.', list: ['Locked Folder holds photos and videos; Safe folder holds files. They are two separate places.', APP.en, 'On Android, KeepMyProof keeps its own copy; delete the original in Google Photos yourself.'] },
        { h: 'What does hiding not do?', a: 'Hiding is not deleting, and a lock is only as private as its code.', list: LIMITS.en },
      ],
      faq: [
        ['Where is Locked Folder in Google Photos?', 'Google Photos keeps Locked Folder in the Collections tab, under Utilities on some versions, and opens it with your phone screen lock. Google describes how to set it up and move photos into it on its Locked Folder help page, linked below. Menu names can change with an app update.'],
        ['Can I hide documents and photos in one place on Android?', 'Not with the built-in tools: Locked Folder holds photos and videos, and Safe folder in Files by Google holds files. KeepMyProof keeps photos, screenshots, documents and notes in the same folder, with the date each thing happened and the date you saved it, locked behind its own passcode.'],
        ['Does KeepMyProof remove the original photo on Android?', 'No. On Android, KeepMyProof keeps its own encrypted copy of the photo you add, and the original stays in your library until you delete it yourself in Google Photos. Google keeps deleted items in the trash for a time before they are gone, as its help page explains.'],
      ],
    },
    es: {
      title: 'Cómo ocultar fotos en Android (y documentos) | KeepMyProof',
      desc: 'Oculte fotos en Android con la Carpeta bloqueada de Google Fotos, paso a paso según Google, o guarde fotos y documentos en una bóveda privada con fecha.',
      h1: 'Cómo ocultar fotos en Android y mantener privados fotos y documentos',
      answer: 'Para ocultar fotos en Android, páselas a la Carpeta bloqueada de Google Fotos, que se abre con el bloqueo de pantalla; para documentos, Files de Google tiene la Carpeta segura. Cuando las fotos y documentos son registros que necesita tener en orden, KeepMyProof los guarda juntos en una carpeta bloqueada y con fecha, cifrada en su teléfono.',
      bestFor: 'quien usa Android y quiere sacar fotos de la vista principal, y quien guarda capturas y papeles para un divorcio, un trabajo o la escuela.',
      sections: [
        { h: '¿Cómo oculto una foto en Android?', a: 'Use la Carpeta bloqueada de Google Fotos.', steps: ['Abra Google Fotos y seleccione la foto.', 'Toque Más y luego Mover a Carpeta bloqueada (el nombre puede cambiar con una actualización).', 'Abra la Carpeta bloqueada desde Colecciones o Utilidades con su bloqueo de pantalla.'] },
        { h: '¿Cómo oculto documentos en Android?', a: 'Use la Carpeta segura de Files de Google.', steps: ['Abra Files de Google y busque Carpeta segura en Colecciones.', 'Elija un PIN o un patrón.', 'Mueva el documento a la Carpeta segura.'] },
        { h: '¿Cuándo conviene una bóveda privada?', a: 'Cuando las fotos y los papeles van juntos, con fechas, para alguien que se los va a pedir.', list: ['La Carpeta bloqueada guarda fotos y videos; la Carpeta segura guarda archivos. Son dos lugares distintos.', APP.es, 'En Android, KeepMyProof guarda su propia copia; borre usted el original en Google Fotos.'] },
        { h: '¿Qué no hace ocultar?', a: 'Ocultar no es borrar, y un bloqueo es tan privado como su código.', list: LIMITS.es },
      ],
      faq: [
        ['¿Dónde está la Carpeta bloqueada de Google Fotos?', 'Google Fotos tiene la Carpeta bloqueada en la pestaña Colecciones, en Utilidades en algunas versiones, y la abre con el bloqueo de pantalla del teléfono. Google explica cómo configurarla y pasar fotos a ella en su página de ayuda, enlazada abajo. Los nombres de los menús pueden cambiar con una actualización.'],
        ['¿Puedo ocultar documentos y fotos en un solo lugar en Android?', 'No con las herramientas del teléfono: la Carpeta bloqueada guarda fotos y videos, y la Carpeta segura de Files de Google guarda archivos. KeepMyProof guarda fotos, capturas, documentos y notas en la misma carpeta, con la fecha en que pasó cada cosa y la fecha de guardado, con su propio código.'],
        ['¿KeepMyProof quita la foto original en Android?', 'No. En Android, KeepMyProof guarda su propia copia cifrada de la foto que agrega, y el original sigue en su fototeca hasta que usted lo borre en Google Fotos. Google guarda lo borrado en la papelera por un tiempo antes de que desaparezca, como explica su página de ayuda.'],
      ],
    },
  },
  {
    id: 'secret-photo-vault', kind: 'vault', path: { en: '/secret-photo-vault', es: '/es/boveda-secreta-de-fotos' },
    sources: [S.appleHide, S.gLocked, S.appleLock],
    en: {
      title: 'Secret photo vault or photo locker: what to know | KeepMyProof',
      desc: 'What a secret photo vault or photo locker app does, what it cannot promise, and a private vault for photos and documents that is honest about it.',
      h1: 'Secret photo vault and photo locker apps: a private vault for photos and documents',
      answer: 'A secret photo vault, or photo locker, is an app that keeps pictures behind a passcode; some disguise themselves as a calculator. KeepMyProof is a private vault for photos and documents that does not disguise itself: a normal app that locks photos, screenshots, letters and notes in dated folders, encrypted on your phone.',
      bestFor: 'someone comparing photo locker apps who wants a lock they can trust and their papers in order.',
      sections: [
        { h: 'What is a photo locker app?', a: 'An app that keeps its own locked copy of your pictures.', list: ['It locks with a passcode, a pattern, Face ID or a fingerprint.', 'Some show a fake screen, such as a calculator, or a second decoy vault.', 'Most hold photos and videos only.'] },
        { h: 'Why is KeepMyProof not disguised?', a: 'Because a lock you can explain is easier to trust than an app pretending to be something else.', list: [APP.en] },
        { h: 'How do secret vaults compare with KeepMyProof?', a: 'They hide pictures; KeepMyProof keeps records in order.', table: { head: ['', 'Secret photo vault', 'KeepMyProof'], rows: [['Locks photos and screenshots', 'Yes', 'Yes'], ['Documents, letters and notes', 'Varies by app', 'Yes'], ['Disguised icon or decoy vault', 'Often', 'No'], ['Dated folders with a checklist', 'No', 'Yes'], ['One PDF of a folder', 'No', 'Yes']] } },
        { h: 'What can no vault app promise?', a: 'That nothing about your photos can ever be found.', list: LIMITS.en },
      ],
      faq: [
        ['Is a secret photo vault really secret?', 'It is locked, not invisible. Its icon, its name in settings and its storage use can still show on the phone, and anyone with your passcode can open it. KeepMyProof says so plainly: it is a normal app on your home screen, encrypted and locked, and it does not pretend to be a calculator.'],
        ['Can a photo locker hold documents?', 'Many hold photos and videos only. KeepMyProof keeps photos, screenshots, files, letters, scans and notes together, sorted into folders for a divorce, a job problem, a VA claim, an estate or an IEP, with the date each thing happened and one PDF of a folder when someone asks.'],
        ['What happens to my vault if I lose my phone?', 'KeepMyProof makes an encrypted backup you save to your own cloud drive, and a 12-word recovery phrase that only you see, once. With the phrase and the backup you can restore your vault on a new phone. Without both, nobody can open it, including us.'],
      ],
    },
    es: {
      title: 'Bóveda secreta de fotos o candado de fotos | KeepMyProof',
      desc: 'Qué hace una app de bóveda secreta o candado de fotos, qué no puede prometer, y una bóveda privada para fotos y documentos que lo dice claramente.',
      h1: 'Bóvedas secretas y candados de fotos: una bóveda privada para fotos y documentos',
      answer: 'Una bóveda secreta de fotos, o candado de fotos, es una app que guarda fotos detrás de un código; algunas se disfrazan de calculadora. KeepMyProof es una bóveda privada para fotos y documentos que no se disfraza: una app normal que bloquea fotos, capturas, cartas y notas en carpetas con fecha, cifradas en su teléfono.',
      bestFor: 'quien compara apps de candado de fotos y quiere un bloqueo confiable y sus papeles en orden.',
      sections: [
        { h: '¿Qué es una app de candado de fotos?', a: 'Una app que guarda su propia copia bloqueada de sus fotos.', list: ['Se bloquea con un código, un patrón, Face ID o huella.', 'Algunas muestran una pantalla falsa, como una calculadora, o una segunda bóveda señuelo.', 'La mayoría solo guarda fotos y videos.'] },
        { h: '¿Por qué KeepMyProof no se disfraza?', a: 'Porque es más fácil confiar en un bloqueo que se puede explicar que en una app que finge ser otra cosa.', list: [APP.es] },
        { h: '¿Cómo se comparan las bóvedas secretas con KeepMyProof?', a: 'Ellas ocultan fotos; KeepMyProof mantiene los registros en orden.', table: { head: ['', 'Bóveda secreta de fotos', 'KeepMyProof'], rows: [['Bloquea fotos y capturas', 'Sí', 'Sí'], ['Documentos, cartas y notas', 'Depende de la app', 'Sí'], ['Ícono disfrazado o bóveda señuelo', 'A menudo', 'No'], ['Carpetas con fecha y lista', 'No', 'Sí'], ['Un PDF de una carpeta', 'No', 'Sí']] } },
        { h: '¿Qué no puede prometer ninguna app de bóveda?', a: 'Que nunca se pueda encontrar nada sobre sus fotos.', list: LIMITS.es },
      ],
      faq: [
        ['¿Una bóveda secreta de fotos es realmente secreta?', 'Está bloqueada, no es invisible. Su ícono, su nombre en los ajustes y el espacio que usa se pueden ver en el teléfono, y quien tenga su código puede abrirla. KeepMyProof lo dice claramente: es una app normal en su pantalla de inicio, cifrada y bloqueada, y no finge ser una calculadora.'],
        ['¿Un candado de fotos puede guardar documentos?', 'Muchos solo guardan fotos y videos. KeepMyProof guarda fotos, capturas, archivos, cartas, escaneos y notas juntos, en carpetas para un divorcio, un problema de trabajo, un reclamo del VA, una herencia o un IEP, con la fecha en que pasó cada cosa y un PDF de la carpeta cuando alguien lo pide.'],
        ['¿Qué pasa con mi bóveda si pierdo el teléfono?', 'KeepMyProof hace un respaldo cifrado que usted guarda en su propia nube, y una frase de recuperación de 12 palabras que solo usted ve, una vez. Con la frase y el respaldo puede restaurar su bóveda en un teléfono nuevo. Sin las dos, nadie puede abrirla, ni nosotros.'],
      ],
    },
  },
  {
    id: 'hide-pictures-camera-roll', kind: 'vault', path: { en: '/hide-pictures-from-camera-roll', es: '/es/ocultar-fotos-del-carrete' },
    sources: [S.appleHide, S.appleDeleted, S.gLocked, S.gDelete],
    en: {
      title: 'How to hide pictures from your camera roll | KeepMyProof',
      desc: 'Hide pictures from your camera roll on iPhone or Android with the built-in tools, or move photos and documents into a private vault with dated folders.',
      h1: 'How to hide pictures from your camera roll',
      answer: 'To hide pictures from your camera roll, use the Hidden album on iPhone or Locked Folder in Google Photos on Android. To take photos and documents out of the camera roll and keep them in order, add them to a KeepMyProof folder; on iPhone it then offers to remove the original from Photos.',
      bestFor: 'someone with screenshots or photos of papers mixed into the camera roll who wants them out of sight and kept.',
      sections: [
        { h: 'How do I hide pictures on iPhone?', a: 'Move them to the Hidden album.', steps: ['In Photos, tap Select and choose the pictures.', 'Tap the More button, then Hide, and confirm.', 'They now show only in the locked Hidden album.'] },
        { h: 'How do I hide pictures on Android?', a: 'Move them to Locked Folder in Google Photos.', steps: ['In Google Photos, select the pictures.', 'Tap More, then Move to Locked Folder.', 'They now show only in Locked Folder, opened with your screen lock.'] },
        { h: 'How do I take them out of the camera roll for good?', a: 'Keep a copy in a vault, then delete the original.', steps: ['Add the picture to a KeepMyProof folder and write the date it happened.', 'On iPhone, tap Remove when the app asks about the original, then confirm.', 'On Android, delete the original in Google Photos yourself.', 'Empty Recently Deleted or the trash only once you are sure.'] },
        { h: 'What should I check first?', a: 'That nothing you may need is lost.', list: ['Some records also need the original message or file; ask a lawyer before deleting anything that may matter in a case.', 'Shared albums and other devices can keep their own copies.', IPHONE.en] },
      ],
      faq: [
        ['Does hiding a picture remove it from the camera roll?', 'It removes it from the main view. On iPhone a hidden picture shows only in the locked Hidden album; on Android, a picture in Locked Folder shows only there. Neither is a deleted picture: it stays on the phone, and with iCloud Photos the hidden picture is hidden on your other devices too.'],
        ['How long do deleted photos stay on iPhone?', 'Apple keeps deleted photos and videos in the Recently Deleted album for 30 days, and you can recover them there until then. After 30 days they are permanently deleted. You can also delete them from Recently Deleted sooner. KeepMyProof says this before you remove an original from Photos.'],
        ['Can I keep screenshots out of my camera roll from now on?', 'A screenshot always lands in Photos first. Add it to a KeepMyProof folder soon after you take it; on iPhone the app then offers to remove the original. Doing this in one sitting each week keeps your camera roll clear and your records in one place.'],
      ],
    },
    es: {
      title: 'Cómo ocultar fotos de su carrete | KeepMyProof',
      desc: 'Oculte fotos de su carrete en iPhone o Android con las herramientas del teléfono, o pase fotos y documentos a una bóveda privada con carpetas con fecha.',
      h1: 'Cómo ocultar fotos de su carrete',
      answer: 'Para ocultar fotos de su carrete, use el álbum Oculto en iPhone o la Carpeta bloqueada de Google Fotos en Android. Para sacar fotos y documentos del carrete y tenerlos en orden, agréguelos a una carpeta de KeepMyProof; en iPhone, la app luego le ofrece quitar el original de Fotos.',
      bestFor: 'quien tiene capturas o fotos de papeles mezcladas en el carrete y quiere sacarlas de la vista y conservarlas.',
      sections: [
        { h: '¿Cómo oculto fotos en iPhone?', a: 'Páselas al álbum Oculto.', steps: ['En Fotos, toque Seleccionar y elija las fotos.', 'Toque el botón Más, luego Ocultar, y confirme.', 'Ahora solo se ven en el álbum Oculto bloqueado.'] },
        { h: '¿Cómo oculto fotos en Android?', a: 'Páselas a la Carpeta bloqueada de Google Fotos.', steps: ['En Google Fotos, seleccione las fotos.', 'Toque Más y luego Mover a Carpeta bloqueada.', 'Ahora solo se ven en la Carpeta bloqueada, que se abre con su bloqueo de pantalla.'] },
        { h: '¿Cómo las saco del carrete para siempre?', a: 'Guarde una copia en una bóveda y luego borre el original.', steps: ['Agregue la foto a una carpeta de KeepMyProof y escriba la fecha en que pasó.', 'En iPhone, toque Quitar cuando la app pregunte por el original y confirme.', 'En Android, borre usted el original en Google Fotos.', 'Vacíe Eliminado recientemente o la papelera solo cuando esté seguro.'] },
        { h: '¿Qué debo revisar primero?', a: 'Que no pierda nada que pueda necesitar.', list: ['Algunos registros también necesitan el mensaje o archivo original; pregunte a un abogado antes de borrar algo que pueda importar en un caso.', 'Los álbumes compartidos y otros dispositivos pueden guardar sus propias copias.', IPHONE.es] },
      ],
      faq: [
        ['¿Ocultar una foto la quita del carrete?', 'La quita de la vista principal. En iPhone, una foto oculta solo se ve en el álbum Oculto bloqueado; en Android, una foto en la Carpeta bloqueada solo se ve ahí. Ninguna está borrada: sigue en el teléfono, y con Fotos de iCloud la foto oculta también queda oculta en sus otros dispositivos.'],
        ['¿Cuánto tiempo quedan las fotos borradas en iPhone?', 'Apple guarda las fotos y videos borrados en el álbum Eliminado recientemente durante 30 días, y ahí puede recuperarlos hasta entonces. Después de 30 días se borran para siempre. También puede borrarlos antes desde Eliminado recientemente. KeepMyProof lo dice antes de quitar un original de Fotos.'],
        ['¿Puedo mantener las capturas fuera del carrete de ahora en adelante?', 'Una captura siempre llega primero a Fotos. Agréguela a una carpeta de KeepMyProof poco después de tomarla; en iPhone, la app luego le ofrece quitar el original. Hacerlo de una vez cada semana mantiene su carrete limpio y sus registros en un solo lugar.'],
      ],
    },
  },
  {
    id: 'custody-screenshots-private', kind: 'vault', path: { en: '/keep-custody-screenshots-private', es: '/es/capturas-de-custodia-privadas' },
    sources: [S.appleHide, S.gLocked, S.caCustody],
    en: {
      title: 'Keep screenshots private for a custody case | KeepMyProof',
      desc: 'Keep pickup texts, schedules and screenshots private during a custody matter: out of the camera roll, in a dated folder, with photos and documents together.',
      h1: 'How to keep screenshots private for a custody case',
      answer: 'To keep custody screenshots private, take them out of the shared camera roll and into a locked place, and write down the date each thing happened. KeepMyProof is a private vault for photos and documents: pickup texts, schedules and emails go into the Divorce prep folder, encrypted on your phone, with a co-parenting log beside them.',
      bestFor: 'a parent saving pickup texts, schedule changes and emails during a divorce or custody matter, on a phone others may see.',
      sections: [
        { h: 'Why keep custody screenshots out of the camera roll?', a: 'Because a camera roll is often seen by children, partners or a shared cloud account.', list: ['Photos can sync to a shared iCloud or Google account or a family tablet.', 'Children scrolling for pictures can see a hard message.', 'A locked folder keeps them together and out of the way.'] },
        { h: 'How do I keep them private and in order?', a: 'One folder, two dates, and the original kept.', steps: ['Screenshot the whole message, including the name or number and the date shown.', 'Add it to the Divorce prep folder in KeepMyProof and write the date it happened.', 'Note what it shows in a line, such as "missed pickup, 6 pm".', 'Keep the original messages on the phone too; ask your lawyer how to keep them.', 'On iPhone, remove the screenshot from Photos when the app asks, if you want.'] },
        { h: 'What else belongs with them?', a: 'The papers a parenting plan is built on.', list: ['A co-parenting log of handoffs, visits and missed visits.', 'School and medical notes about the children.', 'The current parenting plan or order. California Courts says parenting plans must be in the best interest of the children.'] },
        { h: 'What does KeepMyProof not do?', a: 'It keeps copies; it does not judge them.', list: ['The save date records when you saved it, not that something happened.', 'It gives no legal advice and does not say how a custody matter will turn out.', 'Nothing is shared with the other parent: it is a one-person app.'] },
      ],
      faq: [
        ['Should I delete the original texts after taking screenshots?', 'Not without advice. A screenshot can leave out the sender, the time or the rest of the conversation, so many parents keep the original messages too. Ask your lawyer or a legal aid office how to keep them for your matter. This is educational only and not legal advice.'],
        ['Can the other parent see what I keep in KeepMyProof?', 'Not through the app. KeepMyProof is private to one person: there is no shared account, nothing is sent automatically, and the folder opens only with your passcode, Face ID or fingerprint. Anyone who knows your phone passcode and app passcode could open it, so use codes only you know.'],
        ['Is a custody log better than screenshots?', 'They do different jobs, and most parents keep both. Screenshots keep what was said; a custody log keeps what happened at each handoff and visit, written on the day. KeepMyProof keeps both in the Divorce prep folder, with the date each thing happened next to the date you saved it.'],
      ],
    },
    es: {
      title: 'Capturas privadas para un caso de custodia | KeepMyProof',
      desc: 'Mantenga privados los mensajes de entregas, horarios y capturas durante la custodia: fuera del carrete, en una carpeta con fecha, con fotos y documentos juntos.',
      h1: 'Cómo mantener privadas las capturas para un caso de custodia',
      answer: 'Para mantener privadas las capturas de custodia, sáquelas del carrete compartido y guárdelas en un lugar bloqueado, con la fecha en que pasó cada cosa. KeepMyProof es una bóveda privada para fotos y documentos: los mensajes de entregas, horarios y correos van a la carpeta de divorcio, cifrados en su teléfono, junto a un registro de crianza.',
      bestFor: 'quien guarda mensajes de entregas, cambios de horario y correos durante un divorcio o un asunto de custodia, en un teléfono que otros pueden ver.',
      sections: [
        { h: '¿Por qué sacar las capturas de custodia del carrete?', a: 'Porque el carrete muchas veces lo ven los niños, la pareja o una cuenta compartida en la nube.', list: ['Las fotos se pueden sincronizar con una cuenta compartida de iCloud o Google o con una tableta familiar.', 'Los niños que buscan fotos pueden ver un mensaje difícil.', 'Una carpeta bloqueada las mantiene juntas y fuera de la vista.'] },
        { h: '¿Cómo las mantengo privadas y en orden?', a: 'Una carpeta, dos fechas y el original guardado.', steps: ['Haga la captura del mensaje completo, con el nombre o número y la fecha que se ve.', 'Agréguela a la carpeta de divorcio en KeepMyProof y escriba la fecha en que pasó.', 'Anote en una línea qué muestra, por ejemplo "no recogió a los niños, 6 pm".', 'Conserve también los mensajes originales en el teléfono; pregunte a su abogado cómo guardarlos.', 'En iPhone, quite la captura de Fotos cuando la app lo pregunte, si quiere.'] },
        { h: '¿Qué más va con ellas?', a: 'Los papeles en los que se basa un plan de crianza.', list: ['Un registro de crianza de entregas, visitas y visitas perdidas.', 'Notas de la escuela y del médico sobre los niños.', 'El plan de crianza o la orden actual. Las Cortes de California dicen que los planes de crianza deben ser en el interés superior de los niños.'] },
        { h: '¿Qué no hace KeepMyProof?', a: 'Guarda copias; no las juzga.', list: ['La fecha de guardado registra cuándo lo guardó, no que algo pasó.', 'No da asesoría legal ni dice cómo terminará un asunto de custodia.', 'No se comparte nada con el otro padre: es una app para una sola persona.'] },
      ],
      faq: [
        ['¿Debo borrar los mensajes originales después de la captura?', 'No sin consejo. Una captura puede dejar fuera a quien envió, la hora o el resto de la conversación, así que muchos padres también conservan los mensajes originales. Pregunte a su abogado o a una oficina de ayuda legal cómo guardarlos para su caso. Es solo informativo, no asesoría legal.'],
        ['¿El otro padre puede ver lo que guardo en KeepMyProof?', 'No a través de la app. KeepMyProof es privada para una sola persona: no hay cuenta compartida, no se envía nada automáticamente y la carpeta solo se abre con su código, Face ID o huella. Quien sepa el código de su teléfono y el de la app podría abrirla, así que use códigos que solo usted conozca.'],
        ['¿Es mejor un registro de custodia que las capturas?', 'Cumplen funciones distintas, y la mayoría de los padres guarda las dos. Las capturas guardan lo que se dijo; un registro de custodia guarda lo que pasó en cada entrega y visita, escrito ese día. KeepMyProof guarda las dos cosas en la carpeta de divorcio, con la fecha en que pasó junto a la fecha de guardado.'],
      ],
    },
  },

  // ---------- the six pages the search decision lists (section 4) ----------
  {
    id: 'custody-log', kind: 'divorce', path: { en: '/custody-log', es: '/es/registro-de-custodia' }, printable: { en: '/tools/co-parenting-log-printable', es: '/es/herramientas/registro-de-crianza-para-imprimir' },
    sources: [S.caCustody, S.css],
    en: {
      title: 'Custody log: what to write down and how | KeepMyProof',
      desc: 'A custody log is a dated record of handoffs, visits and missed visits. What to write in it, how often, and a free printable and phone app to keep it.',
      h1: 'Custody log: what to write down, and how to keep it',
      answer: 'A custody log is a dated record a parent keeps of each handoff, visit, missed visit, schedule change and important message about the children. Write each entry on the day it happens, with the time, place and who was there, and keep it with the texts and papers it refers to.',
      bestFor: 'a parent who shares custody, or is working out a parenting plan, and wants a clear record of what happens and when.',
      sections: [
        { h: 'What goes in a custody log?', a: 'The facts of each day the parenting plan touches.', list: ['Handoffs: the date, time, place and who brought the children.', 'Visits and missed or late visits, with any reason given.', 'Schedule changes and who asked for them.', 'Children\'s school, health and activity events.', 'Important messages, with a screenshot saved beside the entry.'] },
        { h: 'How do I keep a custody log?', a: 'Short, factual entries, written the same day.', steps: ['Pick one place: a notebook, the free printable log, or a phone app.', 'Write the date and time first, then what happened, in one or two plain sentences.', 'Leave out opinions and guesses; write what you saw and heard.', 'Save related texts, emails and photos next to the entry.', 'Back it up somewhere only you can open.'] },
        { h: 'Paper log or app?', a: 'Both work; an app keeps the messages and the log together.', table: { head: ['', 'Printable log', 'KeepMyProof'], rows: [['Cost', 'Free', 'Free for 25 items'], ['Dated entries', 'Yes, by hand', 'Yes, date it happened and date saved'], ['Screenshots and emails beside entries', 'Printed separately', 'In the same folder'], ['One PDF to hand over', 'Scan it', 'Yes, with an index'], ['Private', 'Wherever you keep it', 'Encrypted on your phone, passcode or Face ID']] } },
        { h: 'What should a custody log not be?', a: 'A diary of feelings or a record of the other parent\'s private life.', list: ['Keep only what you saw, heard or were sent.', 'Never record people secretly or go into the other parent\'s accounts.', 'California Courts says parenting plans must be in the best interest of the children; a calm, factual log keeps the focus there.'] },
      ],
      faq: [
        ['How often should I write in a custody log?', 'On every day something happens that the parenting plan covers: a handoff, a visit, a missed visit, a schedule change or an important message. Write it the same day, while you remember the times. A short entry written on the day is more useful than a long one written weeks later.'],
        ['Is there a free custody log I can print?', 'Yes. KeepMyProof has a free co-parenting log you fill in and print or save as a PDF in your browser, with columns for the date, time, place and what happened. Nothing you type is saved or sent anywhere. The link is below, next to the phone app that keeps the log with your messages.'],
        ['Will a custody log help my case?', 'A log is a record you keep; whether and how it is used is for the court and your lawyer. KeepMyProof cannot say how a custody matter will turn out. Ask your lawyer or a legal aid office what to keep and how. This page is educational only and is not legal advice.'],
      ],
    },
    es: {
      title: 'Registro de custodia: qué anotar y cómo | KeepMyProof',
      desc: 'Un registro de custodia es un registro con fecha de entregas, visitas y visitas perdidas. Qué anotar, cada cuánto, y un formato gratis y una app para llevarlo.',
      h1: 'Registro de custodia: qué anotar y cómo llevarlo',
      answer: 'Un registro de custodia es un registro con fecha que lleva un padre o una madre de cada entrega, visita, visita perdida, cambio de horario y mensaje importante sobre los niños. Anote cada entrada el mismo día, con la hora, el lugar y quién estaba, y guárdela junto a los mensajes y papeles a los que se refiere.',
      bestFor: 'quien comparte la custodia, o está armando un plan de crianza, y quiere un registro claro de qué pasa y cuándo.',
      sections: [
        { h: '¿Qué va en un registro de custodia?', a: 'Los hechos de cada día que toca el plan de crianza.', list: ['Entregas: fecha, hora, lugar y quién llevó a los niños.', 'Visitas, y visitas perdidas o tarde, con la razón que se dio.', 'Cambios de horario y quién los pidió.', 'Eventos de la escuela, salud y actividades de los niños.', 'Mensajes importantes, con la captura guardada junto a la entrada.'] },
        { h: '¿Cómo llevo un registro de custodia?', a: 'Entradas cortas y con hechos, escritas el mismo día.', steps: ['Elija un solo lugar: un cuaderno, el registro gratis para imprimir o una app.', 'Escriba primero la fecha y la hora, luego qué pasó, en una o dos frases sencillas.', 'Deje fuera opiniones y suposiciones; escriba lo que vio y oyó.', 'Guarde los mensajes, correos y fotos relacionados junto a la entrada.', 'Respáldelo en un lugar que solo usted pueda abrir.'] },
        { h: '¿Registro en papel o app?', a: 'Los dos sirven; una app mantiene juntos los mensajes y el registro.', table: { head: ['', 'Registro para imprimir', 'KeepMyProof'], rows: [['Costo', 'Gratis', 'Gratis hasta 25 documentos'], ['Entradas con fecha', 'Sí, a mano', 'Sí, fecha en que pasó y fecha de guardado'], ['Capturas y correos junto a las entradas', 'Impresos aparte', 'En la misma carpeta'], ['Un PDF para entregar', 'Hay que escanearlo', 'Sí, con índice'], ['Privado', 'Donde lo guarde', 'Cifrado en su teléfono, con código o Face ID']] } },
        { h: '¿Qué no debe ser un registro de custodia?', a: 'Un diario de sentimientos ni un registro de la vida privada del otro padre.', list: ['Guarde solo lo que vio, oyó o le enviaron.', 'Nunca grabe a nadie en secreto ni entre a las cuentas del otro padre.', 'Las Cortes de California dicen que los planes de crianza deben ser en el interés superior de los niños; un registro tranquilo y con hechos mantiene la atención ahí.'] },
      ],
      faq: [
        ['¿Cada cuánto debo escribir en el registro de custodia?', 'Cada día en que pase algo que cubre el plan de crianza: una entrega, una visita, una visita perdida, un cambio de horario o un mensaje importante. Escríbalo el mismo día, mientras recuerda las horas. Una entrada corta escrita ese día sirve más que una larga escrita semanas después.'],
        ['¿Hay un registro de custodia gratis para imprimir?', 'Sí. KeepMyProof tiene un registro de crianza gratis que se llena e imprime o guarda como PDF en su navegador, con columnas para fecha, hora, lugar y qué pasó. Nada de lo que escribe se guarda ni se envía. El enlace está abajo, junto a la app que guarda el registro con sus mensajes.'],
        ['¿Un registro de custodia ayudará en mi caso?', 'Un registro es algo que usted lleva; si se usa y cómo lo deciden la corte y su abogado. KeepMyProof no puede decir cómo terminará un asunto de custodia. Pregunte a su abogado o a una oficina de ayuda legal qué guardar y cómo. Esta página es solo informativa y no es asesoría legal.'],
      ],
    },
  },
  {
    id: 'prepare-for-divorce', kind: 'divorce', path: { en: '/how-to-prepare-for-divorce', es: '/es/como-prepararse-para-el-divorcio' },
    sources: [S.css, S.irs452, S.caCustody],
    en: {
      title: 'How to prepare for divorce: a checklist | KeepMyProof',
      desc: 'How to prepare for divorce, step by step: the papers to gather, the money records to copy, a plan for the children, and where to keep it all private.',
      h1: 'How to prepare for divorce: a step-by-step checklist',
      answer: 'To prepare for divorce, gather copies of your money records, property papers and children\'s records, list what you own and owe, write down the children\'s routine, and keep it all somewhere private. Then talk to a lawyer or your court\'s self-help center about the rules where you live before you file anything.',
      bestFor: 'someone thinking about or starting a divorce who wants to be organised before the first meeting with a lawyer or the court.',
      sections: [
        { h: 'What are the first steps to prepare for divorce?', a: 'Get organised before anything is filed.', steps: ['Make a private email and keep your phone passcode to yourself.', 'Copy your money records: bank, credit card, retirement and loan statements for the last year or more.', 'Copy your tax returns, pay stubs and benefits papers.', 'List what you own and owe, with account numbers and balances.', 'Write down the children\'s routine: school, care, health and activities.', 'Find your state\'s court self-help center and book time with a lawyer or legal aid office.'] },
        { h: 'What papers should I gather?', a: 'The ones that show money, property and the children\'s needs.', list: ['Income: pay stubs, tax returns, W-2s and 1099s.', 'Accounts: bank, retirement, investment and credit card statements.', 'Property: deeds, mortgage statements, car titles and leases.', 'Debts: loans, medical bills and collection letters.', 'Children: school, medical and child care records and costs.'] },
        { h: 'What about support and taxes?', a: 'Each has its own rules and agencies.', list: ['Child support: each state sets its own guidelines; the U.S. Office of Child Support Services links every state\'s program.', 'Alimony: the IRS explains how alimony is treated for taxes, and the rules changed for divorces after 2018 (IRS Topic 452).', 'Custody: courts decide parenting plans in the best interest of the children.'] },
        { h: 'Where should I keep it all?', a: 'Somewhere private that you control, not a shared computer or cloud account.', list: ['A locked folder on your own phone, with the date of each paper.', 'Originals in a safe place outside the shared home if you can.', 'A backup only you can open.'] },
      ],
      faq: [
        ['What is the first thing to do when preparing for divorce?', 'Make your phone, email and cloud accounts private, then start copying money records: bank, credit card, retirement and loan statements, tax returns and pay stubs. Being organised before you meet a lawyer saves time and fees. Every state has its own rules, so check your court\'s self-help center for yours.'],
        ['What documents do I need for a divorce?', 'Most people need proof of income, account statements, property and debt papers, and the children\'s school, medical and care records. Your court may also require its own forms and a financial statement. KeepMyProof\'s free divorce document checklist lists them, and its Divorce prep folder keeps copies in one private place.'],
        ['Should I talk to a lawyer before I file?', 'Many people do, and legal aid offices and court self-help centers help those who cannot pay. A lawyer can explain the rules in your state, such as residency and where to file. KeepMyProof is not a law firm and gives no legal advice; this page is educational only.'],
      ],
    },
    es: {
      title: 'Cómo prepararse para el divorcio: una lista | KeepMyProof',
      desc: 'Cómo prepararse para el divorcio, paso a paso: los papeles que reunir, los registros de dinero que copiar, un plan para los niños y dónde guardarlo todo.',
      h1: 'Cómo prepararse para el divorcio: una lista paso a paso',
      answer: 'Para prepararse para el divorcio, reúna copias de sus registros de dinero, papeles de propiedades y registros de los niños, haga una lista de lo que tiene y lo que debe, anote la rutina de los niños y guárdelo todo en un lugar privado. Luego hable con un abogado o con su corte antes de presentar nada.',
      bestFor: 'quien está pensando en un divorcio o empezándolo y quiere estar organizado antes de la primera reunión con un abogado o la corte.',
      sections: [
        { h: '¿Cuáles son los primeros pasos para prepararse para el divorcio?', a: 'Organícese antes de presentar nada.', steps: ['Abra un correo privado y no comparta el código de su teléfono.', 'Copie sus registros de dinero: estados de cuenta del banco, tarjetas, jubilación y préstamos del último año o más.', 'Copie sus declaraciones de impuestos, talones de pago y papeles de beneficios.', 'Haga una lista de lo que tiene y lo que debe, con números de cuenta y saldos.', 'Anote la rutina de los niños: escuela, cuidado, salud y actividades.', 'Busque el centro de ayuda de la corte de su estado y pida una cita con un abogado o ayuda legal.'] },
        { h: '¿Qué papeles debo reunir?', a: 'Los que muestran el dinero, las propiedades y lo que necesitan los niños.', list: ['Ingresos: talones de pago, declaraciones de impuestos, W-2 y 1099.', 'Cuentas: estados de cuenta del banco, jubilación, inversiones y tarjetas.', 'Propiedades: escrituras, estados de la hipoteca, títulos de autos y contratos de alquiler.', 'Deudas: préstamos, facturas médicas y cartas de cobro.', 'Niños: registros y costos de la escuela, el médico y el cuidado.'] },
        { h: '¿Y la manutención y los impuestos?', a: 'Cada uno tiene sus propias reglas y agencias.', list: ['Manutención de los hijos: cada estado tiene sus guías; la Oficina de Servicios de Manutención Infantil de EE. UU. enlaza el programa de cada estado.', 'Pensión alimenticia: el IRS explica cómo se trata para los impuestos, y las reglas cambiaron para divorcios después de 2018 (Tema 452 del IRS).', 'Custodia: las cortes deciden los planes de crianza en el interés superior de los niños.'] },
        { h: '¿Dónde lo guardo todo?', a: 'En un lugar privado que usted controle, no en una computadora o nube compartida.', list: ['Una carpeta bloqueada en su propio teléfono, con la fecha de cada papel.', 'Los originales en un lugar seguro fuera de la casa compartida, si puede.', 'Un respaldo que solo usted pueda abrir.'] },
      ],
      faq: [
        ['¿Qué es lo primero que hay que hacer para prepararse para el divorcio?', 'Haga privados su teléfono, su correo y sus cuentas en la nube, y empiece a copiar registros de dinero: estados de cuenta del banco, tarjetas, jubilación y préstamos, declaraciones de impuestos y talones de pago. Estar organizado antes de ver a un abogado ahorra tiempo y dinero. Cada estado tiene sus reglas; revise el centro de ayuda de su corte.'],
        ['¿Qué documentos necesito para un divorcio?', 'La mayoría necesita comprobantes de ingresos, estados de cuenta, papeles de propiedades y deudas, y registros de la escuela, el médico y el cuidado de los niños. Su corte puede pedir sus propios formularios y una declaración financiera. La lista gratis de KeepMyProof los enumera, y su carpeta de divorcio guarda copias en un solo lugar privado.'],
        ['¿Debo hablar con un abogado antes de presentar?', 'Mucha gente lo hace, y las oficinas de ayuda legal y los centros de ayuda de las cortes atienden a quien no puede pagar. Un abogado puede explicar las reglas de su estado, como la residencia y dónde presentar. KeepMyProof no es un bufete y no da asesoría legal; esta página es solo informativa.'],
      ],
    },
  },
  {
    id: 'what-is-an-iep', kind: 'iep', path: { en: '/questions/what-is-an-iep', es: '/es/preguntas/que-es-un-iep' },
    sources: [S.iepDef, S.iepReview, S.iepReeval, S.iepParents, S.ptic],
    en: {
      title: 'What is an IEP? A plain answer for parents | KeepMyProof',
      desc: 'An IEP is a written plan for a child with a disability in a public school, reviewed at least once a year. What is in it, who writes it, and what to keep.',
      h1: 'What is an IEP?',
      answer: 'An IEP, or individualized education program, is a written plan for a child with a disability in a US public school, under the federal IDEA law. It states the child\'s current performance, annual goals and the special education and services the school will provide. The team, including the parents, reviews it at least once a year.',
      bestFor: 'a parent who has just heard "IEP" from a school and wants to know what it is and what to keep.',
      sections: [
        { h: 'What is in an IEP?', a: 'The federal rule, 34 CFR 300.320, lists what every IEP must contain.', list: ['The child\'s present levels of academic achievement and functional performance.', 'Measurable annual goals.', 'How progress will be measured and reported to parents.', 'The special education, related services and supports the school will provide.', 'How much the child will be with children without disabilities, and testing accommodations.', 'From age 16 at the latest, transition goals for life after school.'] },
        { h: 'How often is an IEP reviewed?', a: 'At least once a year, with a reevaluation at least every 3 years.', list: ['The IEP team reviews the IEP periodically, but not less than annually (34 CFR 300.324).', 'The child is reevaluated at least once every 3 years, unless the parent and school agree it is not needed (34 CFR 300.303).', 'Parents can ask for a meeting sooner.'] },
        { h: 'What rights do parents have?', a: 'Parents are members of the IEP team.', list: ['The school must take steps so parents can attend, with notice early enough to arrange it (34 CFR 300.322).', 'The school must give parents a copy of the IEP at no cost (34 CFR 300.322).', 'Every state has a free Parent Training and Information Center for help.'] },
        { h: 'What should I keep in an IEP binder?', a: 'Every paper the school sends, with the date you got it.', list: ['Evaluations and reports.', 'Each IEP and any changes.', 'Progress reports and report cards.', 'Meeting notes and emails with the school.', 'Notes from doctors and therapists.'] },
      ],
      faq: [
        ['Who is on the IEP team?', 'The parents, at least one of the child\'s regular education teachers, a special education teacher, a school district representative, someone who can explain evaluation results, and the child when appropriate. Parents can bring others who know the child. The federal rules list the team in 34 CFR 300.321.'],
        ['What is the difference between an IEP and a 504 plan?', 'An IEP comes from the IDEA, a special education law, and covers specially designed instruction and services for an eligible child. A 504 plan comes from Section 504, a civil rights law, and usually covers accommodations in the regular classroom. Ask your school or Parent Center which fits your child.'],
        ['How do I keep IEP papers organised?', 'Keep one binder, paper or on your phone, with sections for evaluations, IEPs, progress reports, meeting notes and emails, each dated. KeepMyProof\'s IEP binder folder keeps them encrypted on your phone with a suggested checklist, and turns the folder into one PDF before a meeting.'],
      ],
    },
    es: {
      title: '¿Qué es un IEP? Una respuesta clara para padres | KeepMyProof',
      desc: 'Un IEP es un plan escrito para un niño con discapacidad en una escuela pública, revisado al menos una vez al año. Qué incluye, quién lo hace y qué guardar.',
      h1: '¿Qué es un IEP?',
      answer: 'Un IEP, o programa de educación individualizado, es un plan escrito para un niño con discapacidad en una escuela pública de Estados Unidos, según la ley federal IDEA. Indica cómo le va al niño ahora, sus metas anuales y la educación especial y los servicios que dará la escuela. El equipo y los padres lo revisan cada año como mínimo.',
      bestFor: 'un padre o una madre que acaba de oír "IEP" en la escuela y quiere saber qué es y qué guardar.',
      sections: [
        { h: '¿Qué incluye un IEP?', a: 'La regla federal, 34 CFR 300.320, enumera lo que debe tener todo IEP.', list: ['El nivel actual del niño en lo académico y en lo funcional.', 'Metas anuales que se puedan medir.', 'Cómo se medirá el progreso y cómo se informará a los padres.', 'La educación especial, los servicios relacionados y los apoyos que dará la escuela.', 'Cuánto tiempo estará el niño con niños sin discapacidad, y adaptaciones para los exámenes.', 'A más tardar desde los 16 años, metas de transición para la vida después de la escuela.'] },
        { h: '¿Cada cuánto se revisa un IEP?', a: 'Al menos una vez al año, con una reevaluación al menos cada 3 años.', list: ['El equipo del IEP lo revisa periódicamente, pero no menos de una vez al año (34 CFR 300.324).', 'El niño se reevalúa al menos una vez cada 3 años, salvo que los padres y la escuela acuerden que no hace falta (34 CFR 300.303).', 'Los padres pueden pedir una reunión antes.'] },
        { h: '¿Qué derechos tienen los padres?', a: 'Los padres son miembros del equipo del IEP.', list: ['La escuela debe tomar medidas para que los padres puedan asistir, avisando con tiempo (34 CFR 300.322).', 'La escuela debe dar a los padres una copia del IEP sin costo (34 CFR 300.322).', 'Cada estado tiene un Centro de Capacitación e Información para Padres gratis.'] },
        { h: '¿Qué debo guardar en la carpeta del IEP?', a: 'Cada papel que manda la escuela, con la fecha en que lo recibió.', list: ['Evaluaciones e informes.', 'Cada IEP y sus cambios.', 'Informes de progreso y boletas de calificaciones.', 'Notas de reuniones y correos con la escuela.', 'Notas de médicos y terapeutas.'] },
      ],
      faq: [
        ['¿Quién forma parte del equipo del IEP?', 'Los padres, al menos un maestro de educación regular del niño, un maestro de educación especial, un representante del distrito escolar, alguien que pueda explicar los resultados de las evaluaciones y el niño cuando corresponda. Los padres pueden llevar a otras personas que conocen al niño. Las reglas federales lo indican en 34 CFR 300.321.'],
        ['¿Qué diferencia hay entre un IEP y un plan 504?', 'Un IEP viene de la IDEA, una ley de educación especial, y cubre enseñanza y servicios diseñados para un niño que califica. Un plan 504 viene de la Sección 504, una ley de derechos civiles, y suele cubrir adaptaciones en el salón regular. Pregunte a su escuela o a su Centro de Padres cuál le corresponde a su hijo.'],
        ['¿Cómo mantengo en orden los papeles del IEP?', 'Tenga una sola carpeta, en papel o en su teléfono, con secciones para evaluaciones, IEP, informes de progreso, notas de reuniones y correos, todo con fecha. La carpeta del IEP de KeepMyProof los guarda cifrados en su teléfono con una lista sugerida, y convierte la carpeta en un PDF antes de una reunión.'],
      ],
    },
  },
  {
    id: 'iep-meeting-checklist', kind: 'iep', path: { en: '/iep-meeting-checklist', es: '/es/lista-para-la-reunion-del-iep' }, printable: { en: '/tools/iep-meeting-notes-printable', es: '/es/herramientas/notas-de-reunion-iep-para-imprimir' },
    sources: [S.iepParents, S.iepReview, S.iepEval, S.iepMeet, S.ptic],
    en: {
      title: 'IEP meeting checklist for parents | KeepMyProof',
      desc: 'An IEP meeting checklist for parents: what to do before, during and after the meeting, what to bring, and a free printable for your meeting notes.',
      h1: 'IEP meeting checklist for parents',
      answer: 'Before an IEP meeting, read the draft and the latest progress reports, write your questions and goals, and bring your binder. During it, take notes and ask for anything unclear in writing. Afterwards, check the final IEP against your notes; the school must give you a copy of the IEP at no cost.',
      bestFor: 'a parent with an IEP meeting coming up who wants to walk in prepared and walk out with clear notes.',
      sections: [
        { h: 'What should I do before the IEP meeting?', a: 'Read, write down and gather.', steps: ['Confirm the date, time and who will attend; ask to move it if you cannot come (the school must try to schedule a time parents can attend).', 'Ask for the draft IEP and any new evaluations ahead of time.', 'Read the current IEP and the latest progress reports.', 'Write your top questions and the goals you want for your child.', 'Gather report cards, work samples, doctors\' notes and emails with the school.'] },
        { h: 'What should I bring?', a: 'Your binder and a way to take notes.', list: ['The current IEP and progress reports.', 'Evaluations and outside reports.', 'Your questions and goals, written down.', 'The free IEP meeting notes printable, or your phone.', 'Someone who knows your child, if you want support.'] },
        { h: 'What should I do during the meeting?', a: 'Listen, take notes, and ask.', list: ['Write who said what about goals, services and minutes.', 'Ask how each goal will be measured and reported.', 'Ask for anything you do not understand to be explained or written down.', 'You do not have to agree to everything on the day; you can take time to read the final IEP.'] },
        { h: 'What should I do after the meeting?', a: 'Compare, keep and follow up.', steps: ['Get a copy of the IEP; the school must give it to you at no cost (34 CFR 300.322).', 'Compare it with your notes.', 'Email the school about anything that is missing, and keep the email.', 'File everything in your binder with the date.', 'Put the next review date in your calendar: the IEP is reviewed at least once a year (34 CFR 300.324).'] },
      ],
      faq: [
        ['Can I bring someone to an IEP meeting?', 'Yes. Federal rules let parents invite people who have knowledge or special expertise about the child, such as a relative, a therapist or an advocate. Many parents bring a friend to take notes. Tell the school who is coming. Your state\'s Parent Training and Information Center can also help you prepare, for free.'],
        ['How long does a school have to evaluate my child?', 'Under federal rules, within 60 days of receiving your consent for the initial evaluation, unless your state sets its own timeframe. Many states do, so check yours. KeepMyProof has a free evaluation due date calculator that uses each state\'s rule from official sources.'],
        ['What if I disagree with the IEP?', 'Say so in the meeting and in writing afterwards, and keep a copy of your email. You can ask for another meeting. Every state also has mediation and other ways to resolve disagreements; your Parent Center can explain them. This page is educational only and not legal advice.'],
      ],
    },
    es: {
      title: 'Lista para la reunión del IEP para padres | KeepMyProof',
      desc: 'Una lista para la reunión del IEP: qué hacer antes, durante y después, qué llevar, y un formato gratis para imprimir y tomar notas de la reunión.',
      h1: 'Lista para la reunión del IEP para padres',
      answer: 'Antes de una reunión del IEP, lea el borrador y los últimos informes de progreso, escriba sus preguntas y metas y lleve su carpeta. Durante la reunión, tome notas y pida por escrito lo que no esté claro. Después, compare el IEP final con sus notas; la escuela debe darle una copia del IEP sin costo.',
      bestFor: 'un padre o una madre con una reunión del IEP pronto que quiere llegar preparado y salir con notas claras.',
      sections: [
        { h: '¿Qué hago antes de la reunión del IEP?', a: 'Leer, anotar y reunir.', steps: ['Confirme la fecha, la hora y quién asistirá; pida cambiarla si no puede ir (la escuela debe intentar una hora en que los padres puedan asistir).', 'Pida el borrador del IEP y las evaluaciones nuevas con tiempo.', 'Lea el IEP actual y los últimos informes de progreso.', 'Escriba sus preguntas principales y las metas que quiere para su hijo.', 'Reúna boletas, trabajos, notas de médicos y correos con la escuela.'] },
        { h: '¿Qué debo llevar?', a: 'Su carpeta y algo para tomar notas.', list: ['El IEP actual y los informes de progreso.', 'Evaluaciones e informes de fuera de la escuela.', 'Sus preguntas y metas, por escrito.', 'El formato gratis de notas de la reunión del IEP, o su teléfono.', 'Alguien que conozca a su hijo, si quiere apoyo.'] },
        { h: '¿Qué hago durante la reunión?', a: 'Escuchar, tomar notas y preguntar.', list: ['Anote quién dijo qué sobre metas, servicios y minutos.', 'Pregunte cómo se medirá e informará cada meta.', 'Pida que le expliquen o escriban lo que no entienda.', 'No tiene que aceptar todo ese día; puede tomarse tiempo para leer el IEP final.'] },
        { h: '¿Qué hago después de la reunión?', a: 'Comparar, guardar y dar seguimiento.', steps: ['Pida una copia del IEP; la escuela debe dársela sin costo (34 CFR 300.322).', 'Compárela con sus notas.', 'Escriba a la escuela sobre lo que falte, y guarde el correo.', 'Archive todo en su carpeta con la fecha.', 'Anote la próxima revisión en su calendario: el IEP se revisa al menos una vez al año (34 CFR 300.324).'] },
      ],
      faq: [
        ['¿Puedo llevar a alguien a una reunión del IEP?', 'Sí. Las reglas federales permiten a los padres invitar a personas que conocen al niño o tienen experiencia especial, como un familiar, un terapeuta o un defensor. Muchos padres llevan a alguien para tomar notas. Avise a la escuela quién va. El Centro de Padres de su estado también le ayuda a prepararse, gratis.'],
        ['¿Cuánto tiempo tiene la escuela para evaluar a mi hijo?', 'Según las reglas federales, 60 días desde que recibe su consentimiento para la evaluación inicial, salvo que su estado fije su propio plazo. Muchos estados lo hacen, así que revise el suyo. KeepMyProof tiene una calculadora gratis de la fecha de la evaluación que usa la regla de cada estado según fuentes oficiales.'],
        ['¿Y si no estoy de acuerdo con el IEP?', 'Dígalo en la reunión y por escrito después, y guarde una copia de su correo. Puede pedir otra reunión. Cada estado también tiene mediación y otras formas de resolver desacuerdos; su Centro de Padres puede explicarlas. Esta página es solo informativa y no es asesoría legal.'],
      ],
    },
  },
  {
    id: 'parent-dies', kind: 'executor', path: { en: '/questions/what-to-do-when-a-parent-dies', es: '/es/preguntas/que-hacer-cuando-muere-un-padre' },
    sources: [S.w2w, S.irs1041, S.cfpbDebt],
    en: {
      title: 'What to do when a parent dies: a checklist | KeepMyProof',
      desc: 'What to do when a parent dies, in order: the first days, the papers to find, death certificates, accounts, bills and taxes, and where to keep it all.',
      h1: 'What to do when a parent dies: a checklist',
      answer: 'When a parent dies, first tell close family, arrange the funeral and order several certified death certificates. Then find the will and the important papers, tell banks, insurers and agencies, keep paying essential bills, and ask the probate court or a lawyer whether the estate needs probate. Keep every paper and date in one place.',
      bestFor: 'an adult child, often the executor, facing a parent\'s papers for the first time.',
      sections: [
        { h: 'What should I do in the first days?', a: 'The people and the funeral come first; the papers can wait a little.', steps: ['Tell close family and friends.', 'Contact a funeral home; it usually helps file the death certificate.', 'Order several certified copies of the death certificate. Each state\'s vital records office issues them (CDC: Where to write for vital records).', 'Secure the home, car, mail and any pets.', 'Find the will, and any instructions your parent left.'] },
        { h: 'What papers should I find?', a: 'The ones that show what your parent owned, owed and received.', list: ['Will, trust and funeral instructions.', 'Bank, retirement and investment statements.', 'Life insurance policies and pension papers.', 'Deeds, car titles and leases.', 'Bills, loans and credit cards.', 'Benefits letters, such as Social Security, VA or Medicare.'] },
        { h: 'What about debts and taxes?', a: 'Debts are usually paid from the estate, and the estate may have to file a tax return.', list: ['The CFPB explains that debts are generally paid from the estate, and family members usually do not have to pay them from their own money unless they co-signed or shared the account.', 'An estate with gross income of $600 or more in a year generally files Form 1041 (IRS).', 'Your parent\'s final personal tax return is also due for the year they died.'] },
        { h: 'Where should I keep it all?', a: 'In one place, with the date each thing came in.', list: ['Keep a list of every call, letter and account closed.', 'Scan or photograph papers as they arrive.', 'Keep originals of the will and certificates safe.'] },
      ],
      faq: [
        ['How many death certificates do I need?', 'It depends on how many banks, insurers, agencies and courts ask for a certified copy; many families order several at first. Each state\'s vital records office issues them, and the CDC lists where to write in every state. Ordering more later is possible but takes time, so count the accounts first.'],
        ['Do I have to pay my parent\'s debts?', 'Usually not from your own money. The CFPB says debts are generally paid from the estate, and family members are usually not responsible unless they co-signed, held a joint account or live in a state with special rules. Ask a lawyer about your situation; this is educational only.'],
        ['Does every estate go through probate?', 'No. Many states have a simpler process for small estates, and property held in a trust, with a named beneficiary or jointly owned often passes outside probate. The rules and limits differ by state. KeepMyProof has state pages on small estates and probate from official sources.'],
      ],
    },
    es: {
      title: 'Qué hacer cuando muere un padre: una lista | KeepMyProof',
      desc: 'Qué hacer cuando muere un padre o una madre, en orden: los primeros días, los papeles, las actas de defunción, cuentas, facturas e impuestos, y dónde guardarlo.',
      h1: 'Qué hacer cuando muere un padre o una madre: una lista',
      answer: 'Cuando muere un padre o una madre, primero avise a la familia cercana, organice el funeral y pida varias actas de defunción certificadas. Luego busque el testamento y los papeles importantes, avise a bancos, aseguradoras y agencias, siga pagando las facturas esenciales y pregunte a la corte o a un abogado si la herencia necesita un proceso sucesorio.',
      bestFor: 'un hijo o una hija adulta, muchas veces el albacea, frente a los papeles de su padre o madre por primera vez.',
      sections: [
        { h: '¿Qué hago los primeros días?', a: 'Primero las personas y el funeral; los papeles pueden esperar un poco.', steps: ['Avise a la familia y amigos cercanos.', 'Llame a una funeraria; normalmente ayuda a registrar el acta de defunción.', 'Pida varias copias certificadas del acta de defunción. Las emite la oficina de registros vitales de cada estado (CDC: dónde pedir registros vitales).', 'Asegure la casa, el auto, el correo y las mascotas.', 'Busque el testamento y las instrucciones que haya dejado.'] },
        { h: '¿Qué papeles debo buscar?', a: 'Los que muestran lo que tenía, lo que debía y lo que recibía.', list: ['Testamento, fideicomiso e instrucciones del funeral.', 'Estados de cuenta del banco, la jubilación y las inversiones.', 'Pólizas de seguro de vida y papeles de pensión.', 'Escrituras, títulos de autos y contratos de alquiler.', 'Facturas, préstamos y tarjetas de crédito.', 'Cartas de beneficios, como Seguro Social, VA o Medicare.'] },
        { h: '¿Y las deudas y los impuestos?', a: 'Las deudas normalmente se pagan con la herencia, y la herencia puede tener que presentar impuestos.', list: ['La CFPB explica que las deudas generalmente se pagan con la herencia, y la familia normalmente no tiene que pagarlas con su propio dinero, salvo que haya firmado o compartido la cuenta.', 'Una herencia con ingresos brutos de $600 o más en un año generalmente presenta el Formulario 1041 (IRS).', 'También se debe presentar la última declaración personal de su padre o madre por el año en que murió.'] },
        { h: '¿Dónde lo guardo todo?', a: 'En un solo lugar, con la fecha en que llegó cada cosa.', list: ['Lleve una lista de cada llamada, carta y cuenta cerrada.', 'Escanee o fotografíe los papeles cuando lleguen.', 'Guarde en un lugar seguro los originales del testamento y las actas.'] },
      ],
      faq: [
        ['¿Cuántas actas de defunción necesito?', 'Depende de cuántos bancos, aseguradoras, agencias y cortes pidan una copia certificada; muchas familias piden varias al principio. Las emite la oficina de registros vitales de cada estado, y los CDC indican dónde pedirlas en cada uno. Pedir más después es posible pero toma tiempo, así que cuente primero las cuentas.'],
        ['¿Tengo que pagar las deudas de mi padre o madre?', 'Normalmente no con su propio dinero. La CFPB dice que las deudas generalmente se pagan con la herencia, y la familia no suele ser responsable salvo que haya firmado, tenido una cuenta conjunta o viva en un estado con reglas especiales. Pregunte a un abogado por su caso; esto es solo informativo.'],
        ['¿Toda herencia pasa por un proceso sucesorio?', 'No. Muchos estados tienen un proceso más simple para herencias pequeñas, y los bienes en un fideicomiso, con un beneficiario nombrado o en propiedad conjunta muchas veces pasan fuera del proceso. Las reglas y los límites cambian por estado. KeepMyProof tiene páginas por estado sobre herencias pequeñas y el proceso sucesorio.'],
      ],
    },
  },
  {
    id: 'screenshots-evidence', kind: 'divorce', path: { en: '/questions/do-screenshots-count-as-evidence', es: '/es/preguntas/las-capturas-cuentan-como-prueba' },
    sources: [S.fre901, S.fre1002],
    en: {
      title: 'Do screenshots count as evidence? It depends | KeepMyProof',
      desc: 'Whether a screenshot can be used as evidence depends on the court and its rules. What courts look at, how to keep originals, and why a save date is not proof.',
      h1: 'Do screenshots count as evidence?',
      answer: 'It depends on the court, its rules and the judge, so no app or website can promise a screenshot will be accepted. Under the federal rules, whoever offers an item must show it is what they say it is (Rule 901). Ask a lawyer how to keep the originals; a save date records saving, not that something happened.',
      bestFor: 'someone saving screenshots for a family, work or housing matter who wants an honest answer before relying on them.',
      sections: [
        { h: 'What do courts look at?', a: 'Mainly whether the screenshot is what someone says it is, and whether it is complete.', list: ['Federal Rule of Evidence 901: the person offering an item must produce evidence sufficient to support a finding that it is what they claim.', 'Federal Rule of Evidence 1002 deals with when an original is required.', 'State courts have their own rules, and judges decide.'] },
        { h: 'How do I keep screenshots well?', a: 'Keep them complete, dated and next to the originals.', steps: ['Capture the whole message: the sender\'s name or number, the date and time shown, and the messages before and after.', 'Keep the original messages, emails or posts on the device where they arrived.', 'Write the date it happened and what the screenshot shows.', 'Do not edit, crop or mark up the copy you keep.', 'Ask your lawyer how they want the originals kept or exported.'] },
        { h: 'Does a save date or timestamp prove when something happened?', a: 'No. A save date records when you saved a copy.', list: ['KeepMyProof shows the date it happened, which you write, next to the date you saved it.', 'Neither date certifies anything; they help you stay organised.', 'Never record people secretly or copy someone else\'s accounts to get messages.'] },
        { h: 'Where should I keep them?', a: 'Somewhere private, out of a shared camera roll.', list: ['A locked folder on your own phone, with the papers they relate to.', 'An encrypted backup only you can open.'] },
      ],
      faq: [
        ['Can a screenshot of a text message be used in court?', 'Sometimes, but it depends on the court, its rules and how the screenshot is shown to be genuine and complete. Many courts also want the original messages or the phone. Ask a lawyer or a legal aid office before you rely on screenshots. This page is educational only and is not legal advice.'],
        ['Should I keep the original messages too?', 'Yes, many lawyers ask clients to keep the original messages, emails and posts on the device where they arrived, and not to delete them. A screenshot can leave out the sender, the time or the context. Ask your lawyer how to keep or export the originals for your matter.'],
        ['Does KeepMyProof make screenshots official?', 'No. KeepMyProof keeps private, organised copies on your phone, with the date something happened next to the date you saved it. It does not certify, verify or authenticate anything, and the save date records saving, not that something happened. It turns a folder into one PDF you can show your lawyer.'],
      ],
    },
    es: {
      title: '¿Las capturas cuentan como prueba? Depende | KeepMyProof',
      desc: 'Si una captura puede usarse como prueba depende de la corte y sus reglas. Qué miran las cortes, cómo guardar los originales y por qué una fecha no lo demuestra.',
      h1: '¿Las capturas de pantalla cuentan como prueba?',
      answer: 'Depende de la corte, sus reglas y el juez, así que ninguna app ni sitio puede prometer que una captura será aceptada. Según las reglas federales, quien presenta algo debe mostrar que es lo que dice que es (Regla 901). Pregunte a un abogado cómo guardar los originales, y sepa que una fecha de guardado no muestra que algo pasó.',
      bestFor: 'quien guarda capturas para un asunto de familia, trabajo o vivienda y quiere una respuesta honesta antes de confiar en ellas.',
      sections: [
        { h: '¿Qué miran las cortes?', a: 'Sobre todo si la captura es lo que alguien dice que es, y si está completa.', list: ['Regla Federal de Evidencia 901: quien presenta algo debe dar pruebas suficientes de que es lo que dice.', 'La Regla Federal de Evidencia 1002 trata de cuándo se necesita el original.', 'Las cortes estatales tienen sus propias reglas, y deciden los jueces.'] },
        { h: '¿Cómo guardo bien las capturas?', a: 'Completas, con fecha y junto a los originales.', steps: ['Capture el mensaje completo: el nombre o número de quien envía, la fecha y hora que se ven, y los mensajes de antes y después.', 'Conserve los mensajes, correos o publicaciones originales en el aparato donde llegaron.', 'Escriba la fecha en que pasó y qué muestra la captura.', 'No edite, recorte ni marque la copia que guarda.', 'Pregunte a su abogado cómo quiere que guarde o exporte los originales.'] },
        { h: '¿Una fecha de guardado muestra cuándo pasó algo?', a: 'No. Una fecha de guardado registra cuándo guardó una copia.', list: ['KeepMyProof muestra la fecha en que pasó, que usted escribe, junto a la fecha en que lo guardó.', 'Ninguna de las dos certifica nada; le ayudan a mantenerse en orden.', 'Nunca grabe a nadie en secreto ni copie las cuentas de otra persona para obtener mensajes.'] },
        { h: '¿Dónde las guardo?', a: 'En un lugar privado, fuera de un carrete compartido.', list: ['Una carpeta bloqueada en su propio teléfono, junto a los papeles relacionados.', 'Un respaldo cifrado que solo usted pueda abrir.'] },
      ],
      faq: [
        ['¿Se puede usar en la corte una captura de un mensaje de texto?', 'A veces, pero depende de la corte, sus reglas y cómo se muestra que la captura es auténtica y completa. Muchas cortes también quieren los mensajes originales o el teléfono. Pregunte a un abogado o a una oficina de ayuda legal antes de confiar en capturas. Esta página es solo informativa y no es asesoría legal.'],
        ['¿Debo guardar también los mensajes originales?', 'Sí, muchos abogados piden a sus clientes que conserven los mensajes, correos y publicaciones originales en el aparato donde llegaron, y que no los borren. Una captura puede dejar fuera a quien envió, la hora o el contexto. Pregunte a su abogado cómo guardar o exportar los originales para su caso.'],
        ['¿KeepMyProof hace oficiales las capturas?', 'No. KeepMyProof guarda copias privadas y ordenadas en su teléfono, con la fecha en que pasó algo junto a la fecha en que lo guardó. No certifica, verifica ni autentica nada, y la fecha de guardado registra que se guardó, no que algo pasó. Convierte una carpeta en un PDF para mostrar a su abogado.'],
      ],
    },
  },
];
