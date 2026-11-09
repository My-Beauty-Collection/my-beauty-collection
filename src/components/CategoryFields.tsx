import { useId } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { allCategories, getCategory, getSubcategory, type TaxonomyRef } from '../data/taxonomy'
import { BeautyIcon } from './BeautyIcon'
import type { BeautyIconName } from './beauty-icons'
import { FormField } from './common'

/** Valore della voce "nessuna scelta" (Radix Select non accetta stringhe vuote). */
const NONE = '_none'

export const selectTriggerClass =
  'h-12! w-full rounded-[11px] bg-card px-3 text-base text-foreground md:text-[15px] data-placeholder:text-muted-foreground'

/** Menu a tendina nello stile dei campi del modulo. */
export function FieldSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleziona',
  noneLabel,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; icon?: BeautyIconName }[]
  placeholder?: string
  /** Se indicato, aggiunge una voce per togliere la scelta. */
  noneLabel?: string
  invalid?: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v === NONE ? '' : v)}>
      <SelectTrigger id={id} aria-invalid={invalid || undefined} className={selectTriggerClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-80 w-(--radix-select-trigger-width) rounded-[14px]">
        {noneLabel && value && (
          <SelectItem value={NONE} className="py-2.5 text-[15px] text-muted-foreground">
            {noneLabel}
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="py-2.5 text-[15px]">
            {o.icon && <BeautyIcon name={o.icon} className="size-5 text-rose-ink!" />}
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Categoria → sottocategoria → (solo Make-up) tipologia.
 * Con `optional` ogni livello si può lasciare vuoto (es. nella wishlist).
 */
export function CategoryFields({
  value,
  onChange,
  optional = false,
  error,
}: {
  value: TaxonomyRef
  onChange: (next: TaxonomyRef) => void
  optional?: boolean
  error?: string | null
}) {
  const ids = { category: useId(), sub: useId(), type: useId() }
  const category = getCategory(value.categoryId)
  const subcategory = getSubcategory(value.subcategoryId)
  const mark = optional ? '' : ' *'
  const categoryError = error && !value.categoryId ? error : null
  const subError = error && value.categoryId ? error : null

  return (
    <>
      <FormField label={`Categoria${mark}`} htmlFor={ids.category} error={categoryError}>
        <FieldSelect
          id={ids.category}
          value={value.categoryId}
          invalid={Boolean(categoryError)}
          noneLabel={optional ? 'Nessuna categoria' : undefined}
          options={allCategories().map((c) => ({ value: c.id, label: c.name, icon: c.icon }))}
          onChange={(categoryId) => onChange({ categoryId, subcategoryId: '', typeId: null })}
        />
      </FormField>

      {category && category.subcategories.length > 0 && (
        <FormField label={`Sottocategoria${mark}`} htmlFor={ids.sub} error={subError}>
          <FieldSelect
            id={ids.sub}
            value={value.subcategoryId}
            invalid={Boolean(subError)}
            noneLabel={optional ? 'Nessuna sottocategoria' : undefined}
            options={category.subcategories.map((s) => ({ value: s.id, label: s.name, icon: s.icon }))}
            onChange={(subcategoryId) => onChange({ ...value, subcategoryId, typeId: null })}
          />
        </FormField>
      )}

      {subcategory && subcategory.types.length > 0 && (
        <FormField label="Tipologia" htmlFor={ids.type}>
          <FieldSelect
            id={ids.type}
            value={value.typeId ?? ''}
            noneLabel="Nessuna tipologia"
            options={subcategory.types.map((t) => ({ value: t.id, label: t.name, icon: t.icon }))}
            onChange={(typeId) => onChange({ ...value, typeId: typeId || null })}
          />
        </FormField>
      )}
    </>
  )
}
