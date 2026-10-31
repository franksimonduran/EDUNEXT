import {enrollmentsOfClassroom,assignmentsOfClassroom,classroomById,monitorsOfClassroom,studentsOfClassroom} from './academic-relations.js';
export function classroomStatistics(model,records=[]){
 const drafts=records.filter(r=>r.type==='classroom'&&r.state!=='archived');
 const rows=model.rooms.map(room=>{const students=studentsOfClassroom(model,room.id);const assignments=assignmentsOfClassroom(model,room.id);return {...room,studentCount:students.length,monitorCount:monitorsOfClassroom(model,room.id).length,courseCount:assignments.length,hasTeacher:assignments.length>0,students};});
 return {rows,classrooms:rows.length,students:rows.reduce((a,r)=>a+r.studentCount,0),withTeacher:rows.filter(r=>r.hasTeacher).length,withoutTeacher:rows.filter(r=>!r.hasTeacher).length,drafts:drafts.length,incomplete:drafts.filter(r=>r.state==='incomplete').length,ready:drafts.filter(r=>r.state==='ready').length};
}
export function enrollmentStatistics(model,records=[]){
 const drafts=records.filter(r=>r.type==='enrollment'&&r.state!=='archived');
 const roomsWithStudents=model.rooms.filter(r=>enrollmentsOfClassroom(model,r.id).length>0);
 return {enrollments:model.enrollments.length,students:model.enrollments.length,rooms:model.rooms.length,roomsWithStudents:roomsWithStudents.length,drafts:drafts.length,incomplete:drafts.filter(r=>r.state==='incomplete').length,ready:drafts.filter(r=>r.state==='ready').length};
}
export function assignmentStatistics(model,records=[]){
 const drafts=records.filter(r=>r.type==='assignment'&&r.state!=='archived');
 const roomsWithTeacher=model.rooms.filter(r=>assignmentsOfClassroom(model,r.id).length>0);
 const monitorsWithRooms=model.monitors.filter(m=>m.roomIds.length>0);
 return {assignments:model.assignments.length,monitors:model.monitors.length,monitorsWithRooms:monitorsWithRooms.length,rooms:model.rooms.length,roomsWithTeacher:roomsWithTeacher.length,drafts:drafts.length,incomplete:drafts.filter(r=>r.state==='incomplete').length,ready:drafts.filter(r=>r.state==='ready').length};
}
export function movementStatistics(model,records=[]){
  const drafts=records.filter(r=>r.type==='movement'&&r.state!=='archived');
  return {movements:drafts.length,drafts:drafts.length,incomplete:drafts.filter(r=>r.state==='incomplete').length,ready:drafts.filter(r=>r.state==='ready').length,byType:drafts.reduce((acc,r)=>{const t=r.data?.movementType||'desconocido';acc[t]=(acc[t]||0)+1;return acc;},{})};
}
export function organizationStatistics(model,records=[]){
 const drafts=records.filter(r=>r.state!=='archived');
 const byType=drafts.reduce((acc,r)=>{acc[r.type]=(acc[r.type]||0)+1;return acc;},{});
 return {classrooms:classroomStatistics(model,records),enrollments:enrollmentStatistics(model,records),assignments:assignmentStatistics(model,records),movements:movementStatistics(model,records),proposals:drafts.length,byType,incomplete:drafts.filter(r=>r.state==='incomplete').length,ready:drafts.filter(r=>r.state==='ready').length};
}
export const classroomOccupancy=(model,roomId)=>{const room=classroomById(model,roomId);if(!room)return {used:0,capacity:null,label:'Aula no disponible'};const used=enrollmentsOfClassroom(model,roomId).length;return {used,capacity:room.capacity,label:room.capacity?`${used} de ${room.capacity} plazas referenciales`:`${used} estudiantes (capacidad no configurada)`};};
