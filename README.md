# Site vitrine LKH Service

Site statique (HTML/CSS/JS vanilla) pour LKH Service, entreprise d'entretien d'espaces verts.
Aucune dépendance, aucun cookie, aucune ressource tierce : polices, images et scripts sont hébergés localement.

## Arborescence

```
index.html                  Accueil
services.html               Détail des 10 services (ancres #tonte, #haies, …)
tarifs.html                 Fonctionnement du devis (aucun prix affiché)
a-propos.html               Présentation, valeurs, engagement environnemental
zone.html                   Zone d'intervention + vérificateur de code postal
contact.html                Formulaire de devis, coordonnées, horaires, itinéraire
mentions-legales.html       Mentions LCEN art. 6-III
politique-confidentialite.html  RGPD
cgv.html                    Conditions générales de vente (avec rétractation)
accessibilite.html          Déclaration d'accessibilité (RGAA)
404.html                    Page d'erreur
sitemap.xml, robots.txt, manifest.json, favicon.ico, favicon.svg
.htaccess                   Apache (OVH…) : page 404, cache, en-têtes de sécurité
_headers                    Netlify : en-têtes de sécurité
.nojekyll                   GitHub Pages
assets/css/style.css        Styles (variables de couleurs en haut du fichier)
assets/js/main.js           Menu, animations, compteurs, carrousel, formulaire
assets/fonts/               Fraunces + Inter (licence SIL OFL)
assets/img/photos/          ⇦ VOS PHOTOS ICI
assets/img/icons/           Icônes d'application
```

## 1. Ajouter des photos (plus tard)

Le site utilise pour l'instant des illustrations végétales. Pour mettre de vraies photos, remplacez les fichiers
de `assets/img/photos/` **en gardant exactement le même nom** (format WebP) :

| Fichier | Emplacement | Dimensions conseillées |
|---|---|---|
| `hero.webp` | Grande image de fond de l'accueil | 1600 × 1000 |
| `apropos-equipe.webp` | Accueil (présentation) | 1200 × 900 |
| `apropos-chantier.webp` | Page À propos | 1200 × 900 |
| `service-tonte.webp`, `service-haies.webp`, `service-debroussaillage.webp`, `service-elagage.webp`, `service-desherbage.webp`, `service-massifs.webp`, `service-plantations.webp`, `service-creation.webp`, `service-dechets.webp` | Cartes de l'accueil + page Services | 900 × 600 |

Conversion en WebP : [squoosh.app](https://squoosh.app) (qualité 75–80). Une page « Réalisations » avant/après pourra être ajoutée quand vous aurez des photos de chantiers.

## 2. Reste à compléter

- **Médiateur de la consommation** (obligatoire pour la clientèle de particuliers, art. L.612-1 du Code de la consommation) : nom, adresse et site du médiateur dans `mentions-legales.html` et `cgv.html` (zones surlignées en jaune).

## 3. Formulaire de devis

Sans serveur, le formulaire valide les champs puis ouvre la messagerie du visiteur avec un e-mail pré-rempli
vers `lkhservice849@gmail.com`. Le service présélectionné peut être passé dans l'URL : `contact.html?service=haies#devis`.

Pour un envoi direct sans messagerie, vous pouvez plus tard :
- **Netlify** : ajouter `data-netlify="true"` et `name="devis"` sur la balise `<form>`, puis retirer l'écouteur `submit` du formulaire dans `main.js` ;
- un service type Formspree (implique un tiers : mettez alors à jour la politique de confidentialité).

## 4. Déploiement

Copiez **tout le contenu du dossier** à la racine de l'hébergement :
- **OVH / Apache** : par FTP dans `www/`. Le `.htaccess` gère la page 404 et le cache. Décommentez la redirection HTTPS une fois le certificat actif.
- **Netlify / Vercel** : glisser-déposer le dossier, ou connecter le dépôt GitHub (aucune commande de build).
- **GitHub Pages** : Settings → Pages → branche principale, dossier `/`. Ajoutez votre domaine personnalisé (le site utilise des chemins relatifs, il fonctionne aussi sous `utilisateur.github.io/mon-site/`).

Ensuite : déclarez `sitemap.xml` dans Google Search Console et créez / mettez à jour votre fiche Google Business Profile avec le lien du site.

## 5. Personnaliser le design

Les couleurs, polices, arrondis et ombres sont des variables en haut de `assets/css/style.css` (`--forest-700`, `--sun-400`, etc.).
Les animations respectent le réglage « Réduire les animations » du système.
