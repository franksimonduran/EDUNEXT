export const organizationRules=Object.freeze({
 oneClassroomPerStudentPerPeriod:true,
 oneAssignmentPerMonitorRoomCourse:true,
 allowSeveralMonitorsPerClassroom:true,
 allowSeveralClassroomsPerMonitor:true,
 enrollmentRequiresExistingStudent:true,
 enrollmentRequiresExistingClassroom:true,
 enrollmentPeriodRequired:true,
 classroomPeriodRequired:true,
 capacityIsReferential:true,
 capacityBlocksEnrollment:false,
 promotionRequiresInstitutionalAuthorization:true,
 promotionNeverAutomatic:true,
 movementNeverAppliesLocally:true,
 sectionsAreScopedByGrade:true,
 classroomAndSectionAreDistinctEntities:true,
 institutionScopeStrict:true
});
export const ruleDescriptions=Object.freeze([
 {id:'oneClassroomPerStudentPerPeriod',text:'Un estudiante no debe tener dos aulas en el mismo periodo; se informa como posible duplicado incompatible.'},
 {id:'oneAssignmentPerMonitorRoomCourse',text:'No se repiten la misma pareja docente, aula y asignatura en un periodo.'},
 {id:'allowSeveralMonitorsPerClassroom',text:'Un aula puede tener varios monitores y un monitor varias aulas.'},
 {id:'capacityIsReferential',text:'La capacidad de un aula es referencial: informa, no bloquea la propuesta.'},
 {id:'promotionNeverAutomatic',text:'Las promociones nunca se calculan ni se aplican automáticamente.'},
 {id:'movementNeverAppliesLocally',text:'Los movimientos académicos solo se preparan; no alteran la relación vigente.'},
 {id:'sectionsAreScopedByGrade',text:'La sección se interpreta dentro de su grado: dos secciones «A» de grados distintos no son la misma entidad.'},
 {id:'institutionScopeStrict',text:'Toda propuesta debe pertenecer a la institución de demostración activa.'}
]);
export const capacityStatus=(capacity,used)=>{
 if(!Number.isFinite(capacity))return {id:'unknown',label:'Capacidad no configurada'};
 const free=capacity-used;
 return free>0?{id:'available',label:`${free} plaza(s) referenciales disponibles`,free}:{id:'exceeded',label:'Posible exceso sobre la capacidad referencial',free};
};
