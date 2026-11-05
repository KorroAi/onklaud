/* Boulangerie des Halles : données fictives partagées entre l'application client et le comptoir. */
(function () {
  "use strict";
  const O = window.Outils;
  const P = "../commun/photos/";
  const PRODUITS = [
    { id: "tradition", nom: "Baguette tradition", d: "Fermentation lente", prix: 1.3, img: P + "pains.jpg", pos: "62% 52%", zoom: 2.6 },
    { id: "campagne", nom: "Pain de campagne", d: "Levain naturel, graines", prix: 4.6, img: P + "pains.jpg", pos: "12% 40%", zoom: 1.5 },
    { id: "cereales", nom: "Pain aux céréales", d: "Farine bio", prix: 4.9, img: P + "pains.jpg", pos: "92% 86%", zoom: 2.2 },
    { id: "croissant", nom: "Croissant au beurre", d: "Beurre AOP", prix: 1.35, img: P + "croissants.jpg", pos: "70% 72%", zoom: 1.5 },
    { id: "chocolat", nom: "Pain au chocolat", d: "Deux barres de chocolat noir", prix: 1.5, img: P + "croissants.jpg", pos: "24% 80%", zoom: 2.4 }
  ];
  const CRENEAUX = ["7 h 30", "8 h 00", "8 h 30", "12 h 00", "17 h 30"];
  const depart = () => ({
    prochainNum: 148,
    mes: [],
    commandes: [
      { id: "c145", num: 145, nom: "Mme Durand", heure: "7 h 30", lignes: { tradition: 2, croissant: 4 }, etat: "afaire", jour: O.jour(1) },
      { id: "c146", num: 146, nom: "Karim", heure: "8 h 00", lignes: { croissant: 6, chocolat: 4 }, etat: "afaire", jour: O.jour(1) },
      { id: "c147", num: 147, nom: "Traiteur Rivière", heure: "12 h 00", lignes: { tradition: 16, campagne: 3 }, etat: "afaire", jour: O.jour(1) }
    ]
  });
  const total = (l) => Object.entries(l).reduce((t, [k, q]) => t + q * (PRODUITS.find((p) => p.id === k) || { prix: 0 }).prix, 0);
  window.Boulangerie = { PRODUITS, CRENEAUX, depart, total };
})();
