# tarek-apps — règles pour Claude

Tarek parle darija (souvent en latin) mêlée de français : répondre pareil, court.

## Répartition des tâches par agent (pour économiser la consommation)

La session principale ne fait pas le travail elle-même quand un agent correspond : elle lit la demande et la confie à l'agent ci-dessous (Agent tool, subagent_type = nom de l'agent). Si Tarek nomme un agent (« khdem b agent-caisse »), l'utiliser directement.

| Demande | Agent | Modèle |
|---|---|---|
| Caisse : entrée, dépense, solde | agent-caisse | Haiku |
| Sorties de matériel / bons de sortie chantier | agent-sorties-chantier | Haiku |
| Devis, factures, bons de commande standards | agent-devis-factures | Sonnet |
| Valorisations, situations et tableaux Excel | agent-valorisation-excel | Sonnet |
| Messages, posts TikTok, résumés, recherches simples | agent-contenu | Sonnet |
| Développement / bugs des applications, Supabase | agent-dev-apps | Opus |
| DXF, fiches atelier cotées, fichiers CNC | agent-dxf-cnc | Opus |
| Analyses complexes, stratégie, motion graphics | agent-analyse | Opus |

Conseil : ouvrir la session principale en Sonnet ; seuls les agents Opus utilisent Opus.

## Règles du dépôt
- Dépôt public : jamais de données ni de clés secrètes.
- Après une modification d'app : commit + push directement.
