import {monitor,classrooms,students,practices,evaluations,activities,subjects} from '../data/monitor-demo.data.js';
export function getDashboard(classroomId='all') {
 const rooms=classrooms.filter(c=>monitor.classroomIds.includes(c.id)&&(classroomId==='all'||c.id===classroomId));
 const ids=new Set(rooms.map(c=>c.id));
 const pupils=students.filter(s=>ids.has(s.classroomId));
 const results=practices.filter(p=>ids.has(p.classroomId));
 const assigned=pupils.reduce((n,s)=>n+s.assigned,0), completed=pupils.reduce((n,s)=>n+s.completed,0);
 const performance=subjects.map(course=>{const rows=results.filter(p=>p.course===course); const total=rows.reduce((n,p)=>n+p.total,0);return {course,percent:total?Math.round(100*rows.reduce((n,p)=>n+p.correct,0)/total):null};});
 // Regla explícita: al menos dos prácticas del mismo tema con menos del 50 %.
 const support=pupils.flatMap(s=>{const evidence=results.filter(p=>p.studentId===s.id&&p.course==='Matemática'&&p.correct/p.total<.5);return evidence.length>=2?[{...s,course:'Matemática',topic:'Comparación de fracciones',evidence:evidence.length}]:[];});
 return {rooms,pupils,assigned,completed,progress:assigned?Math.round(100*completed/assigned):0,pending:pupils.filter(s=>s.completed<s.assigned).length,performance,support,evaluations:evaluations.filter(e=>ids.has(e.classroomId)),activities:activities.filter(a=>ids.has(a.classroomId)),courses:new Set(rooms.flatMap(c=>c.courseIds)).size};
}
