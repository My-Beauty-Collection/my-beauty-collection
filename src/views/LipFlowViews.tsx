/**
 * Flusso della matita labbra, come nel prototipo:
 * "Aggiungi abbinamenti" e "Crea una nuova combo" (selezione → dettagli → conferma).
 */
import { Check, Heart, Sparkles } from 'lucide-react'
import { useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Chip,
  ChipRow,
  EmptyState,
  FormField,
  Hero,
  Link,
  PageHeader,
  Row,
  RowList,
  SectionTitle,
  SwitchLine,
} from '../components/common'
import { BeautyIcon } from '../components/BeautyIcon'
import { ComboIcons, ProductThumb, SelectableProductRow } from '../components/ProductRow'
import { LIP_SUBCATEGORY } from '../data/taxonomy'
import { comboTitle, fullName, isLipLiner, matchesSearch, newId, pairingCandidates, typeLabel } from '../lib/products'
import type { LipCombo, Product } from '../lib/types'
import { goBack, navigate, paths } from '../router'
import { useStore } from '../store'

const nowIso = () => new Date().toISOString()

/** Barra in fondo allo schermo, sopra la navigazione, con il pulsante principale. */
function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+8px)] z-10 mt-4 flex flex-col gap-2">
      {children}
    </div>
  )
}

function useLiner(id: string): Product | undefined {
  const { data } = useStore()
  const product = data.products.find((p) => p.id === id)
  return product && isLipLiner(product) ? product : undefined
}

function NotALiner() {
  return (
    <>
      <PageHeader back={paths.inventory} />
      <EmptyState icon={<BeautyIcon name="eyebrow-pencil" />} title="Matita labbra non trovata">
        <Button asChild variant="outline" size="lg">
          <Link to={paths.inventory}>Torna all'inventario</Link>
        </Button>
      </EmptyState>
    </>
  )
}

// ---------- Aggiungi abbinamenti ----------

export function PairingsView({ id }: { id: string }) {
  const liner = useLiner(id)
  return liner ? <PairingsForm key={liner.id} liner={liner} /> : <NotALiner />
}

function PairingsForm({ liner }: { liner: Product }) {
  const { data, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<string | null>(null)
  const [chosen, setChosen] = useState(() => new Set(liner.pairings))

  const candidates = useMemo(
    () => pairingCandidates(data.products, liner.id).sort((a, b) => fullName(a).localeCompare(fullName(b), 'it')),
    [data.products, liner.id],
  )
  const types = [...new Set(candidates.map((p) => typeLabel(p) || 'Altro'))]
  const visible = candidates.filter((p) => (!type || (typeLabel(p) || 'Altro') === type) && matchesSearch(p, query))

  const toggle = (pid: string, on: boolean) =>
    setChosen((prev) => {
      const next = new Set(prev)
      if (on) next.add(pid)
      else next.delete(pid)
      return next
    })

  const save = () => {
    dispatch({ type: 'product/pairings', id: liner.id, pairings: [...chosen] })
    toast.success('Abbinamenti salvati')
    goBack(paths.product(liner.id, 'abbinamenti'))
  }

  return (
    <>
      <PageHeader back={paths.product(liner.id, 'abbinamenti')} title="Aggiungi abbinamenti" />
      <p className="-mt-2 mb-2 text-[13px] text-muted-foreground">
        Seleziona i prodotti labbra che ti piacciono con {fullName(liner)}.
      </p>

      {candidates.length === 0 ? (
        <EmptyState
          icon={<BeautyIcon name="lipstick" />}
          title="Nessun prodotto labbra"
          description="Aggiungi all'inventario rossetti, gloss, lip oil o balsami colorati: poi potrai abbinarli a questa matita."
        >
          <Button asChild size="lg">
            <Link to={paths.productNew({ categoryId: 'makeup', subcategoryId: LIP_SUBCATEGORY })}>
              Aggiungi un prodotto labbra
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          {candidates.length > 6 && (
            <Input
              type="search"
              aria-label="Cerca un prodotto"
              placeholder="Cerca un prodotto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="my-[5px]"
            />
          )}
          {types.length > 1 && (
            <ChipRow>
              <Chip on={type === null} onClick={() => setType(null)}>
                Tutti
              </Chip>
              {types.map((t) => (
                <Chip key={t} on={type === t} onClick={() => setType(type === t ? null : t)}>
                  {t}
                </Chip>
              ))}
            </ChipRow>
          )}
          <RowList>
            {visible.map((p) => (
              <SelectableProductRow
                key={p.id}
                product={p}
                checked={chosen.has(p.id)}
                onCheckedChange={(on) => toggle(p.id, on)}
              />
            ))}
            {visible.length === 0 && (
              <p className="py-6 text-center text-[13px] text-muted-foreground">Nessun prodotto trovato.</p>
            )}
          </RowList>
          <StickyAction>
            <Button size="lg" className="shadow-float" onClick={save}>
              Salva abbinamenti ({chosen.size})
            </Button>
          </StickyAction>
        </>
      )}
    </>
  )
}

// ---------- Crea una nuova combo ----------

export function ComboNewView({ linerId }: { linerId: string }) {
  const liner = useLiner(linerId)
  return liner ? <ComboWizard key={liner.id} liner={liner} /> : <NotALiner />
}

type Step = 'select' | 'details' | 'done'

function ComboWizard({ liner }: { liner: Product }) {
  const { data, dispatch } = useStore()
  const ids = { name: useId(), favorite: useId(), note: useId() }
  const paired = liner.pairings.map((pid) => data.products.find((p) => p.id === pid)).filter((p) => p !== undefined)
  const [step, setStep] = useState<Step>('select')
  const [chosen, setChosen] = useState(() => new Set(paired.map((p) => p.id)))
  const [name, setName] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState<LipCombo | null>(null)
  const go = (next: Step) => {
    setStep(next)
    window.scrollTo(0, 0)
  }

  const selected = paired.filter((p) => chosen.has(p.id))
  const items = [liner, ...selected]
  const draft: LipCombo = {
    id: '',
    name: '',
    productIds: items.map((p) => p.id),
    favorite: false,
    note: '',
    createdAt: '',
    updatedAt: '',
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const now = nowIso()
    const combo: LipCombo = {
      id: newId(),
      name: name.trim(),
      productIds: items.map((p) => p.id),
      favorite,
      note: note.trim(),
      createdAt: now,
      updatedAt: now,
    }
    dispatch({ type: 'combo/save', combo })
    setSaved(combo)
    go('done')
  }

  if (step === 'done' && saved) {
    return (
      <div className="px-[18px] pt-16 pb-6 text-center">
        <div className="mx-auto grid size-[95px] place-items-center rounded-full border border-ring bg-[#f7e3e7] text-primary">
          <Check className="size-12" strokeWidth={2.5} />
        </div>
        <h1 className="mt-5 flex items-center justify-center gap-1.5 text-[21px] font-bold">
          Combo salvata! <Sparkles className="size-5 text-primary" aria-hidden />
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">La tua combo è stata aggiunta alle Lip Combo.</p>
        <div className="mt-6 flex flex-col gap-[9px]">
          <Button size="lg" onClick={() => navigate(paths.combo(saved.id), { replace: true })}>
            Vedi la combo
          </Button>
          <Button variant="outline" size="lg" onClick={() => goBack(paths.product(liner.id, 'abbinamenti'))}>
            Torna alla matita
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'details') {
    return (
      <form onSubmit={submit}>
        <PageHeader title="Dettagli della combo" onBack={() => go('select')} />
        <Hero className="mb-2 text-center">
          <ComboIcons products={items} />
          <p className="mt-1 text-[13px] text-muted-foreground">{items.map(fullName).join(' + ')}</p>
        </Hero>
        <FormField label="Nome combo" htmlFor={ids.name}>
          <Input
            id={ids.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={comboTitle(draft, data.products)}
          />
        </FormField>
        <SwitchLine id={ids.favorite} checked={favorite} onChange={setFavorite}>
          <Heart className="size-4.5 fill-primary text-primary" /> Segna come preferita
        </SwitchLine>
        <FormField label="Nota (opzionale)" htmlFor={ids.note}>
          <Textarea
            id={ids.note}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. Perfetta per tutti i giorni. Naturale ma luminosa."
          />
        </FormField>
        <Button type="submit" size="lg" className="mt-2 w-full">
          Salva combo
        </Button>
      </form>
    )
  }

  return (
    <>
      <PageHeader back={paths.product(liner.id, 'abbinamenti')} title="Crea una nuova combo" />
      <p className="-mt-2 text-[13px] text-muted-foreground">Seleziona i prodotti che vuoi includere nella combo.</p>

      <SectionTitle>Matita (obbligatoria)</SectionTitle>
      <Row media={<ProductThumb product={liner} />} title={liner.brand || liner.name} subtitle={liner.brand ? liner.name : ''} />

      <SectionTitle>Prodotti abbinati</SectionTitle>
      {paired.length === 0 ? (
        <EmptyState icon={<BeautyIcon name="lipstick" />} title="Nessun abbinamento" description="Prima scegli con quali prodotti labbra sta bene questa matita.">
          <Button asChild size="lg">
            <Link to={paths.productPairings(liner.id)}>Aggiungi abbinamenti</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <RowList>
            {paired.map((p) => (
              <SelectableProductRow
                key={p.id}
                product={p}
                checked={chosen.has(p.id)}
                onCheckedChange={(on) =>
                  setChosen((prev) => {
                    const next = new Set(prev)
                    if (on) next.add(p.id)
                    else next.delete(p.id)
                    return next
                  })
                }
              />
            ))}
          </RowList>
          <StickyAction>
            <Button size="lg" className="shadow-float" disabled={selected.length === 0} onClick={() => go('details')}>
              {selected.length === 0 ? 'Seleziona almeno un prodotto' : 'Avanti'}
            </Button>
          </StickyAction>
        </>
      )}
    </>
  )
}
