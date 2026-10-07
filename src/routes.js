import { Router } from 'express';
import { fields } from './data.js';
import { parseId, validateStudent } from './validation.js';

export function createStudentRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    let students = [...store.students];
    const { sort, order = 'asc', page, limit } = req.query;
    if (sort !== undefined || req.query.order !== undefined) {
      if (!['id', 'firstName', 'lastName', 'grade', 'field'].includes(sort) || !['asc', 'desc'].includes(order)) {
        return res.status(400).json({ error: 'Tri invalide : sort et order=asc|desc attendus.' });
      }
      students.sort((a, b) => {
        const comparison = typeof a[sort] === 'number' ? a[sort] - b[sort] : a[sort].localeCompare(b[sort], 'fr');
        return order === 'asc' ? comparison : -comparison;
      });
    }
    if (page !== undefined || limit !== undefined) {
      const pageNumber = parseId(page ?? '1');
      const pageSize = parseId(limit ?? '10');
      if (pageNumber === null || pageSize === null || pageSize > 100) {
        return res.status(400).json({ error: 'page et limit doivent être des entiers positifs ; limit maximum : 100.' });
      }
      const start = (pageNumber - 1) * pageSize;
      students = students.slice(start, start + pageSize);
    }
    return res.json(students);
  });

  // Les routes nommées précèdent /:id pour ne pas être prises pour des identifiants.
  router.get('/stats', (_req, res) => {
    const students = store.students;
    const studentsByField = Object.fromEntries(fields.map(field => [field, 0]));
    let total = 0;
    let bestStudent = null;
    for (const student of students) {
      total += student.grade;
      studentsByField[student.field] += 1;
      if (bestStudent === null || student.grade > bestStudent.grade) bestStudent = student;
    }
    return res.json({
      totalStudents: students.length,
      averageGrade: students.length ? Number((total / students.length).toFixed(2)) : 0,
      studentsByField,
      bestStudent
    });
  });

  router.get('/search', (req, res) => {
    if (typeof req.query.q !== 'string' || !req.query.q.trim()) {
      return res.status(400).json({ error: 'Le paramètre q est obligatoire et ne doit pas être vide.' });
    }
    const term = req.query.q.trim().toLowerCase();
    return res.json(store.students.filter(student =>
      student.firstName.toLowerCase().includes(term) || student.lastName.toLowerCase().includes(term)
    ));
  });

  router.post('/', (req, res) => {
    const result = validateStudent(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    if (store.students.some(student => student.email === result.student.email)) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }
    const student = { id: store.nextId++, ...result.student };
    store.students.push(student);
    return res.status(200).json(student);
  });

  router.param('id', (req, res, next, value) => {
    const id = parseId(value);
    if (id === null) return res.status(400).json({ error: 'ID invalide : entier strictement positif attendu.' });
    const student = store.students.find(student => student.id === id);
    if (!student) return res.status(404).json({ error: 'Étudiant introuvable.' });
    req.student = student;
    return next();
  });

  router.get('/:id', (req, res) => res.json(req.student));

  router.put('/:id', (req, res) => {
    const result = validateStudent(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    if (store.students.some(student => student.id !== req.student.id && student.email === result.student.email)) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }
    Object.assign(req.student, result.student);
    return res.json(req.student);
  });

  router.delete('/:id', (req, res) => {
    store.students = store.students.filter(student => student.id !== req.student.id);
    return res.json({ message: 'Étudiant supprimé.', id: req.student.id });
  });

  return router;
}
