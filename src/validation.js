import { fields } from './data.js';

export function parseId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function validateStudent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Un objet JSON est attendu.' };
  }
  const student = {};
  for (const key of ['firstName', 'lastName']) {
    if (typeof body[key] !== 'string' || [...body[key].trim()].length < 2) {
      return { error: `${key} doit contenir au moins 2 caractères.` };
    }
    student[key] = body[key].trim();
  }
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return { error: 'email doit être une adresse valide.' };
  }
  student.email = body.email.trim().toLowerCase();
  if (typeof body.grade !== 'number' || !Number.isFinite(body.grade) || body.grade < 0 || body.grade > 20) {
    return { error: 'grade doit être un nombre compris entre 0 et 20.' };
  }
  student.grade = body.grade;
  if (!fields.includes(body.field)) {
    return { error: `field doit être une des valeurs : ${fields.join(', ')}.` };
  }
  student.field = body.field;
  return { student };
}
