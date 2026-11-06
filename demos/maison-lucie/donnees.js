/* Maison Lucie : réservations fictives partagées entre le site et le carnet du restaurant.
   Une table reste occupée 1 h 30. Tous les totaux sont calculés à partir de ces données. */
(function () {
  "use strict";
  const O = window.Outils;
  const SERVICES = { midi: ["12:00", "12:30", "13:00", "13:30"], soir: ["19:00", "19:30", "20:00", "20:30", "21:00"] };
  const TICKET = 38; // addition moyenne par couvert
  const DUREE = 90;
  /* Plan de salle : position en pourcentage du plan. */
  const TABLES = [
    { n: 1, cap: 2, x: 7, y: 12, rond: true }, { n: 2, cap: 2, x: 7, y: 42, rond: true }, { n: 3, cap: 2, x: 21, y: 12, rond: true }, { n: 4, cap: 2, x: 21, y: 42, rond: true },
    { n: 5, cap: 4, x: 38, y: 12 }, { n: 6, cap: 4, x: 38, y: 42 }, { n: 7, cap: 4, x: 22, y: 74 }, { n: 8, cap: 4, x: 41, y: 74 },
    { n: 9, cap: 6, x: 61, y: 42 }, { n: 10, cap: 8, x: 67, y: 72 }
  ];
  const ouvert = (iso) => { const j = new Date(iso + "T12:00:00").getDay(); return j !== 0 && j !== 1; }; // fermé dimanche et lundi
  const joursOuverts = (n) => { const l = []; for (let i = 0; l.length < n && i < 30; i += 1) { const j = O.jour(i); if (ouvert(j)) l.push(j); } return l; };
  const minutes = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  const service = (h) => (SERVICES.midi.includes(h) ? "midi" : "soir");

  const depart = () => {
    const [a, b] = joursOuverts(2);
    const r = (jour, heure, nom, pers, table, conf, extra = {}) => ({ id: O.id(), jour, heure, nom, pers, table, tel: "06 00 00 00 " + (30 + table), etat: "attendue", conf, source: "téléphone", visites: 1, note: "", ...extra });
    return {
      privatisations: [],
      attente: [{ id: "a1", jour: a, heure: "20:00", nom: "Julie Perrin", pers: 2, etat: "attend", source: "téléphone" }],
      sauves: 0,
      demande: false,
      resas: [
        r(a, "19:30", "Aubert", 2, 1, true, { source: "site" }), r(a, "20:00", "Nguyen", 2, 2, true, { visites: 3 }),
        r(a, "20:00", "Petit", 2, 3, false, { source: "site", repond: "oui" }), r(a, "20:30", "Costa", 2, 4, true),
        r(a, "19:30", "Bernard", 4, 5, true, { visites: 6, note: "Habitués, table près de la fenêtre" }), r(a, "20:00", "Morel", 4, 6, true, { source: "site" }),
        r(a, "20:30", "Garcia", 3, 7, false, { source: "site", note: "Allergie aux fruits à coque", repond: "oui" }), r(a, "20:30", "Lambert", 4, 8, true),
        r(a, "20:00", "Lefèvre", 6, 9, false, { note: "Anniversaire, gâteau prévu", repond: "non" }), r(a, "21:00", "Rossi", 8, 10, true, { visites: 2 }),
        r(a, "12:30", "Caron", 2, 1, true), r(a, "13:00", "Vidal", 4, 5, true),
        r(b, "12:30", "Leroy", 2, 2, true), r(b, "19:30", "Marchand", 4, 6, true), r(b, "20:00", "Durand", 6, 9, true)
      ]
    };
  };

  const actives = (d, jour) => d.resas.filter((r) => r.jour === jour && r.etat !== "annulee");
  /* Plus petite table libre, pour garder les grandes tables aux grands groupes. */
  const tableLibre = (d, jour, heure, pers) => {
    const t = minutes(heure), l = actives(d, jour);
    return TABLES.filter((x) => x.cap >= pers && !l.some((r) => r.table === x.n && Math.abs(minutes(r.heure) - t) < DUREE)).sort((p, q) => p.cap - q.cap)[0] || null;
  };
  const bilan = (d, jour, s) => {
    const l = actives(d, jour).filter((r) => service(r.heure) === s);
    const nc = l.filter((r) => !r.conf && r.etat === "attendue");
    return {
      couverts: l.reduce((t, r) => t + r.pers, 0), places: TABLES.reduce((t, x) => t + x.cap, 0),
      aConfirmer: nc.length, risque: nc.reduce((t, r) => t + r.pers, 0) * TICKET,
      tables: new Set(l.map((r) => r.table)).size
    };
  };

  /* Une table proposée est acceptée : la personne quitte la liste d'attente et s'installe sur le plan. */
  const accepter = (d, id) => {
    const a = d.attente.find((x) => x.id === id); if (!a) return;
    const t = tableLibre(d, a.jour, a.heure, a.pers);
    d.attente = d.attente.filter((x) => x.id !== id);
    if (!t) return;
    d.resas.push({ id: a.id, jour: a.jour, heure: a.heure, nom: a.nom, pers: a.pers, table: t.n, tel: a.tel || "", etat: "attendue", conf: true, source: "liste d’attente", visites: 1, note: "" });
    d.sauves += a.pers;
  };

  window.MaisonLucie = { accepter, SERVICES, TABLES, TICKET, DUREE, depart, ouvert, joursOuverts, tableLibre, actives, bilan, service, minutes };
})();
