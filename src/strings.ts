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
    "Keep the papers you already have, private on this device.",
    "Guarde los documentos que ya tiene, privados en este dispositivo.",
    "把您已有的文件保存在这台设备上，保持私密。",
    "이미 가지고 있는 서류를 이 기기에 비공개로 보관하세요."
  ],
  "vaultTitle": [
    "Your private vault for photos and documents",
    "Su bóveda privada para fotos y documentos",
    "您的私密保险箱，存放照片和文件",
    "사진과 서류를 위한 나만의 비공개 금고"
  ],
  "vaultLock": [
    "Locked with your passcode or {bio}. Nothing you keep here shows up in your camera roll.",
    "Protegida con su código o {bio}. Nada de lo que guarde aquí aparece en el carrete de fotos.",
    "用密码或{bio}上锁。保存在这里的内容不会出现在相册中。",
    "암호나 {bio}(으)로 잠겨요. 여기에 보관한 것은 사진 앱의 앨범에 나타나지 않아요."
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
    "Keeps a private copy here. On iPhone and iPad you can then remove the original from Photos.",
    "Guarda una copia privada aquí. En iPhone y iPad, después puede quitar el original de Fotos.",
    "在这里保存一份私密副本。在 iPhone 和 iPad 上，之后可以从“照片”中移除原图。",
    "여기에 비공개 사본을 보관해요. iPhone과 iPad에서는 그다음 사진 앱의 원본을 삭제할 수 있어요."
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
    "Stays on this device",
    "Se queda en este dispositivo",
    "只保存在这台设备上",
    "이 기기에만 저장"
  ],
  "local": [
    "Locked and scrambled. Nothing leaves unless you send it or back it up.",
    "Bajo llave y cifrado. Nada sale a menos que usted lo envíe o haga una copia.",
    "已上锁并加密。除非您自己发送或备份，否则任何内容都不会离开这台设备。",
    "잠금과 암호화로 보호돼요. 직접 보내거나 백업하지 않는 한 아무것도 밖으로 나가지 않아요."
  ],
  "firstFree": [
    "Free for your first 25 items",
    "Gratis para sus primeros 25 documentos",
    "前 25 项免费",
    "처음 25개 항목은 무료"
  ],
  "five": [
    "All {n} folders included.",
    "Incluye las {n} carpetas.",
    "包含全部 {n} 个文件夹。",
    "{n}개 폴더가 모두 포함돼요."
  ],
  "lawFirm": [
    "KeepMyProof keeps your papers in order. It is not a law firm and does not give legal advice.",
    "KeepMyProof mantiene sus documentos en orden. No es un bufete ni da asesoría legal.",
    "KeepMyProof 帮您整理文件。它不是律师事务所，也不提供法律建议。",
    "KeepMyProof는 서류 정리를 돕습니다. 법률 사무소가 아니며 법률 자문을 제공하지 않습니다."
  ],
  "step1": [
    "Step 1 of 4",
    "Paso 1 de 4",
    "第 1 步，共 4 步",
    "4단계 중 1단계"
  ],
  "step2": [
    "Step 2 of 4",
    "Paso 2 de 4",
    "第 2 步，共 4 步",
    "4단계 중 2단계"
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
    "Six numbers. Use a different one from your device's, so someone who knows your device code can't open your papers.",
    "Seis números. Use uno distinto al del dispositivo, para que quien conozca ese código no pueda abrir sus documentos.",
    "六位数字。请使用和设备解锁密码不同的数字，这样知道您设备密码的人也打不开您的文件。",
    "숫자 여섯 자리예요. 기기 암호와 다른 숫자를 쓰세요. 그래야 기기 암호를 아는 사람도 서류를 열 수 없어요."
  ],
  "removeAsk": [
    "Remove the original from Photos?",
    "¿Quitar el original de Fotos?",
    "要从“照片”中移除原图吗？",
    "사진 앱에서 원본을 삭제할까요?"
  ],
  "removeWhy": [
    "Your copy is saved here. The original is still in Photos, where anyone who opens Photos can see it. If you remove it, your device asks you to confirm, and it stays in Recently Deleted for 30 days.",
    "Su copia está guardada aquí. El original sigue en Fotos, donde cualquiera que abra Fotos puede verlo. Si lo quita, su dispositivo le pedirá que lo confirme y quedará en el álbum Eliminado durante 30 días.",
    "您的副本已保存在这里。原图仍在“照片”中，任何打开“照片”的人都能看到。如果您移除它，设备会请您确认，照片会在“最近删除”中保留 30 天。",
    "사본은 여기에 저장되었습니다. 원본은 아직 사진 앱에 있어 사진 앱을 여는 누구나 볼 수 있습니다. 삭제하면 기기가 확인을 요청하며, 사진은 30일 동안 '최근 삭제된 항목'에 남습니다."
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
    "After adding a photo, offer to remove it from Photos",
    "Después de agregar una foto, ofrecer quitarla de Fotos",
    "添加照片后，提供从“照片”中移除原图的选项",
    "사진을 추가한 뒤 사진 앱에서 삭제할지 묻기"
  ],
  "removeSettingHint": [
    "Nothing leaves Photos unless you tap Remove and confirm on this device.",
    "Nada sale de Fotos a menos que toque Quitar y lo confirme en este dispositivo.",
    "除非您点按“移除”并在此设备上确认，否则不会从“照片”中移除任何内容。",
    "'삭제'를 누르고 이 기기에서 확인하지 않으면 사진 앱에서 아무것도 삭제되지 않습니다."
  ],
  "biometrics": [
    "Also open with {bio}",
    "Abrir también con {bio}",
    "也可以用{bio}打开",
    "{bio}(으)로도 열기"
  ],
  "codeWorks": [
    "Your passcode still works.",
    "Su código sigue funcionando.",
    "您的密码仍然可以使用。",
    "암호도 계속 사용할 수 있어요."
  ],
  "wrongGuesses": [
    "After a few wrong guesses the app makes you wait, longer each time. It never erases your papers. Forgot the passcode? You can set a new one with {bio} or your recovery phrase.",
    "Después de algunos intentos incorrectos, la app le hace esperar, cada vez más. Nunca borra sus documentos. ¿Olvidó el código? Puede crear uno nuevo con {bio} o con su frase de recuperación.",
    "输错几次后，应用会让您等待，而且一次比一次久，但绝不会删除您的文件。忘记密码？可以用{bio}或恢复短语设置新密码。",
    "몇 번 잘못 입력하면 기다려야 하고, 그 시간은 점점 길어지지만 서류는 절대 지워지지 않아요. 암호를 잊으셨나요? {bio} 또는 복구 문구로 새 암호를 만들 수 있어요."
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
    "Open with {bio} ›",
    "Abrir con {bio} ›",
    "用{bio}打开 ›",
    "{bio}(으)로 열기 ›"
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
    "Lose the device and the 12 words, and nobody, us included, can open the backup. Keep the words somewhere safe, away from this device.",
    "Si pierde el dispositivo y las 12 palabras, nadie, ni nosotros, podrá abrir la copia. Guarde las palabras en un lugar seguro, lejos de este dispositivo.",
    "如果设备和这 12 个单词都丢了，任何人（包括我们）都打不开备份。请把这些单词放在安全的地方，不要和设备放在一起。",
    "기기와 12단어를 모두 잃어버리면 저희를 포함해 누구도 백업을 열 수 없어요. 단어는 이 기기와 떨어진 안전한 곳에 보관하세요."
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
    "Choose photos ›",
    "Elegir fotos ›",
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
    "MM/DD/YYYY",
    "MM/DD/AAAA",
    "MM/DD/YYYY（月/日/年）",
    "MM/DD/YYYY (월/일/연도)"
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
    "Saved on this device",
    "Guardado en este dispositivo",
    "保存在这台设备上",
    "이 기기에 저장"
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
    "\"Saved on this device\" is the device's clock. It shows when you wrote this down, not proof of when it happened. If you change the note, the earlier version is kept too.",
    "\"Guardado en este dispositivo\" usa el reloj del dispositivo. Muestra cuándo lo escribió, no prueba de cuándo pasó. Si cambia la nota, también se guarda la versión anterior.",
    "“保存在这台设备上”用的是设备的时钟。它表示您是什么时候记录的，不能证明事情是什么时候发生的。如果您修改了笔记，之前的版本也会保留。",
    "'이 기기에 저장'은 기기 시계를 기준으로 해요. 언제 기록했는지를 보여 줄 뿐, 그 일이 언제 있었는지에 대한 증거는 아니에요. 메모를 고쳐도 이전 버전이 함께 남아요."
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
    "With Plus you can also choose a date range and add a cover page.",
    "Con Plus también puede elegir un rango de fechas y añadir una portada.",
    "使用 Plus，您还可以选择日期范围并添加封面。",
    "Plus를 쓰면 기간을 고르고 표지도 넣을 수 있어요."
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
    "Choose dates and a cover page ›",
    "Elegir fechas y portada ›",
    "选择日期和封面 ›",
    "기간과 표지 고르기 ›"
  ],
  "allItems": [
    "All",
    "Todos",
    "全部",
    "전체"
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
    "Save the encrypted file to your own iCloud Drive or Google Drive using your device’s share sheet.",
    "Guarde el archivo cifrado en su iCloud Drive o Google Drive con la hoja para compartir del dispositivo.",
    "用设备的分享菜单，把加密文件保存到您自己的 iCloud 云盘或 Google 云端硬盘。",
    "기기의 공유 메뉴로 암호화된 파일을 내 iCloud Drive나 Google Drive에 저장하세요."
  ],
  "confirmed": [
    "✓ Written down and confirmed",
    "✓ Anotada y confirmada",
    "✓ 已写下并确认",
    "✓ 적어 두고 확인함"
  ],
  "newPhone": [
    "Lost or new device?",
    "¿Dispositivo perdido o nuevo?",
    "设备丢了或换了新设备？",
    "기기를 잃어버렸거나 새로 바꾸셨나요?"
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
    "Every file is checked before anything is added. If something goes wrong, what's on this device stays exactly as it is. Backup is free, always.",
    "Cada archivo se comprueba antes de añadir nada. Si algo sale mal, lo que hay en este dispositivo queda exactamente igual. Las copias son gratis, siempre.",
    "在添加任何内容之前，每个文件都会先经过检查。如果出了问题，这台设备上的内容会保持原样。备份永远免费。",
    "무엇이든 추가하기 전에 모든 파일을 확인해요. 문제가 생기면 이 기기의 내용은 그대로 유지돼요. 백업은 언제나 무료예요."
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
    "PDF of a date range, with a cover page",
    "PDF de un rango de fechas, con portada",
    "按日期范围生成 PDF，带封面",
    "기간을 골라 만드는 PDF, 표지 포함"
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
    "Renews every year on the same date until you cancel. Cancel any time: Settings › your name › Subscriptions (Android: Play Store › Payments & subscriptions). We remind you in the app 7 days before it renews. If you cancel, you keep every item.",
    "Se renueva cada año en la misma fecha hasta que lo cancele. Cancele cuando quiera: Ajustes › su nombre › Suscripciones (Android: Play Store › Pagos y suscripciones). Le avisamos en la app 7 días antes de renovar. Si cancela, conserva todos sus documentos.",
    "每年在同一日期自动续订，直到您取消为止。随时可以取消：“设置”› 您的姓名 ›“订阅”（Android：Play 商店 › 付款和订阅）。续订前 7 天，我们会在应用内提醒您。取消后，您的所有项目都会保留。",
    "취소할 때까지 매년 같은 날짜에 갱신돼요. 언제든 취소할 수 있어요: 설정 › 내 이름 › 구독 (Android: Play 스토어 › 결제 및 정기 결제). 갱신 7일 전에 앱에서 알려 드려요. 취소해도 모든 항목은 그대로 남아요."
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
  "disclaimer": [
    "Disclaimer: not a lawyer or VA representative ›",
    "Aviso legal: no es abogado ni representante del VA ›",
    "免责声明：不是律师，也不是 VA 代表（英文） ›",
    "면책 고지: 변호사나 VA 대리인이 아닙니다(영어) ›"
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
    "Your yearly plan renews on {date}. You can cancel in your device’s subscription settings.",
    "Su plan anual se renueva el {date}. Puede cancelarlo en los ajustes de suscripciones del dispositivo.",
    "您的年度方案将于 {date} 续订。您可以在设备的订阅设置中取消。",
    "연간 플랜이 {date}에 갱신돼요. 기기의 구독 설정에서 취소할 수 있어요."
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
    "That passcode did not match. Try again.",
    "Ese código no coincide. Vuelva a intentarlo.",
    "密码不正确。请再试一次。",
    "암호가 맞지 않아요. 다시 시도하세요."
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
    "Opening with {bio} didn't work. Use your passcode or recovery phrase.",
    "No se pudo abrir con {bio}. Use su código o su frase de recuperación.",
    "用{bio}没能打开。请使用密码或恢复短语。",
    "{bio}(으)로 열지 못했어요. 암호나 복구 문구를 사용하세요."
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
    "这个备份中有一项和设备上已有的项目版本不同。什么都没有更改。请保留两个备份。",
    "이 백업에는 기기에 이미 있는 항목과 다른 버전이 있어요. 아무것도 바뀌지 않았어요. 두 백업을 모두 보관하세요."
  ],
  "DEVICE_KEY_MISSING": [
    "This device cannot open the vault. Restore your encrypted backup with your 12 words on a fresh install.",
    "Este dispositivo no puede abrir la carpeta privada. Restaure su copia cifrada con sus 12 palabras en una instalación nueva.",
    "这台设备无法打开保险库。请在新安装的应用中，用您的 12 个单词恢复加密备份。",
    "이 기기에서 보관함을 열 수 없어요. 앱을 새로 설치한 뒤 12단어로 암호화된 백업을 복원하세요."
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
  "noteNameRequired": [
    "Give your note a name before saving.",
    "Póngale un nombre a su nota antes de guardar.",
    "保存前，请给您的笔记起个名称。",
    "저장하기 전에 메모에 이름을 정하세요."
  ],
  "tagsLocked": [
    "Tags (Plus) ›",
    "Etiquetas (Plus) ›",
    "标签（Plus）›",
    "태그 (Plus) ›"
  ],
  "invalidDate": [
    "Type the date as MM/DD/YYYY, for example 11/03/2026.",
    "Escriba la fecha como MM/DD/AAAA, por ejemplo 11/03/2026.",
    "请按 月/日/年 输入日期，例如 11/03/2026。",
    "날짜를 월/일/연도 순서로 입력하세요. 예: 11/03/2026"
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
    "The backup check failed. Your papers on this device have not changed. Try checking the saved copy again.",
    "Falló la comprobación de la copia. Sus documentos en este dispositivo no cambiaron. Intente comprobar la copia guardada otra vez.",
    "备份检查失败。这台设备上的文件没有任何改变。请再次检查已保存的副本。",
    "백업 확인에 실패했어요. 이 기기의 서류는 바뀌지 않았어요. 저장한 사본을 다시 확인해 보세요."
  ],
  "language": [
    "Language",
    "Idioma",
    "语言",
    "언어"
  ],
  "heardTitle": [
    "How did you hear about KeepMyProof?",
    "¿Cómo supo de KeepMyProof?",
    "您是怎么知道 KeepMyProof 的？",
    "KeepMyProof를 어떻게 알게 되셨나요?"
  ],
  "heardOptional": [
    "Optional. Your answer stays on this device. It is sent only if you tap \"Send my answer\", from your own email.",
    "Opcional. Su respuesta se queda en este dispositivo. Solo se envía si toca \"Enviar mi respuesta\", desde su propio correo.",
    "可选。您的回答只保存在这台设备上。只有您点\"发送我的回答\"，才会从您自己的邮箱发出。",
    "선택 사항이에요. 답변은 이 기기에만 남아요. \"내 답변 보내기\"를 누를 때만 본인의 이메일로 보내져요."
  ],
  "heardGoogle": [
    "Google search",
    "Búsqueda en Google",
    "Google 搜索",
    "Google 검색"
  ],
  "heardAi": [
    "ChatGPT or another AI tool",
    "ChatGPT u otra herramienta de IA",
    "ChatGPT 或其他 AI 工具",
    "ChatGPT 또는 다른 AI 도구"
  ],
  "heardStore": [
    "App Store or Google Play search",
    "Búsqueda en App Store o Google Play",
    "App Store 或 Google Play 搜索",
    "App Store 또는 Google Play 검색"
  ],
  "heardAdvocate": [
    "A lawyer, advocate or counselor",
    "Un abogado, defensor o consejero",
    "律师、维权人员或咨询师",
    "변호사, 옹호 활동가 또는 상담사"
  ],
  "heardFriend": [
    "A friend or family member",
    "Un amigo o familiar",
    "朋友或家人",
    "친구나 가족"
  ],
  "heardSocial": [
    "Social media",
    "Redes sociales",
    "社交媒体",
    "소셜 미디어"
  ],
  "heardOther": [
    "Other",
    "Otro",
    "其他",
    "기타"
  ],
  "heardSend": [
    "Send my answer ›",
    "Enviar mi respuesta ›",
    "发送我的回答 ›",
    "내 답변 보내기 ›"
  ],
  "heardSkip": [
    "Skip ›",
    "Omitir ›",
    "跳过 ›",
    "건너뛰기 ›"
  ],
  "heardDone": [
    "Done ›",
    "Listo ›",
    "完成 ›",
    "완료 ›"
  ],
  "heardSettings": [
    "How you found us",
    "Cómo nos encontró",
    "您是怎么找到我们的",
    "저희를 알게 된 경로"
  ],
  "heardNone": [
    "Not answered",
    "Sin responder",
    "未回答",
    "답하지 않음"
  ],
  "heardChange": [
    "Change ›",
    "Cambiar ›",
    "更改 ›",
    "변경 ›"
  ],
  "heardNoMail": [
    "No email app is set up on this device. Your answer is saved here.",
    "No hay una app de correo en este dispositivo. Su respuesta quedó guardada aquí.",
    "这台设备上没有设置邮件应用。您的回答已保存在这里。",
    "이 기기에 설정된 이메일 앱이 없어요. 답변은 여기에 저장됐어요."
  ],
  "step3": [
    "Step 3 of 4",
    "Paso 3 de 4",
    "第 3 步，共 4 步",
    "4단계 중 3단계"
  ],
  "step4": [
    "Step 4 of 4",
    "Paso 4 de 4",
    "第 4 步，共 4 步",
    "4단계 중 4단계"
  ],
  "bioFaceId": [
    "Face ID",
    "Face ID",
    "Face ID",
    "Face ID"
  ],
  "bioTouchId": [
    "Touch ID",
    "Touch ID",
    "Touch ID",
    "Touch ID"
  ],
  "bioFingerprint": [
    "fingerprint",
    "huella digital",
    "指纹",
    "지문"
  ],
  "bioFace": [
    "face unlock",
    "desbloqueo facial",
    "面部解锁",
    "얼굴 인식"
  ],
  "invalidTime": [
    "Type the time like 6:30 PM, or leave it empty.",
    "Escriba la hora como 6:30 PM, o déjela vacía.",
    "请按 6:30 PM 这样的格式输入时间，或留空。",
    "시간은 6:30 PM처럼 입력하거나 비워 두세요."
  ],
  "dateConflict": [
    "You typed a date and also ticked “I'm not sure of the date”. Untick it to keep your date, or clear the date.",
    "Escribió una fecha y también marcó “No estoy seguro de la fecha”. Desmárquelo para conservar su fecha, o borre la fecha.",
    "您输入了日期，同时又勾选了“我不确定日期”。取消勾选即可保留您的日期，或清空日期。",
    "날짜를 입력하고 '날짜를 잘 모르겠어요'도 골랐어요. 날짜를 남기려면 선택을 해제하고, 아니면 날짜를 지우세요."
  ],
  "timeNoDate": [
    "Add the day for that time, or clear the time.",
    "Añada el día de esa hora, o borre la hora.",
    "请补上这个时间对应的日期，或清空时间。",
    "그 시간의 날짜를 넣거나 시간을 지우세요."
  ],
  "timeLabel": [
    "Time (optional)",
    "Hora (opcional)",
    "时间（可选）",
    "시간 (선택)"
  ],
  "timeFormat": [
    "e.g. 6:30 PM",
    "p. ej. 6:30 PM",
    "例如 6:30 PM",
    "예: 6:30 PM"
  ],
  "today": [
    "Today",
    "Hoy",
    "今天",
    "오늘"
  ],
  "whichFolder": [
    "Which folder?",
    "¿En qué carpeta?",
    "放在哪个文件夹？",
    "어느 폴더에 둘까요?"
  ],
  "photosChosen": [
    "{n} photos chosen. Each is saved as its own item, named by the day it was taken.",
    "{n} fotos elegidas. Cada una se guarda por separado, con el nombre del día en que se tomó.",
    "已选择 {n} 张照片。每张都单独保存，并以拍摄日期命名。",
    "사진 {n}장을 골랐어요. 한 장씩 따로 저장되고, 찍은 날짜로 이름이 붙어요."
  ],
  "photoTaken": [
    "Photo {date}",
    "Foto {date}",
    "照片 {date}",
    "사진 {date}"
  ],
  "namesFromPhotos": [
    "Name (optional for several photos)",
    "Nombre (opcional si son varias fotos)",
    "名称（多张照片时可不填）",
    "이름 (사진이 여러 장이면 선택)"
  ],
  "replaceFile": [
    "Replace the file ›",
    "Reemplazar el archivo ›",
    "替换文件 ›",
    "파일 바꾸기 ›"
  ],
  "replaceKept": [
    "The earlier file's name stays in this item's history.",
    "El nombre del archivo anterior queda en el historial de este documento.",
    "之前文件的名称会保留在此项目的记录中。",
    "이전 파일 이름은 이 항목의 기록에 남아요."
  ],
  "wasIn": [
    "Was in: {folder}",
    "Estaba en: {folder}",
    "原来在：{folder}",
    "원래 폴더: {folder}"
  ],
  "wasFile": [
    "File was: {name}",
    "El archivo era: {name}",
    "原文件：{name}",
    "원래 파일: {name}"
  ],
  "includeHistory": [
    "Include earlier versions of each item",
    "Incluir versiones anteriores de cada documento",
    "包含每个项目的早期版本",
    "항목마다 이전 버전도 넣기"
  ],
  "pdfPick": [
    "Untick anything you don't want in this PDF.",
    "Desmarque lo que no quiera en este PDF.",
    "取消勾选不想放进这个 PDF 的内容。",
    "이 PDF에 넣고 싶지 않은 것은 선택을 해제하세요."
  ],
  "NOTHING_CHOSEN": [
    "Tick at least one item for the PDF.",
    "Marque al menos un documento para el PDF.",
    "请至少勾选一个项目放进 PDF。",
    "PDF에 넣을 항목을 하나 이상 고르세요."
  ],
  "search": [
    "Search your papers",
    "Buscar en sus documentos",
    "搜索您的文件",
    "서류 검색"
  ],
  "searchNone": [
    "Nothing matches.",
    "No hay coincidencias.",
    "没有匹配的内容。",
    "맞는 항목이 없어요."
  ],
  "tagsShown": [
    "Tags",
    "Etiquetas",
    "标签",
    "태그"
  ],
  "tagFilter": [
    "Show only a tag",
    "Mostrar solo una etiqueta",
    "只看某个标签",
    "태그 하나만 보기"
  ],
  "eraseOpen": [
    "Erase everything on this device…",
    "Borrar todo en este dispositivo…",
    "清除这台设备上的所有内容…",
    "이 기기의 모든 것 지우기…"
  ],
  "eraseTitle": [
    "Erase everything on this device",
    "Borrar todo en este dispositivo",
    "清除这台设备上的所有内容",
    "이 기기의 모든 것 지우기"
  ],
  "eraseWarn": [
    "This deletes every paper, photo and note in KeepMyProof on this device, with the passcode and settings. A backup file you saved yourself is not touched. Anything not in a backup is gone for good.",
    "Esto elimina todos los documentos, fotos y notas de KeepMyProof en este dispositivo, junto con el código y los ajustes. Una copia de seguridad que usted guardó no se toca. Lo que no esté en una copia de seguridad se pierde para siempre.",
    "这会删除这台设备上 KeepMyProof 里的所有文件、照片和笔记，以及密码和设置。您自己保存的备份文件不受影响。不在备份里的内容将永久删除。",
    "이 기기의 KeepMyProof에 있는 모든 서류, 사진, 메모와 암호, 설정이 지워져요. 직접 저장한 백업 파일은 그대로 남아요. 백업에 없는 것은 영구히 지워져요."
  ],
  "eraseCode": [
    "Type your passcode to erase",
    "Escriba su código para borrar",
    "输入密码以清除",
    "지우려면 암호를 입력하세요"
  ],
  "eraseNow": [
    "Erase everything",
    "Borrar todo",
    "全部清除",
    "모두 지우기"
  ],
  "erased": [
    "Everything on this device was erased.",
    "Se borró todo en este dispositivo.",
    "这台设备上的所有内容都已清除。",
    "이 기기의 모든 것을 지웠어요."
  ],
  "changeCode": [
    "Change passcode ›",
    "Cambiar el código ›",
    "更改密码 ›",
    "암호 바꾸기 ›"
  ],
  "currentCode": [
    "Current passcode",
    "Código actual",
    "当前密码",
    "현재 암호"
  ],
  "codeChanged": [
    "Your new passcode is set.",
    "Su nuevo código está listo.",
    "新密码已设置。",
    "새 암호를 설정했어요."
  ],
  "renewWords": [
    "Make new recovery words ›",
    "Crear nuevas palabras de recuperación ›",
    "生成新的恢复短语 ›",
    "새 복구 문구 만들기 ›"
  ],
  "renewWhy": [
    "Lost the paper with your 12 words? Make new ones here. Backups made before still open only with the old words, so make a new backup afterwards.",
    "¿Perdió el papel con sus 12 palabras? Cree otras aquí. Las copias de seguridad anteriores solo se abren con las palabras viejas, así que haga una copia nueva después.",
    "写有 12 个词的纸丢了？可以在这里生成新的。之前的备份仍然只能用旧短语打开，所以之后请重新备份。",
    "12개 단어를 적은 종이를 잃어버렸나요? 여기서 새로 만드세요. 이전 백업은 예전 단어로만 열리니, 그다음 새로 백업하세요."
  ],
  "renewCode": [
    "Your passcode, to make new words",
    "Su código, para crear palabras nuevas",
    "输入密码以生成新短语",
    "새 문구를 만들려면 암호를 입력하세요"
  ],
  "continue": [
    "Continue ›",
    "Continuar ›",
    "继续 ›",
    "계속 ›"
  ],
  "wordsRenewed": [
    "New words saved. Now make a new backup with them.",
    "Palabras nuevas guardadas. Ahora haga una copia de seguridad nueva con ellas.",
    "新短语已保存。现在请用它重新备份。",
    "새 문구를 저장했어요. 이제 새 문구로 다시 백업하세요."
  ],
  "checkNow": [
    "Saved it? Now check it: choose the backup file you just saved.",
    "¿La guardó? Ahora compruébela: elija el archivo de copia que acaba de guardar.",
    "保存好了吗？现在检查一下：选择刚才保存的备份文件。",
    "저장했나요? 이제 확인하세요: 방금 저장한 백업 파일을 고르세요."
  ],
  "cannotShow": [
    "This kind of file can't be shown here. “Also save the original files” gives you the file itself.",
    "Este tipo de archivo no se puede mostrar aquí. “Guardar también los originales” le da el archivo.",
    "这类文件无法在这里显示。“同时保存原始文件”可以取得文件本身。",
    "이런 종류의 파일은 여기서 보여 줄 수 없어요. '원본 파일도 저장'으로 파일을 받을 수 있어요."
  ],
  "waitSeconds": [
    "Too many wrong tries. You can try again in {n} seconds. Wrong guesses never erase your papers.",
    "Demasiados intentos incorrectos. Puede volver a intentarlo en {n} segundos. Los intentos incorrectos nunca borran sus documentos.",
    "输错次数过多。{n} 秒后可以再试。输错密码绝不会删除您的文件。",
    "잘못 입력한 횟수가 많아요. {n}초 뒤에 다시 시도할 수 있어요. 잘못 입력해도 서류는 절대 지워지지 않아요."
  ],
  "waitMinutes": [
    "Too many wrong tries. You can try again in {n} minutes. Wrong guesses never erase your papers.",
    "Demasiados intentos incorrectos. Puede volver a intentarlo en {n} minutos. Los intentos incorrectos nunca borran sus documentos.",
    "输错次数过多。{n} 分钟后可以再试。输错密码绝不会删除您的文件。",
    "잘못 입력한 횟수가 많아요. {n}분 뒤에 다시 시도할 수 있어요. 잘못 입력해도 서류는 절대 지워지지 않아요."
  ],
  "storeLoading": [
    "Getting the prices from {store}…",
    "Obteniendo los precios de {store}…",
    "正在从 {store} 获取价格…",
    "{store}에서 가격을 불러오는 중이에요…"
  ],
  "storeMissing": [
    "{store} didn't send the Plus prices this time. Try again in a moment. Nothing was charged.",
    "{store} no envió los precios de Plus esta vez. Vuelva a intentarlo en un momento. No se cobró nada.",
    "{store} 这次没有返回 Plus 的价格。请稍后再试。没有扣任何费用。",
    "{store}에서 이번에는 Plus 가격을 보내지 않았어요. 잠시 후 다시 시도하세요. 요금은 청구되지 않았어요."
  ],
  "storeFailed": [
    "Couldn't reach {store}. Check your connection and try again. Nothing was charged.",
    "No se pudo conectar con {store}. Revise su conexión y vuelva a intentarlo. No se cobró nada.",
    "无法连接 {store}。请检查网络连接后再试。没有扣任何费用。",
    "{store}에 연결할 수 없어요. 인터넷 연결을 확인하고 다시 시도하세요. 요금은 청구되지 않았어요."
  ],
  "retry": [
    "Try again ↻",
    "Intentar de nuevo ↻",
    "再试一次 ↻",
    "다시 시도 ↻"
  ],
  "copyWords": [
    "Copy or share the words ›",
    "Copiar o compartir las palabras ›",
    "复制或分享这些单词 ›",
    "단어 복사 또는 공유 ›"
  ],
  "copyWordsHint": [
    "Other apps can read what you copy. Writing the words on paper is the safest.",
    "Otras apps pueden leer lo que copia. Escribir las palabras en papel es lo más seguro.",
    "其他应用可以读取您复制的内容。把单词写在纸上最安全。",
    "복사한 내용은 다른 앱이 읽을 수 있어요. 종이에 적어 두는 것이 가장 안전해요."
  ],
  "addNote": [
    "+ Add a note",
    "+ Agregar una nota",
    "+ 添加备注",
    "+ 메모 추가"
  ],
  "closeView": [
    "✕ Close",
    "✕ Cerrar",
    "✕ 关闭",
    "✕ 닫기"
  ],
  "photoZoom": [
    "Tap the photo to see it full screen. Pinch to zoom.",
    "Toque la foto para verla en pantalla completa. Pellizque para ampliar.",
    "点按照片可全屏查看，双指可缩放。",
    "사진을 누르면 전체 화면으로 보여요. 두 손가락으로 확대할 수 있어요."
  ],
  "workingCheck": [
    "Checking your passcode and opening your papers…",
    "Comprobando su código y abriendo sus documentos…",
    "正在核对密码并打开您的文件…",
    "암호를 확인하고 서류를 여는 중이에요…"
  ],
  "photoCamera": [
    "Taken with the camera and kept only in KeepMyProof. It is not in your Photos or Gallery app.",
    "Tomada con la cámara y guardada solo en KeepMyProof. No está en su app Fotos ni en la Galería.",
    "用相机拍摄，只保存在 KeepMyProof 中，不在您的“照片”或图库应用里。",
    "카메라로 찍어 KeepMyProof에만 보관돼요. 사진 앱이나 갤러리에는 없어요."
  ],
  "takePhoto": [
    "Take a photo ›",
    "Tomar una foto ›",
    "拍照 ›",
    "사진 찍기 ›"
  ],
  "workingCamera": [
    "Opening the camera…",
    "Abriendo la cámara…",
    "正在打开相机…",
    "카메라를 여는 중이에요…"
  ],
  "cameraOff": [
    "The camera is off for KeepMyProof, so your photos opened instead. To take photos here, turn on Camera for KeepMyProof in Settings.",
    "La cámara está desactivada para KeepMyProof, así que se abrieron sus fotos. Para tomar fotos aquí, active la Cámara para KeepMyProof en Configuración.",
    "KeepMyProof 的相机权限已关闭，所以为您打开了照片。若要在这里拍照，请在“设置”中为 KeepMyProof 打开“相机”。",
    "KeepMyProof의 카메라 권한이 꺼져 있어 사진 보관함을 대신 열었어요. 여기서 사진을 찍으려면 설정에서 KeepMyProof의 카메라를 켜 주세요."
  ],
  "cameraNone": [
    "The camera did not open, so your photos opened instead.",
    "La cámara no se abrió, así que se abrieron sus fotos.",
    "相机没有打开，所以为您打开了照片。",
    "카메라가 열리지 않아 사진 보관함을 대신 열었어요."
  ],
  "tenantHow": [
    "Take photos of every room the day you move in and again the day you move out, and pick that room's line when you save. Keep the lease, receipts, repair requests and any letter about your deposit here too.",
    "Tome fotos de cada cuarto el día que se muda y otra vez el día que se va, y elija la línea de ese cuarto al guardar. Guarde aquí también el contrato, los recibos, las solicitudes de reparación y cualquier carta sobre su depósito.",
    "搬入当天和搬出当天都给每个房间拍照，保存时选择该房间那一行。租约、收据、维修请求和有关押金的信件也放在这里。",
    "입주하는 날과 퇴거하는 날에 방마다 사진을 찍고, 저장할 때 그 방의 줄을 고르세요. 임대 계약서, 영수증, 수리 요청, 보증금에 관한 편지도 여기에 보관하세요."
  ],
  "tenantFoot": [
    "Dated and organized, ready to share if you need to. Educational only. Not legal advice.",
    "Con fecha y en orden, listo para compartir si lo necesita. Solo para información. No es asesoría legal.",
    "注明日期、整理有序，需要时方便分享。仅供参考，不构成法律建议。",
    "날짜가 적혀 있고 정리되어 있어 필요할 때 공유하기 쉬워요. 정보 제공용입니다. 법률 자문이 아닙니다."
  ],
  "inventoryHow": [
    "One item per entry: a photo of the thing, its name, the room's line, and the purchase date as the date. Add the receipt as a second item on the same line, and write the price or serial number in the note.",
    "Una cosa por entrada: una foto del objeto, su nombre, la línea del cuarto y la fecha de compra como fecha. Agregue el recibo como otra entrada en la misma línea y escriba el precio o el número de serie en la nota.",
    "每件物品记一条：物品照片、名称、所在房间那一行，日期填购买日期。把收据作为同一行的另一条加入，在备注里写上价格或序列号。",
    "물건 하나에 항목 하나: 물건 사진, 이름, 방의 줄, 날짜에는 구입한 날을 넣으세요. 영수증은 같은 줄에 항목을 하나 더 만들어 넣고, 가격이나 일련번호는 메모에 적으세요."
  ],
  "inventoryFoot": [
    "Dated and organized, ready to share with your insurer if you need to. Educational only. Not insurance or legal advice.",
    "Con fecha y en orden, listo para compartir con su aseguradora si lo necesita. Solo para información. No es asesoría de seguros ni legal.",
    "注明日期、整理有序，需要时方便与保险公司分享。仅供参考，不构成保险或法律建议。",
    "날짜가 적혀 있고 정리되어 있어 필요할 때 보험사와 공유하기 쉬워요. 정보 제공용입니다. 보험 또는 법률 자문이 아닙니다."
  ],
  "workingPhotos": [
    "Reading your photos…",
    "Leyendo sus fotos…",
    "正在读取您的照片…",
    "사진을 읽는 중이에요…"
  ],
  "workingSave": [
    "Locking and saving on this device…",
    "Protegiendo y guardando en este dispositivo…",
    "正在加密并保存到这台设备…",
    "암호화해서 이 기기에 저장하는 중이에요…"
  ],
  "workingFile": [
    "Opening the file…",
    "Abriendo el archivo…",
    "正在打开文件…",
    "파일을 여는 중이에요…"
  ],
  "workingPdf": [
    "Making the PDF…",
    "Creando el PDF…",
    "正在生成 PDF…",
    "PDF를 만드는 중이에요…"
  ],
  "reviewLink": [
    "Have a review code?",
    "¿Tiene un código de revisión?",
    "有审核代码？",
    "심사 코드가 있나요?"
  ],
  "reviewCode": [
    "App review code",
    "Código de revisión de la app",
    "应用审核代码",
    "앱 심사 코드"
  ],
  "reviewWhy": [
    "For Google Play's app review. The check sends only the code and an anonymous purchase ID; your papers never leave this device.",
    "Para la revisión de Google Play. La comprobación envía solo el código y un identificador anónimo de compra; sus papeles nunca salen de este dispositivo.",
    "供 Google Play 应用审核使用。检查时只发送代码和一个匿名购买标识符，您的文件绝不会离开这台设备。",
    "Google Play 앱 심사용이에요. 확인할 때 코드와 익명 구매 식별자만 보내고, 서류는 이 기기를 떠나지 않아요."
  ],
  "reviewUse": [
    "Use this code",
    "Usar este código",
    "使用此代码",
    "이 코드 사용"
  ],
  "reviewWrong": [
    "That code didn't work. Check the 10 digits and try again.",
    "Ese código no funcionó. Revise los 10 dígitos e inténtelo de nuevo.",
    "这个代码无效。请核对 10 位数字后重试。",
    "코드가 맞지 않아요. 10자리를 확인하고 다시 시도하세요."
  ],
  "reviewUsedUp": [
    "This review code has been used up.",
    "Este código de revisión ya se agotó.",
    "这个审核代码已用完。",
    "이 심사 코드는 모두 사용되었어요."
  ],
  "reviewSlow": [
    "Too many tries. Please wait and try again later.",
    "Demasiados intentos. Espere e inténtelo más tarde.",
    "尝试次数过多。请稍后再试。",
    "시도가 너무 많아요. 잠시 후 다시 시도하세요."
  ],
  "reviewTryAgain": [
    "Couldn't check the code right now. Please try again.",
    "No se pudo comprobar el código ahora. Inténtelo de nuevo.",
    "现在无法检查代码。请重试。",
    "지금은 코드를 확인할 수 없어요. 다시 시도하세요."
  ],
  "plusOn": [
    "✓ Plus is on.",
    "✓ Plus está activo.",
    "✓ Plus 已开启。",
    "✓ Plus가 켜져 있어요."
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
