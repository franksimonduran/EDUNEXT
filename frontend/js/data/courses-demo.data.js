import { getStudentDemo } from './student-demo.data.js';
import { getLessonRows } from './lessons-demo.data.js';

const descriptions = {
 math:'Descubre relaciones entre cantidades y resuelve situaciones de la vida cotidiana.',
 reading:'Lee, comprende y comparte ideas a través de distintos tipos de textos.',
 science:'Observa, pregunta y descubre cómo funciona el mundo que te rodea.',
 social:'Conoce tu comunidad y aprende a convivir y participar con respeto.',
 english:'Aprende palabras y expresiones en inglés para comunicarte paso a paso.',
};
export function getCoursesDemo(grade) {
 return getStudentDemo(grade).courses.map(course=>({
  ...course,
  tone:course.id==='english'?'sky':course.tone,
  description:descriptions[course.id],
  image:{icon:course.icon,description:`Ilustración de ${course.name.es}: ${course.topic.es}`},
  objectives:[`Explorar ${course.topic.es.toLowerCase()} con ejemplos sencillos.`,'Explicar lo aprendido con tus propias palabras.','Resolver una actividad introductoria de muestra.'],
  unitIds:[`${course.id}-g${grade}-u1`],
  lessonCount:getLessonRows(course.id,grade).length,
  completedLessons:Math.floor(course.progress*4/100),
  offline:{downloaded:false,verified:false,capability:'not-implemented'},
 }));
}
