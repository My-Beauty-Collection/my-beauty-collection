import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// Va bene sia la "anon key" classica sia la nuova "publishable key" (sb_publishable_...).
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Client Supabase, oppure null se le variabili d'ambiente non sono impostate:
 * in quel caso l'app funziona in modalità locale (dati nel browser).
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
