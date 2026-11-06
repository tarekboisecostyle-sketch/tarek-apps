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

## Règles de Tarek à respecter

- Base de données dans Supabase, code dans ce dépôt `tarek-apps` (dépôt public : jamais de données ni de clés secrètes).
- Chaque app finie va dans son propre dossier à la racine du dépôt, et se publie par push sur `main`.
- Paiement des produits vendus : licence Gumroad, comme `zwaq-vectorizer/`.
- Ne copier que ce que fait l'outil de référence, jamais son code, son logo, ses textes ni son contenu.
- Tarek parle darija (souvent par vocal) : réponses courtes, en darija ou en français.

## Produits

| Dossier | Produit | Étape |
|---|---|---|
| `tarek-studio/pod-outil/` | Outil POD (designs + publication Amazon Merch / Redbubble) | à démarrer : recon |
