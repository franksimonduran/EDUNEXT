import {learningResources} from '../services/monitor-learning-resources.service.js';
import {monitor} from './monitor-demo.data.js';
export function supportExamples(){
 const activities=[],assignments=[],records=[];
 for(const grade of [4,5,6]){
  const resources=learningResources(grade).filter(r=>r.courseId==='math'),lesson=resources.find(r=>r.type==='lesson'),practice=resources.find(r=>r.type==='practice'),tutor=resources.find(r=>r.type==='tutor');
  const common={owner:monitor.id,grade,course:lesson.course,unitId:lesson.unitId,theme:lesson.theme,description:'Material ficticio para explorar la planificación docente.',objective:'Revisar conceptos y explicar un procedimiento.',instructions:'Lee las instrucciones y consulta los recursos indicados.',difficulty:'easy',estimatedMinutes:20,version:1,revision:1,state:'draft',createdAt:'2026-10-18T10:00:00-05:00',updatedAt:'2026-10-18T10:00:00-05:00',evidenceRefs:[]};
  activities.push({...common,id:`task-demo-${grade}`,kind:'task',type:'practice',title:`Práctica de Matemática — ${grade}.º`,resourceIds:[practice.id],steps:[]});
  const stepResources=[lesson,tutor,practice,lesson,practice];
  const plan={...common,id:`support-demo-${grade}`,kind:'reinforcement',type:'reinforcement',title:`Repasar Matemática paso a paso — ${grade}.º`,category:'practice',reason:'Revisar ideas y practicar con apoyo. Ejemplo manual, sin diagnóstico.',trackingCriterion:'Consultar las cinco etapas y revisar la práctica.',resourceIds:[lesson.id,tutor.id,practice.id],steps:['Recordar','Comprender','Practicar','Aplicar','Revisar'].map((title,i)=>({id:`step-${grade}-${i}`,title,description:'Consulta el recurso y explica lo aprendido con tus palabras.',resourceId:stepResources[i].id,minutes:4}))};activities.push(plan);
  if(grade===4){
   for(const a of [activities[0],plan]){
    const assignment={id:'assignment-'+a.id,activityId:a.id,activityVersion:1,revision:1,owner:monitor.id,mode:a.kind==='task'?'group':'individual',rooms:a.kind==='task'?['a4']:[],studentIds:a.kind==='reinforcement'?['a4-s1','a4-s2']:[],groups:[],startDate:'2026-10-21',endDate:'2026-10-25',startTime:null,endTime:null,timezone:'America/Lima',priority:'normal',completion:a.kind==='task'?'practice':'steps',required:false,repeat:true,state:'local',createdAt:common.createdAt,updatedAt:common.updatedAt};assignments.push(assignment);
    ['a4-s1','a4-s2'].forEach((studentId,i)=>records.push({id:`fixture-${a.id}-${i}`,owner:monitor.id,assignmentId:assignment.id,activityId:a.id,activityVersion:1,studentId,state:i===0?'active-local':'finished-local',completedStepIds:a.kind==='reinforcement'?a.steps.slice(0,i===0?2:5).map(s=>s.id):[],resourceIds:a.resourceIds,date:'2026-10-22T10:00:00-05:00',source:'fixture',description:'Registro ficticio compartido; no proviene del dispositivo del estudiante ni de una entrega al servidor.'}));
   }
  }
 }
 return {activities,assignments,records};
}
