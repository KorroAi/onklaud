/* Atelier Morel : données fictives et automatisations réelles.
   Partagé par le logiciel (index.html) et l'application client (chantier.html).
   Tous les montants affichés sont calculés à partir de ces données. */
(function () {
  "use strict";
  const O = window.Outils;
  const MARQUE = O.marque("Atelier Morel");
  const TVA = 0.1;
  const ACOMPTE = 0.3;

  /* Le samedi et le dimanche, la démo montre la prochaine journée de travail. */
  const reference = () => {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    const j = d.getDay();
    if (j === 6) d.setDate(d.getDate() + 2);
    if (j === 0) d.setDate(d.getDate() + 1);
    return d;
  };

  const depart = () => {
    const L = O.lundi(reference());
    const j = (n) => O.jour(n, L);
    const auj = (n) => O.jour(n);
    return {
      equipe: [
        { id: "julien", nom: "Julien", c: "#1f6a8f" }, { id: "thomas", nom: "Thomas", c: "#c99b00" },
        { id: "sarah", nom: "Sarah", c: "#7d8a92" }, { id: "karim", nom: "Karim", c: "#c02d19" }
      ],
      clients: [
        { id: "martin", nom: "Mme Martin", tel: "06 00 00 00 11", email: "martin@exemple.fr", adresse: "12 rue des Lilas, Lyon" },
        { id: "rossi", nom: "M. Rossi", tel: "06 00 00 00 12", email: "rossi@exemple.fr", adresse: "4 quai Fulchiron, Lyon" },
        { id: "durand", nom: "Mme Durand", tel: "06 00 00 00 13", email: "durand@exemple.fr", adresse: "28 rue Sala, Lyon" },
        { id: "leroy", nom: "M. Leroy", tel: "06 00 00 00 14", email: "leroy@exemple.fr", adresse: "9 montée du Gourguillon, Lyon" }
      ],
      chantiers: [
        {
          id: "c-martin", titre: "Salle de bains", client: "martin", adresse: "12 rue des Lilas", resp: "Julien",
          etapes: [{ t: "Dépose et préparation", e: "fait" }, { t: "Plomberie", e: "fait" }, { t: "Carrelage", e: "encours", n: "Fin prévue jeudi" }, { t: "Finitions et nettoyage", e: "avenir" }],
          photos: ["../commun/photos/sdb.jpg", "../commun/photos/sdb2.jpg"],
          messages: [{ de: "pro", nom: "Julien", h: "hier", texte: "La plomberie est posée. Voici l’état de la pièce.", photo: "../commun/photos/sdb2.jpg" }, { de: "pro", nom: "Julien", h: "ce matin", texte: "Le carrelage sera terminé jeudi.", photo: "../commun/photos/sdb.jpg" }]
        },
        {
          id: "c-rossi", titre: "Cuisine", client: "rossi", adresse: "4 quai Fulchiron", resp: "Thomas",
          etapes: [{ t: "Pose des meubles", e: "encours", n: "Fin prévue mercredi" }, { t: "Plan de travail", e: "avenir" }, { t: "Électroménager", e: "avenir" }, { t: "Finitions", e: "avenir" }],
          photos: ["../commun/photos/maison.jpg"], messages: []
        }
      ],
      interventions: [
        { id: "i1", titre: "Rénovation salle de bains", client: "martin", qui: "julien", jour: j(0), debut: 8, duree: 3 },
        { id: "i2", titre: "Pose cuisine", client: "rossi", qui: "thomas", jour: j(0), debut: 11, duree: 2 },
        { id: "i3", titre: "Devis sur place", client: "durand", qui: "sarah", jour: j(0), debut: 14, duree: 1.5 },
        { id: "i4", titre: "Rénovation salle de bains", client: "martin", qui: "julien", jour: j(1), debut: 8, duree: 4 },
        { id: "i5", titre: "Livraison matériaux", client: "rossi", qui: "karim", jour: j(1), debut: 12, duree: 2 },
        { id: "i6", titre: "Carrelage", client: "martin", qui: "julien", jour: j(2), debut: 8, duree: 3 },
        { id: "i7", titre: "Pose cuisine", client: "rossi", qui: "thomas", jour: j(2), debut: 9, duree: 2.5 },
        { id: "i8", titre: "Rendez-vous client", client: "durand", qui: "sarah", jour: j(2), debut: 13, duree: 1.5 },
        { id: "i9", titre: "Finitions", client: "martin", qui: "julien", jour: j(3), debut: 9, duree: 4 },
        { id: "i10", titre: "Métré salle d’eau", client: "durand", qui: "karim", jour: j(3), debut: 14, duree: 2 },
        { id: "i11", titre: "Finitions cuisine", client: "rossi", qui: "thomas", jour: j(4), debut: 8, duree: 2.5 },
        { id: "i12", titre: "Visite de fin de chantier", client: "martin", qui: "sarah", jour: j(4), debut: 11, duree: 1 },
        { id: "i13", titre: "Carrelage, joints", client: "martin", qui: "julien", jour: j(4), debut: 13, duree: 3 }
      ],
      devis: [
        {
          id: "d48", num: "D-2026-048", client: "leroy", objet: "Peinture de l’appartement, 62 m²", date: auj(-4), statut: "envoye",
          lignes: [{ d: "Préparation des supports", q: 62, u: "m²", pu: 9 }, { d: "Peinture, deux couches", q: 62, u: "m²", pu: 24 }]
        },
        {
          id: "d47", num: "D-2026-047", client: "martin", objet: "Terrasse bois, 18 m²", date: auj(-6), statut: "envoye",
          lignes: [{ d: "Lames de terrasse en pin, classe 4", q: 18, u: "m²", pu: 62 }, { d: "Lambourdes et plots", q: 18, u: "m²", pu: 21 }, { d: "Pose et finitions", q: 3, u: "jour", pu: 420 }]
        },
        {
          id: "d46", num: "D-2026-046", client: "durand", objet: "Salle d’eau, remplacement du receveur", date: auj(-9), statut: "signe", chantierCree: true,
          lignes: [{ d: "Receveur extra-plat 90 × 90", q: 1, u: "u", pu: 340 }, { d: "Paroi fixe", q: 1, u: "u", pu: 410 }, { d: "Main-d’œuvre", q: 2, u: "jour", pu: 420 }]
        },
        {
          id: "d45", num: "D-2026-045", client: "rossi", objet: "Cuisine, pose complète", date: auj(-20), statut: "signe", chantierCree: true,
          lignes: [{ d: "Pose des meubles", q: 3, u: "jour", pu: 420 }, { d: "Plan de travail, découpe et pose", q: 1, u: "u", pu: 680 }]
        }
      ],
      factures: [
        { id: "f31", num: "F-2026-031", client: "rossi", objet: "Acompte cuisine", ttc: 660, date: auj(-16), echeance: auj(-2), payee: false },
        { id: "f30", num: "F-2026-030", client: "martin", objet: "Acompte salle de bains", ttc: 1450, date: auj(-24), echeance: auj(-10), payee: true, payeeLe: auj(-11) },
        { id: "f29", num: "F-2026-029", client: "durand", objet: "Acompte salle d’eau", ttc: 480, date: auj(-9), echeance: auj(5), payee: true, payeeLe: auj(-7) }
      ],
      stocks: [
        { id: "s1", nom: "Colle carrelage C2", q: 4, seuil: 5, u: "sacs", f: "Point.P", pour: "Carrelage de Mme Martin" },
        { id: "s2", nom: "Joint gris clair", q: 12, seuil: 4, u: "sacs", f: "Point.P" },
        { id: "s3", nom: "Silicone sanitaire", q: 9, seuil: 6, u: "cartouches", f: "Cedeo" },
        { id: "s4", nom: "Plaques hydrofuges", q: 14, seuil: 8, u: "plaques", f: "Gedimat" }
      ],
      taches: [],
      journal: [],
      deja: {},
      prochaineFacture: 32,
      histo: [1240, 2180, 980, 3120, 1660, 2540, 1450]
    };
  };

  /* Les automatisations : de vraies règles, rejouées après chaque changement. */
  const noter = (d, cle, texte, type = "auto") => {
    if (d.deja[cle]) return false;
    d.deja[cle] = true;
    d.journal.unshift({ id: O.id(), h: O.maintenant(), texte, type });
    d.journal = d.journal.slice(0, 20);
    return true;
  };
  const nomClient = (d, id) => (d.clients.find((c) => c.id === id) || {}).nom || "";
  const totalHT = (x) => x.lignes.reduce((t, l) => t + (Number(l.q) || 0) * (Number(l.pu) || 0), 0);
  const totalTTC = (x) => Math.round(totalHT(x) * (1 + TVA) * 100) / 100;
  const age = (iso) => Math.round((new Date(O.jour() + "T12:00:00") - new Date(iso + "T12:00:00")) / 864e5);

  const automatismes = (d) => {
    d.devis.forEach((x) => {
      if (x.statut !== "signe" || x.chantierCree) return;
      x.chantierCree = true;
      noter(d, "signe-" + x.id, "Devis " + x.num + " signé en ligne par " + nomClient(d, x.client), "signe");
      d.chantiers.unshift({
        id: "c-" + x.id, titre: x.objet.split(",")[0], client: x.client, adresse: (d.clients.find((c) => c.id === x.client) || {}).adresse || "", resp: "Julien",
        etapes: [{ t: "Préparation", e: "encours", n: "Démarrage à planifier" }, { t: "Réalisation", e: "avenir" }, { t: "Finitions", e: "avenir" }],
        photos: [], messages: [{ de: "pro", nom: MARQUE, h: "à l’instant", texte: "Merci pour votre signature. Votre chantier est ouvert, nous revenons vers vous pour la date de démarrage." }]
      });
      noter(d, "chantier-" + x.id, "Chantier « " + x.objet.split(",")[0] + " » créé");
      const ttc = Math.round(totalTTC(x) * ACOMPTE * 100) / 100;
      d.factures.unshift({ id: "f" + d.prochaineFacture, num: "F-2026-0" + d.prochaineFacture, client: x.client, objet: "Acompte, " + x.objet, ttc, date: O.jour(), echeance: O.jour(14), payee: false, devis: x.id });
      d.prochaineFacture += 1;
      noter(d, "acompte-" + x.id, "Facture d’acompte de " + O.eur(ttc, 0) + " créée et envoyée", "argent");
      d.taches.unshift({ id: O.id(), t: "Planifier « " + x.objet.split(",")[0] + " »", n: nomClient(d, x.client), fait: false });
    });
    d.chantiers.forEach((c) => c.etapes.forEach((e, i) => {
      if (e.e !== "fait") return;
      if (noter(d, "etape-" + c.id + "-" + i, "« " + e.t + " » terminé : " + nomClient(d, c.client) + " est prévenu") && d.pret) {
        c.messages.push({ de: "pro", nom: MARQUE, h: "à l’instant", texte: "L’étape « " + e.t + " » est terminée." });
      }
    }));
    d.stocks.forEach((s) => {
      if (s.q <= s.seuil) noter(d, "stock-" + s.id, "Stock bas : " + s.nom + ". Commande préparée chez " + s.f, "stock");
      else { delete d.deja["stock-" + s.id]; delete s.commande; }
    });
    d.factures.forEach((f) => {
      if (!f.payee && f.echeance < O.jour()) noter(d, "relance-" + f.id, "Relance rédigée : " + f.num + ", " + nomClient(d, f.client), "relance");
      if (f.payee && f.devis) noter(d, "encaisse-" + f.id, "Acompte de " + O.eur(f.ttc, 0) + " encaissé en ligne", "argent");
    });
    d.interventions.forEach((i) => {
      if (i.jour === O.jour(1)) noter(d, "rappel-" + i.id, "Rappel envoyé à " + nomClient(d, i.client) + " pour demain " + O.heure(i.debut));
    });
    d.pret = true;
  };

  /* La liste du matin : ce qui rapporte, classé par ordre d'urgence. */
  const aFaire = (d) => {
    const l = [];
    d.factures.filter((f) => !f.payee && f.echeance < O.jour() && !f.relance).forEach((f) => {
      const n = age(f.echeance);
      l.push({ type: "facture", id: f.id, urgent: true, titre: "Relancer " + nomClient(d, f.client), detail: "Facture " + f.num + ", " + n + (n > 1 ? " jours" : " jour") + " de retard", montant: f.ttc, bouton: "Relancer" });
    });
    d.devis.filter((x) => x.statut === "envoye" && !x.relance && age(x.date) >= 3).sort((a, b) => a.date.localeCompare(b.date)).forEach((x) => {
      const n = age(x.date);
      l.push({ type: "devis", id: x.id, titre: "Relancer " + nomClient(d, x.client), detail: x.objet + ", sans réponse depuis " + n + " jours", montant: totalTTC(x), bouton: "Relancer" });
    });
    d.taches.filter((t) => !t.fait).forEach((t) => l.push({ type: "tache", id: t.id, titre: t.t, detail: t.n, bouton: "Fait" }));
    d.stocks.filter((s) => s.q <= s.seuil && !s.commande).forEach((s) => l.push({ type: "stock", id: s.id, titre: "Commander : " + s.nom, detail: "Reste " + s.q + " " + s.u + (s.pour ? ". " + s.pour : ""), bouton: "Commander" }));
    return l;
  };

  /* Trois chiffres utiles au patron, tous calculés. */
  const bilan = (d) => {
    const dormants = d.devis.filter((x) => x.statut === "envoye");
    const impayes = d.factures.filter((f) => !f.payee);
    const retard = impayes.filter((f) => f.echeance < O.jour());
    const encaisse = d.factures.filter((f) => f.payee && f.payeeLe && age(f.payeeLe) <= 30).reduce((t, f) => t + f.ttc, 0);
    return {
      devis: dormants.reduce((t, x) => t + totalTTC(x), 0), nbDevis: dormants.length,
      impaye: impayes.reduce((t, f) => t + f.ttc, 0), nbImpayes: impayes.length, nbRetard: retard.length,
      recuperer: dormants.reduce((t, x) => t + totalTTC(x), 0) + impayes.reduce((t, f) => t + f.ttc, 0),
      encaisse
    };
  };

  window.AtelierMorel = { depart, automatismes, nomClient, totalHT, totalTTC, TVA, ACOMPTE, MARQUE, reference, aFaire, bilan, age };
})();
