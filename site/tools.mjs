// Free tools (owner approved 2 Nov 2026). Every tool runs entirely in the browser: no upload, no
// account, nothing stored. EN + ES pages, each with a quotable answer, FAQ schema and the app CTA.
// Deadline calculators use ONLY verified, published facts (the same gate as the state pages) and show
// each fact's official source; a calculator with no qualifying facts is a NAMED STOP and not built.

const T = (en, es) => ({ en, es });
export const TOOLS = [
  { id: 'photo-privacy', kind: 'photo-privacy', slug: T('remove-photo-location', 'quitar-ubicacion-de-fotos'),
    title: T('Remove photo location and black out names before you share | KeepMyProof', 'Quitar la ubicación de una foto y tapar nombres antes de compartir | KeepMyProof'),
    h1: T('Remove photo location, then black out a name or address', 'Quite la ubicación de una foto y tape un nombre o una dirección'),
    desc: T('Free tool: strip GPS location and other hidden data from photos, and black out or blur names and addresses on a screenshot. Runs in your browser; nothing is uploaded.', 'Herramienta gratis en Estados Unidos: quite la ubicación GPS y otros datos ocultos de sus fotos y tape nombres o direcciones. Funciona en su navegador; no se sube nada.'),
    answer: T('This free tool removes the hidden location and other data stored inside a photo, then lets you black out or blur a name, address or account number on a screenshot before you share it. It runs entirely in your browser: your photo is never uploaded, and nothing is saved after you close the page.',
      'Esta herramienta gratis quita la ubicación y otros datos ocultos que guarda una foto, y le permite tapar o difuminar un nombre, una dirección o un número de cuenta en una captura antes de compartirla. Todo pasa en su navegador: la foto nunca se sube y no se guarda nada al cerrar la página.'),
    faq: T([['Does a photo really store where it was taken?', 'Many phone cameras save GPS coordinates, the phone model and the time inside the photo file. Anyone you send the original file to can read them. Saving a fresh copy without that data, as this tool does, removes them.'],
      ['Is my photo uploaded anywhere?', 'No. The tool reads the photo in your browser, draws a clean copy and lets you download it. Nothing is sent to KeepMyProof or anyone else, and nothing is kept after you close the page.'],
      ['Should I black out information on papers I send?', 'Only send what the person asking needs. Ask your lawyer, school or agency what they need before you change or black out a paper they asked for, and keep your untouched original.']],
      [['¿Una foto guarda dónde se tomó?', 'Muchas cámaras de teléfono guardan dentro del archivo las coordenadas GPS, el modelo del teléfono y la hora. Cualquiera que reciba el archivo original puede leerlas. Guardar una copia nueva sin esos datos, como hace esta herramienta, los quita.'],
      ['¿Se sube mi foto a algún lugar?', 'No. La herramienta lee la foto en su navegador, dibuja una copia limpia y le deja descargarla. No se envía nada a KeepMyProof ni a nadie, y no se guarda nada al cerrar la página.'],
      ['¿Debo tapar datos en los papeles que envío?', 'Envíe solo lo que la persona necesita. Pregunte a su abogado, escuela o agencia qué necesitan antes de cambiar o tapar un papel que pidieron, y guarde el original sin cambios.']]) },
  { id: 'dated-pdf', kind: 'dated-pdf', slug: T('photos-to-dated-pdf', 'fotos-a-pdf-con-fecha'),
    title: T('Photos and screenshots into one dated PDF, in date order | KeepMyProof', 'Fotos y capturas en un solo PDF con fecha, en orden | KeepMyProof'),
    h1: T('Put photos and screenshots into one dated PDF', 'Junte fotos y capturas en un solo PDF con fecha'),
    desc: T('Free tool: turn photos and screenshots into one PDF in date order, with the date printed on each page. Runs in your browser; nothing is uploaded.', 'Herramienta gratis en Estados Unidos: convierta fotos y capturas en un solo PDF en orden de fecha, con la fecha en cada página. Funciona en su navegador.'),
    answer: T('This free tool puts your photos and screenshots into one PDF, sorted by date, with the date printed at the top of each page. It uses the date stored in the photo when there is one and the file date when there is not, and says which. Everything happens in your browser; nothing is uploaded.',
      'Esta herramienta gratis junta sus fotos y capturas en un solo PDF, ordenadas por fecha, con la fecha impresa arriba de cada página. Usa la fecha guardada en la foto cuando existe y, si no, la fecha del archivo, y dice cuál usó. Todo pasa en su navegador; no se sube nada.'),
    faq: T([['Which date does each page show?', 'The date the camera saved inside the photo when it has one, otherwise the date of the file on your device. Each page says which one it used. Neither date shows when an event happened; write that in your own notes.'],
      ['Are my photos uploaded?', 'No. The PDF is built inside your browser and downloaded to your device. Nothing is sent to KeepMyProof or anyone else.'],
      ['Can I change the order?', 'Pages go in date order, oldest first. To change the order, change which photos you choose or make two PDFs.']],
      [['¿Qué fecha muestra cada página?', 'La fecha que la cámara guardó dentro de la foto cuando existe; si no, la fecha del archivo en su dispositivo. Cada página dice cuál usó. Ninguna de las dos muestra cuándo pasó un hecho; anótelo en sus propias notas.'],
      ['¿Se suben mis fotos?', 'No. El PDF se arma dentro de su navegador y se descarga a su dispositivo. No se envía nada a KeepMyProof ni a nadie.'],
      ['¿Puedo cambiar el orden?', 'Las páginas van en orden de fecha, la más antigua primero. Para cambiar el orden, elija otras fotos o haga dos PDF.']]) },
  { id: 'deadline-discrimination', kind: 'calc', facts: { folder: 'workplace', subtopic: 'discrimination-complaint-deadlines' }, slug: T('discrimination-filing-deadline-calculator', 'calculadora-plazo-denuncia-discriminacion'),
    title: T('Discrimination filing deadline calculator by state | KeepMyProof', 'Calculadora del plazo para denunciar discriminación por estado | KeepMyProof'),
    h1: T('Discrimination charge deadline calculator, by state', 'Calculadora del plazo para denunciar discriminación, por estado'),
    desc: T('Pick your state and the date something happened to see the filing time limits official sources state, the dates they point to, and each source. Educational only.', 'Elija su estado y la fecha de lo que pasó para ver los plazos que dan las fuentes oficiales en Estados Unidos y las fechas que indican. Solo informativo.'),
    answer: T('Pick your state and the date something happened at work. The calculator shows each filing time limit that official federal and state sources state for your state, the calendar date it points to, and the source. It is educational only, not legal advice: deadlines have exceptions, so confirm yours with the agency or a lawyer.',
      'Elija su estado y la fecha de lo que pasó en el trabajo. La calculadora muestra cada plazo que dan las fuentes oficiales federales y estatales para su estado, la fecha a la que apunta y la fuente. Es solo informativa, no es asesoría legal: los plazos tienen excepciones, así que confírmelo con la agencia o un abogado.'),
    faq: T([['Is the date shown my legal deadline?', 'Not necessarily. It is the date that falls the stated number of days after the date you entered. Deadlines can start on a different day or have exceptions. Confirm yours with the EEOC, your state agency or a lawyer.'],
      ['Where do these time limits come from?', 'Each one is copied from an official source, linked under the result, and checked on the date shown. Only facts that passed our source check appear.'],
      ['What if my state is not listed?', 'We list a state only when its official sources passed our check. Open the EEOC time limits page or your state civil rights agency instead.']],
      [['¿La fecha que aparece es mi plazo legal?', 'No necesariamente. Es la fecha que cae la cantidad de días indicada después de la fecha que puso. Los plazos pueden empezar otro día o tener excepciones. Confírmelo con la EEOC, la agencia de su estado o un abogado.'],
      ['¿De dónde salen estos plazos?', 'Cada uno está copiado de una fuente oficial, con su enlace debajo del resultado, y revisado en la fecha que se muestra. Solo aparecen datos que pasaron nuestra revisión.'],
      ['¿Y si mi estado no aparece?', 'Mostramos un estado solo cuando sus fuentes oficiales pasaron la revisión. Consulte la página de plazos de la EEOC o la agencia de derechos civiles de su estado.']]) },
  { id: 'deadline-iep-evaluation', kind: 'calc', facts: { folder: 'iep', subtopic: 'evaluation-timeline' }, slug: T('iep-evaluation-due-date-calculator', 'calculadora-fecha-evaluacion-iep'),
    title: T('IEP evaluation due date calculator by state | KeepMyProof', 'Calculadora de la fecha de la evaluación del IEP por estado | KeepMyProof'),
    h1: T('IEP evaluation timeline calculator, by state', 'Calculadora del plazo de evaluación del IEP, por estado'),
    desc: T('Pick your state and the date you gave consent for an evaluation to see the timeline official sources state and the date it points to, with each source. Educational only.', 'Elija su estado y la fecha en que dio su consentimiento para ver el plazo de evaluación que dan las fuentes oficiales en Estados Unidos. Solo informativo.'),
    answer: T('Pick your state and the date you gave written consent for a special education evaluation. The calculator shows the evaluation timeline that official sources state for your state, the calendar date it points to when the timeline counts calendar days, and the source. School-day timelines need the school calendar, so ask the school.',
      'Elija su estado y la fecha en que firmó el consentimiento para una evaluación de educación especial. La calculadora muestra el plazo que dan las fuentes oficiales de su estado, la fecha a la que apunta cuando el plazo cuenta días naturales, y la fuente. Si cuenta días escolares, pida a la escuela su calendario.'),
    faq: T([['Is this the exact date the evaluation is due?', 'It is the date that falls the stated number of calendar days after the date you entered. States may pause the count for school breaks or count school days. Ask the school or your Parent Center for your exact date.'],
      ['What starts the clock?', 'Under federal rules the timeline usually starts when the school receives your written consent to evaluate. Your state may set its own timeline; the facts shown say what your state source says.'],
      ['Where can I get free help?', 'Every state has a federally funded Parent Training and Information Center that helps families with special education questions at no cost.']],
      [['¿Es la fecha exacta de la evaluación?', 'Es la fecha que cae la cantidad de días naturales indicada después de la fecha que puso. Algunos estados pausan el conteo en las vacaciones escolares o cuentan días escolares. Pregunte a la escuela o a su Centro de Padres.'],
      ['¿Qué pone en marcha el plazo?', 'Según las reglas federales, el plazo suele empezar cuando la escuela recibe su consentimiento por escrito. Su estado puede fijar su propio plazo; los datos muestran lo que dice la fuente de su estado.'],
      ['¿Dónde consigo ayuda gratis?', 'Cada estado tiene un Centro de Capacitación e Información para Padres con fondos federales que ayuda gratis a las familias con preguntas de educación especial.']]) },
  { id: 'deadline-creditor-claims', kind: 'calc', facts: { folder: 'executor', subtopic: 'creditor-claims' }, slug: T('creditor-claim-period-calculator', 'calculadora-plazo-reclamos-acreedores'),
    title: T('Creditor claim period calculator for executors, by state | KeepMyProof', 'Calculadora del plazo de reclamos de acreedores por estado | KeepMyProof'),
    h1: T('Creditor claim period calculator for executors, by state', 'Calculadora del plazo de reclamos de acreedores, por estado'),
    desc: T('Pick your state and the date notice was first published to see the creditor claim period official sources state and the date it points to. Educational only.', 'Elija su estado y la fecha del primer aviso para ver el plazo de reclamos de acreedores que dan las fuentes oficiales en Estados Unidos. Solo informativo.'),
    answer: T('Pick your state and the date notice to creditors was first given or published. The calculator shows the creditor claim period that official sources state for your state, the calendar date it points to, and the source. It is educational only, not legal advice: probate rules have exceptions, so confirm with the court or a lawyer.',
      'Elija su estado y la fecha del primer aviso a los acreedores. La calculadora muestra el plazo de reclamos que dan las fuentes oficiales de su estado, la fecha a la que apunta y la fuente. Es solo informativa, no es asesoría legal: las reglas de sucesiones tienen excepciones, así que confírmelo con la corte o un abogado.'),
    faq: T([['Is this date when the estate can close?', 'Not necessarily. It is the date that falls the stated period after the date you entered. Courts may set other dates. Confirm with the probate court or a lawyer.'],
      ['Where do these periods come from?', 'Each one is copied from an official source, linked under the result, and checked on the date shown.'],
      ['What if my state is not listed?', 'We list a state only when its official sources passed our check. Open your county probate court website instead.']],
      [['¿Es la fecha en que se puede cerrar la herencia?', 'No necesariamente. Es la fecha que cae el plazo indicado después de la fecha que puso. La corte puede fijar otras fechas. Confírmelo con la corte de sucesiones o un abogado.'],
      ['¿De dónde salen estos plazos?', 'Cada uno está copiado de una fuente oficial, con su enlace debajo del resultado, y revisado en la fecha que se muestra.'],
      ['¿Y si mi estado no aparece?', 'Mostramos un estado solo cuando sus fuentes oficiales pasaron la revisión. Consulte el sitio de la corte de sucesiones de su condado.']]) },
  { id: 'deadline-va-intent', kind: 'calc', facts: { folder: 'va', match: /intent to file/i, national: true }, slug: T('va-intent-to-file-date-calculator', 'calculadora-fecha-intencion-de-presentar-va'),
    title: T('VA intent to file date calculator: the one-year date | KeepMyProof', 'Calculadora de la fecha de la intención de presentar al VA | KeepMyProof'),
    h1: T('VA intent to file: the one-year date', 'Intención de presentar al VA: la fecha de un año'),
    desc: T('Enter the date VA received your intent to file to see the date one year later, with the official VA source. KeepMyProof is not affiliated with the VA. Educational only.', 'Ponga la fecha en que el VA recibió su intención de presentar para ver la fecha un año después, con la fuente oficial. No afiliado al VA. Solo informativo.'),
    answer: T('Enter the date VA received your intent to file. The calculator shows the date one year later and the official VA source that states the one-year rule. KeepMyProof is not affiliated with the VA and does not prepare or file claims. For help, VA.gov lists free accredited representatives. Educational only.',
      'Ponga la fecha en que el VA recibió su intención de presentar. La calculadora muestra la fecha un año después y la fuente oficial del VA con la regla de un año. KeepMyProof no está afiliado al VA y no prepara ni presenta reclamos. Para ayuda, VA.gov tiene representantes acreditados gratis. Solo informativo.'),
    faq: T([['What is an intent to file?', 'It tells VA you plan to file a claim. VA explains that if you file the claim within one year, you may get benefits back to the date of the intent to file. The source is linked under the result.'],
      ['Does KeepMyProof file anything with VA?', 'No. KeepMyProof is not affiliated with the VA and does not prepare, file or judge a claim. It only keeps copies of your own papers on your phone.'],
      ['Who can help me file?', 'A VA-accredited representative, such as a veterans service officer, can help you at no cost. VA.gov lists them.']],
      [['¿Qué es la intención de presentar?', 'Le avisa al VA que piensa presentar un reclamo. El VA explica que si presenta el reclamo dentro de un año, puede recibir beneficios desde la fecha de la intención. La fuente está enlazada debajo del resultado.'],
      ['¿KeepMyProof presenta algo ante el VA?', 'No. KeepMyProof no está afiliado al VA y no prepara, presenta ni evalúa reclamos. Solo guarda copias de sus propios papeles en su teléfono.'],
      ['¿Quién me puede ayudar a presentar?', 'Un representante acreditado por el VA, como un oficial de servicios para veteranos, puede ayudarle gratis. VA.gov tiene la lista.']]) },
  ...[
    ['coparenting-log', T('co-parenting-log-printable', 'registro-de-crianza-para-imprimir'), T('Co-parenting log', 'Registro de crianza'), T(['Date', 'Time', 'What was planned', 'What happened', 'Notes'], ['Fecha', 'Hora', 'Lo previsto', 'Lo que pasó', 'Notas'])],
    ['incident-log', T('workplace-incident-log-printable', 'registro-de-incidentes-del-trabajo'), T('Workplace incident log', 'Registro de incidentes del trabajo'), T(['Date and time', 'Place', 'Who was there', 'What was said or done', 'What I did after'], ['Fecha y hora', 'Lugar', 'Quién estaba', 'Qué se dijo o hizo', 'Qué hice después'])],
    ['iep-notes', T('iep-meeting-notes-printable', 'notas-de-reunion-iep-para-imprimir'), T('IEP meeting notes', 'Notas de la reunión del IEP'), T(['Topic', 'What was said', 'Who said it', 'What was agreed', 'Follow-up by (date)'], ['Tema', 'Lo que se dijo', 'Quién lo dijo', 'Lo acordado', 'Seguimiento para (fecha)'])],
    ['executor-tasks', T('executor-task-list-printable', 'lista-de-tareas-del-albacea'), T('Executor task list', 'Lista de tareas del albacea'), T(['Task', 'Who to contact', 'Papers needed', 'Date done', 'Notes'], ['Tarea', 'A quién contactar', 'Papeles necesarios', 'Fecha hecha', 'Notas'])],
  ].map(([id, slug, name, cols]) => ({ id, kind: 'printable', slug, cols,
    title: T(`${name.en}: free printable you can fill in on screen | KeepMyProof`, `${name.es}: para llenar en pantalla e imprimir gratis | KeepMyProof`),
    h1: T(`${name.en}, free to fill in and print`, `${name.es}, gratis para llenar e imprimir`),
    desc: T(`A free ${name.en.toLowerCase()} you fill in on screen, then print or save as a PDF. Runs in your browser; nothing is uploaded or saved.`, `Un ${name.es.toLowerCase()} gratis para llenar en pantalla e imprimir o guardar como PDF en Estados Unidos. Funciona en su navegador; no se sube ni se guarda nada.`),
    answer: T(`This free ${name.en.toLowerCase()} lets you type your entries on screen, add as many rows as you need, then print it or save it as a PDF from your browser's print window. Nothing is uploaded or saved, so print or save it before you close the page. Write each entry on the day it happens.`,
      `Este ${name.es.toLowerCase()} gratis le deja escribir en pantalla, agregar todas las filas que necesite y luego imprimirlo o guardarlo como PDF desde la ventana de impresión de su navegador. No se sube ni se guarda nada, así que imprímalo o guárdelo antes de cerrar la página. Anote cada cosa el mismo día.`),
    faq: T([['Is anything I type saved?', 'No. What you type stays in this browser tab only and is gone when you close it. Print it or save it as a PDF first.'],
      ['How do I save it as a PDF?', 'Press Print, then choose "Save as PDF" (on a phone, use Share, then Print, then save). The buttons and site menus are left out of the printout.'],
      ['What should each entry include?', 'The date, the facts as plainly as you can, and who was there. Write entries on the day and add a new one rather than changing an old one.']],
      [['¿Se guarda lo que escribo?', 'No. Lo que escribe queda solo en esta pestaña y desaparece al cerrarla. Imprímalo o guárdelo como PDF antes.'],
      ['¿Cómo lo guardo como PDF?', 'Toque Imprimir y elija "Guardar como PDF" (en el teléfono, use Compartir, luego Imprimir, y guárdelo). Los botones y menús del sitio no salen en la impresión.'],
      ['¿Qué debe tener cada nota?', 'La fecha, los hechos lo más claro posible y quién estaba. Escríbala el mismo día y agregue una nueva en vez de cambiar una vieja.']]) })),
];

const UNITS = { day: 'day', days: 'day', month: 'month', months: 'month', year: 'year', years: 'year' };
const WORDN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, thirty: 30, sixty: 60, ninety: 90 };
/** Durations a fact states, e.g. "within 300 days", "4 months". kind: calendar | school | business. */
export function durations(claim) {
  const out = [], re = /\b(\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|thirty|sixty|ninety)(?:\s*\(\d+\))?[\s-]+(calendar\s+|school\s+|business\s+|working\s+|instructional\s+)?(days?|months?|years?)\b/gi;
  for (const m of String(claim).matchAll(re)) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : WORDN[m[1].toLowerCase()];
    const k = (m[2] || '').trim().toLowerCase();
    out.push({ n, unit: UNITS[m[3].toLowerCase()], kind: k === 'school' || k === 'instructional' ? 'school' : k === 'business' || k === 'working' ? 'business' : 'calendar' });
  }
  return out;
}

/** Calculator rows from the cluster model (published, verified facts only). */
export function calcData(tool, model, toolFacts = []) {
  const subs = model[tool.facts.folder] || [], rows = {};
  for (const f of toolFacts.filter((x) => x.tool === tool.id)) (rows.US ||= []).push({ en: f.claim_en, es: f.claim_es, src: f.source_url, name: f.source_name, on: f.verifiedOn, d: durations(f.claim_en) });
  if (tool.facts.national) return rows;
  for (const s of subs) {
    if (tool.facts.subtopic && s.data.subtopic !== tool.facts.subtopic) continue;
    for (const st of s.states) for (const f of st.byLang.en) {
      if (tool.facts.match && !tool.facts.match.test(f.claim_en)) continue;
      const d = durations(f.claim_en);
      if (!d.length) continue;
      const key = tool.facts.national ? 'US' : st.code;
      (rows[key] ||= []);
      if (!rows[key].some((x) => x.en === f.claim_en)) rows[key].push({ en: f.claim_en, es: f.claim_es, src: f.source_url, name: f.source_name, on: f.verifiedOn, d });
    }
  }
  return rows;
}
