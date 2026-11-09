import { afterEach, describe, expect, it } from 'vitest'
import {
  activateTaxonomy,
  allCategories,
  CATEGORIES,
  defaultZones,
  LIP_LINER_TYPE,
  migrateTaxonomy,
  needsSubcategory,
  Taxonomy,
  ZONES,
} from '../data/taxonomy'
import { addDays, addMonths, daysBetween, isIsoDate } from './dates'
import {
  canPair,
  comboTitle,
  computeWarnings,
  emptyProduct,
  matchesSearch,
  normalizeCombos,
  normalizePairings,
  pairingCandidates,
  paoEnd,
  productWarning,
  removeProduct,
  syncPairings,
} from './products'
import { reducer } from './reducer'
import { emptyData, loadData, parseData, saveData, STORAGE_KEY } from './storage'
import type { CustomTaxonomyItem, LipCombo, Product } from './types'

const TODAY = '2026-11-09'

function product(overrides: Partial<Product> = {}): Product {
  return { ...emptyProduct('2026-01-01T00:00:00.000Z'), name: 'Prodotto', ...overrides }
}

const liner = (id: string, extra: Partial<Product> = {}) =>
  product({ id, categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: LIP_LINER_TYPE, zones: ['labbra'], ...extra })
const lipstick = (id: string, extra: Partial<Product> = {}) =>
  product({ id, categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: 'mu-labbra/rossetti', zones: ['labbra'], ...extra })
const serum = (id: string) => product({ id, categoryId: 'skincare', subcategoryId: 'sieri', zones: ['viso'] })

function combo(id: string, productIds: string[], extra: Partial<LipCombo> = {}): LipCombo {
  return { id, name: '', productIds, favorite: false, note: '', createdAt: '', updatedAt: '', ...extra }
}

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

describe('dates', () => {
  it('counts days across month and DST boundaries', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('adds months clamping to the end of month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-11-10', 12)).toBe('2027-11-10')
  })

  it('validates ISO dates', () => {
    expect(isIsoDate('2026-02-28')).toBe(true)
    expect(isIsoDate('2026-02-30')).toBe(false)
    expect(isIsoDate('10/11/2026')).toBe(false)
  })
})

describe('taxonomy', () => {
  it('has the six macro-categories of the requirements', () => {
    expect(CATEGORIES.map((c) => c.name)).toEqual(['Skincare', 'Make-up', 'Solari', 'Capelli', 'Corpo', 'Profumi'])
  })

  it('matches the required subcategories', () => {
    const subs = (id: string) => CATEGORIES.find((c) => c.id === id)!.subcategories.map((s) => s.name)
    expect(subs('skincare')).toEqual([
      'Struccanti',
      'Detergenti',
      'Sieri e trattamenti',
      'Creme',
      'Contorno occhi',
      'Oli',
      'Maschere',
      'Scrub / Esfolianti',
    ])
    expect(subs('makeup')).toEqual(['Viso', 'Occhi', 'Labbra', 'Sopracciglia'])
    expect(subs('solari')).toEqual(['Viso', 'Corpo', 'Capelli', 'Labbra', 'Doposole'])
    expect(subs('capelli')).toEqual(['Shampoo', 'Balsamo', 'Maschere', 'Trattamenti', 'Oli', 'Styling'])
    expect(subs('corpo')).toEqual(['Detergenti', 'Creme', 'Oli', 'Scrub / Esfolianti', 'Trattamenti'])
    expect(subs('profumi')).toEqual([])
    expect(needsSubcategory('profumi')).toBe(false)
  })

  it('has make-up types only, with lip liners in Labbra', () => {
    for (const c of CATEGORIES) {
      for (const s of c.subcategories) expect(s.types.length > 0).toBe(c.id === 'makeup')
    }
    const lips = CATEGORIES.find((c) => c.id === 'makeup')!.subcategories.find((s) => s.id === 'mu-labbra')!
    expect(lips.types.map((t) => t.name)).toEqual([
      'Matite labbra',
      'Rossetti',
      'Gloss',
      'Lip Oil',
      'Tinte labbra',
      'Balsami colorati',
    ])
    expect(lips.types[0].id).toBe(LIP_LINER_TYPE)
  })

  it('has unique ids and known zones', () => {
    const ids = CATEGORIES.flatMap((c) => [c.id, ...c.subcategories.flatMap((s) => [s.id, ...s.types.map((t) => t.id)])])
    expect(new Set(ids).size).toBe(ids.length)
    const zones = new Set(ZONES.map((z) => z.id))
    for (const c of CATEGORIES) for (const z of [...c.zones, ...c.subcategories.flatMap((s) => s.zones)]) expect(zones.has(z)).toBe(true)
    expect(defaultZones('skincare', 'contorno-occhi')).toEqual(['occhi'])
    expect(defaultZones('profumi', '')).toEqual(['corpo'])
  })

  it('migrates first-version references', () => {
    expect(migrateTaxonomy({ categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: 'mu-labbra/matita-labbra' })).toEqual({
      categoryId: 'makeup',
      subcategoryId: 'mu-labbra',
      typeId: LIP_LINER_TYPE,
    })
    expect(
      migrateTaxonomy({ categoryId: 'skincare', subcategoryId: 'detergenti', typeId: 'detergenti/acqua-micellare' }),
    ).toEqual({ categoryId: 'skincare', subcategoryId: 'struccanti', typeId: null })
    expect(migrateTaxonomy({ categoryId: 'profumi', subcategoryId: 'fragranze', typeId: 'fragranze/eau-de-parfum' })).toEqual({
      categoryId: 'profumi',
      subcategoryId: '',
      typeId: null,
    })
    expect(migrateTaxonomy({ categoryId: 'skincare', subcategoryId: 'tonici', typeId: null }).subcategoryId).toBe('')
  })
})

describe('PAO e scadenze', () => {
  it('calculates the PAO end date (example of the requirements)', () => {
    expect(paoEnd(product({ openedDate: '2026-11-10', paoMonths: 12 }))).toBe('2027-11-10')
    expect(paoEnd(product({ paoMonths: 12 }))).toBeNull()
  })

  it('warns only once the limit has passed, never before', () => {
    const paoDay = product({ openedDate: addMonths(addDays(TODAY, 0), -6), paoMonths: 6 })
    expect(paoEnd(paoDay)).toBe(TODAY)
    expect(productWarning(paoDay, TODAY)).toBeNull()
    expect(productWarning(paoDay, addDays(TODAY, 1))?.paoExceeded).toBe(TODAY)

    expect(productWarning(product({ expiryDate: addDays(TODAY, 3) }), TODAY)).toBeNull()
    expect(productWarning(product({ expiryDate: TODAY }), TODAY)).toBeNull()
    expect(productWarning(product({ expiryDate: addDays(TODAY, -1) }), TODAY)?.expired).toBe(addDays(TODAY, -1))
  })

  it('reports both reasons and sorts by the oldest exceeded limit', () => {
    const both = product({ id: 'both', openedDate: '2025-01-01', paoMonths: 6, expiryDate: '2026-01-01' })
    const recent = product({ id: 'recent', expiryDate: addDays(TODAY, -2) })
    const fine = product({ id: 'fine', openedDate: TODAY, paoMonths: 12 })
    const warnings = computeWarnings([recent, fine, both], TODAY)
    expect(warnings.map((w) => w.product.id)).toEqual(['both', 'recent'])
    expect(warnings[0]).toMatchObject({ paoExceeded: '2025-07-01', expired: '2026-01-01' })
  })
})

describe('abbinamenti labbra', () => {
  it('only links a lip liner to lip products', () => {
    expect(canPair(liner('l'), lipstick('r'))).toBe(true)
    expect(canPair(lipstick('r'), liner('l'))).toBe(true)
    expect(canPair(liner('l'), serum('s'))).toBe(false)
    expect(canPair(lipstick('a'), lipstick('b'))).toBe(false)
    // prodotto multiuso con zona labbra (es. balsamo SPF dei Solari)
    expect(canPair(liner('l'), product({ id: 'spf', categoryId: 'solari', subcategoryId: 'solari-labbra', zones: ['labbra'] }))).toBe(true)
  })

  it('lists candidates for a liner', () => {
    const all = [liner('l'), lipstick('r'), serum('s'), liner('l2')]
    expect(pairingCandidates(all, 'l').map((p) => p.id)).toEqual(['r', 'l2'])
  })

  it('keeps pairings symmetric and drops invalid ones', () => {
    const linked = syncPairings([liner('l'), lipstick('r'), lipstick('g')], 'l', ['r', 'g'])
    expect(linked.find((p) => p.id === 'g')!.pairings).toEqual(['l'])
    const normalized = normalizePairings([liner('l', { pairings: ['r', 's'] }), lipstick('r'), serum('s', )])
    expect(normalized.find((p) => p.id === 'l')!.pairings).toEqual(['r'])
    expect(normalized.find((p) => p.id === 'r')!.pairings).toEqual(['l'])
  })

  it('cleans up pairings when a product is deleted', () => {
    const linked = syncPairings([liner('l'), lipstick('r')], 'l', ['r'])
    expect(removeProduct(linked, 'r')[0].pairings).toEqual([])
  })
})

describe('Lip Combo', () => {
  const products = [liner('l', { brand: 'Nabla', name: '#05' }), lipstick('r', { brand: 'MAC', name: 'Velvet Teddy' })]

  it('uses the name or the products as title', () => {
    expect(comboTitle(combo('c', ['l', 'r']), products)).toBe('Nabla #05 + MAC Velvet Teddy')
    expect(comboTitle(combo('c', ['l', 'r'], { name: ' Nude serale ' }), products)).toBe('Nude serale')
  })

  it('needs at least two existing products', () => {
    const combos = normalizeCombos([combo('a', ['l', 'r', 'r']), combo('b', ['l', 'ghost'])], products)
    expect(combos.map((c) => [c.id, c.productIds])).toEqual([['a', ['l', 'r']]])
  })

  it('is not created when saving pairings, and loses deleted products', () => {
    let state = { ...emptyData(), products: [liner('l'), lipstick('r'), lipstick('g')] }
    state = reducer(state, { type: 'product/pairings', id: 'l', pairings: ['r', 'g'] })
    expect(state.combos).toEqual([])
    state = reducer(state, { type: 'combo/save', combo: combo('c1', ['l', 'r', 'g']) })
    state = reducer(state, { type: 'combo/save', combo: combo('c2', ['l', 'r']) })
    state = reducer(state, { type: 'product/delete', id: 'r' })
    expect(state.combos.map((c) => [c.id, c.productIds])).toEqual([['c1', ['l', 'g']]])
  })
})

describe('reducer: wishlist', () => {
  it('saves trimmed items and ignores empty names', () => {
    const item = { id: 'w', name: '  Soft Pinch ', brand: ' Rare Beauty ', categoryId: 'makeup', subcategoryId: 'mu-viso', typeId: null, note: '', createdAt: '' }
    let state = reducer(emptyData(), { type: 'wish/save', item })
    state = reducer(state, { type: 'wish/save', item: { ...item, id: 'x', name: ' ' } })
    expect(state.wishlist.map((w) => [w.name, w.brand])).toEqual([['Soft Pinch', 'Rare Beauty']])
    expect(reducer(state, { type: 'wish/delete', id: 'w' }).wishlist).toEqual([])
  })
})

describe('storage', () => {
  it('round-trips data', () => {
    const storage = new MemoryStorage()
    const data = { ...emptyData(), products: [product({ id: 'a', rating: 4, photo: 'data:image/jpeg;base64,xx' })] }
    saveData(data, storage)
    expect(loadData(storage)).toEqual(data)
  })

  it('migrates a first-version backup', () => {
    const data = parseData(
      JSON.stringify({
        version: 1,
        products: [
          {
            id: 'l',
            name: '#05',
            brand: 'Nabla',
            categoryId: 'makeup',
            subcategoryId: 'mu-labbra',
            typeId: 'mu-labbra/matita-labbra',
            zones: ['labbra', 'mani'],
            shade: 'nude',
            price: 12,
            finishedDate: null,
            pairings: ['r', 's'],
            pairingIdeas: ['gloss'],
          },
          { id: 'r', name: 'Velvet Teddy', categoryId: 'makeup', subcategoryId: 'mu-labbra', typeId: 'mu-labbra/rossetto', zones: ['labbra'] },
          { id: 's', name: 'Siero', categoryId: 'skincare', subcategoryId: 'sieri', pairings: ['l'], rating: 9 },
        ],
        wishlist: [{ id: 'w1', text: 'Blush' }, { id: 'w2', text: 'Preso', bought: true }],
        settings: { openedDaysThreshold: 60 },
      }),
    )
    const [l, r, s] = data.products
    expect(l).toMatchObject({ typeId: LIP_LINER_TYPE, zones: ['labbra'], pairings: ['r'] })
    expect(l).not.toHaveProperty('shade')
    expect(r.typeId).toBe('mu-labbra/rossetti')
    expect(s).toMatchObject({ pairings: [], rating: null })
    expect(data.wishlist.map((w) => [w.id, w.name])).toEqual([['w1', 'Blush']])
    expect(data.combos).toEqual([])
    expect(data).not.toHaveProperty('settings')
  })

  it('rejects files that are not a backup', () => {
    expect(() => parseData('{"foo": 1}')).toThrow()
    expect(() => parseData('non json')).toThrow()
  })

  it('keeps corrupted data aside instead of losing it', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{rotto')
    expect(loadData(storage)).toEqual(emptyData())
    expect(storage.length).toBe(2)
  })
})

describe('search', () => {
  it('matches every word across name, brand and category path', () => {
    const p = liner('l', { brand: 'Nabla', name: '#05' })
    expect(matchesSearch(p, 'nabla matite')).toBe(true)
    expect(matchesSearch(p, 'labbra')).toBe(true)
    expect(matchesSearch(p, 'mascara')).toBe(false)
  })
})

// ---------- Catalogo personale ----------

describe('catalogo personale', () => {
  const item = (id: string, level: CustomTaxonomyItem['level'], parentId: string, name: string): CustomTaxonomyItem => ({
    id,
    level,
    parentId,
    name,
    icon: 'nail-polish',
    createdAt: '2026-11-09T10:00:00.000Z',
  })
  const custom = [
    item('u-unghie', 'category', '', 'Unghie'),
    item('u-smalti', 'subcategory', 'u-unghie', 'Smalti'),
    item('u-tonici', 'subcategory', 'skincare', 'Tonici'),
    item('u-kajal', 'type', 'mu-occhi', 'Matite kajal'),
    item('u-tipo-skincare', 'type', 'u-tonici', 'Non ammessa'),
    item('u-orfana', 'subcategory', 'u-inesistente', 'Orfana'),
  ]

  afterEach(() => {
    activateTaxonomy([])
  })

  it('aggiunge le voci personali dopo le predefinite, che restano uguali', () => {
    const tx = new Taxonomy(custom)
    expect(tx.categories.map((c) => c.name)).toEqual([...CATEGORIES.map((c) => c.name), 'Unghie'])
    expect(tx.getCategory('u-unghie')?.subcategories.map((s) => s.name)).toEqual(['Smalti'])
    expect(tx.getCategory('skincare')?.subcategories.at(-1)).toMatchObject({ id: 'u-tonici', zones: ['viso'], custom: true })
    expect(tx.subcategoryOf('u-kajal')?.id).toBe('mu-occhi')
    // Tipologie solo dove la categoria le prevede (Make-up); le voci orfane non compaiono.
    expect(tx.getProductType('u-tipo-skincare')).toBeUndefined()
    expect(tx.has(custom[4])).toBe(false)
    expect(tx.has(custom[5])).toBe(false)
    // Le predefinite non vengono toccate.
    expect(CATEGORIES.find((c) => c.id === 'skincare')!.subcategories.some((s) => s.id === 'u-tonici')).toBe(false)
  })

  it('attiva il catalogo per ricerche, sottocategorie obbligatorie e ricerca testuale', () => {
    expect(needsSubcategory('u-unghie')).toBe(false)
    activateTaxonomy(custom)
    expect(allCategories().at(-1)?.name).toBe('Unghie')
    expect(needsSubcategory('u-unghie')).toBe(true)
    expect(defaultZones('skincare', 'u-tonici')).toEqual(['viso'])
    expect(matchesSearch(product({ categoryId: 'u-unghie', subcategoryId: 'u-smalti' }), 'smalti')).toBe(true)
  })

  it('migrateTaxonomy lascia le voci personali, assembleData toglie quelle inesistenti', () => {
    expect(migrateTaxonomy({ categoryId: 'skincare', subcategoryId: 'u-tonici', typeId: null }).subcategoryId).toBe('u-tonici')
    expect(migrateTaxonomy({ categoryId: 'u-unghie', subcategoryId: 'creme', typeId: null }).subcategoryId).toBe('')
    const json = JSON.stringify({
      products: [
        product({ id: 'a', categoryId: 'skincare', subcategoryId: 'u-tonici' }),
        product({ id: 'b', categoryId: 'makeup', subcategoryId: 'mu-occhi', typeId: 'u-cancellata' }),
        product({ id: 'c', categoryId: 'u-unghie', subcategoryId: 'u-smalti' }),
      ],
      customTaxonomy: [...custom, { id: 'senza-prefisso', level: 'category', parentId: '', name: 'X' }],
    })
    const data = parseData(json)
    expect(data.products.map((p) => [p.subcategoryId, p.typeId])).toEqual([
      ['u-tonici', null],
      ['mu-occhi', null],
      ['u-smalti', null],
    ])
    expect(data.customTaxonomy.map((i) => i.id)).toEqual(['u-unghie', 'u-smalti', 'u-tonici', 'u-kajal'])
    // I backup senza catalogo personale restano validi.
    expect(parseData(JSON.stringify({ products: [] })).customTaxonomy).toEqual([])
  })

  it('eliminando una voce i prodotti passano al livello superiore', () => {
    const state = {
      ...emptyData(),
      customTaxonomy: custom.slice(0, 4),
      products: [
        product({ id: 'smalto', categoryId: 'u-unghie', subcategoryId: 'u-smalti' }),
        product({ id: 'tonico', categoryId: 'skincare', subcategoryId: 'u-tonici' }),
        product({ id: 'kajal', categoryId: 'makeup', subcategoryId: 'mu-occhi', typeId: 'u-kajal' }),
      ],
      wishlist: [
        { id: 'w', name: 'Top coat', brand: '', categoryId: 'u-unghie', subcategoryId: 'u-smalti', typeId: null, note: '', createdAt: '' },
      ],
    }
    const noNails = reducer(state, { type: 'taxonomy/delete', id: 'u-unghie' })
    expect(noNails.customTaxonomy.map((i) => i.id)).toEqual(['u-tonici', 'u-kajal'])
    expect(noNails.products[0]).toMatchObject({ categoryId: '', subcategoryId: '' })
    expect(noNails.products[0].updatedAt).not.toBe(state.products[0].updatedAt)
    expect(noNails.products[1]).toBe(state.products[1])
    expect(noNails.wishlist[0]).toMatchObject({ categoryId: '', subcategoryId: '' })

    const noToners = reducer(state, { type: 'taxonomy/delete', id: 'u-tonici' })
    expect(noToners.products[1]).toMatchObject({ categoryId: 'skincare', subcategoryId: '' })
    const noKajal = reducer(state, { type: 'taxonomy/delete', id: 'u-kajal' })
    expect(noKajal.products[2]).toMatchObject({ subcategoryId: 'mu-occhi', typeId: null })
  })

  it('salva e rinomina una voce personale', () => {
    let state = reducer(emptyData(), { type: 'taxonomy/save', item: item('u-x', 'category', '', '  Igiene  ') })
    expect(state.customTaxonomy).toMatchObject([{ id: 'u-x', name: 'Igiene' }])
    state = reducer(state, { type: 'taxonomy/save', item: { ...state.customTaxonomy[0], name: 'Igiene orale' } })
    expect(state.customTaxonomy.map((i) => i.name)).toEqual(['Igiene orale'])
    expect(reducer(state, { type: 'taxonomy/save', item: item('u-y', 'category', '', '   ') })).toBe(state)
  })
})
