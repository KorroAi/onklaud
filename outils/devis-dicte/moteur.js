/* ================================================================
   LE DEVIS DICTÉ : moteur local (règles + catalogue de prix)
   Une dictée (« Dépose de la baignoire. Receveur de 90 avec paroi fixe… »)
   devient des lignes de devis tirées du catalogue de l'artisan.
   Règle d'or : un prix n'est jamais inventé. Ce qui n'est pas au
   catalogue devient une ligne « à chiffrer » ; ce qui est flou est signalé.
   ================================================================ */
(function () {
  "use strict";

  const sansAccents = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/œ/g, "oe").replace(/æ/g, "ae");
  const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50 };
  const VIDES = new Set(["voila", "c est tout", "c est bon", "merci", "bon", "alors", "euh", "ok", "fin", "et voila", "voila c est tout", "donc", "bref"]);
  const MOTS_PIECE = /\b(salle de bain|salle d eau|piece|cuisine|toilettes|chambre|sejour|buanderie)\b/;

  // Texte → mots normalisés (« 6 mètres carrés » → « 6 m2 », « 2,5 » → « 2.5 »)
  function preparer(s) {
    return " " + sansAccents(s).toLowerCase()
      .replace(/m²/g, " m2 ")
      .replace(/(\d),(\d)/g, "$1.$2")
      .replace(/\bmetres? carres?\b|\bm carres?\b|\bmetre carre\b/g, " m2 ")
      .replace(/\bmetres? lineaires?\b|\bml\b/g, " ml ")
      .replace(/\bheures?\b/g, " h ")
      .replace(/\bm 2\b/g, " m2 ")
      .replace(/(\d)\s*(m2|ml)\b/g, "$1 $2")
      .replace(/(\d)\s*x\s*(\d)/g, "$1x$2")
      .replace(/[’']/g, " ")
      .replace(/[^a-z0-9.x\s]/g, " ")
      .replace(/\s+/g, " ") + " ";
  }
  const mots = (s) => preparer(s).trim().split(" ").filter(Boolean);
  // pluriel simple : « receveurs » → « receveur »
  const racine = (m) => (m.length > 3 && /s$/.test(m) && !/ss$/.test(m) ? m.slice(0, -1) : m);
  const estNombre = (m) => /^\d+(\.\d+)?$/.test(m);
  const valeur = (m) => (estNombre(m) ? parseFloat(m) : NOMBRES[m] != null ? NOMBRES[m] : null);

  function indexer(catalogue) {
    const idx = [];
    for (const a of catalogue) {
      const formes = new Set([a.designation].concat(a.synonymes || []).map((s) => mots(s).map(racine).join(" ")).filter(Boolean));
      for (const f of formes) idx.push({ mots: f.split(" "), article: a });
    }
    return idx.sort((x, y) => y.mots.length - x.mots.length);
  }

  // Cherche l'article dont un synonyme apparaît dans le segment (le plus long gagne)
  function chercher(w, idx) {
    const r = w.map(racine);
    for (const e of idx) {
      for (let i = 0; i + e.mots.length <= r.length; i++) {
        if (e.mots.every((m, k) => r[i + k] === m)) return { article: e.article, debut: i, fin: i + e.mots.length };
      }
    }
    return null;
  }

  function quantite(w, trouve) {
    const libres = w.map((m, i) => (trouve && i >= trouve.debut && i < trouve.fin ? null : m));
    // nombre + unité (m2, ml, h)
    for (let i = 0; i < libres.length - 1; i++) {
      if (libres[i] != null && valeur(libres[i]) != null && ["m2", "ml", "h"].includes(libres[i + 1])) return { qte: valeur(libres[i]), unite: libres[i + 1] === "m2" ? "m²" : libres[i + 1] };
    }
    // nombre juste avant l'article (« deux receveurs », « 3 x ») ou « x 2 » juste après
    if (trouve) {
      let j = trouve.debut - 1;
      if (w[j] === "x" || w[j] === "de" || w[j] === "d") j--;
      if (j >= 0 && valeur(w[j]) != null) return { qte: valeur(w[j]), unite: null, compte: true };
      const apres = w[trouve.fin];
      if (/^x\d+$/.test(apres || "")) return { qte: parseInt(apres.slice(1), 10), unite: null, compte: true };
    }
    return { qte: null, unite: null };
  }

  function nettoyer(s) {
    let t = String(s).trim().replace(/^[,;:.\s]+|[,;:.\s]+$/g, "");
    const re = /^(et|puis|plus|aussi|ensuite|alors|donc|on met|on pose|on fait|on change|il faut|il y a|faut|pose d['’]|pose de|poser|mettre|un|une|des|le|la|les|l['’]|du|de la|de l['’]|d['’])\s*/i;
    for (let k = 0; k < 6; k++) t = t.replace(re, "");
    // la quantité dite reste dans la colonne quantité, pas dans la désignation
    t = t.replace(/[\s,]*(sur|environ)?\s*\d+([.,]\d+)?\s*(m(è|e)tres?\s+(carr(é|e)s?|lin(é|e)aires?)|m²|m2|ml|heures?|h)\s*$/i, "").trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  }

  function lire(texte, catalogue) {
    const idx = indexer(catalogue);
    const etapes = [], lignes = [];
    let client = "", surface = null, piece = "";

    const civ = String(texte).match(/\b(?:[Cc]hez|[Pp]our|[Cc]liente?)\s+((?:Mme|Madame|M\.|Monsieur|Mlle)\s+[A-ZÀ-Üa-zà-ÿ-]+|[A-ZÀ-Ü][a-zà-ÿ-]+)/);
    if (civ) client = civ[1].replace(/^madame\b/i, "Mme").replace(/^monsieur\b/i, "M.");

    // « M. Martin » : le point de l'abréviation ne coupe pas la phrase
    const protege = String(texte).replace(/\b(M|Mme|Mlle|Dr|St)\.\s/g, "$1§ ");
    const phrases = protege.split(/[.;!?\n]+/).map((p) => p.replace(/§/g, ".").trim()).filter(Boolean);
    const parPhrase = [];
    let nbMorceaux = 0;
    for (const p of phrases) {
      const wp = mots(p);
      // la pièce et sa surface (« salle de bain, 6 m² ») : du contexte, pas une ligne
      if (MOTS_PIECE.test(preparer(p)) && !chercher(wp, idx)) {
        const q = quantite(wp, null);
        if (q.qte != null && q.unite === "m²") surface = q.qte;
        piece = (preparer(p).match(MOTS_PIECE) || [])[1] || piece;
        continue;
      }
      // la phrase qui nomme le client (« Pour M. Martin ») : du contexte aussi
      if (civ && p.includes(civ[1]) && !chercher(wp, idx)) continue;
      const morceaux = p.split(/,|\s(?:et|puis|plus|avec|ainsi que|aussi)\s/i).map((m) => m.trim()).filter(Boolean);
      nbMorceaux += morceaux.length;
      parPhrase.push(morceaux);
    }
    etapes.push({ type: "lit", texte: "Découpe la dictée : " + nbMorceaux + " " + (nbMorceaux > 1 ? "demandes" : "demande") });
    if (client) etapes.push({ type: "verifie", texte: "Client : " + client });
    if (surface != null) etapes.push({ type: "verifie", texte: "Surface de la pièce : " + surface + " m²" });

    for (const morceaux of parPhrase) {
      const dansPhrase = [];
      for (const texteSeg of morceaux) {
        const norm = preparer(texteSeg).trim();
        const w = norm.split(" ").filter(Boolean);
        if (!w.length || VIDES.has(norm)) continue;
        const trouve = chercher(w, idx);
        const q = quantite(w, trouve);
        const approx = /\b(environ|a peu pres|a vue de nez|grosso modo)\b/.test(norm);
        const precedente = dansPhrase[dansPhrase.length - 1];

        if (!trouve) {
          // une quantité seule complète la ligne précédente (« dépose de la faïence, 12 m² »)
          const reste = w.filter((m) => !["m2", "ml", "h", "sur", "environ", "a", "peu", "pres", "de", "d", "pour", "en", "tout"].includes(m) && valeur(m) == null);
          if (q.qte != null && !reste.length && precedente) {
            precedente.qte = q.qte;
            if (q.unite && precedente.unite !== q.unite && precedente.unite !== "forfait") precedente.doute = "Unité dite : " + q.unite + ", catalogue : " + precedente.unite;
            else if (precedente.doute && /quantit/i.test(precedente.doute)) delete precedente.doute;
            if (approx) precedente.doute = "Quantité approximative (« " + texteSeg + " »)";
            etapes.push({ type: "verifie", texte: "Quantité : " + String(q.qte).replace(".", ",") + " " + (q.unite || precedente.unite), ligne: lignes.indexOf(precedente) });
            continue;
          }
          if (!reste.length || reste.join("").length < 3) continue;
          const designation = nettoyer(texteSeg);
          if (!designation) continue;
          const ligne = { catalogueId: null, designation, qte: q.qte != null ? q.qte : 1, unite: q.unite || "u", pu: null, aChiffrer: true, cite: texteSeg };
          lignes.push(ligne); dansPhrase.push(ligne);
          continue;
        }

        const a = trouve.article;
        const ligne = { catalogueId: a.id, designation: a.designation, qte: null, unite: a.unite, pu: a.pu, cite: texteSeg };
        if (q.qte != null) {
          ligne.qte = q.qte;
          if (q.unite && q.unite !== a.unite && a.unite !== "forfait") ligne.doute = "Unité dite : " + q.unite + ", catalogue : " + a.unite;
        } else if (a.unite === "u" || a.unite === "forfait") ligne.qte = 1;
        else if (a.surface && surface != null) { ligne.qte = surface; ligne.doute = "Quantité reprise de la surface de la pièce (" + surface + " m²)"; }
        else ligne.doute = "Quantité à préciser (" + a.unite + ")";
        if (approx) ligne.doute = "Quantité approximative (« " + texteSeg + " »)";
        lignes.push(ligne); dansPhrase.push(ligne);
        const dit = texteSeg.replace(/^(et|puis)\s+/i, "").replace(/\s*\d+([.,]\d+)?\s*(m(è|e)tres? carr(é|e)s?|m²|m2)\s*$/i, "");
        etapes.push({ type: "reconnait", texte: "Trouve « " + dit + " » → " + a.designation + (ligne.qte != null ? " · " + String(ligne.qte).replace(".", ",") + " " + ligne.unite : ""), ligne: lignes.length - 1 });
      }
      // les doutes sont signalés une fois la phrase entière lue
      for (const l of dansPhrase) {
        const i = lignes.indexOf(l);
        if (l.aChiffrer) etapes.push({ type: "signal", texte: "Signale : « " + l.designation + " » n'est pas dans votre catalogue → ligne à chiffrer", ligne: i });
        else if (l.doute) etapes.push({ type: "signal", texte: "Signale : " + l.doute.charAt(0).toLowerCase() + l.doute.slice(1), ligne: i });
      }
    }
    const aChiffrer = lignes.filter((l) => l.aChiffrer).length;
    etapes.push({ type: "range", texte: lignes.length + " lignes ajoutées au devis" + (aChiffrer ? ", dont " + aChiffrer + " à chiffrer par vous" : "") });
    return { client, surface, piece, lignes, etapes };
  }

  window.MoteurDevis = { lire, preparer };
})();
