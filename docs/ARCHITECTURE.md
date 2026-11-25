# Architecture proposée

Conserver React, TypeScript et Vite. Web Audio et MediaRecorder couvrent les besoins actuels et le rendu hors ligne de la V2. Garder le code statique, sans serveur d’application, et n’ajouter une bibliothèque audio que pour un besoin mesuré.

| Couche | Aujourd’hui | Évolution incrémentale |
| --- | --- | --- |
| Interface | `studio.tsx`, `studio.css` | Extraire des éléments quand le deuxième écran les réutilise, en commençant par le transport et l’import. Centraliser ensuite les textes FR/EN. |
| Moteur | `engine.ts`, Web Audio et rendu hors ligne | Partager le calcul des événements entre lecture, aperçu de découpe et export WAV. Réutiliser le même modèle de rythme dans Beat Maker et Reverse Studio. |
| Capture et médias | MediaRecorder, encodage dans le projet | Isoler démarrage/arrêt, mesure de niveau et décodage. Stocker les médias séparément en Blob et les référencer par identifiant. Préserver l’export portable. |
| Projets | `project.ts`, IndexedDB, JSON historique | Ajouter un numéro de format et des migrations testées des exports V1 et V2 actuels. Écrire projet et nouveaux médias de manière cohérente, conserver la sauvegarde précédente en cas d’erreur. |
| Analyse | Absente | Mettre les analyses coûteuses dans un Web Worker. Prototyper BPM et transitoires avant les modèles lourds. |

Le futur projet versionné contiendra les pistes, leurs réglages, les clips, les patterns et notes, les références médias, les sections facultatives et les métadonnées. Utiliser les temps musicaux pour les positions et les secondes ou échantillons pour les découpes dans un enregistrement. Tester explicitement un changement de BPM avec un clip audio. Tant que le nouveau format n’est pas livré, l’export V2 actuel contient le tempo, la grille, les clips et le mix, avec les enregistrements encodés dans le JSON.

Pour le MP4 et WebM, commencer par éprouver le décodage local selon les codecs et produire un message clair si aucune piste audio utilisable ne peut être extraite. Tester les capacités de capture d’onglet sur appareils réels. Les travaux lourds pourront être essayés sur un ordinateur local sans rendre la tablette dépendante d’un service facturable.
