import { customDescendants, Taxonomy } from '../data/taxonomy'
import { normalizeCombos, normalizePairings, removeProduct, syncPairings } from './products'
import { fitToTaxonomy } from './storage'
import type { AppData, CustomTaxonomyItem, LipCombo, Product, WishItem } from './types'

export type Action =
  | { type: 'product/save'; product: Product }
  | { type: 'product/delete'; id: string }
  | { type: 'product/patch'; id: string; patch: Partial<Omit<Product, 'id' | 'pairings'>> }
  | { type: 'product/pairings'; id: string; pairings: string[] }
  | { type: 'wish/save'; item: WishItem }
  | { type: 'wish/delete'; id: string }
  | { type: 'combo/save'; combo: LipCombo }
  | { type: 'combo/patch'; id: string; patch: Partial<Omit<LipCombo, 'id' | 'productIds'>> }
  | { type: 'combo/delete'; id: string }
  | { type: 'taxonomy/save'; item: CustomTaxonomyItem }
  /** Elimina la voce personale e quelle che contiene; i prodotti passano al livello superiore. */
  | { type: 'taxonomy/delete'; id: string }
  | { type: 'data/replace'; data: AppData }
  | { type: 'data/append'; products: Product[]; wishlist: WishItem[]; combos: LipCombo[] }

function upsert<T extends { id: string }>(list: T[], item: T, prepend = false): T[] {
  if (list.some((x) => x.id === item.id)) return list.map((x) => (x.id === item.id ? item : x))
  return prepend ? [item, ...list] : [...list, item]
}

export function reducer(state: AppData, action: Action): AppData {
  const now = new Date().toISOString()

  switch (action.type) {
    case 'product/save': {
      const product = { ...action.product, updatedAt: now }
      const products = syncPairings(upsert(state.products, product), product.id, product.pairings)
      // Se il prodotto non è più un prodotto labbra, gli abbinamenti non validi spariscono.
      return { ...state, products: normalizePairings(products) }
    }

    case 'product/delete': {
      const products = removeProduct(state.products, action.id)
      return { ...state, products, combos: normalizeCombos(state.combos, products) }
    }

    case 'product/patch': {
      const products = state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch, updatedAt: now } : p))
      return { ...state, products }
    }

    case 'product/pairings':
      return { ...state, products: normalizePairings(syncPairings(state.products, action.id, action.pairings)) }

    case 'wish/save': {
      const item = { ...action.item, name: action.item.name.trim(), brand: action.item.brand.trim(), note: action.item.note.trim() }
      if (!item.name) return state
      return { ...state, wishlist: upsert(state.wishlist, item, true) }
    }

    case 'wish/delete':
      return { ...state, wishlist: state.wishlist.filter((w) => w.id !== action.id) }

    case 'combo/save': {
      const combo = { ...action.combo, name: action.combo.name.trim(), note: action.combo.note.trim(), updatedAt: now }
      return { ...state, combos: normalizeCombos(upsert(state.combos, combo, true), state.products) }
    }

    case 'combo/patch':
      return {
        ...state,
        combos: state.combos.map((c) => (c.id === action.id ? { ...c, ...action.patch, updatedAt: now } : c)),
      }

    case 'combo/delete':
      return { ...state, combos: state.combos.filter((c) => c.id !== action.id) }

    case 'taxonomy/save': {
      const item = { ...action.item, name: action.item.name.trim() }
      if (!item.name) return state
      return { ...state, customTaxonomy: upsert(state.customTaxonomy, item) }
    }

    case 'taxonomy/delete': {
      const removed = customDescendants(state.customTaxonomy, action.id)
      const customTaxonomy = state.customTaxonomy.filter((i) => !removed.has(i.id))
      const taxonomy = new Taxonomy(customTaxonomy)
      // Una categoria personale eliminata: i suoi prodotti restano, senza categoria (in "Altro").
      const detach = <T extends Product | WishItem>(x: T): T => (removed.has(x.categoryId) ? { ...x, categoryId: '' } : x)
      const products = fitToTaxonomy(state.products.map(detach), taxonomy).map((p, i) =>
        p === state.products[i] ? p : { ...p, updatedAt: now },
      )
      return {
        ...state,
        customTaxonomy,
        products: normalizePairings(products),
        wishlist: fitToTaxonomy(state.wishlist.map(detach), taxonomy),
      }
    }

    case 'data/replace':
      return action.data

    case 'data/append': {
      const products = normalizePairings([...state.products, ...action.products])
      return {
        ...state,
        products,
        wishlist: [...action.wishlist, ...state.wishlist],
        combos: normalizeCombos([...action.combos, ...state.combos], products),
      }
    }
  }
}
