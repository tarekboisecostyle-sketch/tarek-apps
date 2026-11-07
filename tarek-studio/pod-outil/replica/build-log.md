# Build log — POD Studio

| écran | date | état | ce qui manque | plus dur que prévu |
| --- | --- | --- | --- | --- |
| S01 Accueil | 2026-11-07 | fait | alertes tendance | — |
| S02 Recherche | 2026-11-07 | partiel | lecture automatique des résultats Amazon (Claude dans le Chrome de Tarek), filtres plage | pas d'accès direct à Amazon depuis une page statique : collage ou import POD Radar |
| S04 Niche | 2026-11-07 | fait | historique BSR | la formule du score est la nôtre, à ajuster avec les vraies ventes |
| S07 Analyse | 2026-11-07 | partiel | analyse automatique (Claude ou Gemini) | — |
| S08 Fiche design | 2026-11-07 | fait | vérification des marques (S09) | — |
| Données | 2026-11-07 | fait (local) | passage sur Supabase : attend le choix du projet | 3e projet Supabase payant sur le plan gratuit |

Tranche verticale testée de bout en bout (Playwright, 1440 px et 390 px) : collage de 12 produits → niche avec score →
3 analyses → points communs → fiche design avec prompt. Aucune erreur console. Captures dans `clone-screens/`.
| Cloud | 2026-11-07 | fait | — | projet Supabase partagé avec Zwaq Vectorizer, tables pod_state + historique, accès par liste d'emails (testé : email inconnu refusé) |
| S00 POD Radar | 2026-11-07 | fait | — | POD Radar (PC) envoie son rapport à Supabase via pod_radar_ingest (jeton privé dans pod_studio.cfg sur le PC, jamais dans GitHub) ; section 1 de POD Studio |
