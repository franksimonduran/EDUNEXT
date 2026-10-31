import {managementShell} from './management-shell.js';
import {initEvaluations,getEvaluation,getAttempt} from '../services/monitor-evaluations.service.js';
import {catalogView,evaluationForm} from './evaluation-editor.js';
import {questionEditor,previewView} from './question-editor.js';
import {assignmentView} from './evaluation-assignment.js';
import {attemptsView,gradingView,resultsView} from './evaluation-grading.js';
import {workflow} from '../components/monitor-evaluation-ui.js';
const view=document.body.dataset.view;
const titles={catalog:'Mis evaluaciones',edit:'Crear / editar evaluación',questions:'Editor de preguntas',preview:'Vista previa de evaluación',assignment:'Asignación y programación',attempts:'Entregas y respuestas',grading:'Revisar respuestas',results:'Resultados de evaluación'};
const shell=managementShell(titles[view],'evaluations');
try{
 await initEvaluations();const id=new URLSearchParams(location.search).get('id');
 const item=view==='grading'?await getAttempt(id):id?await getEvaluation(id):null;
 if(!['catalog','edit'].includes(view)&&!item||view==='edit'&&id&&!item){shell.root.innerHTML='<section class="monitor-card" role="alert"><h2>Registro no encontrado</h2><p>No existe o no pertenece al monitor demostrativo.</p><a href="evaluaciones.html">Volver a evaluaciones</a></section>';}
 else {if(item&&view!=='grading')document.querySelector('#workflow').innerHTML=workflow(item.id);await ({catalog:catalogView,edit:evaluationForm,questions:questionEditor,preview:previewView,assignment:assignmentView,attempts:attemptsView,grading:gradingView,results:resultsView}[view])(shell,item);}
}catch(error){shell.root.textContent='No se pudo abrir el almacenamiento local. '+error.message;const retry=document.createElement('button');retry.textContent='Reintentar';retry.onclick=()=>location.reload();shell.root.append(retry);}
