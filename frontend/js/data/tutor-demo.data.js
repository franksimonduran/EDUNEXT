import {getCourses,getCourse} from '../services/course.service.js';
import {getLesson} from '../services/lesson.service.js';

export function buildTutorExample(course,unit,lesson){
 const image=lesson.images[0];
 const math=image.kind==='parts'?{kind:'math',numerator:image.filled,denominator:image.parts,decimal:Number((image.filled/image.parts).toFixed(3)),percent:Math.round(image.filled/image.parts*100),grade:course.grade}:null;
 return {
  id:lesson.id,grade:course.grade,courseId:course.id,unitId:unit.id,lessonId:lesson.id,
  subject:course.name,unitTitle:unit.title,title:lesson.title,topic:course.topic.es,
  prompt:`Ayúdame a comprender: ${lesson.title}`,
  explanation:lesson.blocks[0].text,easy:lesson.help.easy,steps:lesson.help.steps,
  example:lesson.examples[0],another:lesson.help.example,
  hint:`Antes de buscar una respuesta, observa qué idea debes explicar: ${lesson.objective} ¿Qué parte del ejemplo puedes relacionar con ella?`,
  guide:lesson.exercise.question,visual:image,math,
 };
}
export async function loadTutorDemo(grade,route={}){
 const examples=[];
 for(const item of await getCourses(grade)){
  const course=await getCourse(grade,item.id),unit=course.units[0];
  const lesson=unit.lessons[item.id==='math'&&grade===5?2:0];
  examples.push(buildTutorExample(course,unit,lesson));
 }
 let context=null;
 if(route.course||route.unit||route.lesson){
  const {course,unit,lesson}=await getLesson(grade,route.course,route.unit,route.lesson);
  context=buildTutorExample(course,unit,lesson);
  if(!examples.some(item=>item.id===context.id))examples.push(context);
 }
 return {grade,examples,context};
}
// Full local catalogue for topic selection; does not add or invent lesson content.
export async function loadTutorMaterials(grade){
 const materials=[];
 for(const item of await getCourses(grade)){
  const course=await getCourse(grade,item.id);
  for(const unit of course.units)for(const lesson of unit.lessons)materials.push(buildTutorExample(course,unit,lesson));
 }
 return materials;
}
