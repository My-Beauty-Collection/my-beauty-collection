import type { BeautyIconName } from '../components/beauty-icons'
import type { ZoneId } from '../data/taxonomy'

/** Scheda prodotto essenziale (requisiti §5). */
export interface Product {
  id: string
  name: string
  brand: string
  categoryId: string
  /** Vuoto per le categorie senza sottocategorie (Profumi). */
  subcategoryId: string
  /** Tipologia, prevista solo per il Make-up. */
  typeId: string | null
  /** Zone d'uso: più di una per i prodotti multiuso. */
  zones: ZoneId[]
  openedDate: string | null
  /** Period After Opening, in mesi (6M, 12M…). */
  paoMonths: number | null
  /** Scadenza riportata sulla confezione, se presente. */
  expiryDate: string | null
  /** Valutazione da 1 a 5 stelle (null = non valutato). */
  rating: number | null
  favorite: boolean
  notes: string
  /** Foto: percorso su Supabase Storage oppure data URL (modalità locale). */
  photo: string | null
  /**
   * Abbinamenti labbra decisi dall'utente: tra una matita labbra e altri prodotti labbra.
   * Relazione simmetrica (se la matita sta con il rossetto, il rossetto sta con la matita).
   */
  pairings: string[]
  createdAt: string
  updatedAt: string
}

/** Prodotto desiderato, non ancora posseduto. I dati passano alla scheda quando lo si compra. */
export interface WishItem {
  id: string
  name: string
  brand: string
  categoryId: string
  subcategoryId: string
  typeId: string | null
  note: string
  createdAt: string
}

/** Combinazione precisa di due o più prodotti labbra usati insieme, salvata dall'utente. */
export interface LipCombo {
  id: string
  /** Facoltativo: se vuoto si mostra l'elenco dei prodotti. */
  name: string
  productIds: string[]
  favorite: boolean
  note: string
  createdAt: string
  updatedAt: string
}

export type CustomLevel = 'category' | 'subcategory' | 'type'

/**
 * Voce del catalogo aggiunta dall'utente (solo per sé): le predefinite restano uguali per tutti.
 * `parentId`: vuoto per una categoria, la categoria per una sottocategoria, la sottocategoria per una tipologia.
 */
export interface CustomTaxonomyItem {
  /** Sempre con il prefisso `u-`, per non confondersi con le voci predefinite. */
  id: string
  level: CustomLevel
  parentId: string
  name: string
  icon: BeautyIconName
  createdAt: string
}

export interface AppData {
  version: 2
  products: Product[]
  wishlist: WishItem[]
  combos: LipCombo[]
  /** Categorie, sottocategorie e tipologie personali. */
  customTaxonomy: CustomTaxonomyItem[]
}

export const PAO_OPTIONS = [3, 6, 9, 12, 18, 24, 36] as const
