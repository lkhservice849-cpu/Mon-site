# Site LKH Service

Site statique (HTML, CSS, JavaScript sans dépendance) de LKH Service – Paul Claudio : débroussaillage, abattage d'arbres, élagage et taille de haies en Isère et alentours.
Aucun cookie, aucune ressource tierce : polices et scripts sont hébergés avec le site.

En ligne via GitHub Pages : https://lkhservice849-cpu.github.io/Mon-site/

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : scène 3D avant/après, services, méthode, engagements, secteur |
| `services.html` | Liste des services + questions fréquentes |
| `service-*.html` | Une page par service (5) : détail et bon à savoir |
| `tarifs.html` | Fonctionnement du devis (aucun prix affiché) |
| `a-propos.html` | Présentation et engagements |
| `zone.html` | Secteur d'intervention + vérification par code postal |
| `contact.html` | Formulaire de demande de devis |
| `mentions-legales.html`, `politique-confidentialite.html`, `cgv.html`, `accessibilite.html` | Pages légales |
| `404.html` | Page d'erreur |

- `assets/css/style.css` : styles (couleurs et polices en variables en haut du fichier)
- `assets/js/main.js` : menu, animations, calendrier, formulaire
- `assets/js/scene.js` : scène 3D de l'accueil (dessinée dans un canvas, sans bibliothèque)
- `assets/fonts/` : Fraunces et Inter, licence SIL OFL

## Reste à compléter

- **Médiateur de la consommation** (obligatoire pour la clientèle de particuliers, art. L.612-1 du Code de la consommation) : nom, adresse et site dans `mentions-legales.html` et `cgv.html` (zones surlignées en jaune).
- **Nom de domaine** : une fois acheté, remplacer `https://lkhservice849-cpu.github.io/Mon-site` dans les pages (balises `canonical` et `og:`), `sitemap.xml` et `robots.txt`, puis l'indiquer dans Settings → Pages → Custom domain.
- **Photos et avis clients** : le site n'en affiche aucun pour l'instant. Ils seront ajoutés quand de vraies photos de chantiers et de vrais avis seront disponibles.

## Formulaire de devis

Sans serveur : le formulaire vérifie les champs puis ouvre la messagerie du visiteur avec un e-mail rédigé vers `lkhservice849@gmail.com`.
Un service peut être présélectionné par l'adresse : `contact.html?service=abattage#devis`.
