-- POD Studio (TAREK STUDIO) — schéma Supabase. Projet séparé de BES.
-- Toutes les tables : user_id = propriétaire, RLS activée.

create table pod_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  keyword text not null,
  marketplace text not null default 'amazon_us'
    check (marketplace in ('amazon_us','amazon_uk','amazon_de','amazon_fr','amazon_it','amazon_es','amazon_jp','redbubble','teepublic','spreadshirt','etsy')),
  filters jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on pod_searches (user_id, created_at desc);

create table pod_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  marketplace text not null,
  asin text not null,                       -- ASIN Amazon ou identifiant de la plateforme
  title text not null,
  brand text,
  is_official_brand boolean not null default false,
  price_cents integer check (price_cents >= 0),
  currency text not null default 'USD',
  bsr integer check (bsr > 0),
  est_monthly_sales integer check (est_monthly_sales >= 0),  -- estimation à partir du BSR
  reviews integer check (reviews >= 0),
  rating numeric(2,1) check (rating between 0 and 5),
  published_on date,
  product_type text,
  image_url text,                            -- lien seulement, l'image n'est pas copiée
  product_url text,
  source text not null default 'manual' check (source in ('manual','pod_radar','browser','api')),
  favorite boolean not null default false,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, marketplace, asin)
);
create index on pod_products (user_id, bsr);
create index on pod_products (user_id, favorite) where favorite;

create table pod_search_products (
  search_id uuid not null references pod_searches(id) on delete cascade,
  product_id uuid not null references pod_products(id) on delete cascade,
  position integer,
  primary key (search_id, product_id)
);
create index on pod_search_products (product_id);

create table pod_bsr_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references pod_products(id) on delete cascade,
  bsr integer not null check (bsr > 0),
  seen_at timestamptz not null default now()
);
create index on pod_bsr_history (product_id, seen_at);

create table pod_niches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  marketplace text not null default 'amazon_us',
  result_count integer,
  demand_score integer check (demand_score between 0 and 100),
  competition_score integer check (competition_score between 0 and 100),
  score integer check (score between 0 and 100),
  notes text,
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, marketplace, name)
);
create index on pod_niches (user_id, score desc);

create table pod_design_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references pod_products(id) on delete cascade,
  niche_id uuid references pod_niches(id) on delete set null,
  motif text,              -- ce que montre l'illustration
  motif_style text,        -- vintage, cartoon, line art, typographique seul…
  design_text text,        -- texte écrit sur le design
  font_style text,         -- serif gras, script, distressed…
  layout text,             -- texte au-dessus / dessous / autour du motif…
  colors text[] not null default '{}',
  combination text,        -- comment motif et texte se répondent
  why_it_sells text,
  analyzed_by text not null default 'claude' check (analyzed_by in ('claude','gemini','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index on pod_design_analyses (niche_id);

create table pod_design_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  niche_id uuid references pod_niches(id) on delete set null,
  idea text not null,
  design_text text,
  motif_style text,
  font_style text,
  colors text[] not null default '{}',
  layout text,
  prompt text,             -- prompt Ideogram / Gemini
  generator text check (generator in ('ideogram','gemini','fooocus','other')),
  keywords text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft','ready','generated','published','dropped')),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on pod_design_briefs (user_id, status, created_at desc);
create index on pod_design_briefs (niche_id);

create table pod_trademark_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brief_id uuid references pod_design_briefs(id) on delete cascade,
  checked_text text not null,
  results jsonb not null default '[]',   -- [{mot, marque, numero, classe, statut, url}]
  verdict text not null check (verdict in ('ok','warning','error')),
  created_at timestamptz not null default now()
);
create index on pod_trademark_checks (brief_id);

create table pod_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brief_id uuid not null references pod_design_briefs(id) on delete cascade,
  platform text not null check (platform in ('amazon_merch','redbubble','teepublic','spreadshirt')),
  title text not null,
  brand text,
  bullet1 text,
  bullet2 text,
  description text,
  tags text[] not null default '{}',
  price_cents integer check (price_cents >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brief_id, platform)
);

-- RLS : chaque utilisateur ne voit et ne modifie que ses lignes
do $$
declare t text;
begin
  foreach t in array array['pod_searches','pod_products','pod_bsr_history','pod_niches',
    'pod_design_analyses','pod_design_briefs','pod_trademark_checks','pod_listings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy own_rows on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table pod_search_products enable row level security;
create policy own_rows on pod_search_products for all to authenticated
  using (exists (select 1 from pod_searches s where s.id = search_id and s.user_id = auth.uid()))
  with check (exists (select 1 from pod_searches s where s.id = search_id and s.user_id = auth.uid()));

-- updated_at automatique
create or replace function pod_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
revoke execute on function pod_touch() from anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['pod_searches','pod_products','pod_niches','pod_design_analyses','pod_design_briefs','pod_listings'] loop
    execute format('create trigger touch before update on %I for each row execute function pod_touch()', t);
  end loop;
end $$;
