/* ================================================================
   ONKLAUD : utilitaires communs des outils (objet global Onk)
   - stockage local (ignoré en mode film)
   - formats français : euros, dates, heures, typographie
   - CSV (lecture/écriture), téléchargement, liens mailto / wa.me / sms:
   - sélecteur « moteur local / agent Claude » et appel de /api/agent
   - horloge du mode film : window.film = { duree, vue, etapes, seek, pointeur }
   ================================================================ */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const FILM = params.has("film");
  if (FILM) document.documentElement.classList.add("film");

  const NBSP = " ";
  const Onk = { FILM, NBSP, params };

  /* ---------- Texte ---------- */
  Onk.esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  // Typographie française : espace insécable avant : ; ? ! » et après «
  Onk.typo = (s) => String(s == null ? "" : s)
    .replace(/ ([:;?!»])/g, NBSP + "$1")
    .replace(/« /g, "«" + NBSP);

  // Minuscules sans accents, ponctuation réduite à des espaces
  Onk.normaliser = (s) => String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe").replace(/æ/g, "ae")
    .replace(/[’']/g, " ").replace(/[^a-z0-9²×,.\/\s-]/g, " ")
    .replace(/\s+/g, " ").trim();

  // Petit hachage stable (choix déterministe d'une tournure)
  Onk.hachage = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  Onk.id = (prefixe = "x") => prefixe + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  Onk.copie = (o) => JSON.parse(JSON.stringify(o));
  Onk.pluriel = (n, un, plusieurs) => (Math.abs(n) >= 2 ? plusieurs : un);

  /* ---------- Nombres et euros ---------- */
  const fmt = (opt) => new Intl.NumberFormat("fr-FR", opt);
  const fEuro = fmt({ style: "currency", currency: "EUR" });
  const fEuroRond = fmt({ style: "currency", currency: "EUR", maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const fNombre = fmt({ maximumFractionDigits: 2 });
  // Bricolage n'a pas l'espace fine (U+202F) : on la remplace par une insécable
  const sansFine = (s) => s.replace(/[  ]/g, NBSP);
  Onk.euros = (n, centimes = true) => sansFine((centimes ? fEuro : fEuroRond).format(Number(n) || 0));
  Onk.nombre = (n) => sansFine(fNombre.format(Number(n) || 0));
  Onk.arrondi = (n) => Math.round((Number(n) || 0) * 100) / 100;

  // « 1 250,50 € » → 1250.5 ; « 1,250.50 » → 1250.5 ; vide → NaN
  Onk.lireNombre = (s) => {
    if (typeof s === "number") return s;
    let t = String(s || "").replace(/[\s  €]/g, "").replace(/eur(os)?$/i, "");
    if (!t) return NaN;
    const v = t.lastIndexOf(","), p = t.lastIndexOf(".");
    if (v > -1 && p > -1) t = v > p ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    else if (v > -1) t = t.replace(",", ".");
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : NaN;
  };

  /* ---------- Dates (chaînes « AAAA-MM-JJ », sans fuseau) ---------- */
  const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  Onk.JOURS = JOURS; Onk.MOIS = MOIS;
  const deux = (n) => String(n).padStart(2, "0");
  Onk.iso = (d) => d.getFullYear() + "-" + deux(d.getMonth() + 1) + "-" + deux(d.getDate());
  Onk.versDate = (iso) => { const [a, m, j] = String(iso).split("-").map(Number); return new Date(a, m - 1, j); };
  const utc = (iso) => { const [a, m, j] = String(iso).split("-").map(Number); return Date.UTC(a, m - 1, j); };
  Onk.ajouterJours = (iso, n) => { const d = Onk.versDate(iso); d.setDate(d.getDate() + n); return Onk.iso(d); };
  Onk.ecartJours = (de, a) => Math.round((utc(a) - utc(de)) / 864e5);
  Onk.jourSemaine = (iso) => JOURS[Onk.versDate(iso).getDay()];
  Onk.dateLongue = (iso) => { const d = Onk.versDate(iso); return JOURS[d.getDay()] + " " + (d.getDate() === 1 ? "1er" : d.getDate()) + " " + MOIS[d.getMonth()]; };
  Onk.dateMoyenne = (iso) => { const d = Onk.versDate(iso); return d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear(); };
  Onk.dateCourte = (iso) => { const d = Onk.versDate(iso); return d.getDate() + " " + MOIS_COURTS[d.getMonth()]; };
  Onk.dateNum = (iso) => { const d = Onk.versDate(iso); return deux(d.getDate()) + "/" + deux(d.getMonth() + 1) + "/" + d.getFullYear(); };
  Onk.majuscule = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  // Date fixe du mode film : lundi 12 octobre 2026, 9 h
  Onk.DATE_FILM = "2026-10-12";
  Onk.aujourdhui = () => (FILM ? Onk.DATE_FILM : Onk.iso(new Date()));
  Onk.maintenant = () => { if (FILM) return "09:00"; const d = new Date(); return deux(d.getHours()) + ":" + deux(d.getMinutes()); };

  // « 09:30 » → « 9 h 30 », « 12:00 » → « 12 h »
  Onk.heure = (hm) => {
    if (!hm) return "";
    const [h, m] = String(hm).split(":").map(Number);
    return h + NBSP + "h" + (m ? NBSP + deux(m) : "");
  };
  Onk.minutes = (hm) => { const [h, m] = String(hm).split(":").map(Number); return h * 60 + (m || 0); };
  Onk.hm = (min) => deux(Math.floor(min / 60)) + ":" + deux(min % 60);

  // « 12/10/2026 », « 12/10/26 », « 2026-10-12 », « 12.10.2026 » → ISO ; sinon ""
  Onk.lireDate = (s) => {
    const t = String(s || "").trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return m[1] + "-" + deux(m[2]) + "-" + deux(m[3]);
    m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
    if (m) { const a = m[3].length === 2 ? "20" + m[3] : m[3]; return a + "-" + deux(m[2]) + "-" + deux(m[1]); }
    return "";
  };

  /* ---------- Téléphone ---------- */
  Onk.telChiffres = (tel) => String(tel || "").replace(/[^\d+]/g, "");
  // 06 12 34 56 78 → 33612345678 (format wa.me)
  Onk.telInter = (tel) => {
    let t = Onk.telChiffres(tel).replace(/^\+/, "");
    if (/^0\d{9}$/.test(t)) t = "33" + t.slice(1);
    if (/^0033/.test(t)) t = t.slice(2);
    return t;
  };
  Onk.telAffiche = (tel) => {
    let t = Onk.telChiffres(tel);
    if (/^\+33\d{9}$/.test(t)) t = "0" + t.slice(3);
    if (/^0\d{9}$/.test(t)) return t.replace(/(\d{2})(?=\d)/g, "$1" + NBSP);
    return String(tel || "");
  };
  Onk.telValide = (tel) => /^(\+?\d{10,15}|0\d{9})$/.test(Onk.telChiffres(tel));

  /* ---------- Liens d'envoi (toujours après validation) ---------- */
  Onk.liens = {
    mailto: (email, sujet, corps) => "mailto:" + encodeURIComponent(email || "").replace(/%40/g, "@") +
      "?subject=" + encodeURIComponent(sujet || "") + "&body=" + encodeURIComponent(corps || ""),
    whatsapp: (tel, texte) => "https://wa.me/" + (tel ? Onk.telInter(tel) : "") + "?text=" + encodeURIComponent(texte || ""),
    sms: (tel, texte) => "sms:" + (tel ? "+" + Onk.telInter(tel) : "") + "?&body=" + encodeURIComponent(texte || "")
  };
  Onk.ouvrirLien = (url) => {
    if (FILM) return;
    const a = document.createElement("a");
    a.href = url;
    if (/^https?:/.test(url)) { a.target = "_blank"; a.rel = "noopener"; }
    document.body.appendChild(a); a.click(); a.remove();
  };
  Onk.copier = async (texte) => {
    try { await navigator.clipboard.writeText(texte); return true; }
    catch (e) {
      const z = document.createElement("textarea"); z.value = texte; z.style.position = "fixed"; z.style.opacity = "0";
      document.body.appendChild(z); z.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      z.remove(); return ok;
    }
  };

  /* ---------- Stockage local ---------- */
  Onk.stock = {
    lire(cle, defaut) {
      if (FILM) return defaut;
      try { const v = localStorage.getItem("onklaud." + cle); return v == null ? defaut : JSON.parse(v); }
      catch (e) { return defaut; }
    },
    ecrire(cle, valeur) {
      if (FILM) return true;
      try { localStorage.setItem("onklaud." + cle, JSON.stringify(valeur)); return true; }
      catch (e) { Onk.toast("Enregistrement impossible sur ce navigateur (mode privé ?). Pensez à exporter vos données."); return false; }
    },
    effacer(cle) { if (!FILM) try { localStorage.removeItem("onklaud." + cle); } catch (e) { /* rien */ } }
  };

  /* ---------- Fichiers ---------- */
  Onk.telecharger = (nom, contenu, type = "text/plain;charset=utf-8") => {
    if (FILM) return;
    const bom = /csv/.test(type) ? "﻿" : "";
    const url = URL.createObjectURL(new Blob([bom + contenu], { type }));
    const a = document.createElement("a"); a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  Onk.choisirFichier = (accept) => new Promise((ok) => {
    const i = document.createElement("input"); i.type = "file"; i.accept = accept || "";
    i.addEventListener("change", async () => { const f = i.files && i.files[0]; ok(f ? { nom: f.name, texte: await f.text() } : null); });
    i.click();
  });
  Onk.horodatage = () => { const d = new Date(); return Onk.iso(d) + "-" + deux(d.getHours()) + deux(d.getMinutes()); };

  /* ---------- CSV (séparateur ; , ou tabulation, guillemets) ---------- */
  Onk.csv = {
    lire(texte) {
      const t = String(texte || "").replace(/^﻿/, "");
      const premiere = t.split(/\r?\n/)[0] || "";
      const compte = (c) => premiere.split(c).length - 1;
      const sep = [";", "\t", ","].sort((a, b) => compte(b) - compte(a))[0];
      const lignes = []; let ligne = [], champ = "", guill = false;
      for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (guill) {
          if (c === '"') { if (t[i + 1] === '"') { champ += '"'; i++; } else guill = false; }
          else champ += c;
        } else if (c === '"') guill = true;
        else if (c === sep) { ligne.push(champ); champ = ""; }
        else if (c === "\n" || c === "\r") {
          if (c === "\r" && t[i + 1] === "\n") i++;
          ligne.push(champ); champ = "";
          if (ligne.some((x) => x.trim() !== "")) lignes.push(ligne);
          ligne = [];
        } else champ += c;
      }
      ligne.push(champ);
      if (ligne.some((x) => x.trim() !== "")) lignes.push(ligne);
      return lignes;
    },
    // Lignes → objets, avec des en-têtes normalisés (« Date d'envoi » → « date d envoi »)
    objets(texte) {
      const l = Onk.csv.lire(texte);
      if (l.length < 2) return [];
      const tetes = l[0].map((h) => Onk.normaliser(h));
      return l.slice(1).map((r) => Object.fromEntries(tetes.map((h, i) => [h, (r[i] || "").trim()])));
    },
    ecrire(colonnes, lignes) {
      const cell = (v) => { const s = String(v == null ? "" : v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      return [colonnes.map((c) => cell(c.titre)).join(";")]
        .concat(lignes.map((o) => colonnes.map((c) => cell(typeof c.val === "function" ? c.val(o) : o[c.cle])).join(";")))
        .join("\r\n");
    }
  };
  // Cherche la valeur d'une colonne parmi plusieurs noms possibles
  Onk.colonne = (obj, ...noms) => {
    for (const n of noms) { const k = Object.keys(obj).find((c) => c === n || c.startsWith(n)); if (k && obj[k] !== "") return obj[k]; }
    return "";
  };

  /* ---------- Message court (toast) ---------- */
  let zoneToast = null, minuteurToast = 0;
  Onk.toast = (msg, duree = 4200) => {
    if (FILM) return;
    if (!zoneToast) {
      zoneToast = document.createElement("div"); zoneToast.className = "toast-zone";
      zoneToast.innerHTML = '<div class="toast" role="status" aria-live="polite"></div>';
      document.body.appendChild(zoneToast);
    }
    const t = zoneToast.firstChild;
    t.textContent = Onk.typo(msg);
    t.classList.add("visible");
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(() => t.classList.remove("visible"), duree);
  };

  /* ---------- Logo ---------- */
  Onk.COCHE_SVG = '<svg class="coche" viewBox="0 0 30 24" aria-hidden="true"><path pathLength="1" d="M3 13.5c2.6 1.8 4.4 4.3 6 7.5C13 12 19.5 5.5 27.5 2.5" fill="none" stroke="#2337a8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- Moteur : local (par défaut, gratuit) ou agent Claude ---------- */
  let etatServeur = null;
  Onk.etatServeur = async () => {
    if (FILM) return { agent: false, telephonie: false, hors_ligne: true };
    if (etatServeur) return etatServeur;
    // le serveur des outils (serveur/serveur.js) pose ce cookie : sans lui, pas d'appel réseau inutile
    if (!/(^|;\s*)onklaud-serveur=1/.test(document.cookie)) { etatServeur = { agent: false, hors_ligne: true }; return etatServeur; }
    try {
      const r = await fetch("/api/etat", { cache: "no-store" });
      etatServeur = r.ok ? await r.json() : { agent: false, hors_ligne: true };
    } catch (e) { etatServeur = { agent: false, hors_ligne: true }; }
    return etatServeur;
  };
  Onk.moteur = {
    valeur() { return Onk.stock.lire("moteur", "local"); },
    installer(conteneur) {
      if (!conteneur) return;
      conteneur.innerHTML = '<label class="moteur"><span class="moteur-libelle">Moteur</span>' +
        '<select aria-label="Moteur de lecture"><option value="local">moteur local</option><option value="claude">agent Claude</option></select></label>';
      const sel = conteneur.querySelector("select");
      sel.value = Onk.moteur.valeur();
      if (FILM) { sel.value = "local"; sel.disabled = true; return; }
      sel.addEventListener("change", async () => {
        if (sel.value === "claude") {
          const e = await Onk.etatServeur();
          if (!e.agent) {
            sel.value = "local";
            Onk.toast(e.hors_ligne
              ? "Agent Claude indisponible : lancez les outils avec lancer.cmd (serveur local). Le moteur local reste actif."
              : "Agent Claude indisponible : aucune clé ANTHROPIC_API_KEY sur le serveur. Le moteur local reste actif.", 6500);
          }
        }
        Onk.stock.ecrire("moteur", sel.value);
      });
    }
  };
  // Appelle l'agent Claude du serveur. Lève une erreur si indisponible (l'outil bascule alors sur le moteur local).
  Onk.agent = async (outil, charge) => {
    if (FILM) throw new Error("film");
    const r = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ outil }, charge)) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || "Agent indisponible (" + r.status + ")");
    return j;
  };

  /* ---------- Mode film ---------- */
  const borne = (x) => Math.max(0, Math.min(1, x));
  const doux = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  Onk.film = {
    actif: FILM,
    borne, doux,
    // avancement 0 → 1 entre a et b
    prog: (t, a, b) => borne((t - a) / (b - a)),
    // texte tapé lettre à lettre à partir de « debut », « cps » caractères par seconde
    tape: (texte, t, debut, cps = 16) => (t <= debut ? "" : texte.slice(0, Math.floor((t - debut) * cps))),
    // valeur qui compte de « de » à « a » entre t0 et t1
    compte: (de, a, t, t0, t1) => de + (a - de) * doux(borne((t - t0) / (t1 - t0))),

    /* Installe window.film.
       gestes : [{ t, cible: "sélecteur" | {x, y} | null, appui: true|false, dx, dy, trajet }]
       - la position d'une cible est mesurée dans l'état de l'outil juste avant t (seek(t - 0,05)) ;
       - le pointeur glisse vers la cible suivante pendant « trajet » secondes (0,7 par défaut) ;
       - appui : vrai pendant 0,25 s à partir de t. */
    installer({ duree, vue, etapes, rendre, gestes = [] }) {
      let dernier = null, cache = null, cleCache = "";
      const seek = (t) => {
        t = Math.max(0, Math.min(duree, Number(t) || 0));
        document.querySelectorAll(".appuye").forEach((el) => el.classList.remove("appuye"));
        rendre(t);
        dernier = t;
        // le bouton touché s'enfonce pendant l'appui
        for (const g of gestes) {
          if (g.appui && typeof g.cible === "string" && t >= g.t && t - g.t < 0.25) {
            const el = document.querySelector(g.cible);
            if (el) el.classList.add("appuye");
          }
        }
      };
      const positions = () => {
        const cle = innerWidth + "x" + innerHeight + ":" + document.fonts.status;
        if (cache && cle === cleCache) return cache;
        const garde = dernier;
        cache = gestes.map((g) => {
          if (!g.cible) return null;
          if (typeof g.cible === "object") return { x: g.cible.x, y: g.cible.y };
          seek(Math.max(0, g.t - 0.05));
          const el = document.querySelector(g.cible);
          if (!el) { console.warn("film : cible introuvable", g.cible, g.t); return null; }
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.left + r.width * (g.dx == null ? .5 : g.dx)), y: Math.round(r.top + r.height * (g.dy == null ? .5 : g.dy)) };
        });
        cleCache = cle;
        seek(garde == null ? 0 : garde);
        return cache;
      };
      const pointeur = (t) => {
        t = Number(t) || 0;
        const pos = positions();
        let i = -1;
        for (let k = 0; k < gestes.length; k++) if (gestes[k].t <= t) i = k;
        const suiv = gestes[i + 1];
        if (suiv && pos[i + 1] && i >= 0 && pos[i]) {
          const trajet = suiv.trajet || 0.7;
          if (t > suiv.t - trajet) {
            const k = doux(borne((t - (suiv.t - trajet)) / trajet));
            return { x: Math.round(pos[i].x + (pos[i + 1].x - pos[i].x) * k), y: Math.round(pos[i].y + (pos[i + 1].y - pos[i].y) * k), appui: false };
          }
        }
        if (i < 0 || !pos[i]) return null;
        const g = gestes[i];
        return { x: pos[i].x, y: pos[i].y, appui: !!g.appui && t - g.t < 0.25 };
      };
      if (document.fonts) document.fonts.ready.then(() => { cache = null; if (dernier != null) seek(dernier); });
      window.film = { duree, vue, etapes, seek, pointeur };
      seek(0);
      return window.film;
    }
  };

  window.Onk = Onk;
})();
