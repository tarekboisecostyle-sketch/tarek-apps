# Catalogue ZWAQ DECO

Site statique : `index.html` + `produits.js` + `img/`. Pas de serveur, pas d'abonnement.

- **Numéro WhatsApp** : mettre le numéro dans `produits.js` (`whatsapp: "212612345678"`, format international sans +). Vide = WhatsApp demande de choisir le contact.
- **Ajouter un produit** : copier un bloc dans `produits.js`, mettre l'image dans `img/` (JPG ~900 px de large).
- **Prix** : prix de vente TTC des fiches de données. Jamais de coût de revient ici (dépôt public).
- **Publier** : glisser le dossier sur Netlify Drop, ou le mettre dans `tarek-apps` avec GitHub Pages.
- **Tester en local** : `python -m http.server` dans ce dossier, puis http://127.0.0.1:8000
