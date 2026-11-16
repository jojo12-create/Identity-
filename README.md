# Identity. — byidentity.dev

Source du site [byidentity.dev](https://byidentity.dev), hébergé sur Hatchable (projet `identity`).
Le premier commit est une copie exacte de la version 85 en ligne (fichiers vérifiés un par un par hash).
Les commits suivants portent la refonte 3D, guidée par les skills `design-taste-frontend`,
`impeccable` et `emil-design-eng` du dépôt Model_site.

## Structure

| Dossier | Contenu |
|---|---|
| `public/` | pages HTML, CSS, JS, Three.js embarqué (`public/vendor/three`, MIT) |
| `api/` | fonctions serveur Hatchable : contact, vidéos du portfolio, admin, webhook Stripe |
| `pages/` | espace pro (admin) |
| `migrations/` | schéma SQL |
| `hatchable.toml` | connexion Stripe, secret du webhook |

## Ce qui a changé

### Bannière cinématographique (page d'accueil) — `reel.js`, `reel.css`
- Derrière toute la première section, les 4 sites réalisés (Adrian Rodriguez, NBA Edge Lab, Tandem, Atelier Volt)
  flottent dans un espace 3D crème, chacun comme un écran de verre qui diffuse sa vraie vidéo de navigation.
- Une caméra s'arrête sur un site pendant que sa vidéo défile (environ 9 s, avec une lente avancée), puis s'envole
  vers le suivant : recul, glissement, léger roulis, rapprochement. Après le dernier, un fondu relance la boucle.
  Les sites voisins restent visibles en profondeur.
- Un voile crème à gauche garde le texte lisible. La pastille donne le nom et le type du site, avec précédent, pause et suivant (44 px).
- Sur mobile, la bannière passe sous le texte, en pleine largeur.
- Repli sans WebGL : les vidéos s'enchaînent en fondu, en plein cadre. Animations réduites : la caméra reste fixe,
  aucune vidéo ne démarre seule. Le rendu s'arrête hors écran et quand l'onglet est masqué.
- Three.js r169 embarqué (`public/vendor/three`), pas de CDN.

### Logo 3D — `logo3d.js`, `logo3d.css` (toutes les pages)
- Au repos « I. ». Les lettres de « dentity » se déplient une à une, pivotées en perspective ;
  la sphère rouge laquée suit la dernière lettre et atterrit avec un rebond ; un reflet passe sur le mot ; puis tout se replie.
  Joué au chargement, toutes les 14 s, au survol et au focus clavier. Sur mobile le logo reste « I. »,
  sinon il chevaucherait le bouton « Démarrer mon projet ».
- Logo du pied de page : déplié en permanence, avec une vague au survol.
- Le point final des titres devient la même sphère ; celui du h1 tombe et rebondit à l'arrivée.
- L'ancienne animation (`animation2.*`) est conservée dans le dépôt, mais n'est plus chargée.

### Finitions — `polish.css` (toutes les pages)
- Entrée du hero : le texte monte et devient net, une seule fois, au chargement.
- Boutons : décalage au survol, enfoncement au clic, flèche qui avance. Les soulignés de la navigation se dessinent.
- Les cartes se soulèvent de 2 px au survol, les icônes répondent.
- Titres équilibrés (fini « joli. » seul sur sa ligne).
- Focus clavier visible.
- Bug corrigé : dans « Un site qui vous ressemble », le texte passait sous l'icône.

### SEO et partage
- `favicon.svg` (il manquait : erreur 404), `share.jpg` 1200×630, balises Open Graph et Twitter, URL canonique sur chaque page.
- `sitemap.xml` (il manquait : erreur 404). Page de confirmation de paiement en `noindex`.

## Audit de la version en ligne (v85)

- 10 feuilles CSS empilées (`theme`, `moodboard`, `editorial`…) qui se corrigent les unes les autres.
  Les nouvelles feuilles s'ajoutent en dernier, sans réécrire les anciennes. À fusionner un jour.
- Image de fond du hero chargée depuis un autre site (images.unsplash.com) : remplacée par un fond CSS.
- Pas de favicon, pas d'image de partage, pas de sitemap, pas d'URL canonique : corrigé.
- Logo animé recréé par JavaScript, avec une animation « bulle » assez plate : remplacé par le logo 3D.
- Contrôles du carrousel vidéo à 26 px (trop petits au doigt) : 44 px désormais.
- `animation3.*`, `logo-motion.*` et `archives/` ne sont chargés par aucune page.
- `robots.txt` est généré par la plateforme et ne déclare pas le sitemap : soumettre `sitemap.xml` dans Google Search Console.

## Contrôles effectués

- `perf.mjs` (skill design-taste-frontend), à 1440 et 390 px :
  - FCP 150 à 220 ms, LCP 200 à 220 ms, aucune tâche longue, décalage de mise en page ≤ 0,008, transfert 275 Ko, 1 contexte WebGL.
  - Signalé : 11 requêtes en échec. Ce sont les vidéos `/api/portfolio-media/*` : le serveur statique du contrôle ne les sert pas, elles existent en production.
  - Avertissement : 711 Ko de JS analysé (Three.js). Il est chargé en module, après l'affichage du texte.
- Captures à 1440, 1200 et 390 px, avec et sans animations réduites.
- Non utilisable ici : le contrôleur de mise en page du skill (`check.mjs`) et `gate.mjs`. Ils attendent la structure
  de son propre kit (`.wrap`, `system.css`), que ce site n'a pas.

## Publier sur Hatchable

Les fichiers modifiés ou ajoutés sont dans `public/`. Pour publier : écrire ces fichiers dans le projet `identity`, puis lancer un déploiement Hatchable.
Rien dans `api/`, `pages/`, `migrations/` ni `hatchable.toml` n'a changé.
