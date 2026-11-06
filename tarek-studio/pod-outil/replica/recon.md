# Recon map : outils de recherche POD (web)

Références : Merch Informer (recherche Amazon Merch), Merch Titans (upload en masse + trademark),
avec un regard sur Flying Research, Merch Dominator, MerchPivot, MerchRex (mêmes fonctions de recherche).
Scope : la boucle « savoir quoi créer » : trouver ce qui se vend, vérifier les marques, préparer la fiche du design.
L'upload en masse est déjà fait par la routine POD de Tarek dans son navigateur : il reste en « should ».
Pour : TAREK STUDIO, d'abord pour POD FACILE (Tarek), puis à vendre par abonnement.
Date : 2026-11-06
Méthode : sources publiques seulement (sites, pages de prix, avis, fiches Chrome Web Store). Aucun compte utilisé.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Merch Titans, site | https://merchtitans.com/ | bulk upload, AI SEO, trademark engine USPTO, 6 plateformes, outils web gratuits |
| 2 | Merch Titans, prix | https://merchtitans.com/pricing | un seul plan : 39,99 $/mois ou 29,99 $/mois à l'année, 2 appareils |
| 3 | Merch Informer, site | https://merchinformer.com/ | lister, archives, favoris + CSV, listing optimizer, designer, graphic packs, Social Hunter |
| 4 | Merch Informer, guide recherche | https://merchinformer.com/?p=8283 | Product Search, Merchant Search, Merch Hunter, Competition Checker, Etsy/Pinterest, Trend Hunter |
| 5 | Avis Merch Informer (par Merch Titans, concurrent : biaisé) | https://merchtitans.com/blog/merch-informer-review | plans 9,99 / 19,99 / 49,99 $, points faibles |
| 6 | MerchRex Research (Gumroad) | https://merchrex.gumroad.com/l/ldyrm | suggestions de recherche, base de mots-clés, estimation des ventes par BSR, trademark, Google Trends quotidien, conseils de police et couleurs |
| 7 | MerchFlux (Chrome) | https://chromewebstore.google.com/detail/cbgnjkekdnakcocdmloeollckgpfakjb | niche score, historique BSR, badge tendance, export CSV |
| 8 | MerchPivot (Chrome) | https://chromewebstore.google.com/detail/edkpnilonhaglbbomecgjicbnpmjhlac | tableau des résultats Amazon : BSR, ventes estimées, avis, marque, date d'upload |
| 9 | Merch Dominator | https://neura.market/ai-tools-directory/search-tools/merch-dominator | niches, tendances, trademark, estimateur de ventes, AI listing |

## Core loop

Taper une niche ou un mot-clé, voir les designs qui se vendent vraiment (BSR, ventes estimées, avis, ancienneté),
juger si la niche vaut le coup (demande contre concurrence), vérifier que les mots ne sont pas des marques déposées,
et repartir avec une liste d'idées à créer.

**Ce que personne ne fait (notre différence) :** analyser les designs gagnants eux-mêmes (motif, texte, façon
d'écrire et de placer le texte, combinaison motif + texte, couleurs) et en sortir une fiche design prête à générer.
MerchRex donne seulement des suggestions de police et couleurs.

## Screens (de notre outil, déduits des références)

| ID | screen | comment y aller | but | composants clés | états |
| --- | --- | --- | --- | --- | --- |
| S01 | Tableau de bord | accueil | idées du jour, niches suivies, alertes tendance | cartes, liste, badges tendance | vide, rempli |
| S02 | Recherche produits | menu « Rechercher » | chercher par mot-clé, filtrer par marketplace, type de produit, BSR, prix, avis, date | barre de recherche, filtres, tableau triable, export CSV | vide, chargement, résultats, aucun résultat, erreur source |
| S03 | Fiche produit | clic sur un résultat | titre, marque, ASIN, prix, BSR, ventes estimées, avis, date, historique BSR | image, chiffres, petit graphique | rempli, données manquantes |
| S04 | Niche | clic sur une niche ou « Analyser la niche » | score demande / concurrence, nombre de résultats, top designs, mots-clés liés | score, graphique, grille d'images, nuage de mots-clés | rempli, niche saturée |
| S05 | Mots-clés | menu « Mots-clés » | suggestions Amazon (préfixes, suffixes), volume estimé, concurrence, longue traîne | tableau, copier, ajouter aux favoris | vide, rempli |
| S06 | Tendances | menu « Tendances » | tendances du jour (Google Trends, Etsy/Pinterest), événements à venir, archives saisonnières | calendrier, liste, filtres pays | rempli |
| S07 | Analyse des designs gagnants | depuis S04 « Analyser les designs » | pour les meilleurs designs d'une niche : motif, texte, police, placement, couleurs, combinaison, ce qui revient | grille, étiquettes, résumé des points communs | chargement, rempli |
| S08 | Fiche design | depuis S07 « Créer une fiche » | recette du design à créer : idée, texte, style du motif, police, couleurs, placement, prompt de génération, mots-clés du listing | formulaire éditable, prompt copiable | brouillon, prêt, publié |
| S09 | Vérification marques | depuis S08 ou menu | contrôle des mots du titre, bullets et texte du design contre les marques USPTO (et UE si possible) | zone de texte, mots surlignés, alternatives | ok, alerte, erreur source |
| S10 | Favoris et listes | menu « Favoris » | idées, produits, mots-clés gardés, export CSV | listes, tags | vide, rempli |
| S11 | Listing | depuis S08 | titre, marque, 2 bullets, description, prix par plateforme, générés par IA | champs avec compteur de caractères | brouillon, prêt |
| S12 | Compte et abonnement | menu profil | connexion, plan, quota de recherches | formulaire, carte plan | gratuit, payant, quota atteint |

## Flows

```
F01 Trouver une idée qui se vend
    S01 -> S02 (mot-clé) -> S04 (niche) -> S10 (garder)
    happy path clicks : 4
    edge : aucun résultat, niche saturée, source Amazon indisponible

F02 Comprendre pourquoi un design se vend et préparer le mien
    S04 -> S07 (analyse des 10-20 meilleurs) -> S08 (fiche design) -> S09 (marques) -> S11 (listing)
    happy path clicks : 6
    edge : texte du design = marque déposée, design gagnant d'une marque officielle (à exclure), images introuvables

F03 Profiter d'une tendance du jour
    S01 ou S06 (tendance) -> S02 (vérifier la demande) -> S08 (fiche) -> S09
    happy path clicks : 5
    edge : tendance trop courte, sujet protégé (film, équipe, personne)

F04 Vérifier un texte avant publication
    S09 (coller titre + bullets) -> mots surlignés -> alternatives -> copier
    happy path clicks : 3
```

Chiffre à battre : Merch Titans dit 20 min pour 50 designs à l'upload ; Merch Informer demande plusieurs outils pour
passer de la recherche au listing. Nous : de la niche à une fiche design prête en moins de 6 clics.

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Barre de recherche | simple, avec marketplace | vide, saisie, chargement | S02, S05 |
| Filtres | chips, plage (BSR, prix), date | actif, inactif | S02, S04, S06 |
| Tableau triable | produits, mots-clés | vide, chargement, rempli, export | S02, S05, S10 |
| Carte produit | avec image, compacte | normal, favori | S01, S04, S07 |
| Score de niche | jauge 0-100 | bon, moyen, saturé | S04 |
| Graphique BSR | ligne | données, pas de données | S03, S04 |
| Étiquettes d'analyse | motif, texte, police, placement, couleur | — | S07, S08 |
| Surligneur de marques | ok, alerte | — | S09, S11 |
| Champ avec compteur | titre, bullet, description | ok, trop long | S11 |
| Toast | succès, erreur | — | partout |

## Inferred data model

```
Recherche    id, user_id, mot_cle, marketplace, filtres (json), created_at
             evidence: S02, Merch Informer Product Search, MerchPivot
             confidence: high
Produit      asin, marketplace, titre, marque, prix, bsr, ventes_estimees, avis, note, date_upload,
             type_produit, image_url, vu_le
             evidence: Merch Informer « Deep Dive », MerchPivot, MerchRex
             confidence: high
HistoriqueBSR asin, date, bsr
             evidence: MerchFlux « BSR history graph »
             confidence: high
Niche        id, nom, mots_cles[], nb_resultats, score_demande, score_concurrence, score, maj_le
             evidence: Merch Hunter / Niche Hunter, MerchFlux niche score
             confidence: medium (formule du score inconnue : à définir nous-mêmes)
AnalyseDesign id, asin, motif, style_motif, texte, police_style, placement, couleurs[], combinaison, notes
             evidence: aucun concurrent (notre ajout), conseils police/couleurs de MerchRex
             confidence: guess
FicheDesign  id, user_id, niche_id, idee, texte, style, police, couleurs, placement, prompt, mots_cles,
             statut (brouillon | pret | publie), created_at
             evidence: notre brief
             confidence: guess
MarqueCheck  id, texte, resultats (json: mot, marque, classe, statut), created_at
             evidence: Merch Titans trademark engine (USPTO), MerchRex Trademark Search
             confidence: high
Favori       id, user_id, type (produit | niche | mot_cle | fiche), ref_id, liste
             evidence: Merch Informer Favorites + export CSV
             confidence: high
Listing      id, fiche_id, plateforme, titre, marque, bullet1, bullet2, description, prix
             evidence: Merch Titans AI SEO, Merch Informer listing optimizer
             confidence: high
User         id, email, plan, quota_recherches
```

Relationships : User 1-n Recherche, User 1-n FicheDesign, Niche 1-n Produit (par mots-clés),
Produit 1-n HistoriqueBSR, Produit 1-1 AnalyseDesign, FicheDesign 1-n Listing, FicheDesign 1-n MarqueCheck.

## Feature matrix

Voir `features.csv`. Must : 13, should : 9, could : 6, skip : 4.

## Out of scope (cannot or should not be cloned)

- Les vraies ventes des concurrents : Amazon ne les publie pas. On estime par le BSR, comme tout le monde.
- Les données privées d'Amazon (API vendeur des autres, comptes Merch d'autrui).
- Les packs graphiques et polices sous licence de Merch Informer.
- Le scraping massif d'Amazon : interdit par leurs conditions. On lit à vitesse humaine ou par des services d'API qui ont le droit.
- La communauté et la formation de Merch Titans (Facebook, Discord) : c'est leur réseau, pas une fonction.
- Copier un design gagnant : l'analyse sert à s'inspirer de la recette, jamais à reproduire l'image ou le texte.

## Size

Screens 12, flows 4, entités 10.
Les trois parties difficiles :
1. **Obtenir les données Amazon proprement** (BSR, résultats de recherche) sans scraping massif : API tierce payante à l'usage,
   ou lecture dans le navigateur de Tarek à vitesse humaine.
2. **L'analyse des designs gagnants** par l'IA (vision) : fiable sur motif, texte et placement, mais coût par image à surveiller.
3. **La vérification des marques** : données USPTO à jour (API officielle ou service tiers).
Taille : M (quelques semaines) pour la version Tarek ; L pour une version à vendre (comptes, quotas, paiement, plusieurs marketplaces).
