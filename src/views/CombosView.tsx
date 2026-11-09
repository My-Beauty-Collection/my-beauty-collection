import { Heart, Plus, SearchX, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  cardClass,
  ConfirmDialog,
  EmptyState,
  FormField,
  Hero,
  Link,
  PageHeader,
  Row,
  RowList,
  SectionTitle,
  SegmentedTabs,
} from '../components/common'
import { BeautyIcon } from '../components/BeautyIcon'
import { ComboIcons, HeartButton, ProductRow } from '../components/ProductRow'
import { LIP_LINER_TYPE, LIP_SUBCATEGORY } from '../data/taxonomy'
import { comboTitle, fullName } from '../lib/products'
import type { LipCombo, Product } from '../lib/types'
import { navigate, paths } from '../router'
import { useStore } from '../store'

/** Le Combo nascono sempre da una matita labbra. */
const linersPath = paths.subcategory('makeup', LIP_SUBCATEGORY, LIP_LINER_TYPE)

function comboItems(combo: LipCombo, products: Product[]): Product[] {
  return combo.productIds.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined)
}

function ComboHeart({ combo }: { combo: LipCombo }) {
  const { data, dispatch } = useStore()
  return (
    <HeartButton
      on={combo.favorite}
      label={comboTitle(combo, data.products)}
      onToggle={() => dispatch({ type: 'combo/patch', id: combo.id, patch: { favorite: !combo.favorite } })}
      className="-mr-1.5"
    />
  )
}

type Filter = 'tutte' | 'preferite'

export function CombosView() {
  const { data } = useStore()
  const [filter, setFilter] = useState<Filter>('tutte')
  const favorites = data.combos.filter((c) => c.favorite)
  const visible = filter === 'preferite' ? favorites : data.combos

  return (
    <>
      <PageHeader title="Lip Combo" />
      <SegmentedTabs
        ariaLabel="Filtra le combo"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'tutte', label: `Tutte (${data.combos.length})` },
          { value: 'preferite', label: `Preferite (${favorites.length})` },
        ]}
      />

      <Link
        to={linersPath}
        className={cn(
          cardClass,
          'mb-2 flex items-center gap-3.5 p-[15px] outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.99]',
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-thumb text-rose-ink" aria-hidden>
          <Plus className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">Nuova combo</span>
          <span className="block text-[13px] text-muted-foreground">Parti da una delle tue matite labbra</span>
        </span>
      </Link>

      {data.combos.length === 0 ? (
        <EmptyState
          icon={<BeautyIcon name="lip-reading" />}
          title="Nessuna Lip Combo"
          description="Apri una matita labbra, scegli i prodotti abbinati da usare insieme e salvali come combo."
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Heart />} title="Nessuna combo preferita" description="Tocca il cuore di una combo per vederla qui." />
      ) : (
        <RowList>
          {visible.map((c) => {
            const items = comboItems(c, data.products)
            return (
              <Row
                key={c.id}
                to={paths.combo(c.id)}
                title={comboTitle(c, data.products)}
                subtitle={c.name.trim() ? items.map(fullName).join(' + ') : `${items.length} prodotti`}
                meta={c.note ? <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#907a7e]">{c.note}</p> : null}
                trailing={<ComboHeart combo={c} />}
              />
            )
          })}
        </RowList>
      )}
    </>
  )
}

export function ComboDetailView({ id }: { id: string }) {
  const { data, dispatch, today } = useStore()
  const ids = { name: useId(), note: useId() }
  const combo = data.combos.find((c) => c.id === id)
  const [name, setName] = useState(combo?.name ?? '')
  const [note, setNote] = useState(combo?.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!combo) {
    return (
      <>
        <PageHeader back={paths.combos} />
        <EmptyState icon={<SearchX />} title="Combo non trovata">
          <Button asChild variant="outline" size="lg">
            <Link to={paths.combos}>Torna alle Lip Combo</Link>
          </Button>
        </EmptyState>
      </>
    )
  }

  const items = comboItems(combo, data.products)
  const dirty = name.trim() !== combo.name || note.trim() !== combo.note

  const save = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'combo/patch', id: combo.id, patch: { name: name.trim(), note: note.trim() } })
    toast.success('Combo aggiornata')
  }

  return (
    <>
      <PageHeader back={paths.combos} actions={<ComboHeart combo={combo} />} />
      <Hero className="mb-4 text-center">
        <ComboIcons products={items} />
        <h1 className="mt-2 text-[21px] leading-tight font-bold text-balance">{comboTitle(combo, data.products)}</h1>
        {combo.note && <p className="mt-1 text-[13px] text-muted-foreground">{combo.note}</p>}
      </Hero>

      <SectionTitle>Prodotti</SectionTitle>
      <RowList>
        {items.map((p) => (
          <ProductRow key={p.id} product={p} today={today} title="full" trailing={null} />
        ))}
      </RowList>

      <SectionTitle>Nome e nota</SectionTitle>
      <form onSubmit={save}>
        <FormField label="Nome combo" htmlFor={ids.name}>
          <Input
            id={ids.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={comboTitle({ ...combo, name: '' }, data.products)}
          />
        </FormField>
        <FormField label="Nota (opzionale)" htmlFor={ids.note}>
          <Textarea id={ids.note} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={!dirty}>
          Salva modifiche
        </Button>
      </form>

      <Button
        variant="ghost"
        size="lg"
        className="mt-[9px] w-full text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
        onClick={() => setConfirmDelete(true)}
      >
        <Trash2 className="size-4" /> Elimina combo
      </Button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminare la combo?"
        description="I prodotti e i loro abbinamenti restano nell'inventario."
        confirmLabel="Elimina"
        destructive
        onConfirm={() => {
          dispatch({ type: 'combo/delete', id: combo.id })
          toast.success('Combo eliminata')
          navigate(paths.combos, { replace: true })
        }}
      />
    </>
  )
}
