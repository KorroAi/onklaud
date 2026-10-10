/* ================================================================
   ONKLAUD : comportements de la page
   Les réglages (email, démos…) sont dans reglages.js, pas ici.
   ================================================================ */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const echappe = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rempli = (v) => typeof v === "string" && v.trim() !== "";
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const reglages = typeof CONFIG === "object" ? CONFIG : { email: "contact@onklaud.com" };
  const demos = typeof DEMOS === "object" && Array.isArray(DEMOS) ? DEMOS : [];
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const observe = "IntersectionObserver" in window;

  /* ---------- Réglages → page ---------- */
  $$("[data-email]").forEach((el) => { el.textContent = reglages.email; if (el.tagName === "A") el.href = "mailto:" + reglages.email; });
  $$("[data-champ]").forEach((el) => {
    const v = reglages[el.dataset.champ];
    if (rempli(v)) { el.textContent = v; el.classList.remove("a-completer"); }
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
    el.textContent = reglages.mentionTVA.trim().replace(/ (?=B du|du CGI|du CIBS)/g, " ") + (el.tagName === "P" ? "." : "");
  });
  if (rempli(reglages.nom)) $$("[data-nom-ei]").forEach((el) => { el.textContent = reglages.nom.trim() + " EI (micro-entreprise)"; });
  if (rempli(reglages.zone)) $$("[data-zone]").forEach((el) => { el.textContent = " " + reglages.zone.trim().replace(/^./, (c) => c.toUpperCase()).replace(/\.?$/, "."); el.hidden = false; });
  const photos = reglages.photos || {};
  $$("[data-photo]").forEach((fig) => {
    const p = photos[fig.dataset.photo];
    if (!p || !rempli(p.src)) return;
    const img = document.createElement("img");
    img.src = p.src; img.alt = p.alt || ""; img.loading = "lazy"; img.decoding = "async";
    fig.appendChild(img);
  });
  const interlocuteur = $("#interlocuteur");
  if (interlocuteur && rempli(reglages.prenom)) {
    interlocuteur.innerHTML = "Vous parlez à <b>" + echappe(reglages.prenom.trim()) + "</b>" +
      (rempli(reglages.ville) ? ", à " + echappe(reglages.ville.trim()) : "") + ". Pas à un standard, pas à un robot.";
    interlocuteur.hidden = false;
  }
  const agenda = $("#agenda");
  if (agenda && /^https:\/\//.test(String(reglages.agenda || "").trim())) { $("a", agenda).href = reglages.agenda.trim(); agenda.hidden = false; }

  /* ---------- Données structurées : on ajoute ce qui est rempli dans reglages.js ---------- */
  const ld = $("#donnees-structurees");
  if (ld) {
    try {
      const d = JSON.parse(ld.textContent);
      d.email = reglages.email;
      if (rempli(reglages.telephone)) d.telephone = reglages.telephone.trim();
      if (rempli(reglages.adresse)) d.address = reglages.adresse.trim();
      if (rempli(reglages.zone)) d.areaServed = reglages.zone.trim();
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
      (rempli(r.corvee) ? '<p class="realisation-corvee"><s>' + echappe(r.corvee) + "</s></p>" : "") +
      (rempli(r.fait) ? "<p>" + echappe(r.fait) + "</p>" : "") +
      (rempli(r.resultat) ? "<blockquote>« " + echappe(r.resultat) + " »</blockquote>" : "") +
      (/^https?:\/\//.test(r.lien || "") ? '<p><a class="lien" href="' + echappe(r.lien) + '" rel="noopener">Voir</a></p>' : "") +
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

  /* ---------- Entrée du héros ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("charge")));

  /* ---------- Révéler un élément quand il arrive à l'écran ---------- */
  const reveler = (el, quand, seuil = .45) => {
    if (!el) return;
    if (calme || !observe) { quand(); return; }
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { quand(); io.disconnect(); }
    }, { threshold: seuil });
    io.observe(el);
  };
  $$(".a-reveler").forEach((el) => reveler(el, () => el.classList.add("vue"), .8));

  /* ---------- Le stylo qui raye ----------
     Le stylo suit la ligne (même sur plusieurs lignes à l'écran) pendant
     que le trait se dessine : les deux animations partagent le même minutage. */
  const ANGLE = "rotate(-36deg)";
  const fragments = (texte, conteneur) => {
    if (conteneur.classList.contains("cahier")) {
      // cahier pivoté : on reste dans son repère local (une seule ligne)
      return [{ x: texte.offsetLeft, y: texte.offsetTop + texte.offsetHeight * .6, l: texte.offsetWidth }];
    }
    const c = conteneur.getBoundingClientRect();
    return Array.from(texte.getClientRects()).filter((r) => r.width > 2).map((r) => ({
      x: r.left - c.left, y: r.top - c.top + r.height * .6, l: r.width
    }));
  };
  const rayer = (texte, stylo, conteneur) => {
    if (calme || !stylo || !texte.animate) { texte.classList.add("faite"); return Promise.resolve(); }
    const morceaux = fragments(texte, conteneur);
    const total = morceaux.reduce((s, m) => s + m.l, 0) || 1;
    const repos = getComputedStyle(stylo).transform;
    const epaisseur = getComputedStyle(texte).backgroundSize.split(" ")[1] || ".09em";
    const etapes = [{ d: 0, t: repos, p: 0 }];
    let fait = 0;
    morceaux.forEach((m, k) => {
      etapes.push({ d: k === 0 ? 420 : 260, t: `translate(${m.x}px, ${m.y}px) ${ANGLE}`, p: fait / total, e: "ease-in-out" });
      fait += m.l;
      etapes.push({ d: Math.max(220, m.l * 1.7), t: `translate(${m.x + m.l}px, ${m.y}px) ${ANGLE}`, p: fait / total, e: "linear" });
    });
    etapes.push({ d: 520, t: repos, p: 1, e: "ease-in-out" });
    const duree = etapes.reduce((s, e) => s + e.d, 0);
    let t = 0;
    const kStylo = [], kTrait = [];
    etapes.forEach((e, i) => {
      t += e.d;
      const suite = etapes[i + 1] ? etapes[i + 1].e : "linear";
      kStylo.push({ transform: e.t, offset: t / duree, easing: suite });
      kTrait.push({ backgroundSize: (e.p * 100).toFixed(2) + "% " + epaisseur, offset: t / duree, easing: suite === "linear" ? "linear" : "steps(1, end)" });
    });
    const aStylo = stylo.animate(kStylo, { duration: duree });
    const aTrait = texte.animate(kTrait, { duration: duree, fill: "forwards" });
    return aStylo.finished.then(() => { texte.classList.add("faite"); aTrait.cancel(); }, () => {});
  };

  /* ---------- Barre : filet au défilement, se cache en descendant ---------- */
  const barre = $("#barre"), nav = $("#nav"), boutonMenu = $("#bouton-menu");
  if (barre) {
    let dernier = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      barre.classList.toggle("defile", y > 8);
      const menuOuvert = nav && nav.classList.contains("ouverte");
      barre.classList.toggle("cachee", !menuOuvert && y > 480 && y > dernier + 4);
      if (y < dernier - 4 || y < 480) barre.classList.remove("cachee");
      dernier = y;
    }, { passive: true });
    barre.addEventListener("focusin", () => barre.classList.remove("cachee"));
  }

  /* ---------- Menu mobile ---------- */
  if (boutonMenu && nav) {
    const ouvrir = (o) => { boutonMenu.setAttribute("aria-expanded", String(o)); nav.classList.toggle("ouverte", o); };
    boutonMenu.addEventListener("click", () => ouvrir(boutonMenu.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) ouvrir(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("ouverte")) { ouvrir(false); boutonMenu.focus(); }
    });
  }

  /* ---------- Lien actif dans la navigation ---------- */
  if (nav && observe) {
    const liens = $$("a[href^='#']", nav);
    // Le héros est observé aussi : en haut de page, aucun lien n'est actif.
    const cibles = liens.map((a) => document.getElementById(a.hash.slice(1))).concat(document.getElementById("haut")).filter(Boolean);
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => {
        if (!en.isIntersecting) return;
        liens.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + en.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    cibles.forEach((c) => io.observe(c));
  }

  /* ---------- Scène du héros : la relance qui part seule ---------- */
  const scene = $("#scene");
  if (scene) {
    const ev = (n) => $$('.ev[data-etape="' + n + '"]', scene);
    const valider = $("#valider", scene), doigt = $("#doigt", scene);
    const rature = $("#rature-scene", scene), stylo = $("#stylo-scene", scene), cahier = $("#cahier-scene", scene);
    const boutonPause = $("#pause");
    const montre = (n) => () => ev(n).forEach((e) => e.classList.add("vu"));
    const etapes = [
      [500, montre(1)],
      [1500, montre(2)],
      [1500, () => { doigt.classList.remove("tape"); void doigt.offsetWidth; doigt.classList.add("tape"); }],
      [380, () => valider.classList.add("envoye")],
      [1200, montre(4)],
      [1300, montre(5)],
      [700, () => { rayer(rature, stylo, cahier); }],
      [4600, () => scene.classList.add("fin")],
      [700, () => {
        scene.classList.remove("fin");
        $$(".ev", scene).forEach((e) => e.classList.remove("vu"));
        valider.classList.remove("envoye");
        doigt.classList.remove("tape");
        rature.classList.remove("faite");
      }]
    ];
    let i = 0, minuteur = null, enPause = false, visible = true;

    const suivant = () => {
      clearTimeout(minuteur);
      if (enPause || !visible || document.hidden) return;
      minuteur = setTimeout(() => {
        etapes[i][1]();
        i = (i + 1) % etapes.length;
        suivant();
      }, etapes[i][0]);
    };

    if (calme) {
      [1, 2, 4, 5].forEach((n) => montre(n)());
      valider.classList.add("envoye");
      rature.classList.add("faite");
      if (boutonPause) boutonPause.hidden = true;
    } else {
      if (observe) new IntersectionObserver((e) => { visible = e[0].isIntersecting; suivant(); }, { threshold: .2 }).observe(scene);
      document.addEventListener("visibilitychange", suivant);
      if (boutonPause) {
        boutonPause.addEventListener("click", () => {
          enPause = !enPause;
          boutonPause.setAttribute("aria-pressed", String(enPause));
          $("span", boutonPause).textContent = enPause ? "Lecture" : "Pause";
          $("#pause-icone").setAttribute("d", enPause ? "M2 1l9 5-9 5z" : "M2 1h3v10H2zM7 1h3v10H7z");
          suivant();
        });
      }
      suivant();
    }
  }

  /* ---------- Le constat : le stylo raye les quatre lignes ---------- */
  const page = $("#page-cahier");
  if (page) {
    const stylo = $("#stylo-cahier", page);
    const poser = () => {
      // le stylo attend à plat en bas de la page, loin de l'annotation (à droite)
      const l = page.clientWidth, h = page.clientHeight;
      stylo.style.transform = `translate(${Math.round(l * .22)}px, ${h - 24}px) rotate(-4deg)`;
    };
    poser();
    window.addEventListener("resize", poser);
    reveler(page, async () => {
      for (const r of $$(".rature", page)) { await rayer(r, stylo, page); if (!calme) await attendre(120); }
      page.classList.add("vue");
    }, .5);
  }

  /* ---------- Méthode : la ligne se trace ---------- */
  const etapesMethode = $("#etapes");
  reveler(etapesMethode, () => etapesMethode.classList.add("vue"));

  /* ---------- Comment ça marche : onglets ---------- */
  const onglets = $$('#fonctionnement [role="tab"]');
  if (onglets.length) {
    const jouer = (panneau) => {
      const flux = $(".flux", panneau);
      if (!flux) return;
      $$("li", flux).forEach((li, k) => li.style.setProperty("--k", k));
      flux.classList.remove("joue"); void flux.offsetWidth; flux.classList.add("joue");
    };
    const activer = (o, focus) => {
      onglets.forEach((x) => {
        const actif = x === o;
        x.setAttribute("aria-selected", String(actif));
        x.tabIndex = actif ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).hidden = !actif;
      });
      if (focus) o.focus();
      jouer(document.getElementById(o.getAttribute("aria-controls")));
    };
    onglets.forEach((o, k) => {
      o.addEventListener("click", () => activer(o));
      o.addEventListener("keydown", (e) => {
        const pas = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (pas) { e.preventDefault(); activer(onglets[(k + pas + onglets.length) % onglets.length], true); }
        if (e.key === "Home") { e.preventDefault(); activer(onglets[0], true); }
        if (e.key === "End") { e.preventDefault(); activer(onglets[onglets.length - 1], true); }
      });
    });
    // Première apparition : les étapes arrivent une à une
    reveler($("#fonctionnement .flux-panneau:not([hidden])"), () => jouer($("#fonctionnement .flux-panneau:not([hidden])")), .3);
  }

  /* ---------- Théâtre de démos ---------- */
  const lecteur = $("#lecteur"), liste = $("#liste-demos"), notes = $("#notes");
  if (lecteur && liste && demos.length) {
    const idYoutube = (v) => { const m = String(v).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/); return m ? m[1] : String(v).trim(); };
    const aVideo = (d) => rempli(d.youtube) || rempli(d.fichier);
    const total = (d) => (d.plans || []).reduce((t, p) => t + (Number(p.s) || 0), 0);
    const frise = (d) => '<div class="frise" aria-hidden="true">' +
      (d.plans || []).map((p, k) => '<span style="--s:' + (Number(p.s) || 1) + ";--k:" + k + '"></span>').join("") + "</div>";
    const plans = (d) => '<ol class="plans">' +
      (d.plans || []).map((p) => "<li><span>" + echappe(p.texte) + '</span><span class="s">' + (Number(p.s) || 0) + " s</span></li>").join("") + "</ol>";

    liste.innerHTML = demos.map((d, k) =>
      '<li><button type="button" class="demo-choix" data-i="' + k + '" aria-pressed="false" aria-controls="lecteur">' +
      '<span class="t">' + echappe(d.titre) + "</span>" +
      '<span class="d">' + total(d) + " s</span>" +
      '<span class="e' + (aVideo(d) ? " dispo" : "") + '">' + (aVideo(d) ? "Vidéo disponible" : "En tournage") + "</span>" +
      "</button></li>"
    ).join("");

    const debout = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
    let courante = 0;
    const montrer = (k) => {
      const d = demos[k];
      courante = k;
      $$(".demo-choix", liste).forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
      if (rempli(d.youtube)) {
        // YouTube n'est contacté qu'au clic du visiteur (vie privée et vitesse).
        lecteur.className = "lecteur media";
        lecteur.innerHTML = '<div class="facade lecteur-contenu"><p class="facade-titre">' + echappe(d.titre) + "</p>" +
          '<button type="button" class="bouton bouton-plein" id="lire"><svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>Lire la vidéo (' + total(d) + " s)</button>" +
          '<p class="facade-note">Vidéo hébergée par YouTube, chargée seulement si vous la lancez.</p></div>';
        $("#lire", lecteur).addEventListener("click", () => {
          lecteur.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(idYoutube(d.youtube)) +
            '?rel=0&autoplay=1" title="' + echappe(d.titre) + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
        });
      } else if (rempli(d.fichier)) {
        // Téléphone tenu droit : la version verticale remplit l'écran au lieu d'une bande 16:9.
        const vertical = debout.matches && rempli(d.vertical);
        const fichier = vertical ? d.vertical : d.fichier;
        const image = vertical ? (d.afficheVerticale || "") : d.affiche;
        lecteur.className = "lecteur media" + (vertical ? " vertical" : "");
        // Avec une affiche, la vidéo n'est téléchargée qu'au clic sur Lecture.
        const affiche = rempli(image) ? ' poster="' + echappe(image) + '" preload="none"' : ' preload="metadata"';
        lecteur.innerHTML = '<video controls playsinline' + affiche + ' src="' + echappe(fichier) + '" aria-label="' + echappe(d.titre) + '"></video>';
        $("video", lecteur).addEventListener("play", () => suivre("Démo lue", { demo: d.id }), { once: true });
      } else {
        lecteur.className = "lecteur";
        lecteur.innerHTML = '<div class="affiche lecteur-contenu">' +
          '<p class="affiche-etat">En tournage</p>' +
          '<h3 class="titre-3">' + echappe(d.titre) + "</h3>" +
          '<p class="affiche-duree">' + echappe(d.sujet || "") + ", environ " + total(d) + " secondes. Voici le déroulé&nbsp;:</p>" +
          frise(d) + plans(d) + "</div>";
      }
      if (aVideo(d)) {
        notes.innerHTML = '<p class="t">' + echappe(d.titre) + '</p><p class="discret">Ce que montre la démo&nbsp;:</p>' + frise(d) + plans(d);
        notes.hidden = false;
      } else {
        notes.hidden = true;
      }
    };

    liste.addEventListener("click", (e) => {
      const b = e.target.closest(".demo-choix");
      if (!b) return;
      const k = Number(b.dataset.i);
      montrer(k);
      if (demos[k].id && history.replaceState) history.replaceState(null, "", "#demo-" + demos[k].id);
    });

    // Lien direct : onklaud.com/#demo-relances
    const depuisAdresse = () => {
      const m = location.hash.match(/^#demo-([\w-]+)$/);
      // Les anciens liens déjà envoyés (champ alias) mènent à la bonne démo.
      const k = m ? demos.findIndex((d) => d.id === m[1] || (d.alias || []).includes(m[1])) : -1;
      if (k < 0) return false;
      montrer(k);
      $("#demos").scrollIntoView();
      return true;
    };
    window.addEventListener("hashchange", depuisAdresse);
    if (!depuisAdresse()) montrer(0);
    // On tourne le téléphone : on recharge la bonne version, sauf si la vidéo est en cours.
    const changer = () => { const v = $("video", lecteur); if (!v || v.paused) montrer(courante); };
    if (debout.addEventListener) debout.addEventListener("change", changer);
  }

  /* ---------- Sujet prérempli depuis les offres ---------- */
  $$("[data-sujet]").forEach((a) => a.addEventListener("click", () => {
    const radio = $('input[name="sujet"][value="' + a.dataset.sujet + '"]');
    if (radio) radio.checked = true;
  }));

  /* ---------- Formulaire → messagerie ---------- */
  const formulaire = $("#formulaire");
  if (formulaire) {
    const confirmation = $("#confirmation"), copie = $("#copie");
    const envoyer = $('button[type="submit"]', formulaire), libelleBouton = envoyer.innerHTML;
    const email = $("#f-email"), telephone = $("#f-tel");
    let message = "";
    // Email ou téléphone : l'un des deux suffit.
    [email, telephone].forEach((c) => c.addEventListener("input", () => email.setCustomValidity("")));

    const confirmer = (etat) => {
      $(".etat-envoye", confirmation).hidden = etat !== "envoye";
      $(".etat-messagerie", confirmation).hidden = etat === "envoye";
      copie.textContent = "";
      confirmation.hidden = false;
      confirmation.classList.remove("visible"); void confirmation.offsetWidth; confirmation.classList.add("visible");
      confirmation.focus();
    };

    // Envoi direct (api/diagnostic.js). Faux si la fonction n'existe pas ou ne répond pas.
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
        email.setCustomValidity("Indiquez un email ou un téléphone, pour qu’on puisse vous répondre.");
        email.reportValidity();
        return;
      }
      const sujet = $('input[name="sujet"]:checked', formulaire);
      const libelle = sujet ? sujet.nextElementSibling.textContent : "";
      const objet = "Diagnostic — " + v("commerce");
      const corps = [
        "Bonjour,", "",
        "Je souhaite un diagnostic gratuit de 20 minutes.", "",
        "Prénom : " + v("prenom"),
        "Commerce : " + v("commerce"),
        "Email : " + v("email"),
        "Téléphone : " + v("telephone"),
        "Sujet : " + libelle, "",
        "En une phrase : " + v("phrase")
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
        suivre("Diagnostic demandé", { sujet: libelle, voie: "direct" });
        confirmer("envoye");
        return;
      }
      // Secours : la messagerie du visiteur, avec le message prêt.
      suivre("Diagnostic demandé", { sujet: libelle, voie: "messagerie" });
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
        try { document.execCommand("copy"); ok(); } catch (_) { copie.textContent = "Copie impossible : sélectionnez le texte à la main."; }
        t.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(message).then(ok, secours);
      else secours();
    });
  }

  /* ---------- Mobile : le bouton du diagnostic reste à portée de pouce ----------
     Visible une fois le héros passé, masqué quand le formulaire ou le pied de page est à l'écran. */
  const cta = $("#cta-mobile");
  if (cta && observe) {
    const vus = new Set();
    const maj = () => {
      const montrer = !vus.has("haut") && !vus.has("diagnostic") && !vus.has("pied") && !(nav && nav.classList.contains("ouverte"));
      cta.classList.toggle("visible", montrer);
      cta.setAttribute("aria-hidden", String(!montrer));
      cta.tabIndex = montrer ? 0 : -1;
    };
    const io = new IntersectionObserver((entrees) => {
      entrees.forEach((en) => { const k = en.target.dataset.cta; if (en.isIntersecting) vus.add(k); else vus.delete(k); });
      maj();
    });
    [["haut", $("#haut")], ["diagnostic", $("#diagnostic")], ["pied", $(".pied")]].forEach(([k, el]) => {
      if (el) { el.dataset.cta = k; io.observe(el); }
    });
    if (boutonMenu) boutonMenu.addEventListener("click", maj);
  }
})();
