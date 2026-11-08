# BES Fiches atelier

Application de production de BOIS ECO-STYLE : saisie des meubles (placards, cuisines, meubles TV, meubles sur mesure), plan coté en temps réel, liste de débit, plans de découpe et fiche atelier imprimable en arabe et en français.

- Application : `index.html` (fichier unique, sans installation)
- Enregistrement des projets : navigateur (local) et Supabase (table `fiches_projets`)

## Cuisine : plan de travail, électroménager, rendu client

- **Plan de travail** (30 mm, 20 mm devant les façades) dessiné en 3D au-dessus des caissons bas de la cuisine, coupé au droit d'un frigo ou d'une cuisinière ; longueur et profondeur dans la liste d'achat
- **Électroménager** : un espace vide peut recevoir lave-vaisselle, machine à laver, réfrigérateur, cuisinière (bas) ou hotte, micro-ondes (haut) ; un caisson bas peut porter un évier ou une plaque de cuisson. Visible en 3D et nommé sur l'élévation 2D (rien dans le débit)
- **Rendu client** (bouton dans la Vue 3D) : sol carrelé, mur, ombres, finition des façades (blanc, crème, chêne, noyer, gris brillant, noir, vert sauge) et du plan de travail (marbre, granit, chêne, béton, blanc) ; « Télécharger l'image » enregistre un PNG 2400 × 1500 à montrer au client ou à joindre au devis

## Hauteurs par défaut, appareils encastrés, cuisine en L

- Par défaut : caissons bas H 870 + plan de travail 30 = **900** ; dessous des hauts à **1500** du sol
- **Appareil encastré** dans un compartiment « Étagères » : four (niche 600 × 600, à 900 du sol dans une colonne, sous le plan dans un bas), micro-ondes (390), hotte encastrée (180, en bas du caisson haut). Portes au-dessus / au-dessous et étagères de la niche calculées (débit juste). Modèles prêts : « Colonne avec four encastré », « Caisson bas avec four encastré », « Caisson haut avec hotte encastrée » ; la cuisine de départ en a déjà un de chaque
- **Cuisine en L** : « Mur de ce caisson » = Mur A ou Mur B (retour en L), retour à gauche ou à droite du mur A, longueur du mur B. Élévation développée (Mur A puis Mur B, cotes par mur), 3D avec l'angle (mur B tourné de 90°, il commence devant les façades du mur A), plan de travail par mur, page « Vue 3D du projet » avec les deux murs
- **Angle en L** : pas d'espace vide, une **réglette d'angle** RG (bas et haut) entre les façades du mur A et le premier caisson du mur B. Largeur auto = porte + saillie des poignées + 2 mm (50 mm par défaut, réglable dans « Règles de l'atelier »), elle passe dans le débit, les plans de découpe, la 3D et l'élévation. Messages si la réglette tapée est trop petite, ou si le caisson du coin du mur A a sa façade cachée par le mur B (largeur conseillée du caisson d'angle)

## Gola, push, caisson au-dessus d'un appareil, joues de finition

- **Prise des portes** (Règles de l'atelier) : caissons bas en **Gola** par défaut (façades 30 mm plus basses que le caisson = profil L, 30 mm entre façades de tiroirs = profil C) ; caissons hauts en **push / touch-latch** ; colonnes en **poignée intégrée** (ou push, ou poignées). Quincaillerie : longueurs de profil Gola L et C (mm), nombre de push. Sans poignée, la réglette d'angle minimum passe à 20 mm
- **Caisson au-dessus d'un appareil** (machine à laver, petit frigo) : sélectionner l'espace vide de l'appareil puis « Ajouter → Caisson au-dessus d'un appareil » : il se pose dessus à 90 cm du sol (l'espace passe à 900), le plan de travail s'arrête à cet endroit
- **Sous ce caisson** (réglage de chaque caisson bas ou colonne) : machine à laver, petit réfrigérateur, lave-vaisselle ou espace vide, avec la hauteur de l'espace (900 par défaut). Le caisson garde sa place dans la rangée, commence à cette hauteur (sans pieds ni socle), l'appareil est dessiné dessous en 3D et sur l'élévation, le plan de travail s'arrête à cet endroit
- **Joue de finition** (cache-côté, couleur des façades) : réglage par caisson (gauche, droite, les deux). Elle descend jusqu'au sol pour un caisson bas ou posé sur un appareil, profondeur = caisson + porte ; dans le débit (repère C6-J), la 3D, l'élévation et la longueur du mur

## Ensemble sur un mur

Dans la barre « Produits du projet » :

- **Longueur du mur** (pour les projets sans zone relevée, enregistrée avec le projet ; reprise du relevé pour une façade) : total des bas/colonnes et des hauts, « reste » ou « dépasse », boutons « + caisson » / « + espace vide » du reste
- **Modifier plusieurs caissons à la fois** : choix Tous / Bas / Hauts / Colonnes ou cases à cocher (en Vue 3D « tout le projet » : Maj + clic, les caissons choisis passent en bleu), puis hauteur, profondeur, socle, dessous, portes, fixation, quantité appliqués en une fois (champ vide = inchangé)

## Liste d'achat

Sous le plan de découpe, et en page imprimée « Liste d'achat » avec cases à cocher : nombre de plaques par matière et format, mètres de chant par matière (côtés chantés de chaque pièce + surlongueur par côté réglable, 30 mm par défaut, arrondi au mètre), quincaillerie.

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
