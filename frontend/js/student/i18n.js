const messages = {
 es: {
  workspaceTitle: 'Estudiante', workspaceSubtitle: 'Espacio académico', workspaceLabel: 'ESPACIO ACADÉMICO', overviewTitle: 'Mi aprendizaje', overviewDescription: 'Continúa tus lecciones y consulta tus actividades.', guideAction: 'Guía de uso', guideShort: 'Ayuda', demoShort: 'Demostración', sampleData: 'Datos ficticios',
  navLearning: 'Aprendizaje', navTracking: 'Seguimiento', navTools: 'Herramientas',
  evaluations: 'Evaluaciones', agenda: 'Agenda',
  dashboard: 'Inicio del estudiante', greeting: '¡Hola, {alias}!', subtitle: '¡Sigue aprendiendo! Cada día es una nueva oportunidad.',
  demo: 'Vista de demostración', demoNote: 'Perfil ficticio. Los avances y actividades son de muestra.', demoGrade: 'Grado de muestra', grade: '{grade}.º primaria', language: 'Idioma',
  home: 'Inicio', courses: 'Mis cursos', practice: 'Practica', games: 'Juegos', tutor: 'Tutor IA', translator: 'Traductor', pronunciation: 'Pronunciación', assessments: 'Evaluaciones', missions: 'Misiones', planner: 'Agenda', progress: 'Progreso', achievements: 'Logros', downloads: 'Mis descargas', profile: 'Mi perfil',
  learn: 'Aprende', more: 'Más', menu: 'Abrir menú de secciones', navigation: 'Navegación del estudiante', collapse: 'Contraer barra lateral', expand: 'Expandir barra lateral', backProfiles: 'Vista previa de perfiles',
  online: 'Con conexión', offline: 'Sin conexión', connectionHelp: 'Señal orientativa del navegador; no verifica la disponibilidad del servidor.',
  offlineNote: 'No hay conexión de red.', offlineLimit: 'Consulta Mis descargas para comprobar qué recursos están disponibles en este dispositivo. Los cambios remotos requieren conexión.',
  notifications: 'Notificaciones', sampleNotifications: 'Notificaciones de muestra', noNotifications: 'No hay notificaciones para mostrar.', close: 'Cerrar', userMenu: 'Menú de usuario', settings: 'Configuración', logout: 'Cerrar sesión', exitDemo: 'No hay una sesión real que cerrar. Puedes salir de la demostración y volver al inicio.', goLogin: 'Volver al inicio de sesión',
  overview: 'Tu aprendizaje, paso a paso', overviewSub: 'Cada pequeño esfuerzo cuenta. ¡Vamos por un nuevo descubrimiento!',
  coursesInProgress: 'Cursos en progreso', lessonsCompleted: 'Lecciones completadas', streak: 'Racha de aprendizaje', days: 'días',
  continueTitle: 'Continúa aprendiendo', unit: 'Unidad', lesson: 'Lección', continueLearning: 'Continuar aprendiendo', progressLabel: 'Avance',
  yourCourses: 'Mis cursos', courseHint: 'Cinco áreas para explorar a tu ritmo', continue: 'Continuar', explore: 'Explorar', notDownloaded: 'No descargado',
  myProgress: 'Mi progreso', generalProgress: 'Progreso general', completedLessons: 'lecciones completadas', activities: 'actividades realizadas', courseProgress: 'Progreso por curso',
  recentActivity: 'Actividad reciente', sampleActivity: 'Tu recorrido de muestra', noActivity: 'Todavía no hay actividades para mostrar.',
  upcoming: 'Próximas evaluaciones', sampleCalendar: 'Agenda de muestra', comingSoon: 'Próximamente', details: 'Ver detalles', evaluation: 'Evaluación', noEvaluations: 'No hay evaluaciones próximas para mostrar.', evaluationNote: 'Evaluación de muestra · No habilitada.',
  todayMission: 'Misión de hoy', dailyChallenge: 'Un pequeño reto, un gran paso', missionProgress: '{done} de {total} retos completados', reward: '+{points} puntos de muestra', missionReadOnly: 'Progreso ilustrativo; no se registran tareas ni recompensas reales.',
  quickAccess: 'A tu alcance', tutorName: 'EDUNEXT AI', tutorHelp: '¿Necesitas ayuda con una lección?', translateName: 'EDUNEXT Translate', translateHelp: 'Traduce y aprende nuevas palabras', pronounceName: 'EDUNEXT Pronuncia', pronounceHelp: 'Escucha y practica: Inténtalo tú', assessmentsName: 'Mis evaluaciones', assessmentsHelp: 'Consulta tus pruebas pendientes', offlineName: 'Contenido offline', offlineHelp: 'Aprende incluso sin Internet',
  construction: 'No disponible', constructionNote: 'Esta función aún no está disponible.', coursePreview: '{course} · {topic}', courseNote: 'Vista de muestra del curso. Lecciones completas no disponibles.',
  noDownloads: 'No hay contenido descargado en esta demostración. Las descargas y la persistencia offline requieren integrar Service Worker e IndexedDB.',
  completed: 'Completado', pending: 'Pendiente', loading: 'Preparando tu espacio de muestra…', loadError: 'No se pudo cargar la demostración. Inténtalo de nuevo.', retry: 'Reintentar', emptyCourses: 'No hay cursos para mostrar.', footer: 'EDUNEXT · Aprende, descubre y crece.', skip: 'Ir al contenido', sample: 'Muestra',
 },
 en: {
  workspaceTitle: 'Student', workspaceSubtitle: 'Academic workspace', workspaceLabel: 'ACADEMIC WORKSPACE', overviewTitle: 'My learning', overviewDescription: 'Continue your lessons and check your activities.', guideAction: 'Getting started', guideShort: 'Help', demoShort: 'Demonstration', sampleData: 'Sample data',
  navLearning: 'Learning', navTracking: 'Progress', navTools: 'Tools',
  evaluations: 'Assessments', agenda: 'Planner',
  dashboard: 'Student home', greeting: 'Hi, {alias}!', subtitle: 'Keep learning! Every day is a new opportunity.',
  demo: 'Demonstration view', demoNote: 'Fictional profile. Progress and activities are sample data.', demoGrade: 'Sample grade', grade: 'Grade {grade}', language: 'Language',
  home: 'Home', courses: 'My courses', practice: 'Practice', games: 'Games', tutor: 'AI Tutor', translator: 'Translator', pronunciation: 'Pronunciation', assessments: 'Assessments', missions: 'Missions', planner: 'Planner', progress: 'Progress', achievements: 'Achievements', downloads: 'My downloads', profile: 'My profile',
  learn: 'Learn', more: 'More', menu: 'Open section menu', navigation: 'Student navigation', collapse: 'Collapse sidebar', expand: 'Expand sidebar', backProfiles: 'Profile preview',
  online: 'Online', offline: 'Offline', connectionHelp: 'Browser connection indicator; does not verify server availability.',
  offlineNote: 'No network connection.', offlineLimit: 'Check My downloads for resources available on this device. Remote changes require a connection.',
  notifications: 'Notifications', sampleNotifications: 'Sample notifications', noNotifications: 'No notifications to show.', close: 'Close', userMenu: 'User menu', settings: 'Settings', logout: 'Sign out', exitDemo: 'There is no real session to sign out of. You can leave the demonstration and return to the sign-in page.', goLogin: 'Back to sign in',
  overview: 'Your learning, step by step', overviewSub: 'Every little effort matters. Let’s make a new discovery!',
  coursesInProgress: 'Courses in progress', lessonsCompleted: 'Lessons completed', streak: 'Learning streak', days: 'days',
  continueTitle: 'Keep learning', unit: 'Unit', lesson: 'Lesson', continueLearning: 'Continue learning', progressLabel: 'Progress',
  yourCourses: 'My courses', courseHint: 'Five subjects to explore at your own pace', continue: 'Continue', explore: 'Explore', notDownloaded: 'Not downloaded',
  myProgress: 'My progress', generalProgress: 'Overall progress', completedLessons: 'lessons completed', activities: 'activities completed', courseProgress: 'Progress by course',
  recentActivity: 'Recent activity', sampleActivity: 'Your sample learning journey', noActivity: 'No activities to show yet.',
  upcoming: 'Upcoming assessments', sampleCalendar: 'Sample planner', comingSoon: 'Coming soon', details: 'View details', evaluation: 'Assessment', noEvaluations: 'No upcoming assessments to show.', evaluationNote: 'This is a sample assessment and is not available. The server must check the authorised time window before allowing access.',
  todayMission: 'Today’s mission', dailyChallenge: 'A small challenge, a big step', missionProgress: '{done} of {total} tasks completed', reward: '+{points} sample points', missionReadOnly: 'Illustrative progress; no real tasks or rewards are recorded.',
  quickAccess: 'Within your reach', tutorName: 'EDUNEXT AI', tutorHelp: 'Need help with a lesson?', translateName: 'EDUNEXT Translate', translateHelp: 'Translate and learn new words', pronounceName: 'EDUNEXT Pronuncia', pronounceHelp: 'Listen and practise: give it a try', assessmentsName: 'My assessments', assessmentsHelp: 'Check your pending tests', offlineName: 'Offline content', offlineHelp: 'Learn even without the Internet',
  construction: 'Unavailable', constructionNote: 'This feature is not available yet.', coursePreview: '{course} · {topic}', courseNote: 'Sample course overview. Full lessons are unavailable.',
  noDownloads: 'There is no downloaded content in this demonstration. Downloads and offline persistence require Service Worker and IndexedDB integration.',
  completed: 'Completed', pending: 'Pending', loading: 'Preparing your sample learning space…', loadError: 'The demonstration could not be loaded. Please try again.', retry: 'Try again', emptyCourses: 'No courses to show.', footer: 'EDUNEXT · Learn, discover and grow.', skip: 'Skip to content', sample: 'Sample',
 },
};
let locale = 'es';
export const getLocale = () => locale;
export function setLocale(value) { if (!Object.hasOwn(messages, value)) return; locale = value; document.documentElement.lang = value; }
export function text(value) { return typeof value === 'string' ? value : value?.[locale] ?? ''; }
export function t(key, values = {}) {
  return (messages[locale][key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}
