// Tenant, home inventory and co-parenting landing pages (research of 21 Nov 2026, audience-leverage section
// 5.1). Same shape and gates as site/landings.mjs (it spreads these into LANDINGS_BASE and LANDINGS_CJK):
// answer first, question headings, steps or a table, FAQ, sources, the folder's checklist and PDF, the store
// block. Facts about other apps are from their own App Store listing or pricing page, with the date read;
// names are used only to identify the product. Never a legal or insurance outcome.
import { storeLine } from './lib/stores.mjs';
const same = (u) => ({ en: u, es: u });
const src = (name, url) => ({ name, url });
const S = {
  hud: src('HUD: Tenant rights, laws and protections by state', same('https://www.hud.gov/states')),
  usagov: src('USAGov: How to file a complaint against a landlord', same('https://www.usa.gov/tenant-rights')),
  sf: src('SF.gov: Changes to security deposit laws, photograph requirements (California AB 2801)', same('https://www.sf.gov/upcoming-changes-to-security-deposit-laws-photograph-requirements')),
  wa: src('Washington RCW 59.18.280: Moneys paid as deposit or security', same('https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.280')),
  ny: src('New York General Obligations Law 7-108', same('https://www.nysenate.gov/legislation/laws/GOB/7-108')),
  naic: src('NAIC: Home inventory', same('https://content.naic.org/consumer/home-inventory')),
  ready: src('Ready.gov: Financial preparedness', same('https://www.ready.gov/financial-preparedness')),
  sortly: src('App Store: Sortly: Inventory Simplified', same('https://apps.apple.com/us/app/id529353551')),
  umr: src('App Store: Under My Roof Home Inventory +', same('https://apps.apple.com/us/app/id1524335878')),
  nestegg: src('App Store: Nest Egg Home Inventory', same('https://apps.apple.com/us/app/id431188993')),
  homecontents: src('App Store: Home Contents', same('https://apps.apple.com/us/app/id420151922')),
  encircle: src('App Store: Encircle', same('https://apps.apple.com/us/app/id604527488')),
  css: src('U.S. Office of Child Support Services: Information for parents', same('https://www.acf.hhs.gov/css/parents')),
  tp: src('TalkingParents: Pricing', same('https://talkingparents.com/pricing')),
  ofw: src('OurFamilyWizard: Plans and pricing', same('https://www.ourfamilywizard.com/pricing')),
};
/** The day the other apps' listings and pricing pages were read for the tables below. */
export const CHECKED = '2026-11-21';

export const TENANT_LANDINGS = [
  {
    id: 'move-out-checklist', published: '2026-11-21', checked: CHECKED, kind: 'tenant', path: { en: '/tenant/move-out-checklist', es: '/es/inquilinos/lista-para-mudarse' },
    sources: [S.sf, S.wa, S.hud],
    en: {
      title: 'Move-out checklist for tenants: photos, cleaning and papers | KeepMyProof',
      desc: 'A free move-out checklist for renters: what to clean, which photos to take room by room, the papers to keep, and when your state says the deposit is due back.',
      h1: 'Move-out checklist for tenants',
      answer: 'Before you hand back the keys, clean, then photograph every room the way you did at move-in: floors, walls, appliances inside, bathrooms, windows and meters. Give your forwarding address in writing, return every key, and keep the lease, your move-in photos, receipts and every message about the deposit together.',
      bestFor: 'a renter moving out who wants a clear, dated record of how the home was left.',
      sections: [
        { h: 'What should I do in the last two weeks?', a: 'Give notice, clean, and plan the walk-through.', steps: ['Check your lease for the notice you must give and how to give it.', 'Ask the landlord for a move-out walk-through, and write down the date and time agreed.', 'Repair what you broke, or ask what will be charged.', 'Clean room by room (the list below), then take your photos.', 'Give your forwarding address in writing and keep a copy.'] },
        { h: 'Which photos should I take?', a: 'The same rooms and angles as your move-in photos, so each pair shows the same spot.', list: ['Each room from the doorway, then each wall, the floor and the ceiling.', 'Inside the oven, fridge, dishwasher, cabinets and closets.', 'Bathroom fixtures, tiles, tub or shower, and under the sink.', 'Windows, blinds, doors, locks and any marks you are leaving.', 'The meters, and the keys laid out before you hand them back.'] },
        { h: 'What do landlords usually check when cleaning?', a: 'Kitchens and bathrooms most of all.', list: ['Kitchen: appliances inside and out, counters, cabinets, sink and floor.', 'Bathrooms: toilet, tub or shower, sink, mirror, tiles and floor.', 'Every room: dust, cobwebs, marks on walls, floors swept or vacuumed, trash out.', 'Outside: any patio, balcony, garage or yard the lease makes yours.'] },
        { h: 'What papers should I keep?', a: 'Everything that shows what you paid and what you left.', list: ['The lease and any move-in checklist the landlord gave you.', 'Deposit and rent receipts.', 'Repair requests and the replies.', 'Your written notice and forwarding address.', 'Any letter about the deposit or deductions, with the envelope or email date.'] },
      ],
      faq: [
        ['When does the landlord have to return my deposit?', 'Each state sets its own deadline, and some count from the day you leave and others from when you give a forwarding address. Our state pages quote each state\'s law with a link and the date we checked it. Read the current law for your state before you rely on a date.'],
        ['Do landlords have to take photos too?', 'In California, yes, for many deductions. SF.gov says that from April 1, 2025, landlords must photograph the unit before and after repairs or cleaning they deduct for, and from July 1, 2025, at the start of new tenancies. Your own photos are still your own record.'],
        ['Is this legal advice?', 'No. This page is educational only and is not legal advice. KeepMyProof keeps your own photos and papers; it cannot say how a deposit dispute will turn out. For advice, ask a tenant rights office, legal aid or a lawyer licensed in your state.'],
      ],
    },
    es: {
      title: 'Lista para mudarse de un alquiler: fotos, limpieza y papeles | KeepMyProof',
      desc: 'Una lista gratis para inquilinos que se mudan en Estados Unidos: qué limpiar, qué fotos tomar cuarto por cuarto, qué papeles guardar y cuándo se debe devolver el depósito.',
      h1: 'Lista para mudarse de un alquiler',
      answer: 'Antes de entregar las llaves, limpie y luego fotografíe cada cuarto como lo hizo al mudarse: pisos, paredes, aparatos por dentro, baños, ventanas y medidores. Dé su dirección nueva por escrito, devuelva todas las llaves y guarde juntos el contrato, sus fotos de entrada, los recibos y cada mensaje sobre el depósito.',
      bestFor: 'quien se muda de un alquiler y quiere un registro claro y con fecha de cómo dejó la vivienda.',
      sections: [
        { h: '¿Qué hago en las últimas dos semanas?', a: 'Avise, limpie y planee la revisión final.', steps: ['Revise en su contrato el aviso que debe dar y cómo darlo.', 'Pida al arrendador una revisión de salida y anote la fecha y la hora acordadas.', 'Arregle lo que rompió, o pregunte qué le cobrarán.', 'Limpie cuarto por cuarto (la lista de abajo) y luego tome sus fotos.', 'Dé su dirección nueva por escrito y guarde una copia.'] },
        { h: '¿Qué fotos debo tomar?', a: 'Los mismos cuartos y ángulos que sus fotos de entrada, para que cada par muestre el mismo lugar.', list: ['Cada cuarto desde la puerta, luego cada pared, el piso y el techo.', 'El horno, el refrigerador, el lavaplatos, los gabinetes y los clósets por dentro.', 'Los accesorios del baño, los azulejos, la tina o ducha y debajo del lavabo.', 'Ventanas, persianas, puertas, cerraduras y cualquier marca que deje.', 'Los medidores, y las llaves sobre la mesa antes de entregarlas.'] },
        { h: '¿Qué suelen revisar en la limpieza?', a: 'Sobre todo la cocina y los baños.', list: ['Cocina: aparatos por dentro y por fuera, mostradores, gabinetes, fregadero y piso.', 'Baños: inodoro, tina o ducha, lavabo, espejo, azulejos y piso.', 'Cada cuarto: polvo, telarañas, marcas en paredes, pisos barridos o aspirados, basura afuera.', 'Afuera: patio, balcón, garaje o jardín si el contrato los hace suyos.'] },
        { h: '¿Qué papeles debo guardar?', a: 'Todo lo que muestra lo que pagó y cómo dejó la vivienda.', list: ['El contrato y cualquier lista de entrada que le dio el arrendador.', 'Recibos del depósito y de la renta.', 'Solicitudes de reparación y las respuestas.', 'Su aviso por escrito y su dirección nueva.', 'Cualquier carta sobre el depósito o los descuentos, con la fecha del sobre o del correo.'] },
      ],
      faq: [
        ['¿Cuándo tiene que devolverme el depósito el arrendador?', 'Cada estado fija su propio plazo; algunos cuentan desde el día en que se va y otros desde que da su dirección nueva. Nuestras páginas estatales citan la ley de cada estado con un enlace y la fecha en que la revisamos. Lea la ley vigente de su estado antes de contar con una fecha.'],
        ['¿El arrendador también tiene que tomar fotos?', 'En California, sí, para muchos descuentos. SF.gov dice que desde el 1 de abril de 2025 el arrendador debe fotografiar la vivienda antes y después de las reparaciones o limpiezas que descuente, y desde el 1 de julio de 2025 al inicio de los nuevos contratos. Sus propias fotos siguen siendo su registro.'],
        ['¿Esto es asesoría legal?', 'No. Esta página es solo informativa y no es asesoría legal. KeepMyProof guarda sus propias fotos y papeles; no puede decir cómo terminará una disputa por el depósito. Para recibir consejo, pregunte a una oficina de derechos de inquilinos, de ayuda legal o a un abogado de su estado.'],
      ],
    },
  },
  {
    id: 'move-in-checklist', published: '2026-11-21', checked: CHECKED, kind: 'tenant', path: { en: '/tenant/move-in-checklist', es: '/es/inquilinos/lista-de-entrada' },
    sources: [S.sf, S.wa, S.hud],
    en: {
      title: 'Move-in checklist and inspection for renters, room by room | KeepMyProof',
      desc: 'A free room-by-room move-in inspection checklist for renters: what to check, which photos to take in the first days, and which papers to keep from day one.',
      h1: 'Move-in checklist for renters, room by room',
      answer: 'In your first days, before you unpack, walk through every room and photograph it: floors, walls, ceilings, windows, doors, appliances inside and out, fixtures and meters. Write down anything worn, broken or dirty, send that list to the landlord in writing, and keep it with the lease and your deposit receipt.',
      bestFor: 'a renter moving in who wants a record of how the home looked on the first day.',
      sections: [
        { h: 'What should I check in each room?', a: 'Look, test, then photograph.', list: ['Floors, walls and ceilings: stains, holes, cracks, marks.', 'Doors, locks and windows: do they open, close and lock; any broken screens or blinds.', 'Lights, switches and outlets: test each one.', 'Smoke and carbon monoxide alarms: are they there and do they sound.', 'Heating, cooling and hot water: do they work.'] },
        { h: 'Kitchen and bathrooms', a: 'The rooms where deductions are most often argued about.', list: ['Oven, stove, fridge, freezer and dishwasher, inside and out.', 'Cabinets, drawers, counters and the sink.', 'Toilet, tub or shower, sink, tiles, grout and the floor around them.', 'Any sign of leaks, mold or pests.'] },
        { h: 'How should I take the photos?', a: 'So the move-out photos can match them later.', steps: ['Stand in the doorway of each room and take one wide photo.', 'Photograph each wall, the floor and the ceiling.', 'Take close photos of every mark or fault you wrote down.', 'Photograph the meters and the keys you were given.', 'Keep the photos in one folder, by room, the same day.'] },
        { h: 'What papers should I keep from day one?', a: 'The ones you will need when you move out.', list: ['The signed lease and any rules or addenda.', 'The landlord\'s move-in checklist, with your notes on it.', 'Your deposit and first rent receipts.', 'The list of faults you sent, and the date you sent it.'] },
      ],
      faq: [
        ['How soon should I do the move-in inspection?', 'As soon as you get the keys and before you move furniture in, so the photos show the home as you received it. Some leases or states set a deadline for returning a move-in checklist; read your lease and any checklist the landlord gives you.'],
        ['Should I send the landlord my list?', 'A dated, written copy of the faults you found, kept with your own photos, is a clear record of what was already there. Keep a copy of what you sent and the date you sent it.'],
        ['Is this legal advice?', 'No. This page is educational only and is not legal advice. For your state\'s rules on move-in checklists and deposits, see HUD\'s state pages, or ask a tenant rights office or legal aid.'],
      ],
    },
    es: {
      title: 'Lista de entrada para inquilinos, cuarto por cuarto | KeepMyProof',
      desc: 'Una lista gratis para revisar la vivienda al mudarse, cuarto por cuarto: qué revisar, qué fotos tomar en los primeros días y qué papeles guardar desde el primer día.',
      h1: 'Lista de entrada para inquilinos, cuarto por cuarto',
      answer: 'En los primeros días, antes de desempacar, recorra cada cuarto y fotografíelo: pisos, paredes, techos, ventanas, puertas, aparatos por dentro y por fuera, accesorios y medidores. Anote todo lo gastado, roto o sucio, envíe esa lista por escrito al arrendador y guárdela con el contrato y el recibo de su depósito.',
      bestFor: 'quien se muda a un alquiler y quiere un registro de cómo estaba la vivienda el primer día.',
      sections: [
        { h: '¿Qué reviso en cada cuarto?', a: 'Mire, pruebe y luego fotografíe.', list: ['Pisos, paredes y techos: manchas, hoyos, grietas, marcas.', 'Puertas, cerraduras y ventanas: si abren, cierran y cierran con llave; mallas o persianas rotas.', 'Luces, interruptores y enchufes: pruebe cada uno.', 'Alarmas de humo y de monóxido de carbono: si están y si suenan.', 'Calefacción, aire y agua caliente: si funcionan.'] },
        { h: 'Cocina y baños', a: 'Los cuartos donde más se discuten los descuentos.', list: ['Horno, estufa, refrigerador, congelador y lavaplatos, por dentro y por fuera.', 'Gabinetes, cajones, mostradores y el fregadero.', 'Inodoro, tina o ducha, lavabo, azulejos, juntas y el piso alrededor.', 'Cualquier señal de fugas, moho o plagas.'] },
        { h: '¿Cómo tomo las fotos?', a: 'De forma que las fotos de salida puedan coincidir después.', steps: ['Párese en la puerta de cada cuarto y tome una foto amplia.', 'Fotografíe cada pared, el piso y el techo.', 'Tome fotos de cerca de cada marca o falla que anotó.', 'Fotografíe los medidores y las llaves que le dieron.', 'Guarde las fotos en una carpeta, por cuarto, el mismo día.'] },
        { h: '¿Qué papeles guardo desde el primer día?', a: 'Los que necesitará al mudarse.', list: ['El contrato firmado y cualquier regla o anexo.', 'La lista de entrada del arrendador, con sus notas.', 'Los recibos del depósito y de la primera renta.', 'La lista de fallas que envió y la fecha en que la envió.'] },
      ],
      faq: [
        ['¿Cuándo debo hacer la revisión de entrada?', 'En cuanto reciba las llaves y antes de meter muebles, para que las fotos muestren la vivienda como se la entregaron. Algunos contratos o estados fijan un plazo para devolver la lista de entrada; lea su contrato y cualquier lista que le dé el arrendador.'],
        ['¿Debo enviar mi lista al arrendador?', 'Una copia escrita y con fecha de las fallas que encontró, guardada con sus propias fotos, es un registro claro de lo que ya estaba. Guarde una copia de lo que envió y la fecha en que lo envió.'],
        ['¿Esto es asesoría legal?', 'No. Esta página es solo informativa y no es asesoría legal. Para las reglas de su estado sobre listas de entrada y depósitos, vea las páginas estatales de HUD, o pregunte a una oficina de derechos de inquilinos o de ayuda legal.'],
      ],
    },
  },
  {
    id: 'wear-and-tear', published: '2026-11-21', checked: CHECKED, kind: 'tenant', path: { en: '/tenant/normal-wear-and-tear-vs-damage', es: '/es/inquilinos/desgaste-normal-o-dano' },
    sources: [S.wa, S.ny, S.hud],
    en: {
      title: 'Normal wear and tear vs damage: examples for renters | KeepMyProof',
      desc: 'What normal wear and tear usually means compared with damage, with common examples, and how dated before-and-after photos help a renter and a landlord agree.',
      h1: 'Normal wear and tear vs damage',
      answer: 'Normal wear and tear is the slow change that comes from living in a home: faded paint, light scuffs, worn carpet paths, loose handles. Damage goes beyond ordinary use: holes, burns, stains, broken fixtures, pet damage. State laws, such as Washington\'s, bar deductions for wear resulting from ordinary use; dated photos show which is which.',
      bestFor: 'a renter or a small landlord sorting out what a deposit deduction can cover.',
      sections: [
        { h: 'Common examples', a: 'Usually, though every lease and state differs.', table: { head: ['', 'Usually wear and tear', 'Usually damage'], rows: [['Walls', 'Faded paint, a few small nail holes, light scuffs', 'Large holes, unapproved paint colors, crayon or marker'], ['Floors', 'Worn paths in carpet, light scratches on wood', 'Burns, large stains, pet damage, deep gouges'], ['Kitchen', 'Worn finish on counters, loose cabinet hinges', 'Burn marks, cracked counters, broken appliance parts'], ['Bathroom', 'Worn grout, dull fixtures', 'Cracked sink or tub, broken mirror, mold left uncleaned'], ['Doors and windows', 'Sticking doors, faded blinds', 'Broken glass, kicked-in doors, torn screens']] } },
        { h: 'What do state laws say?', a: 'Many name ordinary wear and tear in the deposit law itself.', list: ['Washington\'s deposit law (RCW 59.18.280) says a landlord may not charge for wear resulting from ordinary use of the premises.', 'New York\'s General Obligations Law 7-108 limits what a landlord may keep, and excludes normal wear and tear.', 'Other states use their own words; our state pages quote each deposit law and link to it.'] },
        { h: 'How do photos help?', a: 'A matched pair, dated, shows the change.', steps: ['At move-in, photograph each room and every mark that is already there.', 'At move-out, take the same photos from the same spots.', 'Keep each pair together with both dates.', 'If a deduction comes, compare the pairs and the itemized list.'] },
      ],
      faq: [
        ['Can a landlord charge for repainting?', 'It depends on the state, the lease, how long you lived there and why the walls need paint. Paint that has simply aged is usually treated as wear; marks, holes or colors you added are more often treated as damage. Read your state\'s deposit law and ask a tenant help office if you disagree.'],
        ['What if I disagree with a deduction?', 'Ask in writing for the itemized list if you did not get one, compare it with your photos, and reply in writing. HUD lists tenant help and legal aid by state. KeepMyProof cannot say how a dispute will turn out.'],
        ['Is this legal advice?', 'No. This page is educational only and is not legal advice. The examples are general and every state, lease and home is different. Ask a tenant rights office, legal aid or a lawyer licensed in your state about your situation.'],
      ],
    },
    es: {
      title: 'Desgaste normal o daño: ejemplos para inquilinos | KeepMyProof',
      desc: 'Qué suele significar desgaste normal frente a daño, con ejemplos comunes, y cómo las fotos de antes y después con fecha ayudan a inquilinos y arrendadores a ponerse de acuerdo.',
      h1: 'Desgaste normal o daño',
      answer: 'El desgaste normal es el cambio lento que viene de vivir en una casa: pintura descolorida, marcas leves, alfombra gastada en el paso, manijas flojas. El daño va más allá del uso normal: hoyos, quemaduras, manchas, accesorios rotos, daños de mascotas. Leyes como la de Washington prohíben descontar el desgaste del uso normal; las fotos con fecha muestran la diferencia.',
      bestFor: 'inquilinos o pequeños arrendadores que quieren aclarar qué puede cubrir un descuento del depósito.',
      sections: [
        { h: 'Ejemplos comunes', a: 'En general, aunque cada contrato y estado es distinto.', table: { head: ['', 'Suele ser desgaste', 'Suele ser daño'], rows: [['Paredes', 'Pintura descolorida, algunos hoyos pequeños de clavos, marcas leves', 'Hoyos grandes, colores no aprobados, crayón o marcador'], ['Pisos', 'Alfombra gastada en el paso, rayones leves en madera', 'Quemaduras, manchas grandes, daños de mascotas, surcos profundos'], ['Cocina', 'Acabado gastado en mostradores, bisagras flojas', 'Quemaduras, mostradores rotos, piezas de aparatos rotas'], ['Baño', 'Juntas gastadas, accesorios opacos', 'Lavabo o tina rotos, espejo roto, moho sin limpiar'], ['Puertas y ventanas', 'Puertas que se atoran, persianas descoloridas', 'Vidrios rotos, puertas forzadas, mallas rotas']] } },
        { h: '¿Qué dicen las leyes estatales?', a: 'Muchas nombran el desgaste normal en la propia ley del depósito.', list: ['La ley de depósitos de Washington (RCW 59.18.280) dice que el arrendador no puede cobrar el desgaste que resulta del uso normal de la vivienda.', 'La Ley de Obligaciones Generales 7-108 de Nueva York limita lo que el arrendador puede quedarse y excluye el desgaste normal.', 'Otros estados usan sus propias palabras; nuestras páginas estatales citan cada ley y la enlazan.'] },
        { h: '¿Cómo ayudan las fotos?', a: 'Un par de fotos con fecha muestra el cambio.', steps: ['Al mudarse, fotografíe cada cuarto y cada marca que ya existe.', 'Al irse, tome las mismas fotos desde los mismos lugares.', 'Guarde cada par junto con las dos fechas.', 'Si llega un descuento, compare los pares con la lista detallada.'] },
      ],
      faq: [
        ['¿Me pueden cobrar por pintar?', 'Depende del estado, del contrato, de cuánto tiempo vivió ahí y de por qué hay que pintar. La pintura que solo envejeció suele verse como desgaste; las marcas, los hoyos o los colores que usted puso se ven más a menudo como daño. Lea la ley de depósitos de su estado y pregunte a una oficina de ayuda si no está de acuerdo.'],
        ['¿Y si no estoy de acuerdo con un descuento?', 'Pida por escrito la lista detallada si no la recibió, compárela con sus fotos y responda por escrito. HUD indica ayuda para inquilinos y ayuda legal por estado. KeepMyProof no puede decir cómo terminará una disputa.'],
        ['¿Esto es asesoría legal?', 'No. Esta página es solo informativa y no es asesoría legal. Los ejemplos son generales y cada estado, contrato y vivienda es distinto. Pregunte a una oficina de derechos de inquilinos, de ayuda legal o a un abogado de su estado.'],
      ],
    },
  },
  {
    id: 'renters-insurance-inventory', published: '2026-11-21', checked: CHECKED, kind: 'inventory', path: { en: '/home-inventory/renters-insurance', es: '/es/inventario-del-hogar/seguro-de-inquilino' },
    sources: [S.naic, S.ready],
    en: {
      title: 'Home inventory for renters insurance: what to list and keep | KeepMyProof',
      desc: 'How to make a home inventory for renters insurance: what to photograph, the purchase dates, receipts and serial numbers to keep, and where to keep the copy.',
      h1: 'Home inventory for renters insurance',
      answer: 'A renters insurance inventory lists your own things, room by room: a photo of each, what it is, the brand and model, roughly when you bought it and what you paid, the receipt if you kept it, and serial numbers for electronics. Do the most expensive things first, and keep a copy away from home.',
      bestFor: 'a renter with a new or renewed renters insurance policy who has never listed what they own.',
      sections: [
        { h: 'How do I make it in one afternoon?', a: 'One room at a time, biggest things first.', steps: ['Start in the room with the most expensive things.', 'Take a wide photo of the room, then a photo of each item worth listing.', 'Photograph the serial number or label on electronics and appliances.', 'Note roughly when you bought it and what you paid; add the receipt if you have it.', 'Move to the next room, and finish with closets, storage and anything kept elsewhere.'] },
        { h: 'What do renters often forget?', a: 'Small things add up.', list: ['Clothes, shoes and coats.', 'Kitchen things: pots, small appliances, dishes.', 'Bikes, tools and sports gear.', 'Anything in a storage unit or a car.', 'Things that belong to a roommate are theirs to list, not yours.'] },
        { h: 'Where should the inventory live?', a: 'Somewhere a fire or break-in cannot reach.', list: ['An encrypted copy saved to your own cloud drive.', 'A copy with someone you trust.', 'Not only on paper in the home it describes.'] },
      ],
      faq: [
        ['Does renters insurance require an inventory?', 'Policies differ. Many insurers ask for a list of what was lost when you claim, and the NAIC, the group of state insurance regulators, suggests making an inventory before you need it. Read your policy or ask your agent what it asks for.'],
        ['How often should I update it?', 'When you buy something worth listing, when you move, and once a year when the policy renews. Adding one item at a time takes a minute; rebuilding a list from memory after a loss is much harder.'],
        ['Is this insurance advice?', 'No. This page is educational only and is not insurance or legal advice. What your policy covers is set by your policy and your state. Ask your agent or your state insurance department.'],
      ],
    },
    es: {
      title: 'Inventario del hogar para el seguro de inquilino | KeepMyProof',
      desc: 'Cómo hacer un inventario del hogar para el seguro de inquilino en Estados Unidos: qué fotografiar, fechas de compra, recibos y números de serie, y dónde guardar la copia.',
      h1: 'Inventario del hogar para el seguro de inquilino',
      answer: 'Un inventario para el seguro de inquilino enumera sus cosas, cuarto por cuarto: una foto de cada una, qué es, la marca y el modelo, cuándo la compró y cuánto pagó, el recibo si lo guardó y el número de serie de los electrónicos. Empiece por lo de más valor y guarde una copia fuera de casa.',
      bestFor: 'quien renta, tiene una póliza nueva o renovada y nunca ha anotado lo que tiene.',
      sections: [
        { h: '¿Cómo lo hago en una tarde?', a: 'Un cuarto a la vez, empezando por lo más grande.', steps: ['Empiece por el cuarto con las cosas de más valor.', 'Tome una foto amplia del cuarto y luego una de cada cosa que valga la pena anotar.', 'Fotografíe el número de serie o la etiqueta de electrónicos y aparatos.', 'Anote más o menos cuándo la compró y cuánto pagó; agregue el recibo si lo tiene.', 'Pase al siguiente cuarto y termine con clósets, bodega y lo que guarde en otro lugar.'] },
        { h: '¿Qué se suele olvidar?', a: 'Las cosas pequeñas suman.', list: ['Ropa, zapatos y abrigos.', 'Cosas de cocina: ollas, aparatos pequeños, platos.', 'Bicicletas, herramientas y equipo deportivo.', 'Lo que tenga en una bodega o en el auto.', 'Lo de un compañero de casa lo anota él, no usted.'] },
        { h: '¿Dónde guardo el inventario?', a: 'Donde no llegue un incendio ni un robo.', list: ['Una copia cifrada en su propia nube.', 'Una copia con alguien de confianza.', 'No solo en papel dentro de la casa que describe.'] },
      ],
      faq: [
        ['¿El seguro de inquilino exige un inventario?', 'Las pólizas varían. Muchas aseguradoras piden una lista de lo perdido al presentar un reclamo, y la NAIC, que reúne a los reguladores estatales de seguros, sugiere hacer el inventario antes de necesitarlo. Lea su póliza o pregunte a su agente qué pide.'],
        ['¿Cada cuánto lo actualizo?', 'Cuando compre algo que valga la pena anotar, cuando se mude y una vez al año cuando renueve la póliza. Agregar una cosa toma un minuto; rehacer una lista de memoria después de una pérdida es mucho más difícil.'],
        ['¿Esto es asesoría de seguros?', 'No. Esta página es solo informativa y no es asesoría de seguros ni legal. Lo que cubre su póliza depende de su póliza y de su estado. Pregunte a su agente o al departamento de seguros de su estado.'],
      ],
    },
  },
  {
    id: 'home-inventory-checklist', published: '2026-11-21', checked: CHECKED, kind: 'inventory', path: { en: '/home-inventory/checklist', es: '/es/inventario-del-hogar/lista' },
    sources: [S.naic, S.ready],
    en: {
      title: 'Home inventory checklist, room by room (free printable) | KeepMyProof',
      desc: 'A free room-by-room home inventory checklist and template: what to list in each room, the details to note for each item, and a printable PDF.',
      h1: 'Home inventory checklist, room by room',
      answer: 'Go room by room and list each thing worth replacing: what it is, the brand and model, the serial number for electronics, roughly when you bought it, what you paid, and a photo. Keep receipts with the item. Start with the kitchen, living room and bedrooms, then closets, the garage and anything stored away.',
      bestFor: 'anyone making a first home inventory, renter or owner, who wants a simple order to follow.',
      sections: [
        { h: 'What to list in each room', a: 'A starting list; add what you own.', table: { head: ['Room', 'Things to list'], rows: [['Kitchen and dining', 'Appliances, cookware, dishes, table and chairs'], ['Living room', 'TV and electronics, furniture, rugs, lamps, art'], ['Bedrooms and closets', 'Beds, dressers, clothes, shoes, jewelry'], ['Bathrooms and laundry', 'Washer, dryer, towels, small appliances'], ['Office', 'Computers, phones, printers, chargers, desk'], ['Garage and outdoor', 'Tools, bikes, sports gear, grill, outdoor furniture']] } },
        { h: 'What to note for each item', a: 'Enough to describe it to someone who has never seen it.', list: ['What it is, with the brand and model.', 'The serial number, for electronics and appliances.', 'Roughly when you bought it and what you paid.', 'A photo, and the receipt if you kept it.'] },
        { h: 'Keep it current', a: 'Small updates keep it useful.', steps: ['Add big purchases the day you buy them.', 'Walk through once a year, when the policy renews.', 'Save a fresh copy away from home after each update.'] },
      ],
      faq: [
        ['Is there a free home inventory template?', 'Yes. The free printable checklist on this page lists the rooms with space to tick and date each one; no email is needed. The KeepMyProof app has the same rooms as a Home inventory folder, with a photo and dates on each item.'],
        ['Do I need receipts for everything?', 'No. Photos, descriptions and rough purchase dates help even without receipts; keep the receipts you have, especially for expensive things. Your insurer decides what it asks for when you claim.'],
        ['Is this insurance advice?', 'No. This page is educational only and is not insurance or legal advice. Ask your agent or your state insurance department what your policy covers.'],
      ],
    },
    es: {
      title: 'Lista para el inventario del hogar, cuarto por cuarto | KeepMyProof',
      desc: 'Una lista gratis para el inventario del hogar, cuarto por cuarto: qué anotar en cada cuarto, los datos de cada cosa y un PDF para imprimir.',
      h1: 'Lista para el inventario del hogar, cuarto por cuarto',
      answer: 'Recorra la casa cuarto por cuarto y anote cada cosa que valga la pena reponer: qué es, la marca y el modelo, el número de serie de los electrónicos, más o menos cuándo la compró, cuánto pagó y una foto. Guarde los recibos con cada cosa. Empiece por la cocina, la sala y las recámaras, y luego clósets y garaje.',
      bestFor: 'quien hace su primer inventario del hogar, rente o sea dueño, y quiere un orden sencillo.',
      sections: [
        { h: 'Qué anotar en cada cuarto', a: 'Una lista para empezar; agregue lo que tenga.', table: { head: ['Cuarto', 'Cosas que anotar'], rows: [['Cocina y comedor', 'Aparatos, ollas, platos, mesa y sillas'], ['Sala', 'Televisión y electrónicos, muebles, tapetes, lámparas, arte'], ['Recámaras y clósets', 'Camas, cómodas, ropa, zapatos, joyas'], ['Baños y lavandería', 'Lavadora, secadora, toallas, aparatos pequeños'], ['Oficina', 'Computadoras, teléfonos, impresoras, cargadores, escritorio'], ['Garaje y afuera', 'Herramientas, bicicletas, equipo deportivo, asador, muebles de jardín']] } },
        { h: 'Qué anotar de cada cosa', a: 'Lo necesario para describirla a alguien que nunca la vio.', list: ['Qué es, con la marca y el modelo.', 'El número de serie de electrónicos y aparatos.', 'Más o menos cuándo la compró y cuánto pagó.', 'Una foto, y el recibo si lo guardó.'] },
        { h: 'Manténgalo al día', a: 'Pequeños cambios lo mantienen útil.', steps: ['Agregue las compras grandes el mismo día.', 'Recorra la casa una vez al año, cuando renueve la póliza.', 'Guarde una copia nueva fuera de casa después de cada cambio.'] },
      ],
      faq: [
        ['¿Hay una plantilla gratis para el inventario?', 'Sí. La lista gratis para imprimir de esta página muestra los cuartos con espacio para marcar y poner la fecha; no pide su correo. La app KeepMyProof tiene los mismos cuartos en la carpeta Inventario del hogar, con una foto y fechas en cada cosa.'],
        ['¿Necesito recibos de todo?', 'No. Las fotos, las descripciones y las fechas aproximadas de compra ayudan aunque no tenga recibos; guarde los que tenga, sobre todo de lo más caro. Su aseguradora decide qué pide al presentar un reclamo.'],
        ['¿Esto es asesoría de seguros?', 'No. Esta página es solo informativa y no es asesoría de seguros ni legal. Pregunte a su agente o al departamento de seguros de su estado qué cubre su póliza.'],
      ],
    },
  },
  {
    id: 'home-inventory-app', published: '2026-11-21', checked: CHECKED, kind: 'inventory', path: { en: '/home-inventory/app', es: '/es/inventario-del-hogar/app' },
    sources: [S.sortly, S.umr, S.nestegg, S.homecontents, S.encircle, S.naic],
    en: {
      title: 'Home inventory apps compared: price, limits, where data lives | KeepMyProof',
      desc: 'Home inventory apps side by side, from each App Store listing read on 21 November 2026: price model, free limits, export, and where your list is kept.',
      h1: 'Home inventory apps compared',
      answer: 'Home inventory apps differ most in three ways: how you pay (free, a one-time price or a subscription), how many items the free version keeps, and where your list lives (only on the phone, in your own iCloud, or on the company\'s servers). The table below is from each app\'s own App Store listing, read on 21 November 2026.',
      bestFor: 'someone choosing an app for a home inventory who wants the facts side by side.',
      sections: [
        { h: 'Side by side', a: 'Each row quotes or sums up the app\'s own App Store listing on 21 November 2026; prices and plans change, so check the listing.', table: { head: ['App', 'How you pay (App Store listing)', 'Where the list is kept (listing)', 'Built for'], rows: [['Sortly', 'Free to download; some features need a monthly or annual subscription', 'Any device, any location', 'Inventory for teams and businesses'], ['Under My Roof', 'Free up to 10 items; a subscription removes the limit', 'On your device, and in your own iCloud if sync is on', 'Home records, maintenance and insurance'], ['Nest Egg Home Inventory', '$6.99 once; unlimited items, no subscription, no account; Nest Egg Cloud (subscription) for sync', 'On the device; backup to iCloud or Dropbox', 'Home inventory'], ['Home Contents', 'Free up to 25 items and 1 property; unlimited with a one-time purchase', 'On your device or in your own iCloud', 'Home inventory'], ['Encircle', 'Free to download', 'Not stated in the listing', 'Restoration and claims documentation'], ['KeepMyProof (coming soon)', 'Free for 25 items; Plus $19.99 a year or $39.99 once', 'Encrypted on your phone; backup is a file you save to your own cloud drive', 'Papers and photos for life events, including a Home inventory folder']] } },
        { h: 'What to look for', a: 'Questions to ask of any inventory app.', list: ['Can you export the whole list, with photos, without paying more?', 'If you stop paying, can you still open what you saved?', 'Does the list survive a lost phone (a backup you control)?', 'Does it keep the purchase date and receipt with each item?'] },
        { h: 'What KeepMyProof does and does not do', a: 'Plainly, so you can choose.', list: ['Does: a Home inventory folder by room, a photo and two dates on each item, receipts as files, one PDF of the folder, original-file export, an encrypted backup to your own cloud drive.', 'Does not: barcode scanning, value totals, sharing with family, or sync between devices.', '' + storeLine('en') + ''] },
      ],
      faq: [
        ['Is there a free home inventory app?', 'Several are free to download, with limits. Home Contents\' listing says its free download includes up to 25 items; KeepMyProof is free for 25 items, with viewing, PDFs, export and backup never locked. Check each listing for its current limits.'],
        ['Where is my inventory safest?', 'Somewhere a fire, flood or theft at home cannot reach, and that you can still open if the app changes its price. A backup file you keep on your own cloud drive, or a printed or PDF copy with someone you trust, covers both.'],
        ['Are these apps affiliated with KeepMyProof?', 'No. Sortly, Under My Roof, Nest Egg, Home Contents and Encircle are trademarks of their owners and are named only to identify them. KeepMyProof is not affiliated with or endorsed by any of them.'],
      ],
    },
    es: {
      title: 'Apps de inventario del hogar comparadas: precio, límites y datos | KeepMyProof',
      desc: 'Apps de inventario del hogar lado a lado, según la ficha de cada una en el App Store leída el 21 de noviembre de 2026: cómo se paga, límites gratis, exportar y dónde queda la lista.',
      h1: 'Apps de inventario del hogar comparadas',
      answer: 'Las apps de inventario del hogar se diferencian en tres cosas: cómo se paga (gratis, pago único o suscripción), cuántas cosas guarda la versión gratis y dónde queda la lista (en el teléfono, en su iCloud o con la empresa). La tabla resume la ficha de cada app en el App Store del 21 de noviembre de 2026.',
      bestFor: 'quien elige una app para su inventario del hogar y quiere los datos lado a lado.',
      sections: [
        { h: 'Lado a lado', a: 'Cada fila cita o resume la ficha de la app en el App Store el 21 de noviembre de 2026; los precios y planes cambian, así que revise la ficha.', table: { head: ['App', 'Cómo se paga (ficha del App Store)', 'Dónde queda la lista (ficha)', 'Hecha para'], rows: [['Sortly', 'Gratis para descargar; algunas funciones piden una suscripción mensual o anual', 'Cualquier dispositivo, cualquier lugar', 'Inventario para equipos y negocios'], ['Under My Roof', 'Gratis hasta 10 cosas; una suscripción quita el límite', 'En su dispositivo, y en su propio iCloud si activa la sincronización', 'Registros de la casa, mantenimiento y seguros'], ['Nest Egg Home Inventory', '$6.99 una vez; cosas ilimitadas, sin suscripción ni cuenta; Nest Egg Cloud (suscripción) para sincronizar', 'En el dispositivo; copia en iCloud o Dropbox', 'Inventario del hogar'], ['Home Contents', 'Gratis hasta 25 cosas y 1 propiedad; ilimitado con un pago único', 'En su dispositivo o en su propio iCloud', 'Inventario del hogar'], ['Encircle', 'Gratis para descargar', 'No se indica en la ficha', 'Documentación de restauración y reclamos'], ['KeepMyProof (muy pronto)', 'Gratis hasta 25 documentos; Plus $19.99 al año o $39.99 una vez', 'Cifrado en su teléfono; la copia es un archivo que usted guarda en su nube', 'Papeles y fotos para momentos de la vida, con una carpeta de Inventario del hogar']] } },
        { h: 'Qué buscar', a: 'Preguntas para cualquier app de inventario.', list: ['¿Puede exportar toda la lista, con fotos, sin pagar más?', 'Si deja de pagar, ¿puede seguir abriendo lo que guardó?', '¿La lista sobrevive si pierde el teléfono (una copia que usted controla)?', '¿Guarda la fecha de compra y el recibo con cada cosa?'] },
        { h: 'Lo que KeepMyProof hace y no hace', a: 'Con claridad, para que usted elija.', list: ['Hace: una carpeta de Inventario del hogar por cuarto, una foto y dos fechas en cada cosa, recibos como archivos, un PDF de la carpeta, exportar los archivos originales y una copia cifrada en su propia nube.', 'No hace: escanear códigos de barras, sumar valores, compartir con la familia ni sincronizar entre dispositivos.', '' + storeLine('es') + ''] },
      ],
      faq: [
        ['¿Hay una app gratis de inventario del hogar?', 'Varias son gratis para descargar, con límites. La ficha de Home Contents dice que la descarga gratis incluye hasta 25 cosas; KeepMyProof es gratis hasta 25 documentos, y ver, hacer PDF, exportar y respaldar nunca se bloquean. Revise los límites actuales en cada ficha.'],
        ['¿Dónde está más segura mi lista?', 'Donde no llegue un incendio, una inundación o un robo en casa, y donde la pueda abrir aunque la app cambie de precio. Un archivo de copia en su propia nube, o una copia impresa o en PDF con alguien de confianza, cubre las dos cosas.'],
        ['¿Estas apps tienen relación con KeepMyProof?', 'No. Sortly, Under My Roof, Nest Egg, Home Contents y Encircle son marcas de sus dueños y se nombran solo para identificarlas. KeepMyProof no tiene relación con ninguna ni cuenta con su aval.'],
      ],
    },
  },
  {
    id: 'free-co-parenting-log', published: '2026-11-21', checked: CHECKED, kind: 'divorce', path: { en: '/co-parenting/free-co-parenting-log', es: '/es/crianza/registro-de-crianza-gratis' }, printable: { en: '/tools/co-parenting-log-printable', es: '/es/herramientas/registro-de-crianza-para-imprimir' },
    sources: [S.css, S.tp, S.ofw],
    en: {
      title: 'Free co-parenting log: a printable and a private app | KeepMyProof',
      desc: 'A free co-parenting log you can print, and a private phone app for your own dated record. What to write, and how it differs from paid co-parenting apps.',
      h1: 'A free co-parenting log',
      answer: 'A co-parenting log is your own dated record of handoffs, visits, schedule changes, expenses and important messages about the children. You can keep it for free: print the log below, or keep it in a phone app that holds the notes, screenshots and receipts together. It needs no sign-up from the other parent.',
      bestFor: 'a parent who wants a record of their own, without a paid plan or the other parent joining.',
      sections: [
        { h: 'What goes in the log?', a: 'Facts, on the day they happen.', list: ['Handoffs: date, time, place and who brought the children.', 'Visits, late or missed visits, and any reason given.', 'Schedule changes and who asked for them.', 'Expenses for the children, with the receipt.', 'Important messages, with a screenshot beside the entry.'] },
        { h: 'A log of your own or a shared app?', a: 'They do different jobs.', table: { head: ['', 'Shared co-parenting app', 'Your own log (printable or KeepMyProof)'], rows: [['Who signs up', 'Both parents', 'Only you'], ['Messages between parents', 'Inside the app', 'Kept as screenshots you save'], ['Cost', 'Varies by app and plan; see each pricing page', 'Printable free; app free for 25 items'], ['Where it lives', 'On the company\'s service', 'On paper, or encrypted on your phone']] } },
        { h: 'What do the shared apps cost? (checked 21 November 2026)', a: 'From each company\'s own pricing page.', list: ['TalkingParents\' pricing page says "You need a paid subscription to use the TalkingParents app", and lists plans of $7, $16 and $32 a month, with a fee waiver for some parents.', 'OurFamilyWizard\'s pricing page lists plans billed at $110, $149.99, $216 and $299.88 a year, and says each parent needs their own subscription.', 'Some courts order a specific app; if yours does, use the one ordered.'] },
      ],
      faq: [
        ['Is there a free co-parenting app?', 'Some shared apps have free features and some have none; check each pricing page. A log that only you keep can be free: the printable below costs nothing, and KeepMyProof is free for your first 25 items, with PDFs and backup never locked.'],
        ['Does my co-parent need to join?', 'Not for a log of your own. A shared app needs both parents; a printable log or KeepMyProof is yours alone. If a court has ordered a particular app, use that app as ordered and keep your own copies too.'],
        ['Is this legal advice?', 'No. This page is educational only and is not legal advice. KeepMyProof cannot say how a custody matter will turn out. Ask your lawyer or a legal aid office what to keep and how.'],
      ],
    },
    es: {
      title: 'Registro de crianza gratis: para imprimir y en una app privada | KeepMyProof',
      desc: 'Un registro de crianza gratis para imprimir, y una app privada para su propio registro con fecha. Qué anotar y en qué se diferencia de las apps de crianza de pago.',
      h1: 'Un registro de crianza gratis',
      answer: 'Un registro de crianza es su propio registro con fecha de entregas, visitas, cambios de horario, gastos y mensajes importantes sobre los niños. Puede llevarlo gratis: imprima el registro de abajo, o llévelo en una app que guarde juntas las notas, capturas y recibos. No necesita que el otro padre se registre.',
      bestFor: 'quien quiere un registro propio, sin un plan de pago y sin que el otro padre tenga que unirse.',
      sections: [
        { h: '¿Qué va en el registro?', a: 'Hechos, el mismo día en que pasan.', list: ['Entregas: fecha, hora, lugar y quién llevó a los niños.', 'Visitas, visitas tarde o perdidas, y la razón que se dio.', 'Cambios de horario y quién los pidió.', 'Gastos de los niños, con el recibo.', 'Mensajes importantes, con la captura junto a la entrada.'] },
        { h: '¿Un registro propio o una app compartida?', a: 'Hacen trabajos distintos.', table: { head: ['', 'App de crianza compartida', 'Su propio registro (para imprimir o KeepMyProof)'], rows: [['Quién se registra', 'Los dos padres', 'Solo usted'], ['Mensajes entre padres', 'Dentro de la app', 'Guardados como capturas'], ['Costo', 'Depende de la app y el plan; vea cada página de precios', 'Para imprimir: gratis; app: gratis hasta 25 documentos'], ['Dónde queda', 'En el servicio de la empresa', 'En papel, o cifrado en su teléfono']] } },
        { h: '¿Cuánto cuestan las apps compartidas? (revisado el 21 de noviembre de 2026)', a: 'Según la página de precios de cada empresa.', list: ['La página de precios de TalkingParents dice que se necesita una suscripción de pago para usar la app, y muestra planes de $7, $16 y $32 al mes, con exención de pago para algunos padres.', 'La página de precios de OurFamilyWizard muestra planes de $110, $149.99, $216 y $299.88 al año, y dice que cada padre necesita su propia suscripción.', 'Algunas cortes ordenan una app específica; si la suya lo hace, use la que se ordenó.'] },
      ],
      faq: [
        ['¿Hay una app de crianza gratis?', 'Algunas apps compartidas tienen funciones gratis y otras ninguna; revise cada página de precios. Un registro que solo usted lleva puede ser gratis: el registro para imprimir no cuesta nada, y KeepMyProof es gratis hasta sus primeros 25 documentos, sin bloquear los PDF ni las copias.'],
        ['¿El otro padre tiene que unirse?', 'No para un registro propio. Una app compartida necesita a los dos padres; un registro para imprimir o KeepMyProof es solo suyo. Si una corte ordenó una app, úsela como se ordenó y guarde también sus propias copias.'],
        ['¿Esto es asesoría legal?', 'No. Esta página es solo informativa y no es asesoría legal. KeepMyProof no puede decir cómo terminará un asunto de custodia. Pregunte a su abogado o a una oficina de ayuda legal qué guardar y cómo.'],
      ],
    },
  },
];

// Chinese and Korean versions (served at /zh/<path> and /ko/<path>, like every landing page).
export const TENANT_LANDINGS_CJK = {
  'move-out-checklist': {
    zh: { title: '美国租客搬出清单：照片、清洁和文件', desc: '免费的美国租客搬出清单：要清洁什么、每个房间拍哪些照片、要保存哪些文件，以及各州规定押金何时退还。', h1: '美国租客搬出清单',
      answer: '交还钥匙之前，先打扫，再像搬入时那样给每个房间拍照：地板、墙面、电器内部、浴室、窗户和水电表。用书面方式留下新地址，交还所有钥匙，并把租约、搬入照片、收据和所有关于押金的信息放在一起保存。',
      bestFor: '准备搬出、想清楚记下房屋交还时状况的租客。',
      sections: [
        { h: '最后两周要做什么？', a: '通知、打扫、约好验房。', steps: ['查看租约中要求的通知期限和方式。', '和房东约好搬出验房，记下约定的日期和时间。', '修好自己弄坏的东西，或问清楚会扣多少钱。', '逐个房间打扫，然后拍照。', '书面告知新地址并保留副本。'] },
        { h: '应该拍哪些照片？', a: '和搬入照片相同的房间和角度，方便一一对照。', list: ['每个房间先从门口拍全景，再拍每面墙、地板和天花板。', '烤箱、冰箱、洗碗机、橱柜和壁橱的内部。', '浴室设施、瓷砖、浴缸或淋浴间，以及水槽下方。', '窗户、百叶窗、门、门锁和留下的任何痕迹。', '水电表，以及交还前摆好的钥匙。'] },
      ],
      faq: [['房东必须在什么时候退还押金？', '每个州有自己的期限，有的从您搬走那天算起，有的从您提供新地址时算起。我们的州页面引用各州法律并注明链接和核对日期。依赖某个日期之前，请阅读您所在州的现行法律。'], ['这是法律建议吗？', '不是。本页仅供参考，不构成法律建议。KeepMyProof 只保存您自己的照片和文件，无法判断押金纠纷的结果。如需建议，请咨询租客权益机构、法律援助或您所在州执业的律师。']] },
    ko: { title: '미국 세입자 퇴거 체크리스트: 사진, 청소, 서류', desc: '미국 세입자를 위한 무료 퇴거 체크리스트: 무엇을 청소할지, 방마다 어떤 사진을 찍을지, 어떤 서류를 보관할지, 주마다 보증금 반환 기한은 언제인지.', h1: '미국 세입자 퇴거 체크리스트',
      answer: '열쇠를 돌려주기 전에 청소하고, 입주 때처럼 방마다 사진을 찍으세요. 바닥, 벽, 가전 내부, 욕실, 창문, 계량기입니다. 새 주소를 서면으로 알리고 열쇠를 모두 돌려주며, 임대 계약서, 입주 사진, 영수증, 보증금에 관한 메시지를 함께 보관하세요.',
      bestFor: '이사 나가면서 집을 어떤 상태로 돌려줬는지 날짜와 함께 기록해 두려는 세입자.',
      sections: [
        { h: '마지막 2주 동안 할 일은?', a: '통보하고, 청소하고, 퇴거 점검을 잡으세요.', steps: ['임대 계약서에서 통보 기한과 방법을 확인하세요.', '집주인에게 퇴거 점검을 요청하고 약속한 날짜와 시간을 적어 두세요.', '내가 망가뜨린 것은 고치거나 얼마가 청구될지 물어보세요.', '방마다 청소한 뒤 사진을 찍으세요.', '새 주소를 서면으로 알리고 사본을 보관하세요.'] },
        { h: '어떤 사진을 찍어야 하나요?', a: '입주 사진과 같은 방, 같은 각도로 찍어 하나씩 비교할 수 있게 하세요.', list: ['방마다 문 앞에서 전체를 찍고, 벽, 바닥, 천장을 찍으세요.', '오븐, 냉장고, 식기세척기, 수납장, 옷장 안.', '욕실 설비, 타일, 욕조나 샤워실, 세면대 아래.', '창문, 블라인드, 문, 잠금장치와 남기는 흔적.', '계량기, 그리고 돌려주기 전에 놓아 둔 열쇠.'] },
      ],
      faq: [['집주인은 언제까지 보증금을 돌려줘야 하나요?', '주마다 기한이 다르며, 이사 나간 날부터 세는 곳도 있고 새 주소를 알린 날부터 세는 곳도 있습니다. 주별 페이지는 각 주의 법을 링크와 확인 날짜와 함께 인용합니다. 날짜를 믿기 전에 현재 법을 읽어 보세요.'], ['이것은 법률 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 법률 자문이 아닙니다. KeepMyProof는 내 사진과 서류를 보관할 뿐 보증금 분쟁의 결과를 말할 수 없습니다. 세입자 권리 기관, 법률 구조 기관, 거주하는 주의 변호사에게 문의하세요.']] },
  },
  'move-in-checklist': {
    zh: { title: '美国租客搬入检查清单：逐个房间', desc: '免费的美国租客搬入检查清单：每个房间要检查什么、最初几天要拍哪些照片，以及从第一天起要保存哪些文件。', h1: '美国租客搬入清单：逐个房间',
      answer: '入住最初几天、拆箱之前，走遍每个房间并拍照：地板、墙面、天花板、窗户、门、电器内外、设施和水电表。记下所有磨损、损坏或脏污的地方，以书面方式发给房东，并和租约及押金收据放在一起保存。',
      bestFor: '刚搬入、想记下房屋第一天状况的租客。',
      sections: [
        { h: '每个房间要检查什么？', a: '先看，再试，然后拍照。', list: ['地板、墙面和天花板：污渍、洞、裂缝、痕迹。', '门、锁和窗户：能否开关和上锁，纱窗或百叶窗是否损坏。', '灯、开关和插座：逐一测试。', '烟雾和一氧化碳报警器：是否安装、能否鸣响。', '暖气、空调和热水：是否正常。'] },
        { h: '怎样拍照？', a: '让以后的搬出照片能一一对照。', steps: ['站在每个房间门口拍一张全景。', '拍每面墙、地板和天花板。', '近距离拍下记录的每个痕迹或故障。', '拍下水电表和拿到的钥匙。', '当天按房间把照片放进一个文件夹。'] },
      ],
      faq: [['什么时候做搬入检查？', '拿到钥匙后、搬家具进去之前尽快做，让照片显示房屋交给您时的样子。有些租约或州规定了交回入住检查表的期限，请阅读租约和房东给您的检查表。'], ['这是法律建议吗？', '不是。本页仅供参考，不构成法律建议。各州关于入住检查表和押金的规定，请查看 HUD 的州页面，或咨询租客权益机构或法律援助。']] },
    ko: { title: '미국 세입자 입주 점검 체크리스트: 방마다', desc: '미국 세입자를 위한 무료 입주 점검 체크리스트: 방마다 확인할 것, 처음 며칠 안에 찍을 사진, 첫날부터 보관할 서류.', h1: '미국 세입자 입주 체크리스트: 방마다',
      answer: '처음 며칠 안에, 짐을 풀기 전에 방마다 돌아보며 사진을 찍으세요. 바닥, 벽, 천장, 창문, 문, 가전 안팎, 설비, 계량기입니다. 닳거나 망가지거나 더러운 곳을 모두 적어 집주인에게 서면으로 보내고, 임대 계약서와 보증금 영수증과 함께 보관하세요.',
      bestFor: '새로 입주하면서 첫날 집 상태를 기록해 두려는 세입자.',
      sections: [
        { h: '방마다 무엇을 확인하나요?', a: '보고, 작동해 보고, 사진을 찍으세요.', list: ['바닥, 벽, 천장: 얼룩, 구멍, 금, 자국.', '문, 잠금장치, 창문: 열고 닫고 잠기는지, 방충망이나 블라인드가 망가졌는지.', '조명, 스위치, 콘센트: 하나씩 확인하세요.', '연기·일산화탄소 경보기: 있는지, 울리는지.', '난방, 냉방, 온수: 작동하는지.'] },
        { h: '사진은 어떻게 찍나요?', a: '나중에 퇴거 사진과 하나씩 비교할 수 있게 찍으세요.', steps: ['방마다 문 앞에서 전체 사진을 한 장 찍으세요.', '벽, 바닥, 천장을 찍으세요.', '적어 둔 자국이나 고장을 가까이에서 찍으세요.', '계량기와 받은 열쇠를 찍으세요.', '그날 바로 방별로 한 폴더에 정리하세요.'] },
      ],
      faq: [['입주 점검은 언제 하나요?', '열쇠를 받고 가구를 들이기 전에 되도록 빨리 하세요. 그래야 사진이 받은 그대로의 집을 보여 줍니다. 입주 점검표를 돌려줄 기한을 정한 임대 계약서나 주도 있으니 계약서와 집주인이 준 점검표를 읽어 보세요.'], ['이것은 법률 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 법률 자문이 아닙니다. 주별 입주 점검표와 보증금 규정은 HUD의 주별 페이지를 보거나 세입자 권리 기관, 법률 구조 기관에 문의하세요.']] },
  },
  'wear-and-tear': {
    zh: { title: '正常磨损与损坏：给美国租客的例子', desc: '正常磨损通常指什么、和损坏有什么不同，附常见例子，以及注明日期的前后对照照片如何帮助租客和房东达成一致。', h1: '正常磨损与损坏',
      answer: '正常磨损是住在房子里慢慢产生的变化：油漆褪色、轻微擦痕、地毯常走处磨薄、把手松动。损坏则超出正常使用：洞、烧痕、污渍、设施损坏、宠物造成的破坏。华盛顿州等州的法律禁止因正常使用造成的磨损扣押金；注明日期的照片能显示两者的区别。',
      bestFor: '想弄清押金扣款可以涵盖什么的租客或小房东。',
      sections: [
        { h: '常见例子', a: '一般情况，每份租约和每个州都不同。', table: { head: ['', '通常是磨损', '通常是损坏'], rows: [['墙面', '油漆褪色、少量小钉孔、轻微擦痕', '大洞、未经同意的颜色、蜡笔或马克笔'], ['地板', '地毯常走处磨薄、木地板轻微划痕', '烧痕、大面积污渍、宠物破坏、深划痕'], ['厨房', '台面表面磨旧、橱柜铰链松动', '烧痕、台面开裂、电器零件损坏'], ['浴室', '填缝磨旧、设施失去光泽', '水槽或浴缸开裂、镜子破碎、霉菌未清理']] } },
        { h: '照片怎样帮忙？', a: '注明日期的一对照片能显示变化。', steps: ['搬入时，拍下每个房间和已有的每处痕迹。', '搬出时，在相同位置拍相同的照片。', '把每对照片和两个日期放在一起。', '收到扣款时，把照片和明细清单对照。'] },
      ],
      faq: [['房东可以收重新刷漆的钱吗？', '这取决于州法、租约、您住了多久以及墙为什么需要刷漆。单纯老化的油漆通常算磨损；您留下的痕迹、洞或颜色更常被视为损坏。请阅读您所在州的押金法律，如有异议可咨询租客援助机构。'], ['这是法律建议吗？', '不是。本页仅供参考，不构成法律建议。这些例子只是一般情况，每个州、每份租约和每套房子都不同。请咨询租客权益机构、法律援助或您所在州执业的律师。']] },
    ko: { title: '정상 마모와 파손: 미국 세입자를 위한 예시', desc: '정상 마모가 보통 무엇을 뜻하고 파손과 어떻게 다른지, 흔한 예시와 날짜가 있는 전후 사진이 세입자와 집주인에게 어떻게 도움이 되는지.', h1: '정상 마모와 파손',
      answer: '정상 마모는 집에 살면서 천천히 생기는 변화입니다. 바랜 페인트, 가벼운 긁힘, 자주 다니는 곳의 닳은 카펫, 헐거운 손잡이입니다. 파손은 정상적인 사용을 넘어섭니다. 구멍, 탄 자국, 얼룩, 부서진 설비, 반려동물 피해입니다. 워싱턴주 같은 주의 법은 정상 사용으로 생긴 마모를 보증금에서 빼지 못하게 합니다.',
      bestFor: '보증금 공제가 무엇을 포함할 수 있는지 정리하려는 세입자나 소규모 집주인.',
      sections: [
        { h: '흔한 예시', a: '일반적인 경우이며 계약서와 주마다 다릅니다.', table: { head: ['', '보통 마모', '보통 파손'], rows: [['벽', '바랜 페인트, 작은 못 구멍 몇 개, 가벼운 긁힘', '큰 구멍, 허락받지 않은 색, 크레용이나 마커'], ['바닥', '자주 다니는 곳의 닳은 카펫, 나무 바닥의 가벼운 긁힘', '탄 자국, 큰 얼룩, 반려동물 피해, 깊은 홈'], ['주방', '닳은 조리대 표면, 헐거운 경첩', '탄 자국, 갈라진 조리대, 부서진 가전 부품'], ['욕실', '닳은 줄눈, 광택이 없어진 설비', '금 간 세면대나 욕조, 깨진 거울, 방치한 곰팡이']] } },
        { h: '사진은 어떻게 도움이 되나요?', a: '날짜가 있는 사진 한 쌍이 변화를 보여 줍니다.', steps: ['입주할 때 방마다, 이미 있는 자국마다 사진을 찍으세요.', '퇴거할 때 같은 자리에서 같은 사진을 찍으세요.', '사진 한 쌍을 두 날짜와 함께 보관하세요.', '보증금 공제 내역을 받으면 사진과 비교하세요.'] },
      ],
      faq: [['집주인이 다시 칠하는 비용을 받을 수 있나요?', '주법, 계약서, 거주 기간, 다시 칠해야 하는 이유에 따라 다릅니다. 단순히 오래된 페인트는 보통 마모로 보고, 내가 남긴 자국이나 구멍, 칠한 색은 파손으로 보는 경우가 많습니다. 주의 보증금 법을 읽고, 동의하지 않으면 세입자 지원 기관에 문의하세요.'], ['이것은 법률 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 법률 자문이 아닙니다. 예시는 일반적인 경우일 뿐이며 주, 계약서, 집마다 다릅니다. 세입자 권리 기관, 법률 구조 기관, 거주하는 주의 변호사에게 문의하세요.']] },
  },
  'renters-insurance-inventory': {
    zh: { title: '租客保险的家庭物品清单：要列什么、保存什么', desc: '如何为美国租客保险做家庭物品清单：要拍什么，要保存的购买日期、收据和序列号，以及把副本放在哪里。', h1: '租客保险的家庭物品清单',
      answer: '租客保险的物品清单按房间列出您自己的东西：每件的照片、它是什么、品牌和型号、大约购买时间和价格、保留的收据，以及电子产品的序列号。先列最贵的东西，并在家以外保存一份副本。',
      bestFor: '刚买或续保租客保险、从没列过自己物品的租客。',
      sections: [
        { h: '怎样一个下午做完？', a: '一次一个房间，先列大件。', steps: ['从最贵东西最多的房间开始。', '先拍房间全景，再逐件拍值得列出的物品。', '拍下电子产品和电器的序列号或标签。', '记下大约购买时间和价格，有收据就附上。', '换到下一个房间，最后是壁橱、储物间和放在别处的东西。'] },
        { h: '清单放在哪里？', a: '放在火灾或盗窃碰不到的地方。', list: ['保存到您自己云盘的加密副本。', '交给信任的人的副本。', '不要只放在它所记录的那个家里。'] },
      ],
      faq: [['租客保险一定要物品清单吗？', '各保单不同。很多保险公司在理赔时会要求列出损失物品，由各州保险监管机构组成的 NAIC 建议提前做好清单。请阅读保单或咨询您的代理人。'], ['这是保险建议吗？', '不是。本页仅供参考，不构成保险或法律建议。保障范围由您的保单和所在州决定。请咨询您的代理人或所在州的保险监管部门。']] },
    ko: { title: '세입자 보험용 집 물품 목록: 무엇을 적고 보관할까', desc: '미국 세입자 보험용 집 물품 목록 만드는 법: 무엇을 찍을지, 보관할 구입 날짜, 영수증, 일련번호, 사본을 둘 곳.', h1: '세입자 보험용 집 물품 목록',
      answer: '세입자 보험용 목록에는 내 물건을 방마다 적습니다. 물건마다 사진, 무엇인지, 브랜드와 모델, 대략 산 시기와 가격, 남아 있는 영수증, 전자제품의 일련번호입니다. 가장 비싼 것부터 적고, 사본은 집 밖에 두세요.',
      bestFor: '세입자 보험을 새로 들거나 갱신했지만 가진 물건을 적어 본 적이 없는 세입자.',
      sections: [
        { h: '오후 한나절에 끝내려면?', a: '한 번에 방 하나씩, 큰 것부터.', steps: ['비싼 물건이 가장 많은 방부터 시작하세요.', '방 전체를 찍고, 적어 둘 물건을 하나씩 찍으세요.', '전자제품과 가전의 일련번호나 라벨을 찍으세요.', '대략 산 시기와 가격을 적고, 영수증이 있으면 함께 두세요.', '다음 방으로 넘어가고, 마지막에 옷장, 창고, 다른 곳에 둔 물건을 적으세요.'] },
        { h: '목록은 어디에 두나요?', a: '화재나 도난이 닿지 않는 곳에 두세요.', list: ['내 클라우드 드라이브에 저장한 암호화 사본.', '믿는 사람에게 맡긴 사본.', '목록이 적힌 그 집 안에만 두지 마세요.'] },
      ],
      faq: [['세입자 보험에 목록이 꼭 필요한가요?', '보험마다 다릅니다. 많은 보험사가 청구할 때 잃어버린 물건 목록을 요청하며, 주 보험 감독 기관 모임인 NAIC는 미리 목록을 만들어 두라고 권합니다. 보험 증권을 읽거나 설계사에게 물어보세요.'], ['이것은 보험 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 보험이나 법률 자문이 아닙니다. 보장 범위는 보험 증권과 거주하는 주에 따라 다릅니다. 설계사나 주 보험국에 문의하세요.']] },
  },
  'home-inventory-checklist': {
    zh: { title: '家庭物品清单：逐个房间（免费打印）', desc: '免费的逐个房间家庭物品清单和模板：每个房间要列什么、每件物品要记录哪些信息，并附可打印 PDF。', h1: '家庭物品清单：逐个房间',
      answer: '逐个房间列出每件值得重新购买的东西：它是什么、品牌和型号、电子产品的序列号、大约购买时间、价格和一张照片。把收据和物品放在一起。先从厨房、客厅和卧室开始，再到壁橱、车库和存放在别处的东西。',
      bestFor: '第一次做家庭物品清单、想按简单顺序进行的租客或房主。',
      sections: [
        { h: '每个房间要列什么', a: '一份起步清单，再加上您自己的东西。', table: { head: ['房间', '要列的东西'], rows: [['厨房和餐厅', '电器、锅具、餐具、餐桌椅'], ['客厅', '电视和电子产品、家具、地毯、灯、艺术品'], ['卧室和壁橱', '床、衣柜、衣服、鞋、珠宝'], ['浴室和洗衣间', '洗衣机、烘干机、毛巾、小电器'], ['车库和户外', '工具、自行车、运动用品、烤架、户外家具']] } },
        { h: '每件物品记录什么', a: '足以向没见过它的人描述清楚。', list: ['它是什么，品牌和型号。', '电子产品和电器的序列号。', '大约购买时间和价格。', '一张照片，以及保留的收据。'] },
      ],
      faq: [['有免费的家庭物品清单模板吗？', '有。本页的免费可打印清单列出各个房间，可以勾选并写上日期，无需邮箱。KeepMyProof 应用的“家庭物品清单”文件夹也按这些房间整理，每件物品都有照片和日期。'], ['这是保险建议吗？', '不是。本页仅供参考，不构成保险或法律建议。保障范围请咨询您的代理人或所在州的保险监管部门。']] },
    ko: { title: '집 물품 목록 체크리스트: 방마다(무료 인쇄)', desc: '방마다 정리하는 무료 집 물품 목록 체크리스트와 양식: 방마다 적을 것, 물건마다 남길 정보, 인쇄용 PDF.', h1: '집 물품 목록 체크리스트: 방마다',
      answer: '방마다 다시 살 가치가 있는 물건을 적으세요. 무엇인지, 브랜드와 모델, 전자제품의 일련번호, 대략 산 시기, 가격, 사진입니다. 영수증은 물건과 함께 보관하세요. 주방, 거실, 침실부터 시작해 옷장, 차고, 다른 곳에 둔 물건으로 넘어가세요.',
      bestFor: '처음으로 집 물품 목록을 만드는 세입자나 집주인.',
      sections: [
        { h: '방마다 적을 것', a: '시작용 목록이니 내 물건을 더하세요.', table: { head: ['방', '적을 물건'], rows: [['주방과 식당', '가전, 조리도구, 식기, 식탁과 의자'], ['거실', 'TV와 전자제품, 가구, 러그, 조명, 미술품'], ['침실과 옷장', '침대, 서랍장, 옷, 신발, 보석'], ['욕실과 세탁실', '세탁기, 건조기, 수건, 소형 가전'], ['차고와 실외', '공구, 자전거, 운동용품, 그릴, 야외 가구']] } },
        { h: '물건마다 남길 정보', a: '본 적 없는 사람에게 설명할 수 있을 만큼.', list: ['무엇인지, 브랜드와 모델.', '전자제품과 가전의 일련번호.', '대략 산 시기와 가격.', '사진, 남아 있는 영수증.'] },
      ],
      faq: [['무료 집 물품 목록 양식이 있나요?', '있습니다. 이 페이지의 무료 인쇄용 체크리스트에는 방마다 표시하고 날짜를 적을 칸이 있으며 이메일이 필요 없습니다. KeepMyProof 앱의 집 물품 목록 폴더도 같은 방으로 나뉘어 있고 물건마다 사진과 날짜가 남습니다.'], ['이것은 보험 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 보험이나 법률 자문이 아닙니다. 보장 범위는 설계사나 주 보험국에 문의하세요.']] },
  },
  'home-inventory-app': {
    zh: { title: '家庭物品清单应用对比：价格、限制、数据存放', desc: '家庭物品清单应用并排对比，依据 2026 年 11 月 21 日读取的各应用 App Store 页面：付费方式、免费限制和清单存放位置。', h1: '家庭物品清单应用对比',
      answer: '家庭物品清单应用最主要的区别有三点：怎样付费（免费、一次性购买或订阅）、免费版能存多少件物品、清单存放在哪里（只在手机上、在您自己的 iCloud，或在公司的服务器上）。下表来自 2026 年 11 月 21 日读取的各应用 App Store 页面。',
      bestFor: '正在挑选家庭物品清单应用、想并排看事实的人。',
      sections: [
        { h: '并排对比', a: '每行概括 2026 年 11 月 21 日该应用的 App Store 页面；价格和方案会变，请查看页面。', table: { head: ['应用', '付费方式（App Store 页面）', '清单存放位置（页面）'], rows: [['Sortly', '免费下载；部分功能需按月或按年订阅', '任何设备、任何地点'], ['Under My Roof', '免费最多 10 件物品；订阅可取消限制', '在设备上；开启同步时在您自己的 iCloud'], ['Nest Egg Home Inventory', '一次性 $6.99；不限物品、无订阅、无需账户', '在设备上；可备份到 iCloud 或 Dropbox'], ['Home Contents', '免费最多 25 件物品和 1 处房产；一次性购买可解锁不限数量', '在设备上或您自己的 iCloud'], ['KeepMyProof（即将推出）', '前 25 项免费；Plus 每年 $19.99 或一次性 $39.99', '加密保存在手机上；备份是您保存到自己云盘的文件']] } },
        { h: 'KeepMyProof 能做和不能做的', a: '说清楚，方便您选择。', list: ['能做：按房间整理的“家庭物品清单”文件夹，每件物品有照片和两个日期，收据作为文件保存，整个文件夹导出一个 PDF，导出原始文件，加密备份到您自己的云盘。', '不能做：扫描条形码、合计价值、和家人共享、在设备之间同步。'] },
      ],
      faq: [['有免费的家庭物品清单应用吗？', '有几款可以免费下载，但有限制。Home Contents 的页面写明免费版最多 25 件物品；KeepMyProof 前 25 项免费，查看、PDF、导出和备份始终不锁。请在各页面查看当前限制。'], ['这些应用和 KeepMyProof 有关系吗？', '没有。Sortly、Under My Roof、Nest Egg、Home Contents 和 Encircle 是其所有者的商标，此处只为识别而提及。KeepMyProof 与它们没有关联，也未获得认可。']] },
    ko: { title: '집 물품 목록 앱 비교: 가격, 한도, 데이터 위치', desc: '2026년 11월 21일에 읽은 각 앱의 App Store 페이지를 바탕으로 한 집 물품 목록 앱 비교: 결제 방식, 무료 한도, 목록이 보관되는 곳.', h1: '집 물품 목록 앱 비교',
      answer: '집 물품 목록 앱은 크게 세 가지가 다릅니다. 결제 방식(무료, 한 번 구매, 구독), 무료 버전이 보관하는 물건 수, 목록이 있는 곳(휴대폰에만, 내 iCloud, 회사 서버)입니다. 아래 표는 2026년 11월 21일에 읽은 각 앱의 App Store 페이지에서 가져왔습니다.',
      bestFor: '집 물품 목록 앱을 고르며 사실을 나란히 보고 싶은 분.',
      sections: [
        { h: '나란히 보기', a: '각 행은 2026년 11월 21일 해당 앱의 App Store 페이지를 요약합니다. 가격과 요금제는 바뀌니 페이지를 확인하세요.', table: { head: ['앱', '결제 방식(App Store 페이지)', '목록이 있는 곳(페이지)'], rows: [['Sortly', '무료 다운로드, 일부 기능은 월간 또는 연간 구독 필요', '모든 기기, 모든 장소'], ['Under My Roof', '물건 10개까지 무료, 구독하면 한도 없음', '기기에, 동기화를 켜면 내 iCloud에'], ['Nest Egg Home Inventory', '한 번 $6.99, 물건 무제한, 구독과 계정 없음', '기기에, iCloud나 Dropbox에 백업'], ['Home Contents', '물건 25개와 집 1곳까지 무료, 한 번 구매로 무제한', '기기나 내 iCloud에'], ['KeepMyProof(출시 예정)', '처음 25개 항목 무료, Plus 연 $19.99 또는 한 번 $39.99', '휴대폰에 암호화 보관, 백업은 내 클라우드 드라이브에 저장하는 파일']] } },
        { h: 'KeepMyProof가 하는 일과 하지 않는 일', a: '고르기 쉽도록 분명히 적습니다.', list: ['합니다: 방별 집 물품 목록 폴더, 물건마다 사진과 두 날짜, 파일로 보관하는 영수증, 폴더 전체 PDF, 원본 파일 내보내기, 내 클라우드 드라이브로 암호화 백업.', '하지 않습니다: 바코드 스캔, 가치 합계, 가족과 공유, 기기 간 동기화.'] },
      ],
      faq: [['무료 집 물품 목록 앱이 있나요?', '몇 가지는 무료로 받을 수 있지만 한도가 있습니다. Home Contents 페이지에는 무료 버전이 물건 25개까지라고 나와 있고, KeepMyProof는 처음 25개 항목이 무료이며 보기, PDF, 내보내기, 백업은 잠기지 않습니다. 현재 한도는 각 페이지에서 확인하세요.'], ['이 앱들은 KeepMyProof와 관련이 있나요?', '없습니다. Sortly, Under My Roof, Nest Egg, Home Contents, Encircle은 각 소유자의 상표이며 식별을 위해서만 언급합니다. KeepMyProof는 이들과 제휴하거나 보증을 받지 않았습니다.']] },
  },
  'free-co-parenting-log': {
    zh: { title: '免费共同育儿记录：打印版和私密应用', desc: '可打印的免费共同育儿记录，以及保存您自己带日期记录的私密手机应用。要写什么，和付费共同育儿应用有什么不同。', h1: '免费的共同育儿记录',
      answer: '共同育儿记录是您自己按日期记下的交接、探视、日程变动、开支和有关孩子的重要信息。可以免费保存：打印下面的记录表，或者用一款把笔记、截图和收据放在一起的手机应用。不需要另一位家长注册。',
      bestFor: '想要一份自己的记录、不想付费、也不需要另一位家长加入的家长。',
      sections: [
        { h: '记录里写什么？', a: '事实，当天写下。', list: ['交接：日期、时间、地点和谁送孩子。', '探视、迟到或错过的探视，以及给出的理由。', '日程变动和由谁提出。', '孩子的开支和收据。', '重要信息，旁边附上截图。'] },
        { h: '共享应用的价格（2026 年 11 月 21 日核对）', a: '来自各公司自己的价格页面。', list: ['TalkingParents 的价格页面说使用其应用需要付费订阅，列出每月 $7、$16 和 $32 的方案，部分家长可申请费用减免。', 'OurFamilyWizard 的价格页面列出每年 $110、$149.99、$216 和 $299.88 的方案，并说明每位家长需要各自订阅。', '有些法院会指定某个应用；如果您的法院指定了，请按要求使用。'] },
      ],
      faq: [['另一位家长需要加入吗？', '如果只是您自己的记录，不需要。共享应用需要双方都加入；打印的记录表或 KeepMyProof 只属于您。如果法院指定了某个应用，请按要求使用，同时保留自己的副本。'], ['这是法律建议吗？', '不是。本页仅供参考，不构成法律建议。KeepMyProof 无法判断监护事务的结果。请询问您的律师或法律援助机构应该保存什么、怎样保存。']] },
    ko: { title: '무료 공동 양육 기록: 인쇄용과 비공개 앱', desc: '인쇄할 수 있는 무료 공동 양육 기록과 날짜가 남는 내 기록을 위한 비공개 휴대폰 앱. 무엇을 적을지, 유료 공동 양육 앱과 무엇이 다른지.', h1: '무료 공동 양육 기록',
      answer: '공동 양육 기록은 아이 인계, 면접 교섭, 일정 변경, 비용, 아이에 관한 중요한 메시지를 날짜와 함께 남기는 나만의 기록입니다. 무료로 할 수 있습니다. 아래 기록지를 인쇄하거나, 메모와 스크린샷과 영수증을 함께 보관하는 앱을 쓰세요. 상대 부모의 가입은 필요 없습니다.',
      bestFor: '유료 요금제나 상대 부모의 가입 없이 나만의 기록을 원하는 부모.',
      sections: [
        { h: '기록에는 무엇을 적나요?', a: '사실을, 그날 바로.', list: ['인계: 날짜, 시간, 장소, 아이를 데려온 사람.', '면접 교섭, 늦거나 빠진 교섭과 그 이유.', '일정 변경과 요청한 사람.', '아이를 위한 비용과 영수증.', '중요한 메시지와 그 옆의 스크린샷.'] },
        { h: '공유 앱의 가격(2026년 11월 21일 확인)', a: '각 회사의 가격 페이지 기준입니다.', list: ['TalkingParents 가격 페이지는 앱을 쓰려면 유료 구독이 필요하다고 하며 월 $7, $16, $32 요금제를 보여 주고, 일부 부모는 요금 면제를 받을 수 있다고 합니다.', 'OurFamilyWizard 가격 페이지는 연 $110, $149.99, $216, $299.88 요금제를 보여 주며 부모마다 각자 구독해야 한다고 합니다.', '법원이 특정 앱을 지정하기도 합니다. 지정됐다면 그 앱을 쓰세요.'] },
      ],
      faq: [['상대 부모가 가입해야 하나요?', '나만의 기록이라면 필요 없습니다. 공유 앱은 두 부모가 모두 가입해야 하지만, 인쇄용 기록지나 KeepMyProof는 나만 씁니다. 법원이 앱을 지정했다면 그대로 쓰고 내 사본도 따로 보관하세요.'], ['이것은 법률 자문인가요?', '아닙니다. 이 페이지는 정보 제공용이며 법률 자문이 아닙니다. KeepMyProof는 양육권 문제의 결과를 말할 수 없습니다. 무엇을 어떻게 보관할지는 변호사나 법률 구조 기관에 물어보세요.']] },
  },
};
