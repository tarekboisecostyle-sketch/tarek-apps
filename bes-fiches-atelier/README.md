# BES Fiches atelier

Application de production de BOIS ECO-STYLE : saisie des meubles (placards, cuisines, meubles TV, meubles sur mesure), plan coté en temps réel, liste de débit, plans de découpe et fiche atelier imprimable en arabe et en français.

- Application : `index.html` (fichier unique, sans installation)
- Enregistrement des projets : navigateur (local) et Supabase (table `fiches_projets`)

## Vue 3D

Onglet « Vue 3D » à côté du plan coté (Three.js, chargé depuis internet la première fois) : le caisson est construit avec le même calcul que la liste de débit.

- Vues 3D · Face · Dessus · Gauche · Droite · Arrière, façades visibles / transparentes / cachées, curseur « Éclaté » pour voir les pièces une par une
- Clic sur une pièce (ou sur une ligne du débit) : elle passe en orange, les pièces identiques en orange clair, avec n° de débit, cotes de coupe, chant et matière
- « Modifier directement » : les réglages de la pièce cliquée (cotes du meuble, étagères du compartiment, portes, tiroirs, dos, socle) se changent dans le panneau et tout se recalcule
- Projets à plusieurs produits (cuisine) : « tout le projet » affiche tous les caissons à leur place ; cliquer un caisson l'ouvre dans le formulaire
- Fiche imprimée (case « Ajouter le montage en 3D », cochée par défaut) : page « Montage en 3D » par caisson, avec les pièces écartées et numérotées comme la liste de débit, le meuble monté en petit et la liste des pièces du caisson ; page « Vue 3D du projet » pour les cuisines et ensembles

## Relevé de chantier

Méthode en 3 étapes : 1. **Espace** (type de pièce, longueur × largeur, plafond) · 2. **Zones** de produit le long des murs (longueur, profondeur, hauteur) · 3. **Détailler** : la fiche s'ouvre avec la longueur de la zone et vérifie que caissons bas, colonnes, vides (et hauts) retombent exactement sur la mesure relevée (boutons « + caisson / + espace vide du reste »).

- Page : `releve/` (bouton « Relevé de chantier » à l'accueil), croquis coté sur tablette
- Enregistrement : sur l'appareil (fonctionne sans internet) puis envoi automatique dans Supabase (table `releves`) dès que la connexion revient
- Outil « Pièce » : longueur × largeur, la pièce se dessine droite et cotée. Outil « Produit » : bloc à l'échelle (vu de dessus, façade en jaune), déplaçable, aimanté aux coins, ↻ pour le tourner
- Éléments de cuisine (caisson bas, caisson haut, colonne, espace vide) et outil « Porte/Fen. » (porte, fenêtre, passage posés sur un mur)
- Façades : les murs d'une pièce sont repérés A (haut), B (droite), C (bas), D (gauche). Le bouton « Façade → » envoie tous les éléments d'un mur dans une fiche, à leur position (élévation) ; fenêtres et portes deviennent des espaces vides VD
- Chaque produit posé sur le croquis a un type (placard, cuisine, meuble TV, meuble). Le bouton « Fiche → » crée la fiche atelier avec le chantier et les mesures (cm convertis en mm), ou ouvre la fiche si elle existe déjà
- À l'accueil des fiches, la carte « Depuis un relevé de chantier » liste les relevés et leurs produits ; la fiche affiche un bandeau « Voir le croquis »
