/* ================================================================
   ONKLAUD : comportements du site
   Les réglages (email, téléphone, mentions…) sont dans reglages.js, pas ici.
   ================================================================ */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const echappe = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rempli = (v) => typeof v === "string" && v.trim() !== "";
  const reglages = typeof CONFIG === "object" ? CONFIG : { email: "contact@onklaud.com" };
  const observe = "IntersectionObserver" in window;

  /* ---------- Réglages → page ---------- */
  $$("[data-email]").forEach((el) => { el.textContent = reglages.email; if (el.tagName === "A") el.href = "mailto:" + reglages.email; });
  $$("[data-champ]").forEach((el) => {
    const v = reglages[el.dataset.champ];
    if (rempli(v)) { el.textContent = el.dataset.champ === "siret" ? v.trim().replace(/ /g, "\u00a0") : v; el.classList.remove("a-completer"); }
  });
  const wa = String(reglages.whatsapp || "").replace(/\D/g, "");
  if (wa) $$("[data-whatsapp]").forEach((el) => { el.hidden = false; const a = $("a", el); if (a) a.href = "https://wa.me/" + wa; });
  const tel = String(reglages.telephone || "").replace(/[^\d+]/g, "");
  if (tel) $$("[data-telephone]").forEach((el) => {
    el.hidden = false;
    const a = el.tagName === "A" ? el : $("a", el);
    if (a) { a.href = "tel:" + tel; if (!a.textContent.trim()) a.textContent = reglages.telephone.trim().replace(/ /g, " "); }
  });
  if (rempli(reglages.mentionTVA)) $$("[data-tva]").forEach((el) => {
    const point = /\.\s*$/.test(el.textContent);
    el.textContent = reglages.mentionTVA.trim().replace(/ (?=B du|du CGI|du CIBS)/g, " ") + (point ? "." : "");
  });
  if (rempli(reglages.nom)) $$("[data-nom-ei]").forEach((el) => { el.textContent = reglages.nom.trim() + " EI (micro-entreprise)"; });
  if (rempli(reglages.zone)) $$("[data-zone]").forEach((el) => { el.textContent = " Intervention " + reglages.zone.trim().replace(/\.?$/, "."); el.hidden = false; });
  const photos = reglages.photos || {};
  $$("[data-photo]").forEach((fig) => {
    const p = photos[fig.dataset.photo];
    if (!p || !rempli(p.src)) return;
    const img = document.createElement("img");
    img.src = p.src; img.alt = p.alt || ""; img.loading = "lazy"; img.decoding = "async";
    fig.appendChild(img);
  });
  const interlocuteur = $("#interlocuteur");
  const quiRepond = rempli(reglages.nom) ? reglages.nom : reglages.prenom;
  if (interlocuteur && rempli(quiRepond)) {
    interlocuteur.innerHTML = "Votre interlocuteur&nbsp;: <b>" + echappe(quiRepond.trim()) + "</b>" +
      (rempli(reglages.ville) ? ", basé à " + echappe(reglages.ville.trim()) : "") + "." +
      (rempli(reglages.zone) ? " Intervention " + echappe(reglages.zone.trim().replace(/\.?$/, ".")) : "");
    interlocuteur.hidden = false;
  }
  const agenda = $("#agenda");
  if (agenda && /^https:\/\//.test(String(reglages.agenda || "").trim())) { $("a", agenda).href = reglages.agenda.trim(); agenda.hidden = false; }

  /* ---------- Données structurées : ajout de ce qui est rempli dans reglages.js ---------- */
  const ld = $("#donnees-structurees");
  if (ld) {
    try {
      const d = JSON.parse(ld.textContent);
      d.email = reglages.email;
      if (rempli(reglages.telephone)) d.telephone = reglages.telephone.trim();
      if (rempli(reglages.adresse)) d.address = reglages.adresse.trim();
      if (rempli(reglages.nom)) d.founder = { "@type": "Person", name: reglages.nom.trim() };
      ld.textContent = JSON.stringify(d);
    } catch (_) { /* on garde la version écrite dans la page */ }
  }

  /* ---------- Réalisations (uniquement de vrais clients, voir reglages.js) ---------- */
  const realisations = typeof REALISATIONS === "object" && Array.isArray(REALISATIONS) ? REALISATIONS.filter((r) => r && rempli(r.qui)) : [];
  const blocReal = $("#realisations");
  if (blocReal && realisations.length) {
    $("#liste-realisations").innerHTML = realisations.map((r) =>
      '<li class="realisation"><h3 class="titre-3">' + echappe(r.qui) + "</h3>" +
      (rempli(r.corvee) ? '<p class="discret">Besoin&nbsp;: ' + echappe(r.corvee) + "</p>" : "") +
      (rempli(r.fait) ? "<p>Réalisé&nbsp;: " + echappe(r.fait) + "</p>" : "") +
      (rempli(r.resultat) ? "<blockquote>« " + echappe(r.resultat) + " »</blockquote>" : "") +
      (/^https?:\/\//.test(r.lien || "") ? '<p><a class="lien" href="' + echappe(r.lien) + '" rel="noopener">Voir le projet</a></p>' : "") +
      "</li>").join("");
    blocReal.hidden = false;
  }

  /* ---------- Mesure d'audience sans cookie (désactivée par défaut, reglages.js) ---------- */
  const mesure = reglages.mesure === true && location.protocol === "https:";
  if (mesure) {
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    const s = document.createElement("script");
    s.src = "/_vercel/insights/script.js"; s.defer = true;
    document.head.appendChild(s);
  }
  $$("[data-mesure]").forEach((el) => { el.hidden = (el.dataset.mesure === "oui") !== (reglages.mesure === true); });
  const suivre = (nom, donnees) => { if (mesure && window.va) window.va("event", { name: nom, data: donnees || {} }); };

  /* ---------- Anciens liens (ancienne page d'accueil, démos) ---------- */
  if (/^#(demo-|outil$)/.test(location.hash) && $("#contact")) location.replace("outils/");
  const anciens = { "#diagnostic": "#contact", "#services": "#prix", "#deroule": "#prix" };
  if (anciens[location.hash] && $(anciens[location.hash])) {
    history.replaceState && history.replaceState(null, "", anciens[location.hash]);
    $(anciens[location.hash]).scrollIntoView();
  }

  /* ---------- Barre du haut ---------- */
  const barre = $("#barre"), nav = $("#nav"), boutonMenu = $("#bouton-menu");
  if (barre) {
    const maj = () => barre.classList.toggle("defile", window.scrollY > 8);
    window.addEventListener("scroll", maj, { passive: true });
    maj();
  }
  if (boutonMenu && nav) {
    const ouvrir = (o) => { boutonMenu.setAttribute("aria-expanded", String(o)); nav.classList.toggle("ouverte", o); };
    boutonMenu.addEventListener("click", () => ouvrir(boutonMenu.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) ouvrir(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("ouverte")) { ouvrir(false); boutonMenu.focus(); }
    });
  }
  // Lien actif dans la navigation
  if (nav && observe) {
    const liens = $$("a[href^='#']", nav);
    const cibles = liens.map((a) => document.getElementById(a.hash.slice(1))).concat(document.getElementById("haut")).filter(Boolean);
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (en.isIntersecting) liens.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + en.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    cibles.forEach((c) => io.observe(c));
  }

  /* ---------- Projet prérempli depuis les exemples ---------- */
  const choixProjet = $("#f-projet");
  $$("[data-sujet]").forEach((a) => a.addEventListener("click", () => {
    if (choixProjet && $('option[value="' + a.dataset.sujet + '"]', choixProjet)) choixProjet.value = a.dataset.sujet;
  }));

  /* ---------- Formulaire de contact ---------- */
  const formulaire = $("#formulaire");
  if (formulaire) {
    const confirmation = $("#confirmation"), copie = $("#copie");
    const envoyer = $('button[type="submit"]', formulaire), libelleBouton = envoyer.innerHTML;
    const email = $("#f-email"), telephone = $("#f-tel");
    let message = "";
    [email, telephone].forEach((c) => c.addEventListener("input", () => email.setCustomValidity("")));

    const confirmer = (etat) => {
      $(".etat-envoye", confirmation).hidden = etat !== "envoye";
      $(".etat-messagerie", confirmation).hidden = etat === "envoye";
      copie.textContent = "";
      confirmation.hidden = false;
      confirmation.focus();
    };

    // Envoi direct (api/diagnostic.mjs, si l'hébergeur le permet). Faux si indisponible.
    const envoiDirect = async (donnees) => {
      if (reglages.envoiDirect !== true || !/^https?:$/.test(location.protocol) || !window.fetch) return false;
      const arret = window.AbortController ? new AbortController() : null;
      const minuteur = setTimeout(() => arret && arret.abort(), 12000);
      try {
        const r = await fetch("/api/diagnostic", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(donnees), signal: arret ? arret.signal : undefined
        });
        return r.ok;
      } catch (_) { return false; } finally { clearTimeout(minuteur); }
    };

    formulaire.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!formulaire.checkValidity()) { formulaire.reportValidity(); return; }
      const f = new FormData(formulaire);
      const v = (k) => String(f.get(k) || "").trim();
      if (!v("email") && !v("telephone")) {
        email.setCustomValidity("Indiquez un e-mail ou un numéro de téléphone pour que nous puissions vous répondre.");
        email.reportValidity();
        return;
      }
      const libelle = choixProjet ? choixProjet.options[choixProjet.selectedIndex].text : "";
      const objet = "Mon projet – " + v("commerce");
      const corps = [
        "Bonjour,", "",
        "Je souhaite parler de mon projet lors d’un premier échange.", "",
        "Prénom : " + v("prenom"),
        "Activité : " + v("commerce"),
        "E-mail : " + v("email"),
        "Téléphone : " + v("telephone"),
        "Mon projet : " + libelle, "",
        "En quelques mots : " + v("phrase")
      ].join("\n");
      message = "À : " + reglages.email + "\nObjet : " + objet + "\n\n" + corps;

      envoyer.disabled = true;
      envoyer.textContent = "Envoi en cours…";
      const ok = await envoiDirect({
        prenom: v("prenom"), commerce: v("commerce"), email: v("email"), telephone: v("telephone"),
        sujet: libelle, phrase: v("phrase"), site_web: v("site_web")
      });
      envoyer.disabled = false;
      envoyer.innerHTML = libelleBouton;
      if (ok) {
        suivre("Projet envoyé", { sujet: libelle, voie: "direct" });
        confirmer("envoye");
        return;
      }
      // La messagerie du visiteur, avec le message prêt.
      suivre("Projet envoyé", { sujet: libelle, voie: "messagerie" });
      window.location.href = "mailto:" + reglages.email +
        "?subject=" + encodeURIComponent(objet) +
        "&body=" + encodeURIComponent(corps.replace(/\n/g, "\r\n"));
      confirmer("messagerie");
    });

    $("#copier").addEventListener("click", () => {
      const ok = () => { copie.textContent = "Message copié."; };
      const secours = () => {
        const t = document.createElement("textarea");
        t.value = message; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); ok(); } catch (_) { copie.textContent = "Copie impossible : sélectionnez le texte manuellement."; }
        t.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(message).then(ok, secours);
      else secours();
    });
  }

  /* ---------- Mobile : bouton de contact toujours accessible ----------
     Visible une fois l'en-tête passé, masqué sur le formulaire et le pied de page. */
  const cta = $("#cta-mobile");
  if (cta && observe) {
    const vus = new Set();
    const maj = () => {
      const montrer = !vus.has("haut") && !vus.has("contact") && !vus.has("pied") && !(nav && nav.classList.contains("ouverte"));
      cta.classList.toggle("visible", montrer);
      cta.setAttribute("aria-hidden", String(!montrer));
      cta.tabIndex = montrer ? 0 : -1;
    };
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => { const k = en.target.dataset.cta; if (en.isIntersecting) vus.add(k); else vus.delete(k); });
      maj();
    });
    [["haut", $("#haut")], ["contact", $("#contact")], ["pied", $(".pied")]].forEach(([k, el]) => {
      if (el) { el.dataset.cta = k; io.observe(el); }
    });
    if (boutonMenu) boutonMenu.addEventListener("click", maj);
  }
})();
