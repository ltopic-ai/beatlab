# Audit du code BeatLab

Audit du 21 novembre 2026 sur le dépôt [ltopic-ai/beatlab](https://github.com/ltopic-ai/beatlab). La branche principale est à `75cb5f3` et contient la V1.1. La [demande de fusion V2](https://github.com/ltopic-ai/beatlab/pull/1) reste ouverte en brouillon, à `b097210`. GitHub indique que le dépôt est public. L’exemplaire V1 dans `public/v1/index.html` de la V2 a exactement la même empreinte Git que la V1 sur `main`.

## Organisation et compilation

| Version | Éléments examinés |
| --- | --- |
| V1.1 | Un fichier HTML avec CSS et JavaScript intégrés. Web Audio, MediaRecorder et localStorage. Aucun paquet ni étape de compilation. |
| V2 | React et TypeScript avec Vite. `studio.tsx` gère l’interface, la timeline et les prises. `engine.ts` planifie l’audio et écrit le WAV. `project.ts` valide les projets et utilise IndexedDB. |
| Vérifications V2 | Node.js 24, `npm test`, puis `npm run build`. La sortie `dist/` contient les ressources relatives et la V1 sous `v1/`. Le workflow GitHub teste les demandes de fusion et prévoit une publication Pages déclenchée manuellement. |

## Fonctionnalités opérationnelles et vérifiées

- **V1.1** : huit rangées de seize pas, huit pads présents, bascule des pas, lecture et arrêt, tempo, sauvegarde et rechargement de la grille, export et import JSON. La prise simulée est lisible dans la session et disparaît après rechargement. Le code prévoit son téléchargement séparé.
- **V2** : création et répétition d’un clip de batterie, piano tactile, ajout d’une voix simulée, restauration après rechargement et téléchargement d’un WAV avec des échantillons non nuls. La V1 s’ouvre depuis la V2. Vérifié dans Edge Windows à 390 px, en version compilée et en HTML autonome. Le propriétaire a confirmé le test manuel du mix batterie, piano et voix depuis le HTML autonome.
- **Tests automatisés V2** : 3 réussites sur 3. Les tests couvrent la structure et l’import V1, la reprise audio à une position donnée avec une piste muette et l’en-tête PCM stéréo. La compilation TypeScript et Vite réussit.

## Fonctionnalités présentes mais à vérifier

- Sur Android réel : autorisation du micro, formats produits, import MP3/FLAC/OGG/M4A, glissement horizontal, quotas de stockage, enregistrement long et export WAV jusqu’à la limite prévue.
- Dans la V2 : montage tactile à la précision d’un temps, synchronisation à l’oreille avec des prises longues, réouverture d’un projet complet depuis un JSON exporté et appareils à faible mémoire. Les tests existants couvrent certains éléments du moteur sans reproduire ces parcours complets.
- Dans la V1 : raccourcis clavier des pads et téléchargement individuel d’une prise sont présents dans le code. Leur parcours complet n’a pas été rejoué pendant cet audit.

## Fonctionnalités incomplètes ou absentes

| Module | État actuel |
| --- | --- |
| Beat Maker | Grille fixe de 16 pas. Plusieurs clips de patterns sont possibles en V2. Il manque les kits, les grilles 32/64, la vélocité, le swing, le solo et le mix par percussion. |
| Music Studio | Quatre pistes fixes, tempo global, clips déplaçables, duplication, durée, volume et mute. Il manque le découpage avec décalage dans la prise, le zoom, la lecture depuis un point choisi hors enregistrement, l’annulation, les sections, le piano roll et l’export MIDI. La V2 sauvegarde un seul projet courant. |
| Reverse Studio | L’import audio générique et le micro existent dans le Studio. Il manque l’import vidéo dédié, la forme d’onde, l’extraction et le découpage, la capture d’onglet, l’analyse, les stems et la reconstruction. |
| Music Coach et bibliothèque | Aucun module pédagogique, catalogue de démonstration ou choix de langue. |

## Défauts et risques techniques

1. **Priorité haute — import V1 et instruments.** La V1 stocke les rangées dans l’ordre Kick, Snare, Hi-hat, Clap, Bass, Bell, Tom, Open hat. La V2 utilise Kick, Snare, Clap, Hi-hat, Open hat, Tom, Rim, Shaker. `readProject` reprend la grille par position. Hi-hat et Clap s’échangent, et Bass/Bell n’ont pas d’équivalent exact. Le test existant compare les booléens, ce qui masque la différence sonore. Reproduire les huit sons d’origine via un kit V1 et tester la correspondance de chaque rangée.
2. **Priorité haute — projets créés puis refusés au rechargement.** La lecture d’un projet limite à 500 clips et 2 048 temps pour certaines valeurs, alors que certaines actions de création, import ou déplacement peuvent dépasser ces limites. Aligner création, validation et sauvegarde. Si le chargement échoue, empêcher l’enregistrement automatique du projet vide d’écraser la sauvegarde existante.
3. **Priorité moyenne — mémoire et délais.** Un fichier audio de 100 Mo peut être converti en chaîne base64, stocké dans le projet puis redécodé pour la lecture et le mix. Le moteur planifie aussi tout l’arrangement d’un coup. Mesurer le pic mémoire et les démarrages sur tablette. Préférer des médias en Blob, un cache borné et une planification progressive si les mesures le justifient.
4. **Priorité moyenne — expérience d’enregistrement et stockage.** La capture V2 n’affiche ni chronomètre ni niveau. La V1 conserve les prises en mémoire et son projet JSON ne les contient pas. En V2, tout export JSON peut contenir les prises et doit donc être traité comme un fichier privé. Les fichiers ne se synchronisent pas entre le HTML local et un site HTTPS.
5. **Priorité moyenne — synchronisation et unités.** La batterie et les notes suivent le BPM. L’audio garde sa vitesse réelle, tandis que sa durée affichée et sa coupure suivent les temps du projet. Définir le comportement attendu quand le tempo change et mesurer le décalage micro sur appareil réel.

## Sécurité, confidentialité et licences

- Le code audité demande le micro après action, décode les fichiers dans le navigateur, sauvegarde localement et ne contient pas de chemin identifié d’envoi automatique des prises. La lecture du code n’est pas un audit de sécurité exhaustif. Renforcer les limites de taille et de durée des projets, les erreurs de quota et la libération du micro après échec ou interruption.
- Le dépôt reste public et la V1 contient un prénom dans l’interface. Éviter les identifiants personnels lors d’une future distribution. Aucune prise de test ou privée n’a été commitée par cet audit.
- Dépendances directes verrouillées : React et React DOM 19.3.1, types React 19.3.0 et React DOM 19.3.0, TypeScript 7.0.2, Vite 8.3.8. Les métadonnées du verrou affichent MIT pour React/Vite et Apache-2.0 pour TypeScript. Les autres entrées déclarent notamment MIT, Apache-2.0, MPL-2.0, BSD-3-Clause, ISC et 0BSD. Vérifier les notices des composants rediffusés avant distribution. Le projet indique ISC dans `package.json`, sans fichier LICENSE identifié. Le propriétaire doit confirmer le choix avant diffusion du code.
- Les requêtes `npm audit` et `npm outdated` n’ont pas atteint le registre. L’état des avis de sécurité et l’obsolescence restent à confirmer. Les versions installées sont connues, ce qui ne prouve pas qu’elles soient à jour.

Les premières tâches et les conditions de validation figurent dans [la feuille de route](ROADMAP.md). La stratégie HTTPS privée est décrite dans [le guide de déploiement](DEPLOYMENT.md).
