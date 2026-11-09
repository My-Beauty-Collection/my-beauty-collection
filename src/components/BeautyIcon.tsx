import { cn } from '@/lib/utils'
import { BEAUTY_ICONS, type BeautyIconName } from './beauty-icons'

/** Icona beauty a tratto sottile (IconOven): prende il colore del testo (currentColor). */
export function BeautyIcon({ name, className, label }: { name: BeautyIconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6 shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Contenuto statico generato in beauty-icons.ts (nessun dato dell'utente).
      dangerouslySetInnerHTML={{ __html: BEAUTY_ICONS[name] }}
    />
  )
}
