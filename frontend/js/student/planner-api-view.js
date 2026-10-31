import { escapeHTML as esc } from '../components/student-ui.js';
import * as api from '../services/academic-planner-api.service.js';
import { onAuthenticationCleared } from '../services/auth.service.js';
import { protectWork } from '../core/work-guard.js';

export function renderPlanner(model) {
  const root = document.querySelector('#learning-content');
  const heading = document.querySelector('.topbar-greeting :is(h1,h2)');
  if (heading) heading.textContent = 'Mi agenda';
  const subtitle = document.querySelector('.topbar-greeting p');
  if (subtitle) subtitle.textContent = 'Consulta tus tareas y prepara tus respuestas.';
  const demoBadge = document.querySelector('#learning-demo .demo-badge');
  if (demoBadge) demoBadge.textContent = 'Consulta API';
  document.querySelector('.avatar-button')?.setAttribute('hidden', '');
  document.querySelectorAll('.grade-pill,.notification-dot').forEach(node => { node.hidden = true; });
  const notifications = document.querySelector('.notification-button');
  if (notifications) { notifications.disabled = true; notifications.setAttribute('aria-label', 'Notificaciones remotas no disponibles'); }
  const controller = new AbortController();
  let page = 1, tasks = model.tasks, disposed = false, opening = false, activeDialog;
  const releases = new Set();
  const date = value => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: model.calendar.timezone }).format(new Date(value)) : 'Sin fecha indicada';
  const message = value => { const status = root.querySelector('#planner-status'); if (status) status.textContent = value; };
  const alive = dialog => !disposed && dialog.isConnected;
  function hidePrivate() {
    disposed = true; controller.abort(); releases.forEach(release => release());
    root.innerHTML = '<section role="alert" class="dashboard-card"><h1>Acceso a tareas no disponible</h1><p>La sesión o los permisos han cambiado. Inicia sesión de nuevo para consultar tus tareas.</p><a class="button-secondary" href="../login.html">Ir al inicio de sesión</a></section>';
  }
  function draw() {
    if (disposed) return;
    root.innerHTML = `<header class="agenda-header planner-header"><h1>Mi agenda académica</h1><p>Datos confirmados del servidor · ${esc(model.calendar.timezone)}. Las tareas son formativas.</p></header>
      <p role="status" id="planner-status" aria-live="polite"></p>
      <section class="agenda-summary"><article class="agenda-sum-card">${model.summary.pending_count} tareas pendientes</article><article class="agenda-sum-card">${model.summary.received_count} entregas recibidas</article><article class="agenda-sum-card">${model.summary.active_reinforcement_count} refuerzos activos</article></section>
      <section><h2>Mis tareas</h2>${tasks.items.map(task => `<article class="ev-card"><h3>${esc(task.title)}</h3><p>Entrega: ${esc(date(task.effective_due_at))} · ${esc(task.submission_status)}</p><button type="button" class="button-secondary" data-task="${esc(task.id)}">Abrir tarea</button></article>`).join('') || '<p>No tienes tareas asignadas en esta consulta. Puedes volver más tarde o pedir orientación a tu docente.</p>'}
      <button type="button" data-page="-1" ${page === 1 ? 'disabled' : ''}>Anterior</button><span> Página ${page} </span><button type="button" data-page="1" ${page * 25 >= tasks.total ? 'disabled' : ''}>Siguiente</button></section>
      <section><h2>Calendario: próximos 31 días</h2>${model.calendar.items.map(event => `<article class="ev-card"><h3>${esc(event.title)}</h3><p>${esc(event.all_day ? event.starts_on : date(event.starts_at))} · ${esc(event.source)} · ${esc(event.status)}</p></article>`).join('') || '<p>No hay eventos en este rango. Puedes consultar tus tareas en la sección anterior.</p>'}${model.calendar.total > model.calendar.items.length ? '<p>Hay más eventos en este rango; la vista muestra los primeros 100.</p>' : ''}<p>Evaluaciones programadas: fuente confirmada no disponible.</p></section>`;
  }
  async function openTask(taskId) {
    const task = await api.assignmentDetail(taskId);
    if (disposed) return;
    const listTask = tasks.items.find(item => item.id === taskId);
    let submission = listTask?.submission_id ? await api.readSubmission(listTask.submission_id) : null;
    if (disposed) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'planner-task-dialog';
    dialog.setAttribute('aria-label', 'Detalle de tarea');
    dialog.innerHTML = `<h2>${esc(task.title)}</h2><p>${esc(task.instructions ?? 'Las instrucciones estarán disponibles en la fecha indicada.')}</p><p>Plazo: ${esc(date(task.effective_due_at))}</p><p data-availability></p><p data-notice class="work-status" role="status" aria-live="polite"></p><label>Mi respuesta<textarea rows="8" maxlength="20000" data-response aria-describedby="task-save-note"></textarea></label><p id="task-save-note">Escribe con tus palabras. Guarda el borrador para conservarlo en el servidor; después pulsa Entregar cuando esté listo.</p><div class="planner-task-actions"><button type="button" class="button-secondary" data-save>Guardar borrador en servidor</button> <button type="button" class="button-primary" data-submit>Entregar</button> <button type="button" class="button-secondary" data-revise>Preparar corrección</button> <button type="button" class="button-secondary" data-close>Cerrar</button></div><section data-feedback></section>`;
    root.append(dialog);
    activeDialog = dialog;
    const text = dialog.querySelector('textarea'), notice = dialog.querySelector('[data-notice]');
    let confirmed = submission?.response_text ?? '';
    let submitKey = api.operationKey(), busy = false, closed = false;
    const beginKey = api.operationKey();
    const dirty = () => !closed && (busy || text.value !== confirmed);
    const guard = protectWork({ hasUnsavedChanges: dirty, message: () => 'Tu respuesta tiene cambios sin confirmar en el servidor. Si cierras, podrías perderlos. ¿Quieres salir de todas formas?' });
    const release = () => { closed = true; guard.dispose(); dialog.remove(); releases.delete(release); if (activeDialog === dialog) activeDialog = null; };
    releases.add(release);
    function state() {
      const editable = task.availability === 'available' && (!submission || submission.status === 'draft');
      text.readOnly = !editable || busy;
      dialog.querySelector('[data-save]').disabled = !editable || busy;
      dialog.querySelector('[data-submit]').disabled = !editable || busy || !text.value.trim();
      dialog.querySelector('[data-close]').disabled = busy;
      dialog.querySelector('[data-revise]').hidden = !(submission?.status === 'revision_requested' && task.allow_resubmission);
      dialog.querySelector('[data-revise]').disabled = busy;
      dialog.querySelector('[data-availability]').textContent = !editable ? submission?.submitted_at ? 'Esta entrega ya fue recibida. Puedes consultar tu respuesta y la retroalimentación publicada.' : 'La tarea no está abierta para escribir ahora. Revisa el plazo o consulta a tu docente.' : '';
      dialog.querySelector('[data-feedback]').innerHTML = (submission?.feedback ?? []).map(item => `<h3>Retroalimentación publicada</h3><p>${esc(item.feedback_text)}</p>`).join('');
    }
    text.value = confirmed;
    notice.textContent = submission ? 'Respuesta consultada en servidor.' : 'Todavía no hay un borrador guardado en el servidor.';
    state(); dialog.showModal();
    text.addEventListener('input', () => { notice.textContent = dirty() ? 'Cambios en esta ventana, pendientes de guardar en el servidor.' : 'La respuesta coincide con el borrador consultado.'; state(); });
    const close = () => {
      if (busy) { notice.textContent = 'Espera a que termine la consulta antes de cerrar.'; return; }
      if (guard.canLeave()) dialog.close();
    };
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { release(); root.querySelector(`[data-task="${CSS.escape(taskId)}"]`)?.focus(); }, { once: true });
    dialog.addEventListener('click', async event => {
      if (event.target.closest('[data-close]')) { close(); return; }
      const button = event.target.closest('[data-save],[data-submit],[data-revise]');
      if (!button || busy) return;
      if (!navigator.onLine) { notice.textContent = 'Sin conexión: tu respuesta sigue en esta ventana. No se ha guardado ni entregado; espera a recuperar la conexión.'; return; }
      const response = text.value;
      busy = true; state(); notice.textContent = 'Consultando servidor…';
      try {
        if (button.hasAttribute('data-revise')) {
          const next = await api.resubmitAssignment(submission.id, beginKey);
          if (!alive(dialog)) return;
          submission = next; text.value = confirmed = next.response_text ?? ''; submitKey = api.operationKey();
          notice.textContent = 'Nuevo borrador creado en servidor; se conserva la entrega anterior.';
        } else {
          if (!submission) {
            const next = await api.beginSubmission(taskId, beginKey);
            if (!alive(dialog)) return;
            submission = next;
            if (listTask) listTask.submission_id = next.id;
          }
          // Read the durable receipt BEFORE writing again after an uncertain delivery.
          const current = await api.readSubmission(submission.id);
          if (!alive(dialog)) return;
          submission = current;
          if (current.submitted_at) {
            confirmed = current.response_text ?? '';
            notice.textContent = response === confirmed ? 'Entrega ya recibida por el servidor.' : 'El servidor ya recibió una entrega anterior. El texto de esta ventana es distinto y no se ha enviado; consérvalo antes de cerrar.';
          } else {
            const saved = await api.saveSubmission(current.id, current.revision, response);
            if (!alive(dialog)) return;
            submission = saved; confirmed = saved.response_text ?? response;
            if (button.hasAttribute('data-submit')) {
              const received = await api.submitAssignment(saved.id, saved.revision, submitKey);
              if (!alive(dialog)) return;
              submission = received;
              notice.textContent = `Recibido por servidor: ${date(received.submitted_at)}. Referencia: ${received.receipt.confirmation_reference}`;
            } else notice.textContent = 'Borrador guardado en servidor.';
          }
        }
      } catch (error) {
        if (!alive(dialog)) return;
        if ([401,403].includes(error.status)) { hidePrivate(); return; }
        notice.textContent = `No se confirmó la operación: ${error.message}. Tu texto sigue en esta ventana. Reintentar consultará primero el estado del servidor.`;
      } finally { if (alive(dialog)) { busy = false; state(); } }
    });
  }
  const unsubscribe = onAuthenticationCleared(hidePrivate);
  draw();
  root.addEventListener('click', async event => {
    const task = event.target.closest('[data-task]'), paging = event.target.closest('[data-page]');
    if ((!task && !paging) || disposed || opening || activeDialog) return;
    const button = task || paging;
    opening = true; button.disabled = true; message('Consultando servidor…');
    try {
      if (task) await openTask(task.dataset.task);
      else {
        const next = page + Number(paging.dataset.page);
        const received = await api.ownAssignments(next);
        if (disposed) return;
        tasks = received; page = next; draw();
      }
      if (!disposed) message('');
    } catch (error) { if (!disposed) { if([401,403].includes(error.status))hidePrivate();else message(`No disponible: ${error.message}. Puedes volver a intentarlo con el mismo botón.`); } }
    finally { opening = false; if (!disposed) button.disabled = false; }
  }, { signal: controller.signal });
  return () => { disposed = true; unsubscribe(); controller.abort(); releases.forEach(release => release()); };
}
