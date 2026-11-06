// How-to guides for the vault feature line (owner yes, 6 Nov 2026: "KMP vault feature (not lead) take
// advantage of what people want!"). Divorce and custody stay the lead; these pages answer "hide screenshots /
// documents" searches in the papers frame and end in the site's one action (the store block).
// Every phone step is taken from Apple's or Google's own help page, linked in `sources` and read on 6 Nov 2026.
// Never a claim of proof or legal validity (the build's banned-word check reads every page).

const APPLE_HIDE = { en: 'https://support.apple.com/en-us/104987', es: 'https://support.apple.com/es-us/104987' };
const APPLE_MISSING = { en: 'https://support.apple.com/en-us/118558', es: 'https://support.apple.com/es-us/118558' };
const APPLE_LOCK_APP = { en: 'https://support.apple.com/guide/iphone/lock-or-hide-an-app-iph00f208d05/ios', es: 'https://support.apple.com/es-us/guide/iphone/iph00f208d05/ios' };
const APPLE_LOCK_NOTES = { en: 'https://support.apple.com/guide/iphone/lock-notes-iphf177bb154/ios', es: 'https://support.apple.com/es-us/guide/iphone/iphf177bb154/ios' };
const APPLE_SCAN = { en: 'https://support.apple.com/guide/iphone/scan-text-and-documents-iph653f28965/ios', es: 'https://support.apple.com/es-us/guide/iphone/iph653f28965/ios' };
const G_LOCKED = { en: 'https://support.google.com/photos/answer/10694388?hl=en&co=GENIE.Platform%3DAndroid', es: 'https://support.google.com/photos/answer/10694388?hl=es&co=GENIE.Platform%3DAndroid' };
const G_ARCHIVE = { en: 'https://support.google.com/photos/answer/7362432?hl=en&co=GENIE.Platform%3DAndroid', es: 'https://support.google.com/photos/answer/7362432?hl=es&co=GENIE.Platform%3DAndroid' };
const G_DELETE = { en: 'https://support.google.com/photos/answer/6128858?hl=en&co=GENIE.Platform%3DAndroid', es: 'https://support.google.com/photos/answer/6128858?hl=es&co=GENIE.Platform%3DAndroid' };
const G_SAFE = { en: 'https://support.google.com/files/answer/9935264?hl=en', es: 'https://support.google.com/files/answer/9935264?hl=es' };
export const src = (name, urls) => ({ name, url: urls });
export const SRC = { APPLE_HIDE, APPLE_MISSING, APPLE_LOCK_APP, G_LOCKED, G_DELETE, G_SAFE };

export const GUIDE_DATES = { published: '2026-11-06', modified: '2026-11-06' };

/** Shared copy for every guide and the guides hub. */
export const GUIDE_COPY = {
  en: {
    hubTitle: 'Guides: hide screenshots and documents on iPhone and Android | KeepMyProof',
    hubH1: 'Guides: keep screenshots and papers private on your phone',
    hubAnswer: 'These guides show how to hide screenshots, photos of papers and documents with the tools already on an iPhone or Android phone, step by step from Apple and Google help pages, and when a separate private folder for papers makes more sense than a hidden album. Each guide links the official help page it follows.',
    hubDesc: 'Step-by-step guides to hide screenshots and documents on iPhone and Android, from Apple and Google help pages, plus a private folder for papers.',
    nav: 'Guides', bestFor: 'Who this guide is for:', sourcesH: 'Sources', checked: 'Steps checked against these pages on 6 November 2026. Menu names can change with a phone update.',
    keepH: 'Keep the papers out of your photos',
    keepBody: 'A hidden album still mixes the screenshot of a pickup text or an HR email with your pictures. KeepMyProof is a private phone app for papers: folders with checklists, the day it happened next to the day you saved it, and one PDF of a folder when someone asks. On iPhone, after you add a photo, it offers to remove the original from Photos; nothing is removed unless you tap Remove and confirm on your iPhone.',
    notAdvice: 'Educational only. Not legal advice.', by: 'By KeepMyProof, made by Spry Labs', published: 'Published', updated: 'Updated', related: 'More guides',
  },
  es: {
    hubTitle: 'Guías: ocultar capturas y documentos en iPhone y Android | KeepMyProof',
    hubH1: 'Guías: mantenga privadas sus capturas y papeles en el teléfono',
    hubAnswer: 'Estas guías explican cómo ocultar capturas de pantalla, fotos de papeles y documentos con las herramientas que ya trae un iPhone o un teléfono Android, paso a paso según las páginas de ayuda de Apple y Google, y cuándo conviene más una carpeta privada para papeles que un álbum oculto. Cada guía enlaza la página oficial que sigue.',
    hubDesc: 'Guías paso a paso para ocultar capturas y documentos en iPhone y Android, según la ayuda de Apple y Google, y una carpeta privada para papeles.',
    nav: 'Guías', bestFor: 'Para quién es esta guía:', sourcesH: 'Fuentes', checked: 'Pasos revisados con estas páginas el 6 de noviembre de 2026. Los nombres de los menús pueden cambiar con una actualización del teléfono.',
    keepH: 'Saque los papeles de sus fotos',
    keepBody: 'Un álbum oculto sigue mezclando la captura de un mensaje sobre la entrega de los niños o un correo de recursos humanos con sus fotos. KeepMyProof es una app privada para papeles: carpetas con listas, el día en que pasó junto al día en que lo guardó, y un solo PDF de una carpeta cuando alguien se lo pide. En iPhone, después de agregar una foto, le ofrece quitar el original de Fotos; no se quita nada a menos que toque Quitar y lo confirme en su iPhone.',
    notAdvice: 'Solo informativo. No es asesoría legal.', by: 'Por KeepMyProof, hecho por Spry Labs', published: 'Publicado', updated: 'Actualizado', related: 'Más guías',
  },
};

/**
 * Each guide: slug, title, desc, h1, answer (40–60 words, quoted alone), bestFor, sections
 * ({ h: question, a: one-sentence answer, steps?: numbered, list?: bullets }), faq ([q, a]), sources.
 */
export const GUIDES = [
  {
    id: 'hide-screenshots-iphone', slug: { en: 'hide-screenshots-on-iphone', es: 'ocultar-capturas-en-iphone' },
    sources: [src('Apple: Hide photos with the Hidden album', APPLE_HIDE), src('Apple: If you are missing photos or videos in the Photos app', APPLE_MISSING)],
    en: {
      title: 'How to hide screenshots on iPhone (Hidden album) | KeepMyProof',
      desc: 'Hide a screenshot on iPhone in 3 taps: it moves to the Hidden album, locked with Face ID or Touch ID. Steps from Apple, plus how to hide the album itself.',
      h1: 'How to hide screenshots on iPhone',
      answer: 'To hide a screenshot on iPhone, open it in Photos, touch and hold it, tap Hide and confirm. It moves to the Hidden album and stops showing anywhere else in Photos. Apple says the Hidden album is locked by default on iOS 16 and later and opens with Face ID or Touch ID.',
      bestFor: 'someone who wants a screenshot of a text, an email or a paper out of the main Photos grid today, using only what the iPhone already has.',
      sections: [
        { h: 'How do I hide one screenshot?', a: 'Use Hide in the Photos app; it takes three taps.', steps: ['Open Photos and find the screenshot.', 'Touch and hold it (or open it and tap the More button).', 'Tap Hide, then confirm.'] },
        { h: 'Where do hidden screenshots go?', a: 'They go to the Hidden album, under Utilities in Photos.', list: ['Open Photos and scroll down to Utilities.', 'Tap Hidden, then View Album, and unlock it with Face ID or Touch ID.', 'To bring one back, touch and hold it and tap Unhide.'] },
        { h: 'Can I hide the Hidden album too?', a: 'Yes: turn off Show Hidden Album in Settings.', steps: ['Open Settings.', 'Tap Apps, then Photos.', 'Turn off Show Hidden Album. Hidden items no longer appear in Photos while it is off.'] },
        { h: 'What does hiding not do?', a: 'Hiding does not delete the screenshot or take it off your other devices.', list: ['If you use iCloud Photos, a photo you hide is hidden on all your devices, not removed from them (Apple).', 'The screenshot is still in your photo library and in any backup of it.', 'Anyone who can unlock the Hidden album can still see it.'] },
      ],
      faq: [
        ['Is the Hidden album locked on iPhone?', 'Yes, on iOS 16 and later Apple says the Hidden album is locked by default. You open it with Face ID or Touch ID, after tapping View Album. If you also turn off Show Hidden Album in Settings, the album does not appear in Photos at all until you turn it back on.'],
        ['Does hiding a screenshot delete it?', 'No. Hiding only moves the screenshot to the Hidden album; it stays in your library and in iCloud Photos if you use it. To remove it, delete it; Apple keeps deleted photos in the Recently Deleted album for 30 days, where you can still recover them before they are gone.'],
        ['Can I hide many screenshots at once?', 'Yes. In Photos, tap Select, tap each screenshot you want, then tap the More button and choose Hide. They all move to the Hidden album together. Unhiding works the same way from inside the Hidden album, after you unlock it with Face ID or Touch ID.'],
      ],
    },
    es: {
      title: 'Cómo ocultar capturas de pantalla en iPhone (álbum Oculto) | KeepMyProof',
      desc: 'Oculte una captura en iPhone en 3 toques: pasa al álbum Oculto, bloqueado con Face ID o Touch ID. Pasos de Apple y cómo ocultar el álbum.',
      h1: 'Cómo ocultar capturas de pantalla en iPhone',
      answer: 'Para ocultar una captura en iPhone, ábrala en Fotos, mantenga el dedo sobre ella, toque Ocultar y confirme. Pasa al álbum Oculto y deja de verse en el resto de Fotos. Apple dice que el álbum Oculto está bloqueado de forma predeterminada desde iOS 16 y se abre con Face ID o Touch ID.',
      bestFor: 'quien quiere sacar hoy mismo de la vista principal de Fotos la captura de un mensaje, un correo o un papel, solo con lo que ya trae el iPhone.',
      sections: [
        { h: '¿Cómo oculto una captura?', a: 'Use Ocultar en la app Fotos; son tres toques.', steps: ['Abra Fotos y busque la captura.', 'Mantenga el dedo sobre ella (o ábrala y toque el botón Más).', 'Toque Ocultar y confirme.'] },
        { h: '¿Adónde van las capturas ocultas?', a: 'Van al álbum Oculto, en Utilidades dentro de Fotos.', list: ['Abra Fotos y baje hasta Utilidades.', 'Toque Oculto, luego Ver álbum, y desbloquéelo con Face ID o Touch ID.', 'Para mostrar una otra vez, mantenga el dedo sobre ella y toque Mostrar.'] },
        { h: '¿Puedo ocultar también el álbum Oculto?', a: 'Sí: desactive Mostrar álbum Oculto en Ajustes.', steps: ['Abra Ajustes.', 'Toque Apps y luego Fotos.', 'Desactive Mostrar álbum Oculto. Mientras esté desactivado, lo oculto no aparece en Fotos.'] },
        { h: '¿Qué no hace ocultar?', a: 'Ocultar no borra la captura ni la quita de sus otros dispositivos.', list: ['Si usa Fotos de iCloud, lo que oculta queda oculto en todos sus dispositivos, no borrado (Apple).', 'La captura sigue en su fototeca y en cualquier copia de seguridad.', 'Quien pueda desbloquear el álbum Oculto la puede ver.'] },
      ],
      faq: [
        ['¿El álbum Oculto está bloqueado en iPhone?', 'Sí. Desde iOS 16, Apple dice que el álbum Oculto está bloqueado de forma predeterminada. Se abre con Face ID o Touch ID después de tocar Ver álbum. Si además desactiva Mostrar álbum Oculto en Ajustes, el álbum no aparece en Fotos hasta que lo vuelva a activar.'],
        ['¿Ocultar una captura la borra?', 'No. Ocultar solo la pasa al álbum Oculto; sigue en su fototeca y en Fotos de iCloud si lo usa. Para quitarla, bórrela. Apple guarda las fotos borradas en el álbum Eliminado durante 30 días, y ahí todavía puede recuperarlas antes de que desaparezcan.'],
        ['¿Puedo ocultar varias capturas a la vez?', 'Sí. En Fotos, toque Seleccionar, toque cada captura, luego el botón Más y elija Ocultar. Todas pasan juntas al álbum Oculto. Para mostrarlas otra vez se hace lo mismo dentro del álbum Oculto, después de desbloquearlo con Face ID o Touch ID.'],
      ],
    },
  },
  {
    id: 'hide-documents-iphone', slug: { en: 'hide-documents-on-iphone', es: 'ocultar-documentos-en-iphone' },
    sources: [src('Apple: Lock or hide an app on iPhone', APPLE_LOCK_APP), src('Apple: Lock your notes on iPhone', APPLE_LOCK_NOTES), src('Apple: Scan text and documents in Notes', APPLE_SCAN)],
    en: {
      title: 'How to hide documents on iPhone: lock the app or the note | KeepMyProof',
      desc: 'iPhone has no hidden folder for files, but you can lock or hide the app that holds them, or lock a note. Steps from Apple, and the PDF limit.',
      h1: 'How to hide documents on iPhone',
      answer: 'iPhone has no hidden folder for documents, so you lock the app that holds them. Touch and hold the app, such as Files, and choose Require Face ID; or choose Hide and Require Face ID to move it into a locked Hidden folder. Notes can also be locked, but Apple says notes with PDF attachments cannot.',
      bestFor: 'someone with a scan, a PDF or a letter on an iPhone who wants it behind Face ID without installing anything.',
      sections: [
        { h: 'How do I lock the Files app?', a: 'Lock it from the Home Screen; it then asks for Face ID, Touch ID or your passcode every time it opens.', steps: ['Touch and hold the Files app on the Home Screen.', 'Tap Require Face ID (or Touch ID or Passcode).', 'Confirm. The app locks again after you quit it.'] },
        { h: 'How do I hide the app completely?', a: 'Choose Hide and Require Face ID; the app moves to a locked Hidden folder in the App Library.', list: ['It disappears from the Home Screen, the App Library and search.', 'Apple notes its name can still show in places such as Screen Time and battery usage.', 'It is locked or hidden only on that iPhone.'] },
        { h: 'Can I lock a scanned document in Notes?', a: 'Not a scan saved as a PDF: Apple says notes with PDF, video, audio or file attachments cannot be locked.', list: ['A scan made in Notes is saved as a PDF in the note, so that note cannot be locked.', 'Scan Text, which types the words into the note instead, gives a note you can lock.', 'Locked notes open with your iPhone passcode or a Notes password; Apple cannot reset a forgotten Notes password for you.'] },
        { h: 'Which apps cannot be locked?', a: 'Some built-in apps, including Camera, Settings, Contacts and Maps, cannot be locked (Apple).', list: ['Files and Notes can be locked.', 'Photos has its own locked Hidden album instead.'] },
      ],
      faq: [
        ['Is there a hidden folder in the iPhone Files app?', 'No. Files has no hidden or locked folder of its own. What you can do is lock the whole Files app with Face ID, Touch ID or your passcode, or hide it so it moves to a locked Hidden folder in the App Library. Apple describes both on its lock or hide an app page.'],
        ['Why can I not lock my note with a scanned document?', 'Apple says notes with PDF, video, audio or file attachments cannot be locked, and a document scanned in Notes is saved as a PDF in the note. If you need the note locked, use Scan Text, which inserts the words as text, or keep the scan somewhere you can lock.'],
        ['Does locking an app lock it on my iPad too?', 'No. Apple says that when you lock or hide an app on your iPhone, it is locked or hidden only on that iPhone. Your other devices keep their own settings, so lock the app on each one where the same documents are stored, for example through iCloud Drive.'],
      ],
    },
    es: {
      title: 'Cómo ocultar documentos en iPhone: bloquee la app o la nota | KeepMyProof',
      desc: 'El iPhone no tiene una carpeta oculta para archivos, pero puede bloquear u ocultar la app que los guarda o bloquear una nota. Pasos de Apple.',
      h1: 'Cómo ocultar documentos en iPhone',
      answer: 'El iPhone no tiene una carpeta oculta para documentos, así que se bloquea la app que los guarda. Mantenga el dedo sobre la app, como Archivos, y elija Requerir Face ID; o elija Ocultar y requerir Face ID para pasarla a una carpeta Oculto bloqueada. Las notas también se bloquean, pero Apple dice que no las que tienen PDF adjuntos.',
      bestFor: 'quien tiene un escaneo, un PDF o una carta en el iPhone y quiere protegerlo con Face ID sin instalar nada.',
      sections: [
        { h: '¿Cómo bloqueo la app Archivos?', a: 'Bloquéela desde la pantalla de inicio; luego pide Face ID, Touch ID o el código cada vez que se abre.', steps: ['Mantenga el dedo sobre la app Archivos en la pantalla de inicio.', 'Toque Requerir Face ID (o Touch ID o código).', 'Confirme. La app se vuelve a bloquear cuando la cierra.'] },
        { h: '¿Cómo oculto la app por completo?', a: 'Elija Ocultar y requerir Face ID; la app pasa a una carpeta Oculto bloqueada en la biblioteca de apps.', list: ['Desaparece de la pantalla de inicio, la biblioteca de apps y la búsqueda.', 'Apple advierte que su nombre todavía puede verse en lugares como Tiempo en pantalla y el uso de batería.', 'Solo queda bloqueada u oculta en ese iPhone.'] },
        { h: '¿Puedo bloquear un documento escaneado en Notas?', a: 'No si se guardó como PDF: Apple dice que no se pueden bloquear notas con PDF, video, audio o archivos adjuntos.', list: ['Un escaneo hecho en Notas se guarda como PDF dentro de la nota, así que esa nota no se puede bloquear.', 'Escanear texto, que escribe las palabras en la nota, deja una nota que sí se puede bloquear.', 'Las notas bloqueadas se abren con el código del iPhone o una contraseña de Notas; Apple no puede recuperar una contraseña de Notas olvidada.'] },
        { h: '¿Qué apps no se pueden bloquear?', a: 'Algunas apps del sistema, como Cámara, Ajustes, Contactos y Mapas, no se pueden bloquear (Apple).', list: ['Archivos y Notas sí se pueden bloquear.', 'Fotos tiene su propio álbum Oculto bloqueado.'] },
      ],
      faq: [
        ['¿Hay una carpeta oculta en la app Archivos del iPhone?', 'No. Archivos no tiene una carpeta oculta o bloqueada propia. Lo que sí puede hacer es bloquear toda la app con Face ID, Touch ID o el código, u ocultarla para que pase a una carpeta Oculto bloqueada en la biblioteca de apps. Apple explica las dos opciones en su página de ayuda.'],
        ['¿Por qué no puedo bloquear mi nota con un documento escaneado?', 'Apple dice que no se pueden bloquear notas con PDF, video, audio o archivos adjuntos, y un documento escaneado en Notas se guarda como PDF en la nota. Si necesita la nota bloqueada, use Escanear texto, que inserta las palabras como texto, o guarde el escaneo en otro lugar que pueda bloquear.'],
        ['¿Bloquear una app la bloquea también en mi iPad?', 'No. Apple dice que cuando bloquea u oculta una app en su iPhone, queda bloqueada u oculta solo en ese iPhone. Sus otros dispositivos tienen sus propios ajustes, así que bloquee la app en cada uno donde guarde los mismos documentos, por ejemplo con iCloud Drive.'],
      ],
    },
  },
  {
    id: 'hide-screenshots-android', slug: { en: 'hide-screenshots-on-android', es: 'ocultar-capturas-en-android' },
    sources: [src('Google Photos Help: Hide sensitive photos and videos in Locked Folders (Android)', G_LOCKED), src('Google Photos Help: Move photos to archive (Android)', G_ARCHIVE)],
    en: {
      title: 'How to hide screenshots on Android (Google Photos Locked Folder) | KeepMyProof',
      desc: 'Hide a screenshot on Android by moving it to Locked Folder in Google Photos, opened with your screen lock. Steps from Google, plus the backup catch.',
      h1: 'How to hide screenshots on Android',
      answer: 'To hide a screenshot on Android, open Google Photos, select the screenshot, tap Add to, then Move to Locked Folder, and tap Move. Locked Folder opens with your phone\'s screen lock, and its items stay out of the Photos grid, albums and search. Google warns that items you do not back up live only on that phone.',
      bestFor: 'someone with an Android phone and Google Photos who wants a screenshot behind the screen lock today.',
      sections: [
        { h: 'How do I move a screenshot to Locked Folder?', a: 'Select it in Google Photos and move it; the first time, the app asks you to set Locked Folder up.', steps: ['Open Google Photos and tap Photos.', 'Select the screenshot (touch and hold to select several).', 'Tap Add to, then Move to Locked Folder.', 'Tap Move.'] },
        { h: 'Where is Locked Folder?', a: 'Tap Collections at the bottom of Google Photos, then Locked.', list: ['It opens with your device screen lock.', 'Items in it do not appear in the Photos grid, albums or search.', 'They cannot be shared from Google Photos or with other apps while they are locked.'] },
        { h: 'Is Locked Folder backed up?', a: 'Only if you turn it on: the setting is called Back up Locked Folder.', list: ['Google says items you do not back up are stored only on that device.', 'They are lost if you uninstall Google Photos, clear its app data, or lose or damage the phone; a factory reset also deletes them when backup is off.'] },
        { h: 'What about Archive?', a: 'Archive only tidies: Google says archived photos still appear in albums, search results and device folders.', list: ['Use Archive to clear screenshots from the main view.', 'Use Locked Folder when someone else may pick up your phone.'] },
      ],
      faq: [
        ['Does Locked Folder keep screenshots private?', 'It keeps them behind your phone\'s screen lock and out of the Photos grid, albums and search, according to Google. Anyone who knows your screen lock can still open it. Google Photos also cannot share them while they are locked, so move an item out first if you need to send it.'],
        ['Will I lose screenshots in Locked Folder?', 'You can. Google says items you do not back up are stored only on that phone and are lost if you uninstall Google Photos, clear its data, or lose the phone. Turn on Back up Locked Folder in settings, or back up single items, if you need to keep them.'],
        ['Is archiving a screenshot the same as hiding it?', 'No. Google says archiving hides a photo from your Photos view, but it still shows in albums, search results and device folders. Archive is for tidying the main view. For a screenshot you want behind the screen lock, use Locked Folder instead.'],
      ],
    },
    es: {
      title: 'Cómo ocultar capturas de pantalla en Android (Carpeta bloqueada) | KeepMyProof',
      desc: 'Oculte una captura en Android pasándola a la Carpeta bloqueada de Google Fotos, que se abre con el bloqueo de pantalla. Pasos de Google.',
      h1: 'Cómo ocultar capturas de pantalla en Android',
      answer: 'Para ocultar una captura en Android, abra Google Fotos, selecciónela, toque Agregar a, luego Mover a Carpeta bloqueada, y toque Mover. La Carpeta bloqueada se abre con el bloqueo de pantalla y lo que tiene no aparece en la cuadrícula de Fotos, los álbumes ni la búsqueda. Google advierte que lo que no respalde queda solo en ese teléfono.',
      bestFor: 'quien tiene un teléfono Android con Google Fotos y quiere hoy mismo una captura detrás del bloqueo de pantalla.',
      sections: [
        { h: '¿Cómo paso una captura a la Carpeta bloqueada?', a: 'Selecciónela en Google Fotos y muévala; la primera vez la app le pide configurar la Carpeta bloqueada.', steps: ['Abra Google Fotos y toque Fotos.', 'Seleccione la captura (mantenga el dedo para elegir varias).', 'Toque Agregar a y luego Mover a Carpeta bloqueada.', 'Toque Mover.'] },
        { h: '¿Dónde está la Carpeta bloqueada?', a: 'Toque Colecciones abajo en Google Fotos y luego Bloqueada.', list: ['Se abre con el bloqueo de pantalla del dispositivo.', 'Lo que tiene no aparece en la cuadrícula de Fotos, los álbumes ni la búsqueda.', 'No se puede compartir desde Google Fotos ni con otras apps mientras esté bloqueado.'] },
        { h: '¿Se respalda la Carpeta bloqueada?', a: 'Solo si lo activa: el ajuste se llama Crear copia de seguridad de la Carpeta bloqueada.', list: ['Google dice que lo que no respalde se guarda solo en ese dispositivo.', 'Se pierde si desinstala Google Fotos, borra los datos de la app, o pierde o daña el teléfono; restablecer el teléfono también lo borra si el respaldo está desactivado.'] },
        { h: '¿Y Archivar?', a: 'Archivar solo ordena: Google dice que las fotos archivadas siguen en los álbumes, la búsqueda y las carpetas del dispositivo.', list: ['Use Archivar para despejar la vista principal.', 'Use la Carpeta bloqueada cuando otra persona pueda tomar su teléfono.'] },
      ],
      faq: [
        ['¿La Carpeta bloqueada mantiene privadas las capturas?', 'Las pone detrás del bloqueo de pantalla y fuera de la cuadrícula de Fotos, los álbumes y la búsqueda, según Google. Quien sepa su bloqueo de pantalla puede abrirla. Google Fotos tampoco puede compartirlas mientras estén bloqueadas, así que sáquelas primero si necesita enviar una.'],
        ['¿Puedo perder capturas en la Carpeta bloqueada?', 'Sí. Google dice que lo que no respalde se guarda solo en ese teléfono y se pierde si desinstala Google Fotos, borra sus datos o pierde el teléfono. Active el respaldo de la Carpeta bloqueada en los ajustes, o respalde cada elemento, si necesita conservarlos.'],
        ['¿Archivar una captura es lo mismo que ocultarla?', 'No. Google dice que archivar quita la foto de la vista Fotos, pero sigue apareciendo en los álbumes, la búsqueda y las carpetas del dispositivo. Archivar sirve para ordenar la vista principal. Para tener una captura detrás del bloqueo de pantalla, use la Carpeta bloqueada.'],
      ],
    },
  },
  {
    id: 'hide-documents-android', slug: { en: 'hide-documents-on-android', es: 'ocultar-documentos-en-android' },
    sources: [src('Files by Google Help: Protect your files with Safe folder', G_SAFE)],
    en: {
      title: 'How to hide documents on Android (Files by Google Safe folder) | KeepMyProof',
      desc: 'Hide a PDF or scan on Android in the Safe folder of Files by Google, locked with a PIN or pattern. Steps from Google, and what a forgotten PIN means.',
      h1: 'How to hide documents on Android',
      answer: 'To hide a document on Android, use Safe folder in Files by Google. Open the app, scroll to Collections, tap Safe folder and choose a PIN or pattern. Then touch and hold the file, tap More and choose Move to Safe folder. Google warns that if you forget the PIN or pattern, you cannot open the files.',
      bestFor: 'someone with a PDF, a scan or a downloaded letter on an Android phone who wants it behind its own PIN.',
      sections: [
        { h: 'How do I set up Safe folder?', a: 'Set it up once in Files by Google with a PIN or a pattern.', steps: ['Open Files by Google.', 'Scroll to Collections and tap Safe folder.', 'Tap PIN or Pattern and set it.'] },
        { h: 'How do I move a document into Safe folder?', a: 'Select the file and choose Move to Safe folder, then enter your PIN or pattern.', steps: ['Find the file in Files by Google.', 'In grid view, touch and hold it, then tap More; in list view, tap More or Select.', 'Tap Move to Safe folder.', 'Enter your PIN or draw your pattern.'] },
        { h: 'What if I forget the PIN?', a: 'Google says you cannot open the files without it.', list: ['Resetting Safe folder in settings deletes the files in it for good, Google says.', 'Keep a copy of anything important somewhere else you control.', 'If you close Safe folder or switch apps mid-move, the move is cancelled.'] },
      ],
      faq: [
        ['Where is the hidden folder on Android?', 'Most Android phones with Files by Google have Safe folder: open Files by Google, scroll to Collections and tap Safe folder. It is locked with its own PIN or pattern, separate from your screen lock. Some phone makers add their own secure folders; their steps differ, so check the maker\'s help.'],
        ['Can I hide photos of papers in Safe folder?', 'Yes, any file Files by Google can see can be moved there, including photos and PDFs. For photos that live in Google Photos, Google also offers Locked Folder, which uses your screen lock instead. Keep in mind Google says a forgotten Safe folder PIN means the files cannot be opened.'],
        ['Is Safe folder backed up?', 'Google\'s Safe folder help page does not describe a backup. It does say that resetting Safe folder permanently deletes the files in it, and that a forgotten PIN or pattern means you cannot open them. Keep your own copy of anything you cannot afford to lose somewhere else you control.'],
      ],
    },
    es: {
      title: 'Cómo ocultar documentos en Android (Carpeta segura de Files) | KeepMyProof',
      desc: 'Oculte un PDF o un escaneo en Android en la Carpeta segura de Files de Google, con PIN o patrón. Pasos de Google y qué pasa si olvida el PIN.',
      h1: 'Cómo ocultar documentos en Android',
      answer: 'Para ocultar un documento en Android, use la Carpeta segura de Files de Google. Abra la app, baje hasta Colecciones, toque Carpeta segura y elija un PIN o un patrón. Luego mantenga el dedo sobre el archivo, toque Más y elija Mover a Carpeta segura. Google advierte que si olvida el PIN o el patrón, no podrá abrir los archivos.',
      bestFor: 'quien tiene un PDF, un escaneo o una carta descargada en un teléfono Android y lo quiere detrás de su propio PIN.',
      sections: [
        { h: '¿Cómo configuro la Carpeta segura?', a: 'Se configura una sola vez en Files de Google, con un PIN o un patrón.', steps: ['Abra Files de Google.', 'Baje hasta Colecciones y toque Carpeta segura.', 'Toque PIN o Patrón y créelo.'] },
        { h: '¿Cómo paso un documento a la Carpeta segura?', a: 'Seleccione el archivo, elija Mover a Carpeta segura y escriba su PIN o patrón.', steps: ['Busque el archivo en Files de Google.', 'En cuadrícula, mantenga el dedo sobre él y toque Más; en lista, toque Más o Seleccionar.', 'Toque Mover a Carpeta segura.', 'Escriba su PIN o dibuje su patrón.'] },
        { h: '¿Y si olvido el PIN?', a: 'Google dice que sin él no puede abrir los archivos.', list: ['Restablecer la Carpeta segura en los ajustes borra para siempre los archivos que tiene, según Google.', 'Guarde una copia de lo importante en otro lugar que usted controle.', 'Si cierra la Carpeta segura o cambia de app a mitad del traslado, se cancela.'] },
      ],
      faq: [
        ['¿Dónde está la carpeta oculta en Android?', 'La mayoría de los teléfonos Android con Files de Google tienen la Carpeta segura: abra Files de Google, baje hasta Colecciones y toque Carpeta segura. Tiene su propio PIN o patrón, aparte del bloqueo de pantalla. Algunos fabricantes agregan sus propias carpetas seguras; sus pasos cambian, así que consulte su ayuda.'],
        ['¿Puedo ocultar fotos de papeles en la Carpeta segura?', 'Sí, puede mover ahí cualquier archivo que vea Files de Google, incluidas fotos y PDF. Para fotos que están en Google Fotos, Google también ofrece la Carpeta bloqueada, que usa el bloqueo de pantalla. Recuerde que Google dice que si olvida el PIN de la Carpeta segura no podrá abrir los archivos.'],
        ['¿Se respalda la Carpeta segura?', 'La página de ayuda de Google sobre la Carpeta segura no describe un respaldo. Sí dice que restablecer la Carpeta segura borra para siempre los archivos que tiene, y que si olvida el PIN o el patrón no podrá abrirlos. Guarde su propia copia de lo que no puede perder en otro lugar que usted controle.'],
      ],
    },
  },
  {
    id: 'delete-after-saving', slug: { en: 'remove-screenshots-from-camera-roll', es: 'quitar-capturas-del-carrete' },
    sources: [src('Apple: If you are missing photos or videos in the Photos app', APPLE_MISSING), src('Google Photos Help: Delete photos and videos (Android)', G_DELETE)],
    en: {
      title: 'Remove screenshots from camera roll after saving | KeepMyProof',
      desc: 'Saved a copy of a screenshot somewhere private? Remove the original from your camera roll on iPhone or Android, and empty Recently Deleted or Trash.',
      h1: 'How to remove screenshots from your camera roll after saving a copy',
      answer: 'Once a copy is saved somewhere private, delete the original from your photos. On iPhone, deleted photos wait in Recently Deleted for 30 days, Apple says. On Android, Google Photos keeps them in Trash, 30 days on Google\'s Android help page. Check the copy opens first, then delete, then empty Recently Deleted or Trash if you want it gone sooner.',
      bestFor: 'someone who has already put a screenshot or photo of a paper in a private app or folder and wants the camera-roll original gone.',
      sections: [
        { h: 'What should I check before deleting?', a: 'Open the saved copy first and make sure it is complete.', list: ['Open the copy where you saved it and zoom in: the words and the date should be readable.', 'If the copy is in a backup, check the backup too.', 'Keep the original if you are not sure; you can delete it later.'] },
        { h: 'How do I delete it on iPhone?', a: 'Delete it in Photos; it moves to Recently Deleted for 30 days.', steps: ['Open Photos and find the screenshot.', 'Touch and hold it, then tap Delete, and confirm.', 'To remove it sooner, open Recently Deleted under Utilities and delete it there.'] },
        { h: 'How do I delete it on Android?', a: 'Delete it in Google Photos; it moves to Trash.', steps: ['Open Google Photos.', 'Touch and hold the screenshot.', 'Tap the Trash icon.', 'To remove it sooner, open Trash and delete it there.'] },
        { h: 'Does deleting remove it everywhere?', a: 'Often yes: synced copies go too.', list: ['iPhone: with iCloud Photos on, a deletion applies on all your devices (Apple).', 'Android: Google says deleting in Google Photos also deletes the same item from your device, and backed-up copies follow.'] },
      ],
      faq: [
        ['How long do deleted photos stay on iPhone?', 'Apple says you can recover a deleted photo from the Recently Deleted album for 30 days. After that it is removed for good. If you want it gone sooner, open Recently Deleted under Utilities in Photos and delete it there, after checking that your saved copy opens and is complete.'],
        ['Does KeepMyProof delete the original for me?', 'Only if you ask. On iPhone, after you add a photo, KeepMyProof offers to remove the original from Photos. Keep it in Photos is the first choice; if you tap Remove, your iPhone asks you to confirm, and the photo goes to Recently Deleted for 30 days. You can turn the question off in Settings.'],
        ['Will deleting on my phone delete my backup?', 'It can. With iCloud Photos on, Apple says a deletion applies on all your devices. Google says deleting in Google Photos deletes the same item from your device and from backup. A copy you saved in a separate app or file is not touched by deleting the photo.'],
      ],
    },
    es: {
      title: 'Quitar capturas del carrete tras guardar una copia | KeepMyProof',
      desc: '¿Guardó una copia de una captura en un lugar privado? Quite el original del carrete en iPhone o Android y vacíe Eliminado o la Papelera.',
      h1: 'Cómo quitar capturas del carrete después de guardar una copia',
      answer: 'Con una copia ya guardada en un lugar privado, borre el original de sus fotos. En iPhone, lo borrado espera en el álbum Eliminado durante 30 días, dice Apple. En Android, Google Fotos lo deja en la Papelera, 30 días según su ayuda para Android. Revise primero que la copia abra; luego borre y vacíe Eliminado o la Papelera.',
      bestFor: 'quien ya guardó una captura o una foto de un papel en una app o carpeta privada y quiere quitar el original del carrete.',
      sections: [
        { h: '¿Qué reviso antes de borrar?', a: 'Abra primero la copia guardada y compruebe que está completa.', list: ['Abra la copia donde la guardó y amplíela: las palabras y la fecha deben leerse.', 'Si la copia está en un respaldo, revise también el respaldo.', 'Si tiene dudas, conserve el original; puede borrarlo después.'] },
        { h: '¿Cómo la borro en iPhone?', a: 'Bórrela en Fotos; pasa al álbum Eliminado durante 30 días.', steps: ['Abra Fotos y busque la captura.', 'Mantenga el dedo sobre ella, toque Eliminar y confirme.', 'Para quitarla antes, abra Eliminado en Utilidades y bórrela ahí.'] },
        { h: '¿Cómo la borro en Android?', a: 'Bórrela en Google Fotos; pasa a la Papelera.', steps: ['Abra Google Fotos.', 'Mantenga el dedo sobre la captura.', 'Toque el ícono de Papelera.', 'Para quitarla antes, abra la Papelera y bórrela ahí.'] },
        { h: '¿Borrar la quita de todas partes?', a: 'Muchas veces sí: las copias sincronizadas también se van.', list: ['iPhone: con Fotos de iCloud activado, lo que borra se borra en todos sus dispositivos (Apple).', 'Android: Google dice que borrar en Google Fotos también borra lo mismo del dispositivo, y las copias respaldadas también.'] },
      ],
      faq: [
        ['¿Cuánto tiempo quedan las fotos borradas en iPhone?', 'Apple dice que puede recuperar una foto borrada desde el álbum Eliminado durante 30 días. Después se borra para siempre. Si la quiere fuera antes, abra Eliminado en Utilidades dentro de Fotos y bórrela ahí, después de comprobar que su copia guardada abre y está completa.'],
        ['¿KeepMyProof borra el original por mí?', 'Solo si usted lo pide. En iPhone, después de agregar una foto, KeepMyProof le ofrece quitar el original de Fotos. Dejarlo en Fotos es la primera opción; si toca Quitar, su iPhone le pide confirmar y la foto pasa al álbum Eliminado durante 30 días. Puede desactivar la pregunta en Ajustes.'],
        ['¿Borrar en el teléfono borra mi respaldo?', 'Puede pasar. Con Fotos de iCloud activado, Apple dice que lo que borra se borra en todos sus dispositivos. Google dice que borrar en Google Fotos borra lo mismo del dispositivo y del respaldo. Una copia que guardó en otra app o en un archivo aparte no se toca al borrar la foto.'],
      ],
    },
  },
  {
    id: 'keep-texts-private', slug: { en: 'keep-screenshots-of-texts-private', es: 'mantener-privadas-capturas-de-mensajes' },
    sources: [src('Apple: Hide photos with the Hidden album', APPLE_HIDE), src('Google Photos Help: Hide sensitive photos and videos in Locked Folders (Android)', G_LOCKED)],
    en: {
      title: 'How to keep screenshots of texts private (iPhone and Android) | KeepMyProof',
      desc: 'Screenshots of texts with a co-parent, a landlord or a boss sit in your camera roll. Keep them private on iPhone or Android, dated and in one place.',
      h1: 'How to keep screenshots of texts private',
      answer: 'To keep screenshots of texts private, take them out of the main camera roll. On iPhone, hide them in Photos so they move to the locked Hidden album. On Android, move them to Locked Folder in Google Photos. If the texts are about custody, work or housing, also keep each one with the day it happened.',
      bestFor: 'a parent, a tenant or an employee who screenshots texts about pickups, repairs or shifts and does not want them in the family photo scroll.',
      sections: [
        { h: 'What is the quickest way on iPhone?', a: 'Hide the screenshots; they move to the Hidden album, locked with Face ID or Touch ID on iOS 16 and later.', steps: ['In Photos, tap Select and tap each screenshot.', 'Tap the More button, then Hide.', 'Optional: Settings, Apps, Photos, turn off Show Hidden Album.'] },
        { h: 'What is the quickest way on Android?', a: 'Move them to Locked Folder in Google Photos.', steps: ['In Google Photos, select the screenshots.', 'Tap Add to, then Move to Locked Folder, then Move.', 'Turn on Back up Locked Folder if you need them kept beyond this phone.'] },
        { h: 'What should I write down with each screenshot?', a: 'The day it happened, in your own words, on the same day.', list: ['The date and time on the message itself.', 'Who it was with, by name or role.', 'One line on what it was about, such as a missed pickup or a repair request.', 'Where the original is, so you can find it again.'] },
        { h: 'Is a screenshot enough on its own?', a: 'That depends on where you need it; ask a lawyer how to keep the originals.', list: ['A screenshot can miss the sender\'s number or the full thread.', 'Keep the original messages on the phone too, unless a lawyer tells you otherwise.', 'Educational only. Not legal advice.'] },
      ],
      faq: [
        ['Can someone see my hidden screenshots?', 'Anyone who can unlock them can. On iPhone, the Hidden album opens with Face ID or Touch ID; on Android, Locked Folder opens with your screen lock. If someone else knows your passcode or screen lock, change it first, then hide the screenshots, so the lock only opens for you.'],
        ['Should I delete the original texts after taking screenshots?', 'Not without advice. A screenshot can miss the sender\'s number or part of the thread, so many people keep the original messages too. If the texts may matter in a custody, work or housing dispute, ask a lawyer how to keep them. This is educational only, not legal advice.'],
        ['How does KeepMyProof help with screenshots of texts?', 'It keeps them in a private folder on your phone with a checklist, the day it happened next to the day you saved it, and one PDF of the folder when someone asks. On iPhone it offers to remove the original from Photos after you add it, only if you confirm.'],
      ],
    },
    es: {
      title: 'Cómo mantener privadas las capturas de mensajes (iPhone y Android) | KeepMyProof',
      desc: 'Las capturas de mensajes con la otra parte, el casero o el jefe quedan en su carrete. Manténgalas privadas en iPhone o Android, con fecha y juntas.',
      h1: 'Cómo mantener privadas las capturas de mensajes',
      answer: 'Para mantener privadas las capturas de mensajes, sáquelas del carrete principal. En iPhone, ocúltelas en Fotos para que pasen al álbum Oculto bloqueado. En Android, muévalas a la Carpeta bloqueada de Google Fotos. Si los mensajes son sobre custodia, trabajo o vivienda, guarde también cada uno con el día en que pasó.',
      bestFor: 'un padre o una madre, un inquilino o un empleado que guarda capturas de mensajes sobre entregas, arreglos o turnos y no las quiere entre las fotos de la familia.',
      sections: [
        { h: '¿Cuál es la forma más rápida en iPhone?', a: 'Oculte las capturas; pasan al álbum Oculto, bloqueado con Face ID o Touch ID desde iOS 16.', steps: ['En Fotos, toque Seleccionar y toque cada captura.', 'Toque el botón Más y luego Ocultar.', 'Opcional: Ajustes, Apps, Fotos, desactive Mostrar álbum Oculto.'] },
        { h: '¿Cuál es la forma más rápida en Android?', a: 'Muévalas a la Carpeta bloqueada de Google Fotos.', steps: ['En Google Fotos, seleccione las capturas.', 'Toque Agregar a, luego Mover a Carpeta bloqueada y Mover.', 'Active el respaldo de la Carpeta bloqueada si necesita conservarlas fuera de este teléfono.'] },
        { h: '¿Qué anoto con cada captura?', a: 'El día en que pasó, con sus palabras, el mismo día.', list: ['La fecha y la hora del mensaje.', 'Con quién fue, por nombre o papel.', 'Una línea sobre el tema, como una entrega que no se hizo o un pedido de arreglo.', 'Dónde está el original, para encontrarlo otra vez.'] },
        { h: '¿Basta con una captura?', a: 'Depende de dónde la necesite; pregunte a un abogado cómo guardar los originales.', list: ['Una captura puede no mostrar el número de quien envió ni toda la conversación.', 'Conserve también los mensajes originales en el teléfono, salvo que un abogado le diga otra cosa.', 'Solo informativo. No es asesoría legal.'] },
      ],
      faq: [
        ['¿Alguien puede ver mis capturas ocultas?', 'Quien pueda desbloquearlas, sí. En iPhone, el álbum Oculto se abre con Face ID o Touch ID; en Android, la Carpeta bloqueada se abre con el bloqueo de pantalla. Si otra persona sabe su código o su bloqueo, cámbielo primero y luego oculte las capturas, para que solo se abran para usted.'],
        ['¿Debo borrar los mensajes originales después de la captura?', 'No sin consejo. Una captura puede no mostrar el número de quien envió o parte de la conversación, así que muchas personas conservan también los mensajes. Si pueden importar en un caso de custodia, trabajo o vivienda, pregunte a un abogado cómo guardarlos. Es solo informativo, no asesoría legal.'],
        ['¿Cómo ayuda KeepMyProof con las capturas de mensajes?', 'Las guarda en una carpeta privada en su teléfono con una lista, el día en que pasó junto al día en que lo guardó, y un solo PDF de la carpeta cuando alguien se lo pide. En iPhone le ofrece quitar el original de Fotos después de agregarlo, solo si usted confirma.'],
      ],
    },
  },
  {
    id: 'vault-for-papers', slug: { en: 'private-document-vault', es: 'boveda-privada-de-documentos' }, root: true,
    sources: [src('Apple: Hide photos with the Hidden album', APPLE_HIDE), src('Google Photos Help: Hide sensitive photos and videos in Locked Folders (Android)', G_LOCKED), src('Files by Google Help: Protect your files with Safe folder', G_SAFE)],
    en: {
      title: 'Private document vault: papers, not just pictures | KeepMyProof',
      desc: 'Photo vaults hide pictures. A vault for papers keeps letters, screenshots and scans in folders with a checklist and dates, private on your phone.',
      h1: 'A vault for papers, not just pictures',
      answer: 'A private document vault is an app that keeps copies of your papers, such as letters, screenshots of texts, receipts and scans, locked on your phone. A photo vault hides pictures. A vault for papers also sorts them: folders for a divorce, an IEP or an estate, a checklist of what to keep, and the date each thing happened.',
      bestFor: 'someone deciding between a hidden album, a photo vault app and a place built for the papers of one hard life event.',
      sections: [
        { h: 'What is the difference between a photo vault and a vault for papers?', a: 'A photo vault hides pictures; a vault for papers keeps records in order.', table: { head: ['', 'Hidden album or Locked Folder', 'Photo vault app', 'Vault for papers (KeepMyProof)'], rows: [
          ['Locks the item', 'Yes, with Face ID, Touch ID or screen lock', 'Yes', 'Yes, with a passcode, Face ID or fingerprint'],
          ['Folders for a life event', 'No', 'Varies by app', 'Five folders, each with a suggested checklist'],
          ['Date it happened and date saved', 'Photo date only', 'Varies by app', 'Both, side by side'],
          ['One PDF to hand to a lawyer or school', 'No', 'Varies by app', 'Yes, a whole folder with an index'],
          ['Files and notes, not just photos', 'Photos only', 'Varies by app', 'Photos, files and notes'],
        ] } },
        { h: 'Which papers belong in a vault?', a: 'The ones you may need to show later, with the day they happened.', list: ['Divorce and co-parenting: bank statements, pickup texts, a co-parenting log.', 'IEP: evaluations, meeting notes, emails with the school.', 'After a parent dies: the death certificate, bills, account letters.', 'Work: pay stubs, schedules, HR emails.', 'VA: discharge papers, medical letters, claim letters.'] },
        { h: 'Is a hidden album enough?', a: 'For a few screenshots, often yes; for a set of papers you will hand to someone, a folder works better.', list: ['iPhone: hide them in Photos (locked Hidden album).', 'Android: Locked Folder in Google Photos, or Safe folder in Files by Google for documents.', 'Both keep the items with your pictures and give no checklist, no date it happened and no single PDF.'] },
        { h: 'What does KeepMyProof not do?', a: 'It keeps copies; it does not judge or certify them.', list: ['The save date records when you saved it, not that something happened.', 'It gives no legal, medical, tax or VA claim advice and is not affiliated with the VA.', 'There is no account, no ads, no analytics, and your papers are never sent to AI.'] },
      ],
      faq: [
        ['Is KeepMyProof a photo vault?', 'No. It locks what you keep, like a vault, but it is built for papers: letters, screenshots of texts, scans, receipts and notes, sorted into folders with suggested checklists. It records the day something happened next to the day you saved it, and makes one PDF of a folder when someone asks for it.'],
        ['Is a vault for papers secure?', 'KeepMyProof encrypts what you keep on your phone, opens with a passcode, Face ID or fingerprint, has no account, and never sends your papers to us or to AI. Anyone who knows your passcode can open it, so use one only you know, and keep the encrypted backup it makes in your own cloud drive.'],
        ['Can I take papers out of Photos into the vault?', 'Yes. Add a photo from your library to a folder. On iPhone, KeepMyProof then offers to remove the original from Photos; Keep it in Photos is the first choice, and if you tap Remove your iPhone asks you to confirm. On Android, delete the original in Google Photos yourself.'],
      ],
    },
    es: {
      title: 'Bóveda de documentos: papeles, no solo fotos | KeepMyProof',
      desc: 'Las bóvedas de fotos ocultan fotos. Una bóveda para papeles guarda cartas, capturas y escaneos en carpetas con lista y fechas, privados en su teléfono.',
      h1: 'Una bóveda para papeles, no solo para fotos',
      answer: 'Una bóveda privada de documentos es una app que guarda copias de papeles, como cartas, capturas de mensajes, recibos y escaneos, bloqueadas en su teléfono. Una bóveda de fotos oculta fotos. Una bóveda para papeles además los ordena: carpetas para un divorcio, un IEP o una herencia, una lista de qué guardar y la fecha en que pasó cada cosa.',
      bestFor: 'quien está decidiendo entre un álbum oculto, una app de bóveda de fotos y un lugar hecho para los papeles de un momento difícil.',
      sections: [
        { h: '¿Qué diferencia hay entre una bóveda de fotos y una para papeles?', a: 'Una bóveda de fotos oculta fotos; una para papeles mantiene los registros en orden.', table: { head: ['', 'Álbum Oculto o Carpeta bloqueada', 'App de bóveda de fotos', 'Bóveda para papeles (KeepMyProof)'], rows: [
          ['Bloquea lo guardado', 'Sí, con Face ID, Touch ID o bloqueo de pantalla', 'Sí', 'Sí, con código, Face ID o huella'],
          ['Carpetas para un momento de la vida', 'No', 'Depende de la app', 'Cinco carpetas, cada una con una lista sugerida'],
          ['Fecha en que pasó y fecha en que se guardó', 'Solo la fecha de la foto', 'Depende de la app', 'Las dos, una junto a la otra'],
          ['Un PDF para dar a un abogado o a la escuela', 'No', 'Depende de la app', 'Sí, una carpeta entera con índice'],
          ['Archivos y notas, no solo fotos', 'Solo fotos', 'Depende de la app', 'Fotos, archivos y notas'],
        ] } },
        { h: '¿Qué papeles van en una bóveda?', a: 'Los que quizá tenga que mostrar después, con el día en que pasaron.', list: ['Divorcio y crianza compartida: estados de cuenta, mensajes de entregas, un registro de crianza.', 'IEP: evaluaciones, notas de reuniones, correos con la escuela.', 'Cuando muere un padre o una madre: el acta de defunción, facturas, cartas de cuentas.', 'Trabajo: talones de pago, horarios, correos de recursos humanos.', 'VA: papeles de baja, cartas médicas, cartas del reclamo.'] },
        { h: '¿Basta con un álbum oculto?', a: 'Para unas cuantas capturas, muchas veces sí; para un grupo de papeles que va a entregar, una carpeta funciona mejor.', list: ['iPhone: ocúltelas en Fotos (álbum Oculto bloqueado).', 'Android: Carpeta bloqueada en Google Fotos, o Carpeta segura en Files de Google para documentos.', 'Los dos dejan todo junto a sus fotos, sin lista, sin fecha en que pasó y sin un solo PDF.'] },
        { h: '¿Qué no hace KeepMyProof?', a: 'Guarda copias; no las juzga ni las certifica.', list: ['La fecha de guardado registra cuándo lo guardó, no que algo pasó.', 'No da asesoría legal, médica, de impuestos ni de reclamos del VA, y no está afiliada al VA.', 'No hay cuenta, ni anuncios, ni analíticas, y sus papeles nunca se envían a la IA.'] },
      ],
      faq: [
        ['¿KeepMyProof es una bóveda de fotos?', 'No. Bloquea lo que guarda, como una bóveda, pero está hecha para papeles: cartas, capturas de mensajes, escaneos, recibos y notas, en carpetas con listas sugeridas. Registra el día en que pasó algo junto al día en que lo guardó, y hace un solo PDF de una carpeta cuando alguien se lo pide.'],
        ['¿Es segura una bóveda para papeles?', 'KeepMyProof cifra lo que guarda en su teléfono, se abre con un código, Face ID o huella, no tiene cuenta y nunca nos envía sus papeles ni a la IA. Quien sepa su código puede abrirla, así que use uno que solo usted conozca y guarde el respaldo cifrado en su propia nube.'],
        ['¿Puedo pasar papeles de Fotos a la bóveda?', 'Sí. Agregue una foto de su fototeca a una carpeta. En iPhone, KeepMyProof luego le ofrece quitar el original de Fotos; Dejarlo en Fotos es la primera opción, y si toca Quitar su iPhone le pide confirmar. En Android, borre usted el original en Google Fotos.'],
      ],
    },
  },
];
