import { Heart, Trash2, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { usePhotoUrl } from '@/lib/photos'
import { cn } from '@/lib/utils'
import { taxonomyIcon } from '../data/taxonomy'
import { fullName, productWarning, typeLabel, warningDetail, type ProductWarning } from '../lib/products'
import type { Product } from '../lib/types'
import { paths } from '../router'
import { useStore } from '../store'
import { cardClass, Row, Thumb } from './common'
import { Stars } from './Stars'

/** Foto del prodotto oppure, se non c'è, l'icona della sua tipologia/categoria. */
export function ProductThumb({
  product,
  className,
  variant = 'thumb',
}: {
  product: Pick<Product, 'photo' | 'categoryId' | 'subcategoryId' | 'typeId'>
  className?: string
  variant?: 'thumb' | 'full'
}) {
  const url = usePhotoUrl(product.photo, variant)
  if (!product.photo) return <Thumb icon={taxonomyIcon(product)} className={className} />
  return (
    <span className={cn('block h-[60px] w-[46px] shrink-0 overflow-hidden rounded-[11px] bg-thumb', className)}>
      {url && <img src={url} alt="" className="size-full object-cover" loading="lazy" decoding="async" />}
    </span>
  )
}

/** Testo rosso con triangolo: "PAO superato" / "Scaduto". */
export function WarningLabel({ warning, className }: { warning: ProductWarning; className?: string }) {
  const label =
    warning.paoExceeded && warning.expired ? 'PAO superato e scaduto' : warning.paoExceeded ? 'PAO superato' : 'Scaduto'
  return (
    <span className={cn('flex items-center gap-1 text-[13px] font-medium text-destructive-ink', className)}>
      <TriangleAlert className="size-3.5 shrink-0" /> {label}
    </span>
  )
}

/** Cuore per aggiungere/togliere dai preferiti. */
export function HeartButton({
  on,
  onToggle,
  label,
  className,
}: {
  on: boolean
  onToggle: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Togli ${label} dai preferiti` : `Aggiungi ${label} ai preferiti`}
      onClick={onToggle}
      className={cn(
        'grid size-10 place-items-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/60',
        on ? 'text-primary' : 'text-muted-foreground/70',
        className,
      )}
    >
      <Heart className={cn('size-[21px]', on && 'fill-current')} strokeWidth={1.8} />
    </button>
  )
}

/** Cestino tondo per eliminare un prodotto direttamente da una lista (es. dalle segnalazioni). */
export function DeleteButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`Elimina ${label}`}
      onClick={onClick}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-destructive/10 hover:text-destructive-ink focus-visible:ring-3 focus-visible:ring-ring/60 active:bg-destructive/10',
        className,
      )}
    >
      <Trash2 className="size-[19px]" strokeWidth={1.8} />
    </button>
  )
}

/**
 * Riga prodotto.
 * - `title="brand"`: marca in grassetto e nome sotto (liste dell'inventario, come nel prototipo);
 * - `title="full"`: marca + nome in grassetto e tipologia sotto (abbinamenti, combo).
 * A destra, per impostazione, il cuore dei preferiti.
 */
export function ProductRow({
  product,
  today,
  title = 'brand',
  trailing,
  showWarning = true,
}: {
  product: Product
  today: string
  title?: 'brand' | 'full'
  trailing?: ReactNode
  showWarning?: boolean
}) {
  const { dispatch } = useStore()
  const kind = typeLabel(product)
  const warning = productWarning(product, today)
  const heading = title === 'full' ? fullName(product) : product.brand || product.name
  const sub = title === 'full' ? kind : product.brand ? product.name : kind

  return (
    <Row
      to={paths.product(product.id)}
      media={<ProductThumb product={product} />}
      title={heading}
      subtitle={sub}
      warn={showWarning && warning !== null}
      meta={
        <>
          {product.rating ? <Stars value={product.rating} className="mt-1" /> : null}
          {showWarning && warning && <WarningLabel warning={warning} className="mt-0.5" />}
        </>
      }
      trailing={
        trailing !== undefined ? (
          trailing
        ) : (
          <HeartButton
            on={product.favorite}
            label={product.name}
            onToggle={() => dispatch({ type: 'product/patch', id: product.id, patch: { favorite: !product.favorite } })}
            className="-mr-1.5"
          />
        )
      }
    />
  )
}

/** Riga avviso (pagina Scadenze): bordo rosso, motivo, date e cestino per eliminare il prodotto. */
export function WarningRow({ warning, onDelete }: { warning: ProductWarning; onDelete: () => void }) {
  return (
    <Row
      to={paths.product(warning.product.id)}
      warn
      media={<ProductThumb product={warning.product} />}
      title={fullName(warning.product)}
      meta={
        <>
          <WarningLabel warning={warning} className="mt-0.5" />
          <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{warningDetail(warning)}</span>
        </>
      }
      trailing={<DeleteButton label={fullName(warning.product)} onClick={onDelete} className="-mr-1.5" />}
    />
  )
}

/** Riga con casella di selezione (abbinamenti, creazione combo). Tutta la riga attiva la casella. */
export function SelectableProductRow({
  product,
  checked,
  onCheckedChange,
}: {
  product: Product
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        cardClass,
        'flex cursor-pointer items-center gap-3 p-[13px] transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/60',
        checked && 'border-ring bg-[#fffafb]',
      )}
    >
      <ProductThumb product={product} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[15px] leading-snug font-bold">{fullName(product)}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{typeLabel(product)}</span>
      </span>
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="size-6 rounded-md"
        aria-label={`Seleziona ${fullName(product)}`}
      />
    </label>
  )
}

/** I prodotti di una combo affiancati, in tondo (riquadro cipria della combo). */
export function ComboIcons({ products }: { products: Product[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-hidden>
      {products.map((p) => (
        <ProductThumb
          key={p.id}
          product={p}
          className="h-12 w-12 rounded-full border border-ring/50 bg-card/80 shadow-card [&>svg]:size-6"
        />
      ))}
    </div>
  )
}
