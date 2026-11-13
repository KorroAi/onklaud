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
  if (tel) { const c = $("#cta-tel"); if (c) c.href = "tel:" + tel; const b = $(".contact-direct a"); if (b) b.textContent = "Appeler le " + reglages.telephone.trim().replace(/ /g, " "); }
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
    $("#qui").hidden = false;
    // Portrait à la place des initiales, s'il est renseigné dans reglages.js
    const pastille = $(".avatar-q", $("#qui")), portrait = photos.portrait;
    if (pastille && portrait && rempli(portrait.src)) {
      const img = document.createElement("img");
      img.src = portrait.src; img.alt = portrait.alt || ""; img.width = 96; img.height = 96; img.decoding = "async";   // pas de chargement différé : l'image n'est insérée qu'une fois chargée
      img.addEventListener("load", () => { pastille.textContent = ""; pastille.appendChild(img); pastille.classList.add("photo"); pastille.removeAttribute("aria-hidden"); });
    }
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
  if (/^#(demo-[a-z]+-|demo-relances|demo-commandes|outil$)/.test(location.hash) && $("#contact")) location.replace("demos/");
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

  /* ---------- Offre de lancement (reglages.js) : prix réduits et bandeau de lancement ----------
     Sans JavaScript, ou une fois l'offre finie, seuls les prix normaux s'affichent. */
  const lance = reglages.lancement || {};
  const lanceActive = Number(lance.places) > 0 && rempli(lance.fin) && new Date(lance.fin + "T23:59:59") >= new Date();
  if (lanceActive) {
    document.documentElement.classList.add("lancement");
    $$("[data-places]").forEach((el) => { el.textContent = lance.places; });
    const fin = new Date(lance.fin + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }).replace(/^1 /, "1er ");
    $$("[data-fin]").forEach((el) => { el.textContent = fin; });
    $$("[data-lancement]").forEach((el) => { el.hidden = false; });
  }

  /* ---------- Onglets de la page Tarifs ----------
     Sans JavaScript, les trois panneaux restent affichés l'un sous l'autre. */
  const onglets = $$('[role="tab"]');
  if (onglets.length) {
    document.documentElement.classList.add("onglets-actifs");
    const montrer = (id) => onglets.forEach((o) => {
      const choisi = o.dataset.onglet === id;
      o.setAttribute("aria-selected", String(choisi)); o.tabIndex = choisi ? 0 : -1;
      const panneau = document.getElementById(o.dataset.onglet); if (panneau) panneau.hidden = !choisi;
    });
    const voulu = () => { const h = location.hash.slice(1); return onglets.some((o) => o.dataset.onglet === h) ? h : onglets[0].dataset.onglet; };
    onglets.forEach((o, i) => {
      o.addEventListener("click", () => { montrer(o.dataset.onglet); history.replaceState && history.replaceState(null, "", "#" + o.dataset.onglet); });
      o.addEventListener("keydown", (e) => {
        const pas = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!pas) return;
        e.preventDefault(); const s = onglets[(i + pas + onglets.length) % onglets.length]; s.click(); s.focus();
      });
    });
    window.addEventListener("hashchange", () => montrer(voulu()));
    montrer(voulu());
    if (location.hash && onglets.some((o) => "#" + o.dataset.onglet === location.hash)) requestAnimationFrame(() => $(".onglets").scrollIntoView());
  }

  /* ---------- Apparitions au défilement ----------
     Sans JavaScript, sans IntersectionObserver ou avec « réduire les animations », tout reste visible.
     .vu lance l'apparition ; .pose retire ensuite les décalages pour que les survols répondent aussitôt. */
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const aReveler = $$("[data-vu]");
  if (aReveler.length && observe && !calme) {
    document.documentElement.classList.add("js");
    aReveler.forEach((el) => {
      if (el.dataset.vu === "groupe") Array.from(el.children).forEach((c, i) => c.style.setProperty("--i", i));
    });
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        el.classList.add("vu");
        setTimeout(() => el.classList.add("pose"), 1800);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    aReveler.forEach((el) => io.observe(el));
  }

  /* ---------- Héros : les écrans suivent le défilement et, sur ordinateur, le pointeur ----------
     Chaque couche porte sa profondeur (--z) : les écrans de devant bougent plus que ceux du fond. */
  const vitrine = $(".vitrine-heros"), heros = $("#haut");
  if (vitrine && heros && !calme) {
    let vx = 0, vy = 0, x = 0, y = 0, enCours = false;
    const pas = () => {
      x += (vx - x) * 0.08; y += (vy - y) * 0.08;
      vitrine.style.setProperty("--mx", x.toFixed(2));
      vitrine.style.setProperty("--my", y.toFixed(2));
      if (Math.abs(vx - x) > 0.05 || Math.abs(vy - y) > 0.05) requestAnimationFrame(pas); else enCours = false;
    };
    const lancer = () => { if (!enCours) { enCours = true; requestAnimationFrame(pas); } };
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      heros.addEventListener("pointermove", (e) => {
        const r = heros.getBoundingClientRect();
        vx = ((e.clientX - r.left) / r.width - 0.5) * -22;
        vy = ((e.clientY - r.top) / r.height - 0.5) * -14;
        lancer();
      });
      heros.addEventListener("pointerleave", () => { vx = 0; vy = 0; lancer(); });
    }
    const defile = () => vitrine.style.setProperty("--sy", (-Math.min(window.scrollY, 1000) * 0.07).toFixed(1));
    window.addEventListener("scroll", defile, { passive: true });
    defile();
  }

  /* ---------- Projet prérempli depuis les exemples ---------- */
  const choixProjet = $("#f-projet");
  const projetVoulu = (new URLSearchParams(location.search).get("projet") || "").replace(/[^a-z-]/g, "");
  if (projetVoulu && choixProjet && $('option[value="' + projetVoulu + '"]', choixProjet)) choixProjet.value = projetVoulu;
  $$("[data-sujet]").forEach((a) => a.addEventListener("click", () => {
    if (choixProjet && $('option[value="' + a.dataset.sujet + '"]', choixProjet)) choixProjet.value = a.dataset.sujet;
  }));

  /* ---------- Essai direct : signer un devis sur la page ---------- */
  const sig = $("#essai-sig");
  if (sig) {
    const ok = $("#essai-ok"), etapes = $$("#essai-etapes li"), indice = $("#essai-indice");
    const ctx = sig.getContext("2d");
    const preparer = () => {
      const r = sig.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      sig.width = r.width * dpr; sig.height = r.height * dpr;
      ctx.scale(dpr, dpr); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#16233f";
      ok.disabled = true;
    };
    let actif = false, fini = false;
    const pt = (e) => { const b = sig.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    sig.addEventListener("pointerdown", (e) => { if (fini) return; actif = true; indice.hidden = true; try { sig.setPointerCapture(e.pointerId); } catch (_) { /* simulé */ } ctx.beginPath(); ctx.moveTo(...pt(e)); });
    sig.addEventListener("pointermove", (e) => { if (!actif) return; ctx.lineTo(...pt(e)); ctx.stroke(); ok.disabled = false; });
    sig.addEventListener("pointerup", () => { actif = false; });
    $("#essai-efface").addEventListener("click", () => {
      fini = false; preparer(); indice.hidden = false; etapes.forEach((l) => l.classList.remove("fait")); $("#essai-fin").hidden = true;
    });
    ok.addEventListener("click", () => {
      fini = true; ok.disabled = true;
      const lent = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      etapes.forEach((l, i) => setTimeout(() => l.classList.add("fait"), lent ? 120 + i * 420 : 0));
      setTimeout(() => { $("#essai-fin").hidden = false; }, lent ? 120 + etapes.length * 420 : 0);
    });
    preparer();
    addEventListener("resize", () => { if (!fini) preparer(); });
  }

  /* ---------- Formulaire de contact ---------- */
  const formulaire = $("#formulaire");
  if (formulaire) {
    const confirmation = $("#confirmation"), copie = $("#copie");
    const envoyer = $('button[type="submit"]', formulaire), libelleBouton = envoyer.innerHTML;
    const email = $("#f-email"), telephone = $("#f-tel");
    let message = "", voie = "";
    const wa = String(reglages.whatsapp || "").replace(/\D/g, ""), parWa = $("#par-whatsapp");
    if (wa && parWa) {
      parWa.hidden = false;
      parWa.addEventListener("click", () => { voie = "whatsapp"; formulaire.requestSubmit ? formulaire.requestSubmit() : formulaire.dispatchEvent(new Event("submit", { cancelable: true })); });
    }
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
      const parWhatsapp = voie === "whatsapp"; voie = "";
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
      if (parWhatsapp) {
        suivre("Projet envoyé", { sujet: libelle, voie: "whatsapp" });
        window.location.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(corps);
        return;
      }

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
      const sms = $("#envoi-sms");
      if (sms && tel && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        sms.href = "sms:" + tel.replace(/^0/, "+33") + "?body=" + encodeURIComponent(v("prenom") + ", " + v("commerce") + ". " + v("phrase") + " Me joindre : " + (v("telephone") || v("email")));
        sms.hidden = false;
      }
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
      const montrer = !vus.has("haut") && !vus.has("essai") && !vus.has("contact") && !vus.has("pied") && !(nav && nav.classList.contains("ouverte"));
      cta.classList.toggle("visible", montrer);
      cta.setAttribute("aria-hidden", String(!montrer));
      cta.tabIndex = montrer ? 0 : -1;
      const ct = $("#cta-tel");
      if (ct) { ct.classList.toggle("visible", montrer); ct.setAttribute("aria-hidden", String(!montrer)); ct.tabIndex = montrer ? 0 : -1; }
    };
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => { const k = en.target.dataset.cta; if (en.isIntersecting) vus.add(k); else vus.delete(k); });
      maj();
    });
    [["haut", $("#haut")], ["essai", $("#essai")], ["contact", $("#contact")], ["pied", $(".pied")]].forEach(([k, el]) => {
      if (el) { el.dataset.cta = k; io.observe(el); }
    });
    if (boutonMenu) boutonMenu.addEventListener("click", maj);
  }
})();
