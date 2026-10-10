/* ================================================================
   LE DEVIS DICTÉ
   Dictée vocale (Web Speech API, fr-FR) ou texte → lignes de devis tirées
   du catalogue de prix de l'artisan. Ligne inconnue = « à chiffrer ».
   Aperçu A4, impression / PDF, envoi par e-mail après validation.
   ================================================================ */
(function () {
  "use strict";
  const { esc, typo, euros } = Onk;
  const $ = (s, r = document) => r.querySelector(s);
  const CLE = "devis-dicte";
  const UNITES = ["u", "m²", "ml", "h", "forfait"];

  /* ---------- Exemple, données fictives ---------- */
  const CATALOGUE_EXEMPLE = [
    { id: "depose-baignoire", designation: "Dépose de baignoire et évacuation", unite: "forfait", pu: 280, synonymes: ["depose baignoire", "depose de la baignoire", "depose de baignoire", "enlever la baignoire", "retirer la baignoire"] },
    { id: "depose-faience", designation: "Dépose de faïence murale", unite: "m²", pu: 18, synonymes: ["depose faience", "depose de la faience", "depose de faience", "enlever la faience", "casser la faience"] },
    { id: "receveur-90", designation: "Receveur extra-plat 90 × 90 cm, fourniture et pose", unite: "u", pu: 320, synonymes: ["receveur 90", "receveur de 90", "receveur 90x90", "receveur extra plat 90", "receveur de douche de 90"] },
    { id: "receveur-120", designation: "Receveur extra-plat 80 × 120 cm, fourniture et pose", unite: "u", pu: 390, synonymes: ["receveur 120", "receveur de 120", "receveur 80x120"] },
    { id: "paroi", designation: "Paroi de douche fixe 90 cm, verre 8 mm", unite: "u", pu: 410, synonymes: ["paroi", "paroi fixe", "paroi de douche", "vitre de douche"] },
    { id: "faience", designation: "Faïence murale, fourniture et pose", unite: "m²", pu: 62, synonymes: ["faience", "faience murale", "carrelage mural", "carrelage au mur", "carrelage aux murs"] },
    { id: "carrelage-sol", designation: "Carrelage de sol, fourniture et pose", unite: "m²", pu: 58, surface: true, synonymes: ["carrelage au sol", "carrelage sol", "carrelage du sol", "sol en carrelage"] },
    { id: "ragreage", designation: "Ragréage du sol", unite: "m²", pu: 22, surface: true, synonymes: ["ragreage"] },
    { id: "mitigeur", designation: "Mitigeur thermostatique de douche", unite: "u", pu: 240, synonymes: ["mitigeur", "mitigeur thermostatique", "thermostatique"] },
    { id: "colonne", designation: "Colonne de douche thermostatique", unite: "u", pu: 380, synonymes: ["colonne de douche", "colonne"] },
    { id: "meuble-vasque", designation: "Meuble vasque 80 cm avec miroir", unite: "u", pu: 520, synonymes: ["meuble vasque", "meuble vasque de 80", "meuble de 80", "vasque de 80", "vasque"] },
    { id: "wc", designation: "WC suspendu (bâti-support et cuvette)", unite: "u", pu: 690, synonymes: ["wc suspendu", "toilettes suspendues", "wc"] },
    { id: "plomberie", designation: "Reprise des alimentations et évacuations", unite: "forfait", pu: 260, synonymes: ["plomberie", "reprise plomberie", "reprise de la plomberie", "alimentations", "deplacer l evacuation"] },
    { id: "peinture", designation: "Peinture plafond, pièce humide", unite: "m²", pu: 24, surface: true, synonymes: ["peinture plafond", "peinture du plafond", "peinture au plafond", "plafond"] },
    { id: "extracteur", designation: "Extracteur d'air, fourniture et pose", unite: "u", pu: 180, synonymes: ["extracteur", "aerateur", "vmc"] },
    { id: "joints", designation: "Joints silicone et finitions", unite: "forfait", pu: 90, synonymes: ["joints", "silicone", "finitions"] },
    { id: "gravats", designation: "Évacuation des gravats en déchetterie", unite: "forfait", pu: 150, synonymes: ["gravats", "evacuation des gravats", "dechetterie"] },
    { id: "main-oeuvre", designation: "Main-d'œuvre", unite: "h", pu: 48, synonymes: ["main d oeuvre", "heure de main d oeuvre"] }
  ];
  const DICTEE_EXEMPLE = "Salle de bain chez Mme Roche, 6 mètres carrés. Dépose de la baignoire. Dépose de la faïence, 12 mètres carrés. Receveur de 90 avec paroi fixe et mitigeur thermostatique. Faïence murale, 14 mètres carrés. Carrelage au sol 6 mètres carrés, ragréage 6 mètres carrés. Un meuble vasque de 80. Un sèche-serviettes électrique. Et l'évacuation des gravats.";
  const ENTREPRISE_VIDE = { nom: "", adresse: "", tel: "", email: "", siret: "", assurance: "", tva: 10, validite: 30, acompte: 30, conditions: "", signature: "" };

  function nouveauDevis(e, numero) {
    return { id: Onk.id("dv"), numero, date: jourCourant(), validite: e.entreprise.validite || 30, client: { nom: "", adresse: "", email: "", tel: "" }, objet: "", tva: e.entreprise.tva || 10, acompte: e.entreprise.acompte, lignes: [], dictee: "", etapes: null, statut: "brouillon" };
  }
  const numeroSuivant = (e) => "D-" + jourCourant().slice(0, 4) + "-" + String(++e.compteur).padStart(4, "0");
  function etatVide() {
    const e = { version: 1, exemple: false, entreprise: Object.assign({}, ENTREPRISE_VIDE), catalogue: [], compteur: 0, liste: [], courant: "", onglet: "devis" };
    const d = nouveauDevis(e, numeroSuivant(e)); e.liste.push(d); e.courant = d.id;
    return e;
  }
  function etatExemple() {
    const e = { version: 1, exemple: true, catalogue: Onk.copie(CATALOGUE_EXEMPLE), compteur: 42, liste: [], courant: "", onglet: "devis",
      entreprise: { nom: "Leroux Rénovation", adresse: "8 rue des Tanneurs\n69000 Lyon", tel: "06 00 00 00 50", email: "contact@leroux-renovation.exemple", siret: "000 000 000 00000",
        assurance: "Décennale : Assureur Exemple, contrat n° 0000000", tva: 10, validite: 30, acompte: 30,
        conditions: "Acompte de 30 % à la commande, solde à la fin du chantier. Paiement par virement ou chèque.", signature: "Thomas Leroux\nLeroux Rénovation · 06 00 00 00 50" } };
    const d = nouveauDevis(e, numeroSuivant(e));
    d.id = "dv-exemple";
    d.client = { nom: "Mme Roche", adresse: "14 allée des Peupliers\n69100 Villeurbanne", email: "roche@exemple.fr", tel: "" };
    d.dictee = DICTEE_EXEMPLE;
    e.liste.push(d); e.courant = d.id;
    return e;
  }

  let etat;
  const ui = { ecoute: false, provisoire: "", apercu: false, replie: false, fraiches: false, nouvelles: null };
  const vue = {}; // surcouche du mode film
  function jourCourant() { return Onk.FILM ? Onk.DATE_FILM : Onk.aujourdhui(); }
  function charger() {
    etat = Onk.stock.lire(CLE, null);
    if (!etat || !Array.isArray(etat.liste) || !etat.liste.length) etat = etatExemple();
    etat.entreprise = Object.assign({}, ENTREPRISE_VIDE, etat.entreprise);
    if (!devis()) etat.courant = etat.liste[0].id;
  }
  const sauver = () => Onk.stock.ecrire(CLE, etat);
  const devis = () => etat.liste.find((d) => d.id === etat.courant);

  /* ---------- Calculs ---------- */
  const totalLigne = (l) => (l.pu == null || l.qte == null ? null : Onk.arrondi(l.qte * l.pu));
  function totaux(d) {
    const ht = Onk.arrondi(d.lignes.reduce((s, l) => s + (totalLigne(l) || 0), 0));
    const tva = Onk.arrondi(ht * (+d.tva || 0) / 100);
    const aChiffrer = d.lignes.filter((l) => l.pu == null || l.qte == null).length;
    return { ht, tva, ttc: Onk.arrondi(ht + tva), aChiffrer };
  }
  const nombreFr = (n) => (n == null ? "" : String(Onk.arrondi(n)).replace(".", ","));
  const echeance = (d) => Onk.ajouterJours(d.date, +d.validite || 30);

  /* ---------- Remplir le devis à partir de la dictée ---------- */
  function appliquer(d, r, moteur) {
    if (r.client && !d.client.nom) d.client.nom = r.client;
    if (!d.objet && r.piece) d.objet = "Rénovation " + (r.piece === "salle de bain" ? "de la salle de bain" : r.piece === "salle d eau" ? "de la salle d'eau" : "de la pièce : " + r.piece) + (r.surface ? " (" + nombreFr(r.surface) + " m²)" : "");
    const debut = d.lignes.length;
    for (const l of r.lignes) d.lignes.push({ id: Onk.FILM ? "l" + d.lignes.length : Onk.id("l"), catalogueId: l.catalogueId || null, designation: l.designation, qte: l.qte, unite: l.unite || "u", pu: l.pu == null ? null : l.pu, aChiffrer: l.pu == null, doute: l.doute || "" });
    d.etapes = { liste: r.etapes.map((e) => Object.assign({}, e, e.ligne != null ? { ligne: e.ligne + debut } : {})), moteur, nb: r.lignes.length };
    d.dicteesPassees = (d.dicteesPassees || []).concat(d.dictee ? [d.dictee] : []);
    d.dictee = "";
  }
  async function remplir() {
    const d = devis();
    const texte = (d.dictee + (ui.provisoire ? " " + ui.provisoire : "")).trim();
    if (!texte) { Onk.toast("Dictez ou écrivez d'abord les travaux."); return; }
    arreterDictee();
    d.dictee = texte;
    let r = null, moteur = "moteur local";
    if (Onk.moteur.valeur() === "claude") {
      const b = $('[data-action="remplir"]'); if (b) { b.disabled = true; b.textContent = "L'agent Claude remplit…"; }
      try {
        const rep = await Onk.agent("devis-dicte", { texte, catalogue: etat.catalogue });
        r = rep.resultat; moteur = "agent Claude";
      } catch (e) { Onk.toast("Agent Claude indisponible (" + e.message + ") : remplissage par le moteur local.", 6000); }
    }
    if (!r) r = MoteurDevis.lire(texte, etat.catalogue);
    appliquer(d, r, moteur);
    ui.replie = false; ui.fraiches = true;
    sauver(); rendre();
  }

  /* ---------- Dictée vocale (Web Speech API) ---------- */
  // « let » : la dictée est retirée si le navigateur refuse le service (le bouton micro disparaît, le clavier reste)
  let Reconnaissance = window.SpeechRecognition || window.webkitSpeechRecognition;
  let reco = null, debutEcoute = 0, minuteur = 0;
  function lancerDictee() {
    if (!Reconnaissance) { Onk.toast("Dictée vocale indisponible sur ce navigateur (essayez Chrome). Vous pouvez écrire, ou utiliser le micro du clavier du téléphone.", 7000); const z = $("#transcription"); if (z) z.focus(); return; }
    reco = new Reconnaissance();
    reco.lang = "fr-FR"; reco.continuous = true; reco.interimResults = true;
    reco.onresult = (ev) => {
      const d = devis(); let prov = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript.trim();
        if (ev.results[i].isFinal) { d.dictee = (d.dictee ? d.dictee.replace(/\s+$/, "") + (/[.!?]$/.test(d.dictee.trim()) ? " " : ". ") : "") + Onk.majuscule(t); }
        else prov += t + " ";
      }
      ui.provisoire = prov.trim();
      sauver(); majTranscription();
    };
    reco.onerror = (ev) => {
      if (ev.error === "service-not-allowed" || ev.error === "language-not-supported") {
        // le navigateur n'offre pas la dictée ici : on retire le micro proprement, la saisie au clavier reste
        Reconnaissance = null; ui.ecoute = false; clearInterval(minuteur);
        Onk.toast("Dictée vocale refusée par ce navigateur : tapez le texte, ou utilisez le micro du clavier du téléphone.", 7000);
        rendreDevisVue(); return;
      }
      const msg = { "not-allowed": "Micro refusé : autorisez le micro pour ce site dans le navigateur." + (location.protocol === "file:" ? " Ouvert depuis un fichier, certains navigateurs bloquent le micro : essayez la version en ligne." : ""), "no-speech": "Je n'ai rien entendu. Réessayez près du téléphone.", network: "La dictée du navigateur a besoin d'internet." }[ev.error] || "Dictée interrompue (" + ev.error + ").";
      Onk.toast(msg, 6000);
    };
    reco.onend = () => { if (ui.ecoute) { try { reco.start(); } catch (e) { arreterDictee(); } } };
    try { reco.start(); } catch (e) { Onk.toast("Impossible de lancer la dictée."); return; }
    ui.ecoute = true; debutEcoute = Date.now();
    clearInterval(minuteur); minuteur = setInterval(majEtatDictee, 500);
    majEtatDictee();
  }
  function arreterDictee() {
    if (!ui.ecoute) return;
    ui.ecoute = false; clearInterval(minuteur);
    const d = devis();
    if (ui.provisoire) { d.dictee = (d.dictee ? d.dictee + " " : "") + ui.provisoire; ui.provisoire = ""; }
    try { reco && reco.stop(); } catch (e) { /* rien */ }
    sauver(); majEtatDictee(); majTranscription();
  }
  const duree = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  /* ---------- Rendu ---------- */
  const ONGLETS = [["devis", "Devis"], ["liste", "Mes devis"], ["catalogue", "Catalogue de prix"], ["entreprise", "Entreprise"]];
  function rendreOnglets() {
    $("#onglets").innerHTML = ONGLETS.map(([o, l]) => '<button class="onglet" type="button" role="tab" data-onglet="' + o + '" aria-selected="' + (etat.onglet === o) + '">' + l + "</button>").join("");
  }
  function rendreBandeau() {
    const b = $("#bandeau");
    if (etat.exemple) {
      b.hidden = false;
      b.innerHTML = '<span class="tampon-exemple">Exemple, données fictives</span><span>Entreprise, client, prix et dictée inventés pour essayer l\'outil.</span>' +
        (Onk.FILM ? "" : '<button class="bouton-texte" type="button" data-action="vider">Partir de zéro</button>');
    } else if (!etat.catalogue.length || !etat.entreprise.nom) {
      b.hidden = false;
      b.innerHTML = "<span>" + typo("À faire une fois : votre catalogue de prix et vos coordonnées.") + '</span><button class="bouton-texte" type="button" data-onglet="' + (!etat.catalogue.length ? "catalogue" : "entreprise") + '">' + (!etat.catalogue.length ? "Catalogue de prix" : "Entreprise") + "</button>";
    } else b.hidden = true;
  }

  const ICONE_MICRO = '<svg class="icone-micro" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><svg class="icone-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>';

  function htmlEtatDictee() {
    if (vue.ecoute != null ? vue.ecoute : ui.ecoute) {
      const s = vue.ecoute != null ? vue.secondes : (Date.now() - debutEcoute) / 1000;
      return '<b>J\'écoute…</b><span class="enregistre">' + duree(s) + "</span>";
    }
    return Reconnaissance || Onk.FILM
      ? "<b>Dicter</b><span>" + typo("Les travaux, les quantités, le client : comme vous le diriez.") + "</span>"
      : "<b>Écrire les travaux</b><span>" + typo("La dictée vocale ne marche pas dans ce navigateur (elle marche sous Chrome ou Edge) : tapez le texte, ou utilisez le micro du clavier du téléphone.") + "</span>";
  }
  function majEtatDictee() {
    const e = $("#dictee-etat"); if (e) e.innerHTML = htmlEtatDictee();
    const m = $(".micro"); if (m) { const on = vue.ecoute != null ? vue.ecoute : ui.ecoute; m.classList.toggle("ecoute", on); m.setAttribute("aria-label", on ? "Terminer la dictée" : "Commencer la dictée"); }
  }
  function majTranscription() {
    const z = $("#transcription"); if (!z) return;
    if (z.tagName === "TEXTAREA") { if (document.activeElement !== z) z.value = devis().dictee + (ui.provisoire ? " " + ui.provisoire : ""); }
  }

  function rendreDicteeHTML(d) {
    const texte = Onk.FILM
      ? '<div class="transcription" id="transcription">' + (vue.dictee ? esc(vue.dictee) + (vue.ecoute ? '<span class="curseur"></span>' : "") : '<span class="attente">La transcription s\'écrit ici…</span>') + "</div>"
      : '<textarea class="transcription" id="transcription" aria-label="Transcription de la dictée (modifiable)" placeholder="Ex. : Salle de bain 6 m². Dépose baignoire. Receveur de 90, paroi fixe…">' + esc(d.dictee) + "</textarea>";
    return '<section class="bloc carte" aria-labelledby="t-dictee">' +
      '<div class="bloc-tete"><h2 class="titre-section" id="t-dictee"><span class="etape-num">1</span>Dictez les travaux</h2></div>' +
      '<div class="dictee-haut">' + (Reconnaissance || Onk.FILM ? '<button class="micro" type="button" data-action="micro" aria-label="Commencer la dictée">' + ICONE_MICRO + "</button>" : "") + '<div class="dictee-etat" id="dictee-etat">' + htmlEtatDictee() + "</div></div>" +
      (Reconnaissance && !Onk.FILM ? '<p class="note-dictee">' + typo("La dictée passe par votre navigateur : sous Chrome, le son est envoyé à Google pour être transcrit. Vous pouvez aussi taper le texte.") + "</p>" : "") +
      texte +
      '<div class="dictee-actions"><button class="bouton bouton-plein" type="button" data-action="remplir">Remplir le devis</button>' +
      (d.lignes.length ? '<span class="aide">' + typo("Les nouvelles lignes s'ajoutent à la suite.") + "</span>" : "") + "</div></section>";
  }

  function rendreAgentHTML(d) {
    if (!d.etapes) return "";
    const tout = d.etapes.liste;
    const n = vue.nbEtapes == null ? tout.length : vue.nbEtapes;
    const fini = n >= tout.length;
    const repli = ui.replie && fini;
    return '<section class="bloc carte carte-agent" aria-labelledby="t-agent"><div class="bloc-tete"><h2 class="titre-section" id="t-agent">Ce que l\'agent a fait</h2><span class="discret">' + esc(d.etapes.moteur) + "</span></div>" +
      (repli ? "" : '<ol class="etapes-agent' + (ui.fraiches ? " fraiches" : "") + '" id="etapes">' + tout.slice(0, n).map((e, i) => '<li class="' + e.type + (Onk.FILM && !fini && i === n - 1 ? " en-cours" : "") + '" style="--i:' + i + '">' + esc(typo(e.texte)) + "</li>").join("") + "</ol>") +
      (fini ? '<p style="margin-top:8px;font-size:14px"><button class="bouton-texte" type="button" data-action="replier">' + (repli ? "Voir les " + tout.length + " étapes" : "Replier les étapes") + "</button></p>" : "") + "</section>";
  }

  function ligneHTML(l, i) {
    const t = totalLigne(l);
    const saisie = (champ, val) => (vue.saisie && vue.saisie.ligne === l.id && vue.saisie.champ === champ ? { v: vue.saisie.texte, actif: true } : { v: val, actif: false });
    const q = saisie("qte", nombreFr(l.qte)), p = saisie("pu", l.pu == null ? "" : nombreFr(l.pu));
    const unites = UNITES.map((u) => '<option' + (u === l.unite ? " selected" : "") + ">" + u + "</option>").join("");
    return '<div class="ligne' + (l.pu == null ? " a-chiffrer" : "") + (vue.nouvelles && vue.nouvelles.has(l.id) ? " nouvelle" : "") + '" id="ligne-' + l.id + '" data-ligne="' + l.id + '">' +
      '<input class="designation" data-champ="designation" value="' + esc(l.designation) + '" aria-label="Désignation, ligne ' + (i + 1) + '">' +
      '<button class="retirer" type="button" data-action="suppr-ligne" aria-label="Supprimer la ligne ' + (i + 1) + '">×</button>' +
      '<div class="chiffrage"><input data-champ="qte" inputmode="decimal" aria-label="Quantité" value="' + esc(q.v) + '"' + (q.actif ? ' class="film-actif"' : "") + ">" +
      '<select data-champ="unite" aria-label="Unité" class="unite" style="min-height:38px;border:1.5px solid var(--filet-fort);border-radius:6px;background:#fff;padding:4px">' + unites + "</select>" +
      "<span>×</span><input class=\"pu" + (p.actif ? " film-actif" : "") + '" data-champ="pu" inputmode="decimal" aria-label="Prix unitaire HT" placeholder="prix ?" value="' + esc(p.v) + '"><span>€ HT</span>' +
      '<span class="total-ligne" data-total>' + (t == null ? "" : euros(t)) + "</span></div>" +
      (l.pu == null ? '<p class="note-ligne"><span class="a-verifier">À chiffrer : pas dans votre catalogue</span></p>' : l.doute ? '<p class="note-ligne"><span class="a-verifier">' + esc(typo(l.doute)) + "</span></p>" : "") + "</div>";
  }

  function totauxHTML(d) {
    const T = vue.totaux || totaux(d);
    const tvas = [5.5, 10, 20].map((v) => '<option value="' + v + '"' + (+d.tva === v ? " selected" : "") + ">" + String(v).replace(".", ",") + "&nbsp;%</option>").join("");
    return '<div class="totaux" id="totaux"><div class="ligne-total"><span>Total HT</span><b>' + euros(T.ht) + "</b></div>" +
      '<div class="ligne-total"><span>TVA <select data-devis="tva" aria-label="Taux de TVA">' + tvas + "</select></span><b>" + euros(T.tva) + "</b></div>" +
      '<div class="ligne-total ttc"><span>Total TTC</span><b>' + euros(T.ttc) + "</b></div>" +
      (T.aChiffrer ? '<p class="incomplet">' + T.aChiffrer + " " + Onk.pluriel(T.aChiffrer, "ligne à chiffrer", "lignes à chiffrer") + typo(" : total incomplet.") + "</p>" : "") + "</div>";
  }

  function rendreEditionHTML(d) {
    const lignes = d.lignes.filter((l) => !vue.cachees || !vue.cachees.has(l.id));
    const cat = etat.catalogue.map((a) => '<option value="' + esc(a.id) + '">' + esc(a.designation) + " · " + euros(a.pu) + " / " + esc(a.unite) + "</option>").join("");
    const c = d.client;
    return '<section class="bloc carte" aria-labelledby="t-devis" id="bloc-devis">' +
      '<div class="bloc-tete"><h2 class="titre-section" id="t-devis"><span class="etape-num">2</span>Vérifiez le devis</h2><span class="discret">n°&nbsp;' + esc(d.numero) + " · " + esc(Onk.dateNum(d.date)) + "</span></div>" +
      '<div class="client-grille">' +
      '<label class="champ"><span>Client</span><input data-client="nom" value="' + esc(c.nom) + '" placeholder="Mme Martin"></label>' +
      '<label class="champ"><span>E-mail</span><input data-client="email" type="email" value="' + esc(c.email) + '"></label>' +
      '<label class="champ large"><span>Adresse du chantier</span><input data-client="adresse" value="' + esc(String(c.adresse).replace(/\n/g, ", ")) + '"></label>' +
      '<label class="champ large"><span>Objet</span><input data-devis="objet" value="' + esc(d.objet) + '" placeholder="Rénovation de la salle de bain"></label></div>' +
      (Onk.FILM && d.etapes && vue.nbEtapes != null && vue.nbEtapes < d.etapes.liste.length ? '<p class="agent-direct" aria-live="polite"><span class="en-cours-point"></span>' + esc(typo(d.etapes.liste[vue.nbEtapes - 1].texte)) + "</p>" : "") +
      '<div class="lignes" id="lignes">' + (lignes.length ? lignes.map(ligneHTML).join("") : '<p class="vide"><span class="manuscrit">Pas encore de ligne.</span>Dictez, ou ajoutez une ligne du catalogue.</p>') + "</div>" +
      '<div class="ajout-ligne"><select id="ajout-cat" aria-label="Ajouter une ligne du catalogue"><option value="">+ Ligne du catalogue…</option>' + cat + '<option value="libre">Ligne libre (à chiffrer)</option></select></div>' +
      totauxHTML(d) +
      '<div class="actions-devis"><button class="bouton bouton-plein" type="button" data-action="apercu">Aperçu et PDF</button><button class="bouton" type="button" data-action="envoyer">Envoyer</button></div>' +
      "</section>";
  }

  function a4HTML(d) {
    const e = etat.entreprise, T = vue.totaux || totaux(d);
    const lignes = d.lignes.filter((l) => !vue.cachees || !vue.cachees.has(l.id));
    const tvaTxt = String(d.tva).replace(".", ",");
    const mentionTva = +d.tva === 10 ? "TVA à 10 % : travaux d'amélioration dans un logement achevé depuis plus de deux ans (attestation simplifiée à remettre par le client)."
      : +d.tva === 5.5 ? "TVA à 5,5 % : travaux d'amélioration de la performance énergétique (attestation à remettre par le client)." : "";
    return '<article class="a4" id="a4">' + (etat.exemple ? '<span class="tampon-exemple exemple">Exemple, données fictives</span>' : "") +
      '<header class="a4-tete"><div class="a4-ent"><p class="nom">' + esc(e.nom || "Votre entreprise") + "</p><p>" + esc([e.adresse, [e.tel, e.email].filter(Boolean).join(" · ")].filter(Boolean).join("\n")) + "</p></div>" +
      '<div class="a4-ref"><p class="titre">DEVIS</p><p>N° <b>' + esc(d.numero) + "</b></p><p>Date : <b>" + esc(Onk.dateNum(d.date)) + "</b></p><p>Valable jusqu'au " + esc(Onk.dateNum(echeance(d))) + "</p></div></header>" +
      '<div class="a4-parties"><div><p class="lib">Entreprise</p><div class="client">' + esc(e.siret ? "SIRET " + e.siret : "SIRET à compléter") + (e.assurance ? "\n" + esc(e.assurance) : "") + '</div></div><div><p class="lib">Client</p><div class="client"><b>' + esc(d.client.nom || "Client à compléter") + "</b>\n" + esc(d.client.adresse || "") + "</div></div></div>" +
      (d.objet ? '<p class="a4-objet"><b>Objet :</b> ' + esc(d.objet) + "</p>" : "") +
      '<table class="a4-table"><thead><tr><th>Désignation</th><th class="n">Qté</th><th>Unité</th><th class="n">PU HT</th><th class="n">Total HT</th></tr></thead><tbody>' +
      (lignes.length ? lignes.map((l) => { const t = totalLigne(l); return "<tr><td>" + esc(l.designation) + '</td><td class="n">' + esc(nombreFr(l.qte)) + "</td><td>" + esc(l.unite) + '</td><td class="n">' + (l.pu == null ? '<span class="achiffrer">à chiffrer</span>' : euros(l.pu)) + '</td><td class="n">' + (t == null ? "" : euros(t)) + "</td></tr>"; }).join("")
        : '<tr><td colspan="5" style="color:var(--gris)">Aucune ligne pour l\'instant.</td></tr>') +
      "</tbody></table>" +
      '<div class="a4-bas"><div class="a4-mentions">' +
      (T.aChiffrer ? '<p class="provisoire">' + T.aChiffrer + " " + Onk.pluriel(T.aChiffrer, "ligne reste", "lignes restent") + " à chiffrer : total provisoire.</p>" : "") +
      (mentionTva ? "<p>" + esc(typo(mentionTva)) + "</p>" : "") +
      (e.conditions ? "<p>" + esc(typo(e.conditions)) + "</p>" : "") +
      "<p>" + esc(typo("Devis gratuit, valable " + (d.validite || 30) + " jours.")) + "</p></div>" +
      '<div class="a4-totaux"><div><span>Total HT</span><b>' + euros(T.ht) + "</b></div><div><span>TVA " + tvaTxt + "&nbsp;%</span><b>" + euros(T.tva) + '</b></div><div class="ttc"><span>Total TTC</span><span>' + euros(T.ttc) + "</span></div>" +
      (d.acompte ? "<div><span>Acompte " + d.acompte + "&nbsp;%</span><b>" + euros(Onk.arrondi(T.ttc * d.acompte / 100)) + "</b></div>" : "") + "</div></div>" +
      '<div class="a4-accord"><div class="case">' + esc(typo("Bon pour accord : date, signature et mention manuscrite « Bon pour accord »")) + '</div><div class="case">Cachet de l\'entreprise</div></div>' +
      '<footer class="a4-pied">' + esc([e.nom, e.adresse.replace(/\n/g, ", "), e.siret ? "SIRET " + e.siret : ""].filter(Boolean).join(" · ")) + "</footer></article>";
  }

  function rendreApercuHTML(d) {
    return '<section class="colonne-apercu' + (ui.apercu ? "" : " ferme") + '" id="apercu" aria-labelledby="t-apercu">' +
      '<div class="apercu-tete"><h2 class="titre-section" id="t-apercu">Aperçu du devis</h2><div class="groupe-boutons"><button class="bouton bouton-petit" type="button" data-action="imprimer">Imprimer / PDF</button><button class="bouton bouton-petit bouton-plein" type="button" data-action="envoyer">Envoyer</button></div></div>' +
      '<div class="apercu-cadre" id="apercu-cadre">' + a4HTML(d) + "</div></section>";
  }
  function ajusterApercu() {
    const cadre = $("#apercu-cadre"), a4 = $("#a4");
    if (!cadre || !a4 || !cadre.clientWidth) return;
    const k = cadre.clientWidth / 794;
    a4.style.transform = "scale(" + k + ")";
    cadre.style.height = Math.ceil(a4.offsetHeight * k) + "px";
  }

  function rendreDevisVue() {
    const d = devis();
    $("#page").className = "page vue-devis";
    $("#page").innerHTML = '<div class="colonne-edition">' + rendreDicteeHTML(d) + rendreAgentHTML(d) + rendreEditionHTML(d) + "</div>" + rendreApercuHTML(d);
    ui.fraiches = false;
    ajusterApercu();
    const ol = $("#etapes"); if (ol) ol.scrollTop = ol.scrollHeight;
  }
  // mise à jour légère pendant la saisie (sans reconstruire les champs)
  function majChiffres() {
    const d = devis();
    d.lignes.forEach((l) => { const el = document.querySelector('[data-ligne="' + l.id + '"] [data-total]'); if (el) { const t = totalLigne(l); el.textContent = t == null ? "" : euros(t); } });
    const tt = $("#totaux"); if (tt) tt.outerHTML = totauxHTML(d);
    const c = $("#apercu-cadre"); if (c) { c.innerHTML = a4HTML(d); ajusterApercu(); }
  }

  function rendreListe() {
    $("#page").className = "page";
    const l = [...etat.liste].sort((a, b) => b.numero.localeCompare(a.numero));
    $("#page").innerHTML = '<section class="bloc carte"><div class="bloc-tete"><h2 class="titre-section">Mes devis</h2><button class="bouton bouton-petit bouton-plein" type="button" data-action="nouveau">+ Nouveau devis</button></div>' +
      '<ul class="historique">' + l.map((d) => { const T = totaux(d); return '<li class="' + (d.id === etat.courant ? "courant" : "") + '"><span class="num">' + esc(d.numero) + "</span><span>" + esc(d.client.nom || "Client ?") + '</span><span class="discret">' + esc(Onk.dateNum(d.date)) + "</span>" +
        '<span class="statut ' + (d.statut === "envoye" ? "statut-encre" : "statut-stylo") + '">' + (d.statut === "envoye" ? "Envoyé" : "Brouillon") + '</span><span class="mt">' + euros(T.ttc) + " TTC</span>" +
        '<span class="groupe-boutons"><button class="bouton bouton-petit" type="button" data-action="ouvrir" data-id="' + d.id + '">Ouvrir</button><button class="bouton bouton-petit" type="button" data-action="dupliquer" data-id="' + d.id + '">Dupliquer</button><button class="bouton bouton-petit" type="button" data-action="suppr-devis" data-id="' + d.id + '">Supprimer</button></span></li>'; }).join("") + "</ul>" +
      '<div class="groupe-boutons" style="margin-top:14px"><button class="bouton bouton-petit" type="button" data-action="sauver">Sauvegarde complète (JSON)</button><button class="bouton bouton-petit" type="button" data-action="restaurer">Restaurer une sauvegarde</button></div></section>';
  }

  function rendreCatalogue() {
    $("#page").className = "page";
    $("#page").innerHTML = '<section class="bloc carte"><div class="bloc-tete"><h2 class="titre-section">Catalogue de prix <small>· ' + etat.catalogue.length + " articles</small></h2>" +
      '<div class="groupe-boutons"><button class="bouton bouton-petit" type="button" data-action="cat-import">Importer (CSV)</button><button class="bouton bouton-petit" type="button" data-action="cat-export">Exporter (CSV)</button></div></div>' +
      '<p class="discret" style="margin-top:6px;font-size:14.5px">' + typo("Le moteur ne prend que ces prix-là. « Mots dictés » : les façons dont vous les dites, séparées par des virgules (« receveur de 90, receveur 90x90 »).") + "</p>" +
      etat.catalogue.map((a, i) => '<div class="cat-ligne">' +
        '<label class="d"><span>Désignation</span><input data-cat="' + i + '" data-champ="designation" value="' + esc(a.designation) + '"></label>' +
        '<label><span>Unité</span><select data-cat="' + i + '" data-champ="unite">' + UNITES.map((u) => "<option" + (u === a.unite ? " selected" : "") + ">" + u + "</option>").join("") + "</select></label>" +
        '<label><span>PU HT (€)</span><input data-cat="' + i + '" data-champ="pu" inputmode="decimal" value="' + esc(nombreFr(a.pu)) + '"></label>' +
        '<label class="s"><span>Mots dictés</span><input data-cat="' + i + '" data-champ="synonymes" value="' + esc((a.synonymes || []).join(", ")) + '"></label>' +
        '<button class="retirer" type="button" data-action="cat-suppr" data-index="' + i + '" aria-label="Supprimer ' + esc(a.designation) + '">×</button></div>').join("") +
      '<div class="groupe-boutons" style="margin-top:12px"><button class="bouton bouton-petit" type="button" data-action="cat-ajout">+ Ajouter un article</button></div></section>';
  }

  function rendreEntreprise() {
    $("#page").className = "page";
    const e = etat.entreprise;
    const ch = (c, lib, type = "text") => '<label class="champ"><span>' + lib + '</span><input data-ent="' + c + '" type="' + type + '" value="' + esc(e[c]) + '"></label>';
    const zone = (c, lib) => '<label class="champ"><span>' + lib + '</span><textarea data-ent="' + c + '" rows="2">' + esc(e[c]) + "</textarea></label>";
    $("#page").innerHTML = '<section class="bloc carte"><h2 class="titre-section">Votre entreprise</h2><p class="discret" style="font-size:14.5px;margin-top:4px">Ces informations apparaissent sur chaque devis.</p>' +
      '<div class="grille-champs" style="margin-top:12px">' + ch("nom", "Nom de l'entreprise") + ch("siret", "SIRET") + ch("tel", "Téléphone", "tel") + ch("email", "E-mail", "email") + "</div>" +
      '<div style="display:grid;gap:12px;margin-top:12px">' + zone("adresse", "Adresse") + ch("assurance", "Assurance décennale (assureur, n° de contrat)") + zone("conditions", "Conditions de paiement") + zone("signature", "Signature des e-mails") + "</div>" +
      '<div class="grille-champs" style="margin-top:12px">' + ch("tva", "TVA par défaut (%)", "number") + ch("validite", "Validité (jours)", "number") + ch("acompte", "Acompte (%)", "number") + "</div>" +
      '<p class="discret" style="font-size:13.5px;margin-top:12px">' + typo("Les mentions obligatoires d'un devis dépendent de votre métier : faites-les valider par votre comptable ou votre fédération.") + "</p></section>";
  }

  function rendre() {
    rendreBandeau(); rendreOnglets();
    if (etat.onglet === "liste") rendreListe();
    else if (etat.onglet === "catalogue") rendreCatalogue();
    else if (etat.onglet === "entreprise") rendreEntreprise();
    else rendreDevisVue();
  }

  /* ---------- Envoi ---------- */
  function texteEnvoi(d) {
    const T = totaux(d), e = etat.entreprise;
    const bonjour = d.client.nom ? "Bonjour " + d.client.nom + "," : "Bonjour,";
    return typo(bonjour + "\n\nVoici le devis n° " + d.numero + (d.objet ? " (" + d.objet.charAt(0).toLowerCase() + d.objet.slice(1) + ")" : "") + " : " + euros(T.ttc) + " TTC, soit " + euros(T.ht) + " HT et TVA " + String(d.tva).replace(".", ",") + " %.\n" +
      "Le devis complet est en pièce jointe (PDF). Il est valable jusqu'au " + Onk.dateMoyenne(echeance(d)) + ".\n" +
      "Pour l'accepter, il suffit de me le renvoyer signé avec la mention « Bon pour accord ». Je reste disponible pour en parler.\n\nBien à vous,\n" + (e.signature || e.nom || ""));
  }
  function fenetreEnvoi(apres) {
    const d = devis(), T = totaux(d);
    const zone = $("#fenetre-zone");
    zone.innerHTML = '<div class="voile" data-fermer="1"><div class="fenetre panneau-envoi" role="dialog" aria-modal="true" aria-labelledby="t-envoi">' +
      '<div class="fenetre-tete"><h2 class="titre-section" id="t-envoi">Envoyer le devis ' + esc(d.numero) + '</h2><button class="fermer" type="button" data-fermer="1" aria-label="Fermer">×</button></div>' +
      (T.aChiffrer ? '<p class="a-verifier" style="white-space:normal;margin-bottom:8px">' + T.aChiffrer + " " + Onk.pluriel(T.aChiffrer, "ligne", "lignes") + " encore à chiffrer : le total est provisoire.</p>" : "") +
      '<ol class="envoi-etapes"><li class="puce-coche">' + typo("Enregistrez le PDF : « Imprimer / PDF », puis « Enregistrer au format PDF ».") + '</li><li class="puce-coche">' + typo("Ouvrez la messagerie : le message est prêt, joignez le PDF.") + "</li></ol>" +
      '<p class="discret" style="font-size:13.5px;margin-top:12px">À : <b>' + esc(d.client.email || "(choisissez le destinataire)") + "</b></p>" +
      '<div class="envoi-resume">' + esc(texteEnvoi(d)) + "</div>" +
      (d.statut === "envoye" ? '<span class="tampon-pret">Prêt à partir</span>' : "") +
      '<div class="groupe-boutons" style="margin-top:14px"><button class="bouton" type="button" data-action="imprimer">Imprimer / PDF</button><button class="bouton bouton-plein" type="button" data-action="mailto">Ouvrir la messagerie</button></div></div></div>';
    if (apres) apres();
  }

  /* ---------- Événements ---------- */
  document.addEventListener("click", async (e) => {
    if (Onk.FILM) return;
    if (e.target.dataset && e.target.dataset.fermer) { $("#fenetre-zone").innerHTML = ""; return; }
    const o = e.target.closest("[data-onglet]");
    if (o) { arreterDictee(); etat.onglet = o.dataset.onglet; sauver(); rendre(); return; }
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const a = b.dataset.action, d = devis();
    if (a === "micro") { if (ui.ecoute) arreterDictee(); else lancerDictee(); return; }
    if (a === "remplir") return remplir();
    if (a === "replier") { ui.replie = !ui.replie; rendreDevisVue(); return; }
    if (a === "suppr-ligne") { const id = b.closest("[data-ligne]").dataset.ligne; d.lignes = d.lignes.filter((l) => l.id !== id); sauver(); rendreDevisVue(); return; }
    if (a === "apercu") { ui.apercu = true; rendreDevisVue(); const ap = $("#apercu"); if (ap && matchMedia("(max-width: 999px)").matches) ap.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
    if (a === "imprimer") { ui.apercu = true; etat.onglet = "devis"; $("#fenetre-zone").innerHTML = ""; rendre(); setTimeout(() => window.print(), 60); return; }
    if (a === "envoyer") { fenetreEnvoi(); return; }
    if (a === "mailto") { Onk.ouvrirLien(Onk.liens.mailto(d.client.email, "Devis " + d.numero + (d.objet ? " : " + d.objet : ""), texteEnvoi(d))); d.statut = "envoye"; d.envoyeLe = jourCourant(); sauver(); fenetreEnvoi(); return; }
    if (a === "nouveau") { const n = nouveauDevis(etat, numeroSuivant(etat)); etat.liste.push(n); etat.courant = n.id; etat.onglet = "devis"; ui.apercu = false; sauver(); rendre(); return; }
    if (a === "ouvrir") { etat.courant = b.dataset.id; etat.onglet = "devis"; sauver(); rendre(); return; }
    if (a === "dupliquer") { const src = etat.liste.find((x) => x.id === b.dataset.id); const n = Onk.copie(src); Object.assign(n, { id: Onk.id("dv"), numero: numeroSuivant(etat), date: jourCourant(), statut: "brouillon", etapes: null }); n.lignes.forEach((l) => (l.id = Onk.id("l"))); etat.liste.push(n); etat.courant = n.id; etat.onglet = "devis"; sauver(); rendre(); return; }
    if (a === "suppr-devis") { if (etat.liste.length > 1 && confirm("Supprimer ce devis ?")) { etat.liste = etat.liste.filter((x) => x.id !== b.dataset.id); if (!devis()) etat.courant = etat.liste[0].id; sauver(); rendre(); } else if (etat.liste.length <= 1) Onk.toast("Gardez au moins un devis."); return; }
    if (a === "sauver") { Onk.telecharger("devis-sauvegarde-" + Onk.horodatage() + ".json", JSON.stringify(etat, null, 2), "application/json"); return; }
    if (a === "restaurer") { const f = await Onk.choisirFichier(".json"); if (!f) return; try { const x = JSON.parse(f.texte); if (!Array.isArray(x.liste) || !x.liste.length) throw new Error(); etat = x; etat.entreprise = Object.assign({}, ENTREPRISE_VIDE, etat.entreprise); if (!devis()) etat.courant = etat.liste[0].id; sauver(); rendre(); Onk.toast("Sauvegarde restaurée : " + etat.liste.length + " devis."); } catch (err) { Onk.toast("Ce fichier n'est pas une sauvegarde du devis dicté."); } return; }
    if (a === "cat-ajout") { etat.catalogue.push({ id: Onk.id("a"), designation: "", unite: "u", pu: 0, synonymes: [] }); sauver(); rendreCatalogue(); const i = document.querySelectorAll('[data-champ="designation"]'); i[i.length - 1].focus(); return; }
    if (a === "cat-suppr") { const x = etat.catalogue[+b.dataset.index]; if (x && confirm("Retirer « " + (x.designation || "cet article") + " » ?")) { etat.catalogue.splice(+b.dataset.index, 1); sauver(); rendreCatalogue(); } return; }
    if (a === "cat-export") { Onk.telecharger("catalogue-prix-" + Onk.horodatage() + ".csv", Onk.csv.ecrire([{ cle: "designation", titre: "designation" }, { cle: "unite", titre: "unite" }, { titre: "prix_ht", val: (x) => nombreFr(x.pu) }, { titre: "mots_dictes", val: (x) => (x.synonymes || []).join(", ") }], etat.catalogue), "text/csv;charset=utf-8"); return; }
    if (a === "cat-import") {
      const f = await Onk.choisirFichier(".csv,text/csv,.txt"); if (!f) return;
      const lignes = Onk.csv.objets(f.texte); let n = 0;
      for (const o of lignes) {
        const des = Onk.colonne(o, "designation", "libelle", "article", "produit"), pu = Onk.lireNombre(Onk.colonne(o, "prix", "pu", "tarif", "montant"));
        if (!des || !Number.isFinite(pu)) continue;
        const u = Onk.colonne(o, "unite") || "u";
        etat.catalogue.push({ id: Onk.id("a"), designation: des, unite: UNITES.includes(u) ? u : u.replace(/^m2$/i, "m²"), pu: Onk.arrondi(pu), synonymes: (Onk.colonne(o, "mots", "synonymes") || "").split(",").map((s) => s.trim()).filter(Boolean) });
        n++;
      }
      sauver(); rendreCatalogue(); Onk.toast(n ? n + " articles importés." : "Aucun article reconnu : colonnes attendues designation ; unite ; prix_ht ; mots_dictes."); return;
    }
    if (a === "vider") { if (confirm("Effacer l'exemple ? Le catalogue d'exemple est gardé comme modèle, vos coordonnées sont à remplir.")) { const cat = etat.catalogue; etat = etatVide(); etat.catalogue = cat; sauver(); rendre(); } }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "ajout-cat" && t.value) {
      const d = devis();
      if (t.value === "libre") d.lignes.push({ id: Onk.id("l"), catalogueId: null, designation: "Nouvelle ligne", qte: 1, unite: "u", pu: null, aChiffrer: true });
      else { const a = etat.catalogue.find((x) => x.id === t.value); d.lignes.push({ id: Onk.id("l"), catalogueId: a.id, designation: a.designation, qte: 1, unite: a.unite, pu: a.pu }); }
      sauver(); rendreDevisVue(); return;
    }
    if (t.dataset.devis === "tva") { devis().tva = parseFloat(t.value); sauver(); majChiffres(); return; }
    const l = t.closest("[data-ligne]");
    if (l && t.dataset.champ === "unite") { const x = devis().lignes.find((y) => y.id === l.dataset.ligne); x.unite = t.value; sauver(); majChiffres(); }
    if (t.dataset.cat != null && t.dataset.champ === "unite") { etat.catalogue[+t.dataset.cat].unite = t.value; sauver(); }
  });
  document.addEventListener("input", (e) => {
    const t = e.target, d = devis();
    if (t.id === "transcription") { d.dictee = t.value; sauver(); return; }
    if (t.dataset.client) { d.client[t.dataset.client] = t.value; sauver(); majChiffres(); return; }
    if (t.dataset.devis === "objet") { d.objet = t.value; sauver(); majChiffres(); return; }
    const l = t.closest("[data-ligne]");
    if (l) {
      const x = d.lignes.find((y) => y.id === l.dataset.ligne); if (!x) return;
      if (t.dataset.champ === "designation") x.designation = t.value;
      if (t.dataset.champ === "qte") { const n = Onk.lireNombre(t.value); x.qte = Number.isFinite(n) ? n : null; if (x.qte != null && /quantit/i.test(x.doute || "")) x.doute = ""; }
      if (t.dataset.champ === "pu") { const n = Onk.lireNombre(t.value); x.pu = Number.isFinite(n) ? n : null; x.aChiffrer = x.pu == null; }
      sauver(); majChiffres();
      if (t.dataset.champ === "pu") { l.classList.toggle("a-chiffrer", x.pu == null); const note = l.querySelector(".note-ligne"); if (note && x.pu != null && !x.doute) note.remove(); }
      return;
    }
    if (t.dataset.cat != null) {
      const a = etat.catalogue[+t.dataset.cat]; if (!a) return;
      if (t.dataset.champ === "synonymes") a.synonymes = t.value.split(",").map((s) => s.trim()).filter(Boolean);
      else if (t.dataset.champ === "pu") { const n = Onk.lireNombre(t.value); if (Number.isFinite(n)) a.pu = n; }
      else a[t.dataset.champ] = t.value;
      sauver(); return;
    }
    if (t.dataset.ent) { etat.entreprise[t.dataset.ent] = ["tva", "validite", "acompte"].includes(t.dataset.ent) ? parseFloat(t.value) || 0 : t.value; sauver(); }
  });
  window.addEventListener("resize", () => ajusterApercu());

  /* ---------- Mode film ---------- */
  function installerFilm() {
    const T_MICRO = 1.6, T_DEBUT = 2.0, T_STOP = 17.9, T_REMPLIR = 18.9, PAS = 0.42;
    const CPS = DICTEE_EXEMPLE.length / (17.3 - T_DEBUT);
    // passe à blanc : étapes et lignes
    etat = etatExemple();
    const res = MoteurDevis.lire(DICTEE_EXEMPLE, etat.catalogue);
    appliquer(devis(), res, "moteur local");
    const ETAPES = devis().etapes.liste;
    const tEtape = (i) => T_REMPLIR + 0.25 + i * PAS;
    const T_FIN = tEtape(ETAPES.length - 1);
    const SECHE = devis().lignes.find((l) => l.pu == null).id;
    const apparition = {}; // ligne → instant
    ETAPES.forEach((e, i) => { if (e.ligne != null && apparition["l" + e.ligne] == null) apparition["l" + e.ligne] = tEtape(i); });
    const T_PU = 29.0, T_PRIX = 30.4, T_APERCU = 32.5, T_ENVOI = 39.5, T_MAIL = 43.0;

    function rendreFilm(t) {
      etat = etatExemple();
      ui.apercu = false; ui.replie = false; ui.fraiches = false;
      for (const k of Object.keys(vue)) delete vue[k];
      const d = devis();
      d.dictee = "";
      vue.ecoute = t >= T_MICRO + 0.15 && t < T_STOP + 0.15;
      vue.secondes = Math.max(0, t - (T_MICRO + 0.15));
      if (t >= T_DEBUT) vue.dictee = Onk.film.tape(DICTEE_EXEMPLE, t, T_DEBUT, CPS);
      if (t >= T_STOP + 0.15) vue.dictee = DICTEE_EXEMPLE;
      if (t >= T_REMPLIR + 0.15) {
        d.dictee = DICTEE_EXEMPLE;
        appliquer(d, MoteurDevis.lire(DICTEE_EXEMPLE, etat.catalogue), "moteur local");
        vue.dictee = "";
        vue.nbEtapes = Math.max(1, Math.min(ETAPES.length, Math.floor((t - T_REMPLIR - 0.25) / PAS) + 1));
        vue.cachees = new Set(d.lignes.filter((l) => t < apparition[l.id]).map((l) => l.id));
        vue.nouvelles = new Set(d.lignes.filter((l) => t >= apparition[l.id] && t < apparition[l.id] + 1.2).map((l) => l.id));
        ui.replie = t >= T_FIN + 1.0;
        // le total HT suit les lignes visibles
        const visibles = { lignes: d.lignes.filter((l) => !vue.cachees.has(l.id)), tva: d.tva };
        vue.totaux = totaux(visibles);
      }
      // l'artisan chiffre le sèche-serviettes : 290 €
      if (t >= T_PU && t < T_PRIX) vue.saisie = { ligne: SECHE, champ: "pu", texte: "290".slice(0, Math.max(0, Math.floor((t - T_PU - 0.4) / 0.25) + 1)) };
      if (t >= T_PRIX) {
        const l = d.lignes.find((x) => x.id === SECHE); l.pu = 290; l.aChiffrer = false;
        const avant = totaux(Object.assign({}, d, { lignes: d.lignes.map((x) => (x.id === SECHE ? Object.assign({}, x, { pu: null }) : x)) })), apres = totaux(d);
        const k = (v) => Onk.arrondi(Onk.film.compte(avant[v], apres[v], t, T_PRIX, T_PRIX + 1.0));
        vue.totaux = { ht: k("ht"), tva: k("tva"), ttc: k("ttc"), aChiffrer: t < T_PRIX + 0.2 ? 1 : 0 };
        if (t >= T_PRIX + 1.0) delete vue.totaux;
      }
      if (t >= T_APERCU + 0.15) ui.apercu = true;
      rendre();
      // fenêtre d'envoi
      if (t >= T_ENVOI + 0.15) { if (t >= T_MAIL + 0.15) { d.statut = "envoye"; } fenetreEnvoi(); }
      else $("#fenetre-zone").innerHTML = "";
      // défilement de la page (téléphone)
      const page = document.scrollingElement;
      page.scrollTop = 0;
      const haut = (sel) => { const el = $(sel); return el ? el.getBoundingClientRect().top + page.scrollTop : 0; };
      const max = page.scrollHeight - innerHeight;
      let y = 0;
      if (t >= T_REMPLIR + 0.3 && t < T_APERCU + 0.15) {
        // suit la dernière ligne arrivée, puis la ligne à chiffrer
        const visibles = d.lignes.filter((l) => !vue.cachees || !vue.cachees.has(l.id));
        const derniere = visibles[visibles.length - 1];
        const cible = t >= 27.6 ? haut("#ligne-" + SECHE) - 360 : derniere ? haut("#ligne-" + derniere.id) - 560 : haut("#bloc-devis") - 80;
        const debut = t < T_REMPLIR + 1.2 ? Onk.film.compte(0, cible, t, T_REMPLIR + 0.3, T_REMPLIR + 1.2) : cible;
        y = debut;
        if (t >= T_PRIX + 0.6) y = Onk.film.compte(cible, haut("#totaux") - 420, t, T_PRIX + 0.6, T_PRIX + 1.4);
      }
      if (t >= T_APERCU + 0.15) {
        const a = haut("#apercu") - 70;
        y = t < T_APERCU + 1.2 ? Onk.film.compte(haut("#totaux") - 420, a, t, T_APERCU + 0.15, T_APERCU + 1.1) : Onk.film.compte(a, a + 150, t, T_APERCU + 2.6, T_APERCU + 5.2);
      }
      page.scrollTop = Math.round(Math.max(0, Math.min(max, y)));
    }
    Onk.film.installer({
      duree: 48,
      vue: "mobile",
      etapes: [
        { t: 0, titre: "Fin de chantier : le devis, tout de suite" },
        { t: T_MICRO, titre: "Trente secondes de dictée, dans la camionnette" },
        { t: T_REMPLIR, titre: "L'agent cherche chaque ligne dans le catalogue de prix" },
        { t: T_FIN - 1.5, titre: "Le sèche-serviettes n'est pas au catalogue : à chiffrer" },
        { t: T_PU, titre: "L'artisan met son prix, le total se met à jour" },
        { t: T_APERCU, titre: "Le devis A4, propre, prêt en PDF" },
        { t: T_ENVOI, titre: "Prêt à partir" }
      ],
      rendre: rendreFilm,
      gestes: [
        { t: 0.8, cible: { x: 300, y: 600 } },
        { t: T_MICRO, cible: ".micro", appui: true, trajet: 0.8 },
        { t: 3.0, cible: { x: 330, y: 520 }, trajet: 1.2 },
        { t: T_STOP, cible: ".micro", appui: true, trajet: 1.0 },
        { t: T_REMPLIR, cible: '[data-action="remplir"]', appui: true, trajet: 0.8 },
        { t: 21.5, cible: { x: 340, y: 760 }, trajet: 1.4 },
        { t: T_PU, cible: "#ligne-" + SECHE + " .pu", appui: true, trajet: 1.2 },
        { t: 31.4, cible: { x: 330, y: 640 }, trajet: 0.9 },
        { t: T_APERCU, cible: '[data-action="apercu"]', appui: true, trajet: 1.0 },
        { t: 35.0, cible: { x: 350, y: 700 }, trajet: 1.2 },
        { t: T_ENVOI, cible: '#apercu [data-action="envoyer"]', appui: true, trajet: 1.3 },
        { t: T_MAIL, cible: '[data-action="mailto"]', appui: true, trajet: 1.2 },
        { t: 45.5, cible: null }
      ]
    });
  }

  /* ---------- Démarrage ---------- */
  Onk.moteur.installer($("#moteur"));
  if (Onk.FILM) { installerFilm(); return; }
  charger();
  rendre();
  if ("ResizeObserver" in window) new ResizeObserver(() => ajusterApercu()).observe(document.body);
})();
