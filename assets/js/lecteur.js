/* Films : l'affiche reste nette, les commandes n'apparaissent qu'au lancement.
   Sans JavaScript, la vidéo garde ses commandes habituelles. */
(function () {
  document.querySelectorAll("video[data-lecteur]").forEach((v) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lire";
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.500v13l11-6.500z"/></svg>' + v.dataset.lecteur;
    v.controls = false;
    v.parentElement.append(b);
    b.addEventListener("click", () => {
      b.remove();
      v.controls = true;
      v.focus();
      v.play().catch(() => {});
    });
  });
})();
