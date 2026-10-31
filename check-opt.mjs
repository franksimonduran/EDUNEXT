import {organizationModel} from './frontend/js/utils/academic-relations.js';
import {enrollmentOptions} from './frontend/js/services/admin-enrollments.service.js';
const mod=await organizationModel();
const o=enrollmentOptions(mod);
console.log(o.students.length,o.rooms.length,o.periods.length);
