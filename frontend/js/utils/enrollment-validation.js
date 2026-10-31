import {validCivil} from './calendar-dates.js';
import {studentById,classroomById} from './academic-relations.js';
import {enrollmentDuplicates} from './enrollment-duplicates.js';
const text=(value,max)=>typeof value==='string'&&value.length<=max&&!/<\/?[a-z][^>]*>|javascript\s*:/i.test(value);
export function validateEnrollmentProposal(record,model,records=[]){
 const errors=[],warnings=[],add=(field,message,blocking=false)=>errors.push({field,message,blocking});const d=record.data||{};
 const student=studentById(model,d.studentId);
 if(!student)add('studentId','Estudiante no disponible. Revisa el directorio.',true);
 const room=classroomById(model,d.roomId);
 if(!room)add('roomId','Selecciona un aula existente del conjunto de demostración.',true);
 if(d.periodId&&!model.periods.some(p=>p.id===d.periodId))add('periodId','El periodo indicado no existe en la configuración.',true);
 if(!d.periodId)add('periodId','Indica el periodo académico de la propuesta.',true);
 if(student&&room&&Number(student.grade)!==Number(room.grade))warnings.push('El aula propuesta pertenece a otro grado que el de la relación base del estudiante. Revisa la propuesta antes de presentarla.');
 if(d.grade&&room&&Number(d.grade)!==Number(room.grade))add('grade','El grado indicado no corresponde al aula seleccionada.',true);
 if(d.proposedDate&&!validCivil(d.proposedDate))add('proposedDate','La fecha propuesta no es una fecha civil válida.',true);
 if(d.notes&&!text(d.notes,400))add('notes','La observación administrativa debe ser texto seguro de hasta 400 caracteres y no contener datos sensibles.',true);
 const duplicates=enrollmentDuplicates(model,records,record);
 for(const item of duplicates.duplicates)add('studentId',item.reason,true);
 for(const item of duplicates.conflicts)warnings.push(item.reason);
 if(duplicates.capacity?.id==='exceeded')warnings.push(duplicates.capacity.label+'. La capacidad es referencial y no bloquea la propuesta; el backend validará las plazas reales.');
 if(duplicates.capacity?.id==='available')warnings.push(duplicates.capacity.label+' sobre la capacidad referencial configurada.');
 warnings.push('La propuesta no modifica la matrícula vigente del estudiante ni sus cursos.');
 return {errors,warnings,valid:!errors.length,duplicates,checkedAt:new Date().toISOString()};
}
