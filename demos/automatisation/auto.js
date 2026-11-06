/* Démo d'automatisation : le message saisi est réellement lu par des règles, puis traité étape par étape. Tout reste sur l'appareil. */
(function () {
  "use strict";
  const O = window.Outils, esc = O.esc;
  const MARQUE = O.marque("Ferrand Plomberie");
  const m = window.Magasin("automatisation", () => ({ demandes: 0 }));
  const $ = (s) => document.querySelector(s);
  const EXEMPLES = [
    ["Fuite urgente", "Bonjour, j’ai une fuite sous l’évier à Villeurbanne, c’est urgent. Pouvez-vous passer demain ?\nMme Caron, 06 00 00 00 77"],
    ["Chauffe-eau", "Bonjour, mon chauffe-eau ne fonctionne plus depuis ce matin. J’habite à Bron. Combien coûte un remplacement ?\nM. Dubois, 06 00 00 00 78"],
    ["Salle de bains", "Bonjour, je souhaite refaire ma salle de bains à Lyon et remplacer la baignoire par une douche. Pouvez-vous me faire un devis ?\nMadame Girard, 07 00 00 00 79"]
  ];
  const METIERS = [
    [/fuite|inond|dégât/i, "Recherche et réparation de fuite", 180, true],
    [/chauffe.?eau|ballon/i, "Remplacement du chauffe-eau", 890, false],
    [/salle de bains?|douche|baignoire/i, "Rénovation de salle de bains", 4800, false],
    [/wc|toilette/i, "Réparation des toilettes", 140, false],
    [/robinet|mitigeur/i, "Remplacement du robinet", 160, false]
  ];
  const VILLES = ["Lyon", "Villeurbanne", "Bron", "Caluire", "Vénissieux", "Écully", "Oullins", "Vaulx-en-Velin", "Saint-Priest", "Tassin"];

  const lire = (t) => {
    const nom = (t.match(/\b(M\.|Mme|Madame|Monsieur)\s+([A-ZÀ-Ý][\p{L}-]+)/u) || []);
    const tel = (t.match(/0[1-9](?:[ .-]?\d{2}){4}/) || [""])[0];
    const ville = VILLES.find((v) => new RegExp("\\b" + v + "\\b", "i").test(t)) || "";
    const metier = METIERS.find((x) => x[0].test(t)) || [null, "Intervention de plomberie", 120, false];
    const urgent = metier[3] || /urgent|vite|aujourd|ce soir/i.test(t);
    return { nom: nom[0] ? nom[1].replace("Madame", "Mme").replace("Monsieur", "M.") + " " + nom[2] : "Nouveau client", tel, ville, objet: metier[1], prix: metier[2], urgent };
  };
  const creneau = (urgent) => {
    let i = urgent ? 1 : 2, d = O.jour(i);
    while ([0, 6].includes(new Date(d + "T12:00:00").getDay())) { i += 1; d = O.jour(i); }
    return O.dateLongue(d) + (urgent ? " à 9 h" : " à 14 h");
  };
  const ETAPES = [
    ["Demande reçue", () => "Message capté"],
    ["Message lu", (r) => r.objet + (r.urgent ? ", urgent" : "")],
    ["Fiche client créée", (r) => r.nom + (r.ville ? ", " + r.ville : "")],
    ["Devis préparé", (r) => O.eur(r.prix, 0) + " TTC"],
    ["Créneau réservé", (r) => r.creneau],
    ["Réponse envoyée", (r) => r.tel ? "SMS au " + r.tel : "Réponse prête"],
    ["Relance programmée", () => "Dans 3 jours sans signature"]
  ];
  const ui = { encours: false };
  const dessinerNoeuds = () => {
    $("#noeuds").innerHTML = ETAPES.map(([t], i) => '<li class="noeud" id="n' + i + '"><i>' + (i + 1) + "</i><div><b>" + t + "</b><small></small></div></li>").join("");
    tracer();
  };
  const centre = (el, box) => { const r = el.getBoundingClientRect(); return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]; };
  const tracer = () => {
    const svg = $("#liens"), box = $(".flux").getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
    let d = "";
    for (let i = 0; i < ETAPES.length - 1; i += 1) {
      const [x1, y1] = centre($("#n" + i), box), [x2, y2] = centre($("#n" + (i + 1)), box);
      d += '<path id="l' + i + '" d="M' + x1 + " " + y1 + " L" + x2 + " " + y2 + '"/>';
    }
    svg.innerHTML = d;
  };
  const attendre = (ms) => new Promise((f) => setTimeout(f, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 60 : ms));
  const message = (r) => "Bonjour " + r.nom + ",\n\nNous avons bien reçu votre demande : " + r.objet.toLowerCase() + (r.ville ? " à " + r.ville : "") + ". Nous vous proposons " + r.creneau + ". Votre devis de " + O.eur(r.prix, 0).replace(/ /g, " ") + " est prêt à être signé.\n\nCordialement,\n" + MARQUE;

  const lancer = async () => {
    const t = $("#message").value.trim(); if (!t || ui.encours) { $("#message").focus(); return; }
    ui.encours = true; $("#lancer").disabled = true; $("#lancer").textContent = "Traitement en cours";
    const r = lire(t); r.creneau = creneau(r.urgent);
    const debut = performance.now();
    document.querySelectorAll(".noeud").forEach((n) => { n.className = "noeud"; n.querySelector("small").textContent = ""; });
    document.querySelectorAll("#liens path").forEach((p) => p.classList.remove("on"));
    $("#resultat").innerHTML = ""; $("#c-actions").textContent = "0";
    for (let i = 0; i < ETAPES.length; i += 1) {
      const n = $("#n" + i); n.classList.add("actif");
      await attendre(520);
      n.classList.remove("actif"); n.classList.add("fait");
      n.querySelector("small").textContent = ETAPES[i][1](r);
      $("#c-actions").textContent = String(i + 1);
      $("#c-duree").textContent = ((performance.now() - debut) / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " s";
      if (i < ETAPES.length - 1) { $("#l" + i).classList.add("on"); await attendre(180); }
    }
    $("#resultat").innerHTML = '<article class="r-fiche"><small>Fiche client</small><b>' + esc(r.nom) + "</b><p>" + esc([r.tel, r.ville].filter(Boolean).join(", ") || "Coordonnées à compléter") + '</p></article><article class="r-devis"><small>Devis prêt à signer</small><b>' + O.eur(r.prix, 0) + "</b><p>" + esc(r.objet) + '</p></article><article class="r-agenda"><small>Agenda</small><b>' + esc(r.creneau.replace(/^./, (x) => x.toUpperCase())) + '</b></article><article class="r-sms"><small>Message envoyé au client</small><p>' + esc(message(r)).replace(/\n/g, "<br>") + "</p></article>";
    m.maj((d) => { d.demandes += 1; });
    ui.encours = false; $("#lancer").disabled = false; $("#lancer").textContent = "Lancer de nouveau";
  };

  $("#exemples").innerHTML = EXEMPLES.map(([t], i) => '<button data-ex="' + i + '" type="button">' + t + "</button>").join("");
  $("#message").value = EXEMPLES[0][1];
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ex]");
    if (b) $("#message").value = EXEMPLES[Number(b.dataset.ex)][1];
    if (e.target.id === "lancer") lancer();
  });
  window.addEventListener("resize", tracer);
  window.bandeauDemo(m, "../", "modifiez le message, puis lancez l’automatisation : il est réellement lu par des règles.");
  dessinerNoeuds();
  window.demoAuto = { lire, lancer };
})();
