import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { activateTaxonomy, type Taxonomy } from './data/taxonomy'
import { todayIso } from './lib/dates'
import { deletePhoto, savePhoto } from './lib/photos'
import { computeWarnings, type ProductWarning } from './lib/products'
import { reducer, type Action } from './lib/reducer'
import { emptyData, loadData, saveData } from './lib/storage'
import { supabase } from './lib/supabase'
import { diffData, fetchAll, hasChanges, pushChanges } from './lib/sync'
import type { AppData } from './lib/types'

export type AuthState =
  | { status: 'local' }
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'load-error'; message: string }
  | { status: 'ready'; email: string }

export type SyncState = 'saved' | 'saving' | 'error'

interface Store {
  data: AppData
  dispatch: (action: Action) => void
  today: string
  /** Prodotti con PAO superato o scaduti. */
  warnings: ProductWarning[]
  /** Catalogo in uso: voci predefinite più quelle personali dell'utente. */
  taxonomy: Taxonomy
  auth: AuthState
  sync: SyncState
  syncError: string | null
  retry: () => void
  signOut: () => Promise<void>
  /** Salva una foto (Storage o data URL) e restituisce il valore da mettere nel prodotto. */
  uploadPhoto: (file: Blob, productId: string) => Promise<string>
  removePhoto: (photo: string | null) => void
  /** Nome per il saluto in Home ("Ciao …"); stringa vuota se non impostato. */
  displayName: string
  setDisplayName: (name: string) => Promise<void>
}

/** In modalità locale il nome resta in questo browser; con Supabase sta nei metadati dell'utente. */
const NAME_KEY = 'my-beauty-case:name'

function metadataName(metadata: Record<string, unknown> | undefined): string {
  const name = metadata?.display_name
  return typeof name === 'string' ? name : ''
}

const StoreContext = createContext<Store | null>(null)

/** Recompute "today" when the app comes back to the foreground (e.g. PWA left open overnight). */
function useToday(): string {
  const [today, setToday] = useState(todayIso)
  useEffect(() => {
    const refresh = () => setToday(todayIso())
    document.addEventListener('visibilitychange', refresh)
    const timer = setInterval(refresh, 60 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      clearInterval(timer)
    }
  }, [])
  return today
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') return err.message
  return 'Errore sconosciuto'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, () => (supabase ? emptyData() : loadData()))
  const [auth, setAuth] = useState<AuthState>(supabase ? { status: 'loading' } : { status: 'local' })
  const [sync, setSync] = useState<SyncState>('saved')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [displayName, setDisplayNameState] = useState(() => (supabase ? '' : (localStorage.getItem(NAME_KEY) ?? '')))
  const today = useToday()

  // Stato remoto: ultimo contenuto noto del database (null = non ancora caricato).
  const remoteRef = useRef<AppData | null>(null)
  const latestRef = useRef(data)
  const userRef = useRef<{ id: string; email: string } | null>(null)
  // Le operazioni verso il server vengono eseguite una alla volta, in ordine.
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  const enqueue = useCallback((task: () => Promise<void>) => {
    queueRef.current = queueRef.current.then(task, task)
  }, [])

  /** Invia al server la differenza tra l'ultimo stato salvato e quello attuale. */
  const scheduleSync = useCallback(() => {
    enqueue(async () => {
      const user = userRef.current
      const base = remoteRef.current
      if (!supabase || !user || !base) return
      const target = latestRef.current
      const changes = diffData(base, target)
      if (!hasChanges(changes)) return
      setSync('saving')
      try {
        await pushChanges(supabase, user.id, changes)
        if (userRef.current?.id !== user.id) return
        remoteRef.current = target
        setSyncError(null)
        setSync(latestRef.current === target ? 'saved' : 'saving')
      } catch (err) {
        // remoteRef resta invariato: al prossimo tentativo si reinviano anche queste modifiche.
        setSync('error')
        setSyncError(errorMessage(err))
      }
    })
  }, [enqueue])

  const loadRemote = useCallback(
    (user: { id: string; email: string }) => {
      enqueue(async () => {
        if (!supabase) return
        try {
          const remote = await fetchAll(supabase)
          if (userRef.current?.id !== user.id) return
          remoteRef.current = remote
          latestRef.current = remote
          dispatch({ type: 'data/replace', data: remote })
          setAuth({ status: 'ready', email: user.email })
        } catch (err) {
          setAuth({ status: 'load-error', message: errorMessage(err) })
        }
      })
    },
    [enqueue],
  )

  // Sessione Supabase.
  useEffect(() => {
    if (!supabase) return
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (!user) {
        userRef.current = null
        remoteRef.current = null
        latestRef.current = emptyData()
        dispatch({ type: 'data/replace', data: latestRef.current })
        setAuth({ status: 'signed-out' })
        setDisplayNameState('')
        return
      }
      setDisplayNameState(metadataName(user.user_metadata))
      if (userRef.current?.id === user.id) return // es. rinnovo del token o profilo aggiornato
      userRef.current = { id: user.id, email: user.email ?? '' }
      setAuth({ status: 'loading' })
      // Le chiamate a Supabase dentro questo callback vanno rimandate (vedi documentazione supabase-js).
      const current = userRef.current
      setTimeout(() => loadRemote(current), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [loadRemote])

  // Ogni modifica: salvataggio locale (modalità locale) o sincronizzazione col server.
  useEffect(() => {
    latestRef.current = data
    if (!supabase) saveData(data)
    else if (remoteRef.current) scheduleSync()
  }, [data, scheduleSync])

  // Tornando sull'app (es. dopo averla usata da un altro dispositivo) ricarica i dati, se non ci sono modifiche in sospeso.
  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      enqueue(async () => {
        const user = userRef.current
        const base = remoteRef.current
        const before = latestRef.current
        if (!user || !base || hasChanges(diffData(base, before))) return
        try {
          const remote = await fetchAll(client)
          if (userRef.current?.id !== user.id || latestRef.current !== before) return
          remoteRef.current = remote
          latestRef.current = remote
          dispatch({ type: 'data/replace', data: remote })
        } catch {
          // Offline o errore temporaneo: si riproverà alla prossima occasione.
        }
      })
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', scheduleSync)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', scheduleSync)
    }
  }, [enqueue, scheduleSync])

  // Avvisa prima di chiudere la pagina se ci sono modifiche non salvate.
  useEffect(() => {
    if (sync === 'saved') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [sync])

  useEffect(() => {
    // In modalità locale chiede al browser di non cancellare i dati in caso di poco spazio.
    if (!supabase) void navigator.storage?.persist?.()
  }, [])

  const retry = useCallback(() => {
    if (auth.status === 'load-error' && userRef.current) {
      setAuth({ status: 'loading' })
      loadRemote(userRef.current)
    } else {
      scheduleSync()
    }
  }, [auth.status, loadRemote, scheduleSync])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const uploadPhoto = useCallback(
    (file: Blob, productId: string) => savePhoto(file, productId, userRef.current?.id ?? null),
    [],
  )
  const removePhoto = useCallback((photo: string | null) => {
    void deletePhoto(photo).catch(() => {})
  }, [])

  const setDisplayName = useCallback(async (name: string) => {
    const value = name.trim()
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ data: { display_name: value } })
      if (error) throw error
    } else if (value) {
      localStorage.setItem(NAME_KEY, value)
    } else {
      localStorage.removeItem(NAME_KEY)
    }
    setDisplayNameState(value)
  }, [])

  // Il catalogo personale va attivato prima di disegnare le pagine, che lo leggono (getCategory ecc.).
  const taxonomy = useMemo(() => activateTaxonomy(data.customTaxonomy), [data.customTaxonomy])
  const warnings = useMemo(() => computeWarnings(data.products, today), [data.products, today])
  const value = useMemo(
    () => ({
      data,
      dispatch,
      today,
      warnings,
      taxonomy,
      auth,
      sync,
      syncError,
      retry,
      signOut,
      uploadPhoto,
      removePhoto,
      displayName,
      setDisplayName,
    }),
    [data, today, warnings, taxonomy, auth, sync, syncError, retry, signOut, uploadPhoto, removePhoto, displayName, setDisplayName],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
