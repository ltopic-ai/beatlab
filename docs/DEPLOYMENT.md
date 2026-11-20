# Déploiement public sur GitHub Pages

Le site utilise le dépôt GitHub existant `ltopic-ai/beatlab`. Le propriétaire doit autoriser la première mise en ligne. Le dépôt public actuel rend GitHub Pages disponible sur GitHub Free sans domaine acheté. L’adresse attendue est `https://ltopic-ai.github.io/beatlab/`. L’adresse effective est celle que GitHub renvoie après le déploiement.

## Première publication, après accord

1. Dans [Settings → Pages](https://github.com/ltopic-ai/beatlab/settings/pages), sélectionner **GitHub Actions** comme **Source**.
2. Dans [Settings → Secrets and variables → Actions](https://github.com/ltopic-ai/beatlab/settings/variables/actions), ouvrir **Variables**, cliquer sur **New repository variable**, nommer la variable `BEATLAB_PUBLICATION` et lui donner la valeur `enabled`. C’est un réglage non secret. Le laisser absent avant l’accord de publication.
3. Faire vérifier et fusionner la branche de livraison dans `main`. La fusion déclenche le workflow **BeatLab**. Si la branche est déjà fusionnée quand Pages est activé, dans **Actions → BeatLab**, cliquer une fois sur **Run workflow** avec `main` sélectionné.
4. Attendre le résultat de la publication et de la vérification du lien dans **Actions**. Sous **Settings → Pages**, le bouton **Visit site** donne l’adresse publiée.

Il faut un accès d’administration du dépôt pour choisir la source Pages. Si GitHub Actions est désactivé sur le dépôt, l’activer dans [Settings → Actions → General](https://github.com/ltopic-ai/beatlab/settings/actions) et autoriser les actions officielles GitHub utilisées. Le workflow accorde au seul travail de publication les droits `pages: write` et `id-token: write`. Il n’utilise ni clé de déploiement ni secret personnel. [Workflow Pages officiel](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Vérifications et mises à jour

Avec Node.js 24, exécuter `npm ci`, `npm test`, `npm run build`, puis `node scripts/check-pages.mjs --local`. Vite produit des chemins relatifs. Le test sert le site sous `/beatlab/` et vérifie le HTML, les fichiers JavaScript et CSS et la V1 sous `v1/`.

Les demandes de fusion exécutent les vérifications. Après le premier accord, chaque mise à jour de `main` les rejoue et publie si elles passent. GitHub Actions contrôle ensuite l’adresse HTTPS réelle, la V2, ses ressources et la V1. Supprimer la variable suspend les futures publications. Pour retirer un site déjà publié, utiliser le réglage de dépublication de Pages.

Sur tablette Android, ouvrir le lien dans Chrome. Autoriser le microphone, ajouter un pattern et une prise, exporter un WAV et recharger la page pour vérifier la sauvegarde. Utiliser **Exporter le projet** et **Importer un projet** pour transférer un morceau entre appareils. Ces fichiers peuvent contenir les prises et se transmettent séparément, en privé.

## Périmètre de la version hébergée

GitHub Pages sert des fichiers statiques. La batterie, le clavier, l’arrangement, les prises micro, la sauvegarde dans le navigateur et le mix WAV s’exécutent côté utilisateur. La séparation IA, la transcription et une bibliothèque synchronisée ne sont pas livrées. Un traitement futur nécessitant un serveur ou un calcul hors navigateur devra être validé séparément. Aucune prise, composition personnelle, clé ou souscription n’est requise pour publier le site.
