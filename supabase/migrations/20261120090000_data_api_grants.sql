-- Permessi espliciti per la Data API.
-- I progetti Supabase più recenti non danno più in automatico i permessi sulle nuove tabelle di `public`
-- ai ruoli dell'API: senza queste GRANT l'app (utente autenticato) riceve "permission denied".
-- Le policy RLS restano il vero controllo: ogni utente vede e modifica solo le proprie righe.
-- Nessun permesso al ruolo `anon`: l'app legge e scrive solo dopo l'accesso.
-- Applicata con: npx supabase db push --remote

grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.wish_items to authenticated;
grant select, insert, update, delete on public.lip_combos to authenticated;
grant select, insert, update, delete on public.custom_taxonomy to authenticated;
