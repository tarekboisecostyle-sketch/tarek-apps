# Modèles JSON d'import — BES FacturePro

Format commun : `"format": "bes-import-v1"`. Coller le contenu dans **Import/Export JSON** de FacturePro.
Ces fichiers sont des EXEMPLES (noms fictifs) : remplacer les valeurs, ne jamais mettre de vraies données ici (dépôt public) — copier le modèle ailleurs pour le remplir.

| Fichier | Sert à | Remarques |
|---|---|---|
| 01_devis_facture | Devis / factures | `docType` = DEVIS ou FACTURE. `num` vide = numéro automatique. `ht`/`ttc` à 0 = calculés. Doublon = demande de remplacement |
| 02_entrees_stock_BL | Entrées de stock (BL fournisseur) | Crée le produit/fournisseur s'il n'existe pas, recalcule le PMP |
| 03_sorties_stock | Sorties / bons de sortie | `personne` / `chef` = qui a pris, `bs` = n° du bon. Produit introuvable = ligne ignorée. Stock peut passer en négatif |
| 04_bon_de_commande | Bons de commande | `num` vide = BC-NN-AAAA auto. `etat` : brouillon, envoye, recu, cloture |
| 05_clients | Clients | Ignoré si le nom existe déjà |
| 06_produits_stock | Produits du stock | Ignoré si la `ref` existe déjà |
| 07_encaissements | Entrées d'argent | Doublon (date+montant+réf chèque) ignoré |
| 08_decaissements | Sorties d'argent | Idem ; `dateFacture` sert au calcul du retard |
| 09_inventaire | Inventaire (feuille comptée) | `typeInv` : inopine ou periodique ; prêt à valider après import |
| 10_TOUT_EN_UN | Plusieurs types dans un seul JSON | Garder seulement les blocs utiles |

Dates : `AAAA-MM-JJ`. Après chaque import, le détail est visible dans **Historique imports**.
