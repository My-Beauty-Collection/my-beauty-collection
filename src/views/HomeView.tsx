import { ChevronRight, Heart, Plus, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { BeautyIcon } from '../components/BeautyIcon'
import { cardClass, IconBubble, Link, WideCard } from '../components/common'
import { ProductThumb, WarningLabel } from '../components/ProductRow'
import { CATEGORIES, OTHER_ICON } from '../data/taxonomy'
import { fullName, warningDetail, type ProductWarning } from '../lib/products'
import { paths } from '../router'
import { useStore } from '../store'
import { OTHER_CATEGORY } from './InventoryView'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Quante segnalazioni mostrare in Home; le altre si vedono nella pagina dedicata. */
const PREVIEW = 3
const OPEN_KEY = 'my-beauty-case:home-warnings'

/** Segnalazioni in Home: riquadro apribile con le prime voci e il collegamento alla pagina completa. */
function WarningsAccordion({ warnings }: { warnings: ProductWarning[] }) {
  // Aperto per impostazione; se lo chiudi resta chiuso anche alle visite successive.
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) !== 'closed')
  const toggle = (value: string) => {
    const next = value === 'warnings'
    setOpen(next)
    localStorage.setItem(OPEN_KEY, next ? 'open' : 'closed')
  }
  const n = warnings.length

  return (
    <Accordion
      type="single"
      collapsible
      value={open ? 'warnings' : ''}
      onValueChange={toggle}
      className={cn(cardClass, 'mb-3 overflow-hidden border-l-4 border-l-destructive')}
    >
      <AccordionItem value="warnings">
        <AccordionTrigger className="items-center gap-3.5 rounded-none p-[15px] hover:no-underline **:data-[slot=accordion-trigger-icon]:size-5 **:data-[slot=accordion-trigger-icon]:text-foreground/70">
          <IconBubble className="bg-destructive/10 text-destructive-ink">
            <TriangleAlert />
          </IconBubble>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">Scadenze e avvertenze</span>
            <span className="block text-[13px] font-normal text-destructive-ink">
              {plural(n, 'prodotto', 'prodotti')} con limite superato
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="h-auto p-0 [&_a]:no-underline">
          <ul className="divide-y border-t">
            {warnings.slice(0, PREVIEW).map((w) => (
              <li key={w.product.id} className="relative flex items-center gap-3 px-[15px] py-2.5">
                <ProductThumb product={w.product} className="h-[46px] w-9 rounded-[9px] text-xl" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={paths.product(w.product.id)}
                    className="line-clamp-1 text-sm font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/60 focus-visible:after:ring-inset"
                  >
                    {fullName(w.product)}
                  </Link>
                  <WarningLabel warning={w} className="text-xs" />
                  <span className="block truncate text-[11.5px] text-muted-foreground">{warningDetail(w)}</span>
                </div>
                <ChevronRight className="size-4.5 shrink-0 text-foreground/50" aria-hidden />
              </li>
            ))}
          </ul>
          <Link
            to={paths.warnings}
            className="flex items-center justify-center gap-1 border-t px-4 py-3 text-sm font-bold text-rose-ink outline-none hover:bg-accent/40 focus-visible:bg-accent/60"
          >
            {n > PREVIEW ? `Vedi tutte le segnalazioni (${n})` : 'Vai alla pagina delle segnalazioni'}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function HomeView() {
  const { data, warnings, displayName } = useStore()
  const { products } = data

  const counts = useMemo(() => {
    const known = new Set(CATEGORIES.map((c) => c.id))
    const m = new Map<string, number>()
    for (const p of products) {
      const key = known.has(p.categoryId) ? p.categoryId : OTHER_CATEGORY
      m.set(key, (m.get(key) ?? 0) + 1)
    }
    return m
  }, [products])

  const tiles = [
    ...CATEGORIES.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    ...(counts.get(OTHER_CATEGORY) ? [{ id: OTHER_CATEGORY, name: 'Altro', icon: OTHER_ICON }] : []),
  ]

  return (
    <>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        La mia Beauty Collection <Sparkles className="size-3.5 text-primary" aria-hidden />
      </p>
      <div className="mb-[18px] flex items-center gap-3">
        <h1 className="mt-1 min-w-0 flex-1 text-[31px] leading-tight font-extrabold break-words">
          Ciao{displayName ? ` ${displayName}` : ''} ♡
        </h1>
        <Link
          to={paths.productNew()}
          aria-label="Aggiungi un prodotto"
          className="grid size-12 shrink-0 place-items-center rounded-[13px] bg-ink text-white outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-95"
        >
          <Plus className="size-6" />
        </Link>
      </div>

      {warnings.length > 0 && <WarningsAccordion warnings={warnings} />}

      <Link
        to={paths.inventory}
        className="block rounded-[18px] border border-accent bg-accent p-5 shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.99]"
      >
        <IconBubble className="size-12 bg-card/70 [&>svg]:size-7">
          <BeautyIcon name="toiletries" />
        </IconBubble>
        <span className="mt-4 mb-0.5 block text-[17px] font-bold">Il mio inventario</span>
        <span className="block text-[13px] text-muted-foreground">
          Tutti i prodotti della tua collezione · {plural(products.length, 'prodotto', 'prodotti')}
        </span>
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-[9px]">
        {tiles.map((c) => (
          <Link
            key={c.id}
            to={paths.category(c.id)}
            className={cn(
              cardClass,
              'flex min-h-[105px] flex-col p-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.98]',
            )}
          >
            <span
              className="mb-4 grid size-11 place-items-center rounded-[11px] bg-thumb text-rose-ink [&>svg]:size-[26px]"
              aria-hidden
            >
              <BeautyIcon name={c.icon} />
            </span>
            <span className="mt-auto text-[15px] font-bold">{c.name}</span>
            <span className="text-xs text-muted-foreground">{plural(counts.get(c.id) ?? 0, 'prodotto', 'prodotti')}</span>
          </Link>
        ))}
      </div>

      <div className="mt-[9px] flex flex-col gap-[9px]">
        <WideCard
          to={paths.combos}
          icon={<BeautyIcon name="lip-reading" />}
          title="Lip Combo"
          description="Scopri le tue combo e crea nuovi look"
        />
        <WideCard to={paths.wishlist} icon={<Heart />} title="Wishlist" description="I prodotti che vuoi acquistare" />
        {warnings.length === 0 && (
          <WideCard
            to={paths.warnings}
            icon={<ShieldCheck />}
            title="Scadenze e avvertenze"
            description="Nessun prodotto con limite superato"
          />
        )}
      </div>
    </>
  )
}
