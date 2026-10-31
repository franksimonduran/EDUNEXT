import { getUnit, ContentNotFoundError } from './course.service.js';

export async function getLesson(grade,courseId,unitId,lessonId) {
 const {course,unit}=await getUnit(grade,courseId,unitId);
 const lesson=unit.lessons.find(lesson=>lesson.id===lessonId);
 if(!lesson) throw new ContentNotFoundError();
 return {course,unit,lesson};
}
