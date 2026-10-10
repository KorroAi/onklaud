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
  telephone: "",

  // Numéro WhatsApp au format international, sans + ni espaces : "33612345678".
  // Vide : le lien WhatsApp n'apparaît pas.
  whatsapp: "",

  // Page de prise de rendez-vous en ligne (Cal.com, Google Agenda, Calendly…).
  // Rempli : un bouton « Choisir mon créneau » apparaît à côté du formulaire.
  agenda: "",

  // Qui répond. Un commerçant veut savoir à qui il parle : rempli, une ligne
  // « Vous parlez à … » apparaît près du formulaire. Vide : rien ne s'affiche.
  prenom: "",           // votre prénom
  ville: "",            // la ville où vous êtes installé
  zone: "",             // où vous intervenez, ex. « sur place autour de [ville], en visio partout en France »

  // Photos (déposées dans assets/photos/, voir LISEZMOI.txt). src vide : emplacement masqué.
  photos: {
    portrait: { src: "", alt: "" },   // vous (4:5), à côté du formulaire
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
  nom: "",              // votre prénom et nom (éditeur et responsable de publication)
  adresse: "",          // adresse de l'entreprise ou de domiciliation
  siret: "",            // 14 chiffres
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
   DÉMOS
   - id      : sert au lien direct à envoyer, ex. onklaud.com/#demo-relances
   - alias   : anciens id encore valables (liens déjà envoyés)
   - youtube : identifiant (ex. "dQw4w9WgXcQ") ou URL complète de la vidéo
   - fichier : ou chemin d'une vidéo posée dans site/demos/, ex. "demos/relances.mp4"
   - affiche : image montrée avant la lecture, ex. "demos/relances.jpg"
   - vertical, afficheVerticale : version 9:16, lue à la place sur un téléphone tenu droit
     youtube et fichier vides : la page affiche le déroulé « En tournage ».
   - plans   : le déroulé, durée en secondes + ce qu'on voit.
   Les vidéos sont fabriquées par le studio (outils/studio/LISEZMOI.md),
   sur les vrais outils (outils/LISEZMOI.md).
   ---------------------------------------------------------------- */

const DEMOS = [
  {
    id: "relances",
    titre: "Les devis qui dorment",
    sujet: "Relance de devis",
    youtube: "",
    fichier: "demos/relances.mp4",
    affiche: "demos/relances.jpg",
    vertical: "demos/relances-vertical.mp4",
    afficheVerticale: "demos/relances-vertical.jpg",
    plans: [
      { s: 8,  texte: "Lundi matin : 7 devis envoyés, sans réponse. 20 770 € qui attendent." },
      { s: 11, texte: "Chaque matin, la boucle prépare les relances (J+5, J+12). Un geste pour valider." },
      { s: 12, texte: "Le lendemain, elle repasse. Un client accepte : le total baisse." },
      { s: 10, texte: "Un devis passe à J+5, un client veut être rappelé : tout est suivi." },
      { s: 12, texte: "20 770 € → 9 250 € en attente. Personne n’a relancé à la main." }
    ]
  },
  {
    id: "commandes",
    alias: ["outil"],
    titre: "Le cahier de commandes qui se range seul",
    sujet: "Outil sur mesure",
    youtube: "",
    fichier: "demos/commandes.mp4",
    affiche: "demos/commandes.jpg",
    vertical: "demos/commandes-vertical.mp4",
    afficheVerticale: "demos/commandes-vertical.jpg",
    plans: [
      { s: 8,  texte: "Vendredi matin : 8 messages en vrac, un cahier à recopier." },
      { s: 9,  texte: "On colle les messages : ils se rangent par jour et par heure." },
      { s: 6,  texte: "Un doute ? Il est signalé, jamais deviné." },
      { s: 6,  texte: "La production de demain, faite : 34 baguettes tradition, 14 croissants, 6 flans." },
      { s: 10, texte: "Samedi matin : « Votre commande est prête » part après validation." },
      { s: 11, texte: "Personne n’a recopié." }
    ]
  },
  {
    id: "devis-dicte",
    titre: "Le devis dicté",
    sujet: "Outil sur mesure",
    youtube: "",
    fichier: "demos/devis-dicte.mp4",
    affiche: "demos/devis-dicte.jpg",
    vertical: "demos/devis-dicte-vertical.mp4",
    afficheVerticale: "demos/devis-dicte-vertical.jpg",
    plans: [
      { s: 7,  texte: "Fin de chantier : le devis, ce sera dimanche soir." },
      { s: 8,  texte: "Vous dictez comme vous parlez, depuis la camionnette." },
      { s: 6,  texte: "Chaque ligne vient de votre catalogue : vos libellés, vos prix." },
      { s: 7,  texte: "Pas au catalogue ? C’est signalé « à chiffrer », jamais inventé." },
      { s: 6,  texte: "Le devis A4, propre : TVA et mentions comprises." },
      { s: 4,  texte: "Prêt à partir, une fois relu." },
      { s: 11, texte: "Le dimanche soir est libre." }
    ]
  },
  {
    id: "zero-appel-perdu",
    alias: ["site"],
    titre: "Zéro appel perdu",
    sujet: "Site et automatisation",
    youtube: "",
    fichier: "demos/zero-appel-perdu.mp4",
    affiche: "demos/zero-appel-perdu.jpg",
    vertical: "demos/zero-appel-perdu-vertical.mp4",
    afficheVerticale: "demos/zero-appel-perdu-vertical.jpg",
    plans: [
      { s: 5,  texte: "20 h 12, plein service : ça sonne, personne ne peut décrocher." },
      { s: 4,  texte: "Appel manqué : trois secondes plus tard, le SMS est parti." },
      { s: 4,  texte: "Le client reçoit le lien. Pas de message vocal, pas de rappel." },
      { s: 8,  texte: "Il réserve en quatre gestes : personnes, jour, heure, nom." },
      { s: 4,  texte: "La table tombe chez vous." },
      { s: 6,  texte: "Un autre appel, le même chemin." },
      { s: 12, texte: "Le client a réservé. Personne n’a décroché." }
    ]
  }
];
