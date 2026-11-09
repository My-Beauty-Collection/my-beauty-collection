-- My Beauty Case: schema iniziale del database Supabase.
-- Applicato con: npx supabase db push (oppure incollandolo in Supabase → SQL Editor).
-- Lo script è idempotente: si può rieseguire senza perdere dati.
--
-- Ogni riga appartiene a un utente (user_id) e le policy RLS permettono
-- a ciascun utente di leggere e modificare solo i propri dati.

-- ---------- Prodotti ----------
create table if not exists public.products (
  user_id        uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id             text        not null,
  name           text        not null check (length(trim(name)) > 0),
  brand          text        not null default '',
  -- Riferimenti alla tassonomia definita nell'app (src/data/taxonomy.ts)
  category_id    text        not null default '',
  subcategory_id text        not null default '',
  type_id        text,
  custom_type    text        not null default '',
  zones          text[]      not null default '{}',
  shade          text        not null default '',
  size           text        not null default '',
  price          numeric(10, 2),
  purchase_date  date,
  opened_date    date,
  expiry_date    date,
  pao_months     integer     check (pao_months is null or pao_months > 0),
  finished_date  date,
  favorite       boolean     not null default false,
  notes          text        not null default '',
  -- Id degli altri prodotti abbinati (relazione simmetrica mantenuta dall'app)
  pairings       text[]      not null default '{}',
  -- Abbinamenti liberi, anche con prodotti non posseduti
  pairing_ideas  text[]      not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists products_user_category_idx on public.products (user_id, category_id, subcategory_id);

-- ---------- Wishlist ----------
create table if not exists public.wish_items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id         text        not null,
  text       text        not null check (length(trim(text)) > 0),
  note       text        not null default '',
  bought     boolean     not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- Impostazioni ----------
create table if not exists public.user_settings (
  user_id               uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  opened_days_threshold integer     not null default 180 check (opened_days_threshold >= 0),
  expiring_soon_days    integer     not null default 30 check (expiring_soon_days >= 0),
  updated_at            timestamptz not null default now()
);

-- ---------- Row Level Security ----------
alter table public.products      enable row level security;
alter table public.wish_items    enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "products: solo i propri" on public.products;
create policy "products: solo i propri" on public.products
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "wish_items: solo i propri" on public.wish_items;
create policy "wish_items: solo i propri" on public.wish_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "user_settings: solo le proprie" on public.user_settings;
create policy "user_settings: solo le proprie" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
