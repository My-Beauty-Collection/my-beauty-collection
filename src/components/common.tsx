/**
 * Mattoncini dell'interfaccia, ripresi dal prototipo "Beauty Collection":
 * card bianche arrotondate con ombra rosata, riquadri cipria, miniature con icone beauty,
 * pillole (chip) e schede a segmenti rosa.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { goBack, navigate, paths } from '../router'
import { BeautyIcon } from './BeautyIcon'
import type { BeautyIconName } from './beauty-icons'

/**
 * Link interno: usa la navigazione dell'app (così il tasto "indietro" resta nell'app).
 * Inoltra le altre props all'<a>, così funziona anche dentro i componenti shadcn con `asChild`.
 */
export function Link({
  to,
  ariaLabel,
  onClick,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; ariaLabel?: string }) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  return <a {...rest} href={to} onClick={handleClick} aria-label={ariaLabel ?? rest['aria-label']} />
}

/** Card bianca del prototipo. */
export const cardClass = 'rounded-[18px] border bg-card shadow-card'

/** Intestazione di pagina: "‹" indietro, titolo e azioni a destra; sotto, una riga descrittiva facoltativa. */
export function PageHeader({
  title,
  subtitle,
  back = true,
  onBack,
  actions,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  /** Pagina a cui tornare se non c'è una pagina precedente dell'app (predefinita: Home). */
  back?: string | boolean
  /** Sostituisce il comportamento di "indietro" (es. passo precedente di una procedura). */
  onBack?: () => void
  actions?: ReactNode
}) {
  return (
    <header className="mb-[15px]">
      <div className="flex min-h-12 items-center gap-1.5">
        {back && (
          <button
            type="button"
            aria-label="Indietro"
            onClick={() => (onBack ? onBack() : goBack(typeof back === 'string' ? back : paths.home))}
            className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeft className="size-7" strokeWidth={2.2} />
          </button>
        )}
        {title && <h1 className="min-w-0 flex-1 text-[21px] leading-tight font-bold text-balance">{title}</h1>}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
      {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
    </header>
  )
}

/** Titoletto di sezione. */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn('mt-[17px] mb-2 text-[15px] font-extrabold', className)}>{children}</h2>
}

/** Miniatura su fondo cipria con un'icona beauty (o un'altra icona passata come figlio). */
export function Thumb({ icon, className, children }: { icon?: BeautyIconName; className?: string; children?: ReactNode }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-[60px] w-[46px] shrink-0 place-items-center rounded-[11px] bg-thumb text-rose-ink select-none [&>svg]:size-7',
        className,
      )}
    >
      {children ?? (icon && <BeautyIcon name={icon} />)}
    </span>
  )
}

/** Icona tonda su fondo cipria (card della Home, stati vuoti, menu). */
export function IconBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full bg-thumb text-rose-ink [&>svg]:size-6',
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Riga-card: miniatura, titolo in grassetto, sottotitolo grigio e un elemento a destra.
 * Con `to` tutta la riga è cliccabile (link "steso" sul titolo), mentre i controlli a destra
 * restano pulsanti separati: niente pulsanti dentro un <a>.
 */
export function Row({
  to,
  media,
  title,
  subtitle,
  meta,
  trailing,
  warn,
  className,
}: {
  to?: string
  media?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  /** Elemento a destra. Se assente e la riga è un link, compare la freccia "›". */
  trailing?: ReactNode
  /** Bordo sinistro rosso degli avvisi. */
  warn?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        cardClass,
        'relative flex items-center gap-3 p-[13px]',
        warn && 'border-l-4 border-l-destructive',
        to && 'transition-transform active:scale-[0.99]',
        className,
      )}
    >
      {media}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[15px] leading-snug font-bold break-words">
          {to ? (
            <Link
              to={to}
              className="outline-none after:absolute after:inset-0 after:rounded-[18px] focus-visible:after:ring-3 focus-visible:after:ring-ring/60"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </div>
        {subtitle && <div className="truncate text-[13px] text-muted-foreground">{subtitle}</div>}
        {meta}
      </div>
      {trailing !== undefined ? (
        <div className="relative z-10 flex shrink-0 items-center">{trailing}</div>
      ) : (
        to && <ChevronRight className="size-5 shrink-0 text-foreground/70" aria-hidden />
      )}
    </div>
  )
}

/** Elenco verticale di righe-card. */
export function RowList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>
}

/** Riquadro cipria in evidenza. */
export function Hero({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[18px] border border-accent bg-accent p-5 shadow-card', className)}>{children}</div>
}

/** Card larga della Home: icona, titolo, descrizione e freccia. */
export function WideCard({
  to,
  icon,
  title,
  description,
}: {
  to: string
  icon: ReactNode
  title: string
  description: ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        cardClass,
        'flex items-center gap-3.5 p-[15px] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.99]',
      )}
    >
      <IconBubble>{icon}</IconBubble>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="size-6 shrink-0 text-foreground/70" aria-hidden />
    </Link>
  )
}

/** Pillola selezionabile. */
export function Chip({
  on,
  onClick,
  children,
  className,
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[14px] px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/60',
        on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Fila di pillole scorrevole in orizzontale. */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        '-mx-4 my-2.5 flex gap-[7px] overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Schede a segmenti (una sola attiva). */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: ReactNode }[]
  ariaLabel: string
  className?: string
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn('mb-3 flex w-full gap-[5px]', className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="h-[38px] min-w-fit flex-1 rounded-[10px]! bg-muted px-2 text-[13.5px] text-secondary-foreground hover:bg-accent hover:text-secondary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Etichetta + campo del modulo, con suggerimento ed errore facoltativi. */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: string | null
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3', className)} data-invalid={error ? true : undefined}>
      <label htmlFor={htmlFor} className="mt-[7px] mb-[5px] block text-xs text-secondary-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive-ink">
          {error}
        </p>
      )}
    </div>
  )
}

/** Riga bianca con interruttore, es. "♥ Preferito". */
export function SwitchLine({
  id,
  checked,
  onChange,
  children,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="my-2 flex items-center justify-between gap-3 rounded-[11px] border bg-card p-3">
      <label htmlFor={id} className="flex flex-1 items-center gap-2 text-[15px]">
        {children}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Stato vuoto: icona, titolo, descrizione e azioni. */
export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className={cn(cardClass, 'flex flex-col items-center px-5 py-8 text-center')}>
      <IconBubble className="mb-3 size-16 [&>svg]:size-8">{icon}</IconBubble>
      <p className="text-base font-bold">{title}</p>
      {description && <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{description}</p>}
      {children && <div className="mt-5 flex w-full flex-col gap-2">{children}</div>}
    </div>
  )
}

/** Finestra di conferma (al posto di window.confirm). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[18px]">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">Annulla</AlertDialogCancel>
          <AlertDialogAction
            className={cn('h-11', destructive && 'bg-destructive! text-white! hover:bg-destructive-ink!')}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
