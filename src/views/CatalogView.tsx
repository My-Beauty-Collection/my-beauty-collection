/**
 * Gestione del catalogo: le voci predefinite (uguali per tutti) si vedono ma non si modificano;
 * l'utente può aggiungere categorie, sottocategorie e (nel Make-up) tipologie solo per sé,
 * e poi rinominarle, cambiarne l'icona o eliminarle.
 */
import { ChevronRight, Pencil, Plus, SearchX, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { BeautyIcon } from '../components/BeautyIcon'
import { BEAUTY_ICONS, type BeautyIconName } from '../components/beauty-icons'
import { ConfirmDialog, EmptyState, FormField, Link, PageHeader, Row, RowList, Thumb } from '../components/common'
import { CUSTOM_PREFIX, customDescendants, OTHER_ICON, usesTypes, type Category, type Subcategory } from '../data/taxonomy'
import { newId } from '../lib/products'
import type { CustomLevel, CustomTaxonomyItem } from '../lib/types'
import { goBack, paths } from '../router'
import { useStore } from '../store'

const LEVEL_NAME: Record<CustomLevel, string> = { category: 'categoria', subcategory: 'sottocategoria', type: 'tipologia' }
const ICON_NAMES = Object.keys(BEAUTY_ICONS) as BeautyIconName[]
const MAX_NAME = 40

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const nowIso = () => new Date().toISOString()

/** "Predefinita" o "Tua", seguito dal contenuto della voce. */
function Origin({ custom, children }: { custom?: boolean; children?: ReactNode }) {
  return (
    <>
      {custom ? <span className="font-bold text-rose-ink">Tua</span> : 'Predefinita'}
      {children && <> · {children}</>}
    </>
  )
}

/** Matita per modificare una voce personale (sopra il link della riga). */
function EditLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      to={paths.catalogEdit(id)}
      aria-label={`Modifica ${name}`}
      className="grid size-10 place-items-center rounded-full text-rose-ink outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      <Pencil className="size-[18px]" />
    </Link>
  )
}

/**
 * A destra della riga: matita (solo voci personali) e freccia se la riga si apre.
 * `undefined` lascia a Row la sua freccia predefinita.
 */
function rowEnd({ id, name, custom, opens }: { id: string; name: string; custom?: boolean; opens: boolean }): ReactNode {
  if (!custom) return opens ? undefined : null
  return (
    <>
      <EditLink id={id} name={name} />
      {opens && <ChevronRight className="size-5 text-foreground/70" aria-hidden />}
    </>
  )
}

function AddButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="lg" className="mt-3 w-full">
      <Link to={to}>
        <Plus className="size-5" /> {children}
      </Link>
    </Button>
  )
}

function NotFound({ back }: { back: string }) {
  return (
    <>
      <PageHeader back={back} />
      <EmptyState icon={<SearchX />} title="Voce non trovata" description="Potrebbe essere stata eliminata." />
    </>
  )
}

// ---------- Categorie ----------

export function CatalogHome() {
  const { taxonomy } = useStore()
  return (
    <>
      <PageHeader
        back={paths.inventory}
        title="Categorie"
        subtitle="Le categorie predefinite sono uguali per tutti. Puoi aggiungerne di tue, che vedi solo tu."
      />
      <RowList>
        {taxonomy.categories.map((c) => (
          <Row
            key={c.id}
            to={paths.catalogCategory(c.id)}
            media={<Thumb icon={c.icon} />}
            title={c.name}
            subtitle={
              <Origin custom={c.custom}>
                {c.subcategories.length ? plural(c.subcategories.length, 'sottocategoria', 'sottocategorie') : null}
              </Origin>
            }
            trailing={rowEnd({ id: c.id, name: c.name, custom: c.custom, opens: true })}
          />
        ))}
      </RowList>
      <AddButton to={paths.catalogNew('category')}>Aggiungi categoria</AddButton>
    </>
  )
}

// ---------- Sottocategorie di una categoria ----------

export function CatalogCategory({ categoryId }: { categoryId: string }) {
  const { taxonomy } = useStore()
  const category = taxonomy.getCategory(categoryId)
  if (!category) return <NotFound back={paths.catalog} />
  const typed = usesTypes(category.id)

  return (
    <>
      <PageHeader
        back={paths.catalog}
        title={category.name}
        subtitle={
          typed
            ? 'Apri una zona per vederne le tipologie e aggiungerne di tue.'
            : category.subcategories.length === 0
              ? 'Nessuna sottocategoria: i prodotti si vedono tutti insieme.'
              : undefined
        }
        actions={category.custom && <EditLink id={category.id} name={category.name} />}
      />
      {category.subcategories.length > 0 && (
        <RowList>
          {category.subcategories.map((s) => (
            <Row
              key={s.id}
              to={typed ? paths.catalogSubcategory(category.id, s.id) : undefined}
              media={<Thumb icon={s.icon} />}
              title={s.name}
              subtitle={
                <Origin custom={s.custom}>{typed ? plural(s.types.length, 'tipologia', 'tipologie') : null}</Origin>
              }
              trailing={rowEnd({ id: s.id, name: s.name, custom: s.custom, opens: typed })}
            />
          ))}
        </RowList>
      )}
      <AddButton to={paths.catalogNew('subcategory', category.id)}>Aggiungi sottocategoria</AddButton>
    </>
  )
}

// ---------- Tipologie di una sottocategoria (Make-up) ----------

export function CatalogSubcategory({ categoryId, subcategoryId }: { categoryId: string; subcategoryId: string }) {
  const { taxonomy } = useStore()
  const back = paths.catalogCategory(categoryId)
  const subcategory = taxonomy.getSubcategory(subcategoryId)
  if (!subcategory || taxonomy.categoryOf(subcategoryId)?.id !== categoryId || !usesTypes(categoryId)) {
    return <NotFound back={back} />
  }

  return (
    <>
      <PageHeader
        back={back}
        title={subcategory.name}
        subtitle={taxonomy.getCategory(categoryId)?.name}
        actions={subcategory.custom && <EditLink id={subcategory.id} name={subcategory.name} />}
      />
      {subcategory.types.length > 0 ? (
        <RowList>
          {subcategory.types.map((t) => (
            <Row
              key={t.id}
              media={<Thumb icon={t.icon} />}
              title={t.name}
              subtitle={<Origin custom={t.custom} />}
              trailing={rowEnd({ id: t.id, name: t.name, custom: t.custom, opens: false })}
            />
          ))}
        </RowList>
      ) : (
        <p className="text-[13px] text-muted-foreground">Nessuna tipologia: i prodotti si vedono tutti insieme.</p>
      )}
      <AddButton to={paths.catalogNew('type', subcategory.id)}>Aggiungi tipologia</AddButton>
    </>
  )
}

// ---------- Nuova voce / modifica ----------

function IconPicker({ value, onChange }: { value: BeautyIconName; onChange: (icon: BeautyIconName) => void }) {
  return (
    <div role="group" aria-label="Icona" className="grid grid-cols-6 gap-1.5">
      {ICON_NAMES.map((name) => {
        const on = name === value
        return (
          <button
            key={name}
            type="button"
            aria-pressed={on}
            aria-label={name.replaceAll('-', ' ')}
            title={name.replaceAll('-', ' ')}
            onClick={() => onChange(name)}
            className={cn(
              'grid aspect-square place-items-center rounded-[11px] outline-none focus-visible:ring-3 focus-visible:ring-ring/60 [&>svg]:size-6',
              on ? 'bg-primary text-primary-foreground' : 'bg-thumb text-rose-ink hover:bg-accent',
            )}
          >
            <BeautyIcon name={name} />
          </button>
        )
      })}
    </div>
  )
}

type FormMode = { kind: 'new'; level: CustomLevel; parentId: string } | { kind: 'edit'; id: string }

/** Pagina a cui tornare dopo il salvataggio: quella che elenca la voce. */
function listPath(level: CustomLevel, parentId: string, category?: Category): string {
  if (level === 'category') return paths.catalog
  if (level === 'subcategory') return paths.catalogCategory(parentId)
  return category ? paths.catalogSubcategory(category.id, parentId) : paths.catalog
}

export function CatalogItemForm({ mode }: { mode: FormMode }) {
  const { data, dispatch, taxonomy } = useStore()
  const nameId = useId()
  const existing = mode.kind === 'edit' ? data.customTaxonomy.find((i) => i.id === mode.id) : undefined
  const level = existing?.level ?? (mode.kind === 'new' ? mode.level : 'category')
  const parentId = existing?.parentId ?? (mode.kind === 'new' ? mode.parentId : '')

  // Genitore: categoria (per una sottocategoria) o sottocategoria (per una tipologia).
  const parentCategory: Category | undefined =
    level === 'subcategory' ? taxonomy.getCategory(parentId) : level === 'type' ? taxonomy.categoryOf(parentId) : undefined
  const parentSub: Subcategory | undefined = level === 'type' ? taxonomy.getSubcategory(parentId) : undefined
  const parentIcon = parentSub?.icon ?? parentCategory?.icon ?? OTHER_ICON

  const [name, setName] = useState(existing?.name ?? '')
  const [icon, setIcon] = useState<BeautyIconName>(existing?.icon ?? parentIcon)
  const [submitted, setSubmitted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const back = listPath(level, parentId, parentCategory)
  if (deleted) return null
  const parentMissing =
    (level === 'subcategory' && !parentCategory) || (level === 'type' && (!parentSub || !usesTypes(parentCategory?.id ?? '')))
  if ((mode.kind === 'edit' && !existing) || parentMissing) return <NotFound back={back} />

  const what = LEVEL_NAME[level]
  const siblings =
    level === 'category'
      ? taxonomy.categories
      : level === 'subcategory'
        ? (parentCategory?.subcategories ?? [])
        : (parentSub?.types ?? [])
  const clean = name.trim()
  const duplicate = siblings.some((s) => s.id !== existing?.id && s.name.toLocaleLowerCase('it') === clean.toLocaleLowerCase('it'))
  const error = !clean ? `Inserisci il nome della ${what}` : duplicate ? `Esiste già una ${what} con questo nome` : null

  const where =
    level === 'subcategory' ? parentCategory?.name : level === 'type' ? `${parentCategory?.name} › ${parentSub?.name}` : null

  const save = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (error) return
    const item: CustomTaxonomyItem = existing
      ? { ...existing, name: clean, icon }
      : { id: `${CUSTOM_PREFIX}${newId()}`, level, parentId, name: clean, icon, createdAt: nowIso() }
    dispatch({ type: 'taxonomy/save', item })
    toast.success(existing ? 'Modifiche salvate' : `${what[0].toUpperCase()}${what.slice(1)} aggiunta`)
    goBack(back)
  }

  // Cosa succede eliminando: voci contenute e prodotti/desideri da riassegnare.
  const removed = existing ? customDescendants(data.customTaxonomy, existing.id) : new Set<string>()
  const uses = (x: { categoryId: string; subcategoryId: string; typeId: string | null }) =>
    removed.has(x.categoryId) || removed.has(x.subcategoryId) || (x.typeId !== null && removed.has(x.typeId))
  const affected = data.products.filter(uses).length + data.wishlist.filter(uses).length
  const children = removed.size - 1
  const destination =
    level === 'category'
      ? 'in "Altro", da riassegnare a una categoria'
      : level === 'subcategory'
        ? `in "${parentCategory?.name}", senza sottocategoria`
        : `in "${parentSub?.name}", senza tipologia`

  const remove = () => {
    if (!existing) return
    setDeleted(true)
    dispatch({ type: 'taxonomy/delete', id: existing.id })
    toast.success(`"${existing.name}" eliminata`)
    goBack(back)
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        back={back}
        title={existing ? `Modifica ${what}` : `Nuova ${what}`}
        subtitle={where ? `In ${where}` : 'Visibile solo a te.'}
      />

      <FormField label="Nome *" htmlFor={nameId} error={submitted ? error : null}>
        <div className="flex items-center gap-3">
          <Thumb icon={icon} className="h-12 w-12" />
          <Input
            id={nameId}
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder={level === 'category' ? 'es. Unghie' : level === 'subcategory' ? 'es. Tonici' : 'es. Matite kajal'}
            aria-invalid={submitted && Boolean(error)}
            className="flex-1"
          />
        </div>
      </FormField>

      <FormField label="Icona">
        <IconPicker value={icon} onChange={setIcon} />
      </FormField>

      <Button type="submit" size="lg" className="mt-[9px] w-full">
        {existing ? 'Salva modifiche' : `Aggiungi ${what}`}
      </Button>

      {existing && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="mt-2 w-full text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-4" /> Elimina {what}
        </Button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Eliminare la ${what}?`}
        description={[
          `"${existing?.name}" verrà eliminata`,
          children > 0 ? ` insieme a ${plural(children, 'voce', 'voci')} che contiene` : '',
          '. ',
          affected > 0
            ? `${plural(affected, 'prodotto o desiderio resta', 'prodotti o desideri restano')} ${destination}.`
            : 'Nessun prodotto la usa.',
        ].join('')}
        confirmLabel="Elimina"
        destructive
        onConfirm={remove}
      />
    </form>
  )
}
