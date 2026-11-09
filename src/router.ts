import { useEffect, useRef, useState } from 'react'

export interface ProductPrefill {
  categoryId?: string
  subcategoryId?: string
  typeId?: string
  /** Desiderio da spostare nell'inventario. */
  wishId?: string
}

export type ProductTab = 'dettagli' | 'abbinamenti' | 'info'
const PRODUCT_TABS: ProductTab[] = ['dettagli', 'abbinamenti', 'info']

export type Route =
  | { name: 'home' }
  | { name: 'inventory' }
  /** `tab`: sottocategoria mostrata nelle schede (Make-up). */
  | { name: 'category'; categoryId: string; tab: string | null }
  | { name: 'subcategory'; categoryId: string; subcategoryId: string; typeId: string | null }
  | { name: 'product'; id: string; tab: ProductTab }
  | { name: 'product-new'; prefill: ProductPrefill }
  | { name: 'product-edit'; id: string }
  | { name: 'product-pairings'; id: string }
  | { name: 'combo-new'; linerId: string }
  | { name: 'combos' }
  | { name: 'combo'; id: string }
  | { name: 'wishlist' }
  | { name: 'warnings' }
  | { name: 'settings' }

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const params = new URLSearchParams(query)
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)

  switch (parts[0]) {
    case 'inventario':
      if (parts[2]) {
        return { name: 'subcategory', categoryId: parts[1], subcategoryId: parts[2], typeId: params.get('tipo') }
      }
      if (parts[1]) return { name: 'category', categoryId: parts[1], tab: params.get('sub') }
      return { name: 'inventory' }
    case 'prodotto':
      if (parts[1] === 'nuovo') {
        return {
          name: 'product-new',
          prefill: {
            categoryId: params.get('cat') ?? undefined,
            subcategoryId: params.get('sub') ?? undefined,
            typeId: params.get('tipo') ?? undefined,
            wishId: params.get('wish') ?? undefined,
          },
        }
      }
      if (parts[1] && parts[2] === 'modifica') return { name: 'product-edit', id: parts[1] }
      if (parts[1] && parts[2] === 'abbinamenti') return { name: 'product-pairings', id: parts[1] }
      if (parts[1] && parts[2] === 'combo') return { name: 'combo-new', linerId: parts[1] }
      if (parts[1]) {
        const tab = params.get('scheda') as ProductTab | null
        return { name: 'product', id: parts[1], tab: tab && PRODUCT_TABS.includes(tab) ? tab : 'dettagli' }
      }
      return { name: 'inventory' }
    case 'combo':
      return parts[1] ? { name: 'combo', id: parts[1] } : { name: 'combos' }
    case 'wishlist':
      return { name: 'wishlist' }
    case 'avvisi':
      return { name: 'warnings' }
    case 'impostazioni':
      return { name: 'settings' }
    default:
      return { name: 'home' }
  }
}

const enc = encodeURIComponent

export const paths = {
  home: '#/',
  inventory: '#/inventario',
  category: (categoryId: string, tab?: string | null) =>
    `#/inventario/${enc(categoryId)}${tab ? `?sub=${enc(tab)}` : ''}`,
  subcategory: (categoryId: string, subcategoryId: string, typeId?: string | null) =>
    `#/inventario/${enc(categoryId)}/${enc(subcategoryId)}${typeId ? `?tipo=${enc(typeId)}` : ''}`,
  product: (id: string, tab: ProductTab = 'dettagli') =>
    `#/prodotto/${enc(id)}${tab === 'dettagli' ? '' : `?scheda=${tab}`}`,
  productEdit: (id: string) => `#/prodotto/${enc(id)}/modifica`,
  productPairings: (id: string) => `#/prodotto/${enc(id)}/abbinamenti`,
  comboNew: (linerId: string) => `#/prodotto/${enc(linerId)}/combo`,
  productNew: (prefill: ProductPrefill = {}) => {
    const params = new URLSearchParams()
    if (prefill.categoryId) params.set('cat', prefill.categoryId)
    if (prefill.subcategoryId) params.set('sub', prefill.subcategoryId)
    if (prefill.typeId) params.set('tipo', prefill.typeId)
    if (prefill.wishId) params.set('wish', prefill.wishId)
    const query = params.toString()
    return `#/prodotto/nuovo${query ? `?${query}` : ''}`
  },
  combos: '#/combo',
  combo: (id: string) => `#/combo/${enc(id)}`,
  wishlist: '#/wishlist',
  warnings: '#/avvisi',
  settings: '#/impostazioni',
}

/**
 * Navigazione interna. Le voci aggiunte alla cronologia sono marcate `inApp`, così `goBack`
 * sa se la pagina precedente è dell'app (e non manda mai l'utente fuori dal sito).
 */
export function navigate(hash: string, { replace = false } = {}): void {
  if (location.hash === hash || (hash === paths.home && !location.hash)) return
  if (replace) {
    history.replaceState({ inApp: history.state?.inApp === true }, '', hash)
  } else {
    history.pushState({ inApp: true }, '', hash)
  }
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}

/** Torna alla pagina precedente dell'app, oppure al fallback se si è entrati direttamente qui. */
export function goBack(fallback: string = paths.home): void {
  if (history.state?.inApp === true) {
    history.back()
  } else {
    navigate(fallback, { replace: true })
  }
}

/** Identifica la pagina a meno delle schede (`tab`). */
function pageKey(route: Route): string {
  switch (route.name) {
    case 'category':
      return `category/${route.categoryId}`
    case 'product':
      return `product/${route.id}`
    default:
      return JSON.stringify(route)
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash))
  const current = useRef(route)
  useEffect(() => {
    const onChange = () => {
      const prev = current.current
      const next = parseHash(location.hash)
      // Cambiare solo una scheda della stessa pagina non la riporta in cima.
      if (pageKey(prev) !== pageKey(next)) window.scrollTo(0, 0)
      current.current = next
      setRoute(next)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
