# Site LKH Service

Site statique (HTML, CSS, JavaScript sans dépendance) de LKH Service – Paul Claudio : débroussaillage, abattage d'arbres, élagage et taille de haies en Isère et alentours.
Aucun cookie, aucune ressource tierce : polices et scripts sont hébergés avec le site.

En ligne via GitHub Pages : https://lkhservice849-cpu.github.io/Mon-site/

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : ouverture « LKH Service » avec image qui s'agrandit, diaporama des services, grille des services, étapes, réalisations, maquette 3D, secteur |
| `realisations.html` | Comparateurs avant/après (vues de la maquette 3D en attendant les photos de chantiers) |
| `services.html` | Liste des services + questions fréquentes |
| `service-*.html` | Une page par service (5) : détail et bon à savoir |
| `tarifs.html` | Fonctionnement du devis (aucun prix affiché) |
| `a-propos.html` | Présentation et engagements |
| `zone.html` | Secteur d'intervention + vérification par code postal |
| `contact.html` | Formulaire de demande de devis |
| `mentions-legales.html`, `politique-confidentialite.html`, `cgv.html`, `accessibilite.html` | Pages légales |
| `404.html` | Page d'erreur |

- `assets/css/style.css` : styles. Les couleurs, polices et espacements sont des variables en haut du fichier (fond beige `#f6f0e9`, texte brun `#3f3932`, accent vert forêt `#2f4a3a`)
- `assets/js/main.js` : menu, ouverture, diaporama, apparitions au défilement, comparateurs, formulaire
- `assets/js/scene.js` : maquette 3D interactive de l'accueil (canvas, sans bibliothèque). Elle sert aussi à produire les images fixes de `assets/img/rendus/` (réglages `data-yaw`, `data-t`, `data-zoom`, `data-target`, `data-static`).
- `assets/img/photos/` : photos libres de droits (banque d'images Pexels, licence Pexels : usage commercial gratuit, attribution non obligatoire). Elles illustrent les métiers et ne représentent pas des chantiers de LKH Service (mention dans les mentions légales). Pour mettre une photo à vous à la place, gardez le même nom de fichier et les mêmes proportions.
- `assets/img/rendus/` : vues fixes de la maquette 3D pour les comparateurs avant/après, en attendant les photos de chantiers
- `assets/fonts/` : Archivo (texte et titres) et Fraunces (logo), licence SIL OFL

## Reste à compléter

- **Médiateur de la consommation** (obligatoire pour la clientèle de particuliers, art. L.612-1 du Code de la consommation) : nom, adresse et site dans `mentions-legales.html` et `cgv.html` (zones surlignées en jaune).
- **Nom de domaine** : une fois acheté, remplacer `https://lkhservice849-cpu.github.io/Mon-site` dans les pages (balises `canonical` et `og:`), `sitemap.xml` et `robots.txt`, puis l'indiquer dans Settings → Pages → Custom domain.
- **Photos de chantiers** : les comparateurs avant/après (accueil, réalisations, pages services) utilisent encore des vues de la maquette 3D, car seules de vraies photos de vos chantiers peuvent y figurer. Déposer les vraies photos (WebP) dans `assets/img/realisations/` sous les noms `realisation-1-avant.webp`, `realisation-1-apres.webp`, etc. (indiqués sous chaque image de la page Réalisations), puis remplacer les illustrations par des balises `<img loading="lazy" alt="…">`.
- **Avis clients** : aucun pour l'instant ; à ajouter quand de vrais avis seront disponibles.

## Formulaire de devis

Sans serveur : le formulaire vérifie les champs puis ouvre la messagerie du visiteur avec un e-mail rédigé vers `lkhservice849@gmail.com`.
Un service peut être présélectionné par l'adresse : `contact.html?service=abattage#devis`.
