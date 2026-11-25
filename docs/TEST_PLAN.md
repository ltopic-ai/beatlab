# Plan de test

## Résultats obtenus pendant l’audit

| Vérification | Résultat |
| --- | --- |
| `npm test` sous Node.js 24 | Trois tests réussis. |
| `npm run build` | TypeScript et Vite réussis. |
| Edge Windows à 390 px, application compilée et HTML autonome | Timeline, répétition, piano tactile, micro simulé V2, restauration, WAV et passage à la V1 réussis. |
| V1 compilée, parcours navigateur | 128 boutons de pas, huit pads présents, tempo, lecture, sauvegarde, JSON et prise de session vérifiés. |
| Test manuel du propriétaire, HTML autonome | Le propriétaire a confirmé que le test du morceau batterie, piano et voix était bon. |
| Registre des paquets | Vérification des avis et mises à jour bloquée par l’accès réseau. |

## Tests à ajouter lors des prochains lots

1. Import V1 : donner à chaque rangée un motif distinct et vérifier que le son entendu correspond au kit V1. Comparer les positions et la sortie MIDI future.
2. Sauvegarde : recharger après plusieurs modifications, simuler quota atteint, importer des versions et des limites différentes, puis vérifier la conservation de la sauvegarde précédente.
3. Audio : tester déplacement, découpe, replay et synchronisation d’une prise longue. Comparer le WAV avec mute et volume, et vérifier le comportement après un changement de tempo.
4. Médias : tester MP3, WAV, FLAC, OGG et M4A, puis MP4 et WebM avec des codecs différents, vidéo muette, fichier vide ou volumineux. Observer durée, mémoire, temps de réponse et lisibilité des erreurs.
5. Chrome tablette Android : valider tactile, permission micro accordée ou refusée, interruption de prise, réouverture, transfert de projet et export. Pour le son d’onglet, relever la capacité disponible et ne proposer l’enregistrement que lorsque la source sélectionnée fournit une piste audio. [Capture d’écran et d’onglet dans Chrome](https://developer.chrome.com/blog/screen-sharing-improvements-in-chrome-109)
6. Accès privé : vérifier le même lien sur un appareil autorisé et sur un appareil hors du réseau privé. Contrôler que le démarrage et l’import n’envoient aucun média vers l’hébergeur.
7. Analyse et IA : démos originales de référence avec BPM, frappes, notes et pistes séparées connus. Mesurer l’erreur de tempo, l’écart temporel des événements, les notes détectées, le temps de calcul et la mémoire. Documenter les passages qui nécessitent une correction manuelle.
