/* ================================================================
   LES DEVIS QUI DORMENT : la boucle de relance
   Chaque jour (et à l'ouverture), la boucle vérifie les devis sans réponse :
   J+5 → 1re relance préparée, J+12 → 2e relance, J+20 → on propose de classer.
   Rien ne part sans validation : un geste ouvre la messagerie (mailto / wa.me / sms:).
   ================================================================ */
(function () {
  "use strict";
  const { esc, typo, euros } = Onk;
  const $ = (s, r = document) => r.querySelector(s);
  const CLE = "relances";
  const CANAUX = { email: "e-mail", whatsapp: "WhatsApp", sms: "SMS" };

  /* ---------- Données ---------- */
  function etatVide() {
    return {
      version: 1, exemple: false,
      reglages: { signature: "", r1: 5, r2: 12, arret: 20 },
      decalage: 0, derniereBoucle: "", filtre: "cours",
      devis: [], aValider: [], journal: []
    };
  }

  // Exemple, données fictives (dates relatives au jour J)
  function etatExemple(J) {
    const d = (n) => Onk.ajouterJours(J, -n);
    return {
      version: 1, exemple: true,
      reglages: { signature: "Julien Morel\nMenuiserie Morel", r1: 5, r2: 12, arret: 20 },
      decalage: 0, derniereBoucle: "", filtre: "cours",
      devis: [
        { id: "d1", numero: "D-2026-041", client: "Mme Lefèvre", objet: "Pose d'une porte d'entrée", montant: 2480, dateEnvoi: d(6), email: "c.lefevre@exemple.fr", tel: "", canal: "email", statut: "attente", relances: [] },
        { id: "d2", numero: "D-2026-038", client: "M. Bernard", objet: "Placards sur mesure, chambre", montant: 3150, dateEnvoi: d(13), email: "", tel: "06 00 00 00 01", canal: "whatsapp", statut: "attente", relances: [{ n: 1, jour: d(8), heure: "08:40", canal: "whatsapp" }] },
        { id: "d3", numero: "D-2026-044", client: "Mme Nguyen", objet: "Escalier, remplacement des marches", montant: 4200, dateEnvoi: d(5), email: "", tel: "06 00 00 00 02", canal: "sms", statut: "attente", relances: [] },
        { id: "d4", numero: "D-2026-033", client: "SCI Les Tilleuls", objet: "Quatre fenêtres bois", montant: 5890, dateEnvoi: d(22), email: "gestion@exemple.fr", tel: "", canal: "email", statut: "attente", relances: [{ n: 1, jour: d(17), heure: "08:35", canal: "email" }, { n: 2, jour: d(10), heure: "08:50", canal: "email" }] },
        { id: "d5", numero: "D-2026-046", client: "M. Petit", objet: "Terrasse bois 18 m²", montant: 2120, dateEnvoi: d(3), email: "", tel: "06 00 00 00 03", canal: "whatsapp", statut: "attente", relances: [] },
        { id: "d6", numero: "D-2026-047", client: "Mme Rossi", objet: "Bibliothèque murale", montant: 1280, dateEnvoi: d(1), email: "rossi@exemple.fr", tel: "", canal: "email", statut: "attente", relances: [] },
        { id: "d7", numero: "D-2026-040", client: "M. et Mme Garnier", objet: "Plan de travail en chêne", montant: 1650, dateEnvoi: d(9), email: "garnier@exemple.fr", tel: "", canal: "email", statut: "attente", relances: [{ n: 1, jour: d(4), heure: "08:45", canal: "email" }] },
        { id: "d8", numero: "D-2026-036", client: "Boulangerie Caron", objet: "Habillage du comptoir", montant: 1040, dateEnvoi: d(16), email: "", tel: "06 00 00 00 04", canal: "sms", statut: "accepte", relances: [{ n: 1, jour: d(11), heure: "08:30", canal: "sms" }], reponse: { jour: d(7) } }
      ],
      aValider: [],
      journal: [
        { jour: d(11), heure: "08:30", type: "envoi", texte: "Relance 1 envoyée à Boulangerie Caron (SMS)." },
        { jour: d(10), heure: "08:50", type: "envoi", texte: "Relance 2 envoyée à SCI Les Tilleuls (e-mail)." },
        { jour: d(8), heure: "08:40", type: "envoi", texte: "Relance 1 envoyée à M. Bernard (WhatsApp)." },
        { jour: d(7), heure: "11:20", type: "reponse", texte: "Boulangerie Caron : accepté (1 040 €)." },
        { jour: d(4), heure: "08:45", type: "envoi", texte: "Relance 1 envoyée à M. et Mme Garnier (e-mail)." }
      ]
    };
  }

  let etat;
  // Surcouche d'affichage (mode film et animation du total)
  const vue = { total: null, frappe: null, heure: null };

  function charger() {
    etat = Onk.stock.lire(CLE, null);
    if (!etat || !Array.isArray(etat.devis)) etat = etatExemple(Onk.aujourdhui());
    etat.reglages = Object.assign(etatVide().reglages, etat.reglages);
  }
  const sauver = () => Onk.stock.ecrire(CLE, etat);
  const jour = () => Onk.ajouterJours(Onk.aujourdhui(), etat.decalage || 0);
  const heure = () => vue.heure || Onk.maintenant();
  const devisPar = (id) => etat.devis.find((d) => d.id === id);
  const totalAttente = () => etat.devis.filter((d) => d.statut === "attente").reduce((s, d) => s + (+d.montant || 0), 0);
  const noter = (type, texte) => etat.journal.push({ jour: jour(), heure: heure(), type, texte: typo(texte) });

  /* ---------- Rédaction : plusieurs tournures, ton d'artisan ---------- */
  function bonjour(client) {
    const c = String(client || "").trim();
    if (!c) return "Bonjour";
    if (/^(m\.|mme|mlle|mr|madame|monsieur|m et mme|m\. et mme|docteur|dr)(?=[\s.]|$)/i.test(c)) return "Bonjour " + c;
    if (/^(sci|sarl|sas|sasu|eurl|sa|ste|société|societe|cabinet|boulangerie|restaurant|garage|mairie|association|syndic)(?=\s|$)/i.test(c)) return "Bonjour";
    return "Bonjour " + c.split(/\s+/)[0];
  }
  const TOURNURES = {
    1: [
      "{bonjour},\n\nJe reviens vers vous au sujet du devis envoyé le {date} ({objet}). Avez-vous eu le temps d'y jeter un œil ? Si quelque chose ne colle pas, le prix, le délai ou les matériaux, dites-le-moi : on peut l'ajuster.\n\nBonne journée,\n{signature}",
      "{bonjour},\n\nPetit message pour le devis du {date} ({objet}). Est-ce que tout est clair de votre côté ? Je peux passer revoir un détail sur place si besoin.\n\nÀ bientôt,\n{signature}",
      "{bonjour},\n\nJe voulais m'assurer que vous aviez bien reçu mon devis du {date} ({objet}). Je reste disponible pour en parler, au téléphone ou sur place.\n\nBien à vous,\n{signature}"
    ],
    2: [
      "{bonjour},\n\nJe me permets de revenir une dernière fois vers vous pour le devis du {date} ({objet}). Mon planning des prochaines semaines se remplit : si le projet tient toujours, un simple « oui » me suffit pour vous réserver une date. Et si vous avez fait un autre choix, aucun souci, dites-le-moi simplement.\n\nMerci,\n{signature}",
      "{bonjour},\n\nOù en êtes-vous de votre projet ({objet}) ? Mon devis du {date} tient toujours. Si vous préférez en parler de vive voix, répondez-moi avec un créneau qui vous arrange et je vous appelle.\n\n{signature}",
      "{bonjour},\n\nJe n'ai pas eu de retour sur le devis du {date} ({objet}), alors je me permets de revenir vers vous. Si le budget coince, on peut regarder ensemble une version plus simple. Sinon, pas de souci : dites-le-moi et je classe le dossier.\n\nBonne journée,\n{signature}"
    ]
  };
  function rediger(d, n) {
    const liste = TOURNURES[n] || TOURNURES[1];
    const modele = liste[Onk.hachage(d.id + ":" + n) % liste.length];
    const objet = String(d.objet || "").trim();
    return typo(modele
      .replace("{bonjour}", bonjour(d.client))
      .replace("{date}", jourMois(d.dateEnvoi))
      .replace(" ({objet})", objet ? " (" + objet.charAt(0).toLowerCase() + objet.slice(1) + ")" : "")
      .replace("({objet})", objet ? "(" + objet.charAt(0).toLowerCase() + objet.slice(1) + ")" : "")
      .replace("{signature}", (etat.reglages.signature || "").trim())
    ).trim();
  }
  const jourMois = (iso) => { const d = Onk.versDate(iso); return (d.getDate() === 1 ? "1er" : d.getDate()) + " " + Onk.MOIS[d.getMonth()]; };
  const canalDe = (d) => (d.canal && CANAUX[d.canal] ? d.canal : d.email ? "email" : d.tel ? "whatsapp" : "email");

  /* ---------- La boucle ---------- */
  function boucle(origine) {
    const J = jour(), R = etat.reglages;
    etat.aValider = etat.aValider.filter((a) => !a.fait || a.fait.jour === J);
    const attente = etat.devis.filter((d) => d.statut === "attente");
    const prepares = [], aClasser = [], nouveaux = [];
    for (const d of attente) {
      if (etat.aValider.some((a) => a.devisId === d.id && !a.fait)) continue;
      if (d.reporteJusqu && J < d.reporteJusqu) continue;
      const j = Onk.ecartJours(d.dateEnvoi, J), n = (d.relances || []).length;
      if (j >= R.arret) {
        nouveaux.push({ id: "c-" + d.id, type: "classer", devisId: d.id, jour: J, j });
        aClasser.push(d.client);
      } else if ((n === 0 && j >= R.r1) || (n === 1 && j >= R.r2 && Onk.ecartJours(d.relances[0].jour, J) >= 3)) {
        nouveaux.push({ id: "v-" + d.id + "-" + (n + 1), type: "relance", devisId: d.id, n: n + 1, texte: rediger(d, n + 1), canal: canalDe(d), jour: J, j });
        prepares.push(d.client + (n === 1 ? " (2e relance)" : ""));
      }
    }
    // relances d'abord (les plus anciennes en tête), puis les devis à classer
    nouveaux.sort((a, b) => (a.type === b.type ? b.j - a.j : a.type === "classer" ? 1 : -1));
    etat.aValider.push(...nouveaux);

    let texte = "<b>Passage" + (origine === "simulateur" ? " (jour simulé)" : "") + "</b> : " + attente.length + " " + Onk.pluriel(attente.length, "devis vérifié", "devis vérifiés") + ".";
    if (prepares.length) texte += " " + prepares.length + " " + Onk.pluriel(prepares.length, "relance préparée", "relances préparées") + " (" + prepares.join(", ") + ").";
    if (aClasser.length) texte += " " + aClasser.length + " à classer après J+" + R.arret + " (" + aClasser.join(", ") + ").";
    if (!prepares.length && !aClasser.length) texte += " Rien à relancer aujourd'hui.";
    etat.journal.push({ jour: J, heure: heure(), type: "boucle", texte: typo(texte), html: true });
    etat.derniereBoucle = J;
    return nouveaux.length;
  }

  function lienEnvoi(d, canal, texte) {
    if (canal === "email") return d.email ? Onk.liens.mailto(d.email, "Devis " + (d.numero || "") + " : " + d.objet, texte) : null;
    if (!d.tel) return null;
    return canal === "sms" ? Onk.liens.sms(d.tel, texte) : Onk.liens.whatsapp(d.tel, texte);
  }

  /* ---------- Actions ---------- */
  function valider(idV) {
    const a = etat.aValider.find((x) => x.id === idV && !x.fait);
    if (!a) return false;
    const d = devisPar(a.devisId);
    const lien = lienEnvoi(d, a.canal, a.texte);
    if (!lien) {
      Onk.toast(a.canal === "email" ? "Pas d'adresse e-mail pour " + d.client + " : ajoutez-la ou choisissez WhatsApp / SMS." : "Pas de numéro de téléphone pour " + d.client + " : ajoutez-le ou choisissez l'e-mail.");
      ouvrirDevis(d.id);
      return false;
    }
    Onk.ouvrirLien(lien);
    d.relances = d.relances || [];
    d.relances.push({ n: a.n, jour: jour(), heure: heure(), canal: a.canal });
    a.fait = { jour: jour(), heure: heure(), action: "envoi", canal: a.canal };
    noter("envoi", "Relance " + a.n + " envoyée à " + d.client + " (" + CANAUX[a.canal] + ").");
    return true;
  }
  function plusTard(idV) {
    const a = etat.aValider.find((x) => x.id === idV);
    if (!a) return;
    const d = devisPar(a.devisId);
    d.reporteJusqu = Onk.ajouterJours(jour(), a.type === "classer" ? 7 : 2);
    etat.aValider = etat.aValider.filter((x) => x !== a);
    noter("boucle", (a.type === "classer" ? "Devis de " + d.client + " gardé encore 7 jours" : "Relance de " + d.client + " reportée") + " (jusqu'au " + Onk.dateCourte(d.reporteJusqu) + ").");
  }
  function classer(idV) {
    const a = etat.aValider.find((x) => x.id === idV && !x.fait);
    if (!a) return;
    const d = devisPar(a.devisId);
    d.statut = "classe"; d.reponse = { jour: jour() };
    a.fait = { jour: jour(), heure: heure(), action: "classe" };
    noter("reponse", d.client + " : classé sans suite après J+" + Onk.ecartJours(d.dateEnvoi, jour()) + " (" + euros(d.montant, false) + " retirés de l'attente).");
  }
  const LIBELLES_REPONSE = { accepte: "accepté", refuse: "refusé", rappeler: "à rappeler" };
  function repondre(id, type) {
    const d = devisPar(id);
    if (!d) return;
    const avant = d.statut;
    d.statut = type; d.reponse = { jour: jour() };
    etat.aValider = etat.aValider.filter((a) => a.devisId !== id || a.fait);
    if (type === "attente") { delete d.reponse; noter("boucle", d.client + " : remis en attente."); return; }
    noter("reponse", d.client + " : " + LIBELLES_REPONSE[type] + (avant === "attente" ? ". " + euros(d.montant, false) + " de moins en attente." : "."));
  }
  function changerJour(n, origine = "simulateur") {
    for (let i = 0; i < n; i++) { etat.decalage = (etat.decalage || 0) + 1; boucle(origine); }
  }

  /* ---------- Rendu ---------- */
  const STATUTS = {
    attente: ["En attente", "statut-stylo"], accepte: ["Accepté", "statut-encre"], refuse: ["Refusé", "statut-gris"],
    rappeler: ["À rappeler", "statut-contour"], classe: ["Classé sans suite", "statut-gris"]
  };

  function rendreTotal() {
    const total = totalAttente();
    const enAttente = etat.devis.filter((d) => d.statut === "attente");
    const relances = enAttente.filter((d) => (d.relances || []).length).length;
    $("#total").textContent = euros(vue.total != null ? Math.round(vue.total) : total, false);
    $("#total-sous").innerHTML = enAttente.length
      ? "<b>" + enAttente.length + "</b> " + Onk.pluriel(enAttente.length, "devis envoyé", "devis envoyés") + " sans réponse" + (relances ? ", dont " + relances + " déjà " + Onk.pluriel(relances, "relancé", "relancés") : "") + "."
      : "Aucun devis en attente.";
    const J = jour();
    const recents = (s) => etat.devis.filter((d) => d.statut === s && d.reponse && Onk.ecartJours(d.reponse.jour, J) <= 30);
    const somme = (l) => l.reduce((s, d) => s + (+d.montant || 0), 0);
    const rappeler = etat.devis.filter((d) => d.statut === "rappeler");
    $("#repartition").innerHTML =
      "<div><dt>À rappeler</dt><dd>" + euros(somme(rappeler), false) + "</dd></div>" +
      "<div><dt>Acceptés (30 jours)</dt><dd>" + euros(somme(recents("accepte")), false) + "</dd></div>";
  }

  function rendreBoucle() {
    const J = jour(), R = etat.reglages;
    $("#aujourdhui").innerHTML = esc(Onk.majuscule(Onk.dateLongue(J))) + (etat.decalage ? '<span class="simule">jour simulé, +' + etat.decalage + "&nbsp;j</span>" : "");
    $("#regles").innerHTML =
      '<div class="regle"><b>J+' + R.r1 + '</b><span>1re relance préparée</span></div>' +
      '<div class="regle"><b>J+' + R.r2 + '</b><span>2e relance préparée</span></div>' +
      '<div class="regle"><b>J+' + R.arret + '</b><span>on arrête, à classer</span></div>';
    const dernier = [...etat.journal].reverse().find((e) => e.type === "boucle" && /Passage/.test(e.texte));
    $("#dernier-passage").innerHTML = dernier
      ? "Dernier passage : " + (dernier.jour === J ? "aujourd'hui" : esc(Onk.dateCourte(dernier.jour))) + " à " + Onk.heure(dernier.heure) + ". Prochain : demain matin."
      : "La boucle passe à l'ouverture, puis chaque matin.";
    $("#jour-zero").disabled = !etat.decalage;
  }

  function rendreJournal() {
    const l = etat.journal.slice(-40).reverse();
    $("#journal").innerHTML = l.length ? l.map((e) =>
      '<li class="j-' + e.type + '"><time>' + esc(Onk.dateCourte(e.jour)) + "<br>" + Onk.heure(e.heure) + "</time><span>" + (e.html ? e.texte : esc(e.texte)) + "</span></li>"
    ).join("") : '<li><time></time><span class="discret">Rien pour l\'instant.</span></li>';
  }

  function texteMessage(a) {
    // le texte complet, invisible, réserve la place ; le texte tapé s'écrit par-dessus
    const n = !vue.frappe || vue.frappe[a.id] == null ? a.texte.length : vue.frappe[a.id];
    return '<span class="fantome" aria-hidden="true">' + esc(a.texte) + '</span><span class="frappe">' + esc(a.texte.slice(0, n)) + "</span>";
  }

  function rendreValider() {
    const J = jour();
    const l = etat.aValider.filter((a) => !vue.cachees || !vue.cachees.has(a.id));
    const restant = etat.aValider.filter((a) => !a.fait).length;
    $("#nb-valider").textContent = restant ? "· " + restant + " en attente de votre accord" : "";
    if (!l.length) {
      $("#liste-valider").innerHTML = '<div class="vide carte"><span class="manuscrit">Rien à valider pour l\'instant.</span>' +
        (etat.devis.length ? "La boucle repasse demain matin." : "Ajoutez vos devis envoyés (bouton « + Devis ») ou importez un tableau (menu Fichier).") + "</div>";
      return;
    }
    $("#liste-valider").innerHTML = l.map((a) => {
      const d = devisPar(a.devisId);
      if (!d) return "";
      if (a.fait) {
        const quoi = a.fait.action === "classe"
          ? "Devis de <b>" + esc(d.client) + "</b> classé sans suite"
          : "Relance " + a.n + " envoyée à <b>" + esc(d.client) + "</b> par " + CANAUX[a.fait.canal];
        return '<div class="fait" id="' + a.id + '"><span>' + typo(quoi) + '</span><span class="quand">' + Onk.heure(a.fait.heure) + "</span></div>";
      }
      const j = Onk.ecartJours(d.dateEnvoi, J);
      const tete = '<div class="brouillon-tete"><span class="qui">' + esc(d.client) + '</span><span class="quoi">' + esc(d.objet) + '</span><span class="combien">' + euros(d.montant, false) + "</span></div>";
      if (a.type === "classer") {
        const n = (d.relances || []).length;
        return '<article class="brouillon classer carte" id="' + a.id + '">' + tete +
          '<p class="brouillon-sous"><span class="statut statut-alerte">J+' + j + "</span>" + typo("Envoyé le " + esc(Onk.dateCourte(d.dateEnvoi)) + ", " + n + " " + Onk.pluriel(n, "relance", "relances") + " sans réponse. La boucle s'arrête ici : on le classe ?") + "</p>" +
          '<div class="brouillon-actions"><button class="bouton bouton-encre" type="button" data-action="classer" data-id="' + a.id + '">Classer sans suite</button>' +
          '<button class="bouton bouton-petit" type="button" data-action="plus-tard" data-id="' + a.id + '">Garder 7 jours de plus</button></div></article>';
      }
      const canaux = Object.keys(CANAUX).map((c) =>
        '<button class="canal" type="button" data-action="canal" data-id="' + a.id + '" data-canal="' + c + '" aria-pressed="' + (a.canal === c) + '">' + CANAUX[c].replace(/^e-mail$/, "E-mail") + "</button>").join("");
      const message = Onk.FILM
        ? '<div class="message message-film" aria-label="Message">' + texteMessage(a) + "</div>"
        : '<textarea class="message" data-id="' + a.id + '" aria-label="Message pour ' + esc(d.client) + ' (modifiable)">' + esc(a.texte) + "</textarea>";
      return '<article class="brouillon carte" id="' + a.id + '">' + tete +
        '<div class="brouillon-sous"><span class="statut statut-stylo">Relance ' + a.n + "</span>" +
        "<span>envoyé le " + esc(Onk.dateCourte(d.dateEnvoi)) + ', <span class="jours">J+' + j + "</span></span>" +
        '<span class="canaux" role="group" aria-label="Canal d\'envoi">' + canaux + "</span></div>" +
        message +
        '<div class="brouillon-actions"><button class="bouton bouton-plein" type="button" data-action="valider" data-id="' + a.id + '">Valider et envoyer par ' + CANAUX[a.canal] + "</button>" +
        '<button class="bouton bouton-petit" type="button" data-action="plus-tard" data-id="' + a.id + '">Plus tard</button>' +
        '<span class="note-envoi">' + typo("Ouvre votre messagerie : rien ne part sans vous.") + "</span></div></article>";
    }).join("");
    if (!Onk.FILM) document.querySelectorAll("textarea.message").forEach(ajusterHauteur);
  }
  function ajusterHauteur(z) { z.style.height = "auto"; z.style.height = Math.min(z.scrollHeight + 4, 420) + "px"; }

  const FILTRES = { cours: "En cours", attente: "En attente", rappeler: "À rappeler", clos: "Clos", tous: "Tous" };
  function filtrer(d) {
    const f = etat.filtre || "cours", J = jour();
    if (f === "tous") return true;
    if (f === "attente" || f === "rappeler") return d.statut === f;
    const clos = ["accepte", "refuse", "classe"].includes(d.statut);
    if (f === "clos") return clos;
    return !clos || (d.reponse && Onk.ecartJours(d.reponse.jour, J) <= 7);
  }
  function rendreDevis() {
    const J = jour();
    $("#filtres").innerHTML = Object.keys(FILTRES).map((f) =>
      '<button class="filtre" type="button" data-action="filtre" data-filtre="' + f + '" aria-pressed="' + ((etat.filtre || "cours") === f) + '">' + FILTRES[f] + "</button>").join("");
    const l = etat.devis.filter(filtrer).sort((a, b) => (a.dateEnvoi < b.dateEnvoi ? -1 : a.dateEnvoi > b.dateEnvoi ? 1 : 0));
    if (!l.length) {
      $("#liste-devis").innerHTML = '<div class="vide"><span class="manuscrit">Aucun devis ici.</span>' + (etat.devis.length ? "Changez de filtre." : "Ajoutez un devis ou importez un tableau.") + "</div>";
      return;
    }
    $("#liste-devis").innerHTML = l.map((d) => {
      const j = Onk.ecartJours(d.dateEnvoi, J), n = (d.relances || []).length;
      const clos = ["accepte", "refuse", "classe"].includes(d.statut);
      const [lib, cls] = STATUTS[d.statut] || STATUTS.attente;
      const points = '<span class="points" title="' + n + ' relance(s)" aria-label="' + n + ' relance(s) envoyée(s)">' + [1, 2].map((k) => '<i class="' + (n >= k ? "plein" : "") + '"></i>').join("") + "</span>";
      const statut = d.statut === "attente" && n ? "Relancé " + n + "×" : lib;
      const reponses = d.statut === "attente"
        ? ["accepte", "refuse", "rappeler"].map((t) => '<button class="bouton bouton-reponse" type="button" data-action="rep" data-type="' + t + '" data-id="' + d.id + '">' + Onk.majuscule(LIBELLES_REPONSE[t]) + "</button>").join("")
        : '<button class="bouton-texte" type="button" data-action="rep" data-type="attente" data-id="' + d.id + '">Remettre en attente</button>';
      return '<div class="devis-ligne' + (clos ? " clos" : "") + '" id="devis-' + esc(d.id) + '">' +
        '<div><div class="qui"><button type="button" data-action="editer" data-id="' + esc(d.id) + '">' + esc(d.client) + '</button><span class="num">' + esc(d.numero || "") + '</span></div><div class="objet">' + esc(d.objet) + "</div></div>" +
        '<div class="montant">' + euros(d.montant, false) + "</div>" +
        '<div class="infos"><span>' + esc(Onk.dateCourte(d.dateEnvoi)) + ', <span class="jours">J+' + j + "</span></span>" + points + '<span class="statut ' + cls + '">' + statut + "</span></div>" +
        '<div class="reponses">' + reponses + "</div></div>";
    }).join("");
  }

  function rendreBandeau() {
    const b = $("#bandeau");
    if (etat.exemple) {
      b.hidden = false;
      b.innerHTML = '<span class="tampon-exemple">Exemple, données fictives</span><span>Ces devis servent à essayer l\'outil.</span>' +
        (Onk.FILM ? "" : '<button class="bouton-texte" type="button" data-action="vider">Effacer l\'exemple et commencer</button>');
    } else if (!etat.reglages.signature) {
      b.hidden = false;
      b.innerHTML = '<span>' + typo("Ajoutez votre signature pour qu'elle termine chaque relance :") + '</span><button class="bouton-texte" type="button" data-action="reglages">Réglages</button>';
    } else b.hidden = true;
  }

  function rendre() {
    rendreBandeau(); rendreTotal(); rendreBoucle(); rendreJournal(); rendreValider(); rendreDevis();
  }

  /* ---------- Le total qui compte (hors film) ---------- */
  let animation = 0;
  function animerTotal(de, a) {
    cancelAnimationFrame(animation);
    if (de === a || matchMedia("(prefers-reduced-motion: reduce)").matches) { vue.total = null; rendreTotal(); return; }
    const t0 = performance.now(), duree = 1100;
    const pas = (now) => {
      const k = Math.min(1, (now - t0) / duree);
      vue.total = Onk.film.compte(de, a, k, 0, 1);
      rendreTotal();
      if (k < 1) animation = requestAnimationFrame(pas); else { vue.total = null; rendreTotal(); }
    };
    animation = requestAnimationFrame(pas);
  }
  function agir(f) {
    const avant = totalAttente();
    f();
    sauver();
    rendre();
    animerTotal(avant, totalAttente());
  }

  /* ---------- Fenêtres ---------- */
  let retourFocus = null;
  function ouvrirFenetre(titre, html, monter) {
    retourFocus = document.activeElement;
    const z = $("#fenetre-zone");
    z.innerHTML = '<div class="voile" data-fermer="1"><div class="fenetre" role="dialog" aria-modal="true" aria-labelledby="fenetre-titre">' +
      '<div class="fenetre-tete"><h2 class="titre-section" id="fenetre-titre">' + titre + '</h2><button class="fermer" type="button" data-fermer="1" aria-label="Fermer">×</button></div>' + html + "</div></div>";
    const f = z.querySelector(".fenetre");
    if (monter) monter(f);
    const premier = f.querySelector("input, textarea, select, button:not(.fermer)");
    (premier || f.querySelector(".fermer")).focus();
  }
  function fermerFenetre() { $("#fenetre-zone").innerHTML = ""; if (retourFocus && retourFocus.focus) retourFocus.focus(); }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#fenetre-zone").innerHTML) fermerFenetre(); });
  $("#fenetre-zone").addEventListener("click", (e) => { if (e.target.dataset && e.target.dataset.fermer) fermerFenetre(); });

  function ouvrirDevis(id) {
    const d = id ? devisPar(id) : { numero: "", client: "", objet: "", montant: "", dateEnvoi: jour(), email: "", tel: "", canal: "email" };
    if (!d) return;
    const opt = Object.keys(CANAUX).map((c) => '<option value="' + c + '"' + (d.canal === c ? " selected" : "") + ">" + Onk.majuscule(CANAUX[c]) + "</option>").join("");
    ouvrirFenetre(id ? "Modifier le devis" : "Ajouter un devis envoyé",
      '<form class="formulaire" id="form-devis">' +
      '<div class="grille-champs"><label class="champ"><span>Client</span><input name="client" required value="' + esc(d.client) + '" placeholder="Mme Martin"></label>' +
      '<label class="champ"><span>N° du devis</span><input name="numero" value="' + esc(d.numero) + '" placeholder="D-2026-050"></label></div>' +
      '<label class="champ"><span>Objet</span><input name="objet" required value="' + esc(d.objet) + '" placeholder="Pose d\'une cuisine"></label>' +
      '<div class="grille-champs"><label class="champ"><span>Montant (€)</span><input name="montant" required inputmode="decimal" value="' + esc(d.montant) + '" placeholder="2 400"></label>' +
      '<label class="champ"><span>Envoyé le</span><input name="dateEnvoi" type="date" required value="' + esc(d.dateEnvoi) + '"></label></div>' +
      '<div class="grille-champs"><label class="champ"><span>E-mail</span><input name="email" type="email" value="' + esc(d.email) + '"></label>' +
      '<label class="champ"><span>Téléphone</span><input name="tel" type="tel" value="' + esc(d.tel) + '"></label></div>' +
      '<label class="champ"><span>Relancer par</span><select name="canal">' + opt + "</select></label>" +
      '<div class="actions">' + (id ? '<button class="bouton" type="button" data-action="supprimer-devis">Supprimer</button>' : "") +
      '<button class="bouton" type="button" data-fermer="1">Annuler</button><button class="bouton bouton-plein" type="submit">Enregistrer</button></div></form>',
      (f) => {
        f.querySelector("form").addEventListener("submit", (e) => {
          e.preventDefault();
          const v = Object.fromEntries(new FormData(e.target));
          const montant = Onk.lireNombre(v.montant);
          if (!Number.isFinite(montant)) { Onk.toast("Montant illisible : écrivez par exemple 2400 ou 2 400,50."); return; }
          const champs = { client: v.client.trim(), numero: v.numero.trim(), objet: v.objet.trim(), montant: Onk.arrondi(montant), dateEnvoi: v.dateEnvoi, email: v.email.trim(), tel: v.tel.trim(), canal: v.canal };
          agir(() => {
            if (id) Object.assign(d, champs);
            else { etat.devis.push(Object.assign({ id: Onk.id("d"), statut: "attente", relances: [] }, champs)); noter("boucle", "Devis ajouté : " + champs.client + " (" + euros(champs.montant, false) + ")."); }
            boucle("ouverture");
          });
          fermerFenetre();
        });
        const s = f.querySelector('[data-action="supprimer-devis"]');
        if (s) s.addEventListener("click", () => {
          if (!confirm("Supprimer le devis de " + d.client + " ?")) return;
          agir(() => { etat.devis = etat.devis.filter((x) => x !== d); etat.aValider = etat.aValider.filter((a) => a.devisId !== d.id); });
          fermerFenetre();
        });
      });
  }

  function ouvrirMenu() {
    ouvrirFenetre("Fichier",
      '<div class="menu-liste">' +
      '<button class="bouton" type="button" data-m="importer">Importer des devis (CSV, depuis un tableur)</button>' +
      '<button class="bouton" type="button" data-m="exporter">Exporter les devis (CSV)</button>' +
      '<button class="bouton" type="button" data-m="sauver">Sauvegarde complète (fichier JSON)</button>' +
      '<button class="bouton" type="button" data-m="restaurer">Restaurer une sauvegarde (JSON)</button>' +
      '<button class="bouton" type="button" data-m="exemple">Recharger l\'exemple (données fictives)</button>' +
      '<button class="bouton" type="button" data-m="effacer">Tout effacer</button></div>',
      (f) => f.addEventListener("click", async (e) => {
        const m = e.target.closest("[data-m]"); if (!m) return;
        const a = m.dataset.m;
        if (a === "importer") return ouvrirImport();
        if (a === "exporter") {
          const cols = [{ cle: "numero", titre: "numero" }, { cle: "client", titre: "client" }, { cle: "objet", titre: "objet" },
            { titre: "montant", val: (d) => String(d.montant).replace(".", ",") }, { titre: "date_envoi", val: (d) => Onk.dateNum(d.dateEnvoi) },
            { cle: "email", titre: "email" }, { cle: "tel", titre: "telephone" }, { titre: "statut", val: (d) => (STATUTS[d.statut] || [d.statut])[0] },
            { titre: "relances", val: (d) => (d.relances || []).length }];
          Onk.telecharger("devis-" + Onk.horodatage() + ".csv", Onk.csv.ecrire(cols, etat.devis), "text/csv;charset=utf-8");
        }
        if (a === "sauver") Onk.telecharger("relances-sauvegarde-" + Onk.horodatage() + ".json", JSON.stringify(etat, null, 2), "application/json");
        if (a === "restaurer") {
          const fic = await Onk.choisirFichier(".json,application/json"); if (!fic) return;
          try { const e2 = JSON.parse(fic.texte); if (!Array.isArray(e2.devis)) throw new Error(); etat = e2; etat.reglages = Object.assign(etatVide().reglages, etat.reglages); agir(() => {}); Onk.toast("Sauvegarde restaurée : " + etat.devis.length + " devis."); }
          catch (err) { Onk.toast("Ce fichier n'est pas une sauvegarde des relances."); }
        }
        if (a === "exemple") { if (!etat.devis.length || confirm("Remplacer vos données par l'exemple ?")) { etat = etatExemple(Onk.aujourdhui()); agir(() => boucle("ouverture")); } }
        if (a === "effacer") { if (confirm("Effacer tous les devis, relances et le journal ?")) { const r = etat.reglages; etat = etatVide(); etat.reglages = r; agir(() => {}); } }
        fermerFenetre();
      }));
  }

  function ouvrirImport() {
    ouvrirFenetre("Importer des devis",
      '<div class="formulaire"><p class="discret">Exportez vos devis depuis votre tableur ou votre logiciel en CSV. Colonnes reconnues : <b>client</b>, <b>objet</b>, <b>montant</b>, <b>date d\'envoi</b>, et si possible <b>numéro</b>, <b>e-mail</b>, <b>téléphone</b>. Les devis sont ajoutés « en attente ».</p>' +
      '<pre class="exemple-csv">numero;client;objet;montant;date_envoi;email;telephone\nD-2026-050;Mme Martin;Pose cuisine;4 200,00;02/10/2026;martin@exemple.fr;</pre>' +
      '<label class="champ"><span>Coller le contenu du fichier</span><textarea id="csv-texte" placeholder="Collez ici, ou choisissez un fichier"></textarea></label>' +
      (etat.exemple ? '<p class="discret">Les devis d\'exemple seront retirés.</p>' : "") +
      '<div class="actions"><button class="bouton" type="button" id="csv-fichier">Choisir un fichier…</button><button class="bouton bouton-plein" type="button" id="csv-go">Importer</button></div></div>',
      (f) => {
        f.querySelector("#csv-fichier").addEventListener("click", async () => { const fic = await Onk.choisirFichier(".csv,text/csv,.txt"); if (fic) f.querySelector("#csv-texte").value = fic.texte; });
        f.querySelector("#csv-go").addEventListener("click", () => {
          const r = importerCSV(f.querySelector("#csv-texte").value);
          if (!r.ajoutes) { Onk.toast(r.erreurs[0] || "Aucun devis reconnu. Vérifiez la ligne d'en-tête."); return; }
          fermerFenetre();
          Onk.toast(r.ajoutes + " " + Onk.pluriel(r.ajoutes, "devis importé", "devis importés") + (r.erreurs.length ? ", " + r.erreurs.length + " ligne(s) ignorée(s) : " + r.erreurs.slice(0, 2).join(" ; ") : "."), 7000);
        });
      });
  }

  function importerCSV(texte) {
    const lignes = Onk.csv.objets(texte), ajout = [], erreurs = [];
    lignes.forEach((o, i) => {
      const client = Onk.colonne(o, "client", "nom", "societe");
      const montant = Onk.lireNombre(Onk.colonne(o, "montant", "total", "prix", "ttc", "ht"));
      const date = Onk.lireDate(Onk.colonne(o, "date d envoi", "date_envoi", "envoye", "date"));
      if (!client) return erreurs.push("ligne " + (i + 2) + " sans client");
      if (!Number.isFinite(montant)) return erreurs.push("ligne " + (i + 2) + " montant illisible");
      if (!date) return erreurs.push("ligne " + (i + 2) + " date illisible (attendu 02/10/2026)");
      const email = Onk.colonne(o, "email", "e mail", "mail", "courriel");
      const tel = Onk.colonne(o, "telephone", "tel", "portable", "mobile");
      ajout.push({ id: Onk.id("d"), numero: Onk.colonne(o, "numero", "n ", "ref", "devis"), client, objet: Onk.colonne(o, "objet", "designation", "description", "travaux", "libelle") || "Devis",
        montant: Onk.arrondi(montant), dateEnvoi: date, email, tel, canal: email ? "email" : "whatsapp", statut: "attente", relances: [] });
    });
    if (ajout.length) agir(() => {
      if (etat.exemple) { const r = etat.reglages; etat = etatVide(); etat.reglages = Object.assign(r, { signature: "" }); }
      etat.devis.push(...ajout);
      noter("boucle", ajout.length + " " + Onk.pluriel(ajout.length, "devis importé", "devis importés") + ".");
      boucle("ouverture");
    });
    return { ajoutes: ajout.length, erreurs };
  }

  function ouvrirReglages() {
    const R = etat.reglages;
    ouvrirFenetre("Réglages de la boucle",
      '<form class="formulaire" id="form-reglages">' +
      '<label class="champ"><span>Signature des relances</span><textarea name="signature" rows="3" placeholder="Prénom Nom&#10;Entreprise · téléphone">' + esc(R.signature) + "</textarea></label>" +
      '<div class="grille-champs"><label class="champ"><span>1re relance (jours)</span><input name="r1" type="number" min="1" max="60" value="' + R.r1 + '"></label>' +
      '<label class="champ"><span>2e relance (jours)</span><input name="r2" type="number" min="2" max="90" value="' + R.r2 + '"></label>' +
      '<label class="champ"><span>Arrêt (jours)</span><input name="arret" type="number" min="3" max="120" value="' + R.arret + '"></label></div>' +
      '<p class="discret">Les jours se comptent depuis la date d\'envoi du devis. Les relances déjà préparées ne sont pas réécrites.</p>' +
      '<div class="actions"><button class="bouton" type="button" data-fermer="1">Annuler</button><button class="bouton bouton-plein" type="submit">Enregistrer</button></div></form>',
      (f) => f.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = Object.fromEntries(new FormData(e.target));
        const r1 = +v.r1, r2 = +v.r2, arret = +v.arret;
        if (!(r1 < r2 && r2 < arret)) { Onk.toast("Les délais doivent se suivre : 1re relance < 2e relance < arrêt."); return; }
        agir(() => { Object.assign(etat.reglages, { signature: v.signature.trim(), r1, r2, arret }); boucle("ouverture"); });
        fermerFenetre();
      }));
  }

  /* ---------- Événements ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b || Onk.FILM) return;
    const a = b.dataset.action, id = b.dataset.id;
    if (a === "valider") agir(() => valider(id));
    else if (a === "plus-tard") agir(() => plusTard(id));
    else if (a === "classer") agir(() => classer(id));
    else if (a === "rep") agir(() => repondre(id, b.dataset.type));
    else if (a === "canal") { const v = etat.aValider.find((x) => x.id === id); if (v) { v.canal = b.dataset.canal; sauver(); rendreValider(); } }
    else if (a === "filtre") { etat.filtre = b.dataset.filtre; sauver(); rendreDevis(); }
    else if (a === "jour+1") agir(() => changerJour(1));
    else if (a === "jour+7") agir(() => changerJour(7));
    else if (a === "jour0") agir(() => { etat.decalage = 0; noter("boucle", "Retour à la date du jour."); });
    else if (a === "ajouter") ouvrirDevis(null);
    else if (a === "editer") ouvrirDevis(id);
    else if (a === "menu") ouvrirMenu();
    else if (a === "reglages") ouvrirReglages();
    else if (a === "vider") { if (confirm("Effacer les devis d'exemple pour saisir les vôtres ?")) { const r = etat.reglages; etat = etatVide(); etat.reglages = Object.assign(r, { signature: "" }); agir(() => {}); } }
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches("textarea.message")) {
      const v = etat.aValider.find((x) => x.id === e.target.dataset.id);
      if (v) { v.texte = e.target.value; sauver(); ajusterHauteur(e.target); }
    }
  });

  // La boucle tourne à l'ouverture, puis dès que le jour change
  function verifierJour() { if (etat.derniereBoucle !== jour()) agir(() => boucle("ouverture")); }

  /* ---------- Mode film ---------- */
  function installerFilm() {
    const EVENEMENTS = [
      { t: 1.0, heure: "09:00", f: () => boucle("ouverture"), frappe: true },
      { t: 8.15, heure: "09:02", f: () => valider("v-d2-2") },
      { t: 10.75, heure: "09:03", f: () => valider("v-d1-1") },
      { t: 13.35, heure: "09:03", f: () => valider("v-d3-1") },
      { t: 16.65, heure: "07:00", f: () => changerJour(1) },
      { t: 21.15, heure: "10:14", f: () => repondre("d1", "accepte") },
      { t: 26.15, heure: "10:20", f: () => classer("c-d4") },
      { t: 30.65, heure: "07:00", f: () => changerJour(1), frappe: true },
      { t: 35.15, heure: "08:12", f: () => valider("v-d5-1") },
      { t: 39.15, heure: "11:40", f: () => repondre("d2", "rappeler") }
    ];
    function rendreFilm(t) {
      etat = etatExemple(Onk.DATE_FILM);
      vue.total = null; vue.frappe = {}; vue.cachees = new Set(); vue.heure = "09:00";
      let changement = null, derniereFrappe = null;
      for (const ev of EVENEMENTS) {
        if (ev.t > t) break;
        vue.heure = ev.heure;
        const avant = totalAttente(), ids = new Set(etat.aValider.map((a) => a.id));
        ev.f();
        const apres = totalAttente();
        if (apres !== avant) changement = { t: ev.t, de: avant, a: apres };
        if (ev.frappe) derniereFrappe = { t: ev.t, ids: etat.aValider.filter((a) => !ids.has(a.id) && a.type === "relance").map((a) => a.id) };
      }
      // les relances s'écrivent une à une, juste après le passage de la boucle
      if (derniereFrappe) derniereFrappe.ids.forEach((id, k) => {
        const debut = derniereFrappe.t + 0.3 + k * 0.7;
        const a = etat.aValider.find((x) => x.id === id);
        if (t < debut) vue.cachees.add(id);
        else vue.frappe[id] = Math.floor((t - debut) * 150);
        if (a && vue.frappe[id] >= a.texte.length) delete vue.frappe[id];
      });
      if (derniereFrappe) etat.aValider.filter((a) => a.type === "classer" && !a.fait).forEach((a) => { if (t < derniereFrappe.t + 0.3 + derniereFrappe.ids.length * 0.7) vue.cachees.add(a.id); });
      if (changement && t < changement.t + 1.4) vue.total = Onk.film.compte(changement.de, changement.a, t, changement.t + 0.1, changement.t + 1.4);
      rendre();
      document.scrollingElement.scrollTop = 0;
      const j = $("#journal"); if (j) j.scrollTop = 0;
    }
    const v = (id) => '[data-action="valider"][data-id="' + id + '"]';
    Onk.film.installer({
      duree: 48,
      vue: "bureau",
      etapes: [
        { t: 0, titre: "Lundi matin : 20 770 € de devis sans réponse" },
        { t: 1, titre: "La boucle passe : 3 relances préparées, 1 devis à classer" },
        { t: 7.5, titre: "Un geste pour valider : la relance part" },
        { t: 16.4, titre: "Le lendemain, la boucle repasse" },
        { t: 20.8, titre: "Mme Lefèvre accepte : le total baisse" },
        { t: 25.8, titre: "J+23, deux relances sans réponse : on classe" },
        { t: 30.4, titre: "Mercredi : nouvelle relance préparée (J+5)" },
        { t: 38.8, titre: "M. Bernard veut être rappelé" },
        { t: 42, titre: "Personne n'a relancé à la main" }
      ],
      rendre: rendreFilm,
      gestes: [
        { t: 6.4, cible: { x: 1180, y: 860 } },
        { t: 8.0, cible: v("v-d2-2"), appui: true, trajet: 1.2 },
        { t: 10.6, cible: v("v-d1-1"), appui: true, trajet: 1.0 },
        { t: 13.2, cible: v("v-d3-1"), appui: true, trajet: 1.0 },
        { t: 16.5, cible: "#jour-plus-1", appui: true, trajet: 1.4 },
        { t: 21.0, cible: '[data-action="rep"][data-type="accepte"][data-id="d1"]', appui: true, trajet: 1.6 },
        { t: 26.0, cible: '[data-action="classer"][data-id="c-d4"]', appui: true, trajet: 1.4 },
        { t: 30.5, cible: "#jour-plus-1", appui: true, trajet: 1.4 },
        { t: 35.0, cible: v("v-d5-1"), appui: true, trajet: 1.4 },
        { t: 39.0, cible: '[data-action="rep"][data-type="rappeler"][data-id="d2"]', appui: true, trajet: 1.4 },
        { t: 41.5, cible: null }
      ]
    });
  }

  /* ---------- Démarrage ---------- */
  if (Onk.FILM) { installerFilm(); return; }
  charger();
  rendre();
  verifierJour();
  setInterval(verifierJour, 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) verifierJour(); });
})();
