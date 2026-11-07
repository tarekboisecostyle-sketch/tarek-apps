# Architecture : outil POD de TAREK STUDIO (reprend les fonctions de recherche de Merch Informer, plus l'analyse des designs)

Nom de travail : **POD Studio** (le vrai nom viendra avec replica-brand, avant la version à vendre).

## Stack

On garde la stack de Tarek : pages HTML statiques dans GitHub, données dans Supabase. Pas de Next.js,
pas de serveur à gérer : Claude peut tout lire et modifier (règle de Tarek).

| couche | choix | pourquoi |
| --- | --- | --- |
| web | une page HTML + JS (sans build), dossier `pod-studio/` du dépôt tarek-apps | comme les autres apps de Tarek, publiée par push, Claude peut la modifier directement |
| style | CSS dans la page, tokens de replica-design | pas d'outil de build |
| base | Postgres Supabase, **projet séparé de BES** | règle du studio : rien ne touche BES |
| auth | Supabase Auth, un seul compte (Tarek) au début | comme `bes-auth.js` ; comptes clients pour la version à vendre |
| fonctions serveur | Supabase Edge Functions | appels aux API externes avec des clés cachées (USPTO, Gemini) |
| analyse des images | Claude (vision) dans la session de Tarek, ou API Gemini Flash gratuite dans une Edge Function | gratuit au départ |
| données Amazon | 1) rapports POD Radar (PC de Tarek) importés ; 2) Claude lit les pages Amazon dans le Chrome de Tarek à vitesse humaine et enregistre les résultats | zéro coût, pas de scraping massif ; une API payante (Keepa, SerpApi) seulement si les ventes le justifient |
| marques | API USPTO officielle (clé gratuite) dans une Edge Function | données à jour, lien vers la fiche |
| génération d'images | Ideogram et Gemini dans le navigateur, texte et retouches dans VectorCraft | méthode POD de Tarek, gratuite |
| paiement | aucun pour l'instant ; licence Gumroad pour la version à vendre | comme zwaq-vectorizer |
| hébergement | GitHub Pages du dépôt tarek-apps ; dépôt séparé pour la version à vendre | règle du studio |

**Décision de Tarek (7 nov. 2026) :** POD Studio partage le projet Supabase de Zwaq Vectorizer
(`gsxoxywecdscsxuehlgf`), avec ses propres tables `pod_`. BES n'est pas touché.
Version 1 en ligne : une ligne `pod_state` (JSON) par compte, historique des 200 dernières versions
(`pod_state_history`), accès limité aux emails de `pod_acces` (fonction `pod_autorise()`).
Les tables détaillées de `schema.sql` restent la cible de la version 2 (quand Claude écrira les produits
directement par SQL pendant la routine).

## Schema

Tables : 9 (8 + la table de liaison pod_search_products). Accès : row level security Postgres, chaque ligne a un `user_id = auth.uid()`.
Voir `schema.sql`.

| table | rôle |
| --- | --- |
| pod_searches | une recherche (mot-clé, marketplace, filtres) |
| pod_products | un produit Amazon/Redbubble vu (BSR, prix, avis, date…), partagé par recherche |
| pod_bsr_history | historique BSR d'un produit |
| pod_niches | une niche suivie, avec son score |
| pod_design_analyses | analyse d'un design gagnant (motif, texte, police, placement, couleurs) |
| pod_design_briefs | fiche design à créer, avec prompt et statut |
| pod_trademark_checks | résultat d'une vérification de marques |
| pod_listings | listing par plateforme (titre, bullets, prix en centimes) |

Favoris = colonne `favorite` sur produits, niches et fiches (plus simple qu'une table à part).

## API

| méthode / route | fait | qui | entrée | sortie | flow |
| --- | --- | --- | --- | --- | --- |
| REST `pod_searches` insert/select | enregistrer et relire les recherches | propriétaire | mot-clé, filtres | lignes | F01 |
| REST `pod_products` upsert (par marketplace + asin) | enregistrer les résultats lus sur Amazon ou importés de POD Radar | propriétaire | lignes produits | lignes | F01, F03 |
| REST `pod_niches` upsert | créer/mettre à jour une niche et son score | propriétaire | nom, mots-clés, chiffres | ligne | F01 |
| REST `pod_design_analyses` insert | enregistrer l'analyse d'un design gagnant | propriétaire | asin, champs d'analyse | ligne | F02 |
| REST `pod_design_briefs` insert/update | créer et faire avancer une fiche design | propriétaire | idée, texte, style, prompt | ligne | F02, F03 |
| Edge `pod-trademark` POST | vérifier les mots d'un texte contre l'USPTO (classe 025 d'abord) | connecté | texte | mots + marques trouvées + liens | F02, F04 |
| Edge `pod-analyze` POST | analyser une image de design avec Gemini Flash (optionnel, sinon Claude le fait en session) | connecté | url image | champs d'analyse | F02 |
| Edge `pod-listing` POST | écrire titre, bullets, description dans les limites de chaque plateforme | connecté | fiche design | listing | F02 |
| Import JSON | charger `radar_dernier.json` de POD Radar | page | fichier | produits + niches | F03 |

Webhooks : aucun pour l'instant (Gumroad plus tard).
Tâches : la routine POD quotidienne de Tarek (Claude) lit la demande, remplit `pod_products` et `pod_niches`,
puis crée les fiches du jour.

## Score de niche (notre formule, à ajuster)

- demande = nombre de produits du top 50 avec BSR < 300 000, et BSR médian
- concurrence = nombre total de résultats Merch, part des marques officielles
- score 0-100 = demande forte et concurrence faible ; marqué « estimation » partout (fix 4)

## The parts that bite

- **Données Amazon :** pas d'API officielle pour ça ; lecture lente dans le navigateur ou import POD Radar. Jamais de boucle de scraping.
- **Estimations :** les ventes viennent du BSR, toujours affichées comme estimations, avec la date de lecture.
- **Marques :** une alerte USPTO ne veut pas dire refus, une absence ne veut pas dire sûr ; lien vers la fiche pour vérifier.
- **Coût de l'analyse IA :** limiter à 10-20 designs par niche ; quota gratuit Gemini à surveiller.
- **Sauvegarde :** brouillon enregistré à chaque changement (fix 2).
- **Droits :** l'analyse décrit la recette d'un design, l'outil ne garde ni ne republie l'image du concurrent (lien seulement).
- **Sécurité :** clé publique Supabase dans la page (comme BES), RLS sur toutes les tables, clés USPTO/Gemini seulement dans les Edge Functions.

## Build order

1. **Tranche verticale** (sans Supabase, données dans le navigateur) :
   S02 recherche (saisie manuelle ou import POD Radar / collage des résultats) → S04 niche avec score →
   S07 analyse des designs → S08 fiche design avec prompt. Tables : équivalents locaux. Routes : import JSON.
2. **Must-haves :** S09 marques (Edge `pod-trademark`), S10 favoris + export CSV, S05 mots-clés, S03 fiche produit,
   filtre marques officielles, sauvegarde automatique, passage sur Supabase (schema.sql).
3. **Should-haves :** historique BSR, tendances (S06), Etsy/Pinterest, S11 listing (Edge `pod-listing`), Redbubble/TeePublic, liens génération.
4. **Fixes de replica-entrepreneur :** fiabilité des estimations, lien USPTO + classe 025, paramètres de compte (version à vendre).
