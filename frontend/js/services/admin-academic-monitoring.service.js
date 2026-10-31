import {generateGradeReport} from './admin-institutional-reports.service.js';
export const generateMonitoringReport=generateGradeReport;
export const getProgressByGrade=generateGradeReport;
export const getEvaluationDetails=generateGradeReport;
export const getFormativeByCourse=(course,grade,filters={})=>generateGradeReport(grade,{...filters,course});
export async function getInsightsSummary(grade,filters={}){const report=await generateGradeReport(grade,filters);return {grade,groups:report.academic.groups,limitations:report.limitations};}
