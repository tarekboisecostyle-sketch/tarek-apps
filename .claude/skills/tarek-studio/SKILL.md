---
name: tarek-studio
description: >-
  TAREK STUDIO — la boîte de production de Tarek pour fabriquer et vendre des
  produits digitaux (applications, outils web) avec la chaîne Replica. À utiliser
  quand Tarek dit « TAREK STUDIO », « nouveau produit », « cloner une app »,
  « fabriquer un outil à vendre », ou demande où en est un produit du studio.
---

# TAREK STUDIO

La boîte de production de Tarek. Chaque produit digital passe par la même chaîne,
avec les 11 skills Replica de ce dépôt (`.claude/skills/replica-*`, licence MIT,
de Jake Schincariol).

## Où vont les fichiers

Un dossier par produit : `tarek-studio/<nom-du-produit>/`.
Les skills Replica écrivent leur travail dans `tarek-studio/<nom-du-produit>/replica/`.
Lance chaque skill depuis le dossier du produit, pour qu'ils trouvent ce que le
précédent a écrit.

## La chaîne

1. `replica-recon` : analyser l'outil de référence (pages publiques, captures, avis).
2. `replica-entrepreneur` : lire ce que ses utilisateurs détestent, et en tirer l'angle de vente.
   On le lance tôt chez TAREK STUDIO : on ne construit que ce qu'on sait vendre.
3. `replica-architect` : stack et base de données.
4. `replica-design` : design system avec nos propres assets.
5. `replica-build` puis `replica-backend` : construire l'app, comptes et paiement.
6. `replica-test` puis `replica-diff` : bugs et comparaison avec la référence.
7. `replica-brand` : nom et marque propres.
8. `replica-launch` puis `replica-deploy` : page de vente, prix, mise en ligne.

## Protection des applications BES

- Les apps BES (`bes-*/`, `bes-auth.js`) et leurs bases Supabase ne sont jamais modifiées, lues en écriture ou réutilisées par le studio.
- Le studio travaille seulement dans `tarek-studio/`.
- Quand un produit est prêt à être vendu, on en fait une copie dans un dépôt GitHub séparé, avec son propre projet Supabase et ses propres clés. Aucune clé ni donnée BES dans ce dépôt.

## Accès de Claude à chaque application

Chaque application construite ou utilisée par Tarek doit rester accessible à Claude :
le code dans GitHub (dépôt où Claude peut pousser) et la base dans un projet Supabase
du compte de Tarek, connecté à Claude. Comme ça Claude peut entrer dans l'app, modifier
le code ou la base, et exécuter directement les tâches que Tarek lui donne.
Pas d'outil fermé qu'on ne peut pas piloter (pas de base hors Supabase, pas de code hors GitHub).

## Plus tard

Une fois les apps nécessaires construites et les ventes lancées : renforcer la sécurité
(protection des mots de passe divulgués, inscriptions fermées, dépôts privés).

## Règles de Tarek à respecter

- Base de données dans Supabase, code dans ce dépôt `tarek-apps` (dépôt public : jamais de données ni de clés secrètes).
- Chaque app finie va dans son propre dossier à la racine du dépôt, et se publie par push sur `main`.
- Paiement des produits vendus : licence Gumroad, comme `zwaq-vectorizer/`.
- Ne copier que ce que fait l'outil de référence, jamais son code, son logo, ses textes ni son contenu.
- Tarek parle darija (souvent par vocal) : réponses courtes, en darija ou en français.

## Produits

| Dossier | Produit | Étape |
|---|---|---|
| `tarek-studio/pod-outil/` | Outil POD : trouver ce qui se vend, analyser les designs gagnants, générer gratuitement | recon fait, prochaine étape : entrepreneur |
