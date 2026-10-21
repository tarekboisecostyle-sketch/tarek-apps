# BES Fiches atelier

Application de production de BOIS ECO-STYLE : saisie des meubles (placards, cuisines, meubles TV, meubles sur mesure), plan coté en temps réel, liste de débit, plans de découpe et fiche atelier imprimable en arabe et en français.

- Application : `index.html` (fichier unique, sans installation)
- Enregistrement des projets : navigateur (local) et Supabase (table `fiches_projets`)

## Relevé de chantier

Méthode en 3 étapes : 1. **Espace** (type de pièce, longueur × largeur, plafond) · 2. **Zones** de produit le long des murs (longueur, profondeur, hauteur) · 3. **Détailler** : la fiche s'ouvre avec la longueur de la zone et vérifie que caissons bas, colonnes, vides (et hauts) retombent exactement sur la mesure relevée (boutons « + caisson / + espace vide du reste »).

- Page : `releve/` (bouton « Relevé de chantier » à l'accueil), croquis coté sur tablette
- Enregistrement : sur l'appareil (fonctionne sans internet) puis envoi automatique dans Supabase (table `releves`) dès que la connexion revient
- Outil « Pièce » : longueur × largeur, la pièce se dessine droite et cotée. Outil « Produit » : bloc à l'échelle (vu de dessus, façade en jaune), déplaçable, aimanté aux coins, ↻ pour le tourner
- Éléments de cuisine (caisson bas, caisson haut, colonne, espace vide) et outil « Porte/Fen. » (porte, fenêtre, passage posés sur un mur)
- Façades : les murs d'une pièce sont repérés A (haut), B (droite), C (bas), D (gauche). Le bouton « Façade → » envoie tous les éléments d'un mur dans une fiche, à leur position (élévation) ; fenêtres et portes deviennent des espaces vides VD
- Chaque produit posé sur le croquis a un type (placard, cuisine, meuble TV, meuble). Le bouton « Fiche → » crée la fiche atelier avec le chantier et les mesures (cm convertis en mm), ou ouvre la fiche si elle existe déjà
- À l'accueil des fiches, la carte « Depuis un relevé de chantier » liste les relevés et leurs produits ; la fiche affiche un bandeau « Voir le croquis »
