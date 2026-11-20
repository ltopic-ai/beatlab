# Feuille de route

Chaque étape se prépare dans une branche dédiée du dépôt existant. La démonstration et les tests accompagnent la demande de revue. Les changements de fond et la mise en ligne attendent la validation du propriétaire.

| Phase | Lot proposé | Preuve attendue |
| --- | --- | --- |
| 0 · Audit | Vérifier V1 et V2, documenter l’existant et préparer les décisions. | État GitHub, tests et risques consignés. |
| 1 · Base fiable et accès | Corriger le kit de compatibilité V1, l’alignement des limites et le risque de remplacement après erreur. Vérifier Chrome Android, puis essayer l’accès HTTPS privé. | Un rythme V1 garde ses sons. Le WAV V2 contient les pistes du mix. Le site refuse un appareil hors de l’accès autorisé. |
| 2 · Import et capture | Ajouter audio/vidéo local, niveau, chronomètre, réécoute, découpe et transfert. Étudier à part le son d’onglet. | Tester MP3, WAV, MP4 et WebM avec des fichiers autorisés, plus les erreurs de format. |
| 3 · Composition | Ajouter montage, lecture à partir du curseur, zoom, annulation, piano roll et export MIDI. Étendre la batterie par lots et introduire les projets multiples. | Composer, fermer, rouvrir, rééditer et réexporter un projet. |
| 4 · Analyse | Dessiner la forme d’onde et détecter BPM, temps et transitoires, avec correction manuelle. | Résultats comparés aux tempos et repères de démos originales. |
| 5 · Séparation | Comparer Demucs et audio-separator sur PC local. Fixer une limite de durée et documenter chaque modèle et ses poids. | Écoute des stems, temps de calcul et mémoire sur morceaux témoins. |
| 6 · Reconstruction | Convertir les événements de batterie en patterns et tester la transcription mélodique. Ajouter un comparateur et les scores de confiance. | Les événements et notes restent éditables. Mesurer les erreurs sur sorties de référence. |
| 7 · Apprentissage | Ajouter des exercices et une aide visuelle facultative. | Un enfant peut comprendre BPM et mesures, puis terminer un beat sans assistance constante. |
| 8 · Bêta privée | Tester avec quelques familles, corriger les irritants et comparer les appareils. | Validation de l’ergonomie, de la protection des fichiers et de la stabilité. |

Premier lot de code proposé : test de correspondance des huit sons V1, correction du kit, test de non-écrasement après échec de chargement et validation Chrome Android. Les tailles 32/64 arrivent ensuite pour limiter les changements simultanés sur le séquenceur.
