# POD Prospect

Petit cockpit local pour trier les designs Wit & Wear Studio, valider un lot quotidien et noter ses résultats. L’application est un seul fichier HTML, sans dépendance ni appel à un service externe. Les modifications sont enregistrées dans le `localStorage` du navigateur utilisé.

## Démarrage

Depuis le dossier `pod-prospect`, lancez un serveur statique local :

```powershell
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000/`. Vous pouvez aussi ouvrir `index.html` directement. Pour synchroniser les données de départ, les niches sont embarquées dans la page et disponibles en source dans `data/niches.json`.

## Flux quotidien

1. Ouvrir **Niches** pour examiner le classement suggéré et ajouter/modifier les communautés trouvées manuellement. La liste commence vide : aucune communauté n’est inventée ni préremplie.
2. Dans **Brouillons**, importer un objet JSON ou un tableau de brouillons. Exemple prêt à importer : `data/exemples_brouillons.json`.
3. Cocher les brouillons à valider et cliquer **Valider la sélection pour aujourd’hui**. L’application n’autorise qu’un lot par date locale.
4. Dans **Lot du jour**, copier le texte et le lien, puis publier manuellement sur la plateforme. Cliquer **Marquer publié** après publication.
5. Saisir vues, clics et ventes dans **Brouillons**. Les totaux apparaissent dans **Suivi A/B** quand des designs ont un champ `type` (`motif`, `motif_texte` ou `texte`). Le catalogue fourni ne possède pas encore ce champ.

Le format d’import requis est `{ "id", "designId", "niche", "plateforme", "bras", "texte", "lien" }`, avec `plateforme` égale à `reddit`, `pinterest`, `x`, `instagram` ou `threads`, et `bras` égal à `A` ou `B`. `marketplace` est facultatif (`redbubble`, `teepublic` ou `spreadshirt`) pour choisir le lien direct du bras B. Si absent, la première page produit disponible est utilisée. Le champ `lien` est conservé comme recours si aucune page directe n’est disponible ; les liens construits sont sinon calculés depuis le design. Un identifiant déjà importé est refusé pour éviter les doublons.

Le bras A pointe vers `https://witandwearstudio.netlify.app/?ref=<designId>`. Le bras B pointe vers la page produit Redbubble, TeePublic ou Spreadshirt associée au design, selon le choix disponible. Les liens de boutiques générales ne sont pas utilisés.

## Règles à respecter

- Jamais de DM en masse.
- Reddit se fait à la main par Tarek, sans lien pendant les deux premières semaines.
- Un lot validé par jour.
- Ne pas conclure avant 15 à 30 jours, ni sur seulement 2 à 3 ventes.

## Sauvegardes et confidentialité

**Exporter JSON** sauvegarde niches, communautés, brouillons, statuts et résultats. **Importer JSON** restaure cette sauvegarde. **Exporter CSV** exporte les brouillons et leurs mesures. Les données restent dans le navigateur ; prévoyez un export JSON avant de changer de navigateur ou d’effacer ses données.

Cette app et ses fichiers de départ ne contiennent aucune clé, aucun mot de passe, numéro privé ou donnée client. Les données du catalogue proviennent de `wit-and-wear-catalogue/produits.js`. Le classement des niches est une suggestion fondée sur le texte des citations et un même design peut être présent dans plusieurs niches. Les communautés sont à vérifier avant tout usage.
