import {monitor} from './monitor-demo.data.js';
import {academicPeriods} from './monitor-academic-periods.data.js';
// Only the new administrative identity is defined here. Academic entities remain shared.
export const demoInstitution=Object.freeze({id:'demo-institution',name:monitor.institution,code:null,activePeriod:null,periods:academicPeriods,informationState:'demo'});
export const demoAdministrator=Object.freeze({id:'demo-admin',alias:'Administrador de demostración',role:'admin',institutionId:demoInstitution.id,institution:demoInstitution.name,avatar:'av-2'});
export const demoTeachers=Object.freeze([{id:monitor.id,alias:monitor.alias,role:'monitor',institutionId:demoInstitution.id,classroomIds:monitor.classroomIds,state:'demo'}]);
