# Rendu du TP — API REST et pipeline CI

Dépôt public : [AYZERTY/API-REST-Pipeline-CI-CD](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD).

## Cycle Red → Green réalisé

| Étape | Commit | Résultat GitHub Actions |
| --- | --- | --- |
| État initial | 56fb987 | [Vert sur Node.js 22 et 24](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/runs/37649331410) |
| Bug volontaire | c9e06e1 | [Rouge : statut HTTP incorrect](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/runs/37649553597) |
| Correction | 197031f | [Vert sur Node.js 22 et 24](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/runs/37823904766) |

Le 7 octobre 2026, le statut de création de POST /students a été changé volontairement de 201 à 200. Le linter a réussi, mais les tests HTTP ont détecté cette régression : `expected 201 "Created", got 200 "OK"`. Le 8 octobre, le statut 201 a été rétabli sans modifier les tests. Les deux versions de Node.js ont ensuite réussi le pipeline.

- [Capture du pipeline rouge](captures/pipeline-rouge.jpg)
- [Capture du pipeline vert après correction](captures/pipeline-vert.jpg)
- [Détail de l'erreur détectée](captures/pipeline-rouge-detail.jpg)
- [État du pipeline le plus récent](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/workflows/ci.yml)
- [Historique des Conventional Commits](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/commits/main/)

## Exécuter le projet

Installer Node.js 22 ou 24, cloner le dépôt, puis exécuter `npm ci` et `npm start`. Le serveur écoute sur http://localhost:3000. `npm run check` lance le linter puis les tests et la couverture. Le README contient la documentation des routes ; `requests.http` fournit les requêtes manuelles.

## Pour expliquer le fonctionnement

- Une API REST expose des routes HTTP : GET lit, POST crée, PUT remplace, DELETE supprime.
- Le tableau en mémoire disparaît au redémarrage ; `reset()` restaure les cinq exemples et le compteur d'IDs.
- `createApp()` ne démarre pas le serveur ; Supertest teste l'application sans lancement manuel.
- Chaque test vérifie le statut HTTP et le contenu ou l'effet de la réponse.
- Le linter vérifie les règles du code ; les tests vérifient les comportements.
- La matrice répète les vérifications sur deux versions Node.js.
- Le cycle rouge/vert démontre que les tests détectent réellement une régression.
- Le TP réalise une intégration continue (CI). Aucun déploiement automatique en production n'est demandé.

Les fichiers ont été préparés avec une assistance IA, puis publiés via l'interface GitHub. Les résultats et captures correspondent à des exécutions réelles.
