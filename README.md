# BeatLab Studio

BeatLab est un studio musical local dans le navigateur. La V1.1 Studio Rap est accessible à l’adresse relative `./v1/`. La V2 se trouve à la racine.

## Essayer la V2

Avec Node.js 24, installe les dépendances avec `npm ci`, puis lance `npm run dev`. Ouvre l’adresse localhost affichée dans un navigateur récent. Pour vérifier la version de production, exécute `npm test`, `npm run build`, puis `npm run preview`.

1. Joue les pads ou coche les pas de la batterie. Écoute la boucle et ajoute le pattern à la mesure choisie.
2. Sélectionne un clip pour le déplacer par temps, le raccourcir, le dupliquer ou répéter une mesure. Sur ordinateur, le glisser-déposer fonctionne aussi.
3. Sélectionne Piano ou Synthé, enregistre les notes au clavier tactile et arrête la prise. Les notes et leurs durées sont sauvegardées avec le projet.
4. Importe un fichier audio ou enregistre le micro sur la piste Guitare ou Voix. La lecture d’accompagnement reprend à la mesure d’insertion. Un casque évite que le micro reprenne le son des haut-parleurs.
5. Règle les volumes et les pistes muettes, écoute le morceau et exporte le mix WAV.

## Données et limites

- Le projet courant est sauvegardé dans ce navigateur via IndexedDB. Un export JSON V2 contient aussi les prises audio. Garde ce fichier privé si tu souhaites conserver tes enregistrements. Un JSON V1 recrée le pattern et l’ajoute à la première mesure.
- Le micro exige HTTPS ou localhost, l’autorisation du navigateur et la prise en charge de MediaRecorder. Les formats d’import dépendent du décodeur installé dans le navigateur.
- Les notes MIDI sont enregistrées depuis le clavier de BeatLab dans le projet. La connexion d’un clavier MIDI externe et les fichiers `.mid` ne sont pas pris en charge.
- Le tempo déplace et redimensionne la grille musicale. Les prises audio gardent leur vitesse d’origine. Le décalage d’un micro dépend du matériel et peut être corrigé dans le champ Début du clip.
- Un fichier audio est limité à 100 Mo. Le mix est limité à dix minutes et exporté en WAV PCM stéréo à 44,1 kHz. Les exports volumineux peuvent demander beaucoup de mémoire sur un mobile.

## Structure et publication

`studio.tsx` gère l’interface et le transport. `engine.ts` programme les sons via Web Audio et produit le mix avec OfflineAudioContext. `project.ts` valide les fichiers et sauvegarde le projet localement. Les tests couvrent l’import V1, les positions audio en lecture et l’encodage WAV.

Le workflow GitHub teste les demandes de fusion et prépare un aperçu compilé. Après accord de publication et configuration de Pages, les mises à jour de `main` sont déployées automatiquement. Le workflow vérifie ensuite que le lien HTTPS répond et que le JavaScript, le CSS et la V1 sont accessibles. Le site ne transmet pas les compositions ni les prises à GitHub. Voir le [guide de mise en ligne](docs/DEPLOYMENT.md).
