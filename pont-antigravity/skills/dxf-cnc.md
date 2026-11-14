# Skill — Fichiers DXF et CNC

**Quand :** tout fichier DXF, fiche cotée, motif ou vectorisation pour la CNC.

## Règles
1. **DXF R12 (AC1009)** obligatoire : Tarek travaille sur ArtCAM 2008.
2. **Bardage** : format « GROUPES » dans un seul DXF : un groupe avec toutes les lignes d'axe des rainures, un groupe avec tous les rectangles des rainures, plus le contour du panneau.
3. Rainures en **zigzag** : une de Y0 vers le haut, la suivante du haut vers Y0.
4. Motifs sur noyer : petits et fins ; creux peints en noir de façon cohérente (100 % lignes OU 100 % intérieur).
5. Pas de planches larges cintrées en 3D. Contours courbes à plat : OK.
6. Plaques standard : 2800 × 2100 mm.

## Checklist avant FAIT
- [ ] Version R12 (AC1009) confirmée
- [ ] Groupes séparés et nommés comme ci-dessus (bardage)
- [ ] Zigzag respecté
- [ ] Dimensions cohérentes avec la plaque 2800 × 2100
- [ ] Fichier rangé dans `Projets\<projet>\a_valider\`
