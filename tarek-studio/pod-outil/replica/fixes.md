# Ce que les utilisateurs reprochent aux outils POD, et ce qu'on corrige

Date : 2026-11-07

## Taille de l'échantillon : très petite

- **4 avis utilisateurs, 1 seule source** (Capterra, Merch Titans). C'est tout ce qui était lisible.
- Trustpilot, G2, Reddit et le Chrome Web Store n'ont pas pu être lus depuis ici (pages bloquées).
  Merch Informer et Merch Dominator n'ont aucun avis publié sur Capterra.
- Dans `reviews.csv`, seules les phrases recopiées mot pour mot figurent (titres et citations des avis).
  Le reste des avis Capterra n'était lisible qu'en résumé : il est signalé comme résumé ci-dessous.
- **Conclusion : ces avis donnent une direction, pas un classement.** Pour un vrai classement, il faudra lire
  Reddit (r/MerchByAmazon, r/AmazonMerch) et le Chrome Web Store dans le navigateur de Tarek.

## 1. Ce qu'ils détestent

| problème | avis | sources | preuve |
| --- | --- | --- | --- |
| Le logiciel se fige, et déconnecte des boutiques pendant l'upload | 3 sur 4 (d'après le résumé de la page) | 1 | Capterra, Merch Titans : 3 avis citent des blocages ; un parle de déconnexions inattendues. Résumé, pas de citation exacte. https://www.capterra.com.au/software/185801/merch-titans |
| Support qui ne répond pas, impossible de changer son email | 2 sur 4 (thin) | 1 | « Their customer service is really bad and you cannot even change your email... » (2★) https://www.capterra.com.au/software/185801/merch-titans |
| Mauvais rapport qualité-prix | 2 sur 4 (thin) | 1 | « Not so Good and No Value for Money » (2★) ; un autre avis trouve le plan premium un peu cher (résumé). https://www.capterra.com.au/software/185801/merch-titans |

Ce qu'ils aiment (même source) : la recherche de mots-clés simple et le gain de temps
(« An Easy Keyword Research Tool », 4★).

## 2. Ce qui manque (analyse des produits, pas des avis)

Ces points viennent des pages des outils et de l'avis Merch Informer écrit par Merch Titans
(un concurrent, donc biaisé). Ce ne sont pas des plaintes d'utilisateurs.

- **Aucun outil n'analyse les designs gagnants** (motif, texte, placement, combinaison). Ils montrent les chiffres, pas la recette.
- **La recherche et l'upload sont séparés** : Merch Informer n'a pas d'upload automatique, Merch Titans n'a pas de vraie recherche (seulement des outils web gratuits). Les vendeurs paient deux ou trois outils.
- **Merch Informer ne couvre qu'Amazon.**
- **Les chiffres sont des estimations** (ventes à partir du BSR) sans dire à quel point ils sont fiables.
- **La vérification des marques de Merch Informer est jugée « basique ».**

## 3. Ce qui n'est pas résolu (positionnement)

- **Le vendeur qui ne sait pas dessiner ou qui génère avec l'IA** : les outils l'aident à trouver une niche, mais pas à savoir quoi mettre dans le design.
- **Les vendeurs hors États-Unis qui ont peu de budget** : un seul plan à 40 $/mois (Merch Titans) ou plusieurs outils à 10-50 $ chacun.

## Plan de corrections

| # | quoi construire | taille | skill | preuve |
| --- | --- | --- | --- | --- |
| 1 | Analyse des designs gagnants et fiche design (déjà « must ») | M | replica-build | manque chez tous les outils (analyse produits) |
| 2 | Application web légère, sans logiciel à installer, qui garde le travail en cours si la page se coupe | S | replica-build | blocages et déconnexions (3 avis sur 4, résumé Capterra) |
| 3 | Recherche, fiche design, marques et listing dans un seul outil | M | replica-build | outils séparés (analyse produits) |
| 4 | Afficher la fiabilité des estimations (« estimation à partir du BSR, marge d'erreur ») | S | replica-build | chiffres opaques (analyse produits) |
| 5 | Vérification des marques avec lien vers la fiche USPTO et la classe 025 (vêtements) | S | replica-backend | marques « basiques » chez Merch Informer |
| 6 | Paramètres du compte simples : changer d'email, d'abonnement, sans passer par le support | S | replica-backend | « cannot even change your email » (1 avis) |
| 7 | Prix simple et bas, un seul plan | — | replica-launch | « No Value for Money » (1 avis) |

## L'angle

**Option A (recommandée)**
Pour les vendeurs POD qui trouvent des niches mais ne savent pas quoi mettre dans le design,
l'outil montre pourquoi les designs gagnants se vendent (motif, texte, placement) et donne une fiche prête à générer.
Preuve : manque chez tous les outils étudiés (analyse produits). Pas encore confirmé par des avis.

**Option B**
Pour les vendeurs qui paient trois outils pour aller de l'idée au listing,
un seul outil web qui fait recherche, fiche design, marques et listing.
Preuve : outils séparés (analyse produits) ; 1 avis sur le prix.

**Option C**
Pour les vendeurs fatigués d'un logiciel qui se fige,
une app web légère qui garde le travail en cours.
Preuve : 3 avis sur 4, une seule source (thin).

On recommande A : c'est ce qui fait vendre plus, et c'est l'objectif de Tarek.
Ne jamais mettre le nom d'un concurrent dans le nom de l'outil, les pubs ou la page de vente.

## Prochaine étape

replica-brand (nom et marque) vient plus tard, quand on préparera la version à vendre.
Pour l'instant, l'outil sert d'abord à POD FACILE : on enchaîne avec replica-architect puis le build.
