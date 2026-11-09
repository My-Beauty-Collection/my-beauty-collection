/**
 * Tassonomia della Beauty Collection (requisiti consolidati).
 *
 * Macro-categoria → Sottocategoria → (solo Make-up) Tipologia.
 * Le "zone d'uso" servono per i prodotti multiuso (es. un olio per viso, corpo e capelli):
 * il prodotto ha una sola categoria principale e più zone, senza essere duplicato.
 *
 * Gli id sono stabili: i prodotti salvati li referenziano, quindi NON vanno rinominati.
 * Dove possibile riusano quelli della prima versione dell'app; il resto è mappato in `migrateTaxonomy`.
 *
 * Le voci predefinite (`CATEGORIES`) sono uguali per tutti. Ogni utente può aggiungere le proprie
 * categorie, sottocategorie e tipologie (`CustomTaxonomyItem`, id con prefisso `u-`): il catalogo
 * in uso, predefinito più personale, è quello restituito da `allCategories()`, `getCategory()` ecc.
 */

import type { BeautyIconName } from '../components/beauty-icons'
import type { CustomTaxonomyItem } from '../lib/types'

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
  /** Voce aggiunta dall'utente. */
  custom?: true
}

export interface Subcategory {
  id: string
  name: string
  icon: BeautyIconName
  zones: ZoneId[]
  /** Tipologie: previste solo per il Make-up. */
  types: ProductType[]
  /** Voce aggiunta dall'utente. */
  custom?: true
}

export interface Category {
  id: string
  name: string
  /** Icona (miniature, riquadri). */
  icon: BeautyIconName
  /** Zone predefinite quando la categoria non ha sottocategorie (Profumi). */
  zones: ZoneId[]
  subcategories: Subcategory[]
  /** Voce aggiunta dall'utente. */
  custom?: true
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

/** Categorie organizzate per tipologia (schede per zona e righe per tipologia): il Make-up. */
const TYPED_CATEGORIES = new Set(CATEGORIES.filter((c) => c.subcategories.some((s) => s.types.length > 0)).map((c) => c.id))

/** La categoria ha le tipologie (Make-up)? Solo lì si possono aggiungere tipologie personali. */
export function usesTypes(categoryId: string): boolean {
  return TYPED_CATEGORIES.has(categoryId)
}

// ---------- Catalogo: voci predefinite + voci personali ----------

export const CUSTOM_PREFIX = 'u-'

export function isCustomId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(CUSTOM_PREFIX))
}

export interface TaxonomyRef {
  categoryId: string
  subcategoryId: string
  typeId: string | null
}

/** Catalogo completo con le ricerche per id. Le voci personali orfane (genitore inesistente) vengono ignorate. */
export class Taxonomy {
  readonly categories: Category[]
  private readonly categoryById = new Map<string, Category>()
  private readonly subcategoryById = new Map<string, { category: Category; subcategory: Subcategory }>()
  private readonly typeById = new Map<string, { subcategory: Subcategory; type: ProductType }>()

  constructor(custom: readonly CustomTaxonomyItem[] = []) {
    const own = (level: CustomTaxonomyItem['level']) => custom.filter((i) => i.level === level && isCustomId(i.id))

    this.categories = [
      ...CATEGORIES.map((c) => ({ ...c, subcategories: c.subcategories.map((s) => ({ ...s, types: [...s.types] })) })),
      ...own('category').map((i): Category => ({ id: i.id, name: i.name, icon: i.icon, zones: [], subcategories: [], custom: true })),
    ]
    for (const c of this.categories) this.categoryById.set(c.id, c)

    for (const i of own('subcategory')) {
      const parent = this.categoryById.get(i.parentId)
      parent?.subcategories.push({ id: i.id, name: i.name, icon: i.icon, zones: [...parent.zones], types: [], custom: true })
    }
    for (const category of this.categories) {
      for (const subcategory of category.subcategories) this.subcategoryById.set(subcategory.id, { category, subcategory })
    }

    for (const i of own('type')) {
      const parent = this.subcategoryById.get(i.parentId)
      if (parent && usesTypes(parent.category.id)) {
        parent.subcategory.types.push({ id: i.id, name: i.name, icon: i.icon, custom: true })
      }
    }
    for (const { subcategory } of this.subcategoryById.values()) {
      for (const type of subcategory.types) this.typeById.set(type.id, { subcategory, type })
    }
  }

  getCategory(id: string): Category | undefined {
    return this.categoryById.get(id)
  }

  getSubcategory(id: string): Subcategory | undefined {
    return this.subcategoryById.get(id)?.subcategory
  }

  getProductType(id: string | null): ProductType | undefined {
    return id ? this.typeById.get(id)?.type : undefined
  }

  /** Categoria a cui appartiene la sottocategoria. */
  categoryOf(subcategoryId: string): Category | undefined {
    return this.subcategoryById.get(subcategoryId)?.category
  }

  /** Sottocategoria a cui appartiene la tipologia. */
  subcategoryOf(typeId: string): Subcategory | undefined {
    return this.typeById.get(typeId)?.subcategory
  }

  /** La voce personale è presente nel catalogo (cioè il suo genitore esiste)? */
  has(item: Pick<CustomTaxonomyItem, 'id' | 'level'>): boolean {
    const found =
      item.level === 'category'
        ? this.getCategory(item.id)
        : item.level === 'subcategory'
          ? this.getSubcategory(item.id)
          : this.getProductType(item.id)
    return found?.custom === true
  }

  /**
   * Riferimento coerente con il catalogo: azzera sottocategoria e tipologia inesistenti o fuori posto.
   * Una categoria sconosciuta resta com'è (il prodotto finisce in "Altro", da riassegnare).
   */
  fit(ref: TaxonomyRef): TaxonomyRef {
    const { categoryId } = ref
    if (!this.getCategory(categoryId)) return { categoryId, subcategoryId: '', typeId: null }
    const subcategoryId = this.categoryOf(ref.subcategoryId)?.id === categoryId ? ref.subcategoryId : ''
    const typeId = subcategoryId && ref.typeId && this.subcategoryOf(ref.typeId)?.id === subcategoryId ? ref.typeId : null
    return { categoryId, subcategoryId, typeId }
  }
}

/** Solo le voci predefinite. */
const DEFAULT_TAXONOMY = new Taxonomy()

/** Catalogo in uso (predefinito + personale): lo aggiorna lo store quando cambiano le voci personali. */
let active = DEFAULT_TAXONOMY

export function activateTaxonomy(custom: readonly CustomTaxonomyItem[]): Taxonomy {
  active = custom.length ? new Taxonomy(custom) : DEFAULT_TAXONOMY
  return active
}

/** Tutte le categorie: le predefinite e poi quelle personali. */
export function allCategories(): Category[] {
  return active.categories
}

export function getCategory(id: string): Category | undefined {
  return active.getCategory(id)
}

export function getSubcategory(id: string): Subcategory | undefined {
  return active.getSubcategory(id)
}

export function getProductType(id: string | null): ProductType | undefined {
  return active.getProductType(id)
}

/** Categoria a cui appartiene la sottocategoria. */
export function categoryOfSubcategory(subcategoryId: string): Category | undefined {
  return active.categoryOf(subcategoryId)
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

/** Id della voce personale e di tutte quelle che contiene (sottocategorie, tipologie). */
export function customDescendants(items: readonly CustomTaxonomyItem[], id: string): Set<string> {
  const ids = new Set([id])
  for (let grew = true; grew; ) {
    grew = false
    for (const i of items) {
      if (!ids.has(i.id) && ids.has(i.parentId)) {
        ids.add(i.id)
        grew = true
      }
    }
  }
  return ids
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

/**
 * Porta un riferimento alla tassonomia attuale: converte le vecchie voci note e azzera
 * sottocategoria/tipologia predefinite non più esistenti (il prodotto resta nella sua categoria).
 * Le voci personali (`u-…`) restano: si verificano dopo, con il catalogo dell'utente (`Taxonomy.fit`).
 */
export function migrateTaxonomy(ref: TaxonomyRef): TaxonomyRef {
  let { categoryId, subcategoryId, typeId } = ref

  if (typeId && LEGACY_TYPES[typeId]) typeId = LEGACY_TYPES[typeId]
  if (typeId && LEGACY_TYPE_TO_SUB[typeId]) {
    subcategoryId = LEGACY_TYPE_TO_SUB[typeId]
    typeId = null
  }

  const fitted = DEFAULT_TAXONOMY.fit({ categoryId, subcategoryId, typeId })
  return {
    categoryId,
    subcategoryId: isCustomId(subcategoryId) ? subcategoryId : fitted.subcategoryId,
    typeId: isCustomId(typeId) ? typeId : fitted.typeId,
  }
}
