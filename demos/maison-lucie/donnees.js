/* Maison Lucie : réservations fictives partagées entre le site et le carnet du restaurant. */
(function () {
  "use strict";
  const O = window.Outils;
  const SERVICES = { midi: ["12:00", "12:30", "13:00", "13:30"], soir: ["19:00", "19:30", "20:00", "20:30", "21:00"] };
  const CAPACITE = 14; // couverts par créneau
  const ouvert = (iso) => { const j = new Date(iso + "T12:00:00").getDay(); return j !== 0 && j !== 1; }; // fermé dimanche et lundi
  const joursOuverts = (n) => { const l = []; for (let i = 0; l.length < n && i < 30; i += 1) { const j = O.jour(i); if (ouvert(j)) l.push(j); } return l; };
  const depart = () => {
    const [p1, p2] = joursOuverts(2), a = p1, d = p2;
    const r = (jour, heure, nom, pers, tel) => ({ id: O.id(), jour, heure, nom, pers, tel, etat: "attendue", source: "téléphone" });
    return { privatisations: [], resas: [
      r(a, "19:30", "Bernard", 4, "06 00 00 00 31"), r(a, "20:00", "Nguyen", 2, "06 00 00 00 32"), r(a, "20:00", "Lefèvre", 6, "06 00 00 00 33"), r(a, "20:30", "Garcia", 3, "06 00 00 00 34"),
      r(d, "12:30", "Costa", 2, "06 00 00 00 35"), r(d, "13:00", "Lambert", 4, "06 00 00 00 36"), r(d, "19:30", "Rossi", 6, "06 00 00 00 37"), r(d, "20:00", "Durand", 8, "06 00 00 00 38"), r(d, "20:00", "Morel", 4, "06 00 00 00 39"), r(d, "20:30", "Caron", 12, "06 00 00 00 40"), r(d, "20:30", "Petit", 2, "06 00 00 00 41")
    ] };
  };
  const occupes = (d, jour, heure) => d.resas.filter((r) => r.jour === jour && r.heure === heure && r.etat !== "annulee").reduce((t, r) => t + r.pers, 0);
  window.MaisonLucie = { SERVICES, CAPACITE, depart, occupes, ouvert, joursOuverts };
})();
