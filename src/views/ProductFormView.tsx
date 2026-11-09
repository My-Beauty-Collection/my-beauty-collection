import { Heart, SearchX, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { CategoryFields, FieldSelect } from '../components/CategoryFields'
import { Chip, EmptyState, FormField, PageHeader, SwitchLine } from '../components/common'
import { PhotoPicker, type PhotoDraft } from '../components/PhotoPicker'
import { StarRating } from '../components/Stars'
import { defaultZones, needsSubcategory, ZONES, type TaxonomyRef } from '../data/taxonomy'
import { formatDate } from '../lib/dates'
import { emptyProduct, paoEnd } from '../lib/products'
import { PAO_OPTIONS, type Product } from '../lib/types'
import { goBack, navigate, paths, type ProductPrefill } from '../router'
import { useStore } from '../store'

function DateField({
  label,
  value,
  onChange,
  today,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  today?: string
}) {
  const id = useId()
  return (
    <FormField label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-w-0 flex-1 appearance-none text-left [&::-webkit-date-and-time-value]:text-left"
        />
        {today && !value && (
          <Button type="button" variant="outline" className="h-12 px-4" onClick={() => onChange(today)}>
            Oggi
          </Button>
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-12 text-muted-foreground"
            aria-label={`Cancella ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
          >
            <X className="size-4.5" />
          </Button>
        )}
      </div>
    </FormField>
  )
}

type Mode = { kind: 'new'; prefill: ProductPrefill } | { kind: 'edit'; id: string }

export function ProductFormView({ mode }: { mode: Mode }) {
  const { data, dispatch, today, uploadPhoto, removePhoto } = useStore()
  const ids = { brand: useId(), name: useId(), pao: useId(), notes: useId(), favorite: useId() }
  const existing = mode.kind === 'edit' ? data.products.find((p) => p.id === mode.id) : undefined
  const wish = mode.kind === 'new' && mode.prefill.wishId ? data.wishlist.find((w) => w.id === mode.prefill.wishId) : undefined

  const [draft, setDraft] = useState<Product>(() => {
    if (existing) return { ...existing }
    const base = emptyProduct(new Date().toISOString())
    const prefill = mode.kind === 'new' ? mode.prefill : {}
    // Dalla wishlist passano tutti i dati già inseriti; dalle pagine dell'inventario la categoria.
    const ref: TaxonomyRef = wish
      ? { categoryId: wish.categoryId, subcategoryId: wish.subcategoryId, typeId: wish.typeId }
      : { categoryId: prefill.categoryId ?? '', subcategoryId: prefill.subcategoryId ?? '', typeId: prefill.typeId ?? null }
    return {
      ...base,
      ...ref,
      name: wish?.name ?? '',
      brand: wish?.brand ?? '',
      notes: wish?.note ?? '',
      zones: ref.categoryId ? defaultZones(ref.categoryId, ref.subcategoryId) : [],
    }
  })
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: 'keep' })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }))

  if (mode.kind === 'edit' && !existing) {
    return (
      <>
        <PageHeader back={paths.inventory} />
        <EmptyState icon={<SearchX />} title="Prodotto non trovato" />
      </>
    )
  }

  const errors = {
    name: !draft.name.trim() ? 'Inserisci il nome del prodotto' : null,
    category: !draft.categoryId
      ? 'Scegli la categoria'
      : needsSubcategory(draft.categoryId) && !draft.subcategoryId
        ? 'Scegli la sottocategoria'
        : null,
  }
  const hasErrors = Object.values(errors).some(Boolean)
  const end = paoEnd(draft)

  const onTaxonomy = (ref: TaxonomyRef) => {
    const subChanged = ref.categoryId !== draft.categoryId || ref.subcategoryId !== draft.subcategoryId
    set({ ...ref, ...(subChanged && { zones: defaultZones(ref.categoryId, ref.subcategoryId) }) })
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (hasErrors) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSaving(true)
    let photoValue = draft.photo
    try {
      if (photo.kind === 'new') photoValue = await uploadPhoto(photo.file, draft.id)
      if (photo.kind === 'remove') photoValue = null
    } catch {
      setSaving(false)
      toast.error('Caricamento della foto non riuscito', { description: 'Controlla la connessione e riprova.' })
      return
    }
    const product: Product = { ...draft, name: draft.name.trim(), brand: draft.brand.trim(), photo: photoValue }
    dispatch({ type: 'product/save', product })
    if (existing?.photo && existing.photo !== photoValue) removePhoto(existing.photo)

    if (mode.kind === 'new') {
      if (wish) {
        dispatch({ type: 'wish/delete', id: wish.id })
        toast.success("Spostato dalla wishlist all'inventario")
      } else {
        toast.success('Prodotto salvato')
      }
      navigate(paths.product(product.id), { replace: true })
    } else {
      toast.success('Modifiche salvate')
      goBack(paths.product(product.id))
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        back={paths.inventory}
        title={mode.kind === 'edit' ? 'Modifica prodotto' : wish ? 'Dalla wishlist' : 'Nuovo prodotto'}
        subtitle={wish ? 'Controlla i dati e completa la scheda.' : undefined}
      />

      <PhotoPicker current={draft.photo} draft={photo} onChange={setPhoto} />

      <FormField label="Marca" htmlFor={ids.brand}>
        <Input id={ids.brand} value={draft.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="es. Nuxe" />
      </FormField>
      <FormField label="Nome prodotto *" htmlFor={ids.name} error={submitted ? errors.name : null}>
        <Input
          id={ids.name}
          value={draft.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="es. Huile Prodigieuse"
          aria-invalid={submitted && Boolean(errors.name)}
        />
      </FormField>

      <CategoryFields value={draft} onChange={onTaxonomy} error={submitted ? errors.category : null} />

      {draft.categoryId && (
        <FormField
          label="Zone d'uso"
          hint="Per un prodotto multiuso (es. un olio per viso, corpo e capelli) seleziona più zone."
        >
          <div className="flex flex-wrap gap-[7px]" role="group" aria-label="Zone d'uso">
            {ZONES.map((z) => {
              const on = draft.zones.includes(z.id)
              return (
                <Chip
                  key={z.id}
                  on={on}
                  onClick={() => set({ zones: on ? draft.zones.filter((x) => x !== z.id) : [...draft.zones, z.id] })}
                  className="h-9 px-3.5"
                >
                  {z.label}
                </Chip>
              )
            })}
          </div>
        </FormField>
      )}

      <DateField label="Data di apertura" value={draft.openedDate} today={today} onChange={(openedDate) => set({ openedDate })} />
      <FormField label="PAO" htmlFor={ids.pao} hint="Il simbolo del barattolino aperto sulla confezione, es. 12M.">
        <FieldSelect
          id={ids.pao}
          value={draft.paoMonths ? String(draft.paoMonths) : ''}
          onChange={(v) => set({ paoMonths: v ? Number(v) : null })}
          noneLabel="Nessun PAO"
          options={PAO_OPTIONS.map((m) => ({ value: String(m), label: `${m}M · ${m} mesi` }))}
        />
      </FormField>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-[11px] bg-accent px-3 py-3">
        <span className="text-[13px] text-secondary-foreground">Fine PAO calcolata</span>
        <span className="text-right text-[15px] font-bold">
          {end ? formatDate(end) : <span className="text-[13px] font-normal text-muted-foreground">Inserisci apertura e PAO</span>}
        </span>
      </div>
      <DateField label="Data di scadenza (se presente)" value={draft.expiryDate} onChange={(expiryDate) => set({ expiryDate })} />

      <FormField label="Valutazione">
        <StarRating value={draft.rating} onChange={(rating) => set({ rating })} size="lg" />
      </FormField>
      <SwitchLine id={ids.favorite} checked={draft.favorite} onChange={(favorite) => set({ favorite })}>
        <Heart className="size-4.5 fill-primary text-primary" /> Preferito
      </SwitchLine>
      <FormField label="Nota" htmlFor={ids.notes}>
        <Textarea
          id={ids.notes}
          rows={3}
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Facoltativa"
        />
      </FormField>

      <Button type="submit" size="lg" className="mt-[9px] w-full" disabled={saving}>
        {saving && <Spinner />} Salva prodotto
      </Button>
    </form>
  )
}
