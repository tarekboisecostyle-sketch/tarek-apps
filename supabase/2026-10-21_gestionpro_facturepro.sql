-- GestionPro Perso : une ligne par compte, lisible seulement par son propriétaire
create table if not exists public.gp_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  device text,
  source text,
  updated_at timestamptz not null default now()
);
create table if not exists public.gp_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  device text,
  source text,
  saved_at timestamptz not null default now()
);
create index if not exists gp_history_user_idx on public.gp_history(user_id, saved_at desc);
alter table public.gp_state enable row level security;
alter table public.gp_history enable row level security;
drop policy if exists gp_state_own on public.gp_state;
create policy gp_state_own on public.gp_state for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists gp_history_read_own on public.gp_history;
create policy gp_history_read_own on public.gp_history for select to authenticated using (user_id = auth.uid());

create or replace function public.gp_keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.gp_history(user_id, data, device, source) values (new.user_id, new.data, new.device, new.source);
  delete from public.gp_history where user_id = new.user_id and id not in (
    select id from public.gp_history where user_id = new.user_id order by saved_at desc, id desc limit 200);
  return new;
end $$;
drop trigger if exists gp_state_history on public.gp_state;
create trigger gp_state_history after insert or update on public.gp_state for each row execute function public.gp_keep_history();

-- BES FacturePro : une ligne 'main' (même accès que Caisse/Fiches), historique des 200 dernières versions
create table if not exists public.bes_state (
  id text primary key,
  json text not null,
  updated_at bigint not null,
  updated_by text
);
create table if not exists public.bes_state_history (
  hid bigserial primary key,
  id text not null,
  json text not null,
  updated_at bigint,
  updated_by text,
  saved_at timestamptz not null default now()
);
alter table public.bes_state enable row level security;
alter table public.bes_state_history enable row level security;
drop policy if exists bes_state_rw on public.bes_state;
create policy bes_state_rw on public.bes_state for all to anon, authenticated using (true) with check (true);

create or replace function public.bes_keep_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.bes_state_history(id, json, updated_at, updated_by) values (new.id, new.json, new.updated_at, new.updated_by);
  delete from public.bes_state_history where id = new.id and hid not in (
    select hid from public.bes_state_history where id = new.id order by hid desc limit 200);
  return new;
end $$;
drop trigger if exists bes_state_hist on public.bes_state;
create trigger bes_state_hist after insert or update on public.bes_state for each row execute function public.bes_keep_history();

-- Mises à jour en direct entre appareils
do $$ begin
  begin alter publication supabase_realtime add table public.gp_state; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.bes_state; exception when duplicate_object then null; end;
end $$;

-- Table temporaire inutilisée (créée pendant le transfert du code, vide)
drop table if exists public.tmp_transfer;
