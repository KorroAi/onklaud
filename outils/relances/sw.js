/* ================================================================
   ONKLAUD : service worker de « Relance des devis »
   Généré par outils/publier.py depuis outils/publication/sw.js :
   ne pas modifier dans site/.
   - à l'installation : met en cache tous les fichiers de l'outil
     et les polices (version d85919794c80) ;
   - ensuite : sert le cache d'abord, le réseau si besoin ;
   - nouvelle version publiée = nouveau nom de cache : l'ancien est
     effacé, la page propose de recharger.
   ================================================================ */
"use strict";
const PREFIXE = "onklaud-relances-";
const CACHE = PREFIXE + "d85919794c81";
const FICHIERS = [
  "index.html",
  "relances.css",
  "relances.js",
  "manifest.webmanifest",
  "../commun/commun.css",
  "../commun/commun.js",
  "../commun/public.css",
  "../commun/public.js",
  "../commun/favicon.svg",
  "../commun/polices/bricolage-grotesque-latin.woff2",
  "../commun/polices/bricolage-grotesque-latin-ext.woff2",
  "../commun/polices/caveat-latin.woff2",
  "../commun/polices/caveat-latin-ext.woff2",
  "../commun/icones/icone-192.png",
  "../commun/icones/icone-512.png",
  "../commun/icones/icone-maskable-512.png",
  "../commun/icones/apple-touch-icon.png"
];

// Copie « propre » d'une réponse (une réponse redirigée ne peut pas servir une page)
async function propre(reponse) {
  if (!reponse.redirected) return reponse;
  return new Response(await reponse.blob(), { status: reponse.status, statusText: reponse.statusText, headers: reponse.headers });
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(FICHIERS.map(async (f) => {
      const r = await fetch(new Request(f, { cache: "reload" }));
      if (!r.ok) throw new Error("mise en cache impossible : " + f);
      await cache.put(f, await propre(r));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const cles = await caches.keys();
    await Promise.all(cles.filter((k) => k.startsWith(PREFIXE) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;
  const portee = new URL(self.registration.scope).pathname;
  if (r.mode === "navigate") {
    // la page de l'outil (avec ou sans « index.html », avec ou sans paramètres)
    if (url.pathname !== portee && url.pathname !== portee + "index.html") return;
    e.respondWith((async () => (await caches.match(new URL("index.html", self.registration.scope).href, { cacheName: CACHE })) || fetch(r))());
    return;
  }
  e.respondWith((async () => (await caches.match(r, { cacheName: CACHE, ignoreSearch: true })) || fetch(r))());
});
