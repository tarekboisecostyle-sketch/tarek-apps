# tarek-apps
Toutes les applications de Tarek réunies en un seul endroit (BES, Zwaq Deco, POD, Cafés mobiles)

## Applications

| Dossier | Application |
|---|---|
| `bes-facturepro/` | BES FacturePro (devis, factures, stock, chantiers) |
| `bes-fiches-atelier/` | Fiches atelier BES, avec `releve/` (relevé de chantier) et `zwaq/` (Zwaq Deco) |
| `bes-caisse/` | BES Caisse (caisse espèces, Supabase) |
| `zwaq-vectorizer/` | Zwaq Deco Vectorizer — version clients (comptes, quota gratuit, abonnement Pro via licence Gumroad). Projet Supabase séparé `gsxoxywecdscsxuehlgf`, fonctions `supabase/functions/zv-*` |
| `bes-vectorizer/` | BES Vectorizer — image vers DXF R12 / SVG / EPS (contour et centerline V-carve), bibliothèque de motifs (Supabase `bes_motifs`) |
| `gestionpro/` | GestionPro Perso — finances perso, POD, cafés mobiles (Firebase) |
| `tarek-studio/` | TAREK STUDIO — boîte de production de produits digitaux à vendre (chaîne Replica, skills dans `.claude/skills/`) |

Le code seulement : les données restent dans Supabase / Firebase, jamais dans ce dépôt (il est public).
