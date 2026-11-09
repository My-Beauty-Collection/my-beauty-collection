import { Gift, Heart, PackagePlus, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CategoryFields } from '../components/CategoryFields'
import { EmptyState, FormField, PageHeader, Row, RowList, Thumb } from '../components/common'
import { getCategory, taxonomyIcon } from '../data/taxonomy'
import { newId, typeLabel } from '../lib/products'
import type { WishItem } from '../lib/types'
import { navigate, paths } from '../router'
import { useStore } from '../store'

function emptyWish(): WishItem {
  return { id: newId(), name: '', brand: '', categoryId: '', subcategoryId: '', typeId: null, note: '', createdAt: new Date().toISOString() }
}

function WishForm({
  initial,
  isNew,
  onSave,
  onDelete,
}: {
  initial: WishItem
  isNew: boolean
  onSave: (item: WishItem) => void
  onDelete: () => void
}) {
  const ids = { brand: useId(), name: useId(), note: useId() }
  const [item, setItem] = useState(initial)
  const [submitted, setSubmitted] = useState(false)
  const set = (patch: Partial<WishItem>) => setItem((w) => ({ ...w, ...patch }))
  const nameError = submitted && !item.name.trim() ? 'Inserisci il nome del prodotto' : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (item.name.trim()) onSave(item)
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col">
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-left text-[21px] font-bold">{isNew ? 'Nuovo desiderio' : 'Modifica desiderio'}</DrawerTitle>
        <DrawerDescription className="text-left text-[13px]">
          Quando lo comprerai, questi dati passeranno alla scheda dell'inventario.
        </DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-vaul-no-drag>
        <FormField label="Marca" htmlFor={ids.brand}>
          <Input id={ids.brand} value={item.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="es. Rhode" />
        </FormField>
        <FormField label="Nome prodotto *" htmlFor={ids.name} error={nameError}>
          <Input
            id={ids.name}
            value={item.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="es. Peptide Lip Treatment"
            aria-invalid={Boolean(nameError)}
          />
        </FormField>
        <CategoryFields value={item} onChange={(ref) => set(ref)} optional />
        <FormField label="Nota" htmlFor={ids.note}>
          <Textarea
            id={ids.note}
            rows={2}
            value={item.note}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="Facoltativa, es. colore, dove trovarlo, prezzo"
          />
        </FormField>
      </div>
      <div className="flex flex-col gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" size="lg">
          Salva
        </Button>
        {!isNew && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
            onClick={onDelete}
          >
            <Trash2 className="size-4" /> Elimina dalla wishlist
          </Button>
        )}
      </div>
    </form>
  )
}

export function WishlistView() {
  const { data, dispatch } = useStore()
  const [editing, setEditing] = useState<{ item: WishItem; isNew: boolean } | null>(null)
  const add = () => setEditing({ item: emptyWish(), isNew: true })

  const remove = (item: WishItem) => {
    dispatch({ type: 'wish/delete', id: item.id })
    toast(`"${item.name}" tolto dalla wishlist`, {
      action: { label: 'Annulla', onClick: () => dispatch({ type: 'wish/save', item }) },
    })
  }

  return (
    <>
      <PageHeader
        title="Wishlist"
        actions={
          <button
            type="button"
            aria-label="Aggiungi un desiderio"
            onClick={add}
            className="grid size-12 place-items-center rounded-[13px] bg-ink text-white outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        }
      />

      {data.wishlist.length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="La wishlist è vuota"
          description="Annota qui i prodotti che non hai ancora e ti piacerebbe provare."
        >
          <Button size="lg" onClick={add}>
            Aggiungi un desiderio
          </Button>
        </EmptyState>
      ) : (
        <>
          <RowList>
            {data.wishlist.map((item) => {
              const where = typeLabel(item) || getCategory(item.categoryId)?.name || ''
              return (
                <Row
                  key={item.id}
                  media={item.categoryId ? <Thumb icon={taxonomyIcon(item)} /> : <Thumb><Gift /></Thumb>}
                  title={
                    <button
                      type="button"
                      onClick={() => setEditing({ item, isNew: false })}
                      className="text-left outline-none after:absolute after:inset-0 after:rounded-[18px] focus-visible:after:ring-3 focus-visible:after:ring-ring/60"
                    >
                      {item.brand || item.name}
                    </button>
                  }
                  subtitle={[item.brand ? item.name : '', where].filter(Boolean).join(' · ')}
                  meta={item.note ? <p className="truncate text-[11.5px] text-[#907a7e]">{item.note}</p> : null}
                  trailing={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1 px-2.5 text-[13px]"
                      onClick={() => navigate(paths.productNew({ wishId: item.id }))}
                      aria-label={`Comprato: sposta ${item.name} nell'inventario`}
                    >
                      <PackagePlus className="size-4" /> Comprato
                    </Button>
                  }
                />
              )
            })}
          </RowList>
          <p className="mt-4 text-center text-[13px] text-muted-foreground">
            Quando lo compri tocca «Comprato»: passa nell'inventario con i dati già inseriti.
          </p>
        </>
      )}

      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} repositionInputs={false}>
        <DrawerContent className="mx-auto max-h-[92dvh] max-w-[430px] bg-background">
          {editing && (
            <WishForm
              key={editing.item.id}
              initial={editing.item}
              isNew={editing.isNew}
              onSave={(item) => {
                dispatch({ type: 'wish/save', item })
                setEditing(null)
              }}
              onDelete={() => {
                remove(editing.item)
                setEditing(null)
              }}
            />
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
