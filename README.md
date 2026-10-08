# Annuaire d'étudiants — API REST et CI

[![CI](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/workflows/ci.yml/badge.svg)](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD/actions/workflows/ci.yml)

TP CI/CD, chapitre 1. API Express avec stockage en mémoire, tests HTTP automatisés, ESLint et GitHub Actions sur Node.js 22 et 24.

## Installation et commandes

Prérequis : Node.js 22 ou 24 et npm (fourni avec une installation standard de Node.js).

```bash
npm ci
npm start
```

L'API écoute sur `http://localhost:3000`. La variable d'environnement `PORT` permet de changer le port. Les données sont réinitialisées à chaque redémarrage.

| Commande | Utilité |
| --- | --- |
| `npm start` | Démarrer le serveur |
| `npm run dev` | Redémarrage automatique à chaque modification |
| `npm test` | Lancer les tests HTTP avec Supertest et le runner Node.js |
| `npm run lint` | Vérifier la qualité et la mise en forme du code |
| `npm run test:coverage` | Tests et couverture c8, rapport dans `coverage/lcov.info` |
| `npm run check` | Linter puis tests avec couverture |

## Structure

```text
.github/workflows/ci.yml   Pipeline CI
src/data.js               Données initiales et fonction reset()
src/validation.js         Validation des champs et des identifiants
src/routes.js             Routes de l'annuaire
src/app.js                Création de l'application sans ouvrir de port
src/server.js             Démarrage du serveur
tests/students.test.js    Tests indépendants avec reset avant chaque test
eslint.config.js          Règles du linter
package-lock.json         Versions exactes installées par npm ci
requests.http             Requêtes pour vérification manuelle
docs/RENDU.md             Publication et preuve Red → Green
```

## Modèle et validation

| Champ | Type et contraintes |
| --- | --- |
| `id` | Entier positif auto-incrémenté ; fourni par le serveur |
| `firstName`, `lastName` | Chaînes d'au moins 2 caractères après suppression des espaces aux extrémités |
| `email` | Adresse de forme `nom@domaine.extension`, unique sans distinction de casse |
| `grade` | Nombre entre 0 et 20 inclus ; décimales autorisées |
| `field` | `informatique`, `mathématiques`, `physique` ou `chimie` |

Tous les champs sauf `id` sont obligatoires pour POST **et** PUT. PUT remplace l'ensemble des champs modifiables. Les propriétés supplémentaires sont ignorées, notamment un `id` envoyé par le client. Un ID supprimé n'est pas réutilisé avant un reset. L'email est enregistré en minuscules.

## Endpoints

Toutes les réponses sont en JSON, y compris les erreurs (`{"error":"message explicatif"}`).

| Méthode | Route | Réponse et erreurs |
| --- | --- | --- |
| GET | `/students` | 200 : tableau de tous les étudiants |
| GET | `/students/:id` | 200 : étudiant ; 400 : ID invalide ; 404 : absent |
| POST | `/students` | 201 : étudiant créé ; 400 : données invalides ; 409 : email utilisé |
| PUT | `/students/:id` | 200 : étudiant modifié ; 400 : ID/données invalides ; 404 : absent ; 409 : email d'un autre étudiant |
| DELETE | `/students/:id` | 200 : confirmation ; 400 : ID invalide ; 404 : absent |
| GET | `/students/stats` | 200 : statistiques de tous les étudiants |
| GET | `/students/search?q=terme` | 200 : correspondances ; 400 : q absent, vide ou répété |

Les identifiants doivent être des entiers strictement positifs représentables exactement en JavaScript. `abc`, `1abc`, `1.5` et `0` sont rejetés. Pour PUT, la recherche de l'étudiant précède la validation du corps.

### Lecture et recherche

```bash
curl http://localhost:3000/students
curl http://localhost:3000/students/1
curl "http://localhost:3000/students/search?q=ahmed"
```

La recherche porte sur une partie du nom **ou** du prénom, sans distinction de casse. Les accents sont conservés (`LÉA` correspond à `Léa`). Aucun résultat donne `[]`.

### Création et modification

```bash
curl -X POST http://localhost:3000/students -H "Content-Type: application/json" -d '{"firstName":"Alice","lastName":"Dupont","email":"alice@example.com","grade":14,"field":"informatique"}'
```

Réponse 201 après un démarrage neuf :

```json
{"id":6,"firstName":"Alice","lastName":"Dupont","email":"alice@example.com","grade":14,"field":"informatique"}
```

```bash
curl -X PUT http://localhost:3000/students/6 -H "Content-Type: application/json" -d '{"firstName":"Alice","lastName":"Dupont","email":"alice@example.com","grade":18,"field":"informatique"}'
curl -X DELETE http://localhost:3000/students/6
```

Réponse de suppression : `{"message":"Étudiant supprimé.","id":6}`. Pour Windows, le fichier `requests.http` évite les différences de guillemets entre les terminaux ; il s'utilise avec l'extension REST Client de VS Code.

### Statistiques

```bash
curl http://localhost:3000/students/stats
```

Réponse avec les données initiales :

```json
{
  "totalStudents": 5,
  "averageGrade": 14,
  "studentsByField": {"informatique": 2, "mathématiques": 1, "physique": 1, "chimie": 1},
  "bestStudent": {"id": 2, "firstName": "Léa", "lastName": "Martin", "email": "lea@example.com", "grade": 18, "field": "mathématiques"}
}
```

`bestStudent` contient l'objet étudiant ayant la meilleure note (premier rencontré en cas d'égalité). Une liste vide donne une moyenne de 0 et `bestStudent: null`. Toutes les filières restent présentes avec un compteur à 0. La moyenne est arrondie à deux décimales au maximum ; JSON n'affiche pas les zéros décimaux inutiles.

### Bonus : pagination et tri

```bash
curl "http://localhost:3000/students?page=1&limit=2&sort=grade&order=desc"
```

`page` commence à 1, `limit` est compris entre 1 et 100. Si un seul des deux paramètres est fourni, les valeurs par défaut sont `page=1` et `limit=10`. Sans ces paramètres, toute la liste est retournée. Une page au-delà de la liste donne `[]`.

`sort` accepte `id`, `firstName`, `lastName`, `grade` et `field`. `order` vaut `asc` par défaut ou `desc`. Un `order` sans `sort` est invalide. Le tri précède la pagination et ne modifie pas le stockage. Les paramètres de pagination/tri invalides donnent 400.

## Tests et linter

Les tests couvrent les 15 scénarios obligatoires, les validations par champ, les conflits d'email sur POST et PUT, les notes limites, la persistance des modifications, les statistiques exactes et vides, les recherches, la pagination et le tri. Chaque test dispose de données réinitialisées.

ESLint interdit les variables inutilisées et les `console.log`, impose une indentation de deux espaces, des points-virgules et des comparaisons strictes. Une erreur de lint arrête le pipeline avant les tests.

## Pipeline

Chaque push déclenche la CI, ainsi que les pull requests vers `main`. Deux jobs exécutent les mêmes vérifications avec Node.js 22 et 24 : Checkout → Setup → Install (`npm ci`) → Lint → Test et couverture. Un lancement manuel est également possible depuis Actions.

Le dépôt public est [AYZERTY/API-REST-Pipeline-CI-CD](https://github.com/AYZERTY/API-REST-Pipeline-CI-CD). Les liens des exécutions et les captures du cycle Red → Green sont regroupés dans [les preuves du rendu](docs/RENDU.md).

Références : [Express : gestion des erreurs](https://expressjs.com/en/5x/guide/error-handling/), [GitHub : construire et tester un projet Node.js](https://docs.github.com/en/actions/tutorials/build-and-test-code/nodejs), [setup-node](https://github.com/actions/setup-node).
