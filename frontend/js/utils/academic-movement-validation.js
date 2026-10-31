import {validCivil} from './calendar-dates.js';
import {studentById,classroomById,enrollmentsOfStudent} from './academic-relations.js';
import {movementTypes,sectionId} from '../data/admin-organization-demo.data.js';
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/<\/?[a-z][^>]*>|javascript\s*:/i.test(value);
export const movementTypeIds=Object.keys(movementTypes);
export function validateMovementProposal(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
 if(!movementTypeIds.includes(d.movementType))add('movementType','Selecciona un tipo de movimiento académico.',true);
 const student=studentById(model,d.studentId);
 if(!student)add('studentId','Estudiante no disponible. Revisa el directorio.',true);
 if(d.periodId&&!model.periods.some(p=>p.id===d.periodId))add('periodId','El periodo indicado no existe en la configuración.',true);
 if(!d.periodId)add('periodId','Indica el periodo académico de la propuesta.',true);
 if(d.proposedDate&&!validCivil(d.proposedDate))add('proposedDate','La fecha propuesta no es una fecha civil válida.',true);
 if(d.reason&&!text(d.reason,300))add('reason','La justificación administrativa debe ser texto seguro de hasta 300 caracteres y no incluir información médica, psicológica ni familiar.',true);
 if(d.movementType==='classroom'){
  const from=classroomById(model,d.fromRoomId),to=classroomById(model,d.toRoomId);
  if(!from)add('fromRoomId','El aula de origen no existe.',true);
  if(!to)add('toRoomId','El aula de destino no existe.',true);
  if(from&&to&&from.id===to.id)add('toRoomId','El aula de destino debe ser distinta del aula de origen.',true);
  if(student&&from&&!enrollmentsOfStudent(model,student.id).some(e=>e.roomId===from.id))add('fromRoomId','El estudiante no está relacionado con el aula de origen según los datos disponibles.',true);
  if(from&&to&&from.grade!==to.grade)warnings.push('El aula de destino pertenece a otro grado: la propuesta queda sujeta a revisión administrativa.');
 }
 if(d.movementType==='section'){
  const current=classroomById(model,d.fromRoomId),target=classroomById(model,d.toRoomId);
  if(!current)add('fromRoomId','Indica el aula de origen de la sección actual.',true);
  if(!target)add('toRoomId','Indica el aula de destino de la sección propuesta.',true);
  if(current&&target&&current.grade!==target.grade)add('toRoomId','La sección propuesta debe pertenecer al mismo grado que la sección actual.',true);
  if(current&&target&&current.section===target.section)add('toRoomId','La sección propuesta es la misma que la actual.',true);
  if(d.toSectionId&&d.fromSectionId&&d.toSectionId===d.fromSectionId)add('toSectionId','La sección propuesta coincide con la sección actual.',true);
 }
 if(d.movementType==='promotion'){
  const from=Number(d.fromGrade),to=Number(d.toGrade);
  if(!Number.isInteger(from)||!model.grades.some(g=>g.id===from))add('fromGrade','Selecciona el grado de origen.',true);
  if(!Number.isInteger(to)||!model.grades.some(g=>g.id===to))add('toGrade','Selecciona el grado de destino.',true);
  if(Number.isInteger(from)&&Number.isInteger(to)&&to<=from)add('toGrade','La promoción debe apuntar a un grado posterior.',true);
  if(!d.reason||!String(d.reason).trim())add('reason','La promoción requiere una justificación administrativa breve.',true);
  warnings.push('La promoción no se calcula desde notas ni prácticas y exige criterios pedagógicos y autorización institucional.');
 }
 if(d.movementType==='transfer')warnings.push('El traslado institucional queda fuera del alcance actual: la propuesta se prepara sin ejecutarse.');
 if(d.movementType==='correction')warnings.push('La corrección administrativa no modifica datos académicos por sí sola: se prepara para revisión.');
 const duplicate=records.filter(r=>r.type==='movement'&&r.id!==record.id&&r.state!=='archived'&&r.data?.movementType===d.movementType&&r.data?.studentId===d.studentId&&r.data?.periodId===d.periodId&&r.data?.fromRoomId===d.fromRoomId&&r.data?.toRoomId===d.toRoomId&&r.data?.toGrade===d.toGrade);
 if(duplicate.length)add('toRoomId','Ya existe una propuesta local equivalente para el mismo estudiante, periodo y destino.',true);
 warnings.push('El movimiento no se ejecuta: la relación académica vigente permanece sin cambios.');
 return {errors,warnings,valid:!errors.length,checkedAt:new Date().toISOString()};
}
export const movementOriginLabel=(model,d)=>d.movementType==='promotion'?`${d.fromGrade||'?'}.º → ${d.toGrade||'?'}.º`:d.fromRoomId&&d.toRoomId?`${classroomById(model,d.fromRoomId)?.grade||'?'}.º ${classroomById(model,d.fromRoomId)?.section||'?'} → ${classroomById(model,d.toRoomId)?.grade||'?'}.º ${classroomById(model,d.toRoomId)?.section||'?'}`:d.toSectionId?`Sección ${d.toSectionId}`:'Sin origen ni destino';
export const sectionOf=(model,roomId)=>roomId?sectionId(classroomById(model,roomId)?.grade,classroomById(model,roomId)?.section):'';
