/* ================================================================
   RÉGLAGES D'ONKLAUD : le seul fichier à modifier.
   Enregistrez, rechargez la page : tout se met à jour
   (accueil, formulaire, pied de page, mentions légales).
   ================================================================ */

const CONFIG = {
  // Adresse qui reçoit les demandes de diagnostic.
  email: "contact@onklaud.com",

  // Téléphone, écrit comme il doit s'afficher : "06 12 34 56 78".
  // Cliquable sur mobile (contact, pied de page) et obligatoire dans les mentions légales.
  telephone: "",   // INTERDIT sur le site (règle du 14/11/2026) : contact par e-mail uniquement. Le numéro vit dans documents/identite.js

  // Numéro WhatsApp au format international, sans + ni espaces : "33612345678".
  // Vide : le lien WhatsApp n'apparaît pas.
  whatsapp: "",

  // Page de prise de rendez-vous en ligne (Cal.com, Google Agenda, Calendly…).
  // Rempli : un bouton « Choisir mon créneau » apparaît à côté du formulaire.
  agenda: "",

  // Qui répond. Un commerçant veut savoir à qui il parle : rempli, une ligne
  // « Vous parlez à … » apparaît près du formulaire. Vide : rien ne s'affiche.
  prenom: "",      // INTERDIT sur le site (règle du 14/11/2026)
  ville: "",  // laissé vide (règle du 14/11/2026)
  zone: "partout en France, à distance",  // où vous intervenez, ex. « sur place autour de [ville], en visio partout en France »

  // Offre de lancement : prix réduits affichés tant qu'il reste des places ET que la date n'est pas passée.
  // À chaque client signé à ce tarif, retirer 1 à « places ». À 0, le site revient aux prix normaux.
  lancement: { places: 3, fin: "2026-12-31" },

  // Photos (déposées dans assets/photos/, voir LISEZMOI.txt). src vide : emplacement masqué.
  photos: {
    portrait: { src: "", alt: "" },   // INTERDIT sur le site (règle du 14/11/2026) : aucune photo de l'entrepreneur
    commerce: { src: "", alt: "" },   // un vrai commerce, avec son accord (4:3)
    service:  { src: "", alt: "" }    // une petite équipe au travail (4:3)
  },

  // Mention TVA, reprise partout sur le site. Au 1er janvier 2027 elle change
  // (« art. L. 233-3 du CIBS » annoncé) : vérifier sur Légifrance, puis la remplacer ici.
  mentionTVA: "TVA non applicable, art. 293 B du CGI",

  // true : le formulaire envoie la demande directement (fonction api/diagnostic.js,
  // clé Hostinger à déclarer chez l'hébergeur). En cas d'échec, la messagerie s'ouvre.
  // false : la messagerie du visiteur s'ouvre toujours (ancien fonctionnement).
  envoiDirect: false,   // false tant que le site est sur GitHub Pages (pas de fonction serveur)

  // Mesure d'audience sans cookie (Vercel Web Analytics : uniquement si le site passe sur Vercel).
  // true : chargée, et les mentions légales le disent automatiquement.
  mesure: false,

  // Mentions légales (obligatoires en France). Vide : « à compléter ».
  nom: "",  // INTERDIT sur le site (règle du 14/11/2026). Le nom vit dans documents/identite.js
  adresse: "",  // laissée vide : adresse personnelle (règle du 14/11/2026)
  siret: "",  // INTERDIT sur le site (règle du 14/11/2026). Le SIRET vit dans documents/identite.js
  hebergeur: "GitHub, Inc. (GitHub Pages)",
  hebergeurAdresse: "88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis"  // source : docs.github.com (déclaration de confidentialité)
};

/* ----------------------------------------------------------------
   RÉALISATIONS : uniquement de vrais clients, avec leur accord.
   Tant que la liste est vide, la section n'apparaît pas.
   Exemple de forme :
   { qui: "Boulangerie …, Ville", corvee: "Recopier les commandes WhatsApp",
     fait: "Cahier de commandes partagé", resultat: "Ce que le client dit, avec ses mots",
     lien: "" }
   ---------------------------------------------------------------- */

const REALISATIONS = [];

/* ----------------------------------------------------------------
   DÉMOS : aucune pour l'instant (décision du 11/10/2026).
   Règle : ne montrer que des outils réellement prêts à l'emploi, sans faux chiffres.
   Les anciens films (données fictives, outils non finis) sont rangés dans
   communication/films-archives/ et ne sont plus publiés.
   ---------------------------------------------------------------- */

const DEMOS = [];
