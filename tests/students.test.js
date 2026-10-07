import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createStore } from '../src/data.js';

let store;
let app;
const valid = { firstName: 'Alice', lastName: 'Dupont', email: 'alice@example.com', grade: 14, field: 'informatique' };
beforeEach(() => {
  store = createStore();
  store.reset();
  app = createApp(store);
});

async function expectError(call, status) {
  const response = await call.expect('Content-Type', /json/).expect(status);
  assert.equal(typeof response.body.error, 'string');
  assert.ok(response.body.error.length > 0);
}

test('GET /students : 200 et tableau JSON', async () => {
  const response = await request(app).get('/students').expect('Content-Type', /json/).expect(200);
  assert.ok(Array.isArray(response.body));
});
test('GET /students : cinq étudiants initiaux', async () => {
  const response = await request(app).get('/students').expect(200);
  assert.equal(response.body.length, 5);
  assert.deepEqual(response.body, store.students);
});
test('GET par ID : étudiant correspondant', async () => {
  const response = await request(app).get('/students/1').expect(200);
  assert.deepEqual(response.body, store.students[0]);
});
test('GET par ID inexistant : 404', async () => {
  await expectError(request(app).get('/students/999'), 404);
});
for (const id of ['abc', '1abc', '1.5', '-1', '0', '9007199254740992']) {
  test(`GET ID invalide ${id} : 400`, async () => {
    await expectError(request(app).get(`/students/${id}`), 400);
  });
}
test('POST valide : 201, ID auto-généré et persistance', async () => {
  const response = await request(app).post('/students').send({ ...valid, id: 100 }).expect(201);
  assert.deepEqual(response.body, { id: 6, ...valid });
  const read = await request(app).get('/students/6').expect(200);
  assert.deepEqual(read.body, response.body);
});
for (const key of Object.keys(valid)) {
  test(`POST sans ${key} : 400 et aucune mutation`, async () => {
    const body = { ...valid };
    delete body[key];
    await expectError(request(app).post('/students').send(body), 400);
    assert.equal(store.students.length, 5);
    assert.equal(store.nextId, 6);
  });
}
for (const [key, value] of [
  ['firstName', 'A'], ['lastName', ' '], ['firstName', 12],
  ['email', 'invalide'], ['email', 'a@@example.com'], ['email', null],
  ['grade', 25], ['grade', -1], ['grade', '14'], ['grade', null], ['grade', true],
  ['field', 'biologie'], ['field', null]
]) {
  test(`POST ${key}=${JSON.stringify(value)} : 400`, async () => {
    await expectError(request(app).post('/students').send({ ...valid, [key]: value }), 400);
  });
}
test('POST email déjà utilisé : 409', async () => {
  await expectError(request(app).post('/students').send({ ...valid, email: 'ahmed@example.com' }), 409);
  assert.equal(store.students.length, 5);
});
test('POST normalise les espaces et la casse de l’email', async () => {
  const response = await request(app).post('/students').send({ ...valid, firstName: ' Alice ', email: ' ALICE@EXAMPLE.COM ' }).expect(201);
  assert.equal(response.body.firstName, 'Alice');
  assert.equal(response.body.email, valid.email);
  await expectError(request(app).post('/students').send(valid), 409);
});
for (const grade of [0, 20, 14.75]) {
  test(`POST accepte la note ${grade}`, async () => {
    const response = await request(app).post('/students').send({ ...valid, grade }).expect(201);
    assert.equal(response.body.grade, grade);
  });
}
test('POST sans corps : 400 JSON', async () => {
  await expectError(request(app).post('/students'), 400);
});
test('POST avec tableau : 400 JSON', async () => {
  await expectError(request(app).post('/students').send([]), 400);
});
test('POST avec JSON mal formé : 400 JSON', async () => {
  await expectError(request(app).post('/students').set('Content-Type', 'application/json').send('{'), 400);
});
test('POST trop volumineux : 413 JSON', async () => {
  await expectError(request(app).post('/students').send({ ...valid, firstName: 'a'.repeat(17000) }), 413);
});
test('PUT valide : 200, remplacement et conservation de l’ID', async () => {
  const response = await request(app).put('/students/1').send({ ...valid, id: 90 }).expect(200);
  assert.deepEqual(response.body, { id: 1, ...valid });
  assert.deepEqual(store.students[0], response.body);
  assert.equal(store.students.length, 5);
});
test('PUT inexistant : 404', async () => {
  await expectError(request(app).put('/students/999').send(valid), 404);
});
test('PUT invalide : 400 et étudiant inchangé', async () => {
  const before = structuredClone(store.students[0]);
  await expectError(request(app).put('/students/1').send({ ...valid, grade: 30 }), 400);
  assert.deepEqual(store.students[0], before);
});
test('PUT exige tous les champs', async () => {
  await expectError(request(app).put('/students/1').send({ grade: 18 }), 400);
});
test('PUT email d’un autre étudiant : 409', async () => {
  await expectError(request(app).put('/students/1').send({ ...valid, email: 'LEA@example.com' }), 409);
  assert.equal(store.students[0].email, 'ahmed@example.com');
});
test('PUT peut conserver son propre email', async () => {
  const response = await request(app).put('/students/1').send({ ...store.students[0], grade: 20 }).expect(200);
  assert.equal(response.body.grade, 20);
  assert.equal(response.body.email, 'ahmed@example.com');
});
test('PUT ID invalide : 400', async () => {
  await expectError(request(app).put('/students/abc').send(valid), 400);
});
test('DELETE valide : 200, confirmation et suppression effective', async () => {
  const response = await request(app).delete('/students/1').expect(200);
  assert.deepEqual(response.body, { message: 'Étudiant supprimé.', id: 1 });
  await expectError(request(app).get('/students/1'), 404);
  assert.equal(store.students.length, 4);
});
test('DELETE inexistant : 404', async () => {
  await expectError(request(app).delete('/students/999'), 404);
});
test('DELETE ID invalide : 400', async () => {
  await expectError(request(app).delete('/students/abc'), 400);
});
test('Un ID supprimé n’est pas réutilisé', async () => {
  await request(app).delete('/students/5').expect(200);
  const response = await request(app).post('/students').send(valid).expect(201);
  assert.equal(response.body.id, 6);
});
test('Statistiques : valeurs exactes et meilleur étudiant', async () => {
  const response = await request(app).get('/students/stats').expect(200);
  assert.deepEqual(response.body, {
    totalStudents: 5, averageGrade: 14,
    studentsByField: { informatique: 2, mathématiques: 1, physique: 1, chimie: 1 },
    bestStudent: store.students[1]
  });
});
test('Statistiques : moyenne arrondie à deux décimales', async () => {
  await request(app).post('/students').send(valid).expect(201);
  await request(app).put('/students/6').send({ ...valid, grade: 15 }).expect(200);
  const response = await request(app).get('/students/stats').expect(200);
  assert.equal(response.body.averageGrade, 14.17);
});
test('Statistiques sur liste vide', async () => {
  for (let id = 1; id <= 5; id++) await request(app).delete(`/students/${id}`).expect(200);
  const response = await request(app).get('/students/stats').expect(200);
  assert.deepEqual(response.body, {
    totalStudents: 0, averageGrade: 0, bestStudent: null,
    studentsByField: { informatique: 0, mathématiques: 0, physique: 0, chimie: 0 }
  });
});
test('Recherche par prénom insensible à la casse', async () => {
  const response = await request(app).get('/students/search').query({ q: ' AHmEd ' }).expect(200);
  assert.deepEqual(response.body, [store.students[0]]);
});
test('Recherche par portion du nom', async () => {
  const response = await request(app).get('/students/search').query({ q: 'ART' }).expect(200);
  assert.deepEqual(response.body, [store.students[1]]);
});
test('Recherche avec caractères accentués', async () => {
  const response = await request(app).get('/students/search').query({ q: 'LÉA' }).expect(200);
  assert.deepEqual(response.body, [store.students[1]]);
});
test('Recherche sans résultat : tableau vide', async () => {
  const response = await request(app).get('/students/search?q=zzz').expect(200);
  assert.deepEqual(response.body, []);
});
for (const query of ['', '?q=', '?q=%20%20', '?q=a&q=b']) {
  test(`Recherche invalide ${query} : 400`, async () => {
    await expectError(request(app).get(`/students/search${query}`), 400);
  });
}
test('Pagination : deuxième page de deux étudiants', async () => {
  const response = await request(app).get('/students?page=2&limit=2').expect(200);
  assert.deepEqual(response.body.map(student => student.id), [3, 4]);
});
test('Tri décroissant par note puis pagination', async () => {
  const response = await request(app).get('/students?sort=grade&order=desc&limit=2').expect(200);
  assert.deepEqual(response.body.map(student => student.grade), [18, 16]);
  assert.equal(store.students[0].id, 1);
});
test('Tri alphabétique par prénom', async () => {
  const response = await request(app).get('/students?sort=firstName').expect(200);
  assert.deepEqual(response.body.map(student => student.firstName), ['Ahmed', 'Hugo', 'Inès', 'Léa', 'Nora']);
});
test('Pagination hors liste : tableau vide', async () => {
  const response = await request(app).get('/students?page=10').expect(200);
  assert.deepEqual(response.body, []);
});
for (const query of ['page=0', 'page=abc', 'limit=101', 'limit=-1', 'sort=email', 'sort=grade&order=bad', 'order=desc']) {
  test(`Options invalides ${query} : 400`, async () => {
    await expectError(request(app).get(`/students?${query}`), 400);
  });
}
test('Reset : restaure les données initiales et le compteur', async () => {
  await request(app).delete('/students/1').expect(200);
  await request(app).post('/students').send(valid).expect(201);
  store.reset();
  assert.equal(store.students.length, 5);
  assert.equal(store.students[0].firstName, 'Ahmed');
  assert.equal(store.nextId, 6);
});
test('Deux applications possèdent des données indépendantes', async () => {
  const other = createApp();
  await request(app).delete('/students/1').expect(200);
  const response = await request(other).get('/students/1').expect(200);
  assert.equal(response.body.firstName, 'Ahmed');
});
test('Route inconnue : erreur JSON', async () => {
  await expectError(request(app).get('/unknown'), 404);
});
