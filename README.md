# Site vitrine LKH Service

Site statique (HTML/CSS/JS vanilla) pour LKH Service, entreprise d'entretien d'espaces verts.
Aucune dépendance, aucun cookie, aucune ressource tierce : polices, images et scripts sont hébergés localement.

## Arborescence

```
index.html                  Accueil
services.html               Détail des 10 services (ancres #tonte, #haies, …)
realisations.html           Galerie avant / après filtrable
tarifs.html                 Grille tarifaire indicative
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

## 1. Déposer vos photos

Remplacez les images de `assets/img/photos/` **en gardant exactement le même nom de fichier**
(format WebP, voir les dimensions conseillées). Chaque emplacement affiche son nom en surimpression.

| Fichier | Emplacement | Dimensions conseillées |
|---|---|---|
| `hero.webp` | Grande image de fond de l'accueil | 1600 × 1000 |
| `apropos-equipe.webp` | Accueil (présentation) — vous / l'équipe | 1200 × 900 |
| `apropos-chantier.webp` | Page À propos — en intervention | 1200 × 900 |
| `service-tonte.webp`, `service-haies.webp`, `service-debroussaillage.webp`, `service-elagage.webp`, `service-desherbage.webp`, `service-massifs.webp`, `service-plantations.webp`, `service-creation.webp`, `service-dechets.webp`, `service-contrat.webp` | Cartes de l'accueil + page Services | 900 × 600 |
| `avant-1.webp` … `avant-4.webp` et `apres-1.webp` … `apres-4.webp` | Comparateurs avant/après (accueil + réalisations). **Même cadrage** pour l'avant et l'après. | 1200 × 800 |
| `assets/img/og-image.jpg` | Aperçu lors d'un partage (Facebook, WhatsApp…) | 1200 × 630 |

Conversion en WebP : [squoosh.app](https://squoosh.app) (qualité 75–80), ou `cwebp -q 78 photo.jpg -o hero.webp`.
Pensez à adapter les textes `alt` (description de la photo) dans le HTML si le contenu change.
Pour ajouter une 5ᵉ réalisation, dupliquez un bloc `gallery-item` dans `realisations.html`.

## 2. Informations à compléter AVANT la mise en ligne

Recherchez `[` / la classe `todo` dans les fichiers : chaque élément à compléter est surligné en jaune sur le site.

**Obligatoire (légal)**
- Forme juridique (EI / micro-entreprise / SARL…), nom de l'exploitant, capital social si société — `mentions-legales.html`, `cgv.html`
- Directeur de la publication — `mentions-legales.html`
- Hébergeur (nom, adresse, téléphone ; exemples en commentaire dans le fichier) — `mentions-legales.html`
- Mention TVA : n° intracommunautaire **ou** « TVA non applicable, art. 293 B du CGI » — `mentions-legales.html`, `tarifs.html`, `cgv.html`
- Assurance RC pro (assureur, n° de police, couverture) ; décennale seulement si travaux de construction (murets, terrasses maçonnées…)
- **Médiateur de la consommation** (obligatoire dès que vous travaillez pour des particuliers) — `mentions-legales.html`, `cgv.html`
- Vérifier le code postal (42520) et le département (Loire) de l'adresse
- **Témoignages** : ceux de l'accueil sont des exemples. Remplacez-les par de vrais avis puis supprimez le bandeau « Avis donnés à titre d'exemple » (les faux avis sont interdits).
- **Compteurs** de l'accueil (10 ans, +150 clients…) : mettez vos vrais chiffres dans les attributs `data-count` (commentaire `[À ADAPTER]`).

**Contenu**
- Horaires — `contact.html`
- Liste des communes / rayon — `zone.html`, accueil ; préfixes de départements acceptés dans `assets/js/main.js` (vérificateur de code postal)
- Tarifs réels — `tarifs.html`
- Votre histoire / parcours — `a-propos.html`
- Crédit d'impôt 50 % : uniquement si vous êtes déclaré « services à la personne ». Sinon, supprimez les mentions (`tarifs.html`, `services.html` FAQ, `cgv.html` art. 12).
- CGV : durée de validité des devis, acompte, délais de paiement, délai de réclamation, frais de déplacement inutile.
- Nom de domaine : remplacez `https://www.lkh-service.fr` partout (balises canonical/og dans chaque page, `sitemap.xml`, `robots.txt`, JSON-LD de `index.html`). Exemple : `grep -rl "lkh-service.fr" . | xargs sed -i 's#https://www.lkh-service.fr#https://www.votre-domaine.fr#g'`

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
