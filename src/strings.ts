// Approved screen wording. One entry per language, in LANGS order: English, US Spanish (usted),
// Simplified Chinese (zh-Hans, 您) and Korean (ko), all written for US residents. All four launch as
// written, without a native reader (owner ruling 2 Nov 2026; topics.json language_status).
import { LANGS, type Lang } from "./core/model";
export const strings = {
  "canKeep": [
    "What you can keep here",
    "Lo que puede guardar aquí",
    "可以在这里保存什么",
    "여기에 보관할 수 있는 것"
  ],
  "keepLetters": [
    "Letters and papers",
    "Cartas y papeles",
    "信件和文件",
    "편지와 서류"
  ],
  "keepTexts": [
    "Screenshots of texts",
    "Capturas de mensajes de texto",
    "短信截图",
    "문자 메시지 캡처"
  ],
  "keepBills": [
    "Bills and receipts",
    "Facturas y recibos",
    "账单和收据",
    "청구서와 영수증"
  ],
  "keepPhotos": [
    "Photos of damage or things",
    "Fotos de daños o de cosas",
    "损坏或物品的照片",
    "파손이나 물건 사진"
  ],
  "keepNotes": [
    "Notes of what happened, and when",
    "Notas de lo que pasó, y cuándo",
    "发生了什么、何时发生的笔记",
    "언제 무슨 일이 있었는지 적은 메모"
  ],
  "keepSchool": [
    "School and medical papers",
    "Papeles de la escuela y médicos",
    "学校和医疗文件",
    "학교와 병원 서류"
  ],
  "nothingYet": [
    "Nothing yet",
    "Nada todavía",
    "还没有内容",
    "아직 없음"
  ],
  "ticked1": [
    "1 line ticked",
    "1 línea marcada",
    "已勾选 1 行",
    "1줄 체크됨"
  ],
  "tickedN": [
    "{n} lines ticked",
    "{n} líneas marcadas",
    "已勾选 {n} 行",
    "{n}줄 체크됨"
  ],
  "items1": [
    "1 item",
    "1 documento",
    "1 项",
    "1개 항목"
  ],
  "itemsN": [
    "{n} items",
    "{n} documentos",
    "{n} 项",
    "{n}개 항목"
  ],
  "makeOwn": [
    "Make your own folder",
    "Haga su propia carpeta",
    "建立自己的文件夹",
    "나만의 폴더 만들기"
  ],
  "makeOwnSub": [
    "For anything the folders above don't cover",
    "Para lo que no cubren las carpetas de arriba",
    "存放上面文件夹以外的任何内容",
    "위 폴더에 맞지 않는 모든 것"
  ],
  "plusTag": [
    "Plus",
    "Plus",
    "Plus",
    "Plus"
  ],
  "byPaper": [
    "Ticked when you added a paper",
    "Marcada al añadir un documento",
    "添加文件时已自动勾选",
    "서류를 추가할 때 체크됨"
  ],
  "byHand": [
    "You ticked this",
    "Usted la marcó",
    "您手动勾选的",
    "직접 체크함"
  ],
  "addLine": [
    "+ Add a line",
    "+ Añadir una línea",
    "+ 添加一行",
    "+ 줄 추가"
  ],
  "lineName": [
    "Name the line",
    "Nombre de la línea",
    "这一行的名称",
    "줄 이름"
  ],
  "saveLine": [
    "Add this line ›",
    "Añadir esta línea ›",
    "添加这一行 ›",
    "이 줄 추가 ›"
  ],
  "LINE_EMPTY": [
    "Give the line a name first.",
    "Primero póngale un nombre a la línea.",
    "请先给这一行起个名称。",
    "먼저 줄 이름을 입력하세요."
  ],
  "NO_ORIGINALS": [
    "This selection has notes only. Make a PDF to save them.",
    "Esta selección solo tiene notas. Haga un PDF para guardarlas.",
    "所选内容只有笔记。请制作 PDF 来保存。",
    "선택한 항목에는 메모만 있어요. PDF로 만들어 저장하세요."
  ],
  "loading": [
    "Opening your papers…",
    "Abriendo sus documentos…",
    "正在打开您的文件…",
    "서류를 여는 중…"
  ],
  "firstTitle": [
    "Keep the papers you already have, private on this phone.",
    "Guarde los documentos que ya tiene, privados en este teléfono.",
    "把您已有的文件保存在这部手机上，保持私密。",
    "이미 가지고 있는 서류를 이 휴대폰에 비공개로 보관하세요."
  ],
  "vaultTitle": [
    "Your private vault for photos and documents",
    "Su bóveda privada para fotos y documentos",
    "您的私密保险箱，存放照片和文件",
    "사진과 서류를 위한 나만의 비공개 금고"
  ],
  "vaultLock": [
    "Locked with your passcode or Face ID. Nothing you keep here shows up in your camera roll.",
    "Protegida con su código o Face ID. Nada de lo que guarde aquí aparece en el carrete de fotos.",
    "用密码或 Face ID 上锁。保存在这里的内容不会出现在相册中。",
    "암호나 Face ID로 잠겨요. 여기에 보관한 것은 사진 앱의 앨범에 나타나지 않아요."
  ],
  "vaultLockAndroid": [
    "Locked with your passcode or fingerprint. Nothing you keep here shows up in your photo gallery.",
    "Protegida con su código o huella digital. Nada de lo que guarde aquí aparece en su galería de fotos.",
    "用密码或指纹上锁。保存在这里的内容不会出现在相册中。",
    "암호나 지문으로 잠겨요. 여기에 보관한 것은 사진 갤러리에 나타나지 않아요."
  ],
  "lockVault": [
    "Private vault",
    "Bóveda privada",
    "私密保险箱",
    "비공개 금고"
  ],
  "vaultSection": [
    "Vault",
    "Bóveda",
    "保险箱",
    "금고"
  ],
  "addPhotos": [
    "Add photos to your vault",
    "Agregar fotos a su bóveda",
    "把照片添加到保险箱",
    "금고에 사진 추가"
  ],
  "addPhotosSub": [
    "Photos and screenshots, kept private here.",
    "Fotos y capturas de pantalla, guardadas en privado aquí.",
    "照片和截图，私密保存在这里。",
    "사진과 스크린샷을 여기에 비공개로 보관해요."
  ],
  "addGo": [
    "Add ›",
    "Agregar ›",
    "添加 ›",
    "추가 ›"
  ],
  "photoCopy": [
    "Keeps a private copy here. On iPhone you can then remove the original from Photos.",
    "Guarda una copia privada aquí. En iPhone, después puede quitar el original de Fotos.",
    "在这里保存一份私密副本。在 iPhone 上，之后可以从“照片”中移除原图。",
    "여기에 비공개 사본을 보관해요. iPhone에서는 그다음 사진 앱의 원본을 삭제할 수 있어요."
  ],
  "photoCopyAndroid": [
    "Keeps a private copy here. The original stays in your Photos or Gallery app. Delete it there if you want it gone.",
    "Guarda una copia privada aquí. El original sigue en su app Fotos o Galería. Bórrelo allí si quiere que desaparezca.",
    "在这里保存一份私密副本。原图仍在您的 Google 相册或图库应用中。如需删除，请在那里删除。",
    "여기에 비공개 사본을 보관해요. 원본은 사진 앱이나 갤러리에 그대로 남아 있어요. 없애려면 그 앱에서 삭제하세요."
  ],
  "androidOriginal": [
    "Photos you add also stay in Google Photos",
    "Las fotos que agregue también se quedan en Google Fotos",
    "您添加的照片也会保留在 Google 相册中",
    "추가한 사진은 Google 포토에도 그대로 남아 있어요"
  ],
  "androidOriginalHow": [
    "On Android this app cannot remove them for you. To remove one: open Google Photos or your Gallery app, tap the photo, then tap Delete. It stays in that app's Trash until you empty it.",
    "En Android esta app no puede quitarlas por usted. Para quitar una: abra Google Fotos o su app Galería, toque la foto y luego Eliminar. Se queda en la Papelera de esa app hasta que la vacíe.",
    "在 Android 上，本应用无法替您移除。要移除一张：打开 Google 相册或图库应用，点按照片，然后点按“删除”。它会留在该应用的回收站中，直到您清空回收站。",
    "Android에서는 이 앱이 대신 삭제할 수 없어요. 삭제하려면 Google 포토나 갤러리 앱을 열고 사진을 누른 뒤 삭제를 누르세요. 휴지통을 비울 때까지 그 앱의 휴지통에 남아 있어요."
  ],
  "noAccount": [
    "No account. No ads.",
    "Sin cuenta. Sin anuncios.",
    "无需账户。没有广告。",
    "계정 없음. 광고 없음."
  ],
  "start": [
    "Open the app and start.",
    "Abra la app y empiece.",
    "打开应用就能开始。",
    "앱을 열고 바로 시작하세요."
  ],
  "stays": [
    "Stays on this phone",
    "Se queda en este teléfono",
    "只保存在这部手机上",
    "이 휴대폰에만 저장"
  ],
  "local": [
    "Locked and scrambled. Nothing leaves unless you send it or back it up.",
    "Bajo llave y cifrado. Nada sale a menos que usted lo envíe o haga una copia.",
    "已上锁并加密。除非您自己发送或备份，否则任何内容都不会离开手机。",
    "잠금과 암호화로 보호돼요. 직접 보내거나 백업하지 않는 한 아무것도 밖으로 나가지 않아요."
  ],
  "firstFree": [
    "Free for your first 25 items",
    "Gratis para sus primeros 25 documentos",
    "前 25 项免费",
    "처음 25개 항목은 무료"
  ],
  "five": [
    "All five folders included.",
    "Incluye las cinco carpetas.",
    "包含全部五个文件夹。",
    "다섯 개 폴더가 모두 포함돼요."
  ],
  "lawFirm": [
    "KeepMyProof keeps your papers in order. It is not a law firm and does not give legal advice.",
    "KeepMyProof mantiene sus documentos en orden. No es un bufete ni da asesoría legal.",
    "KeepMyProof 帮您整理文件。它不是律师事务所，也不提供法律建议。",
    "KeepMyProof는 서류 정리를 돕습니다. 법률 사무소가 아니며 법률 자문을 제공하지 않습니다."
  ],
  "step1": [
    "Step 1 of 2",
    "Paso 1 de 2",
    "第 1 步，共 2 步",
    "2단계 중 1단계"
  ],
  "step2": [
    "Step 2 of 2",
    "Paso 2 de 2",
    "第 2 步，共 2 步",
    "2단계 중 2단계"
  ],
  "back": [
    "← Back",
    "← Volver",
    "← 返回",
    "← 뒤로"
  ],
  "backTo": [
    "← Back to {folder}",
    "← Volver a {folder}",
    "← 返回{folder}",
    "← 뒤로: {folder}"
  ],
  "backHome": [
    "← Back to Home",
    "← Volver al inicio",
    "← 返回主页",
    "← 홈으로 돌아가기"
  ],
  "lockTitle": [
    "Choose a passcode for this app",
    "Elija un código para esta app",
    "为这个应用设置密码",
    "이 앱의 암호를 정하세요"
  ],
  "six": [
    "Six numbers. Use a different one from your phone's, so someone who knows your phone code can't open your papers.",
    "Seis números. Use uno distinto al del teléfono, para que quien conozca ese código no pueda abrir sus documentos.",
    "六位数字。请使用和手机解锁密码不同的数字，这样知道您手机密码的人也打不开您的文件。",
    "숫자 여섯 자리예요. 휴대폰 암호와 다른 숫자를 쓰세요. 그래야 휴대폰 암호를 아는 사람도 서류를 열 수 없어요."
  ],
  "removeAsk": [
    "Remove the original from Photos?",
    "¿Quitar el original de Fotos?",
    "要从“照片”中移除原图吗？",
    "사진 앱에서 원본을 삭제할까요?"
  ],
  "removeWhy": [
    "Your copy is saved here. The original is still in Photos, where anyone who opens Photos can see it. If you remove it, your iPhone asks you to confirm, and it stays in Recently Deleted for 30 days.",
    "Su copia está guardada aquí. El original sigue en Fotos, donde cualquiera que abra Fotos puede verlo. Si lo quita, su iPhone le pedirá que lo confirme y quedará en el álbum Eliminado durante 30 días.",
    "您的副本已保存在这里。原图仍在“照片”中，任何打开“照片”的人都能看到。如果您移除它，iPhone 会请您确认，照片会在“最近删除”中保留 30 天。",
    "사본은 여기에 저장되었습니다. 원본은 아직 사진 앱에 있어 사진 앱을 여는 누구나 볼 수 있습니다. 삭제하면 iPhone이 확인을 요청하며, 사진은 30일 동안 '최근 삭제된 항목'에 남습니다."
  ],
  "keepInPhotos": [
    "Keep it in Photos",
    "Dejarlo en Fotos",
    "保留在“照片”中",
    "사진 앱에 그대로 두기"
  ],
  "removeFromPhotos": [
    "Remove from Photos ›",
    "Quitar de Fotos ›",
    "从“照片”中移除 ›",
    "사진 앱에서 삭제 ›"
  ],
  "removedNotice": [
    "Removed from Photos. It stays in Recently Deleted for 30 days. Your copy is here.",
    "Se quitó de Fotos. Queda en el álbum Eliminado durante 30 días. Su copia está aquí.",
    "已从“照片”中移除。它会在“最近删除”中保留 30 天。您的副本在这里。",
    "사진 앱에서 삭제했습니다. 30일 동안 '최근 삭제된 항목'에 남습니다. 사본은 여기에 있습니다."
  ],
  "keptNotice": [
    "Still in Photos. Nothing was changed.",
    "Sigue en Fotos. No se cambió nada.",
    "仍在“照片”中。没有做任何更改。",
    "사진 앱에 그대로 있습니다. 아무것도 바뀌지 않았습니다."
  ],
  "removeSetting": [
    "After adding a photo, offer to remove it from Photos (iPhone)",
    "Después de agregar una foto, ofrecer quitarla de Fotos (iPhone)",
    "添加照片后，提供从“照片”中移除原图的选项（iPhone）",
    "사진을 추가한 뒤 사진 앱에서 삭제할지 묻기 (iPhone)"
  ],
  "removeSettingHint": [
    "Nothing leaves Photos unless you tap Remove and confirm on your iPhone.",
    "Nada sale de Fotos a menos que toque Quitar y lo confirme en su iPhone.",
    "除非您点按“移除”并在 iPhone 上确认，否则不会从“照片”中移除任何内容。",
    "'삭제'를 누르고 iPhone에서 확인하지 않으면 사진 앱에서 아무것도 삭제되지 않습니다."
  ],
  "biometrics": [
    "Also open with Face ID",
    "Abrir también con Face ID",
    "也可以用 Face ID 打开",
    "Face ID로도 열기"
  ],
  "codeWorks": [
    "Your passcode still works.",
    "Su código sigue funcionando.",
    "您的密码仍然可以使用。",
    "암호도 계속 사용할 수 있어요."
  ],
  "wrongGuesses": [
    "Wrong guesses make the app wait longer each time. It never erases your papers. Forgot the passcode? Face ID or your recovery phrase lets you set a new one.",
    "Cada intento incorrecto hace que la app espere más. Nunca borra sus documentos. ¿Olvidó el código? Face ID o su frase de recuperación le permite crear uno nuevo.",
    "每次输错，应用都会让您等更久，但绝不会删除您的文件。忘记密码？可以用 Face ID 或恢复短语设置新密码。",
    "잘못 입력할 때마다 기다리는 시간이 길어지지만, 서류는 절대 지워지지 않아요. 암호를 잊으셨나요? Face ID나 복구 문구로 새 암호를 만들 수 있어요."
  ],
  "saveCode": [
    "Save passcode ›",
    "Guardar código ›",
    "保存密码 ›",
    "암호 저장 ›"
  ],
  "confirmCode": [
    "Enter the same six numbers again",
    "Vuelva a escribir los mismos seis números",
    "再输入一次同样的六位数字",
    "같은 숫자 여섯 자리를 다시 입력하세요"
  ],
  "passcode": [
    "Passcode",
    "Código",
    "密码",
    "암호"
  ],
  "unlock": [
    "Open my papers ›",
    "Abrir mis documentos ›",
    "打开我的文件 ›",
    "내 서류 열기 ›"
  ],
  "locked": [
    "Your papers are locked",
    "Sus documentos están bajo llave",
    "您的文件已上锁",
    "서류가 잠겨 있어요"
  ],
  "useBio": [
    "Open with Face ID ›",
    "Abrir con Face ID ›",
    "用 Face ID 打开 ›",
    "Face ID로 열기 ›"
  ],
  "forgot": [
    "Forgot the passcode? ›",
    "¿Olvidó el código? ›",
    "忘记密码？›",
    "암호를 잊으셨나요? ›"
  ],
  "reset": [
    "Set a new passcode ›",
    "Crear un código nuevo ›",
    "设置新密码 ›",
    "새 암호 만들기 ›"
  ],
  "newCode": [
    "New six-number passcode",
    "Código nuevo de seis números",
    "新的六位数密码",
    "새 여섯 자리 암호"
  ],
  "recovery": [
    "Your 12-word recovery phrase",
    "Su frase de recuperación de 12 palabras",
    "您的 12 个单词恢复短语",
    "12단어 복구 문구"
  ],
  "loss": [
    "Lose the phone and the 12 words, and nobody, us included, can open the backup. Keep the words somewhere safe, away from this phone.",
    "Si pierde el teléfono y las 12 palabras, nadie, ni nosotros, podrá abrir la copia. Guarde las palabras en un lugar seguro, lejos de este teléfono.",
    "如果手机和这 12 个单词都丢了，任何人（包括我们）都打不开备份。请把这些单词放在安全的地方，不要和手机放在一起。",
    "휴대폰과 12단어를 모두 잃어버리면 저희를 포함해 누구도 백업을 열 수 없어요. 단어는 이 휴대폰과 떨어진 안전한 곳에 보관하세요."
  ],
  "writeWords": [
    "Write these words down in this order. This is the only time they are shown.",
    "Anote estas palabras en este orden. Solo se muestran esta vez.",
    "请按顺序写下这些单词。它们只会显示这一次。",
    "이 단어들을 순서대로 적어 두세요. 이번 한 번만 보여 드려요."
  ],
  "wroteWords": [
    "I've written them down ›",
    "Ya las anoté ›",
    "我已经写下来了 ›",
    "다 적었어요 ›"
  ],
  "confirmWords": [
    "Type your 12 words to confirm",
    "Escriba sus 12 palabras para confirmar",
    "输入您的 12 个单词进行确认",
    "확인을 위해 12단어를 입력하세요"
  ],
  "finish": [
    "Go to Home ›",
    "Ir al inicio ›",
    "前往主页 ›",
    "홈으로 가기 ›"
  ],
  "words": [
    "12 words, separated by spaces",
    "12 palabras, separadas por espacios",
    "12 个单词，用空格隔开",
    "12단어, 띄어쓰기로 구분"
  ],
  "folders": [
    "Folders",
    "Carpetas",
    "文件夹",
    "폴더"
  ],
  "home": [
    "Your folders",
    "Sus carpetas",
    "您的文件夹",
    "내 폴더"
  ],
  "backup": [
    "Backup",
    "Copia",
    "备份",
    "백업"
  ],
  "settings": [
    "Settings",
    "Ajustes",
    "设置",
    "설정"
  ],
  "homeIntro": [
    "Free plan: {n} of 25 items used.",
    "Plan gratis: {n} de 25 documentos usados.",
    "免费版：已使用 {n}/25 项。",
    "무료 플랜: 25개 중 {n}개 사용."
  ],
  "plusCount": [
    "{n} items · Plus",
    "{n} documentos · Plus",
    "{n} 项 · Plus",
    "{n}개 항목 · Plus"
  ],
  "hideHint": [
    "Don't need a folder? Hide it in Settings.",
    "¿No necesita una carpeta? Ocúltela en Ajustes.",
    "不需要某个文件夹？可以在“设置”里隐藏。",
    "필요 없는 폴더는 설정에서 숨길 수 있어요."
  ],
  "add": [
    "+ Add something",
    "+ Añadir algo",
    "+ 添加内容",
    "+ 추가하기"
  ],
  "open": [
    "Open ›",
    "Abrir ›",
    "打开 ›",
    "열기 ›"
  ],
  "items": [
    "items",
    "documentos",
    "项",
    "개 항목"
  ],
  "suggested": [
    "Start with whatever you have. Every line is optional.",
    "Empiece con lo que tenga. Cada línea es opcional.",
    "有什么就先放什么。每一行都可以跳过。",
    "가진 것부터 시작하세요. 모든 줄은 선택 사항이에요."
  ],
  "checklist": [
    "Checklist",
    "Lista",
    "清单",
    "체크리스트"
  ],
  "autoTick": [
    "A line ticks itself when you add something to it.",
    "Una línea se marca cuando le añade un documento.",
    "给某一行添加内容后，它会自动勾选。",
    "줄에 항목을 추가하면 자동으로 체크돼요."
  ],
  "stateRules": [
    "Your state's rules ›",
    "Las reglas de su estado ›",
    "您所在州的规定 ›",
    "거주하는 주의 규정 ›"
  ],
  "newest": [
    "Items, newest first",
    "Documentos, el más reciente primero",
    "项目，最新的在前",
    "항목, 최신순"
  ],
  "empty": [
    "Add what you have, when you have it.",
    "Añada lo que tenga, cuando lo tenga.",
    "有什么就加什么，随时都可以。",
    "가진 것을, 생길 때마다 추가하세요."
  ],
  "folderPdf": [
    "Make a PDF of this folder ›",
    "Hacer un PDF de esta carpeta ›",
    "把这个文件夹做成 PDF ›",
    "이 폴더를 PDF로 만들기 ›"
  ],
  "educational": [
    "Educational only. Not legal advice.",
    "Solo para información. No es asesoría legal.",
    "仅供参考，不构成法律建议。",
    "정보 제공용입니다. 법률 자문이 아닙니다."
  ],
  "folderFoot": [
    "Dated, organized, ready to share with your lawyer. Educational only. Not legal advice.",
    "Con fecha, en orden y listo para su abogado. Solo para información. No es asesoría legal.",
    "注明日期、整理有序，方便您和律师分享。仅供参考，不构成法律建议。",
    "날짜가 적혀 있고 정리되어 있어 변호사와 공유하기 쉬워요. 정보 제공용입니다. 법률 자문이 아닙니다."
  ],
  "vaScope": [
    "This folder keeps your papers in order. It does not prepare, file or judge a claim.",
    "Esta carpeta mantiene sus documentos en orden. No prepara, presenta ni evalúa un reclamo.",
    "这个文件夹帮您整理文件。它不会准备、提交或评估任何索赔。",
    "이 폴더는 서류 정리를 돕습니다. 청구서를 준비하거나 제출하거나 판단하지 않습니다."
  ],
  "vaHelp": [
    "Free help from a VA-accredited representative:",
    "Ayuda gratuita de un representante acreditado por el VA:",
    "VA 认可的代表可以免费帮助您：",
    "VA 공인 대리인의 무료 도움:"
  ],
  "vaLink": [
    "find one on VA.gov ›",
    "buscar en VA.gov ›",
    "在 VA.gov 上查找 ›",
    "VA.gov에서 찾기 ›"
  ],
  "vaDisclaimer": [
    "Educational only. Not legal advice. KeepMyProof is not affiliated with the VA.",
    "Solo para información. No es asesoría legal. KeepMyProof no está afiliado al VA.",
    "仅供参考，不构成法律建议。KeepMyProof 与 VA（美国退伍军人事务部）没有任何关联。",
    "정보 제공용입니다. 법률 자문이 아닙니다. KeepMyProof는 VA(미국 보훈부)와 관련이 없습니다."
  ],
  "addTo": [
    "Add to {folder}",
    "Añadir a {folder}",
    "添加到{folder}",
    "{folder}에 추가"
  ],
  "photo": [
    "Photo",
    "Foto",
    "照片",
    "사진"
  ],
  "file": [
    "File",
    "Archivo",
    "文件",
    "파일"
  ],
  "note": [
    "Note",
    "Nota",
    "笔记",
    "메모"
  ],
  "pick": [
    "Choose a file ›",
    "Elegir un archivo ›",
    "选择文件 ›",
    "파일 선택 ›"
  ],
  "pickPhoto": [
    "Choose a photo ›",
    "Elegir una foto ›",
    "选择照片 ›",
    "사진 선택 ›"
  ],
  "kept": [
    "Kept exactly as it is. Nothing is uploaded.",
    "Se guarda tal como está. No se sube nada.",
    "按原样保存，不会上传任何内容。",
    "원본 그대로 보관돼요. 아무것도 업로드되지 않아요."
  ],
  "change": [
    "Change ›",
    "Cambiar ›",
    "更改 ›",
    "변경 ›"
  ],
  "name": [
    "Name it",
    "Póngale un nombre",
    "起个名称",
    "이름 정하기"
  ],
  "when": [
    "When did it happen?",
    "¿Cuándo pasó?",
    "这件事是什么时候发生的？",
    "언제 있었던 일인가요?"
  ],
  "unknownCheck": [
    "I'm not sure of the date",
    "No estoy seguro de la fecha",
    "我不确定日期",
    "날짜를 잘 모르겠어요"
  ],
  "unknown": [
    "Date not sure",
    "Fecha no segura",
    "日期不确定",
    "날짜 불확실"
  ],
  "dateFormat": [
    "Date (YYYY-MM-DD)",
    "Fecha (AAAA-MM-DD)",
    "日期（YYYY-MM-DD）",
    "날짜 (YYYY-MM-DD)"
  ],
  "line": [
    "Checklist line",
    "Línea de la lista",
    "清单中的一行",
    "체크리스트 줄"
  ],
  "noLine": [
    "No checklist line",
    "Sin línea de la lista",
    "不属于清单中的任何一行",
    "체크리스트 줄 없음"
  ],
  "yourNote": [
    "Your note",
    "Su nota",
    "您的笔记",
    "내 메모"
  ],
  "optionalNote": [
    "Your note (optional)",
    "Su nota (opcional)",
    "您的笔记（可选）",
    "내 메모 (선택)"
  ],
  "addingDate": [
    "The app also notes when you saved this. That shows when you wrote it down, not that it happened.",
    "La app también anota cuándo lo guardó. Eso muestra cuándo lo escribió, no que haya pasado.",
    "应用还会记下您保存的时间。这只表示您是什么时候记录的，并不能证明事情确实发生过。",
    "앱은 저장한 시점도 기록해요. 이는 언제 기록했는지를 보여 줄 뿐, 그 일이 있었다는 증거는 아니에요."
  ],
  "saveTo": [
    "Save to {folder} ✓",
    "Guardar en {folder} ✓",
    "保存到{folder} ✓",
    "{folder}에 저장 ✓"
  ],
  "cancel": [
    "Cancel",
    "Cancelar",
    "取消",
    "취소"
  ],
  "happened": [
    "Happened",
    "Pasó",
    "发生日期",
    "있었던 날"
  ],
  "saved": [
    "Saved on this phone",
    "Guardado en este teléfono",
    "保存在这部手机上",
    "이 휴대폰에 저장"
  ],
  "changed": [
    "Changed",
    "Modificado",
    "修改日期",
    "변경"
  ],
  "never": [
    "Never",
    "Nunca",
    "从未",
    "없음"
  ],
  "yourDate": [
    "(your date)",
    "(su fecha)",
    "（您填写的日期）",
    "(직접 입력한 날짜)"
  ],
  "dateHonesty": [
    "\"Saved on this phone\" is the phone's clock. It shows when you wrote this down, not proof of when it happened. If you change the note, the earlier version is kept too.",
    "\"Guardado en este teléfono\" usa el reloj del teléfono. Muestra cuándo lo escribió, no prueba de cuándo pasó. Si cambia la nota, también se guarda la versión anterior.",
    "“保存在这部手机上”用的是手机的时钟。它表示您是什么时候记录的，不能证明事情是什么时候发生的。如果您修改了笔记，之前的版本也会保留。",
    "'이 휴대폰에 저장'은 휴대폰 시계를 기준으로 해요. 언제 기록했는지를 보여 줄 뿐, 그 일이 언제 있었는지에 대한 증거는 아니에요. 메모를 고쳐도 이전 버전이 함께 남아요."
  ],
  "edit": [
    "✎ Change it",
    "✎ Cambiarlo",
    "✎ 修改",
    "✎ 수정하기"
  ],
  "saveChanges": [
    "Save changes ✓",
    "Guardar cambios ✓",
    "保存修改 ✓",
    "변경 내용 저장 ✓"
  ],
  "confirmEdit": [
    "Save these changes?",
    "¿Guardar estos cambios?",
    "保存这些修改吗？",
    "변경 내용을 저장할까요?"
  ],
  "yesSave": [
    "Yes, save",
    "Sí, guardar",
    "是，保存",
    "네, 저장"
  ],
  "remove": [
    "Remove this item…",
    "Eliminar este documento…",
    "删除这一项…",
    "이 항목 삭제…"
  ],
  "confirmRemove": [
    "Remove this item?",
    "¿Eliminar este documento?",
    "要删除这一项吗？",
    "이 항목을 삭제할까요?"
  ],
  "yesRemove": [
    "Yes, remove",
    "Sí, eliminar",
    "是，删除",
    "네, 삭제"
  ],
  "keep": [
    "Keep",
    "Conservar",
    "保留",
    "유지"
  ],
  "earlier": [
    "Earlier version",
    "Versión anterior",
    "之前的版本",
    "이전 버전"
  ],
  "pdfTitle": [
    "Make a PDF of {folder}",
    "Hacer un PDF de {folder}",
    "把{folder}做成 PDF",
    "{folder} PDF 만들기"
  ],
  "pdfIntro": [
    "All {n} items, free. It includes a list of contents, both dates on every item, your notes, and every photo and page.",
    "Los {n} documentos, gratis. Incluye un índice, ambas fechas en cada documento, sus notas y cada foto y página.",
    "全部 {n} 项，免费。包括目录、每一项的两个日期、您的笔记，以及每张照片和每一页。",
    "{n}개 항목 전체, 무료예요. 목차, 항목마다 두 가지 날짜, 메모, 모든 사진과 페이지가 들어가요."
  ],
  "pdfWarning": [
    "Anyone you send the PDF to can read it. You choose where it goes.",
    "Quien reciba el PDF podrá leerlo. Usted elige adónde va.",
    "收到 PDF 的人都能阅读它。发给谁由您决定。",
    "PDF를 받은 사람은 누구나 읽을 수 있어요. 어디로 보낼지는 직접 정하세요."
  ],
  "savePdf": [
    "Save the PDF ›",
    "Guardar el PDF ›",
    "保存 PDF ›",
    "PDF 저장 ›"
  ],
  "saveOriginals": [
    "Also save the original files ›",
    "Guardar también los originales ›",
    "同时保存原始文件 ›",
    "원본 파일도 저장 ›"
  ],
  "plusPdf": [
    "With Plus you can also pick certain items or dates and add a cover page.",
    "Con Plus también puede elegir documentos o fechas y añadir una portada.",
    "使用 Plus，您还可以只选部分项目或日期，并添加封面。",
    "Plus를 쓰면 특정 항목이나 날짜만 고르고 표지도 넣을 수 있어요."
  ],
  "seePlus": [
    "See Plus ›",
    "Ver Plus ›",
    "查看 Plus ›",
    "Plus 보기 ›"
  ],
  "contents": [
    "Contents",
    "Índice",
    "目录",
    "목차"
  ],
  "chosen": [
    "Choose items or dates ›",
    "Elegir documentos o fechas ›",
    "选择项目或日期 ›",
    "항목이나 날짜 선택 ›"
  ],
  "allItems": [
    "All items",
    "Todos los documentos",
    "所有项目",
    "모든 항목"
  ],
  "from": [
    "From (YYYY-MM-DD, optional)",
    "Desde (AAAA-MM-DD, opcional)",
    "开始日期（YYYY-MM-DD，可选）",
    "시작 (YYYY-MM-DD, 선택)"
  ],
  "to": [
    "Through (YYYY-MM-DD, optional)",
    "Hasta (AAAA-MM-DD, opcional)",
    "结束日期（YYYY-MM-DD，可选）",
    "끝 (YYYY-MM-DD, 선택)"
  ],
  "cover": [
    "Cover note (optional)",
    "Nota de portada (opcional)",
    "封面说明（可选）",
    "표지 메모 (선택)"
  ],
  "unsupportedPdf": [
    "PDFs and photos appear as pages. Other file types are listed; save their originals separately.",
    "Los PDF y las fotos aparecen como páginas. Otros archivos se enumeran; guarde sus originales por separado.",
    "PDF 和照片会以页面形式出现。其他类型的文件只会列出名称，请另外保存它们的原始文件。",
    "PDF와 사진은 페이지로 들어가요. 다른 파일은 목록에만 표시되니 원본을 따로 저장하세요."
  ],
  "lastBackup": [
    "Last backup checked: {date}",
    "Última copia comprobada: {date}",
    "上次检查的备份：{date}",
    "마지막으로 확인한 백업: {date}"
  ],
  "noBackup": [
    "Last backup checked: not yet",
    "Última copia comprobada: todavía no",
    "上次检查的备份：还没有",
    "마지막으로 확인한 백업: 아직 없음"
  ],
  "newBackup": [
    "Your latest changes aren’t backed up yet",
    "Sus últimos cambios todavía no tienen copia de seguridad",
    "您最近的更改还没有备份",
    "최근 변경 내용이 아직 백업되지 않았어요"
  ],
  "backUp": [
    "Back up now ›",
    "Copiar ahora ›",
    "立即备份 ›",
    "지금 백업 ›"
  ],
  "backupCheck": [
    "Check the saved backup ›",
    "Comprobar la copia guardada ›",
    "检查已保存的备份 ›",
    "저장한 백업 확인 ›"
  ],
  "backupCheckHint": [
    "Choose the backup you saved to check every file. Sharing alone does not confirm it was saved.",
    "Elija la copia que guardó para comprobar cada archivo. Compartir no confirma que se haya guardado.",
    "选择您保存的备份，检查其中的每个文件。只是分享出去，并不能确认已经保存成功。",
    "저장한 백업을 골라 모든 파일을 확인하세요. 공유만으로는 저장됐는지 확인되지 않아요."
  ],
  "backupDestination": [
    "Save the encrypted file to your own iCloud Drive or Google Drive using your phone’s share sheet.",
    "Guarde el archivo cifrado en su iCloud Drive o Google Drive con la hoja para compartir del teléfono.",
    "用手机的分享菜单，把加密文件保存到您自己的 iCloud 云盘或 Google 云端硬盘。",
    "휴대폰의 공유 메뉴로 암호화된 파일을 내 iCloud Drive나 Google Drive에 저장하세요."
  ],
  "confirmed": [
    "✓ Written down and confirmed",
    "✓ Anotada y confirmada",
    "✓ 已写下并确认",
    "✓ 적어 두고 확인함"
  ],
  "newPhone": [
    "Lost or new phone?",
    "¿Teléfono perdido o nuevo?",
    "手机丢了或换了新手机？",
    "휴대폰을 잃어버렸거나 새로 바꾸셨나요?"
  ],
  "restoreHint": [
    "Install KeepMyProof, choose \"Restore a backup\" and type your 12 words. Everything comes back.",
    "Instale KeepMyProof, elija \"Restaurar una copia\" y escriba sus 12 palabras. Todo vuelve.",
    "安装 KeepMyProof，选择“恢复备份”，再输入您的 12 个单词。所有内容都会回来。",
    "KeepMyProof를 설치하고 '백업 복원'을 고른 뒤 12단어를 입력하세요. 모든 것이 돌아와요."
  ],
  "restore": [
    "Restore a backup ›",
    "Restaurar una copia ›",
    "恢复备份 ›",
    "백업 복원 ›"
  ],
  "restoreSafety": [
    "Every file is checked before anything is added. If something goes wrong, what's on this phone stays exactly as it is. Backup is free, always.",
    "Cada archivo se comprueba antes de añadir nada. Si algo sale mal, lo que hay en este teléfono queda exactamente igual. Las copias son gratis, siempre.",
    "在添加任何内容之前，每个文件都会先经过检查。如果出了问题，这部手机上的内容会保持原样。备份永远免费。",
    "무엇이든 추가하기 전에 모든 파일을 확인해요. 문제가 생기면 이 휴대폰의 내용은 그대로 유지돼요. 백업은 언제나 무료예요."
  ],
  "restoreChoose": [
    "Choose your encrypted backup ›",
    "Elegir su copia cifrada ›",
    "选择您的加密备份 ›",
    "암호화된 백업 선택 ›"
  ],
  "restoreDone": [
    "✓ Your backup was restored and every file checked.",
    "✓ Se restauró su copia y se comprobó cada archivo.",
    "✓ 您的备份已恢复，每个文件都已检查。",
    "✓ 백업을 복원했고 모든 파일을 확인했어요."
  ],
  "backupDone": [
    "✓ Backup checked.",
    "✓ Copia comprobada.",
    "✓ 备份已检查。",
    "✓ 백업을 확인했어요."
  ],
  "limitTitle": [
    "You've kept 25 items on the free plan",
    "Ya guardó 25 documentos en el plan gratis",
    "您在免费版中已保存 25 项",
    "무료 플랜에서 25개 항목을 보관했어요"
  ],
  "plusTitle": [
    "KeepMyProof Plus",
    "KeepMyProof Plus",
    "KeepMyProof Plus",
    "KeepMyProof Plus"
  ],
  "keepsFree": [
    "Everything you've kept stays yours. Opening, PDFs, saving originals, backup and restore stay free, always.",
    "Todo lo que guardó sigue siendo suyo. Abrir, hacer PDF, guardar los originales, la copia de seguridad y restaurar siguen gratis, siempre.",
    "您保存的一切仍然属于您。打开、制作 PDF、保存原始文件、备份和恢复永远免费。",
    "보관한 모든 것은 계속 내 것이에요. 열기, PDF 만들기, 원본 저장, 백업과 복원은 언제나 무료예요."
  ],
  "plusLets": [
    "Plus lets you keep adding:",
    "Con Plus puede seguir añadiendo:",
    "有了 Plus，您可以继续添加：",
    "Plus로 계속 추가할 수 있어요:"
  ],
  "unlimited": [
    "Unlimited items",
    "Documentos sin límite",
    "不限数量的项目",
    "무제한 항목"
  ],
  "custom": [
    "Your own folders and tags",
    "Sus propias carpetas y etiquetas",
    "您自己的文件夹和标签",
    "나만의 폴더와 태그"
  ],
  "selectedPdf": [
    "PDF of chosen items or dates, with a cover page",
    "PDF de documentos o fechas que elija, con portada",
    "只包含所选项目或日期的 PDF，带封面",
    "고른 항목이나 날짜만 담은 PDF, 표지 포함"
  ],
  "lifetimePrice": [
    "{price} once",
    "{price} una vez",
    "一次性 {price}",
    "{price} 한 번 결제"
  ],
  "annualPrice": [
    "{price} a year",
    "{price} al año",
    "每年 {price}",
    "연 {price}"
  ],
  "lifetimeTerms": [
    "Lifetime. One payment, no renewal. Plus stays yours for life.",
    "De por vida. Un solo pago, sin renovación. Plus es suyo de por vida.",
    "终身版。一次付款，不会续订。Plus 终身归您所有。",
    "평생 이용. 한 번 결제하고 갱신되지 않아요. Plus를 평생 쓸 수 있어요."
  ],
  "annualTerms": [
    "Renews every year on the same date until you cancel. Cancel any time: iPhone Settings › your name › Subscriptions (Android: Play Store › Payments & subscriptions). We remind you in the app 7 days before it renews. If you cancel, you keep every item.",
    "Se renueva cada año en la misma fecha hasta que lo cancele. Cancele cuando quiera: Ajustes del iPhone › su nombre › Suscripciones (Android: Play Store › Pagos y suscripciones). Le avisamos en la app 7 días antes de renovar. Si cancela, conserva todos sus documentos.",
    "每年在同一日期自动续订，直到您取消为止。随时可以取消：iPhone“设置”› 您的姓名 ›“订阅”（Android：Play 商店 › 付款和订阅）。续订前 7 天，我们会在应用内提醒您。取消后，您的所有项目都会保留。",
    "취소할 때까지 매년 같은 날짜에 갱신돼요. 언제든 취소할 수 있어요: iPhone 설정 › 내 이름 › 구독 (Android: Play 스토어 › 결제 및 정기 결제). 갱신 7일 전에 앱에서 알려 드려요. 취소해도 모든 항목은 그대로 남아요."
  ],
  "buyLifetime": [
    "Buy lifetime for {price} ›",
    "Comprar de por vida por {price} ›",
    "以 {price} 购买终身版 ›",
    "{price}에 평생 이용권 구매 ›"
  ],
  "buyAnnual": [
    "Subscribe for {price} a year ›",
    "Suscribirse por {price} al año ›",
    "以每年 {price} 订阅 ›",
    "연 {price}에 구독 ›"
  ],
  "launch": [
    "{price} for life — launch week only, then {normal}",
    "{price} de por vida — solo la semana de lanzamiento, después {normal}",
    "终身 {price}，仅限上线首周，之后为 {normal}",
    "평생 {price}, 출시 첫 주에만, 이후 {normal}"
  ],
  "notNow": [
    "Not now",
    "Ahora no",
    "以后再说",
    "나중에"
  ],
  "storeConfirm": [
    "Your store shows the price in your money and asks you to confirm.",
    "Su tienda muestra el precio en su moneda y le pide confirmar.",
    "应用商店会以您的货币显示价格，并请您确认。",
    "스토어에서 내 통화로 가격을 보여 주고 확인을 요청해요."
  ],
  "restorePurchases": [
    "Restore purchases ›",
    "Restaurar compras ›",
    "恢复购买 ›",
    "구매 복원 ›"
  ],
  "terms": [
    "Terms ›",
    "Términos ›",
    "条款 ›",
    "이용 약관 ›"
  ],
  "privacy": [
    "Privacy ›",
    "Privacidad ›",
    "隐私 ›",
    "개인정보 ›"
  ],
  "mock": [
    "Purchases are not available in this preview. No payment will be taken.",
    "Las compras no están disponibles en esta versión de prueba. No se cobrará nada.",
    "这个预览版无法购买，不会收取任何费用。",
    "이 미리보기에서는 구매할 수 없어요. 결제되지 않아요."
  ],
  "manage": [
    "Manage or cancel subscription ›",
    "Administrar o cancelar suscripción ›",
    "管理或取消订阅 ›",
    "구독 관리 또는 취소 ›"
  ],
  "renewal": [
    "Your yearly plan renews on {date}. You can cancel in your phone’s subscription settings.",
    "Su plan anual se renueva el {date}. Puede cancelarlo en los ajustes de suscripciones del teléfono.",
    "您的年度方案将于 {date} 续订。您可以在手机的订阅设置中取消。",
    "연간 플랜이 {date}에 갱신돼요. 휴대폰의 구독 설정에서 취소할 수 있어요."
  ],
  "hide": [
    "Hide folder",
    "Ocultar carpeta",
    "隐藏文件夹",
    "폴더 숨기기"
  ],
  "show": [
    "Show folder",
    "Mostrar carpeta",
    "显示文件夹",
    "폴더 보이기"
  ],
  "ownFolder": [
    "+ Create your own folder ›",
    "+ Crear su propia carpeta ›",
    "+ 建立自己的文件夹 ›",
    "+ 나만의 폴더 만들기 ›"
  ],
  "folderName": [
    "Folder name",
    "Nombre de la carpeta",
    "文件夹名称",
    "폴더 이름"
  ],
  "createFolder": [
    "Create folder ✓",
    "Crear carpeta ✓",
    "建立文件夹 ✓",
    "폴더 만들기 ✓"
  ],
  "tags": [
    "Tags (separated by commas)",
    "Etiquetas (separadas por comas)",
    "标签（用逗号隔开）",
    "태그 (쉼표로 구분)"
  ],
  "lockNow": [
    "Lock my papers ›",
    "Cerrar mis documentos ›",
    "锁上我的文件 ›",
    "내 서류 잠그기 ›"
  ],
  "noAnalytics": [
    "No account. No ads. No analytics. Your papers are never sent to a model or our servers.",
    "Sin cuenta. Sin anuncios. Sin análisis de uso. Sus documentos nunca se envían a un modelo ni a nuestros servidores.",
    "无需账户。没有广告。没有使用分析。您的文件绝不会发送给任何 AI 模型或我们的服务器。",
    "계정 없음. 광고 없음. 사용 분석 없음. 서류는 AI 모델이나 저희 서버로 절대 전송되지 않아요."
  ],
  "error": [
    "That did not finish. Your saved papers are still here. Please try again.",
    "No se pudo terminar. Sus documentos guardados siguen aquí. Inténtelo de nuevo.",
    "操作没有完成。您已保存的文件都还在。请再试一次。",
    "완료되지 않았어요. 저장한 서류는 그대로 있어요. 다시 시도해 주세요."
  ],
  "WAIT": [
    "Please wait before trying again. Wrong guesses never erase your papers.",
    "Espere antes de volver a intentarlo. Los intentos incorrectos nunca borran sus documentos.",
    "请稍等再试。输错密码绝不会删除您的文件。",
    "잠시 후 다시 시도하세요. 잘못 입력해도 서류는 절대 지워지지 않아요."
  ],
  "PASSCODE_WRONG": [
    "That passcode did not match. Please wait, then try again.",
    "Ese código no coincide. Espere y vuelva a intentarlo.",
    "密码不正确。请稍等后再试。",
    "암호가 맞지 않아요. 잠시 후 다시 시도하세요."
  ],
  "PASSCODE_INVALID": [
    "Use six numbers and enter the same code twice.",
    "Use seis números y escriba el mismo código dos veces.",
    "请使用六位数字，并输入两次相同的密码。",
    "숫자 여섯 자리를 쓰고, 같은 암호를 두 번 입력하세요."
  ],
  "RECOVERY_INVALID": [
    "Those words did not match. Check all 12 words and their order.",
    "Esas palabras no coinciden. Revise las 12 palabras y su orden.",
    "这些单词不正确。请检查全部 12 个单词及其顺序。",
    "단어가 맞지 않아요. 12단어 모두와 순서를 확인하세요."
  ],
  "BIOMETRIC_FAILED": [
    "Face ID or biometrics could not open your papers. Use your passcode or recovery phrase.",
    "Face ID o la biometría no pudo abrir sus documentos. Use su código o frase de recuperación.",
    "Face ID 或生物识别无法打开您的文件。请使用密码或恢复短语。",
    "Face ID나 생체 인증으로 서류를 열지 못했어요. 암호나 복구 문구를 사용하세요."
  ],
  "BACKUP_OUTDATED": [
    "That backup does not contain your latest changes. Save a new backup and check it.",
    "Esa copia no contiene sus últimos cambios. Guarde una copia nueva y compruébela.",
    "这个备份不包含您最近的更改。请保存一个新备份并进行检查。",
    "이 백업에는 최근 변경 내용이 없어요. 새 백업을 저장하고 확인하세요."
  ],
  "RESTORE_CONFLICT": [
    "This backup has a different version of an item already here. Nothing was changed. Keep both backups.",
    "Esta copia tiene una versión distinta de un documento que ya está aquí. No se cambió nada. Conserve ambas copias.",
    "这个备份中有一项和手机上已有的项目版本不同。什么都没有更改。请保留两个备份。",
    "이 백업에는 휴대폰에 이미 있는 항목과 다른 버전이 있어요. 아무것도 바뀌지 않았어요. 두 백업을 모두 보관하세요."
  ],
  "DEVICE_KEY_MISSING": [
    "This phone cannot open the vault. Restore your encrypted backup with your 12 words on a fresh install.",
    "Este teléfono no puede abrir la carpeta privada. Restaure su copia cifrada con sus 12 palabras en una instalación nueva.",
    "这部手机无法打开保险库。请在新安装的应用中，用您的 12 个单词恢复加密备份。",
    "이 휴대폰에서 보관함을 열 수 없어요. 앱을 새로 설치한 뒤 12단어로 암호화된 백업을 복원하세요."
  ],
  "FILE_TOO_LARGE": [
    "Choose a file smaller than 25 MB for this version.",
    "Elija un archivo menor de 25 MB para esta versión.",
    "当前版本请选择小于 25 MB 的文件。",
    "이 버전에서는 25MB보다 작은 파일을 선택하세요."
  ],
  "fileRequired": [
    "Choose a file or photo and give it a name before saving.",
    "Elija un archivo o foto y póngale un nombre antes de guardar.",
    "保存前，请选择一个文件或照片并起个名称。",
    "저장하기 전에 파일이나 사진을 고르고 이름을 정하세요."
  ],
  "invalidDate": [
    "Enter a valid date as YYYY-MM-DD, or choose that you are not sure.",
    "Escriba una fecha válida como AAAA-MM-DD o indique que no está seguro.",
    "请按 YYYY-MM-DD 输入有效日期，或选择“我不确定日期”。",
    "YYYY-MM-DD 형식으로 올바른 날짜를 입력하거나 '날짜를 잘 모르겠어요'를 고르세요."
  ],
  "working": [
    "Working…",
    "En proceso…",
    "处理中…",
    "처리 중…"
  ],
  "restoredPurchases": [
    "✓ Purchases checked.",
    "✓ Compras comprobadas.",
    "✓ 已检查购买记录。",
    "✓ 구매 내역을 확인했어요."
  ],
  "noPurchase": [
    "No active Plus purchase was found. Your papers remain available.",
    "No se encontró una compra activa de Plus. Sus documentos siguen disponibles.",
    "没有找到有效的 Plus 购买记录。您的文件仍然可以使用。",
    "유효한 Plus 구매 내역이 없어요. 서류는 계속 이용할 수 있어요."
  ],
  "backupFailed": [
    "The backup check failed. Your papers on this phone have not changed. Try checking the saved copy again.",
    "Falló la comprobación de la copia. Sus documentos en este teléfono no cambiaron. Intente comprobar la copia guardada otra vez.",
    "备份检查失败。这部手机上的文件没有任何改变。请再次检查已保存的副本。",
    "백업 확인에 실패했어요. 이 휴대폰의 서류는 바뀌지 않았어요. 저장한 사본을 다시 확인해 보세요."
  ],
  "language": [
    "Language",
    "Idioma",
    "语言",
    "언어"
  ]
} as const satisfies Record<string, readonly [en: string, es: string, zh: string, ko: string]>;
export type StringKey = keyof typeof strings;
export function copy(lang: Lang) { return (key: StringKey, values: Record<string,string|number> = {}): string => {
  const at = LANGS.indexOf(lang);
  if (at < 0) throw Error(`LANG_UNKNOWN ${lang}`);
  let s: string = strings[key][at];
  for (const [name,value] of Object.entries(values)) s = s.replaceAll(`{${name}}`, String(value));
  return s;
}; }
