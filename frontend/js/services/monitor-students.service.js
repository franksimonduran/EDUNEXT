import {students,subjects,practices,monitor,classrooms,evaluations} from '../data/monitor-demo.data.js';
import {getDashboard} from './monitor-dashboard.service.js';
export const authorizedRooms=()=>classrooms.filter(c=>monitor.classroomIds.includes(c.id));
export const roomName=id=>{const c=authorizedRooms().find(c=>c.id===id);return c?`${c.grade}.º primaria — Sección ${c.section}`:'Aula no disponible';};
export const normalize=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const percent=(completed,assigned)=>assigned>0?Math.round(completed/assigned*100):null;
export function courseProgress(s){
 // Distribución determinista de las 20 lecciones agregadas de la fase 15.
 return subjects.map((course,i)=>({id:`${s.id}-course-${i}`,course,units:2,assigned:4,completed:Math.floor(s.completed/5)+(i<s.completed%5?1:0)}));
}
export function getStudent(id){const s=students.find(s=>s.id===id&&monitor.classroomIds.includes(s.classroomId));if(!s)return null;const courses=courseProgress(s),history=practices.filter(p=>p.studentId===s.id);return {...s,grade:authorizedRooms().find(c=>c.id===s.classroomId).grade,courses,history,evaluations:evaluations.filter(e=>e.classroomId===s.classroomId),published:[],observations:subjects.map(course=>{const rows=history.filter(p=>p.course===course);return {course,topic:rows[0]?.topic,low:rows.filter(p=>p.correct/p.total<.5).length,high:rows.filter(p=>p.correct/p.total>=.8).length,rows};})};}
export function queryStudents({search='',room='all',grade='',course='',activity='',sort='alias'}={}){
 let rows=students.filter(s=>monitor.classroomIds.includes(s.classroomId)).map(s=>({...s,grade:authorizedRooms().find(c=>c.id===s.classroomId).grade}));
 rows=rows.filter(s=>(room==='all'||s.classroomId===room)&&(!grade||String(s.grade)===grade)&&(!course||subjects.includes(course))&&(!search||normalize(`${s.alias} ${s.id} ${roomName(s.classroomId)}`).includes(normalize(search)))&&(!activity||(activity==='pending'?s.completed<s.assigned:activity==='progress'?s.completed>0:!s.assigned)));
 return rows.sort((a,b)=>sort==='progress'?(percent(a.completed,a.assigned)??-1)-(percent(b.completed,b.assigned)??-1):sort==='grade'?a.grade-b.grade:sort==='room'?a.classroomId.localeCompare(b.classroomId):a.alias.localeCompare(b.alias,'es',{numeric:true}));
}
export function getRoom(id){if(!authorizedRooms().some(c=>c.id===id))return null;return {...authorizedRooms().find(c=>c.id===id),...getDashboard(id),students:queryStudents({room:id})};}
export function roomCourseProgress(id){const r=getRoom(id);return r?subjects.map((course,i)=>{const values=r.students.map(s=>courseProgress(s)[i]);return {course,assigned:values.reduce((n,c)=>n+c.assigned,0),completed:values.reduce((n,c)=>n+c.completed,0),units:2};}):[];}
