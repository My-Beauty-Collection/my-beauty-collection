import { CircleAlert, MailCheck, Sparkles } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { BeautyIcon } from '../components/BeautyIcon'
import { cardClass, FormField, SegmentedTabs } from '../components/common'
import { supabase } from '../lib/supabase'

const MIN_PASSWORD = 6

function translateAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email o password non corretti.'
  if (/email not confirmed/i.test(message)) return "Devi prima confermare l'email: apri il link che ti abbiamo mandato."
  if (/already registered|already exists/i.test(message)) return 'Esiste già un account con questa email: accedi.'
  if (/signups? not allowed|signup.*disabled/i.test(message)) return 'La creazione di nuovi account è disattivata.'
  if (/password should be at least/i.test(message)) return `La password deve avere almeno ${MIN_PASSWORD} caratteri.`
  if (/invalid.*email|email.*invalid|validate email/i.test(message)) return 'Indirizzo email non valido.'
  if (/rate limit|too many/i.test(message)) return 'Troppi tentativi: riprova tra qualche minuto.'
  if (/fetch|network/i.test(message)) return 'Impossibile contattare il server. Controlla la connessione.'
  return message
}

type Mode = 'login' | 'signup'

/** Contenitore centrato usato da accesso, caricamento ed errori. */
export function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-[430px] place-items-center bg-background px-4 py-8">
      <div className={cn(cardClass, 'w-full p-6')}>{children}</div>
    </div>
  )
}

/** Simbolo dell'app: cerchio cipria con il rossetto. */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn('grid size-16 place-items-center rounded-full border border-ring bg-[#f7e3e7] text-rose-ink', className)}
      aria-hidden
    >
      <BeautyIcon name="lipstick" className="size-8" />
    </span>
  )
}

export function LoginView() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const ids = { email: useId(), password: useId(), confirm: useId(), name: useId() }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setConfirm('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null)

    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) return setError(`La password deve avere almeno ${MIN_PASSWORD} caratteri.`)
      if (password !== confirm) return setError('Le due password non coincidono.')
    }

    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setError(translateAuthError(error.message))
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        // Dopo la conferma via email si torna a questa stessa app.
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          data: name.trim() ? { display_name: name.trim() } : undefined,
        },
      })
      if (error) return setError(translateAuthError(error.message))
      // Con la conferma email attiva, Supabase non segnala gli account già esistenti: restituisce un utente senza identità.
      if (data.user && data.user.identities?.length === 0) {
        return setError('Esiste già un account con questa email: accedi.')
      }
      // Se la conferma email è disattivata arriva subito una sessione e l'app si apre da sola.
      if (!data.session) setPendingEmail(email.trim())
    } finally {
      setBusy(false)
    }
  }

  if (pendingEmail) {
    return (
      <CenteredCard>
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 grid size-16 place-items-center rounded-full border border-ring bg-[#f7e3e7] text-primary">
            <MailCheck className="size-7" />
          </span>
          <h1 className="text-[21px] font-bold">Conferma la tua email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ti abbiamo mandato un link a <span className="font-medium text-foreground">{pendingEmail}</span>. Aprilo per
            attivare l'account, poi accedi.
          </p>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => {
              setPendingEmail(null)
              switchMode('login')
            }}
          >
            Vai all'accesso
          </Button>
        </div>
      </CenteredCard>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <CenteredCard>
      <form onSubmit={submit} noValidate>
        <div className="mb-6 flex flex-col items-center text-center">
          <AppLogo className="mb-4" />
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Beauty Collection <Sparkles className="size-3.5 text-primary" aria-hidden />
          </p>
          <h1 className="mt-1 text-[28px] leading-tight font-extrabold">{isSignup ? 'Nuovo account' : 'Ciao ♡'}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isSignup ? 'Crea il tuo account per iniziare la tua collezione.' : 'Accedi per vedere la tua Beauty Collection.'}
          </p>
        </div>

        <SegmentedTabs
          ariaLabel="Accesso o registrazione"
          value={mode}
          onChange={switchMode}
          options={[
            { value: 'login', label: 'Accedi' },
            { value: 'signup', label: 'Crea account' },
          ]}
          className="mb-4"
        />

        {isSignup && (
          <FormField label="Come ti chiami? (facoltativo)" htmlFor={ids.name}>
            <Input
              id={ids.name}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Michela"
            />
          </FormField>
        )}
        <FormField label="Email" htmlFor={ids.email}>
          <Input
            id={ids.email}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label="Password" htmlFor={ids.password} hint={isSignup ? `Almeno ${MIN_PASSWORD} caratteri.` : undefined}>
          <Input
            id={ids.password}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {isSignup && (
          <FormField label="Ripeti la password" htmlFor={ids.confirm}>
            <Input
              id={ids.confirm}
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </FormField>
        )}

        {error && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-[11px] bg-destructive/10 p-3 text-[13px] text-destructive-ink">
            <CircleAlert className="mt-px size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-[9px] w-full"
          disabled={busy || !email || !password || (isSignup && !confirm)}
        >
          {busy && <Spinner />}
          {isSignup ? 'Crea account' : 'Accedi'}
        </Button>
      </form>
    </CenteredCard>
  )
}
