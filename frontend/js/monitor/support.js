import {managementShell} from './management-shell.js';
import {initSupport,getActivity} from '../services/monitor-tasks.service.js';
import {authorizedRooms,getStudent} from '../services/monitor-students.service.js';
import {subjects} from '../data/monitor-demo.data.js';
import {supportCatalog,activityDetail,activityTracking} from './support-tracking.js';
import {supportEditor} from './support-editor.js';
import {activityAssignment} from './support-assignment.js';
import {errorState} from '../components/monitor-academic-ui.js';
import {useProgressApi} from '../services/progress-api.service.js';
import {renderTeacherPlanner} from './planner-api-view.js';
const view=document.body.dataset.view,params=new URLSearchParams(location.search),raw=Object.fromEntries(params),id=params.get('id');
const titles={tasks:'Mis Tareas',edit:'Crear / Editar Tarea',reinforcements:'Refuerzos Educativos',plan:'Crear Plan de Refuerzo',assign:'Asignar Actividad',detail:'Detalle de Actividad',tracking:'Seguimiento de Actividades',planTracking:'Seguimiento de Refuerzo'};
const shell=managementShell(titles[view],['reinforcements','plan','planTracking'].includes(view)?'support':'tasks');
try{
 if(useProgressApi()){
  if(view==='tasks')await renderTeacherPlanner(shell);
  else shell.root.innerHTML=errorState(['Esta vista todavía no está conectada al API. Abre Tareas para gestionar tareas confirmadas. No se muestran propuestas demo.']);
 }else{
 const errors=[];if(raw.room&&!authorizedRooms().some(c=>c.id===raw.room))errors.push('Aula no encontrada o no asignada.');if(raw.student&&(!getStudent(raw.student)||raw.room&&getStudent(raw.student).classroomId!==raw.room))errors.push('Estudiante no encontrado o fuera del aula seleccionada.');if(raw.course&&!subjects.includes(raw.course))errors.push('Asignatura no válida.');if(raw.grade&&!['4','5','6'].includes(raw.grade))errors.push('Grado no válido.');if([...params.keys()].some(k=>params.getAll(k).length>1))errors.push('Parámetros repetidos. Abre un enlace válido.');
 await initSupport();const activity=id?await getActivity(id):null;
 if(activity?.kind==='reinforcement')shell.setActive('support');
 if(raw.student&&raw.grade&&getStudent(raw.student)?.grade!==Number(raw.grade))errors.push('El estudiante del contexto no corresponde al grado seleccionado.');
 if(raw.room&&raw.grade&&authorizedRooms().find(r=>r.id===raw.room)?.grade!==Number(raw.grade))errors.push('El aula del contexto no corresponde al grado seleccionado.');
 if(id&&!activity||['assign','detail','planTracking'].includes(view)&&!activity)errors.push('Actividad no encontrada. No se mostrará otra actividad como sustituto.');
 if(activity&&(view==='edit'&&activity.kind!=='task'||['plan','planTracking'].includes(view)&&activity.kind!=='reinforcement'))errors.push('El tipo de actividad no corresponde a esta pantalla.');
 if(errors.length)shell.root.innerHTML=errorState(errors);
  else await ({tasks:supportCatalog,reinforcements:supportCatalog,edit:supportEditor,plan:supportEditor,assign:activityAssignment,detail:activityDetail,tracking:activityTracking,planTracking:activityTracking}[view])({...shell,view,raw,activity});
 }
}catch(error){shell.root.innerHTML=errorState([error.message||'No se pudieron consultar las actividades locales.']);const retry=document.createElement('button');retry.textContent='Reintentar';retry.onclick=()=>location.reload();shell.root.append(retry);}
