import {mountLocalTutor} from './local-tutor.js';
import {getAICapabilities,getTutorContexts,sendTutorMessage,aiOperationKey} from '../services/ai-api.service.js';
import {onAuthenticationCleared} from '../services/auth.service.js';

export function mountTutorWorkspace(root, model) {
  const events = new AbortController();
  let active = true, version = 0, busy = false, pending = null;
  root.innerHTML = `<section class="tutor-workspace"><h1>EDUNEXT AI</h1><div class="ai-tabs" role="tablist" aria-label="Tipo de inteligencia artificial"><button id="ai-local-tab" type="button" role="tab" aria-selected="true" aria-controls="ai-local-panel">IA local</button><button id="ai-online-tab" type="button" role="tab" aria-selected="false" aria-controls="ai-online-panel" tabindex="-1">IA online</button></div><section id="ai-local-panel" role="tabpanel" aria-labelledby="ai-local-tab"></section><section id="ai-online-panel" role="tabpanel" aria-labelledby="ai-online-tab" hidden><h2>IA online</h2><p>Consulta el servicio institucional. Solo lo que envíes aquí se procesa en ese servicio; el proveedor depende de su configuración.</p><button id="ai-online-connect" type="button" class="button-secondary">Comprobar disponibilidad</button><p id="ai-online-status" role="status" aria-live="polite">Servicio sin comprobar. Requiere iniciar sesión.</p><form id="ai-online-form"><label for="ai-online-lesson">Lección autorizada</label><select id="ai-online-lesson" disabled></select><label for="ai-online-question">Pregunta · Sin datos personales</label><textarea id="ai-online-question" maxlength="500" rows="3" disabled required></textarea><button id="ai-online-send" class="button-primary" type="submit" disabled>Enviar al servicio online</button></form><div id="ai-online-log" role="log" aria-label="Conversación online" aria-live="polite"></div><p>Conversación solo en memoria de esta vista. El servicio procesa cada pregunta por separado. Puede equivocarse.</p></section></section>`;
  const get = id => root.querySelector('#' + id);
  const disposeLocal = mountLocalTutor(get('ai-local-panel'), model);
  const tabs = [get('ai-local-tab'), get('ai-online-tab')];
  function selectTab(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      get(i === 0 ? 'ai-local-panel' : 'ai-online-panel').hidden = i !== index;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index), {signal: events.signal});
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
      selectTab(next); tabs[next].focus();
    }, {signal: events.signal});
  });
  const status = get('ai-online-status'), connect = get('ai-online-connect');
  const lesson = get('ai-online-lesson'), question = get('ai-online-question'), send = get('ai-online-send'), log = get('ai-online-log');
  const lock = () => { lesson.disabled = question.disabled = send.disabled = true; };
  const unsubscribe = onAuthenticationCleared(() => {
    version++; busy = false; pending = null; lock(); log.replaceChildren(); question.value = ''; lesson.replaceChildren();
    connect.disabled = false; status.textContent = 'Sesión finalizada. Inicia sesión y comprueba el servicio de nuevo.';
  });
  connect.addEventListener('click', async () => {
    const current = ++version;
    lock(); connect.disabled = true; status.textContent = 'Consultando disponibilidad…';
    try {
      const [caps, contexts] = await Promise.all([getAICapabilities(), getTutorContexts()]);
      if (!active || current !== version) return;
      lesson.replaceChildren();
      for (const item of contexts.items ?? []) {
        const option = document.createElement('option'); option.value = item.lesson_id; option.textContent = item.title; lesson.append(option);
      }
      const available = caps.capabilities?.some(item => item.service === 'tutor' && item.state === 'available');
      if (!available) { status.textContent = 'Servicio online no disponible. No se usan respuestas simuladas.'; return; }
      if (!lesson.options.length) { status.textContent = 'No hay lecciones autorizadas para consultar.'; return; }
      lesson.disabled = question.disabled = send.disabled = false;
      status.textContent = 'Servicio disponible. Cada envío se procesa mediante el servicio institucional.';
    } catch {
      if (active && current === version) status.textContent = 'No se pudo acceder al servicio. Comprueba tu sesión y la conexión.';
    } finally { if (active && current === version) connect.disabled = false; }
  }, {signal: events.signal});
  get('ai-online-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || send.disabled || !question.value.trim() || !lesson.value) return;
    const text = question.value.trim();
    if (text.length > 500) return;
    const signature = JSON.stringify([text, lesson.value]);
    if (pending?.signature !== signature) pending = {signature, key: aiOperationKey()};
    const current = ++version;
    busy = true; send.disabled = connect.disabled = true; question.disabled = lesson.disabled = true;
    status.textContent = 'Esperando respuesta del servicio…';
    try {
      const result = await sendTutorMessage({text, lesson_id: lesson.value, action: 'explain'}, pending.key);
      if (!active || current !== version) return;
      for (const [name, value] of [['Tú', text], ['IA online', result.text], ['Aviso', result.warning]]) {
        if (!value) continue;
        const p = document.createElement('p'); const label = document.createElement('strong');
        label.textContent = name + ': '; p.append(label, document.createTextNode(value)); log.append(p);
      }
      pending = null; question.value = ''; status.textContent = 'Respuesta recibida. Verifica la información con tu docente.';
    } catch {
      if (active && current === version) status.textContent = 'No se obtuvo respuesta. Puedes reintentar; no se cambia a IA local.';
    } finally {
      if (active && current === version) { busy = false; send.disabled = connect.disabled = question.disabled = lesson.disabled = false; }
    }
  }, {signal: events.signal});
  if (new URLSearchParams(location.search).get('modo') === 'api') selectTab(1);
  return () => { active = false; version++; events.abort(); unsubscribe(); disposeLocal(); root.replaceChildren(); };
}
