/* Socle des démos Onklaud : données partagées entre écrans, en direct.
   Deux onglets (ou deux cadres) de la même démo restent synchronisés.
   Rien ne quitte l'appareil du visiteur. */
(function () {
  "use strict";

  /* Démo à votre nom : ?nom=Plomberie Durand, gardé pendant la visite. */
  const lirePerso = () => {
    const v = (new URLSearchParams(location.search).get("nom") || "").trim().slice(0, 40);
    try {
      if (v) sessionStorage.setItem("onklaud-perso", v);
      return v || sessionStorage.getItem("onklaud-perso") || "";
    } catch (e) { return v; }
  };
  const PERSO = lirePerso();
  const glisser = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const Magasin = (cle, depart, apresMaj) => {
    const nom = "onklaud-demo-" + cle + (PERSO ? "-" + glisser(PERSO) : "");
    const canal = "BroadcastChannel" in window ? new BroadcastChannel(nom) : null;
    const abonnes = [];
    const neuf = () => { const d = depart(); d.__jour = Outils.jour(); return d; };
    /* Une démo repart chaque jour de données fraîches : ses dates restent justes. */
    const lire = () => {
      try { const v = JSON.parse(localStorage.getItem(nom)); if (v && v.__jour === Outils.jour()) return v; } catch (e) { /* stockage indisponible */ }
      return null;
    };
    const ecrire = (d) => {
      try { localStorage.setItem(nom, JSON.stringify(d)); return true; } catch (e) { return false; }
    };
    const m = { d: lire() || neuf() };
    const prevenir = () => abonnes.forEach((f) => f(m.d));
    m.surChange = (f) => { abonnes.push(f); return m; };
    m.maj = (f) => {
      f(m.d);
      if (apresMaj) apresMaj(m.d);
      const ok = ecrire(m.d);
      if (ok && canal) canal.postMessage("maj");
      prevenir();
      return ok;
    };
    m.recommencer = () => {
      m.d = neuf();
      if (apresMaj) apresMaj(m.d);
      ecrire(m.d);
      if (canal) canal.postMessage("maj");
      prevenir();
    };
    const recharger = () => { const v = lire(); if (v) { m.d = v; prevenir(); } };
    if (canal) canal.onmessage = recharger;
    window.addEventListener("storage", (e) => { if (e.key === nom) recharger(); });
    if (apresMaj) apresMaj(m.d);
    ecrire(m.d);
    return m;
  };

  const Outils = {
    perso: PERSO,
    marque: (defaut) => PERSO || defaut,
    initiales: (defaut) => {
      if (!PERSO) return defaut;
      const mots = PERSO.split(/[\s'’-]+/).filter((m) => m.length > 2);
      return ((mots[0] || PERSO)[0] + ((mots[1] || "")[0] || "")).toUpperCase();
    },
    id: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    eur: (n, c = 2) => (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: c, maximumFractionDigits: c }).replace(/ /g, " ") + " €",
    iso: (d) => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); },
    jour: (dec = 0, base = new Date()) => { const d = new Date(base); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + dec); return Outils.iso(d); },
    lundi: (base = new Date()) => { const d = new Date(base); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; },
    dateCourte: (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    dateLongue: (iso) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    heure: (h) => { const m = Math.round((h % 1) * 60); return Math.floor(h) + " h" + (m ? " " + String(m).padStart(2, "0") : ""); },
    maintenant: () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h "),
    /* Réduit une photo avant de la garder sur l'appareil. */
    photo: (fichier, cote = 900) => new Promise((ok, non) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, cote / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        ok(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = non;
      img.src = URL.createObjectURL(fichier);
    })
  };

  /* Bandeau de démo : discret, masqué dans les cadres et les films. */
  const bandeau = (m, retour = "../", conseil = "") => {
    document.querySelectorAll("[data-marque]").forEach((el) => { el.textContent = Outils.marque(el.textContent); });
    document.querySelectorAll("[data-initiales]").forEach((el) => { el.textContent = Outils.initiales(el.textContent); });
    if (PERSO) { document.title = PERSO + " · Démo Onklaud"; document.querySelectorAll("[data-perso-masque]").forEach((el) => { el.hidden = true; }); }
    const p = new URLSearchParams(location.search);
    if (p.has("cadre")) { document.documentElement.classList.add("en-cadre"); return; }
    const b = document.createElement("div");
    b.className = "bandeau-demo";
    b.innerHTML = '<span>' + (PERSO ? "Démo préparée pour " + Outils.esc(PERSO) : "Démo Onklaud<em>, données fictives</em>") + "</span>" + '<button type="button">Recommencer</button><a href="' + retour + '">Les démos</a>';
    b.querySelector("button").addEventListener("click", () => m.recommencer());
    document.body.prepend(b);
    if (conseil) {
      const g = document.createElement("div");
      g.className = "conseil-demo";
      g.innerHTML = "<p><b>À essayer&nbsp;:</b> " + conseil + '</p><button type="button" aria-label="Masquer le conseil">×</button>';
      g.querySelector("button").addEventListener("click", () => g.remove());
      b.after(g);
    }
  };

  window.Magasin = Magasin;
  window.Outils = Outils;
  window.bandeauDemo = bandeau;
})();
