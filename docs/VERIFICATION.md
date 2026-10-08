# Vérifications réalisées le 7 octobre 2026

Environnement local : Windows, Node.js 24.19.0.

| Vérification | Résultat observé |
| --- | --- |
| ESLint | 0 erreur, 0 avertissement |
| Tests automatisés | 74 réussis, 0 échec |
| Couverture des lignes | 99,42 % |
| Couverture des branches | 98,92 % |
| Couverture des fonctions | 100 % |
| Requêtes sur un serveur réellement démarré | 10 scénarios validés |
| Bug volontaire local : POST renvoie 200 au lieu de 201 | Test de création en échec, code de sortie 1 |
| Correction locale : restauration du statut 201 | 74 tests réussis, code de sortie 0 |

La couverture concerne `app.js`, `data.js`, `routes.js` et `validation.js`. Le fichier de lancement `server.js` est exclu de ce calcul mais a été utilisé pour la vérification HTTP réelle. La ligne non couverte correspond à l'erreur interne générique 500.

Les journaux joints sont des résultats **locaux** : `verification-http.txt`, `verification-rouge-local.txt` et `verification-verte-locale.txt`. Ils complètent les preuves GitHub Actions présentées dans `RENDU.md`.

Les exécutions GitHub sur Node.js 22 et 24 ont réussi à l'état initial, échoué après le bug volontaire, puis réussi après correction le 8 octobre 2026. Les liens et captures sont disponibles dans `RENDU.md` et `captures/`.

L'historique publié a été créé via l'interface GitHub du compte AYZERTY avec des messages Conventional Commits. Le projet a été préparé avec une assistance IA.
