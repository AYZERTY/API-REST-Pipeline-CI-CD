export const fields = ['informatique', 'mathématiques', 'physique', 'chimie'];

const initialStudents = [
  { id: 1, firstName: 'Ahmed', lastName: 'Ben Ali', email: 'ahmed@example.com', grade: 15, field: 'informatique' },
  { id: 2, firstName: 'Léa', lastName: 'Martin', email: 'lea@example.com', grade: 18, field: 'mathématiques' },
  { id: 3, firstName: 'Nora', lastName: 'Petit', email: 'nora@example.com', grade: 12, field: 'physique' },
  { id: 4, firstName: 'Hugo', lastName: 'Durand', email: 'hugo@example.com', grade: 9, field: 'chimie' },
  { id: 5, firstName: 'Inès', lastName: 'Robert', email: 'ines@example.com', grade: 16, field: 'informatique' }
];

// Une instance par application : les tests ne partagent pas leurs mutations.
export function createStore() {
  const store = {
    students: [],
    nextId: 1,
    reset() {
      this.students = structuredClone(initialStudents);
      this.nextId = Math.max(...this.students.map(student => student.id)) + 1;
    }
  };
  store.reset();
  return store;
}
