/**
 * Sincronizzazione con Supabase.
 *
 * L'app lavora su uno stato locale (reducer) e ad ogni modifica calcola la differenza
 * rispetto all'ultimo stato salvato sul server, inviando solo le righe cambiate.
 * Questo modulo contiene le parti pure (mapping righe ↔ oggetti, diff) più le chiamate al client.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { assembleData, normalizeCombo, normalizeCustomItem, normalizeProduct, normalizeWishItem } from './storage'
import type { AppData, CustomTaxonomyItem, LipCombo, Product, WishItem } from './types'

// ---------- Mapping ----------

/** Colonne usate dall'app. La tabella può averne altre della prima versione, non più usate. */
export interface ProductRow {
  user_id: string
  id: string
  name: string
  brand: string
  category_id: string
  subcategory_id: string
  type_id: string | null
  zones: string[]
  opened_date: string | null
  pao_months: number | null
  expiry_date: string | null
  rating: number | null
  favorite: boolean
  notes: string
  photo: string | null
  pairings: string[]
  created_at: string
  updated_at: string
}

export interface WishRow {
  user_id: string
  id: string
  name: string
  brand: string
  category_id: string
  subcategory_id: string
  type_id: string | null
  note: string
  created_at: string
}

export interface ComboRow {
  user_id: string
  id: string
  name: string
  product_ids: string[]
  favorite: boolean
  note: string
  created_at: string
  updated_at: string
}

/** Voce personale del catalogo (tabella `custom_taxonomy`). */
export interface CustomRow {
  user_id: string
  id: string
  level: string
  parent_id: string
  name: string
  icon: string
  created_at: string
}

const PRODUCT_COLUMNS =
  'id,name,brand,category_id,subcategory_id,type_id,zones,opened_date,pao_months,expiry_date,rating,favorite,notes,photo,pairings,created_at,updated_at'

export function productToRow(p: Product, userId: string): ProductRow {
  return {
    user_id: userId,
    id: p.id,
    name: p.name,
    brand: p.brand,
    category_id: p.categoryId,
    subcategory_id: p.subcategoryId,
    type_id: p.typeId,
    zones: p.zones,
    opened_date: p.openedDate,
    pao_months: p.paoMonths,
    expiry_date: p.expiryDate,
    rating: p.rating,
    favorite: p.favorite,
    notes: p.notes,
    photo: p.photo,
    pairings: p.pairings,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }
}

export function rowToProduct(row: Omit<ProductRow, 'user_id'>): Product | null {
  return normalizeProduct({
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    typeId: row.type_id,
    zones: row.zones,
    openedDate: row.opened_date,
    paoMonths: row.pao_months,
    expiryDate: row.expiry_date,
    rating: row.rating,
    favorite: row.favorite,
    notes: row.notes,
    photo: row.photo,
    pairings: row.pairings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function wishToRow(w: WishItem, userId: string): WishRow {
  return {
    user_id: userId,
    id: w.id,
    name: w.name,
    brand: w.brand,
    category_id: w.categoryId,
    subcategory_id: w.subcategoryId,
    type_id: w.typeId,
    note: w.note,
    created_at: w.createdAt,
  }
}

export function rowToWish(row: Omit<WishRow, 'user_id'>): WishItem | null {
  return normalizeWishItem({
    id: row.id,
    name: row.name,
    brand: row.brand,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    typeId: row.type_id,
    note: row.note,
    createdAt: row.created_at,
  })
}

export function comboToRow(c: LipCombo, userId: string): ComboRow {
  return {
    user_id: userId,
    id: c.id,
    name: c.name,
    product_ids: c.productIds,
    favorite: c.favorite,
    note: c.note,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

export function rowToCombo(row: Omit<ComboRow, 'user_id'>): LipCombo | null {
  return normalizeCombo({
    id: row.id,
    name: row.name,
    productIds: row.product_ids,
    favorite: row.favorite,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function customToRow(i: CustomTaxonomyItem, userId: string): CustomRow {
  return {
    user_id: userId,
    id: i.id,
    level: i.level,
    parent_id: i.parentId,
    name: i.name,
    icon: i.icon,
    created_at: i.createdAt,
  }
}

export function rowToCustom(row: Omit<CustomRow, 'user_id'>): CustomTaxonomyItem | null {
  return normalizeCustomItem({
    id: row.id,
    level: row.level,
    parentId: row.parent_id,
    name: row.name,
    icon: row.icon,
    createdAt: row.created_at,
  })
}

// ---------- Diff ----------

export interface Changes {
  upsertProducts: Product[]
  deleteProductIds: string[]
  upsertWishes: WishItem[]
  deleteWishIds: string[]
  upsertCombos: LipCombo[]
  deleteComboIds: string[]
  upsertCustom: CustomTaxonomyItem[]
  deleteCustomIds: string[]
}

function same<T>(a: T, b: T): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b)
}

function diffById<T extends { id: string }>(prev: T[], next: T[]): { upsert: T[]; remove: string[] } {
  const before = new Map(prev.map((x) => [x.id, x]))
  const after = new Set(next.map((x) => x.id))
  return {
    upsert: next.filter((x) => {
      const old = before.get(x.id)
      return !old || !same(old, x)
    }),
    remove: prev.filter((x) => !after.has(x.id)).map((x) => x.id),
  }
}

export function diffData(prev: AppData, next: AppData): Changes {
  const products = diffById(prev.products, next.products)
  const wishes = diffById(prev.wishlist, next.wishlist)
  const combos = diffById(prev.combos, next.combos)
  const custom = diffById(prev.customTaxonomy, next.customTaxonomy)
  return {
    upsertProducts: products.upsert,
    deleteProductIds: products.remove,
    upsertWishes: wishes.upsert,
    deleteWishIds: wishes.remove,
    upsertCombos: combos.upsert,
    deleteComboIds: combos.remove,
    upsertCustom: custom.upsert,
    deleteCustomIds: custom.remove,
  }
}

export function hasChanges(c: Changes): boolean {
  return Object.values(c).some((list) => list.length > 0)
}

// ---------- Supabase ----------

const PAGE = 1000

async function selectAll<T>(client: SupabaseClient, table: string, columns = '*'): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select(columns).order('created_at').range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as T[]))
    if (data.length < PAGE) return rows
  }
}

const notNull = <T,>(x: T | null): x is T => x !== null

export async function fetchAll(client: SupabaseClient): Promise<AppData> {
  const [productRows, wishRows, comboRows, customRows] = await Promise.all([
    selectAll<ProductRow>(client, 'products', PRODUCT_COLUMNS),
    selectAll<WishRow>(client, 'wish_items'),
    selectAll<ComboRow>(client, 'lip_combos'),
    selectAll<CustomRow>(client, 'custom_taxonomy'),
  ])
  return assembleData(
    productRows.map(rowToProduct).filter(notNull),
    wishRows.map(rowToWish).filter(notNull).reverse(),
    comboRows.map(rowToCombo).filter(notNull).reverse(),
    customRows.map(rowToCustom).filter(notNull),
  )
}

export async function pushChanges(client: SupabaseClient, userId: string, c: Changes): Promise<void> {
  const check = ({ error }: { error: unknown }) => {
    if (error) throw error
  }
  const onConflict = { onConflict: 'user_id,id' }
  const remove = async (table: string, ids: string[]) => {
    if (ids.length) check(await client.from(table).delete().eq('user_id', userId).in('id', ids))
  }
  // Prima il catalogo personale e i prodotti, poi le Combo che li referenziano; le eliminazioni in ordine inverso.
  if (c.upsertCustom.length) {
    check(await client.from('custom_taxonomy').upsert(c.upsertCustom.map((i) => customToRow(i, userId)), onConflict))
  }
  if (c.upsertProducts.length) {
    check(await client.from('products').upsert(c.upsertProducts.map((p) => productToRow(p, userId)), onConflict))
  }
  if (c.upsertWishes.length) {
    check(await client.from('wish_items').upsert(c.upsertWishes.map((w) => wishToRow(w, userId)), onConflict))
  }
  if (c.upsertCombos.length) {
    check(await client.from('lip_combos').upsert(c.upsertCombos.map((x) => comboToRow(x, userId)), onConflict))
  }
  await remove('lip_combos', c.deleteComboIds)
  await remove('wish_items', c.deleteWishIds)
  await remove('products', c.deleteProductIds)
  await remove('custom_taxonomy', c.deleteCustomIds)
}
