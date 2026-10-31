import {generateInstitutionalReport,generateGradeReport,generateClassroomReport,generateCourseReport} from './admin-institutional-reports.service.js';
export const getInstitutionalStatistics=generateInstitutionalReport,getGradeStatistics=generateGradeReport,getClassroomStatistics=generateClassroomReport,getCourseStatistics=generateCourseReport;
export async function comparePeriods(){throw new Error('Comparación no disponible: las relaciones base carecen de periodo y no se han identificado muestras equivalentes de la misma evaluación y versión en ambos periodos.');}
