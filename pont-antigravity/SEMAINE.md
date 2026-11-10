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
