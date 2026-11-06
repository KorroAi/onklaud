/* Institut Belle Rive : agenda, clientes et fidélité fictifs, partagés entre l'application et l'écran de l'institut.
   Tous les totaux sont calculés à partir de ces données. */
(function () {
  "use strict";
  const O = window.Outils;
  const OBJECTIF = 9;
  const PRESTATIONS = [
    { id: "visage", nom: "Soin du visage", duree: "1 h", prix: 62, img: "../commun/photos/soin-visage.jpg" },
    { id: "corps", nom: "Modelage du dos", duree: "45 min", prix: 55, img: "../commun/photos/soin-dos.jpg" },
    { id: "mains", nom: "Beauté des mains", duree: "40 min", prix: 34, img: "../commun/photos/soin-mains.jpg" },
    { id: "regard", nom: "Rehaussement de cils", duree: "1 h", prix: 58, img: "../commun/photos/soin-huile.jpg" }
  ];
  const HEURES = ["9 h 30", "10 h 30", "11 h 30", "14 h 00", "15 h 00", "16 h 00", "17 h 00"];
  const PRATICIENNES = ["Léa", "Nora"];
  const PANIER_MOYEN = Math.round(PRESTATIONS.reduce((t, p) => t + p.prix, 0) / PRESTATIONS.length);

  /* L'institut ferme le dimanche : la démo montre alors le lundi. */
  const reference = () => O.jour(new Date().getDay() === 0 ? 1 : 0);
  const age = (iso) => Math.round((new Date(O.jour() + "T12:00:00") - new Date(iso + "T12:00:00")) / 864e5);

  const depart = () => {
    const j = reference(), demain = O.jour(1);
    const r = (cliente, prestation, pratic, heure, jour = j) => ({ id: O.id(), cliente, prestation, pratic, jour, heure, statut: "prevu" });
    return {
      clientes: [
        { id: "camille", nom: "Camille Vidal", tampons: 7, dernier: O.jour(-47), rythme: 42, soin: "visage" },
        { id: "ines", nom: "Inès Roche", tampons: 3, dernier: O.jour(-63), rythme: 42, soin: "mains" },
        { id: "marie", nom: "Marie Lopez", tampons: 8, dernier: O.jour(-14), rythme: 28, soin: "visage" },
        { id: "sophie", nom: "Sophie Blanc", tampons: 5, dernier: O.jour(-30), rythme: 28, soin: "regard" },
        { id: "claire", nom: "Claire Fabre", tampons: 2, dernier: O.jour(-21), rythme: 42, soin: "corps" },
        { id: "nadia", nom: "Nadia Benali", tampons: 6, dernier: O.jour(-52), rythme: 42, soin: "corps" },
        { id: "helene", nom: "Hélène Morin", tampons: 1, dernier: O.jour(-9), rythme: 56, soin: "mains" },
        { id: "elodie", nom: "Élodie Perez", tampons: 4, dernier: O.jour(-18), rythme: 42, soin: "regard" },
        { id: "anne", nom: "Anne Roux", tampons: 2, dernier: O.jour(-25), rythme: 42, soin: "mains" },
        { id: "lena", nom: "Léna Garnier", tampons: 8, dernier: O.jour(-16), rythme: 42, soin: "visage" }
      ],
      rdv: [
        r("marie", "visage", "Léa", "9 h 30"), r("sophie", "regard", "Léa", "10 h 30"), r("claire", "corps", "Léa", "14 h 00"), r("helene", "mains", "Léa", "16 h 00"),
        r("elodie", "mains", "Nora", "9 h 30"), r("lena", "visage", "Nora", "11 h 30"), r("anne", "regard", "Nora", "14 h 00"), r("helene", "corps", "Nora", "15 h 00"), r("marie", "mains", "Nora", "17 h 00"),
        r("sophie", "visage", "Léa", "11 h 30", demain), r("marie", "regard", "Nora", "10 h 30", demain)
      ],
      offres: [],
      journal: [],
      remplis: 0
    };
  };

  /* Prochain jour d'ouverture après la journée affichée. */
  const suivant = () => { const j = reference(), n = new Date(j + "T12:00:00"); n.setDate(n.getDate() + (n.getDay() === 6 ? 2 : 1)); return O.iso(n); };
  const client = (d, id) => d.clientes.find((c) => c.id === id);
  const prestation = (id) => PRESTATIONS.find((p) => p.id === id);
  const occupe = (d, jour, heure, pratic) => d.rdv.find((r) => r.jour === jour && r.heure === heure && r.pratic === pratic);
  const libres = (d, jour) => HEURES.flatMap((h) => PRATICIENNES.filter((p) => !occupe(d, jour, h, p)).map((p) => ({ heure: h, pratic: p })));
  /* Les clientes à inviter : leur rythme habituel est dépassé et aucun rendez-vous n'est prévu. */
  const aRevoir = (d) => d.clientes.filter((c) => age(c.dernier) >= c.rythme && !d.rdv.some((r) => r.cliente === c.id && r.jour >= O.jour() && r.statut === "prevu")).sort((a, b) => (age(b.dernier) - b.rythme) - (age(a.dernier) - a.rythme));
  const bilan = (d, jour) => {
    const l = d.rdv.filter((r) => r.jour === jour);
    const prix = (r) => prestation(r.prestation).prix;
    const vides = libres(d, jour).length;
    return {
      prevu: l.reduce((t, r) => t + prix(r), 0), encaisse: l.filter((r) => r.statut === "paye").reduce((t, r) => t + prix(r), 0),
      vides, manque: vides * PANIER_MOYEN, remplis: d.remplis, taux: Math.round(l.length / (HEURES.length * PRATICIENNES.length) * 100)
    };
  };
  /* Une cliente accepte : le créneau se remplit dans l'agenda. */
  const accepter = (d, id) => {
    const o = d.offres.find((x) => x.id === id); if (!o) return;
    d.offres = d.offres.filter((x) => x.id !== id);
    if (occupe(d, o.jour, o.heure, o.pratic)) return;
    d.rdv.push({ id: O.id(), cliente: o.cliente, prestation: o.prestation, pratic: o.pratic, jour: o.jour, heure: o.heure, statut: "prevu", rempli: true });
    d.remplis += prestation(o.prestation).prix;
  };

  window.BelleRive = { suivant, OBJECTIF, PRESTATIONS, HEURES, PRATICIENNES, PANIER_MOYEN, depart, reference, age, client, prestation, occupe, libres, aRevoir, bilan, accepter };
})();
