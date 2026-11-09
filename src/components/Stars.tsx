import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Valutazione in sola lettura. */
export function Stars({ value, className }: { value: number | null; className?: string }) {
  if (!value) return null
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} stelle su 5`} role="img">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('size-3', n <= value ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground/30')}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

/** Valutazione modificabile: un tocco imposta le stelle, toccando di nuovo la stessa stella si azzera. */
export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number | null
  onChange: (value: number | null) => void
  size?: 'md' | 'lg'
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Valutazione">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value !== null && n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'stella' : 'stelle'}`}
            onClick={() => onChange(value === n ? null : n)}
            className="rounded-full p-0.5 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-90"
          >
            <Star
              className={cn(
                size === 'lg' ? 'size-8' : 'size-6',
                on ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground/40',
              )}
              strokeWidth={1.5}
            />
          </button>
        )
      })}
    </div>
  )
}
