// Datos ficticios, deterministas y sin información personal. Ninguno representa
// una asignación, descarga, notificación o resultado confirmado por el servidor.
const copy = (es, en) => ({ es, en });
const subjects = [
  { id: 'math', icon: 'math', tone: 'blue', name: copy('Matemática', 'Mathematics') },
  { id: 'reading', icon: 'book', tone: 'purple', name: copy('Comunicación', 'Language Arts') },
  { id: 'science', icon: 'science', tone: 'green', name: copy('Ciencia y Tecnología', 'Science & Technology') },
  { id: 'social', icon: 'globe', tone: 'orange', name: copy('Personal Social', 'Social Studies') },
  { id: 'english', icon: 'language', tone: 'pink', name: copy('Inglés', 'English') },
];
const topics = {
  4: [copy('Fracciones básicas', 'Basic fractions'), copy('Comprensión lectora', 'Reading comprehension'), copy('Ecosistemas', 'Ecosystems'), copy('Mi comunidad', 'My community'), copy('Vocabulario básico', 'Basic vocabulary')],
  5: [copy('Decimales', 'Decimals'), copy('Textos informativos', 'Informational texts'), copy('Cuerpo humano', 'The human body'), copy('Organización de la sociedad', 'How society is organised'), copy('Inglés cotidiano', 'Everyday English')],
  6: [copy('Porcentajes', 'Percentages'), copy('Comprensión avanzada', 'Advanced comprehension'), copy('Energía', 'Energy'), copy('Ciudadanía', 'Citizenship'), copy('Comunicación en inglés', 'Communicating in English')],
};
const progress = { 4: [45, 30, 20, 0, 35], 5: [70, 45, 30, 20, 55], 6: [80, 65, 50, 35, 60] };
const counts = { 4: { lessons: 18, activities: 26, achievements: 3, streak: 4 }, 5: { lessons: 32, activities: 48, achievements: 6, streak: 7 }, 6: { lessons: 46, activities: 67, achievements: 9, streak: 9 } };
const notificationData = [
  { icon: 'calendar', title: copy('Nueva evaluación asignada', 'New assessment assigned'), body: copy('Ejemplo: consulta la evaluación de Matemática de tu agenda.', 'Example: check the Mathematics assessment in your planner.') },
  { icon: 'clock', title: copy('Actividad próxima', 'Upcoming activity'), body: copy('Ejemplo: lectura guiada en tu próxima clase.', 'Example: guided reading in your next class.') },
  { icon: 'target', title: copy('Misión disponible', 'Mission available'), body: copy('Ejemplo: descubre los tres retos de tu misión diaria.', 'Example: discover the three tasks in your daily mission.') },
  { icon: 'download', title: copy('Contenido educativo actualizado', 'Educational content updated'), body: copy('Ejemplo de aviso. No se ha descargado ni actualizado contenido real.', 'Example notice. No real content has been downloaded or updated.') },
];

export function getStudentDemo(grade = 5) {
  if (![4, 5, 6].includes(grade)) throw new RangeError('Grado demostrativo no válido.');
  const courses = subjects.map((subject, index) => ({ ...subject, topic: topics[grade][index], grade, progress: progress[grade][index], download: 'not-downloaded' }));
  return {
    demonstration: true,
    profile: { alias: 'Explorador', grade, initials: 'EX' },
    courses,
    summary: { ...counts[grade], courses: courses.filter(course => course.progress > 0 && course.progress < 100).length, progress: Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length) },
    continueLearning: {
      course: 'math', progress: progress[grade][0],
      lesson: grade === 5 ? copy('Relaciona fracciones y decimales', 'Connect fractions and decimals') : topics[grade][0],
      description: copy('Pequeños pasos, grandes descubrimientos. Retoma la lección y sigue construyendo lo que sabes.', 'Small steps, big discoveries. Pick up your lesson and keep building your knowledge.'),
    },
    mission: {
      reward: 20,
      tasks: [
        { done: true, label: copy('Leer una lección', 'Read one lesson') },
        { done: false, label: copy('Resolver tres ejercicios', 'Solve three exercises') },
        { done: false, label: copy('Aprender cinco palabras', 'Learn five words') },
      ],
    },
    activities: [
      { icon: 'check', title: copy('Lección completada', 'Lesson completed'), course: courses[0].name, detail: courses[0].topic, when: copy('Hace 1 día · Muestra', '1 day ago · Sample'), state: copy('Completada', 'Completed') },
      { icon: 'practice', title: copy('Práctica terminada', 'Practice finished'), course: courses[4].name, detail: courses[4].topic, when: copy('Hace 2 días · Muestra', '2 days ago · Sample'), state: copy('Terminada', 'Finished') },
      { icon: 'clipboard', title: copy('Evaluación enviada', 'Assessment submitted'), course: courses[1].name, detail: courses[1].topic, when: copy('Hace 3 días · Muestra', '3 days ago · Sample'), state: copy('Enviada', 'Submitted') },
    ],
    // Fechas de una agenda ficticia, no una ventana real de disponibilidad.
    evaluations: [
      { id: 'math-evaluation', day: '12', month: copy('NOV', 'NOV'), date: copy('12 de noviembre de 2026', '12 November 2026'), time: '09:00', course: courses[0].name, topic: courses[0].topic, status: 'upcoming' },
      { id: 'reading-evaluation', day: '16', month: copy('NOV', 'NOV'), date: copy('16 de noviembre de 2026', '16 November 2026'), time: '10:30', course: courses[1].name, topic: courses[1].topic, status: 'upcoming' },
    ],
    notifications: notificationData,
  };
}
