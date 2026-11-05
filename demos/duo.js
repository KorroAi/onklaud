/* Charge les deux écrans d'une démo et les met à l'échelle de la fenêtre. */
(function () {
  "use strict";
  const DEMOS = {
    atelier: { cle: "atelier-morel", pro: "atelier-morel/?cadre=1", client: "atelier-morel/chantier.html?cadre=1", consigne: "Sur le téléphone, ouvrez <b>Documents</b> et signez le devis. Regardez le logiciel.", mobile: "Ouvrez <b>Documents</b> et signez le devis." },
    boulangerie: { cle: "boulangerie", pro: "boulangerie/comptoir.html?cadre=1", client: "boulangerie/?cadre=1", consigne: "Passez une commande sur le téléphone. Elle arrive au comptoir.", mobile: "Passez une commande, puis regardez le comptoir." },
    lucie: { cle: "maison-lucie", pro: "maison-lucie/carnet.html?cadre=1", client: "maison-lucie/?cadre=1", consigne: "Réservez une table. Elle apparaît dans le carnet du restaurant.", mobile: "Réservez une table, puis regardez le carnet." },
    fidelite: { cle: "belle-rive", pro: "belle-rive/caisse.html?cadre=1", client: "belle-rive/?cadre=1", consigne: "Ajoutez un tampon à Camille depuis la caisse. Regardez sa carte.", mobile: "Voici la carte de fidélité de Camille. Le tampon s’ajoute depuis la caisse." }
  };
  const p = new URLSearchParams(location.search);
  const d = DEMOS[p.get("d")] || DEMOS.atelier;
  const nom = (p.get("nom") || "").trim().slice(0, 40);
  const suite = nom ? "&nom=" + encodeURIComponent(nom) : "";
  const $ = (s) => document.querySelector(s);
  $("#ouvrir-pro").href = d.pro.replace("?cadre=1", nom ? "?nom=" + encodeURIComponent(nom) : "");
  const charger = () => { $("#cadre-pro").src = d.pro + suite; $("#cadre-client").src = d.client + suite; };
  const ajuster = () => {
    $("#consigne").innerHTML = innerWidth <= 860 ? d.mobile : d.consigne;
    if (innerWidth <= 860) {
      const e = Math.min(1, (innerWidth - 32) / 390);
      $("#poste").hidden = true;
      $("#mobile").style.setProperty("--e", e);
      return;
    }
    $("#poste").hidden = false;
    const h = $("#scene").clientHeight - 60, l = $("#scene").clientWidth - 120;
    const e = Math.min(h / 844, l / (1280 + 390), 1);
    const ep = Math.min(e * 1.02, (l - 390 * e) / 1280);
    $("#poste").style.setProperty("--e", ep);
    $("#mobile").style.setProperty("--e", e);
  };
  $("#recommencer").addEventListener("click", () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("onklaud-demo-" + d.cle)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* stockage indisponible */ }
    charger();
  });
  addEventListener("resize", ajuster);
  ajuster(); charger();
})();
