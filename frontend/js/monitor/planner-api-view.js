import {escapeHTML as esc} from '../components/student-ui.js';
import * as api from '../services/academic-planner-api.service.js';

export async function renderTeacherPlanner(shell){
 const {root,open}=shell;
 shell.plannerController?.abort();
 const controller=new AbortController();shell.plannerController=controller;
 document.querySelector('.demo-label').textContent='Modo API · Tareas formativas registradas en servidor';
 document.querySelector('.topbar-greeting p').textContent='Ámbito docente autorizado por servidor';
 const alias=document.querySelector('[data-monitor-alias]');if(alias)alias.textContent='Cuenta autenticada · identidad no mostrada en esta vista';
 const notifications=document.querySelector('[data-open="notifications"]');if(notifications){notifications.disabled=true;notifications.setAttribute('aria-label','Notificaciones remotas no disponibles');}
 const [contexts,tasks]=await Promise.all([api.teachingContexts(),api.assignedAssignments()]);
 root.innerHTML=`<p role="status" id="planner-notice"></p><section class="dashboard-card"><h2>Crear tarea</h2><form id="planner-create"><label>Aula, curso y periodo<select name="context" required>${contexts.items.map((c,i)=>`<option value="${i}">${esc(c.classroom_title)} · ${esc(c.course_title)} · ${esc(c.period_title)} (${esc(c.timezone)})</option>`).join('')}</select></label><label>Título<input name="title" required minlength="2" maxlength="255"></label><label>Instrucciones<textarea name="instructions" required minlength="2" maxlength="12000"></textarea></label><label>Disponible desde, ISO con zona horaria<input name="available_from" required placeholder="2026-10-23T08:00:00-05:00"></label><label>Fecha límite, ISO con zona horaria<input name="due_at" required placeholder="2026-10-25T17:00:00-05:00"></label><p>Se asignará una fotografía de los estudiantes matriculados del aula al publicar. El borrador no distribuye la tarea.</p><button type="submit" ${contexts.items.length?'':'disabled'}>Guardar borrador en servidor</button></form></section><section><h2>Tareas autorizadas</h2>${tasks.items.map(t=>`<article class="dashboard-card"><h3>${esc(t.title)}</h3><p>${esc(t.status)}</p>${t.status==='draft'?`<button type="button" data-publish="${esc(t.id)}" data-revision="${t.revision}">Publicar tarea</button>`:`<button type="button" data-submissions="${esc(t.id)}">Consultar entregas</button>`}</article>`).join('')||'<p>Sin tareas.</p>'}${tasks.total>25?'<p>Se muestran las primeras 25 tareas.</p>':''}</section>`;
 const notice=root.querySelector('#planner-notice');
 root.querySelector('form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;
  const values=Object.fromEntries(new FormData(form)),context=contexts.items[Number(values.context)];
  try{
   await api.createAssignment({course_id:context.course_id,classroom_id:context.classroom_id,academic_period_id:context.academic_period_id,title:values.title,instructions:values.instructions,available_from:values.available_from,due_at:values.due_at});
   await renderTeacherPlanner(shell);root.querySelector('#planner-notice').textContent='Borrador confirmado en servidor.';
  }catch(error){notice.textContent=`No se confirmó el guardado: ${error.message}`;button.disabled=false;}
 });
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-publish],[data-submissions]');if(!button)return;button.disabled=true;
  try{
   if(button.dataset.publish){
    button.dataset.key ||= api.operationKey();
    await api.publishAssignment(button.dataset.publish,Number(button.dataset.revision),button.dataset.key);
    await renderTeacherPlanner(shell);root.querySelector('#planner-notice').textContent='Publicación confirmada en servidor.';
   }else{
    const submissions=await api.assignmentSubmissions(button.dataset.submissions);
    open('Entregas recibidas',submissions.items.map(s=>`<article><h3>Intento ${s.attempt_number} · ${esc(s.status)}</h3><p>${esc(s.response_text)}</p>${s.submitted_at?`<form data-review="${esc(s.id)}" data-revision="${s.revision}"><label>Retroalimentación formativa<textarea name="feedback" required minlength="2" maxlength="6000"></textarea></label><button type="submit">Guardar y publicar retroalimentación</button><p role="status"></p></form>`:''}</article>`).join('')||'<p>Sin entregas.</p>');
    document.querySelectorAll('[data-review]').forEach(form=>form.addEventListener('submit',async e=>{
     e.preventDefault();const action=form.querySelector('button'),status=form.querySelector('[role=status]');action.disabled=true;
     try{
      let feedback;
      if(form.dataset.feedbackId)feedback={id:form.dataset.feedbackId,submission_revision:Number(form.dataset.feedbackRevision)};
      else{
       feedback=await api.createFeedback(form.dataset.review,{expected_revision:Number(form.dataset.revision),feedback_text:form.elements.feedback.value,requests_revision:false});
       form.dataset.feedbackId=feedback.id;form.dataset.feedbackRevision=feedback.submission_revision;
      }
      await api.publishFeedback(feedback.id,feedback.submission_revision);status.textContent='Retroalimentación publicada en servidor.';form.querySelector('textarea').disabled=true;
     }catch(error){status.textContent=`No se confirmó la publicación: ${error.message}`;action.disabled=false;}
    }));
   }
  }catch(error){notice.textContent=`No disponible: ${error.message}`;}finally{button.disabled=false;}
 },{signal:controller.signal});
}
