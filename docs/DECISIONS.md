# Décisions et points à valider

| Sujet | Décision ou proposition | Motif |
| --- | --- | --- |
| Périmètre immédiat | Audit et documentation. | Le propriétaire demande d’examiner et de valider avant une refonte, une fusion ou une publication. |
| Code historique | Garder la V1 intacte et migrer son format dans la V2. | Le séquenceur et les projets historiques doivent rester accessibles. |
| Socle audio | Garder React, TypeScript et le moteur natif existant. | La compilation et les parcours de base passent. |
| Accès mobile | Tester un HTTPS privé avec Tailscale Serve en usage personnel, après accord. | Pas de publication ouverte ni achat de domaine dans ce scénario. Le PC hôte doit rester allumé. |
| Visibilité du code | Recontrôler le statut du dépôt avec le propriétaire avant toute distribution. | Il est public au moment de l’audit et la visibilité du code est un réglage séparé de l’accès au studio. |
| Dépendances et licence du projet | Confirmer ISC et les avis de sécurité avant une distribution plus large. | Le champ ISC seul ne fournit pas le texte de licence du projet. |
| IA locale | Reporter le choix du modèle après mesure. | Séparer qualité, coût, matériel, licences du code et des poids. Demucs déclare MIT pour son code. Les droits des modèles et des données doivent être vérifiés séparément. |

Référence : [licence du code Demucs](https://github.com/facebookresearch/demucs/blob/main/LICENSE).
