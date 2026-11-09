import { Heart, Search, SearchX, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BeautyIcon } from '../components/BeautyIcon'
import { Chip, ChipRow, EmptyState, Link, PageHeader, Row, RowList, SegmentedTabs, Thumb } from '../components/common'
import { ProductRow } from '../components/ProductRow'
import { demoData } from '../data/demo'
import { CATEGORIES, getCategory, getProductType, getSubcategory, LIP_LINER_TYPE, OTHER_ICON } from '../data/taxonomy'
import { matchesSearch } from '../lib/products'
import type { Product } from '../lib/types'
import { navigate, paths } from '../router'
import { useStore } from '../store'

/** Pseudo-categoria per prodotti con una categoria non più esistente. */
export const OTHER_CATEGORY = '_altro'
/** Pseudo-sottocategoria (e pseudo-tipologia) per prodotti senza classificazione. */
export const NO_SUBCATEGORY = '_nessuna'

const byName = (a: Product, b: Product) => (a.brand || a.name).localeCompare(b.brand || b.name, 'it')
const known = new Set(CATEGORIES.map((c) => c.id))
const productsLabel = (n: number) => `${n} prodott${n === 1 ? 'o' : 'i'}`

function SearchField({
  value,
  onChange,
  placeholder = 'Cerca un prodotto...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative my-[5px] mb-3">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label="Cerca"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-[11px] border border-input bg-card pr-10 pl-10 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-[15px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Cancella ricerca"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function FavoritesChip({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <Chip on={on} onClick={onToggle}>
      <Heart className={cn('size-3.5', on && 'fill-current')} /> Preferiti
    </Chip>
  )
}

function ProductRows({ products, emptyText }: { products: Product[]; emptyText?: string }) {
  const { today } = useStore()
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchX />}
        title={emptyText ?? 'Nessun prodotto qui'}
        description="Aggiungilo con il pulsante + in basso."
      />
    )
  }
  return (
    <RowList>
      {products.map((p) => (
        <ProductRow key={p.id} product={p} today={today} />
      ))}
    </RowList>
  )
}

// ---------- Inventario: categorie ----------

export function InventoryHome({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  const { data, dispatch, today } = useStore()
  const { products } = data
  const [favorites, setFavorites] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of products) {
      const key = known.has(p.categoryId) ? p.categoryId : OTHER_CATEGORY
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [products])

  const listing = query.trim() !== '' || favorites
  const results = useMemo(
    () => products.filter((p) => (!favorites || p.favorite) && matchesSearch(p, query)).sort(byName),
    [products, favorites, query],
  )

  if (products.length === 0) {
    return (
      <>
        <PageHeader title="Inventario" />
        <EmptyState
          icon={<BeautyIcon name="toiletries" />}
          title="La tua collezione è vuota"
          description="Aggiungi i prodotti che possiedi, con PAO, valutazione e note."
        >
          <Button asChild size="lg">
            <Link to={paths.productNew()}>Aggiungi un prodotto</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => dispatch({ type: 'data/append', ...demoData(today) })}>
            Prova con dati di esempio
          </Button>
        </EmptyState>
      </>
    )
  }

  const rows = [
    ...CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    ...(counts.get(OTHER_CATEGORY) ? [{ id: OTHER_CATEGORY, name: 'Altro', icon: OTHER_ICON }] : []),
  ]

  return (
    <>
      <PageHeader title="Inventario" />
      <SearchField value={query} onChange={setQuery} />
      <ChipRow className="mt-0">
        <FavoritesChip on={favorites} onToggle={() => setFavorites((v) => !v)} />
      </ChipRow>

      {listing ? (
        <ProductRows products={results} emptyText="Nessun prodotto trovato" />
      ) : (
        <RowList>
          {rows.map((c) => (
            <Row
              key={c.id}
              to={paths.category(c.id)}
              media={<Thumb icon={c.icon} />}
              title={c.name}
              subtitle={productsLabel(counts.get(c.id) ?? 0)}
            />
          ))}
        </RowList>
      )}
    </>
  )
}

// ---------- Categoria: sottocategorie (Make-up: schede per zona e righe per tipologia) ----------

export function CategoryPage({ categoryId, tab }: { categoryId: string; tab: string | null }) {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const category = getCategory(categoryId)
  const inCategory = data.products.filter((p) =>
    categoryId === OTHER_CATEGORY ? !known.has(p.categoryId) : p.categoryId === categoryId,
  )

  // Profumi (nessuna sottocategoria) e "Altro": direttamente la lista dei prodotti.
  if (!category || category.subcategories.length === 0) {
    const visible = inCategory.filter((p) => matchesSearch(p, query)).sort(byName)
    return (
      <>
        <PageHeader back={paths.inventory} title={category?.name ?? 'Altro'} />
        {!category && (
          <p className="-mt-2 mb-3 text-[13px] text-muted-foreground">
            Prodotti di categorie non più previste: aprili e scegli una nuova categoria.
          </p>
        )}
        {inCategory.length > 5 && <SearchField value={query} onChange={setQuery} />}
        <ProductRows products={visible} />
      </>
    )
  }

  const withTypes = category.subcategories.some((s) => s.types.length > 0)
  const unsorted = inCategory.filter((p) => !p.subcategoryId).length

  // Categorie senza tipologie (Skincare, Solari…): una riga per sottocategoria.
  if (!withTypes) {
    return (
      <>
        <PageHeader back={paths.inventory} title={category.name} />
        <RowList>
          {category.subcategories.map((s) => (
            <Row
              key={s.id}
              to={paths.subcategory(category.id, s.id)}
              media={<Thumb icon={s.icon} />}
              title={s.name}
              subtitle={productsLabel(inCategory.filter((p) => p.subcategoryId === s.id).length)}
            />
          ))}
          {unsorted > 0 && (
            <Row
              to={paths.subcategory(category.id, NO_SUBCATEGORY)}
              media={<Thumb icon={category.icon} />}
              title="Senza sottocategoria"
              subtitle={productsLabel(unsorted)}
            />
          )}
        </RowList>
      </>
    )
  }

  // Make-up: schede Viso / Occhi / Labbra / Sopracciglia e, sotto, le tipologie.
  const active = category.subcategories.find((s) => s.id === tab) ?? category.subcategories[0]
  const inSub = inCategory.filter((p) => p.subcategoryId === active.id)
  const untyped = inSub.filter((p) => !getProductType(p.typeId)).length

  return (
    <>
      <PageHeader back={paths.inventory} title={category.name} />
      <SegmentedTabs
        ariaLabel="Zona"
        value={active.id}
        onChange={(sub) => navigate(paths.category(category.id, sub), { replace: true })}
        options={category.subcategories.map((s) => ({ value: s.id, label: s.name }))}
      />
      <RowList>
        {active.types.map((t) => (
          <Row
            key={t.id}
            to={paths.subcategory(category.id, active.id, t.id)}
            media={<Thumb icon={t.icon} />}
            title={t.name}
            subtitle={productsLabel(inSub.filter((p) => p.typeId === t.id).length)}
          />
        ))}
        {untyped > 0 && (
          <Row
            to={paths.subcategory(category.id, active.id, NO_SUBCATEGORY)}
            media={<Thumb icon={active.icon} />}
            title="Senza tipologia"
            subtitle={productsLabel(untyped)}
          />
        )}
      </RowList>
      {unsorted > 0 && (
        <Link
          to={paths.subcategory(category.id, NO_SUBCATEGORY)}
          className="mt-4 block text-center text-[13px] font-bold text-rose-ink"
        >
          {productsLabel(unsorted)} senza sottocategoria ›
        </Link>
      )}
    </>
  )
}

// ---------- Sottocategoria / tipologia: prodotti ----------

export function SubcategoryPage({
  categoryId,
  subcategoryId,
  typeId,
}: {
  categoryId: string
  subcategoryId: string
  typeId: string | null
}) {
  const { data } = useStore()
  const [favorites, setFavorites] = useState(false)
  const [query, setQuery] = useState('')
  const category = getCategory(categoryId)
  const subcategory = getSubcategory(subcategoryId)
  const type = getProductType(typeId)
  const untypedOnly = typeId === NO_SUBCATEGORY

  const inList = data.products.filter(
    (p) =>
      p.categoryId === categoryId &&
      (subcategoryId === NO_SUBCATEGORY ? !p.subcategoryId : p.subcategoryId === subcategoryId) &&
      (type ? p.typeId === type.id : untypedOnly ? !getProductType(p.typeId) : true),
  )
  const visible = inList.filter((p) => (!favorites || p.favorite) && matchesSearch(p, query)).sort(byName)

  const title = type?.name ?? (untypedOnly ? 'Senza tipologia' : (subcategory?.name ?? 'Senza sottocategoria'))
  const backTo = subcategory?.types.length ? paths.category(categoryId, subcategoryId) : paths.category(categoryId)

  return (
    <>
      <PageHeader back={backTo} title={title} />
      {(type || untypedOnly) && subcategory && (
        <p className="-mt-2 mb-3 text-[13px] text-muted-foreground">
          {category?.name} › {subcategory.name}
        </p>
      )}
      <SearchField value={query} onChange={setQuery} placeholder="Cerca..." />
      <ChipRow className="mt-0">
        <FavoritesChip on={favorites} onToggle={() => setFavorites((v) => !v)} />
      </ChipRow>

      {type?.id === LIP_LINER_TYPE && visible.length > 0 && (
        <p className="mb-2 text-[13px] text-muted-foreground">
          Apri una matita per salvare i suoi abbinamenti e creare le tue Lip Combo.
        </p>
      )}

      <ProductRows products={visible} emptyText={inList.length ? 'Nessun prodotto trovato' : undefined} />
    </>
  )
}
