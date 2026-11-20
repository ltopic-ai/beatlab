# Déploiement privé et reproductible

## Version de référence

Depuis la branche V2, avec Node.js 24, exécuter `npm ci`, `npm test` puis `npm run build`. `dist/` contient le site compilé. La commande `npm run preview -- --host 127.0.0.1` ouvre un aperçu local sur le PC. L’adresse et le port s’affichent dans la console. Base relative, compilation et ouverture de la V1 sous `v1/` ont été vérifiées.

## Accès recommandé pour la famille, à valider

Utiliser le PC Windows déjà disponible pour servir la copie compilée, puis partager ce service via **Tailscale Serve** en HTTPS aux appareils autorisés. Le plan Personal est annoncé à 0 $ pour l’usage personnel et comprend jusqu’à six utilisateurs. Vérifier que l’inscription permet de rester sur Personal sans moyen de paiement avant toute activation. Le téléphone ou la tablette doit rejoindre le réseau privé, et le PC doit rester allumé avec le service BeatLab actif. Le studio s’ouvre ensuite dans Chrome à partir de l’adresse HTTPS fournie. Utiliser Serve et écarter Funnel, qui ouvrirait l’accès à Internet.

Une fois le scénario autorisé : installer Tailscale sur les appareils concernés, activer les certificats HTTPS selon la procédure officielle, lancer le service local et le raccorder avec `tailscale serve http://127.0.0.1:4173` si le port de l’aperçu est 4173. Vérifier que la tablette ouvre le studio et que l’adresse ne répond pas depuis un appareil non autorisé. Pour l’usage régulier, servir les fichiers de `dist/` via un petit serveur statique local. Après une mise à jour validée, reconstruire la sortie et relancer le serveur sur le même port.

[Plan Personal](https://tailscale.com/docs/account/manage-plans/free-plans-discounts) · [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve) · [Application Android](https://tailscale.com/docs/install/android)

## GitHub Pages et autres hébergements

- Le workflow Pages existant est prêt pour une construction statique et un déclenchement manuel. GitHub indique que le mode privé exige une organisation Enterprise Cloud. Le dépôt personnel actuel ne peut donc pas fournir un site Pages privé sous les contraintes fixées. Laisser la publication désactivée. [Visibilité GitHub Pages](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- Une publication publique via Netlify Drop est incompatible avec la confidentialité demandée. Cloudflare Access protège des URL HTTPS, mais le compte, les conditions de souscription sans carte et le processus de déploiement du dépôt existant restent à vérifier avant de retenir cette option. [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) · [Protection Netlify](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/)

## Ouvrir et tester sur tablette

Quand le lien privé existe, l’ouvrir dans Chrome et autoriser le microphone à la première prise. Créer un projet d’essai, enregistrer cinq secondes, lire le mix, exporter le WAV et recharger la page. Pour transférer un projet issu du fichier Windows, utiliser **Exporter le projet** sur Windows puis **Importer un projet** sur la tablette avec un transfert privé. La tablette conserve ensuite sa propre copie dans Chrome. Les vérifications sur appareil réel restent à faire.
