# Semaine 2026-W46 (du lun. 9 au dim. 15 nov. 2026)

> Fichier de communication Claude ↔ Antigravity.
> **Claude** écrit les tâches. **Antigravity** les exécute et remplit « Rapport ». **Claude** vérifie et lance.
> Ne jamais supprimer une tâche : seulement changer son statut.
> ⚠️ Dépôt PUBLIC : aucune clé, aucun mot de passe, aucun nom de client ni montant BES dans ce fichier.

## Statuts
- `A_FAIRE` — écrit par Claude, en attente
- `EN_COURS` — Antigravity a commencé
- `FAIT` — Antigravity a fini, fichiers prêts → Claude doit vérifier
- `BLOQUE` — Antigravity n'a pas pu (expliquer pourquoi dans le rapport)
- `A_CORRIGER` — Claude a vérifié, il y a des corrections (voir « Retour Claude »)
- `VALIDE` — Claude a vérifié et lancé/publié ✅

## Ordre de travail pour Antigravity
1. `git pull` au début.
2. Traiter d'abord les `A_CORRIGER`, puis les `A_FAIRE` par ordre de priorité (P1 → P3).
3. Une tâche à la fois : passer en `EN_COURS`, faire, puis `FAIT` + rapport.
4. `git commit` + `git push` après chaque tâche (message : `pont: T46-xx FAIT`).

---

## T46-01 · POD — 10 designs du jour
- **Statut :** FAIT
- **Priorité :** P1
- **Projet :** POD
- **Modèle :** Gemini Flash (idées, titres, tags) — génération image hors Antigravity
- **Entrée :** `POD/POD Radar/rapports/radar_dernier.json`
- **À faire :** choisir 10 idées vendables d'après le radar, écrire pour chacune : quote/texte, description de l'illustration, prompt image, titre + 13 tags en anglais, vérification trademark (noter la source).
- **Sortie attendue :** `POD/a_valider/AAAA-MM-JJ/designs.json` + `designs.md`
- **Rapport (Antigravity) :** 10 designs choisis d'après le radar (Dog Mom, Cat Lover, Woodworking, Thanksgiving J-22, Christmas J-51, Electrician, Retirement, Nurse, Mechanic, Arabic Calligraphy). Pour chaque design : quote, description de l'illustration, prompt image Midjourney/Ideogram, titre + 13 tags en anglais, vérification trademark USPTO Classe 025 (toutes CLEAN). Règle AGENTS.md respectée pour le design arabe (texte vectoriel séparé). Fichiers générés : `POD/a_valider/2026-11-10/designs.json` et `designs.md`.
- **Retour Claude :**

## T46-02 · ZWAQ DECO — textes réseaux de la semaine
- **Statut :** A_FAIRE
- **Priorité :** P2
- **Projet :** Zwaq Deco
- **Modèle :** Gemini Flash
- **À faire :** 7 légendes Instagram (produits physiques seulement) + 21 textes de pins Pinterest, en darija/français, avec hashtags.
- **Sortie attendue :** `Zwaq Deco/a_valider/2026-W46/reseaux.md`
- **Rapport (Antigravity) :**
- **Retour Claude :**

## T46-03 · POD — test comparatif (Codex, tour 1) : titres et tags
- **Statut :** A_FAIRE
- **Priorité :** P1
- **Projet :** POD
- **Modèle :** Test d'outil (Codex) — tâche légère, sans génération d'image
- **Entrée :** aucune (texte à écrire from scratch)
- **À faire :** pour la niche « plumber » (plombier), écrire 5 couples titre + 13 tags Redbubble, tout en anglais. Chaque titre : 4 à 8 mots, mot-clé en début. Vérifier qu'aucun titre ne contient une marque connue ou une expression courante déposée (ex. « dog mom »). Noter pour chaque couple le motif de vérification.
- **Sortie attendue :** `POD/a_valider/test-codex/titres_tags.md`
- **Rapport (Antigravity ou Codex) :**
- **Retour Claude :**

## T46-04 · ZWAQ DECO — test comparatif (Codex, tour 1) : légendes Instagram
- **Statut :** A_FAIRE
- **Priorité :** P1
- **Projet :** Zwaq Deco
- **Modèle :** Test d'outil (Codex) — texte seul
- **Entrée :** aucune (produit : étagère murale en bois découpée CNC, en MDF brut ou noyer)
- **À faire :** écrire 3 légendes Instagram en français (une ligne en darija possible), pour un produit physique ZWAQ DECO à vendre au Maroc, avec un appel à commander en DM et 5 hashtags déco Maroc. Respecter AGENTS.md : Instagram = produits physiques seulement, aucune mention de DXF, de Gumroad ni de t-shirts.
- **Sortie attendue :** `Zwaq Deco/a_valider/test-codex/legendes.md`
- **Rapport (Antigravity ou Codex) :**
- **Retour Claude :**

## T46-05 · Apps — test comparatif (Codex, tour 1) : modification de code sur une branche
- **Statut :** A_FAIRE
- **Priorité :** P2
- **Projet :** Apps
- **Modèle :** Test d'outil (Codex) — code
- **Entrée :** `README.md` à la racine du dépôt `tarek-apps`
- **À faire :** créer la branche `antigravity/test-codex-readme`. Dans `README.md`, ajouter une section « Applications » qui liste chaque dossier d'application présent à la racine (ex. bes-caisse, bes-facturepro, zwaq-deco, pod-studio, gestionpro…) avec une ligne de description tirée du contenu du dossier. Ne rien supprimer ni modifier d'autre. Commit sur cette branche avec le message `pont: T46-05 FAIT`, puis push (ne pas fusionner sur `main`).
- **Sortie attendue :** une branche `antigravity/test-codex-readme` poussée sur GitHub, avec un seul commit.
- **Rapport (Antigravity ou Codex) :**
- **Retour Claude :**

## T46-06 · Pont — test comparatif (Codex, tour 1) : lecture des règles
- **Statut :** A_FAIRE
- **Priorité :** P3
- **Projet :** Apps
- **Modèle :** Test d'outil (Codex) — lecture seule
- **Entrée :** `pont-antigravity/AGENTS.md`
- **À faire :** ne rien modifier. Dans « Rapport », écrire 6 points maximum résumant les règles qui s'appliquent : (a) à un titre POD, (b) à une légende Instagram ZWAQ, (c) à un fichier DXF, (d) à une modification de code, (e) à ce qui est interdit de mettre dans ce dépôt public, (f) au choix de modèle. Indiquer aussi, en une ligne, ce qui est interdit à Antigravity dans les bases BES.
- **Sortie attendue :** uniquement le texte du rapport dans cette tâche.
- **Rapport (Antigravity ou Codex) :**
- **Retour Claude :**

<!-- Modèle à copier pour une nouvelle tâche :
## T46-xx · PROJET — titre
- **Statut :** A_FAIRE
- **Priorité :** P1 | P2 | P3
- **Projet :** BES | Zwaq Deco | POD | Apps
- **Modèle :** Gemini Flash | Sonnet 5.5 | Opus 5.5
- **Entrée :**
- **À faire :**
- **Sortie attendue :**
- **Rapport (Antigravity) :**
- **Retour Claude :**
-->
