export const evaluationsDemo = Object.freeze([
 {
  id: 'eval-mat-4-01',
  title: 'Matemática - Números y operaciones',
  description: 'Operaciones básicas, valor posicional y resolución de problemas.',
  grade: 4,
  course: 'Matemática',
  unit: 'Unidad 1',
  topic: 'Números y operaciones',
  teacher: 'Docente demostrativo',
  questionCount: 10,
  durationMinutes: 30,
  startDate: new Date(Date.now() - 3600*1000).toISOString(),
  endDate: new Date(Date.now() + 7*24*3600*1000).toISOString(),
  attemptsAllowed: 1,
  attemptsUsed: 0,
  policy: { showResults: false, reviewAllowed: false },
  offline: true,
  status: 'disponible'
 },
 {
  id: 'eval-com-4-01',
  title: 'Comunicación - Comprensión lectora',
  description: 'Comprensión de textos, ideas principales y vocabulario.',
  grade: 4,
  course: 'Comunicación',
  unit: 'Unidad 1',
  topic: 'Comprensión lectora',
  teacher: 'Docente demostrativo',
  questionCount: 8,
  durationMinutes: 25,
  startDate: new Date(Date.now() + 2*24*3600*1000).toISOString(),
  endDate: new Date(Date.now() + 9*24*3600*1000).toISOString(),
  attemptsAllowed: 1,
  attemptsUsed: 0,
  policy: { showResults: false, reviewAllowed: false },
  offline: true,
  status: 'programada'
 },
 {
  id: 'eval-cyt-5-01',
  title: 'Ciencia y Tecnología - Seres vivos',
  description: 'Clasificación, ecosistemas y cuidados.',
  grade: 5,
  course: 'Ciencia y Tecnología',
  unit: 'Unidad 2',
  topic: 'Seres vivos',
  teacher: 'Docente demostrativo',
  questionCount: 10,
  durationMinutes: 30,
  startDate: new Date(Date.now() - 48*3600*1000).toISOString(),
  endDate: new Date(Date.now() - 12*3600*1000).toISOString(),
  attemptsAllowed: 1,
  attemptsUsed: 1,
  policy: { showResults: true, reviewAllowed: true },
  offline: true,
  status: 'finalizada'
 },
 {
  id: 'eval-ps-6-01',
  title: 'Personal Social - Convivencia',
  description: 'Normas, derechos y responsabilidades.',
  grade: 6,
  course: 'Personal Social',
  unit: 'Unidad 1',
  topic: 'Convivencia',
  teacher: 'Docente demostrativo',
  questionCount: 9,
  durationMinutes: 25,
  startDate: new Date(Date.now() - 3600*1000).toISOString(),
  endDate: new Date(Date.now() + 5*24*3600*1000).toISOString(),
  attemptsAllowed: 2,
  attemptsUsed: 1,
  policy: { showResults: false, reviewAllowed: false },
  offline: true,
  status: 'en-progreso'
 },
 {
  id: 'eval-ing-6-01',
  title: 'Inglés - Daily routine',
  description: 'Vocabulary and reading comprehension.',
  grade: 6,
  course: 'Inglés',
  unit: 'Unit 1',
  topic: 'Daily routine',
  teacher: 'Docente demostrativo',
  questionCount: 8,
  durationMinutes: 20,
  startDate: new Date(Date.now() - 3600*1000).toISOString(),
  endDate: new Date(Date.now() + 3*24*3600*1000).toISOString(),
  attemptsAllowed: 1,
  attemptsUsed: 0,
  policy: { showResults: false, reviewAllowed: false },
  offline: true,
  status: 'disponible'
 }
]);

export function getEvaluation(id){
 return evaluationsDemo.find(e=>e.id===id) || null;
}
export function listEvaluations(filters={}){
 let items = [...evaluationsDemo];
 if(filters.grade) items = items.filter(i=>i.grade===Number(filters.grade));
 if(filters.course && filters.course!=='all') items = items.filter(i=>i.course===filters.course);
 if(filters.status && filters.status!=='all'){
  items = items.filter(i=>i.status===filters.status);
 }
 return items;
}
