/* Boulangerie des Halles : données fictives partagées entre l'application client et le comptoir.
   Tous les totaux affichés sont calculés à partir de ces données. */
(function () {
  "use strict";
  const O = window.Outils;
  const P = "../commun/photos/";
  /* ventes : ventes en vitrine, le même jour, sur les quatre dernières semaines.
     habitude : quantité fabriquée jusqu'ici, sans prévision.
     farine : grammes par pièce. en_ligne : pièces réservables pour demain. */
  const PRODUITS = [
    { id: "tradition", nom: "Baguette tradition", pl: "baguettes tradition", d: "Fermentation lente", prix: 1.3, img: P + "baguettes.jpg", pos: "50% 20%", zoom: 1.5, ventes: [118, 124, 121, 113], habitude: 150, farine: 180, en_ligne: 80, four: "6 h 00" },
    { id: "campagne", nom: "Pain de campagne", pl: "pains de campagne", d: "Levain naturel, graines", prix: 4.6, img: P + "pains.jpg", pos: "12% 40%", zoom: 1.5, ventes: [26, 31, 28, 27], habitude: 36, farine: 420, en_ligne: 12, four: "7 h 00" },
    { id: "cereales", nom: "Pain aux céréales", pl: "pains aux céréales", d: "Farine bio", prix: 4.9, img: P + "pains.jpg", pos: "92% 86%", zoom: 2.2, ventes: [17, 19, 16, 20], habitude: 24, farine: 380, en_ligne: 10, four: "7 h 00" },
    { id: "croissant", nom: "Croissant au beurre", pl: "croissants au beurre", d: "Beurre AOP", prix: 1.35, img: P + "croissants.jpg", pos: "70% 72%", zoom: 1.5, ventes: [64, 58, 61, 57], habitude: 90, farine: 48, en_ligne: 40, four: "6 h 30" },
    { id: "chocolat", nom: "Pain au chocolat", pl: "pains au chocolat", d: "Deux barres de chocolat noir", prix: 1.5, img: P + "pain-chocolat.jpg", pos: "48% 58%", zoom: 1.9, ventes: [46, 49, 44, 41], habitude: 70, farine: 50, en_ligne: 30, four: "6 h 30" }
  ];
  const CRENEAUX = ["7 h 30", "8 h 00", "8 h 30", "12 h 00", "17 h 30"];
  const HABITUDE = { tradition: 2, croissant: 4 };
  const REMISE = 0.4;

  const depart = () => ({
    prochainNum: 148,
    mes: [],
    commandes: [
      { id: "c145", num: 145, nom: "Mme Durand", heure: "7 h 30", lignes: { tradition: 2, croissant: 4 }, etat: "afaire", jour: O.jour(1) },
      { id: "c146", num: 146, nom: "Karim", heure: "8 h 00", lignes: { croissant: 6, chocolat: 4 }, etat: "afaire", jour: O.jour(1) },
      { id: "c147", num: 147, nom: "Traiteur Rivière", heure: "12 h 00", lignes: { tradition: 16, campagne: 3 }, etat: "afaire", jour: O.jour(1) }
    ],
    invendus: { tradition: 6, campagne: 2, cereales: 1, croissant: 9, chocolat: 5 },
    offre: null,
    sauve: 0,
    reserves: 0,
    ajust: {}
  });

  const designer = (id, q) => { const p = PRODUITS.find((x) => x.id === id); return q + " " + (q > 1 ? p.pl : p.nom.toLowerCase()); };
  const produit = (id) => PRODUITS.find((p) => p.id === id) || { prix: 0, nom: id };
  const total = (l) => Object.entries(l).reduce((t, [k, q]) => t + q * produit(k).prix, 0);
  const prixSoir = (p) => Math.round(p.prix * (1 - REMISE) * 100) / 100;
  const prevision = (p) => Math.round(p.ventes.reduce((a, b) => a + b, 0) / p.ventes.length);

  /* Le calcul qui remplace l'habitude : commandé + ventes prévues, à ajuster à la main. */
  const production = (d) => {
    const cmd = {};
    d.commandes.forEach((c) => Object.entries(c.lignes).forEach(([k, q]) => { cmd[k] = (cmd[k] || 0) + q; }));
    return PRODUITS.map((p) => {
      const commande = cmd[p.id] || 0, vitrine = prevision(p), a_faire = commande + vitrine + (d.ajust[p.id] || 0);
      return { p, commande, vitrine, a_faire, ecart: a_faire - p.habitude };
    });
  };
  const bilan = (d) => {
    const l = production(d);
    return {
      vendu: d.commandes.reduce((t, c) => t + total(c.lignes), 0),
      pieces: l.reduce((t, x) => t + x.a_faire, 0),
      farine: l.reduce((t, x) => t + x.a_faire * x.p.farine, 0) / 1000,
      evite: l.reduce((t, x) => t + Math.max(0, -x.ecart), 0),
      eviteValeur: l.reduce((t, x) => t + Math.max(0, -x.ecart) * x.p.prix, 0)
    };
  };
  const restant = (d, p) => p.en_ligne - d.commandes.reduce((t, c) => t + (c.lignes[p.id] || 0), 0);

  window.Boulangerie = { designer, PRODUITS, CRENEAUX, HABITUDE, REMISE, depart, total, produit, prixSoir, prevision, production, bilan, restant };
})();
