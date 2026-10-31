import {loadAdminDashboard} from './admin-dashboard.service.js';
import {assignedCourses} from './monitor-courses.service.js';
import {loadAcademicData,academicScope,formativeFor} from './monitor-grades.service.js';
import {distinct,curriculumSummary} from '../utils/admin-statistics.js';
import {minimumAggregateSample} from '../data/admin-dashboard-config.data.js';
export async function generateInstitutionalReport(input={}){
 const filters={institution:'demo-institution',period:'all',grade:'all',room:'all',course:'all',...input};
 const dashboard=await loadAdminDashboard(filters);
 const courses=(await assignedCourses()).filter(c=>(filters.course==='all'||c.id===filters.course)&&c.rooms.some(r=>dashboard.scope.rooms.includes(r.id)));
 if(filters.course!=='all'&&!courses.length)throw Error('Asignatura no disponible para el alcance seleccionado.');
 const courseName=filters.course==='all'?'':courses[0].name.es;
 const scope=academicScope(await loadAcademicData(),{grade:filters.grade==='all'?'':String(filters.grade),room:filters.room,period:filters.period,course:courseName});
 if(scope.errors.length)throw Error(scope.errors.join(' '));
 const curriculum=curriculumSummary(courses),formative=formativeFor(scope);
 const groups=scope.summary.groups.map(g=>({evaluationId:g.evaluationId,version:g.version,title:g.title,course:g.course,n:g.n,meanPercent:new Set(g.rows.map(r=>r.studentId)).size>=minimumAggregateSample?g.meanPercent:null,suppressed:new Set(g.rows.map(r=>r.studentId)).size<minimumAggregateSample}));
 const subjects=distinct(courses,c=>c.id).map(c=>({id:c.id,name:c.name.es,grades:courses.filter(x=>x.id===c.id).map(x=>x.grade),...curriculumSummary(courses.filter(x=>x.id===c.id)),resources:null}));
 const units=distinct(courses.flatMap(c=>c.units)).map(u=>({id:u.id,title:u.title,lessons:u.lessons.length}));
 return {institution:dashboard.institution,filters,generatedAt:dashboard.loadedAt,summary:{students:dashboard.metrics.students,teachers:dashboard.metrics.teachers,rooms:dashboard.metrics.rooms,courses:curriculum.subjects,units:curriculum.units,lessons:curriculum.lessons,evaluations:scope.evaluations.length,formative:formative.length},grades:dashboard.grades,rooms:dashboard.rooms,subjects,units,curriculum,academic:{evaluations:scope.evaluations.length,reviewed:scope.summary.reviewed,pending:scope.summary.pending,formative:formative.length,progress:filters.period==='all'?dashboard.academic?.progress:null,progressSample:dashboard.metrics.students,groups},formative:distinct(formative,f=>f.course).map(f=>({course:f.course,count:formative.filter(x=>x.course===f.course).length})),content:{drafts:dashboard.content?.drafts??null,ready:dashboard.content?.ready.length??null,validated:dashboard.content?.validated??null,resources:dashboard.content?.resources.length??null},methodology:'Fuentes compartidas F16/F18/F22/F24. Relaciones base sin periodo confirmado; el periodo filtra evidencia fechada. Progreso curricular separado de corrección. Umbral mínimo de agregación: '+minimumAggregateSample+'.',limitations:['Datos ficticios y locales; no oficiales.','No representa actividad de otros dispositivos.','No se infiere ausencia de participación desde registros faltantes.','No hay denominador fiable de cobertura ni comparación temporal de matrículas.'],sourceErrors:dashboard.sourceErrors};
}
export const generateGradeReport=(grade,filters={})=>{if(!['4','5','6'].includes(String(grade)))throw Error('Selecciona un grado válido.');return generateInstitutionalReport({...filters,grade:String(grade)});};
export const generateClassroomReport=(room,filters={})=>generateInstitutionalReport({...filters,room});
export const generateCourseReport=(course,grade,filters={})=>generateGradeReport(grade,{...filters,course});
export const generateStatisticsReport=generateInstitutionalReport;
export const generateMonitoringReport=generateGradeReport;
