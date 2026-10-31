import {studentById,classroomById,enrollmentsOfStudent,enrollmentsOfClassroom} from './academic-relations.js';
import {capacityStatus} from '../data/admin-academic-rules.data.js';
export function enrollmentDuplicates(model,records,proposal){
 const duplicates=[],conflicts=[];
 const data=proposal?.data||proposal||{};
 const studentId=data.studentId,roomId=data.roomId,periodId=data.periodId;
 for(const e of enrollmentsOfStudent(model,studentId).filter(e=>!e.periodId||!periodId||e.periodId===periodId)){
  if(e.roomId===roomId)duplicates.push({id:e.id,reason:'El estudiante ya tiene una relación de demostración con esa misma aula.'});
  else conflicts.push({id:e.id,reason:'El estudiante ya está relacionado con otra aula en el mismo periodo.'});
 }
 for(const r of records.filter(r=>r.type==='enrollment'&&r.state!=='archived'&&r.id!==proposal.id)){
  if(r.data?.studentId===studentId&&r.data?.periodId===periodId){
   if(r.data?.roomId===roomId)duplicates.push({id:r.id,reason:'Ya existe una propuesta local equivalente.'});
   else conflicts.push({id:r.id,reason:'Existe otra propuesta local del mismo estudiante en el mismo periodo.'});
  }
 }
 const room=classroomById(model,roomId);
 const used=room?enrollmentsOfClassroom(model,roomId).length:0;
 const proposed=records.filter(r=>r.type==='enrollment'&&r.state!=='archived'&&r.id!==proposal.id&&r.data?.roomId===roomId&&r.data?.periodId===periodId).length;
 const capacity=room?capacityStatus(room.capacity,used+proposed):null;
 return {duplicates,conflicts,capacity,used,proposed,student:studentById(model,studentId),room};
}
export const duplicateSummary=result=>[...result.duplicates.map(d=>'Duplicado: '+d.reason),...result.conflicts.map(c=>'Incompatible: '+c.reason)];
