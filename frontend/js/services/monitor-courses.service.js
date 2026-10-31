import {getCourse,getCourses} from './course.service.js';
import {authorizedRooms} from './monitor-students.service.js';
// Classroom assignment codes are positional in phase 16; the academic catalog owns subject IDs.
export async function assignedCourses(){
 const rooms=authorizedRooms(),rows=[];
 for(const grade of [...new Set(rooms.map(r=>r.grade))]){
  const courses=await getCourses(grade);
  for(const [index,c] of courses.entries()){
   const related=rooms.filter(r=>r.grade===grade&&r.courseIds.includes(`${grade}-${index}`));
   if(related.length)rows.push({...await getCourse(grade,c.id),rooms:related,version:1,state:'base-demo'});
  }
 }
 return rows;
}
export async function assignedCourse(grade,id){const c=(await assignedCourses()).find(c=>c.grade===Number(grade)&&c.id===id);if(!c)throw new Error('El curso o grado no existe entre las aulas asignadas al Monitor.');return c;}
export function courseSummary(courses,drafts=[]){return {courses:courses.length,units:courses.reduce((n,c)=>n+c.units.length,0),lessons:courses.reduce((n,c)=>n+c.units.reduce((a,u)=>a+u.lessons.length,0),0),drafts:drafts.filter(d=>courses.some(c=>c.id===d.courseId&&c.grade===d.grade)&&d.state!=='archived').length};}
