# Skill — Modification de code dans tarek-apps

**Quand :** toute modification de code ou de documentation dans le dépôt `tarek-apps`.

## Règles
1. Travailler **uniquement** sur une branche `antigravity/<nom-court>`. Jamais directement sur `main`, jamais de fusion sans relecture de Claude.
2. Le dépôt est **public** : aucune clé, mot de passe, numéro, montant client ni donnée BES.
3. **Aucune suppression de données.** Pas de migration qui fait perdre des données ou l'historique.
4. Antigravity ne touche **jamais** aux bases Supabase BES (FacturePro, Caisse), ni ne crée/supprime devis, factures ou bons. Ces demandes vont dans `pont-antigravity/IDEES.md`.
5. Un commit par tâche, message : `pont: Txx FAIT` (ou le message demandé par la tâche).
6. Changements limités au périmètre demandé. Ne rien reformater ailleurs.

## Checklist avant FAIT
- [ ] Branche `antigravity/...` (pas `main`)
- [ ] Diff limité au périmètre de la tâche
- [ ] Recherche de secrets faite (aucune clé ni mot de passe dans le diff)
- [ ] Commit + push fait ; lien de la branche noté dans le rapport
