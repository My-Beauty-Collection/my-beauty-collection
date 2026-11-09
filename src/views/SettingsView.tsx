import { Download, LogOut, Pencil, Sparkles, Trash2, Upload } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { cardClass, ConfirmDialog, FormField, Link, PageHeader, SectionTitle } from '../components/common'
import { demoData } from '../data/demo'
import { emptyData, exportFileName, parseData } from '../lib/storage'
import type { AppData } from '../lib/types'
import { paths } from '../router'
import { useStore } from '../store'

function NameForm() {
  const { displayName, setDisplayName } = useStore()
  const id = useId()
  const [name, setName] = useState(displayName)
  const [saving, setSaving] = useState(false)
  const dirty = name.trim() !== displayName

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDisplayName(name)
      toast.success(name.trim() ? `Ciao ${name.trim()} ♡` : 'Nome rimosso')
    } catch {
      toast.error('Salvataggio non riuscito', { description: 'Controlla la connessione e riprova.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <FormField label="Il tuo nome (per il saluto in Home)" htmlFor={id} className="mb-0 flex-1">
        <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Michela" autoComplete="given-name" />
      </FormField>
      <Button type="submit" className="h-12 px-4" disabled={!dirty || saving}>
        {saving && <Spinner />} Salva
      </Button>
    </form>
  )
}

export function SettingsView() {
  const { data, dispatch, today, auth, sync, signOut, removePhoto } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<AppData | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const customCount = data.customTaxonomy.length

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName(today)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Backup esportato')
  }

  const readImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPendingImport(parseData(await file.text()))
    } catch (err) {
      toast.error('Import non riuscito', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <>
      <PageHeader title="Impostazioni" />

      <SectionTitle className="mt-0">Profilo</SectionTitle>
      <div className={cn(cardClass, 'p-4')}>
        <NameForm />
        {auth.status === 'ready' ? (
          <div className="mt-4 flex items-center gap-3 border-t pt-4">
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="text-muted-foreground">Accesso come</p>
              <p className="truncate font-bold">{auth.email}</p>
            </div>
            <Button variant="outline" className="h-10 px-3.5" onClick={() => (sync === 'saved' ? void signOut() : setConfirmSignOut(true))}>
              <LogOut className="size-4" /> Esci
            </Button>
          </div>
        ) : (
          <p className="mt-4 border-t pt-4 text-[13px] text-muted-foreground">
            Modalità locale: i dati restano solo in questo browser. Per salvarli su Supabase configura{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> e{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code> (vedi README).
          </p>
        )}
      </div>

      <SectionTitle>Categorie</SectionTitle>
      <div className={cn(cardClass, 'p-4')}>
        <p className="text-[13px] text-muted-foreground">
          Le categorie predefinite sono uguali per tutti. Puoi aggiungere categorie, sottocategorie e tipologie solo
          tue: {customCount ? `ne hai ${customCount}.` : 'per ora non ne hai.'}
        </p>
        <Button asChild variant="outline" className="mt-3 h-11 w-full">
          <Link to={paths.catalog}>
            <Pencil className="size-4" /> Gestisci categorie
          </Link>
        </Button>
      </div>

      <SectionTitle>Backup</SectionTitle>
      <div className={cn(cardClass, 'p-4')}>
        <p className="text-[13px] text-muted-foreground">
          Esporta tutti i dati in un file JSON, da conservare come copia di sicurezza o da reimportare in seguito.
          L'importazione sostituisce i dati attuali.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-11" onClick={exportData}>
            <Download className="size-4" /> Esporta
          </Button>
          <Button variant="outline" className="h-11" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" /> Importa
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={readImport} />
        </div>
      </div>

      <SectionTitle>Dati</SectionTitle>
      <div className={cn(cardClass, 'p-4')}>
        <p className="text-[13px] text-muted-foreground">
          {data.products.length} prodotti · {data.combos.length} Lip Combo · {data.wishlist.length} desideri in
          wishlist · {customCount} voci personali del catalogo.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => {
              dispatch({ type: 'data/append', ...demoData(today) })
              toast.success('Prodotti di esempio aggiunti')
            }}
          >
            <Sparkles className="size-4" /> Aggiungi esempi
          </Button>
          <Button
            variant="ghost"
            className="h-11 text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
            onClick={() => setConfirmWipe(true)}
          >
            <Trash2 className="size-4" /> Cancella tutto
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
        title="Importare il backup?"
        description={
          pendingImport &&
          `Il file contiene ${pendingImport.products.length} prodotti, ${pendingImport.combos.length} Lip Combo, ${pendingImport.wishlist.length} desideri e ${pendingImport.customTaxonomy.length} voci personali del catalogo. Sostituiranno i dati attuali.`
        }
        confirmLabel="Importa"
        onConfirm={() => {
          if (pendingImport) dispatch({ type: 'data/replace', data: pendingImport })
          setPendingImport(null)
          toast.success('Backup importato')
        }}
      />

      <ConfirmDialog
        open={confirmWipe}
        onOpenChange={setConfirmWipe}
        title="Cancellare tutto?"
        description="Verranno eliminati tutti i prodotti, le foto, le Lip Combo, la wishlist e le categorie personali. L'operazione non si può annullare."
        confirmLabel="Cancella tutto"
        destructive
        onConfirm={() => {
          data.products.forEach((p) => removePhoto(p.photo))
          dispatch({ type: 'data/replace', data: emptyData() })
          toast.success('Dati cancellati')
        }}
      />

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Uscire lo stesso?"
        description="Ci sono modifiche non ancora salvate sul server che andranno perse."
        confirmLabel="Esci"
        destructive
        onConfirm={() => void signOut()}
      />
    </>
  )
}
