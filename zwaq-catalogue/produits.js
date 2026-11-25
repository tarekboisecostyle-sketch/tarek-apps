// Données du catalogue ZWAQ DECO. Pour ajouter un produit : copier un bloc et changer les valeurs, ajouter l'image dans img/.
// Pas de coût de revient ici (site public). Prix = prix de vente TTC validés dans les fiches de données.
window.ZWAQ = {
  // Numéro WhatsApp au format international sans + ni espaces (ex. 212612345678). Vide = WhatsApp demande de choisir le contact.
  whatsapp: "212708246243",
  livraison: "Livraison partout au Maroc : 30 DH par défaut (à confirmer à la commande).",
  produits: [
    {
      id: "frame", nom: "ZWAQ FRAME", categorie: "Étagères murales",
      desc: "Cadres ouverts imbriqués, un ensemble mural géométrique découpé à la CNC.",
      dimensions: "910 × 630 × 150 mm", img: "img/frame.jpg",
      finitions: ["Blanc", "Noyer"],
      variantes: [{ ref: "FRAME", label: "Ensemble complet", prix: { Blanc: 499, Noyer: 549 } }]
    },
    {
      id: "line", nom: "ZWAQ LINE", categorie: "Étagères murales",
      desc: "Deux modules aux lignes droites, pour un mur épuré.",
      dimensions: "2 modules, 700 × 760 × 150 mm", img: "img/line.jpg",
      finitions: ["Blanc", "Noyer"],
      variantes: [{ ref: "LINE", label: "2 modules", prix: { Blanc: 499, Noyer: 549 } }]
    },
    {
      id: "honey", nom: "Honey x3", categorie: "Étagères murales",
      desc: "Trois modules en nid d'abeille à composer comme vous voulez.",
      dimensions: "3 modules de 400 × 346 × 150 mm", img: "img/honey.jpg",
      finitions: ["Blanc", "Noyer"],
      variantes: [{ ref: "HONEY", label: "Lot de 3 modules", prix: { Blanc: 599, Noyer: 649 } }]
    },
    {
      id: "l", nom: "ZWAQ L", categorie: "Étagères murales",
      desc: "Lot de 3 étagères en L, simples et faciles à placer.",
      dimensions: "600 × 200 × 150 mm", img: "img/l.jpg",
      finitions: ["Blanc", "Noyer"],
      variantes: [{ ref: "L", label: "Lot de 3", prix: { Blanc: 479, Noyer: 509 } }]
    },
    {
      id: "epurees", nom: "Épurées", categorie: "Étagères murales",
      desc: "Étagères fines et minimalistes, en épaisseur 36 mm ou 18 mm, à l'unité ou en lot de 3.",
      dimensions: "800 × 200 mm (épaisseur 18 ou 36 mm)", img: "img/epurees.jpg",
      finitions: ["Blanc", "Noyer"],
      variantes: [
        { ref: "EPU18", label: "Épurée 18 mm", prix: { Blanc: 189, Noyer: 209 } },
        { ref: "EPU", label: "Épurée 36 mm", prix: { Blanc: 299, Noyer: 329 } },
        { ref: "EPU18-3", label: "Lot de 3 · 18 mm", prix: { Blanc: 519, Noyer: 559 } },
        { ref: "EPU3", label: "Lot de 3 · 36 mm", prix: { Blanc: 849, Noyer: 929 } }
      ]
    },
    {
      id: "cross", nom: "Cross", categorie: "Étagères murales",
      desc: "Grande étagère croisée, une pièce forte pour un mur de salon.",
      dimensions: "980 × 1000 × 200 mm", img: "img/cross.jpg",
      finitions: ["MDF", "Noyer"],
      variantes: [
        { ref: "CROSS18", label: "Cross 18 mm", prix: { MDF: 549, Noyer: 549 } },
        { ref: "CROSS", label: "Cross 36 mm", prix: { MDF: 749, Noyer: 749 } }
      ]
    }
  ]
};
