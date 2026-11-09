/**
 * Tassonomia della Beauty Collection (requisiti consolidati).
 *
 * Macro-categoria → Sottocategoria → (solo Make-up) Tipologia.
 * Le "zone d'uso" servono per i prodotti multiuso (es. un olio per viso, corpo e capelli):
 * il prodotto ha una sola categoria principale e più zone, senza essere duplicato.
 *
 * Gli id sono stabili: i prodotti salvati li referenziano, quindi NON vanno rinominati.
 * Dove possibile riusano quelli della prima versione dell'app; il resto è mappato in `migrateTaxonomy`.
 */

import type { BeautyIconName } from '../components/beauty-icons'

export type ZoneId = 'viso' | 'occhi' | 'labbra' | 'capelli' | 'corpo'

export interface Zone {
  id: ZoneId
  label: string
}

export const ZONES: Zone[] = [
  { id: 'viso', label: 'Viso' },
  { id: 'occhi', label: 'Occhi' },
  { id: 'labbra', label: 'Labbra' },
  { id: 'capelli', label: 'Capelli' },
  { id: 'corpo', label: 'Corpo' },
]

export interface ProductType {
  id: string
  name: string
  icon: BeautyIconName
}

export interface Subcategory {
  id: string
  name: string
  icon: BeautyIconName
  zones: ZoneId[]
  /** Tipologie: previste solo per il Make-up. */
  types: ProductType[]
}

export interface Category {
  id: string
  name: string
  /** Icona (miniature, riquadri). */
  icon: BeautyIconName
  /** Zone predefinite quando la categoria non ha sottocategorie (Profumi). */
  zones: ZoneId[]
  subcategories: Subcategory[]
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sub(id: string, name: string, icon: BeautyIconName, zones: ZoneId[], types: [string, BeautyIconName][] = []): Subcategory {
  return { id, name, icon, zones, types: types.map(([t, i]) => ({ id: `${id}/${slugify(t)}`, name: t, icon: i })) }
}

export const CATEGORIES: Category[] = [
  {
    id: 'skincare',
    name: 'Skincare',
    icon: 'face-cream',
    zones: ['viso'],
    subcategories: [
      sub('struccanti', 'Struccanti', 'makeup-remover', ['viso']),
      sub('detergenti', 'Detergenti', 'cleanser-tube', ['viso']),
      sub('sieri', 'Sieri e trattamenti', 'serum-dropper', ['viso']),
      sub('creme', 'Creme', 'face-cream', ['viso']),
      sub('contorno-occhi', 'Contorno occhi', 'eye-patch-gel', ['occhi']),
      sub('oli-viso', 'Oli', 'essential-oil', ['viso']),
      sub('maschere', 'Maschere', 'face-mask-sheet', ['viso']),
      sub('esfolianti', 'Scrub / Esfolianti', 'bath-salt', ['viso']),
    ],
  },
  {
    id: 'makeup',
    name: 'Make-up',
    icon: 'lipstick',
    zones: ['viso'],
    subcategories: [
      sub('mu-viso', 'Viso', 'foundation-bottle', ['viso'], [
        ['Fondotinta', 'foundation-bottle'],
        ['Correttori', 'concealer'],
        ['Ciprie', 'powder-puff'],
        ['Blush', 'blush-compact'],
        ['Bronzer', 'brush-jar'],
        ['Illuminanti', 'sparkles'],
        ['Primer', 'ointment-tube'],
        ['Fissanti', 'nose-spray'],
      ]),
      sub('mu-occhi', 'Occhi', 'eyeliner', ['occhi'], [
        ['Mascara', 'mascara'],
        ['Eyeliner', 'eyeliner'],
        ['Matite occhi', 'eyebrow-pencil'],
        ['Ombretti / Palette', 'eyeshadow-palette'],
        ['Primer occhi', 'ointment-tube'],
      ]),
      sub('mu-labbra', 'Labbra', 'lip-reading', ['labbra'], [
        ['Matite labbra', 'eyebrow-pencil'],
        ['Rossetti', 'lipstick'],
        ['Gloss', 'lip-gloss'],
        ['Lip Oil', 'oil-bottle'],
        ['Tinte labbra', 'lip-reading'],
        ['Balsami colorati', 'lip-balm'],
      ]),
      sub('mu-sopracciglia', 'Sopracciglia', 'eyebrow', ['occhi'], [
        ['Matite', 'eyebrow'],
        ['Gel', 'makeup-brush'],
        ['Ombretti', 'eyeshadow-palette'],
      ]),
    ],
  },
  {
    id: 'solari',
    name: 'Solari',
    icon: 'sunscreen',
    zones: ['viso', 'corpo'],
    subcategories: [
      sub('solari-viso', 'Viso', 'sunscreen', ['viso']),
      sub('solari-corpo', 'Corpo', 'sunscreen-bottle', ['corpo']),
      sub('solari-capelli', 'Capelli', 'sun-hat', ['capelli']),
      sub('solari-labbra', 'Labbra', 'lip-balm', ['labbra']),
      sub('doposole', 'Doposole', 'sunset', ['viso', 'corpo']),
    ],
  },
  {
    id: 'capelli',
    name: 'Capelli',
    icon: 'hair-dryer',
    zones: ['capelli'],
    subcategories: [
      sub('shampoo', 'Shampoo', 'shampoo-bottle', ['capelli']),
      sub('balsamo', 'Balsamo', 'conditioner', ['capelli']),
      sub('maschere-capelli', 'Maschere', 'clay-mask', ['capelli']),
      sub('trattamenti-capelli', 'Trattamenti', 'dropper-bottle', ['capelli']),
      sub('oli-capelli', 'Oli', 'olive-oil-bottle', ['capelli']),
      sub('styling', 'Styling', 'comb-hair', ['capelli']),
    ],
  },
  {
    id: 'corpo',
    name: 'Corpo',
    icon: 'body-lotion',
    zones: ['corpo'],
    subcategories: [
      sub('detergenza-corpo', 'Detergenti', 'soap-dispenser', ['corpo']),
      sub('idratanti-corpo', 'Creme', 'body-lotion', ['corpo']),
      sub('oli-corpo', 'Oli', 'oil-bottle', ['corpo']),
      sub('scrub-corpo', 'Scrub / Esfolianti', 'bath-salt', ['corpo']),
      sub('trattamenti-corpo', 'Trattamenti', 'massage-hands', ['corpo']),
    ],
  },
  {
    id: 'profumi',
    name: 'Profumi',
    icon: 'perfume-bottle',
    zones: ['corpo'],
    subcategories: [],
  },
]

/** Icona delle voci fuori catalogo (categoria non più prevista). */
export const OTHER_ICON: BeautyIconName = 'toiletry-bag'

/** Tipologia delle matite labbra: da qui parte il flusso degli abbinamenti e delle Lip Combo. */
export const LIP_LINER_TYPE = 'mu-labbra/matite-labbra'
export const LIP_SUBCATEGORY = 'mu-labbra'

// ---------- Lookup ----------

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]))
const subcategoryById = new Map<string, { category: Category; subcategory: Subcategory }>()
const typeById = new Map<string, { subcategory: Subcategory; type: ProductType }>()
for (const category of CATEGORIES) {
  for (const subcategory of category.subcategories) {
    subcategoryById.set(subcategory.id, { category, subcategory })
    for (const type of subcategory.types) typeById.set(type.id, { subcategory, type })
  }
}

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id)
}

export function getSubcategory(id: string): Subcategory | undefined {
  return subcategoryById.get(id)?.subcategory
}

export function getProductType(id: string | null): ProductType | undefined {
  return id ? typeById.get(id)?.type : undefined
}

/** Icona più specifica disponibile: tipologia, poi sottocategoria, poi categoria. */
export function taxonomyIcon(ref: { categoryId: string; subcategoryId: string; typeId: string | null }): BeautyIconName {
  return (
    getProductType(ref.typeId)?.icon ??
    getSubcategory(ref.subcategoryId)?.icon ??
    getCategory(ref.categoryId)?.icon ??
    OTHER_ICON
  )
}

export function getZone(id: ZoneId): Zone | undefined {
  return ZONES.find((z) => z.id === id)
}

/** La categoria richiede la scelta di una sottocategoria? (Profumi no) */
export function needsSubcategory(categoryId: string): boolean {
  return (getCategory(categoryId)?.subcategories.length ?? 0) > 0
}

/** Zone d'uso predefinite per una sottocategoria (o per la categoria, se non ne ha). */
export function defaultZones(categoryId: string, subcategoryId: string): ZoneId[] {
  return getSubcategory(subcategoryId)?.zones ?? getCategory(categoryId)?.zones ?? []
}

// ---------- Migrazione dalla prima versione della tassonomia ----------

/** Vecchie tipologie Make-up → nuove. */
const LEGACY_TYPES: Record<string, string> = {
  'mu-viso/fondotinta': 'mu-viso/fondotinta',
  'mu-viso/correttore': 'mu-viso/correttori',
  'mu-viso/cipria': 'mu-viso/ciprie',
  'mu-viso/blush': 'mu-viso/blush',
  'mu-viso/bronzer-terra-abbronzante': 'mu-viso/bronzer',
  'mu-viso/illuminante': 'mu-viso/illuminanti',
  'mu-viso/primer': 'mu-viso/primer',
  'mu-viso/spray-fissante': 'mu-viso/fissanti',
  'mu-occhi/mascara': 'mu-occhi/mascara',
  'mu-occhi/eyeliner': 'mu-occhi/eyeliner',
  'mu-occhi/matita-occhi': 'mu-occhi/matite-occhi',
  'mu-occhi/ombretto': 'mu-occhi/ombretti-palette',
  'mu-occhi/palette-ombretti': 'mu-occhi/ombretti-palette',
  'mu-occhi/primer-occhi': 'mu-occhi/primer-occhi',
  'mu-labbra/matita-labbra': 'mu-labbra/matite-labbra',
  'mu-labbra/rossetto': 'mu-labbra/rossetti',
  'mu-labbra/rossetto-liquido': 'mu-labbra/rossetti',
  'mu-labbra/lucidalabbra-gloss': 'mu-labbra/gloss',
  'mu-labbra/lip-oil': 'mu-labbra/lip-oil',
  'mu-labbra/tinta-labbra': 'mu-labbra/tinte-labbra',
  'mu-labbra/balsamo-colorato': 'mu-labbra/balsami-colorati',
  'mu-sopracciglia/matita-sopracciglia': 'mu-sopracciglia/matite',
  'mu-sopracciglia/penna-sopracciglia': 'mu-sopracciglia/matite',
  'mu-sopracciglia/gel-sopracciglia': 'mu-sopracciglia/gel',
  'mu-sopracciglia/polvere-sopracciglia': 'mu-sopracciglia/ombretti',
}

/** Vecchie tipologie non-Make-up che determinano la nuova sottocategoria. */
const LEGACY_TYPE_TO_SUB: Record<string, string> = {
  'detergenti/olio-struccante': 'struccanti',
  'detergenti/balsamo-struccante': 'struccanti',
  'detergenti/acqua-micellare': 'struccanti',
  'detergenti/struccante-occhi-bifasico': 'struccanti',
  'detergenti/salviette-dischetti-struccanti': 'struccanti',
  'sieri/olio-viso': 'oli-viso',
}

export interface TaxonomyRef {
  categoryId: string
  subcategoryId: string
  typeId: string | null
}

/**
 * Porta un riferimento alla tassonomia attuale: converte le vecchie voci note e azzera
 * sottocategoria/tipologia non più esistenti (il prodotto resta nella sua categoria).
 */
export function migrateTaxonomy(ref: TaxonomyRef): TaxonomyRef {
  let { categoryId, subcategoryId, typeId } = ref

  if (typeId && LEGACY_TYPES[typeId]) typeId = LEGACY_TYPES[typeId]
  if (typeId && LEGACY_TYPE_TO_SUB[typeId]) {
    subcategoryId = LEGACY_TYPE_TO_SUB[typeId]
    typeId = null
  }

  const category = getCategory(categoryId)
  if (!category) return { categoryId, subcategoryId: '', typeId: null }

  const owner = subcategoryById.get(subcategoryId)
  if (!owner || owner.category.id !== category.id) subcategoryId = ''
  const typeOwner = typeId ? typeById.get(typeId) : undefined
  if (!typeOwner || typeOwner.subcategory.id !== subcategoryId) typeId = null

  return { categoryId, subcategoryId, typeId }
}
