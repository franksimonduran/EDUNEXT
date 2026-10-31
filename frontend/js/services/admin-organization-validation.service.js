import {organizationModel,classroomById,studentById,monitorById,courseByKey,enrollmentsOfStudent} from '../utils/academic-relations.js';
import {listAcademicRecords} from './admin-organization-drafts.service.js';
import {validateClassroomDraft,validateSectionDraft} from '../utils/classroom-validation.js';
import {validatePeriodDraft} from '../utils/period-validation.js';
import {validateEnrollmentProposal} from '../utils/enrollment-validation.js';
import {validateAssignmentProposal} from '../utils/teacher-assignment-validation.js';
import {validateMovementProposal} from '../utils/academic-movement-validation.js';
import {organizationStatistics} from '../utils/classroom-statistics.js';
const validators={classroom:validateClassroomDraft,section:validateSectionDraft,period:validatePeriodDraft,enrollment:validateEnrollmentProposal,assignment:validateAssignmentProposal,movement:validateMovementProposal};
export const validatorFor=type=>validators[type]||null;
export async function validateOrganizationRecord(record){const model=await organizationModel();const all=await listAcademicRecords();const validator=validatorFor(record.type);if(!validator)return {errors:[{field:'type',message:'Tipo de propuesta sin validador asociado.',blocking:true}],warnings:[],valid:false};return validator(record,model,all);}
export async function organizationValidationReport(){
 const model=await organizationModel();const records=await listAcademicRecords();
 const issues=[];
 for(const record of records){const validator=validatorFor(record.type);if(!validator)continue;const result=validator(record,model,records);for(const issue of result.errors)issues.push({id:record.id+':'+issue.field,type:record.type,recordId:record.id,level:issue.blocking?'error':'warning',message:issue.message,field:issue.field});}
 const orphanEnrollments=model.enrollments.filter(e=>!studentById(model,e.studentId)||!classroomById(model,e.roomId)).map(e=>({id:'base:'+e.id,type:'enrollment',recordId:e.id,level:'error',message:'La relación de demostración apunta a un estudiante o aula inexistente.',field:'base'}));
 const orphanAssignments=model.assignments.filter(a=>!monitorById(model,a.monitorId)||!classroomById(model,a.roomId)||!courseByKey(model,a.courseKey)).map(a=>({id:'base:'+a.id,type:'assignment',recordId:a.id,level:'error',message:'La relación de demostración apunta a un docente, aula o asignatura inexistente.',field:'base'}));
 const studentsWithoutRoom=model.students.filter(s=>!enrollmentsOfStudent(model,s.id).length).map(s=>({id:'base:student:'+s.id,type:'enrollment',recordId:s.id,level:'warning',message:'El estudiante no tiene aula de referencia en la demostración.',field:'base'}));
 const all=[...orphanEnrollments,...orphanAssignments,...studentsWithoutRoom,...issues];
 return {issues:all,errors:all.filter(i=>i.level==='error'),warnings:all.filter(i=>i.level==='warning'),statistics:organizationStatistics(model,records),records,model};
}
export const issueSummary=report=>report.errors.length?`${report.errors.length} error(es) de validación pendientes`:report.warnings.length?`${report.warnings.length} advertencia(s) sin bloquear`:'Sin incidencias de validación';
