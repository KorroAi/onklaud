/* Atelier Morel : logiciel de gestion réel (planning, chantiers, devis, factures, stocks, clients). */
(function () {
  "use strict";
  const O = window.Outils, A = window.AtelierMorel, esc = O.esc;
  const m = window.Magasin("atelier-morel", A.depart, A.automatismes);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ICONES = {
    aujourdhui: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600l1.400 1.400M17 17l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400"/>',
    planning: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16"/>',
    chantiers: '<path d="M4 20V10l8-6 8 6v10"/><path d="M10 20v-6h4v6"/>',
    devis: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
    factures: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17"/>',
    stocks: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    clients: '<circle cx="9" cy="9" r="3.5"/><path d="M3 20c.6-3.4 3-5 6-5s5.400 1.600 6 5M16 5.500a3.500 3.500 0 010 7M17.500 15c2 .6 3.100 2.400 3.500 5"/>'
  };
  const SECTIONS = [["aujourdhui", "Affaires"], ["planning", "Planning"], ["chantiers", "Chantiers"], ["devis", "Devis"], ["factures", "Factures"], ["stocks", "Matériel"], ["clients", "Clients"]];
  const mobile = () => window.matchMedia("(max-width: 820px)").matches;
  const CATALOGUE = [["Main-d’œuvre", "jour", 420], ["Carrelage grès cérame, fourni posé", "m²", 78], ["Peinture, deux couches", "m²", 24], ["Déplacement", "forfait", 45]];
  const COULEURS = { julien: ["#e8f0fe", "#1a3f8f"], thomas: ["#fdf3d8", "#6b4e00"], sarah: ["#eef0f2", "#3a424a"], karim: ["#fdeae6", "#8a2a18"] };
  const JOURS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."];
  const H0 = 8, PX_H = 76;
  const ui = { vue: new URLSearchParams(location.search).get("vue") || "aujourdhui", lundi: O.lundi(A.reference()), jour: O.iso(A.reference()), masques: {} };
  const client = (id) => m.d.clients.find((c) => c.id === id) || { nom: "" };
  const ttc = (x) => A.totalHT(x) * (1 + A.TVA);

  const toast = (t) => {
    $$(".toast").forEach((e) => e.remove());
    const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t;
    document.body.appendChild(d); setTimeout(() => d.remove(), 3600);
  };

  /* ---------- Menu et panneau ---------- */
  const menu = () => {
    const d = m.d, b = A.bilan(d), bas = d.stocks.filter((s) => s.q <= s.seuil && !s.commande).length, act = A.aFaire(d).length;
    const em = { aujourdhui: act, factures: b.nbRetard, stocks: bas };
    $("#menu").innerHTML = SECTIONS.map(([k, t]) => '<button class="lien" data-vue="' + k + '" aria-current="' + (ui.vue === k) + '"><svg viewBox="0 0 24 24">' + ICONES[k] + "</svg><span>" + t + "</span>" + (em[k] ? "<em>" + em[k] + "</em>" : "") + "</button>").join("");
    $("#equipe").innerHTML = d.equipe.map((e) => '<button class="membre" data-membre="' + e.id + '" aria-pressed="' + !ui.masques[e.id] + '"><i style="background:' + e.c + '"></i>' + e.nom + "</button>").join("");
  };
  const journal = (n) => m.d.journal.length ? m.d.journal.slice(0, n).map((j) => '<p class="' + j.type + (ui.vus && !ui.vus.has(j.id) ? " neuf" : "") + '"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg><span>' + esc(j.texte) + "<small>" + esc(j.h) + "</small></span></p>").join("") : '<span class="vide">Les actions automatiques s’afficheront ici.</span>';
  const panneau = () => {
    $("#panneau").innerHTML = '<section class="auto"><h2>Fait pour vous</h2><p class="note">Ce que le logiciel a fait à votre place aujourd’hui.</p>' + journal(9) + "</section>";
  };

  /* Encaissements des huit dernières semaines et position des équipes sur la carte */
  const graphiques = () => {
    const d = m.d, sem = d.histo.concat([d.factures.filter((f) => f.payee && f.payeeLe && A.age(f.payeeLe) <= 7).reduce((t, f) => t + f.ttc, 0)]);
    const max = Math.max(...sem), jour = O.iso(A.reference());
    const barres = sem.map((v, i) => '<div title="' + O.eur(v, 0) + '"><i style="height:' + Math.round(v / max * 100) + '%"></i>' + (i === sem.length - 1 ? "Sem." : "S-" + (sem.length - 1 - i)) + "</div>").join("");
    const lieux = { rossi: [66, 92, "M. Rossi"], martin: [186, 58, "Mme Martin"], durand: [262, 112, "Mme Durand"], leroy: [116, 34, "M. Leroy"] };
    const vus = {};
    const pins = d.interventions.filter((i) => i.jour === jour).map((i) => { const e = d.equipe.find((x) => x.id === i.qui) || d.equipe[0], l = lieux[i.client]; if (!l) return ""; const n = vus[i.client] = (vus[i.client] || 0) + 1, y = l[1] + (n - 1) * 19; return '<circle cx="' + l[0] + '" cy="' + y + '" r="7" fill="' + e.c + '" stroke="#fff" stroke-width="2"/><text x="' + (l[0] + 11) + '" y="' + (y + 4) + '">' + e.nom + "</text>"; }).join("");
    return '<div class="vue-g"><section class="panneau-g"><h2>Encaissements par semaine</h2><div class="barres-g">' + barres + '</div></section><section class="panneau-g"><h2>Vos équipes aujourd’hui</h2><svg class="carte-l" viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Carte des interventions du jour"><rect width="340" height="150" fill="#eef3ef"/><path d="M110 0c-14 40 12 60 6 92s-22 34-18 58h18c-4-24 14-30 20-60s-20-52-8-90z" fill="#bcd9ea"/><path d="M226 0c-16 46 24 72 8 150h18c14-78-24-104-8-150z" fill="#bcd9ea"/><path d="M0 44h340M0 104h340M60 0v150M170 0v150M300 0v150M0 150L340 10" stroke="#fff" stroke-width="3" fill="none"/>' + pins + "</svg></section></div>";
  };

  /* ---------- Affaires : le parcours de l'argent, de gauche à droite ---------- */
  const aujourdhui = () => {
    const d = m.d, b = A.bilan(d), l = A.aFaire(d), jour = O.iso(A.reference());
    const signes = d.devis.filter((x) => x.statut === "envoye"), dus = d.factures.filter((f) => !f.payee), payes = d.factures.filter((f) => f.payee);
    const carteD = (x) => { const n = A.age(x.date), rel = l.find((a) => a.type === "devis" && a.id === x.id); return '<article class="dossier action devis"><div class="ligne-d"><b>' + esc(client(x.client).nom) + '</b><span class="som">' + O.eur(A.totalTTC(x), 0) + "</span></div><small>" + esc(x.objet) + '</small><div class="pied-d"><span class="age">' + n + " j sans réponse" + "</span>" + (rel ? '<button class="bouton calme petit" data-faire="devis:' + x.id + '">Relancer</button>' : '<span class="fait-d">Relancé</span>') + "</div></article>"; };
    const carteF = (f) => { const r = f.echeance < O.jour(); return '<article class="dossier action ' + (r ? "urgent" : "") + '"><div class="ligne-d"><b>' + esc(client(f.client).nom) + '</b><span class="som">' + O.eur(f.ttc, 0) + "</span></div><small>" + esc(f.objet) + '</small><div class="pied-d"><span class="age">' + (r ? A.age(f.echeance) + " j de retard" : "Échéance " + O.dateCourte(f.echeance)) + "</span>" + (r && !f.relance ? '<button class="bouton calme petit" data-faire="facture:' + f.id + '">Relancer</button>' : f.relance ? '<span class="fait-d">Relancée</span>' : "") + "</div></article>"; };
    const carteP = (f) => '<article class="dossier paye"><div class="ligne-d"><b>' + esc(client(f.client).nom) + '</b><span class="som">' + O.eur(f.ttc, 0) + "</span></div><small>" + esc(f.objet) + "</small></article>";
    const carteC = (c) => { const n = c.etapes.filter((e) => e.e === "fait").length; return '<button class="dossier chantier-m" data-vue="chantiers"><b>' + esc(c.titre) + "</b><small>" + esc(client(c.client).nom) + '</small><span class="mini">' + c.etapes.map((e) => '<i class="' + e.e + '"></i>').join("") + "</span><small>" + n + " sur " + c.etapes.length + " étapes</small></button>"; };
    const col = (t, nb, html, c) => '<section class="etape-p ' + c + '"><header><h2>' + t + "</h2><span>" + nb + "</span></header>" + (html || '<p class="vide-p">Aucun dossier.</p>') + "</section>";
    const autres = l.filter((a) => a.type === "stock" || a.type === "tache");
    const date = O.dateLongue(jour).replace(/^./, (x) => x.toUpperCase());
    const n = l.filter((a) => a.type === "devis" || a.type === "facture").length;
    return '<header class="haut"><h1>Affaires</h1><span class="sem">' + date + '</span></header><div class="corps"><div class="page affaires">' +
      '<dl class="resume"><div class="fort"><dt>À récupérer</dt><dd id="a-recuperer">' + O.eur(b.recuperer, 0) + "</dd><span>" + (n ? n + (n > 1 ? " relances prêtes à envoyer" : " relance prête à envoyer") : "Tout est relancé") + "</span></div><div><dt>Devis à signer</dt><dd>" + O.eur(b.devis, 0) + "</dd><span>" + b.nbDevis + " en attente</span></div><div><dt>À encaisser</dt><dd>" + O.eur(b.impaye, 0) + "</dd><span>" + (b.nbRetard ? b.nbRetard + " en retard" : "Aucun retard") + '</span></div><div><dt>Encaissé sur 30 jours</dt><dd id="encaisse">' + O.eur(b.encaisse, 0) + "</dd><span>" + payes.length + " règlements</span></div></dl>" +
      graphiques() +
      '<div class="pipeline">' + col("À signer", signes.length, signes.map(carteD).join(""), "e1") + col("À encaisser", dus.length, dus.map(carteF).join(""), "e2") + col("En chantier", d.chantiers.length, d.chantiers.map(carteC).join(""), "e4") + col("Encaissé", payes.length, payes.slice(0, 4).map(carteP).join(""), "e3") + "</div>" +
      (autres.length ? '<ul class="aussi">' + autres.map((a) => '<li class="action"><div><b>' + esc(a.titre) + "</b><small>" + esc(a.detail) + '</small></div><button class="bouton calme petit" data-faire="' + a.type + ":" + a.id + '">' + a.bouton + "</button></li>").join("") + "</ul>" : "") +
      '<nav class="liens-plus" aria-label="Autres sections"><button data-vue="stocks">Matériel</button><button data-vue="clients">Clients</button></nav></div></div>';
  };

  /* ---------- Planning ---------- */
  const planningMobile = () => {
    const d = m.d, jours = [0, 1, 2, 3, 4].map((i) => O.jour(i, ui.lundi));
    if (!jours.includes(ui.jour)) ui.jour = jours[0];
    const l = d.interventions.filter((i) => i.jour === ui.jour).sort((a, b) => a.debut - b.debut);
    return '<header class="haut"><h1>Planning</h1><div class="droite-haut"><button class="bouton" data-action="nouvelle-intervention" aria-label="Nouvelle intervention"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></header><div class="corps"><div class="page"><div class="puces-jours">' + jours.map((j, i) => '<button data-choisir-jour="' + j + '" aria-pressed="' + (j === ui.jour) + '"><small>' + JOURS[i] + "</small><b>" + Number(j.slice(8)) + "</b></button>").join("") + '</div><ul class="sorties grand">' + (l.map((i) => { const e = d.equipe.find((x) => x.id === i.qui) || d.equipe[0]; return '<li><button class="ev-l" data-ev-l="' + i.id + '"><time>' + O.heure(i.debut) + '</time><i style="background:' + e.c + '"></i><div><b>' + esc(i.titre) + "</b><small>" + e.nom + ", " + esc(client(i.client).nom) + "</small></div></button></li>"; }).join("") || '<li class="vide">Aucune intervention ce jour.</li>') + "</ul></div></div>";
  };
  const planning = () => {
    if (mobile()) return planningMobile();
    const d = m.d, jours = [0, 1, 2, 3, 4].map((i) => O.jour(i, ui.lundi)), auj = O.jour();
    const ven = jours[4];
    const heures = Array.from({ length: 10 }, (_, i) => "<span>" + String(H0 + i) + ":00</span>").join("");
    const colonnes = jours.map((j) => {
      const duJour = d.interventions.filter((i) => i.jour === j && !ui.masques[i.qui]).sort((a, b) => a.debut - b.debut);
      const pistes = [];
      duJour.forEach((i) => {
        let p = pistes.findIndex((fin) => fin <= i.debut);
        if (p < 0) { p = pistes.length; pistes.push(0); }
        pistes[p] = i.debut + i.duree; i._p = p;
      });
      const evs = duJour.map((i) => {
        const chevauche = duJour.filter((x) => x.debut < i.debut + i.duree && i.debut < x.debut + x.duree);
        const n = Math.max(...chevauche.map((x) => x._p)) + 1;
        const place = n > 1 ? "--g:calc(" + (i._p / n * 100) + "% + 4px);--d:calc(" + ((n - i._p - 1) / n * 100) + "% + 4px);" : "";
        const e = d.equipe.find((x) => x.id === i.qui) || d.equipe[0], [f, t] = COULEURS[i.qui] || COULEURS.julien;
        return '<button class="ev" data-ev="' + i.id + '" style="' + place + "--c:" + e.c + ";--f:" + f + ";--t:" + t + ";top:" + ((i.debut - H0) * PX_H + 2) + "px;height:" + (i.duree * PX_H - 4) + 'px"><b>' + esc(i.titre) + "</b>" + esc(client(i.client).nom) + "<small><i>" + e.nom[0] + "</i>" + e.nom + "</small></button>";
      }).join("");
      let ligne = "";
      if (j === auj) { const n = new Date(), h = n.getHours() + n.getMinutes() / 60; if (h >= H0 && h <= H0 + 10) ligne = '<div class="ligne-mnt" style="top:' + (h - H0) * PX_H + 'px"></div>'; }
      return '<div class="col" data-jour="' + j + '">' + evs + ligne + "</div>";
    }).join("");
    return '<header class="haut"><h1>Planning</h1><span class="sem">Du ' + O.dateCourte(jours[0]) + " au " + O.dateCourte(ven) + '</span><div class="droite-haut"><button class="fleche" data-semaine="-1" aria-label="Semaine précédente">‹</button><button class="bouton calme" data-semaine="0">Cette semaine</button><button class="fleche" data-semaine="1" aria-label="Semaine suivante">›</button><button class="bouton" data-action="nouvelle-intervention"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nouvelle intervention</button></div></header>' +
      '<div class="corps"><div class="planning"><div class="coin"></div>' + jours.map((j, i) => '<div class="jour-t ' + (j === auj ? "auj" : "") + '">' + JOURS[i] + " <b>" + Number(j.slice(8)) + "</b></div>").join("") + '<div class="heures">' + heures + "</div>" + colonnes + "</div></div>";
  };

  /* ---------- Chantiers ---------- */
  const chantiers = () => '<header class="haut"><h1>Chantiers</h1><span class="sem">' + m.d.chantiers.length + ' en cours</span><div class="droite-haut"><a class="bouton calme" href="chantier.html" target="_blank" rel="noopener">Voir l’application du client</a></div></header><div class="corps"><div class="page"><div class="cartes">' +
    m.d.chantiers.map((c) => {
      const f = c.etapes.filter((e) => e.e === "fait").length, encours = c.etapes.find((e) => e.e === "encours");
      return '<article class="carte chantier"><div class="tete-c">' + (c.photos.length ? '<img src="' + esc(c.photos[c.photos.length - 1]) + '" alt="Dernière photo du chantier">' : "") + "<div><h2>" + esc(c.titre) + "</h2><small>" + esc(client(c.client).nom) + ", " + esc(c.adresse) + "</small><p>" + f + " sur " + c.etapes.length + " étapes" + (encours ? ", " + esc(encours.t.toLowerCase()) + " en cours" : "") + '</p></div></div><div class="segments-c" aria-hidden="true">' + c.etapes.map((e) => '<i class="' + e.e + '"></i>').join("") + "</div>" +
        '<p class="consigne-c">Cochez une étape : le client est prévenu sur son téléphone.</p>' +
        c.etapes.map((e, i) => '<button class="etape ' + e.e + '" data-etape="' + c.id + ":" + i + '" aria-pressed="' + (e.e === "fait") + '"><i></i>' + esc(e.t) + "</button>").join("") +
        '<label class="photo-c">Ajouter une photo pour le client<input type="file" accept="image/*" data-photo="' + c.id + '" hidden></label>' +
        '<div class="discussion">' + c.messages.slice(-2).map((x) => '<div class="bulle ' + (x.de === "client" ? "client" : "") + '"><small>' + esc(x.nom) + ", " + esc(x.h) + "</small>" + esc(x.texte) + "</div>").join("") +
        '<form class="reponse" data-reponse="' + c.id + '"><input name="t" placeholder="Écrire au client" aria-label="Écrire au client" autocomplete="off"><button class="bouton petit">Envoyer</button></form></div></article>';
    }).join("") + "</div></div></div>";

  /* ---------- Devis ---------- */
  const STATUT_D = { brouillon: ["Brouillon", "b-gris"], envoye: ["En attente", "b-ambre"], signe: ["Signé", "b-vert"], refuse: ["Refusé", "b-rose"] };
  const depuis = (iso) => { const n = A.age(iso); return n === 0 ? "aujourd’hui" : n === 1 ? "hier" : "il y a " + n + " jours"; };
  const devis = () => {
    const b = A.bilan(m.d), signes = m.d.devis.filter((x) => x.statut === "signe");
    return '<header class="haut"><h1>Devis</h1><div class="droite-haut"><button class="bouton" data-action="nouveau-devis"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Nouveau devis</span></button></div></header><div class="corps"><div class="page"><dl class="resume"><div><dt>En attente de signature</dt><dd>' + O.eur(b.devis, 0) + "</dd></div><div><dt>Signés</dt><dd>" + O.eur(signes.reduce((t, x) => t + A.totalTTC(x), 0), 0) + '</dd></div></dl><table class="tableau"><thead><tr><th>Numéro</th><th>Client</th><th class="cache-mobile">Objet</th><th class="n">TTC</th><th>État</th></tr></thead><tbody>' +
      m.d.devis.map((x) => { const s = STATUT_D[x.statut]; return '<tr data-devis="' + x.id + '"><td><b>' + x.num + "</b><small>" + (x.statut === "envoye" ? "Envoyé " + depuis(x.date) : O.dateCourte(x.date)) + "</small></td><td>" + esc(client(x.client).nom) + '</td><td class="cache-mobile">' + esc(x.objet) + '</td><td class="n">' + O.eur(ttc(x), 0) + '</td><td><span class="badge ' + s[1] + '">' + (x.relance && x.statut === "envoye" ? "Relancé" : s[0]) + "</span></td></tr>"; }).join("") + "</tbody></table></div></div>";
  };

  const fenetreDevis = (id) => {
    const ex = m.d.devis.find((x) => x.id === id);
    const nv = !ex;
    const x = ex ? JSON.parse(JSON.stringify(ex)) : { id: "d" + O.id(), num: "D-2026-0" + (47 + m.d.devis.length - 2), client: m.d.clients[0].id, objet: "", date: O.jour(), statut: "brouillon", lignes: [{ d: "", q: 1, u: "u", pu: 0 }] };
    const fige = x.statut === "signe";
    const dessiner = () => {
      const tot = A.totalHT(x);
      ouvrir('<div class="fenetre large" role="dialog" aria-modal="true" aria-label="Devis"><h2>Devis ' + x.num + "</h2>" +
        '<div class="deux"><label>Client<select class="champ" id="dv-client" ' + (fige ? "disabled" : "") + ">" + m.d.clients.map((c) => '<option value="' + c.id + '"' + (c.id === x.client ? " selected" : "") + ">" + esc(c.nom) + "</option>").join("") + '</select></label><label>Objet<input class="champ" id="dv-objet" value="' + esc(x.objet) + '" ' + (fige ? "disabled" : "") + ' placeholder="Ex. Peinture du salon"></label></div>' +
        '<table class="lignes-devis"><thead><tr><th>Désignation</th><th style="width:70px">Qté</th><th style="width:96px">Prix unit.</th><th class="n" style="width:92px">Total HT</th><th></th></tr></thead><tbody>' +
        x.lignes.map((l, i) => '<tr><td><input data-l="' + i + ':d" value="' + esc(l.d) + '" aria-label="Désignation" ' + (fige ? "disabled" : "") + '></td><td><input data-l="' + i + ':q" inputmode="decimal" value="' + l.q + '" aria-label="Quantité" ' + (fige ? "disabled" : "") + '></td><td><input data-l="' + i + ':pu" inputmode="decimal" value="' + l.pu + '" aria-label="Prix unitaire" ' + (fige ? "disabled" : "") + '></td><td class="n" data-tl="' + i + '">' + O.eur(l.q * l.pu) + "</td><td>" + (fige ? "" : '<button class="x" data-suppr="' + i + '" aria-label="Supprimer la ligne">×</button>') + "</td></tr>").join("") + "</tbody></table>" +
        (fige ? "" : '<div class="boutons" style="justify-content:flex-start;flex-wrap:wrap;margin-top:8px"><button class="bouton calme petit" data-ajout="">+ Ligne</button>' + CATALOGUE.map((c, i) => '<button class="bouton calme petit" data-ajout="' + i + '">' + esc(c[0].split(",")[0]) + "</button>").join("") + "</div>") +
        '<div class="totaux"><p><span>Total HT</span><span id="t-ht">' + O.eur(tot) + '</span></p><p><span>TVA 10 %</span><span id="t-tva">' + O.eur(tot * A.TVA) + '</span></p><p><span>Total TTC</span><span id="t-ttc">' + O.eur(tot * (1 + A.TVA)) + "</span></p></div>" +
        (x.signature ? '<p style="margin-top:10px;font-weight:550">Signé en ligne par ' + esc(client(x.client).nom) + ' le ' + O.dateCourte(x.signeLe || x.date) + '</p><img class="signature-vue" src="' + x.signature + '" alt="Signature du client">' : "") +
        '<div class="boutons">' + (nv || x.statut === "signe" ? "" : '<button class="bouton calme gauche" data-action="suppr-devis">Supprimer</button>') + '<button class="bouton calme" data-action="fermer">Fermer</button><button class="bouton calme" data-action="imprimer">Imprimer</button>' +
        (fige ? "" : '<button class="bouton calme" data-action="enreg">Enregistrer</button><button class="bouton" data-action="envoyer">Envoyer au client</button>') + "</div></div>");
      const v = $("#voile");
      v.querySelectorAll("[data-l]").forEach((inp) => inp.addEventListener("input", () => {
        const [i, k] = inp.dataset.l.split(":");
        x.lignes[i][k] = k === "d" ? inp.value : Number(inp.value.replace(",", ".")) || 0;
        const t = A.totalHT(x);
        $("[data-tl='" + i + "']", v).textContent = O.eur(x.lignes[i].q * x.lignes[i].pu);
        $("#t-ht").textContent = O.eur(t); $("#t-tva").textContent = O.eur(t * A.TVA); $("#t-ttc").textContent = O.eur(t * (1 + A.TVA));
      }));
      $("#dv-client").addEventListener("change", (e) => { x.client = e.target.value; });
      $("#dv-objet").addEventListener("input", (e) => { x.objet = e.target.value; });
      v.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.ajout !== undefined) { const c = CATALOGUE[b.dataset.ajout]; x.lignes.push(c ? { d: c[0], q: 1, u: c[1], pu: c[2] } : { d: "", q: 1, u: "u", pu: 0 }); dessiner(); return; }
        if (b.dataset.suppr !== undefined) { x.lignes.splice(Number(b.dataset.suppr), 1); if (!x.lignes.length) x.lignes.push({ d: "", q: 1, u: "u", pu: 0 }); dessiner(); return; }
        const a = b.dataset.action;
        const garder = (st) => { if (st) x.statut = st; m.maj((d) => { const i = d.devis.findIndex((y) => y.id === x.id); if (i >= 0) d.devis[i] = x; else d.devis.unshift(x); }); };
        if (a === "fermer") fermer();
        if (a === "imprimer") imprimerPiece("Devis", x.num, client(x.client), x.lignes, x.date, x.signature ? '<p style="margin-top:8mm">Signé en ligne le ' + O.dateCourte(x.signeLe || x.date) + '</p><img src="' + x.signature + '" alt="Signature">' : '<p style="margin-top:8mm">Bon pour accord, date et signature :</p>');
        if (a === "enreg") { garder(); fermer(); toast("Devis enregistré"); }
        if (a === "envoyer") { if (!x.objet.trim()) { $("#dv-objet").focus(); return; } garder("envoye"); fermer(); toast("Devis envoyé : le client peut le signer dans son application"); }
        if (a === "suppr-devis") { m.maj((d) => { d.devis = d.devis.filter((y) => y.id !== x.id); }); fermer(); }
      };
    };
    dessiner();
  };

  /* ---------- Factures, stocks, clients ---------- */
  const factures = () => {
    const d = m.d, b = A.bilan(d);
    return '<header class="haut"><h1>Factures</h1></header><div class="corps"><div class="page"><dl class="resume"><div><dt>À encaisser</dt><dd>' + O.eur(b.impaye, 0) + "</dd></div><div><dt>Encaissé sur 30 jours</dt><dd>" + O.eur(b.encaisse, 0) + '</dd></div></dl><table class="tableau"><thead><tr><th>Numéro</th><th>Client</th><th class="cache-mobile">Objet</th><th class="n">TTC</th><th>État</th><th class="cache-mobile"></th></tr></thead><tbody>' +
      d.factures.map((f) => {
        const r = !f.payee && f.echeance < O.jour();
        return '<tr data-facture="' + f.id + '"><td><b>' + f.num + "</b><small>" + (f.payee ? "Réglée" : "Échéance " + O.dateCourte(f.echeance)) + "</small></td><td>" + esc(client(f.client).nom) + '</td><td class="cache-mobile">' + esc(f.objet) + '</td><td class="n">' + O.eur(f.ttc, 0) + '</td><td><span class="badge ' + (f.payee ? "b-vert" : r ? "b-rose" : "b-ambre") + '">' + (f.payee ? "Payée" : f.relance ? "Relancée" : r ? "En retard" : "À payer") + '</span></td><td class="cache-mobile">' + (f.payee ? "" : '<button class="bouton calme petit" data-payer="' + f.id + '">Marquer payée</button>') + "</td></tr>";
      }).join("") + "</tbody></table></div></div>";
  };
  const stocks = () => '<header class="haut"><h1>Matériel</h1></header><div class="corps"><div class="page"><div class="cartes stocks">' +
    m.d.stocks.map((s) => {
      const bas = s.q <= s.seuil;
      return '<article class="carte stock ' + (bas ? "bas" : "") + '"><div class="info-s"><h2>' + esc(s.nom) + "</h2><small>" + esc(s.f) + ", seuil de " + s.seuil + " " + s.u + "</small>" + (bas ? (s.commande ? '<span class="badge b-vert">Commande envoyée</span>' : '<span class="badge b-ambre">Commande préparée</span>') : "") + '</div><div class="compteur"><button data-stock="' + s.id + ':-1" aria-label="Retirer">−</button><b>' + s.q + '</b><button data-stock="' + s.id + ':1" aria-label="Ajouter">+</button></div>' + (bas && !s.commande ? '<button class="bouton plein" data-faire="stock:' + s.id + '">Commander chez ' + esc(s.f) + "</button>" : "") + "</article>";
    }).join("") + "</div></div></div>";
  const clients = () => '<header class="haut"><h1>Clients</h1><div class="droite-haut"><button class="bouton" data-action="nouveau-client"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Nouveau client</span></button></div></header><div class="corps"><div class="page"><table class="tableau"><thead><tr><th>Nom</th><th class="cache-mobile">Adresse</th><th>Téléphone</th><th class="n">Signé</th></tr></thead><tbody>' +
    m.d.clients.map((c) => "<tr><td><b>" + esc(c.nom) + "</b><small>" + esc(c.email) + '</small></td><td class="cache-mobile">' + esc(c.adresse) + '</td><td><a href="tel:' + esc((c.tel || "").replace(/\s/g, "")) + '">' + esc(c.tel) + '</a></td><td class="n">' + O.eur(m.d.devis.filter((x) => x.client === c.id && x.statut === "signe").reduce((t, x) => t + A.totalTTC(x), 0), 0) + "</td></tr>").join("") + "</tbody></table></div></div>";

  /* ---------- Relances : le message est écrit, il reste à l'envoyer ---------- */
  const fenetreRelance = (type, id) => {
    const x = type === "devis" ? m.d.devis.find((y) => y.id === id) : m.d.factures.find((y) => y.id === id);
    const c = client(x.client), nom = c.nom;
    const texte = type === "devis"
      ? "Bonjour " + nom + ",\n\nVous avez reçu notre devis " + x.num + " pour « " + x.objet + " ». Avez-vous pu le consulter ? Vous pouvez le signer directement depuis votre téléphone.\n\nCordialement,\n" + A.MARQUE
      : "Bonjour " + nom + ",\n\nSauf erreur de notre part, la facture " + x.num + " de " + O.eur(x.ttc, 0).replace(/\u00a0/g, " ") + " n’est pas réglée. Pouvez-vous nous confirmer sa date de règlement ?\n\nCordialement,\n" + A.MARQUE;
    ouvrir('<form class="fenetre" role="dialog" aria-modal="true" aria-label="Relance"><h2>Relancer ' + esc(nom) + '</h2><p class="chapo">Message rédigé par le logiciel. Vous pouvez le modifier.</p><label>Message<textarea class="champ" name="t" rows="8">' + esc(texte) + '</textarea></label><div class="boutons"><button type="button" class="bouton calme" data-action="fermer">Annuler</button><button class="bouton">Envoyer la relance</button></div></form>');
    const f = $("#voile form");
    f.addEventListener("click", (e) => { if (e.target.dataset.action === "fermer") fermer(); });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      m.maj((d) => {
        const y = (type === "devis" ? d.devis : d.factures).find((z) => z.id === id);
        y.relance = O.jour();
        d.journal.unshift({ id: O.id(), h: O.maintenant(), texte: "Relance envoyée à " + nom + " : " + y.num, type: "relance" });
        const ch = d.chantiers.find((z) => z.client === x.client);
        if (ch) ch.messages.push({ de: "pro", nom: A.MARQUE, h: "à l’instant", texte: type === "devis" ? "Votre devis " + y.num + " attend votre signature." : "La facture " + y.num + " reste à régler." });
      });
      fermer(); toast("Relance envoyée à " + nom);
    });
  };

  /* ---------- Fenêtre d'intervention ---------- */
  let focusAvant = null;
  const ouvrir = (html) => {
    const v = $("#voile");
    if (v.hidden) focusAvant = document.activeElement;
    v.innerHTML = html; v.hidden = false;
    const f = v.querySelector("input:not([disabled]), select:not([disabled]), button");
    if (f) f.focus();
  };
  const fermer = () => {
    const v = $("#voile"); v.hidden = true; v.innerHTML = ""; v.onclick = null;
    if (focusAvant && focusAvant.isConnected) focusAvant.focus();
  };
  document.addEventListener("keydown", (e) => {
    const v = $("#voile");
    if (e.key !== "Tab" || v.hidden) return;
    const l = Array.from(v.querySelectorAll("button, input, select, textarea, a[href]")).filter((x) => !x.disabled);
    if (!l.length) return;
    const p = l[0], d = l[l.length - 1];
    if (e.shiftKey && document.activeElement === p) { e.preventDefault(); d.focus(); }
    else if (!e.shiftKey && document.activeElement === d) { e.preventDefault(); p.focus(); }
  });

  /* Un vrai document, prêt à imprimer ou à enregistrer en PDF */
  const imprimerPiece = (titre, num, c, lignes, date, extra = "") => {
    const ht = lignes.reduce((t, l) => t + l.q * l.pu, 0);
    $("#impression").innerHTML = '<article class="piece"><header><div class="marque"><i>' + esc(O.initiales("AM")) + "</i>" + esc(A.MARQUE) + '</div><div><h1>' + titre + "</h1><p style=\"text-align:right\">N° " + esc(num) + "<br>Du " + O.dateCourte(date) + '</p></div></header><div class="pour"><b>' + esc(c.nom) + "</b><br>" + esc(c.adresse) + "<br>" + esc(c.email) + '</div><table><thead><tr><th>Désignation</th><th class="n">Qté</th><th class="n">Prix unit. HT</th><th class="n">Total HT</th></tr></thead><tbody>' +
      lignes.map((l) => "<tr><td>" + esc(l.d) + '</td><td class="n">' + l.q + '</td><td class="n">' + O.eur(l.pu) + '</td><td class="n">' + O.eur(l.q * l.pu) + "</td></tr>").join("") +
      '</tbody></table><div class="tot"><p><span>Total HT</span><span>' + O.eur(ht) + "</span></p><p><span>TVA 10 %</span><span>" + O.eur(ht * A.TVA) + "</span></p><p><span>Total TTC</span><span>" + O.eur(ht * (1 + A.TVA)) + "</span></p></div>" + extra + '<p class="pied">Document de démonstration Onklaud.</p></article>';
    window.print();
  };
  const payer = (id) => { m.maj((d) => { const f = d.factures.find((x) => x.id === id); f.payee = true; f.payeeLe = O.jour(); }); toast("Facture marquée payée"); };
  const fenetreFacture = (id) => {
    const f = m.d.factures.find((x) => x.id === id), c = client(f.client), retard = !f.payee && f.echeance < O.jour();
    const corps = "Bonjour " + c.nom + ",\n\nSauf erreur de notre part, la facture " + f.num + " de " + O.eur(f.ttc).replace(/\u00a0/g, " ") + " n’est pas réglée. Pouvez-vous nous confirmer sa date de règlement ?\n\nMerci,\n" + A.MARQUE;
    ouvrir('<div class="fenetre" role="dialog" aria-modal="true" aria-label="Facture"><h2>Facture ' + f.num + '</h2><p><b>' + esc(c.nom) + "</b>, " + esc(f.objet) + '</p><p style="margin-top:6px">' + O.eur(f.ttc) + " TTC, échéance " + O.dateCourte(f.echeance) + ".</p>" + (retard ? '<label>Relance préparée<textarea class="champ" rows="6" readonly>' + esc(corps) + "</textarea></label>" : "") +
      '<div class="boutons"><button class="bouton calme" data-action="fermer">Fermer</button><button class="bouton calme" data-action="imprimer-f">Imprimer</button>' + (retard && !f.relance ? '<button class="bouton calme" data-action="relancer">Envoyer la relance</button>' : "") + (f.payee ? "" : '<button class="bouton" data-action="payee">Marquer payée</button>') + "</div></div>");
    $("#voile").onclick = (e) => {
      const a = (e.target.closest("button") || {}).dataset; if (!a) return;
      if (a.action === "fermer") fermer();
      if (a.action === "imprimer-f") imprimerPiece("Facture", f.num, c, [{ d: f.objet, q: 1, pu: Math.round(f.ttc / (1 + A.TVA) * 100) / 100 }], f.date, f.payee ? "<p>Facture acquittée.</p>" : "<p>À régler avant le " + O.dateCourte(f.echeance) + ".</p>");
      if (a.action === "relancer") { fermer(); fenetreRelance("facture", id); }
      if (a.action === "payee") { payer(id); fermer(); }
    };
  };
  const fenetreClient = () => {
    ouvrir('<form class="fenetre" role="dialog" aria-modal="true" aria-label="Nouveau client"><h2>Nouveau client</h2><label>Nom<input class="champ" name="nom" required placeholder="Ex. Mme Bernard"></label><div class="deux"><label>Téléphone<input class="champ" name="tel" type="tel"></label><label>E-mail<input class="champ" name="email" type="email"></label></div><label>Adresse<input class="champ" name="adresse"></label><div class="boutons"><button type="button" class="bouton calme" data-action="fermer">Annuler</button><button class="bouton">Enregistrer</button></div></form>');
    const f = $("#voile form");
    f.addEventListener("click", (e) => { if (e.target.dataset.action === "fermer") fermer(); });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      m.maj((d) => { d.clients.push({ id: "c" + O.id(), ...v }); });
      fermer(); toast("Client ajouté");
    });
  };
  const fenetreIntervention = (id, jour, debut) => {
    const ex = m.d.interventions.find((i) => i.id === id);
    const x = ex ? { ...ex } : { id: "i" + O.id(), titre: "", client: m.d.clients[0].id, qui: m.d.equipe[0].id, jour: jour || O.jour(), debut: debut || 9, duree: 2 };
    ouvrir('<form class="fenetre" role="dialog" aria-modal="true" aria-label="Intervention"><h2>' + (ex ? "Modifier l’intervention" : "Nouvelle intervention") + '</h2><label>Intitulé<input class="champ" name="titre" required value="' + esc(x.titre) + '" placeholder="Ex. Pose de la faïence"></label><div class="deux"><label>Client<select class="champ" name="client">' + m.d.clients.map((c) => '<option value="' + c.id + '"' + (c.id === x.client ? " selected" : "") + ">" + esc(c.nom) + '</option>').join("") + '</select></label><label>Équipier<select class="champ" name="qui">' + m.d.equipe.map((e) => '<option value="' + e.id + '"' + (e.id === x.qui ? " selected" : "") + ">" + e.nom + '</option>').join("") + '</select></label></div><div class="deux"><label>Jour<input class="champ" type="date" name="jour" value="' + x.jour + '"></label><label>Heure et durée<span class="deux"><input class="champ" type="number" name="debut" min="8" max="17.5" step="0.5" value="' + x.debut + '" aria-label="Heure de début"><input class="champ" type="number" name="duree" min="0.5" max="10" step="0.5" value="' + x.duree + '" aria-label="Durée en heures"></span></label></div><div class="boutons">' + (ex ? '<button type="button" class="bouton calme gauche" data-action="suppr">Supprimer</button>' : "") + '<button type="button" class="bouton calme" data-action="fermer">Annuler</button><button class="bouton">Enregistrer</button></div></form>');
    const f = $("#voile form");
    f.addEventListener("click", (e) => {
      const a = e.target.dataset.action;
      if (a === "fermer") fermer();
      if (a === "suppr") { m.maj((d) => { d.interventions = d.interventions.filter((i) => i.id !== x.id); }); fermer(); }
    });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const y = { ...x, ...v, debut: Number(v.debut), duree: Number(v.duree) };
      m.maj((d) => { const i = d.interventions.findIndex((z) => z.id === y.id); if (i >= 0) d.interventions[i] = y; else d.interventions.push(y); });
      fermer();
    });
    $("input", f).focus();
  };

  /* ---------- Déplacer une intervention à la souris ou au doigt ---------- */
  let prise = null;
  document.addEventListener("pointerdown", (e) => {
    const ev = e.target.closest(".ev"); if (!ev) return;
    if (e.pointerType === "touch") return;
    const r = ev.getBoundingClientRect();
    prise = { el: ev, id: ev.dataset.ev, x: e.clientX, y: e.clientY, dy: e.clientY - r.top, bouge: false, col: ev.parentElement };
    ev.setPointerCapture(e.pointerId);
  });
  document.addEventListener("pointermove", (e) => {
    if (!prise) return;
    if (!prise.bouge && Math.hypot(e.clientX - prise.x, e.clientY - prise.y) < 5) return;
    prise.bouge = true; prise.el.classList.add("prise");
    const col = document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest && n.closest(".col")).find(Boolean) || prise.col;
    if (col !== prise.el.parentElement) { col.appendChild(prise.el); }
    prise.col = col;
    const y = e.clientY - col.getBoundingClientRect().top - prise.dy;
    const h = Math.max(H0, Math.min(17.5, Math.round((y / PX_H + H0) * 2) / 2));
    prise.h = h; prise.el.style.top = (h - H0) * PX_H + 2 + "px";
  });
  document.addEventListener("pointerup", () => {
    if (!prise) return;
    const p = prise; prise = null;
    if (!p.bouge) return;
    ui.finGlisse = true;
    const j = p.col.dataset.jour;
    m.maj((d) => { const i = d.interventions.find((z) => z.id === p.id); if (i) { i.jour = j; if (p.h) i.debut = p.h; } });
  });

  /* ---------- Actions ---------- */
  document.addEventListener("click", (e) => {
    const ev = e.target.closest(".ev");
    if (ev && !prise && !ui.finGlisse) { fenetreIntervention(ev.dataset.ev); return; }
    ui.finGlisse = false;
    const b = e.target.closest("[data-vue],[data-membre],[data-faire],[data-choisir-jour],[data-ev-l],[data-semaine],[data-action],[data-etape],[data-payer],[data-stock],tr[data-devis],tr[data-facture]");
    if (!b || b.closest("#voile")) return;
    const ds = b.dataset;
    if (ds.vue) { ui.vue = ds.vue; rendre(); }
    else if (ds.membre) { ui.masques[ds.membre] = !ui.masques[ds.membre]; rendre(); }
    else if (ds.faire) {
      const [t, id] = ds.faire.split(":");
      if (t === "devis" || t === "facture") fenetreRelance(t, id);
      if (t === "tache") m.maj((d) => { d.taches.find((x) => x.id === id).fait = true; });
      if (t === "stock") { m.maj((d) => { const s = d.stocks.find((x) => x.id === id); s.commande = true; d.journal.unshift({ id: O.id(), h: O.maintenant(), texte: s.nom + " commandé chez " + s.f, type: "stock" }); }); toast("Commande envoyée"); }
    }
    else if (ds.choisirJour) { ui.jour = ds.choisirJour; rendre(); }
    else if (ds.evL) fenetreIntervention(ds.evL);
    else if (ds.semaine !== undefined) { ui.lundi = ds.semaine === "0" ? O.lundi() : new Date(ui.lundi.getTime() + ds.semaine * 7 * 864e5); rendre(); }
    else if (ds.action === "nouvelle-intervention") fenetreIntervention();
    else if (ds.action === "nouveau-devis") fenetreDevis();
    else if (ds.action === "nouveau-client") fenetreClient();
    else if (ds.payer) { e.stopPropagation(); payer(ds.payer); }
    else if (ds.facture) fenetreFacture(ds.facture);
    else if (ds.devis) fenetreDevis(ds.devis);
    else if (ds.etape) {
      const [cid, i] = ds.etape.split(":");
      m.maj((d) => {
        const c = d.chantiers.find((x) => x.id === cid), et = c.etapes[Number(i)];
        et.e = et.e === "fait" ? "avenir" : "fait";
        const suiv = c.etapes.find((x) => x.e !== "fait");
        c.etapes.forEach((x) => { if (x.e === "encours") x.e = "avenir"; });
        if (suiv) suiv.e = "encours";
      });
    } else if (ds.stock) { const [id, n] = ds.stock.split(":"); m.maj((d) => { const s = d.stocks.find((x) => x.id === id); s.q = Math.max(0, s.q + Number(n)); }); }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-reponse]"); if (!f) return;
    e.preventDefault();
    const t = f.t.value.trim(); if (!t) return;
    m.maj((d) => { d.chantiers.find((c) => c.id === f.dataset.reponse).messages.push({ de: "pro", nom: A.MARQUE, h: O.maintenant(), texte: t }); });
  });
  document.addEventListener("change", async (e) => {
    const id = e.target.dataset && e.target.dataset.photo; if (!id || !e.target.files[0]) return;
    const p = await O.photo(e.target.files[0]);
    const ok = m.maj((d) => { const c = d.chantiers.find((x) => x.id === id); c.photos.push(p); c.messages.push({ de: "pro", nom: A.MARQUE, h: O.maintenant(), texte: "Voici une nouvelle photo de votre chantier.", photo: p }); });
    toast(ok ? "Photo envoyée au client" : "Le stockage de ce navigateur est plein");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#voile").hidden) fermer(); });
  window.matchMedia("(max-width: 820px)").addEventListener("change", () => rendre());

  const VUES = { aujourdhui, planning, chantiers, devis, factures, stocks, clients };
  const rendre = () => {
    const c = $(".corps"), haut = c ? c.scrollTop : 0;
    menu(); panneau();
    ui.vus = new Set(m.d.journal.map((j) => j.id));
    $("#principal").innerHTML = VUES[ui.vue]();
    const n = $(".corps"); if (n) n.scrollTop = haut;
  };
  m.surChange(() => {
    rendre();
    const dern = m.d.journal[0];
    if (dern && dern.id !== ui.dernier) { if (ui.dernier !== undefined && dern.type === "signe") toast(dern.texte); ui.dernier = dern.id; }
  });
  ui.dernier = (m.d.journal[0] || {}).id;
  window.bandeauDemo(m, "../", "envoyez une relance, puis signez le devis depuis <a href=\"chantier.html\" target=\"_blank\" rel=\"noopener\">le fil du client</a> : le dossier avance ici, de colonne en colonne.");
  rendre();
  window.demoAtelier = { m, ui, rendre };
})();
