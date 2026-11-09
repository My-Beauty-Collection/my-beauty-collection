import { defaultZones, LIP_LINER_TYPE } from './taxonomy'
import { addDays } from '../lib/dates'
import { emptyProduct, newId } from '../lib/products'
import type { LipCombo, Product, WishItem } from '../lib/types'

type Seed = Partial<Product> & Pick<Product, 'name' | 'brand' | 'categoryId'>

/** Prodotti di esempio con date relative a oggi: qualcuno ha il PAO superato o è scaduto. */
export function demoData(today: string): { products: Product[]; wishlist: WishItem[]; combos: LipCombo[] } {
  const now = new Date().toISOString()
  const ago = (days: number) => addDays(today, -days)

  const make = (seed: Seed): Product => {
    const p: Product = { ...emptyProduct(now), ...seed, id: newId() }
    if (!seed.zones) p.zones = defaultZones(p.categoryId, p.subcategoryId)
    return p
  }

  const liner = make({
    brand: 'Nabla',
    name: 'Close-Up Lip Shaper #05',
    categoryId: 'makeup',
    subcategoryId: 'mu-labbra',
    typeId: LIP_LINER_TYPE,
    openedDate: ago(50),
    paoMonths: 24,
    rating: 5,
    favorite: true,
    notes: 'Nude rosato, perfetta per sfumare.',
  })
  const velvetTeddy = make({
    brand: 'MAC',
    name: 'Velvet Teddy',
    categoryId: 'makeup',
    subcategoryId: 'mu-labbra',
    typeId: 'mu-labbra/rossetti',
    openedDate: ago(60),
    paoMonths: 24,
    rating: 5,
    favorite: true,
  })
  const kikoGloss = make({
    brand: 'Kiko',
    name: '3D Hydra Lipgloss 20',
    categoryId: 'makeup',
    subcategoryId: 'mu-labbra',
    typeId: 'mu-labbra/gloss',
    openedDate: ago(30),
    paoMonths: 12,
    rating: 4,
  })
  const lipGlow = make({
    brand: 'Dior',
    name: 'Addict Lip Glow',
    categoryId: 'makeup',
    subcategoryId: 'mu-labbra',
    typeId: 'mu-labbra/balsami-colorati',
    openedDate: ago(300),
    paoMonths: 12,
    rating: 5,
  })

  const products = [
    liner,
    velvetTeddy,
    kikoGloss,
    lipGlow,
    make({
      brand: 'Bioderma',
      name: 'Sensibio H2O',
      categoryId: 'skincare',
      subcategoryId: 'struccanti',
      openedDate: ago(40),
      paoMonths: 6,
      rating: 5,
      favorite: true,
    }),
    make({
      brand: 'La Roche-Posay',
      name: 'Effaclar Gel Detergente',
      categoryId: 'skincare',
      subcategoryId: 'detergenti',
      openedDate: ago(200),
      paoMonths: 6,
      rating: 3,
    }),
    make({
      brand: 'The Ordinary',
      name: 'Niacinamide 10% + Zinc 1%',
      categoryId: 'skincare',
      subcategoryId: 'sieri',
      openedDate: ago(100),
      paoMonths: 12,
      rating: 4,
    }),
    make({
      brand: 'CeraVe',
      name: 'Crema Idratante',
      categoryId: 'skincare',
      subcategoryId: 'creme',
      openedDate: ago(25),
      paoMonths: 12,
      rating: 4,
    }),
    make({
      brand: "Kiehl's",
      name: 'Creamy Eye Treatment with Avocado',
      categoryId: 'skincare',
      subcategoryId: 'contorno-occhi',
      expiryDate: addDays(today, 400),
    }),
    make({
      brand: 'NARS',
      name: 'Radiant Creamy Concealer',
      categoryId: 'makeup',
      subcategoryId: 'mu-viso',
      typeId: 'mu-viso/correttori',
      openedDate: ago(120),
      paoMonths: 12,
      rating: 5,
    }),
    make({
      brand: 'Maybelline',
      name: 'Lash Sensational Sky High',
      categoryId: 'makeup',
      subcategoryId: 'mu-occhi',
      typeId: 'mu-occhi/mascara',
      openedDate: ago(130),
      paoMonths: 3,
      rating: 4,
      notes: 'Il mascara va cambiato ogni 3 mesi.',
    }),
    make({
      brand: 'Benefit',
      name: 'Gimme Brow+ 3',
      categoryId: 'makeup',
      subcategoryId: 'mu-sopracciglia',
      typeId: 'mu-sopracciglia/gel',
      openedDate: ago(60),
      paoMonths: 6,
      rating: 4,
    }),
    make({
      brand: 'La Roche-Posay',
      name: 'Anthelios UVMune 400 SPF50+',
      categoryId: 'solari',
      subcategoryId: 'solari-viso',
      expiryDate: ago(20),
      notes: "Avanzato dall'estate scorsa.",
    }),
    make({
      brand: 'Olaplex',
      name: 'No.3 Hair Perfector',
      categoryId: 'capelli',
      subcategoryId: 'trattamenti-capelli',
      openedDate: ago(45),
      paoMonths: 12,
      rating: 4,
    }),
    // Prodotto multiuso: una sola scheda, più zone d'uso.
    make({
      brand: 'Nuxe',
      name: 'Huile Prodigieuse',
      categoryId: 'corpo',
      subcategoryId: 'oli-corpo',
      zones: ['viso', 'corpo', 'capelli'],
      openedDate: ago(90),
      paoMonths: 12,
      rating: 5,
      favorite: true,
    }),
    make({
      brand: 'Chanel',
      name: 'Chance Eau Tendre',
      categoryId: 'profumi',
      subcategoryId: '',
      openedDate: ago(400),
      paoMonths: 36,
      rating: 5,
    }),
  ]

  // Abbinamenti decisi dall'utente: la matita con tre prodotti labbra (relazione reciproca).
  const partners = [velvetTeddy, kikoGloss, lipGlow]
  liner.pairings = partners.map((p) => p.id)
  for (const p of partners) p.pairings = [liner.id]

  const combos: LipCombo[] = [
    {
      id: newId(),
      name: 'Nude quotidiano',
      productIds: [liner.id, velvetTeddy.id, kikoGloss.id],
      favorite: true,
      note: 'Matita sfumata, rossetto al centro e un velo di gloss.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      name: '',
      productIds: [liner.id, lipGlow.id],
      favorite: false,
      note: '',
      createdAt: now,
      updatedAt: now,
    },
  ]

  const wish = (fields: Partial<WishItem> & Pick<WishItem, 'name'>): WishItem => ({
    id: newId(),
    brand: '',
    categoryId: '',
    subcategoryId: '',
    typeId: null,
    note: '',
    createdAt: now,
    ...fields,
  })

  return {
    products,
    combos,
    wishlist: [
      wish({
        brand: 'Rare Beauty',
        name: 'Soft Pinch Liquid Blush',
        categoryId: 'makeup',
        subcategoryId: 'mu-viso',
        typeId: 'mu-viso/blush',
        note: 'Colore Hope',
      }),
      wish({ brand: "Paula's Choice", name: '2% BHA Liquid Exfoliant', categoryId: 'skincare', subcategoryId: 'esfolianti' }),
      wish({
        brand: 'Charlotte Tilbury',
        name: 'Lip Cheat Pillow Talk',
        categoryId: 'makeup',
        subcategoryId: 'mu-labbra',
        typeId: LIP_LINER_TYPE,
      }),
    ],
  }
}
