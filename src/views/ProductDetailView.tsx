import { PackageOpen, Pencil, Plus, SearchX, Trash2, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { usePhotoUrl } from '@/lib/photos'
import { cn } from '@/lib/utils'
import {
  cardClass,
  Chip,
  ChipRow,
  EmptyState,
  Hero,
  Link,
  PageHeader,
  Row,
  RowList,
  SectionTitle,
} from '../components/common'
import { BeautyIcon } from '../components/BeautyIcon'
import { DeleteProductDialog } from '../components/DeleteProductDialog'
import { HeartButton, ProductRow } from '../components/ProductRow'
import { StarRating } from '../components/Stars'
import { getZone, taxonomyIcon } from '../data/taxonomy'
import { formatDate } from '../lib/dates'
import { comboTitle, isLipLiner, isLipProduct, paoEnd, productWarning, taxonomyPath } from '../lib/products'
import type { Product } from '../lib/types'
import { navigate, paths, type ProductTab } from '../router'
import { useStore } from '../store'

function Fact({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className={cn('text-right text-[15px]', strong ? 'font-bold' : 'font-medium')}>{children}</dd>
    </div>
  )
}

/** Foto del prodotto, oppure la grande icona della sua tipologia su un cerchio cipria. */
function Picture({ product }: { product: Product }) {
  const url = usePhotoUrl(product.photo, 'full')
  if (product.photo) {
    return (
      <div className="mb-4 aspect-[4/3] overflow-hidden rounded-[18px] bg-thumb shadow-card">
        {url && <img src={url} alt={product.name} className="size-full object-cover" />}
      </div>
    )
  }
  return (
    <div
      className="mx-auto mb-4 grid size-[104px] place-items-center rounded-full border border-ring/60 bg-thumb text-rose-ink"
      aria-hidden
    >
      <BeautyIcon name={taxonomyIcon(product)} className="size-14" />
    </div>
  )
}

/**
 * Apertura del prodotto: se non è ancora aperto, il pulsante rapido "Aperto oggi"
 * (senza passare dal modulo di modifica); altrimenti la data di apertura e la fine PAO.
 */
function OpenedCard({ product, today, onOpenToday }: { product: Product; today: string; onOpenToday: () => void }) {
  const end = paoEnd(product)
  return (
    <div className={cn(cardClass, 'mt-4 flex items-center gap-3 p-[13px]')}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-thumb text-rose-ink" aria-hidden>
        <PackageOpen className="size-5" />
      </span>
      <div className="min-w-0 flex-1 text-[13px]">
        {product.openedDate ? (
          <>
            <p className="text-[15px] font-bold">
              {product.openedDate === today ? 'Aperto oggi' : `Aperto il ${formatDate(product.openedDate)}`}
            </p>
            <p className="text-muted-foreground">
              {end ? (
                `Fine PAO il ${formatDate(end)}`
              ) : (
                <>
                  Nessun PAO indicato ·{' '}
                  <Link to={paths.productEdit(product.id)} className="font-bold text-rose-ink">
                    Aggiungilo
                  </Link>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="text-[15px] font-bold">Non ancora aperto</p>
            <p className="text-muted-foreground">
              {product.paoMonths ? `PAO ${product.paoMonths}M dal giorno di apertura` : 'Segna quando lo apri'}
            </p>
          </>
        )}
      </div>
      {!product.openedDate && (
        <Button className="h-10 shrink-0 px-3.5" onClick={onOpenToday}>
          Aperto oggi
        </Button>
      )}
    </div>
  )
}

export function ProductDetailView({ id, tab }: { id: string; tab: ProductTab }) {
  const { data, dispatch, today } = useStore()
  const { products, combos } = data
  const product = products.find((p) => p.id === id)
  const [toDelete, setToDelete] = useState<Product | null>(null)

  if (!product) {
    return (
      <>
        <PageHeader back={paths.inventory} />
        <EmptyState icon={<SearchX />} title="Prodotto non trovato">
          <Button asChild variant="outline" size="lg">
            <Link to={paths.inventory}>Torna all'inventario</Link>
          </Button>
        </EmptyState>
      </>
    )
  }

  const patch = (fields: Partial<Omit<Product, 'id' | 'pairings'>>) =>
    dispatch({ type: 'product/patch', id: product.id, patch: fields })

  const liner = isLipLiner(product)
  const paired = product.pairings.map((pid) => products.find((p) => p.id === pid)).filter((p) => p !== undefined)
  // La scheda "Abbinamenti" c'è per le matite e per i prodotti labbra già abbinati a una matita.
  const hasPairingsTab = liner || (isLipProduct(product) && paired.length > 0)
  const current: ProductTab = tab === 'abbinamenti' && !hasPairingsTab ? 'dettagli' : tab
  const warning = productWarning(product, today)
  const end = paoEnd(product)
  const productCombos = combos.filter((c) => c.productIds.includes(product.id))

  const tabs: { value: ProductTab; label: string }[] = [
    { value: 'dettagli', label: 'Dettagli' },
    ...(hasPairingsTab ? [{ value: 'abbinamenti' as const, label: 'Abbinamenti' }] : []),
    { value: 'info', label: 'Info' },
  ]

  const openToday = () => {
    patch({ openedDate: today })
    toast.success('Segnato come aperto oggi', {
      action: { label: 'Annulla', onClick: () => patch({ openedDate: null }) },
    })
  }

  return (
    <>
      <PageHeader
        back={paths.inventory}
        actions={
          <>
            <Link
              to={paths.productEdit(product.id)}
              aria-label="Modifica prodotto"
              className="grid size-10 place-items-center rounded-full text-foreground/80 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              <Pencil className="size-5" />
            </Link>
            <HeartButton
              on={product.favorite}
              label={product.name}
              onToggle={() => patch({ favorite: !product.favorite })}
              className="-mr-2"
            />
          </>
        }
      />

      <Picture product={product} />
      <h2 className="text-[26px] leading-tight font-bold text-balance break-words">
        {product.brand && (
          <>
            {product.brand}
            <br />
          </>
        )}
        {product.name}
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{taxonomyPath(product).join(' › ') || 'Senza categoria'}</p>

      {warning && (
        <div className={cn(cardClass, 'mt-4 flex gap-3 border-l-4 border-l-destructive p-[13px]')} role="status">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive-ink" />
          <div className="text-[13px]">
            <p className="font-bold text-destructive-ink">
              {warning.paoExceeded && warning.expired
                ? 'PAO superato e prodotto scaduto'
                : warning.paoExceeded
                  ? 'PAO superato'
                  : 'Prodotto scaduto'}
            </p>
            {warning.paoExceeded && <p className="text-muted-foreground">Fine PAO il {formatDate(warning.paoExceeded)}</p>}
            {warning.expired && <p className="text-muted-foreground">Scaduto il {formatDate(warning.expired)}</p>}
          </div>
        </div>
      )}

      <OpenedCard product={product} today={today} onOpenToday={openToday} />

      <ChipRow className="mt-4 mb-3">
        {tabs.map((t) => (
          <Chip
            key={t.value}
            on={current === t.value}
            onClick={() => navigate(paths.product(product.id, t.value), { replace: true })}
            className="h-[38px] px-3.5 text-[15px]"
          >
            {t.label}
          </Chip>
        ))}
      </ChipRow>

      {current === 'dettagli' && (
        <>
          <div className={cn(cardClass, 'p-4')}>
            <p className="mb-1.5 text-xs text-secondary-foreground">Valutazione</p>
            <StarRating value={product.rating} onChange={(rating) => patch({ rating })} />
            {product.zones.length > 0 && (
              <>
                <p className="mt-4 mb-1.5 text-xs text-secondary-foreground">Zone d'uso</p>
                <div className="flex flex-wrap gap-[7px]">
                  {product.zones.map((z) => (
                    <span key={z} className="rounded-[14px] bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                      {getZone(z)?.label ?? z}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <SectionTitle>Nota</SectionTitle>
          {product.notes ? (
            <Hero className="p-4">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{product.notes}</p>
            </Hero>
          ) : (
            <p className="text-[13px] text-muted-foreground">
              Nessuna nota.{' '}
              <Link to={paths.productEdit(product.id)} className="font-bold text-rose-ink">
                Aggiungila
              </Link>
            </p>
          )}

          {productCombos.length > 0 && (
            <>
              <SectionTitle>Nelle tue Lip Combo</SectionTitle>
              <RowList>
                {productCombos.map((c) => (
                  <Row
                    key={c.id}
                    to={paths.combo(c.id)}
                    title={`${comboTitle(c, products)}${c.favorite ? ' ♥' : ''}`}
                    subtitle={`${c.productIds.length} prodotti`}
                  />
                ))}
              </RowList>
            </>
          )}
        </>
      )}

      {current === 'abbinamenti' && liner && (
        <>
          <Hero className="mb-3">
            <p className="text-[17px] font-bold">Con cosa mi piace abbinarla</p>
            <p className="text-[13px] text-muted-foreground">
              {paired.length
                ? 'Questi sono i prodotti che hai salvato.'
                : 'Scegli i prodotti labbra che secondo te stanno bene con questa matita.'}
            </p>
          </Hero>
          {paired.length > 0 && (
            <RowList>
              {paired.map((p) => (
                <ProductRow key={p.id} product={p} today={today} title="full" trailing={null} />
              ))}
            </RowList>
          )}
          <div className="mt-4 flex flex-col gap-[9px]">
            <Button asChild variant="outline" size="lg">
              <Link to={paths.productPairings(product.id)}>
                <Plus className="size-5" /> {paired.length ? 'Aggiungi / modifica abbinamenti' : 'Aggiungi abbinamenti'}
              </Link>
            </Button>
            {paired.length > 0 && (
              <Button asChild size="lg">
                <Link to={paths.comboNew(product.id)}>Crea combo con questi prodotti</Link>
              </Button>
            )}
          </div>
        </>
      )}

      {current === 'abbinamenti' && !liner && (
        <>
          <Hero className="mb-3">
            <p className="text-[17px] font-bold">Abbinata con</p>
            <p className="text-[13px] text-muted-foreground">Le matite labbra con cui hai salvato questo prodotto.</p>
          </Hero>
          <RowList>
            {paired.map((p) => (
              <ProductRow key={p.id} product={p} today={today} title="full" trailing={null} />
            ))}
          </RowList>
        </>
      )}

      {current === 'info' && (
        <>
          <dl className={cn(cardClass, 'divide-y')}>
            <Fact label="Data di apertura">{formatDate(product.openedDate)}</Fact>
            <Fact label="PAO">{product.paoMonths ? `${product.paoMonths}M` : '—'}</Fact>
            <Fact label="Fine PAO calcolata" strong>
              {end ? formatDate(end) : '—'}
            </Fact>
            <Fact label="Data di scadenza">{formatDate(product.expiryDate)}</Fact>
            <Fact label="Aggiunto il">{formatDate(product.createdAt.slice(0, 10))}</Fact>
          </dl>
          <div className="mt-4 flex flex-col gap-[9px]">
            <Button asChild variant="outline" size="lg">
              <Link to={paths.productEdit(product.id)}>
                <Pencil className="size-4" /> Modifica prodotto
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
              onClick={() => setToDelete(product)}
            >
              <Trash2 className="size-4" /> Elimina prodotto
            </Button>
          </div>
        </>
      )}

      <DeleteProductDialog
        product={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={() => navigate(paths.inventory, { replace: true })}
      />
    </>
  )
}
