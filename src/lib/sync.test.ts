import { describe, expect, it } from 'vitest'
import { LIP_LINER_TYPE } from '../data/taxonomy'
import { emptyProduct } from './products'
import { reducer } from './reducer'
import { emptyData } from './storage'
import {
  comboToRow,
  customToRow,
  diffData,
  hasChanges,
  productToRow,
  rowToCombo,
  rowToCustom,
  rowToProduct,
  rowToWish,
  wishToRow,
} from './sync'
import type { AppData, CustomTaxonomyItem, LipCombo, Product, WishItem } from './types'

const USER = '00000000-0000-0000-0000-000000000001'

function product(overrides: Partial<Product> = {}): Product {
  return { ...emptyProduct('2026-01-01T00:00:00.000Z'), name: 'Prodotto', ...overrides }
}

describe('row mapping', () => {
  it('round-trips a full product', () => {
    const p = product({
      id: 'p1',
      brand: 'Nabla',
      name: '#05',
      categoryId: 'makeup',
      subcategoryId: 'mu-labbra',
      typeId: LIP_LINER_TYPE,
      zones: ['labbra'],
      openedDate: '2026-10-01',
      paoMonths: 12,
      expiryDate: '2028-10-01',
      rating: 5,
      favorite: true,
      notes: 'La mia preferita',
      photo: `${USER}/p1-abc.jpg`,
    })
    const row = productToRow(p, USER)
    expect(row).toMatchObject({ user_id: USER, type_id: LIP_LINER_TYPE, rating: 5, photo: p.photo })
    expect(rowToProduct(row)).toEqual(p)
  })

  it('round-trips wishes and combos', () => {
    const w: WishItem = {
      id: 'w1',
      name: 'Soft Pinch',
      brand: 'Rare Beauty',
      categoryId: 'makeup',
      subcategoryId: 'mu-viso',
      typeId: 'mu-viso/blush',
      note: 'Colore Hope',
      createdAt: '2026-11-01T10:00:00.000Z',
    }
    expect(rowToWish(wishToRow(w, USER))).toEqual(w)
    const c: LipCombo = {
      id: 'c1',
      name: 'Nude serale',
      productIds: ['a', 'b'],
      favorite: true,
      note: 'Per le occasioni',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    }
    expect(rowToCombo(comboToRow(c, USER))).toEqual(c)
  })
})

describe('diffData', () => {
  const base: AppData = {
    ...emptyData(),
    products: [
      product({ id: 'l', categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: LIP_LINER_TYPE, zones: ['labbra'] }),
      product({ id: 'r', categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: 'mu-labbra/rossetti', zones: ['labbra'] }),
    ],
  }

  it('finds nothing to do on identical data', () => {
    expect(hasChanges(diffData(base, base))).toBe(false)
    expect(hasChanges(diffData(base, structuredClone(base)))).toBe(false)
  })

  it('upserts both sides of a new pairing', () => {
    const next = reducer(base, { type: 'product/pairings', id: 'l', pairings: ['r'] })
    expect(diffData(base, next).upsertProducts.map((p) => p.id).sort()).toEqual(['l', 'r'])
  })

  it('tracks combos and cascades product deletion', () => {
    const linked = reducer(base, { type: 'product/pairings', id: 'l', pairings: ['r'] })
    const withCombo = reducer(linked, {
      type: 'combo/save',
      combo: { id: 'c', name: '', productIds: ['l', 'r'], favorite: false, note: '', createdAt: '', updatedAt: '' },
    })
    expect(diffData(linked, withCombo).upsertCombos.map((c) => c.id)).toEqual(['c'])
    const deleted = reducer(withCombo, { type: 'product/delete', id: 'r' })
    const c = diffData(withCombo, deleted)
    expect(c.deleteProductIds).toEqual(['r'])
    expect(c.deleteComboIds).toEqual(['c'])
    expect(c.upsertProducts.map((p) => p.id)).toEqual(['l'])
  })

  it('tracks wishlist changes', () => {
    const item: WishItem = { id: 'w', name: 'Mascara', brand: '', categoryId: '', subcategoryId: '', typeId: null, note: '', createdAt: '' }
    const next = reducer(base, { type: 'wish/save', item })
    expect(diffData(base, next).upsertWishes.map((w) => w.name)).toEqual(['Mascara'])
    expect(diffData(next, reducer(next, { type: 'wish/delete', id: 'w' })).deleteWishIds).toEqual(['w'])
  })
})

describe('catalogo personale', () => {
  const item: CustomTaxonomyItem = {
    id: 'u-unghie',
    level: 'category',
    parentId: '',
    name: 'Unghie',
    icon: 'nail-polish',
    createdAt: '2026-11-09T10:00:00.000Z',
  }

  it('round-trips a custom item and rejects invalid rows', () => {
    expect(rowToCustom(customToRow(item, USER))).toEqual(item)
    expect(rowToCustom({ ...customToRow(item, USER), id: 'skincare' })).toBeNull()
    expect(rowToCustom({ ...customToRow(item, USER), icon: 'sconosciuta' })?.icon).toBe('toiletry-bag')
  })

  it('upserts new items and deletes removed ones', () => {
    const next = reducer(emptyData(), { type: 'taxonomy/save', item })
    expect(diffData(emptyData(), next).upsertCustom.map((i) => i.id)).toEqual(['u-unghie'])
    const removed = reducer(next, { type: 'taxonomy/delete', id: 'u-unghie' })
    expect(diffData(next, removed).deleteCustomIds).toEqual(['u-unghie'])
  })
})
