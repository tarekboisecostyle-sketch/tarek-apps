# Objectifs de Tarek

> Lire avant chaque tâche. Mis à jour le 14 nov. 2026 d'après les réponses de Tarek.

## 1. Priorités
1. **POD FACILE** : designs et produits sur toutes les plateformes (Redbubble, TeePublic, Spreadshirt, Amazon Merch, Gumroad, Amazon KDP, et les autres plateformes pas encore ouvertes).
2. **Tâches BES en retard** du mois précédent (à traiter par Claude, à rattraper avant la fin du mois).
3. **ZWAQ DECO** : Instagram = produits physiques seulement ; Pinterest = tout.
4. **Khamsat** : services et réponses aux clients, qualité avant tout.
5. **Apps** : seulement si ça sert les priorités ci-dessus.

## 2. Qui fait quoi
- **Claude** : tout ce qui touche BES, les décisions d'argent, la publication, la fusion du code, les comptes et paiements. Claude doit recevoir des instructions prêtes (contenus, données, chemins), pour dépenser le moins de tokens possible.
- **Codex / Antigravity** : génération (titres, tags, légendes, textes, designs, DXF, code sur une branche), avec les skills du dossier `skills/`.
- **Exception BES** : Codex/Antigravity peut préparer des **fichiers JSON de documents** (factures, devis) dans `a_valider\`, que Tarek importe lui-même dans FacturePro. Rien n'est écrit dans Supabase BES. On ne prépare ce JSON que si Tarek le demande.

## 3. Interdits pour Codex / Antigravity
- Comptes, paiements, clés, formulaires d'inscription.
- Toute action sur BES, sauf la préparation de JSON décrite ci-dessus.
- Publier sans vérification (titres : marque « préliminaire » tant que USPTO n'est pas consulté).

## 4. Qualité
- Chaque tâche suit la checklist de son skill avant de passer en `FAIT`.
- Les erreurs déjà corrigées sont dans `erreurs.md` : ne pas les refaire.

## 5. Tokens
- Claude lit les rapports, pas les fichiers entiers, sauf en cas de doute.
- Les tâches donnent tout le nécessaire (entrée, sortie, chemin, règles) pour éviter les allers-retours.
