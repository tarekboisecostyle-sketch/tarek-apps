# Règles de travail — Antigravity (PC de Tarek)

> Copie de référence : `tarek-apps/pont-antigravity/AGENTS.md`. À copier aussi dans `C:\Users\hp\Desktop\Projets\AGENTS.md`.
> ⚠️ Le dépôt tarek-apps est PUBLIC : ne jamais écrire dans le pont de clés, mots de passe, numéros, montants clients ou données BES.
> Antigravity lit ce fichier avant chaque tâche. Tarek parle en darija (arabe ou latin) mélangée au français : comprendre et répondre court, en darija latin.

## 1. Rôle d'Antigravity vs Claude

| Antigravity (ici, sur le PC) | Claude (claude.ai / Cowork) |
|---|---|
| Générations lourdes : contenus POD, textes ZWAQ DECO, scripts vidéo, ebooks KDP/Gumroad, DXF, code d'apps | Tout BES : FacturePro, BES CAISSE, devis/factures, sorties chantier, valorisation, Supabase |
| Prépare les fichiers finis dans les bons dossiers | Contrôle, valide, publie, fait les tâches importantes |
| Pousse le code sur GitHub `tarek-apps` (branche de travail) | Relit et fusionne / déploie |

**Interdit à Antigravity :** modifier les bases Supabase de BES (FacturePro, Caisse) ou créer/supprimer des devis, factures, bons. Pour ça → l'écrire dans `pont-antigravity/IDEES.md` et Claude s'en charge.

## 2. Où ranger chaque fichier

Tout fichier final va dans `C:\Users\hp\Desktop\Projets\`, dans le bon sous-dossier :

- `BES\` — documents et outils Bois Eco-Style
- `Zwaq Deco\` — designs, visuels, textes réseaux, DXF décoration
  - Logo : `Zwaq Deco\Logo et identite visuel\ZWAQ_DECO_logo_exact.png`
- `POD\` — designs print-on-demand, POD Radar (`POD\POD Radar\rapports\radar_dernier.json`), POD Studio
- Dans chaque projet, un sous-dossier `a_valider\` pour ce que Claude doit vérifier avant publication (un sous-dossier par jour ou par semaine)

Jamais dans Téléchargements. Nommer les fichiers clairement : `AAAA-MM-JJ_projet_description.ext`.

## 3. Quel modèle utiliser (pour économiser le quota)

1. **Gemini Flash** — par défaut : textes, listes, titres/tags POD, descriptions, traductions, génération en série.
2. **Claude Sonnet 5.5** — modifications de code ciblées, fichiers moyens, corrections.
3. **Claude Opus 5.5** — seulement pour les problèmes difficiles (bug sur plusieurs fichiers, architecture d'une nouvelle app).

Si le quota d'un modèle est atteint : passer au modèle inférieur, ne pas attendre.

## 4. Règles métier à respecter

**DXF**
- Toujours DXF **R12 (AC1009)** — Tarek travaille sur ArtCAM 2008.
- Bardage : format « GROUPES » dans un seul DXF : un groupe/bloc avec toutes les lignes d'axe des rainures, un autre avec tous les rectangles des rainures, plus le contour du panneau. Rainures en zigzag (une de Y0 vers le haut, la suivante du haut vers Y0).

**POD**
- Titres et tags en anglais.
- Chaque design = motif/illustration **+** texte ou quote.
- PNG transparent ~4500 px, 300 DPI, motif dans le tiers supérieur centré.
- L'IA déforme l'écriture arabe : utiliser uniquement des polices/vecteurs vérifiés.
- Vérifier trademark/copyright avant toute publication Amazon Merch.
- Toutes niches et tous marchés (pas seulement islamique).

**ZWAQ DECO**
- Matières : MDF brut, MDF L31, MDF blanc, MDF Sonoma/Ebru ; plaques 2800 × 2100 mm.
- Motifs CNC sur noyer : petits/fins, creux peints en noir de façon cohérente (100 % lignes OU 100 % intérieur).
- Pas de planches larges cintrées en 3D ; contours courbes à plat = OK.
- Instagram = produits physiques ZWAQ seulement ; Pinterest = tout, chaque marque dans son tableau ; TikTok = rien pour l'instant.
- Facebook Marketplace : numéro de téléphone écrit avec des points entre les chiffres (ex. `0.6.1.2.-3.4.5.6.7.8.`), sinon Facebook le masque.

**Apps / code**
- Toutes les apps dans le dépôt GitHub `tarek-apps` (compte tarekboisecostyle-sketch), base de données dans Supabase (plus de Firebase).
- Aucune migration sans garder 100 % des données et de l'historique.
- Travailler sur une branche `antigravity/...`, jamais de suppression de données.

**Documents**
- Pas de fichiers Word (.docx) pour BES.
- Visuels : demander à Tarek la source (designs Craft, dossiers ZWAQ DECO, Gemini, Ideogram…) — il n'utilise pas Canva pour ses designs.

## 5. Communication avec Claude : le « pont »

Le pont est le dossier `pont-antigravity/` dans le dépôt GitHub `tarek-apps`, cloné sur le PC.
Claude y écrit les tâches même quand le PC est éteint ; Antigravity les lit à l'ouverture.

- **`pont-antigravity/SEMAINE.md`** : la liste des tâches de la semaine. C'est LA source des ordres.
  - Commencer chaque session par `git pull`, puis lire `SEMAINE.md`.
  - Suivre l'« Ordre de travail » écrit en haut du fichier.
  - Après chaque tâche : statut `FAIT` + remplir « Rapport » (ce qui a été fait, chemins des fichiers créés, doutes), puis `git commit` + `git push`.
  - Si une tâche est impossible : statut `BLOQUE` + la raison. Ne jamais inventer un résultat.
- **`pont-antigravity/archives/`** : les semaines terminées (Claude les déplace).
- Antigravity n'ajoute pas de tâches lui-même. S'il a une idée, il l'écrit dans `pont-antigravity/IDEES.md`.
- Les fichiers produits restent dans `Desktop\Projets\...` (section 2) ; le rapport donne leurs chemins.
