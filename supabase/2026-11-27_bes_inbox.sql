-- Boîte d'import BES : Claude y dépose un JSON bes-import-v1, FacturePro le propose à l'ouverture (confirmation) puis le marque 'done'
create table if not exists public.bes_inbox (
  id bigserial primary key,
  label text,
  payload jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  done_at timestamptz
);
alter table public.bes_inbox enable row level security;
drop policy if exists bes_inbox_rw on public.bes_inbox;
create policy bes_inbox_rw on public.bes_inbox for all to anon, authenticated using (true) with check (true);
