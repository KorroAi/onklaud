/* ================================================================
   ONKLAUD : version publique des outils (onklaud.com et téléchargement)
   Chargé juste après commun.js, avant le script de l'outil.
   - moteur local seul : aucun appel au serveur des outils (/api/…)
   - en ligne (http/https) : service worker (hors connexion) et
     bouton « Installer l'appli » quand le navigateur le propose,
     aide courte pour iPhone et iPad
   - ouvert depuis un fichier (file://) : rien de tout cela
   Fichier copié par outils/publier.py : modifier ici, pas dans site/.
   ================================================================ */
(function () {
  "use strict";
  const Onk = window.Onk;

  /* ---------- Moteur local seul ---------- */
  Onk.moteur = { valeur: () => "local", installer() { /* pas de sélecteur en version publique */ } };
  Onk.etatServeur = async () => ({ agent: false, telephonie: false, hors_ligne: true });
  Onk.agent = async () => { throw new Error("pas d'agent dans la version publique"); };

  if (Onk.FILM) return;
  const enLigne = /^https?:$/.test(location.protocol);
  if (!enLigne) return;

  /* ---------- Installer l'appli ---------- */
  const bouton = document.getElementById("installer-appli");
  let invite = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    invite = e;
    if (bouton) bouton.hidden = false;
  });
  if (bouton) bouton.addEventListener("click", async () => {
    if (!invite) return;
    bouton.hidden = true;
    invite.prompt();
    try { await invite.userChoice; } catch (e) { /* rien */ }
    invite = null;
  });
  window.addEventListener("appinstalled", () => {
    invite = null;
    if (bouton) bouton.hidden = true;
    Onk.toast("Appli installée : elle s'ouvre depuis l'écran d'accueil ou la liste des applications.");
  });

  // iPhone et iPad : Safari n'a pas d'invite, on explique le geste
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const dejaInstalle = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  const aide = document.getElementById("aide-iphone");
  if (aide && ios && !dejaInstalle) aide.hidden = false;

  /* ---------- Hors connexion (service worker versionné) ---------- */
  if ("serviceWorker" in navigator) {
    // première prise en main (première visite) : silencieuse ; les suivantes = une nouvelle version
    let controle = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (controle) Onk.toast("Nouvelle version de l'outil installée : rechargez la page pour l'utiliser.", 9000);
      controle = true;
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => { /* l'outil marche aussi sans */ });
    });
  }
})();
