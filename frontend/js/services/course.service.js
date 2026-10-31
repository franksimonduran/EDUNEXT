import { getCoursesDemo } from '../data/courses-demo.data.js';
import { getUnitsDemo } from '../data/units-demo.data.js';

export class ContentNotFoundError extends Error {
 constructor() { super('Contenido no encontrado'); this.name='ContentNotFoundError'; }
}
export function validateGrade(value) {
 if(!['4','5','6'].includes(String(value))) throw new ContentNotFoundError();
 return Number(value);
}
export async function getCourses(grade) { return getCoursesDemo(validateGrade(grade)); }
export async function getCourse(grade,id) {
 const courses=await getCourses(grade);
 const course=courses.find(course=>course.id===id);
 if(!course) throw new ContentNotFoundError();
 return {...course,units:getUnitsDemo(course)};
}
export async function getUnit(grade,courseId,unitId) {
 const course=await getCourse(grade,courseId);
 const unit=course.units.find(unit=>unit.id===unitId);
 if(!unit || !unit.availability.available) throw new ContentNotFoundError();
 return {course,unit};
}
