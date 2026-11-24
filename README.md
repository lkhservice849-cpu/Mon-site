# Site LKH Service

Site statique (HTML, CSS, JavaScript sans dépendance) de LKH Service – Paul Claudio : débroussaillage, abattage d'arbres, élagage et taille de haies en Isère et alentours.
Aucun cookie, aucune ressource tierce : polices et scripts sont hébergés avec le site.

En ligne via GitHub Pages : https://lkhservice849-cpu.github.io/Mon-site/

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : illustration de la vallée, chiffres clés, services, scène 3D, méthode, engagements, avant/après, secteur |
| `realisations.html` | Galerie avant/après (illustrations en attendant les photos de chantiers) |
| `services.html` | Liste des services + questions fréquentes |
| `service-*.html` | Une page par service (5) : détail et bon à savoir |
| `tarifs.html` | Fonctionnement du devis (aucun prix affiché) |
| `a-propos.html` | Présentation et engagements |
| `zone.html` | Secteur d'intervention + vérification par code postal |
| `contact.html` | Formulaire de demande de devis |
| `mentions-legales.html`, `politique-confidentialite.html`, `cgv.html`, `accessibilite.html` | Pages légales |
| `404.html` | Page d'erreur |

- `assets/css/style.css` : styles. Les couleurs, polices, espacements et rayons sont des variables en haut du fichier (accent vert forêt `#2f5d46`, fond crème `#fefffc`, bordures `#dee2de`)
- `assets/js/main.js` : menu, animations, calendrier, formulaire
- `assets/js/scene.js` : scène 3D de l'accueil (dessinée dans un canvas, sans bibliothèque)
- `assets/fonts/` : Fraunces et Inter, licence SIL OFL

## Reste à compléter

- **Médiateur de la consommation** (obligatoire pour la clientèle de particuliers, art. L.612-1 du Code de la consommation) : nom, adresse et site dans `mentions-legales.html` et `cgv.html` (zones surlignées en jaune).
- **Nom de domaine** : une fois acheté, remplacer `https://lkhservice849-cpu.github.io/Mon-site` dans les pages (balises `canonical` et `og:`), `sitemap.xml` et `robots.txt`, puis l'indiquer dans Settings → Pages → Custom domain.
- **Photos de chantiers** : les comparateurs avant/après utilisent des illustrations au trait. Déposer les vraies photos (WebP) dans `assets/img/realisations/` sous les noms `realisation-1-avant.webp`, `realisation-1-apres.webp`, etc. (indiqués sous chaque image de la page Réalisations), puis remplacer les illustrations par des balises `<img loading="lazy" alt="…">`.
- **Avis clients** : aucun pour l'instant ; à ajouter quand de vrais avis seront disponibles.

## Formulaire de devis

Sans serveur : le formulaire vérifie les champs puis ouvre la messagerie du visiteur avec un e-mail rédigé vers `lkhservice849@gmail.com`.
Un service peut être présélectionné par l'adresse : `contact.html?service=abattage#devis`.
