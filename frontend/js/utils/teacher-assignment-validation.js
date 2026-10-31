import {monitorById,classroomById,courseByKey,assignmentsOfMonitor} from './academic-relations.js';
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/<\/?[a-z][^>]*>|javascript\s*:/i.test(value);
export function validateAssignmentProposal(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
 const monitor=monitorById(model,d.monitorId);
 if(!monitor)add('monitorId','El monitor indicado no existe en el directorio de demostración.',true);
 const room=classroomById(model,d.roomId);
 if(!room)add('roomId','Selecciona un aula existente.',true);
 const course=courseByKey(model,d.courseKey);
 if(!course)add('courseKey','Selecciona una asignatura existente del catálogo compartido.',true);
 if(d.periodId&&!model.periods.some(p=>p.id===d.periodId))add('periodId','El periodo indicado no existe en la configuración.',true);
 if(!d.periodId)add('periodId','Indica el periodo académico de la propuesta.',true);
 if(course&&room&&Number(course.grade)!==Number(room.grade))add('courseKey','La asignatura pertenece a otro grado que el del aula seleccionada.',true);
 if(d.grade&&room&&Number(d.grade)!==Number(room.grade))add('grade','El grado indicado no corresponde al aula seleccionada.',true);
 if(d.responsibility&&!text(d.responsibility,120))add('responsibility','El tipo de responsabilidad debe ser texto seguro de hasta 120 caracteres.',true);
 if(d.notes&&!text(d.notes,400))add('notes','Las observaciones deben ser texto seguro de hasta 400 caracteres.',true);
 const duplicate=records.filter(r=>r.type==='assignment'&&r.id!==record.id&&r.state!=='archived'&&r.data?.monitorId===d.monitorId&&r.data?.roomId===d.roomId&&r.data?.courseKey===d.courseKey&&r.data?.periodId===d.periodId);
 if(duplicate.length)add('courseKey','Ya existe una propuesta local con la misma pareja docente, aula y asignatura.',true);
 const baseRelation=model.assignments.filter(a=>a.monitorId===d.monitorId&&a.roomId===d.roomId&&a.courseKey===d.courseKey);
 if(baseRelation.length)warnings.push('La fuente de demostración ya registra esa pareja docente, aula y asignatura sin periodo confirmado: la propuesta queda sujeta a revisión institucional.');
 if(monitor&&room&&!monitor.roomIds.includes(room.id))warnings.push('El docente no está relacionado con esa aula en el conjunto base; la propuesta no amplía su acceso real.');
 if(monitor&&course&&!monitor.courseKeys.includes(course.key))warnings.push('La asignatura no figura entre las relacionadas con ese docente en la fuente base.');
 warnings.push('La propuesta no modifica el acceso del Monitor ni sus cursos oficiales.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
export const assignmentDependencies=(model,record,records=[])=>records.filter(r=>r.type==='movement'&&r.state!=='archived'&&r.data?.assignmentDraftId===record.id);
export const monitorAssignmentSummary=(model,monitorId)=>({assignments:assignmentsOfMonitor(model,monitorId).length,classrooms:new Set(assignmentsOfMonitor(model,monitorId).map(a=>a.roomId)).size});
