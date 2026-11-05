// Indicadores de la PRÁCTICA DEMOSTRATIVA exclusivamente; no son registros académicos.
import {DEMO_STUDENT,DEMO_READING,readDemoResult} from './scenario.js';
export const DEMO_CONTEXT=Object.freeze({institution:DEMO_STUDENT.institution,grade:DEMO_STUDENT.grade,group:DEMO_STUDENT.group,student:DEMO_STUDENT.name,course:DEMO_READING.course,lesson:DEMO_READING.title});
export function getDemoEvidence(){
 const r=readDemoResult();
 if(!r)return Object.freeze({completed:false,correct:0,total:5,percent:null,points:0,achievement:null,grade:5,group:DEMO_STUDENT.group,source:'sin resultado guardado'});
 return Object.freeze({completed:true,correct:r.correct,total:r.total,percent:r.percent,points:r.correct*20,
   achievement:r.percent>=80?'Lector del huerto':null,grade:5,group:DEMO_STUDENT.group,source:'guardado únicamente en este navegador'});
}
export function deriveDemoFeedback(evidence){
 if(!evidence.completed)return 'Resuelve la práctica para generar tu resultado de demostración.';
 if(evidence.percent===100)return '¡Excelente! Identificaste todas las ideas y los detalles de la lectura.';
 if(evidence.percent>=80)return '¡Muy bien! Revisa la pregunta pendiente para reforzar lo aprendido.';
 if(evidence.percent>=60)return 'Buen comienzo. Repasa las explicaciones y vuelve a intentarlo.';
 return 'Sigue practicando. Relee el texto y utiliza las explicaciones de cada pregunta.';
}
export function percentLabel(value){return value===null?'Sin resultado':`${value} %`;}
