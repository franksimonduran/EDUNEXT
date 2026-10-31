import { buildLessons } from './lessons-demo.data.js';

export function getUnitsDemo(course) {
 const id=course.unitIds[0];
 const lessons=buildLessons(course,id);
 return [{
  id,courseId:course.id,grade:course.grade,number:1,title:course.topic.es,
  description:`Una ruta de cuatro lecciones para explorar ${course.topic.es.toLowerCase()} y conectar las ideas con tu vida diaria.`,
  objectives:course.objectives,
  lessonIds:lessons.map(lesson=>lesson.id),lessons,
  progress:course.progress,
  availability:{available:true,reason:null},
  offline:{downloaded:false,verified:false},
 }];
}
