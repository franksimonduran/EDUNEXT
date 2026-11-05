import {readDemoResult,resetDemoResult} from './scenario.js';
const score=document.querySelector('#demo-score');
const detail=document.querySelector('#demo-score-detail');
const reset=document.querySelector('#demo-reset');
const status=document.querySelector('#demo-reset-status');
function render(){
  const result=readDemoResult();
  if(score)score.textContent=result?`Resultado de muestra: ${result.percent}%`:'Práctica preparada';
  if(detail)detail.textContent=result?`${result.correct} de ${result.total} respuestas correctas · Estudiante Demo 01`:'Resultado visible en Estudiante, Monitor y Administrador';
  if(reset)reset.hidden=!result;
}
reset?.addEventListener('click',()=>{
  // Only this scenario's storage key is cleared: no other drafts or app caches.
  if(!confirm('¿Reiniciar únicamente el resultado de esta práctica ficticia?'))return;
  resetDemoResult();
  render();
  if(status)status.textContent='La práctica ficticia se reinició. Los demás datos del navegador no se modificaron.';
});
window.addEventListener('storage',event=>{if(event.key?.startsWith('edunext:presentacion:'))render();});
window.addEventListener('edunext-demo-result',render);
render();
