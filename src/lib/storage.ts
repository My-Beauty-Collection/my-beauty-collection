import { BEAUTY_ICONS, type BeautyIconName } from '../components/beauty-icons'
import { isCustomId, migrateTaxonomy, OTHER_ICON, Taxonomy, ZONES, type ZoneId } from '../data/taxonomy'
import { isIsoDate } from './dates'
import { newId, normalizeCombos, normalizePairings } from './products'
import type { AppData, CustomLevel, CustomTaxonomyItem, LipCombo, Product, WishItem } from './types'

export const STORAGE_KEY = 'my-beauty-case:data'

export function emptyData(): AppData {
  return { version: 2, products: [], wishlist: [], combos: [], customTaxonomy: [] }
}

type Raw = Record<string, unknown>

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const date = (v: unknown): string | null => (isIsoDate(v) ? v : null)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const zoneIds = new Set<string>(ZONES.map((z) => z.id))

function rating(v: unknown): number | null {
  const n = num(v)
  return n !== null && n >= 1 && n <= 5 ? Math.round(n) : null
}

function positiveInt(v: unknown): number | null {
  const n = num(v)
  return n !== null && n > 0 ? Math.round(n) : null
}

/** Valida un prodotto (anche nel formato della prima versione) e lo porta al modello attuale. */
export function normalizeProduct(raw: unknown): Product | null {
  if (!isObject(raw) || typeof raw.name !== 'string' || !raw.name.trim()) return null
  const now = new Date().toISOString()
  const taxonomy = migrateTaxonomy({
    categoryId: str(raw.categoryId),
    subcategoryId: str(raw.subcategoryId),
    typeId: str(raw.typeId) || null,
  })
  return {
    id: str(raw.id) || newId(),
    name: raw.name,
    brand: str(raw.brand),
    ...taxonomy,
    zones: [...new Set(strList(raw.zones).filter((z): z is ZoneId => zoneIds.has(z)))],
    openedDate: date(raw.openedDate),
    paoMonths: positiveInt(raw.paoMonths),
    expiryDate: date(raw.expiryDate),
    rating: rating(raw.rating),
    favorite: raw.favorite === true,
    notes: str(raw.notes),
    photo: str(raw.photo) || null,
    pairings: strList(raw.pairings),
    createdAt: str(raw.createdAt, now),
    updatedAt: str(raw.updatedAt, now),
  }
}

/** Valida un desiderio. Nella prima versione era solo testo (`text`); quelli già presi non servono più. */
export function normalizeWishItem(raw: unknown): WishItem | null {
  if (!isObject(raw) || raw.bought === true) return null
  const name = str(raw.name) || str(raw.text)
  if (!name.trim()) return null
  const taxonomy = migrateTaxonomy({
    categoryId: str(raw.categoryId),
    subcategoryId: str(raw.subcategoryId),
    typeId: str(raw.typeId) || null,
  })
  return {
    id: str(raw.id) || newId(),
    name,
    brand: str(raw.brand),
    ...taxonomy,
    note: str(raw.note),
    createdAt: str(raw.createdAt, new Date().toISOString()),
  }
}

export function normalizeCombo(raw: unknown): LipCombo | null {
  if (!isObject(raw)) return null
  const now = new Date().toISOString()
  return {
    id: str(raw.id) || newId(),
    name: str(raw.name),
    productIds: strList(raw.productIds),
    favorite: raw.favorite === true,
    note: str(raw.note),
    createdAt: str(raw.createdAt, now),
    updatedAt: str(raw.updatedAt, now),
  }
}

const LEVELS: CustomLevel[] = ['category', 'subcategory', 'type']
const isIcon = (v: unknown): v is BeautyIconName => typeof v === 'string' && Object.hasOwn(BEAUTY_ICONS, v)

/** Valida una voce personale del catalogo (il genitore si controlla in `assembleData`). */
export function normalizeCustomItem(raw: unknown): CustomTaxonomyItem | null {
  if (!isObject(raw) || !isCustomId(str(raw.id)) || !LEVELS.includes(raw.level as CustomLevel)) return null
  const name = str(raw.name).trim()
  if (!name) return null
  const level = raw.level as CustomLevel
  return {
    id: str(raw.id),
    level,
    parentId: level === 'category' ? '' : str(raw.parentId),
    name,
    icon: isIcon(raw.icon) ? raw.icon : OTHER_ICON,
    createdAt: str(raw.createdAt, new Date().toISOString()),
  }
}

const notNull = <T,>(x: T | null): x is T => x !== null

/** Toglie i riferimenti a voci del catalogo inesistenti (es. una sottocategoria personale eliminata). */
export function fitToTaxonomy<T extends Product | WishItem>(items: T[], taxonomy: Taxonomy): T[] {
  return items.map((item) => {
    const ref = taxonomy.fit(item)
    const same = ref.categoryId === item.categoryId && ref.subcategoryId === item.subcategoryId && ref.typeId === item.typeId
    return same ? item : { ...item, ...ref }
  })
}

/**
 * Mette insieme dati già validati: voci personali con un genitore esistente, prodotti e desideri
 * coerenti con il catalogo, abbinamenti simmetrici e Combo coerenti con i prodotti.
 */
export function assembleData(
  products: Product[],
  wishlist: WishItem[],
  combos: LipCombo[],
  customTaxonomy: CustomTaxonomyItem[] = [],
): AppData {
  const unique = [...new Map(customTaxonomy.map((i) => [i.id, i])).values()]
  const taxonomy = new Taxonomy(unique)
  const custom = unique.filter((i) => taxonomy.has(i))
  const normalized = normalizePairings(fitToTaxonomy(products, taxonomy))
  return {
    version: 2,
    products: normalized,
    wishlist: fitToTaxonomy(wishlist, taxonomy),
    combos: normalizeCombos(combos, normalized),
    customTaxonomy: custom,
  }
}

/** Valida e normalizza dati di provenienza esterna (localStorage o file di backup, v1 o v2). */
export function parseData(json: string): AppData {
  const raw: unknown = JSON.parse(json)
  if (!isObject(raw) || !Array.isArray(raw.products)) {
    throw new Error('Il file non sembra un backup di Beauty Collection.')
  }
  const list = (v: unknown) => (Array.isArray(v) ? v : [])
  return assembleData(
    raw.products.map(normalizeProduct).filter(notNull),
    list(raw.wishlist).map(normalizeWishItem).filter(notNull),
    list(raw.combos).map(normalizeCombo).filter(notNull),
    list(raw.customTaxonomy).map(normalizeCustomItem).filter(notNull),
  )
}

export function loadData(storage: Storage = localStorage): AppData {
  const json = storage.getItem(STORAGE_KEY)
  if (!json) return emptyData()
  try {
    return parseData(json)
  } catch {
    // Dati corrotti: li conserviamo a parte invece di sovrascriverli in silenzio.
    storage.setItem(`${STORAGE_KEY}:corrupted:${Date.now()}`, json)
    return emptyData()
  }
}

export function saveData(data: AppData, storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportFileName(today: string): string {
  return `beauty-collection-backup-${today}.json`
}
