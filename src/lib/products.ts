import { getCategory, getProductType, getSubcategory, LIP_LINER_TYPE, LIP_SUBCATEGORY } from '../data/taxonomy'
import { addMonths, formatDate } from './dates'
import type { LipCombo, Product } from './types'

export function newId(): string {
  // crypto.randomUUID non è disponibile su origini http non sicure (es. il telefono in rete locale).
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

export function emptyProduct(now: string): Product {
  return {
    id: newId(),
    name: '',
    brand: '',
    categoryId: '',
    subcategoryId: '',
    typeId: null,
    zones: [],
    openedDate: null,
    paoMonths: null,
    expiryDate: null,
    rating: null,
    favorite: false,
    notes: '',
    photo: null,
    pairings: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ---------- Visualizzazione ----------

/** Tipologia o, in mancanza, sottocategoria. */
export function typeLabel(p: Pick<Product, 'typeId' | 'subcategoryId'>): string {
  return getProductType(p.typeId)?.name ?? getSubcategory(p.subcategoryId)?.name ?? ''
}

/** Percorso nella tassonomia, es. ["Make-up", "Labbra", "Matite labbra"]. */
export function taxonomyPath(p: Pick<Product, 'categoryId' | 'subcategoryId' | 'typeId'>): string[] {
  return [
    getCategory(p.categoryId)?.name ?? 'Senza categoria',
    getSubcategory(p.subcategoryId)?.name,
    getProductType(p.typeId)?.name,
  ].filter((x): x is string => Boolean(x))
}

/** "Marca Nome", per titoli compatti (es. nelle Combo). */
export function fullName(p: Pick<Product, 'brand' | 'name'>): string {
  return [p.brand, p.name].filter(Boolean).join(' ')
}

// ---------- PAO e scadenze (requisiti §6) ----------

/** Fine PAO calcolata: data di apertura + PAO. */
export function paoEnd(p: Pick<Product, 'openedDate' | 'paoMonths'>): string | null {
  return p.openedDate && p.paoMonths ? addMonths(p.openedDate, p.paoMonths) : null
}

export interface ProductWarning {
  product: Product
  /** Data di fine PAO già trascorsa. */
  paoExceeded: string | null
  /** Data di scadenza della confezione già trascorsa. */
  expired: string | null
}

/**
 * Avvisi solo a limite superato: nessun avviso preventivo.
 * Il limite è "trascorso" dal giorno successivo alla data (il giorno stesso il prodotto è ancora valido).
 */
export function productWarning(p: Product, today: string): ProductWarning | null {
  const end = paoEnd(p)
  const paoExceeded = end && end < today ? end : null
  const expired = p.expiryDate && p.expiryDate < today ? p.expiryDate : null
  return paoExceeded || expired ? { product: p, paoExceeded, expired } : null
}

/** Prodotti con PAO superato o scaduti, dal limite superato da più tempo. */
/** Dettaglio dell'avviso, es. "Aperto il 10 feb 2024 · PAO 6M". */
export function warningDetail(w: ProductWarning): string {
  const parts: string[] = []
  if (w.paoExceeded) parts.push(`Aperto il ${formatDate(w.product.openedDate)} · PAO ${w.product.paoMonths}M`)
  if (w.expired) parts.push(`Scaduto il ${formatDate(w.expired)}`)
  return parts.join(' · ')
}

export function computeWarnings(products: Product[], today: string): ProductWarning[] {
  const since = (w: ProductWarning) => [w.paoExceeded, w.expired].filter((d): d is string => Boolean(d)).sort()[0]
  return products
    .map((p) => productWarning(p, today))
    .filter((w): w is ProductWarning => w !== null)
    .sort((a, b) => since(a).localeCompare(since(b)))
}

// ---------- Labbra: abbinamenti (requisiti §7) ----------

export function isLipLiner(p: Pick<Product, 'typeId'>): boolean {
  return p.typeId === LIP_LINER_TYPE
}

/** Prodotto labbra: Make-up › Labbra, oppure qualsiasi prodotto con la zona d'uso "labbra". */
export function isLipProduct(p: Pick<Product, 'subcategoryId' | 'zones'>): boolean {
  return p.subcategoryId === LIP_SUBCATEGORY || p.zones.includes('labbra')
}

/** Un abbinamento valido collega una matita labbra a un altro prodotto labbra. */
export function canPair(a: Product, b: Product): boolean {
  if (a.id === b.id) return false
  return (isLipLiner(a) && isLipProduct(b)) || (isLipLiner(b) && isLipProduct(a))
}

/** Prodotti che si possono abbinare alla matita `linerId`. */
export function pairingCandidates(products: Product[], linerId: string): Product[] {
  const liner = products.find((p) => p.id === linerId)
  return liner ? products.filter((p) => canPair(liner, p)) : []
}

/**
 * Imposta gli abbinamenti di `productId` e aggiorna di conseguenza gli altri prodotti,
 * così che la relazione resti simmetrica.
 */
export function syncPairings(products: Product[], productId: string, pairingIds: string[]): Product[] {
  const existing = new Set(products.map((p) => p.id))
  const wanted = new Set(pairingIds.filter((id) => id !== productId && existing.has(id)))

  return products.map((p) => {
    if (p.id === productId) return { ...p, pairings: [...wanted] }
    const has = p.pairings.includes(productId)
    const should = wanted.has(p.id)
    if (has === should) return p
    return { ...p, pairings: should ? [...p.pairings, productId] : p.pairings.filter((id) => id !== productId) }
  })
}

/** Rende gli abbinamenti simmetrici e tiene solo quelli validi (matita ↔ prodotto labbra). */
export function normalizePairings(products: Product[]): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  const links = new Map<string, Set<string>>(products.map((p) => [p.id, new Set<string>()]))
  for (const p of products) {
    for (const otherId of p.pairings) {
      const other = byId.get(otherId)
      if (!other || !canPair(p, other)) continue
      links.get(p.id)!.add(otherId)
      links.get(otherId)!.add(p.id)
    }
  }
  return products.map((p) => {
    const next = [...links.get(p.id)!]
    const same = next.length === p.pairings.length && next.every((id) => p.pairings.includes(id))
    return same ? p : { ...p, pairings: next }
  })
}

export function removeProduct(products: Product[], productId: string): Product[] {
  return products
    .filter((p) => p.id !== productId)
    .map((p) => (p.pairings.includes(productId) ? { ...p, pairings: p.pairings.filter((id) => id !== productId) } : p))
}

// ---------- Lip Combo ----------

export const MIN_COMBO_PRODUCTS = 2

/** Titolo della Combo: il nome scelto oppure i prodotti uniti da "+". */
export function comboTitle(combo: LipCombo, products: Product[]): string {
  if (combo.name.trim()) return combo.name.trim()
  const byId = new Map(products.map((p) => [p.id, p]))
  return combo.productIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => p !== undefined)
    .map(fullName)
    .join(' + ')
}

/** Toglie i prodotti inesistenti e scarta le Combo rimaste con meno di due prodotti. */
export function normalizeCombos(combos: LipCombo[], products: Product[]): LipCombo[] {
  const ids = new Set(products.map((p) => p.id))
  return combos
    .map((c) => {
      const productIds = [...new Set(c.productIds)].filter((id) => ids.has(id))
      const same = productIds.length === c.productIds.length
      return same ? c : { ...c, productIds }
    })
    .filter((c) => c.productIds.length >= MIN_COMBO_PRODUCTS)
}

// ---------- Ricerca ----------

export function matchesSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [p.name, p.brand, p.notes, ...taxonomyPath(p)].join(' ').toLowerCase()
  return q.split(/\s+/).every((word) => haystack.includes(word))
}
