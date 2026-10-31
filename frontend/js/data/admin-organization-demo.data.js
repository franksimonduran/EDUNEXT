import {demoInstitution} from './admin-demo.data.js';
export const organizationTimezone='America/Lima';
export const organizationOwner='demo-admin';
export const gradeCatalog=Object.freeze([
 {id:4,name:'4.º primaria',level:'Primaria',order:1},
 {id:5,name:'5.º primaria',level:'Primaria',order:2},
 {id:6,name:'6.º primaria',level:'Primaria',order:3}
]);
export const gradeName=id=>gradeCatalog.find(g=>g.id===Number(id))?.name||'Grado no válido';
export const sectionId=(grade,section)=>`${grade}-${String(section||'').trim().toUpperCase()}`;
export const sectionName=(grade,section)=>`Sección ${String(section||'').trim().toUpperCase()}`;
export const classroomCode=id=>'DEMO-AULA-'+String(id||'').replace(/^a/,'').toUpperCase();
export const referentialCapacities=Object.freeze({
 a5:{capacity:30,source:'Capacidad referencial de demostración; no es un límite oficial'}
});
export const classroomStates=Object.freeze({
 'base-demo':'Registrada en demostración',
 draft:'Borrador de aula local',
 incomplete:'Relaciones incompletas',
 ready:'Lista para revisión local',
 archived:'Archivada localmente'
});
export const enrollmentStates=Object.freeze({
 'base-demo':'Relación institucional de demostración',
 draft:'Propuesta local',
 incomplete:'Validación pendiente',
 ready:'Lista para revisión',
 confirmed:'Confirmada oficialmente',
 annulled:'Anulada oficialmente'
});
export const assignmentStates=Object.freeze({
 'base-demo':'Relación de demostración',
 draft:'Propuesta local',
 incomplete:'Validación pendiente',
 ready:'Lista para revisión',
 confirmed:'Asignación oficial'
});
export const movementStates=Object.freeze({
 draft:'Borrador local',
 incomplete:'Validación pendiente',
 ready:'Listo para revisión',
 submitted:'Presentado al backend (futuro)',
 approved:'Aprobado oficialmente (futuro)',
 rejected:'Rechazado oficialmente (futuro)',
 executed:'Ejecutado oficialmente (futuro)'
});
export const movementTypes=Object.freeze({
 classroom:'Cambio de aula',
 section:'Cambio de sección',
 transfer:'Traslado institucional futuro',
 promotion:'Promoción de grado',
 correction:'Corrección administrativa de relación'
});
export const relationshipStates=Object.freeze({
 'base-demo':'Relación de demostración',
 draft:'Propuesta local',
 incomplete:'Validación pendiente',
 ready:'Lista para revisión local',
 archived:'Archivada localmente'
});
export const organizationInstitution=Object.freeze({id:demoInstitution.id,name:demoInstitution.name,timezone:organizationTimezone,state:'demo'});
