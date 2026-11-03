-- BES Vectorizer : bibliothèque des motifs (appliqué le 2026-11-03 sur ypvjnermbksjxlebeoyr)
create table if not exists public.bes_motifs (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  categorie text not null default 'Divers',
  tags text[] not null default '{}',
  mode text not null default 'contour' check (mode in ('contour','vcarve')),
  largeur_mm numeric(10,2),
  hauteur_mm numeric(10,2),
  nb_vecteurs int,
  geometrie jsonb not null,
  svg text,
  apercu text,
  statut text not null default 'brouillon' check (statut in ('brouillon','prêt à vendre','en vente')),
  prix numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bes_motifs_created_idx on public.bes_motifs (created_at desc);
alter table public.bes_motifs enable row level security;
create policy anon_all_motifs on public.bes_motifs for all to anon using (true) with check (true);
