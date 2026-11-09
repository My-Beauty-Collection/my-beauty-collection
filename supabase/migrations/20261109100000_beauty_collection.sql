-- Beauty Collection: requisiti consolidati.
-- Scheda prodotto essenziale (valutazione, foto), wishlist strutturata, Lip Combo, foto su Storage.
-- Applicata con: npx supabase db push --remote

-- ---------- Prodotti: valutazione e foto ----------
alter table public.products add column if not exists rating smallint check (rating between 1 and 5);
alter table public.products add column if not exists photo text;

-- Colonne della prima versione non più usate dall'app: restano (con i loro valori) finché non si decide di eliminarle.
comment on column public.products.shade is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.size is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.price is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.purchase_date is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.finished_date is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.custom_type is 'Non più usata dall''app (requisiti Beauty Collection)';
comment on column public.products.pairing_ideas is 'Non più usata dall''app (requisiti Beauty Collection)';

-- ---------- Wishlist: dati strutturati da passare all'inventario ----------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wish_items' and column_name = 'text'
  ) then
    alter table public.wish_items rename column text to name;
  end if;
end $$;

alter table public.wish_items add column if not exists brand text not null default '';
alter table public.wish_items add column if not exists category_id text not null default '';
alter table public.wish_items add column if not exists subcategory_id text not null default '';
alter table public.wish_items add column if not exists type_id text;

-- I desideri "già presi" della prima versione sono già passati all'inventario.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wish_items' and column_name = 'bought'
  ) then
    delete from public.wish_items where bought;
    alter table public.wish_items drop column bought;
  end if;
end $$;

-- ---------- Lip Combo ----------
create table if not exists public.lip_combos (
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id          text        not null,
  name        text        not null default '',
  product_ids text[]      not null check (cardinality(product_ids) >= 2),
  favorite    boolean     not null default false,
  note        text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.lip_combos enable row level security;

drop policy if exists "lip_combos: solo le proprie" on public.lip_combos;
create policy "lip_combos: solo le proprie" on public.lip_combos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- Impostazioni: soglie dei promemoria non più previste ----------
drop table if exists public.user_settings;

-- ---------- Foto prodotti (Storage privato, una cartella per utente) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-photos', 'product-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "product-photos: lettura propria" on storage.objects;
create policy "product-photos: lettura propria" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "product-photos: caricamento proprio" on storage.objects;
create policy "product-photos: caricamento proprio" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "product-photos: modifica propria" on storage.objects;
create policy "product-photos: modifica propria" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'product-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "product-photos: eliminazione propria" on storage.objects;
create policy "product-photos: eliminazione propria" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
