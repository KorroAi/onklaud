/* Institut Belle Rive : cartes de fidélité et rendez-vous fictifs, partagés entre l'application et la caisse. */
(function () {
  "use strict";
  const O = window.Outils;
  const OBJECTIF = 9;
  const PRESTATIONS = [
    { id: "visage", nom: "Soin du visage", duree: "1 h", prix: 62 },
    { id: "corps", nom: "Modelage du dos", duree: "45 min", prix: 55 },
    { id: "mains", nom: "Beauté des mains", duree: "40 min", prix: 34 },
    { id: "regard", nom: "Rehaussement de cils", duree: "1 h", prix: 58 }
  ];
  const HEURES = ["9 h 30", "10 h 30", "11 h 30", "14 h 00", "15 h 00", "16 h 00", "17 h 00"];
  const depart = () => ({
    clientes: [
      { id: "camille", nom: "Camille Vidal", tampons: 7, depuis: "mars" },
      { id: "ines", nom: "Inès Roche", tampons: 3, depuis: "juin" },
      { id: "marie", nom: "Marie Lopez", tampons: 8, depuis: "janvier" }
    ],
    rdv: [
      { id: "r1", cliente: "ines", prestation: "mains", jour: O.jour(0), heure: "10 h 30" },
      { id: "r2", cliente: "marie", prestation: "visage", jour: O.jour(0), heure: "14 h 00" },
      { id: "r3", cliente: "marie", prestation: "regard", jour: O.jour(1), heure: "11 h 30" }
    ]
  });
  window.BelleRive = { OBJECTIF, PRESTATIONS, HEURES, depart };
})();
