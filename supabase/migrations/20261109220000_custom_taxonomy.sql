-- Catalogo personale: categorie, sottocategorie e tipologie aggiunte da ogni utente solo per sé.
-- Le voci predefinite restano nell'app (src/data/taxonomy.ts), uguali per tutti.
-- Applicata con: npx supabase db push --remote

create table if not exists public.custom_taxonomy (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  -- Sempre con il prefisso "u-", per non confondersi con gli id predefiniti
  id         text        not null check (id like 'u-%'),
  level      text        not null check (level in ('category', 'subcategory', 'type')),
  -- Vuoto per una categoria; la categoria per una sottocategoria; la sottocategoria per una tipologia
  parent_id  text        not null default '',
  name       text        not null check (length(trim(name)) > 0),
  icon       text        not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.custom_taxonomy enable row level security;

drop policy if exists "custom_taxonomy: solo le proprie" on public.custom_taxonomy;
create policy "custom_taxonomy: solo le proprie" on public.custom_taxonomy
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.custom_taxonomy to authenticated;
