// HTTP doubles used exclusively by the opt-in local browser test.
module.exports = function createJourneyFixture() {
  const state = { denied: false, failCalendar: false, failSubmitOnce: true, submitCalls: 0, patchCalls: 0, patchDelay: 0, keys: [], submission: null };
  const task = { id: 'synthetic-task', title: 'Lectura <script>sin ejecutar</script>', instructions: 'Explica con tus palabras la idea principal.', effective_due_at: '2026-11-01T17:00:00-05:00', availability: 'available', allow_resubmission: false };
  function handle(req, res, pathname) {
    if (!pathname.startsWith('/api/')) return false;
    const send = (body, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    const route = pathname.replace('/api/v1', '');
    if (route.startsWith('/auth/')) { send({ detail: 'Fixture sin sesión real' }, 401); return true; }
    if (state.denied) { send({ detail: 'Permiso denegado de muestra' }, 403); return true; }
    if (route === '/assignments/me') send({ items: [{ ...task, submission_id: state.submission?.id ?? null, submission_status: state.submission?.status ?? 'not_started' }], total: 1 });
    else if (route === '/academic-calendar/me') state.failCalendar ? send({ detail: 'Fallo temporal de muestra' }, 503) : send({ items: [], total: 0, timezone: 'America/Lima' });
    else if (route === '/planner-summary/me') send({ pending_count: 1, received_count: 0, active_reinforcement_count: 0 });
    else if (route === '/assignments/synthetic-task') send(task);
    else if (route === '/assignments/synthetic-task/submissions') {
      state.submission ??= { id: 'synthetic-submission', revision: 1, status: 'draft', response_text: '', submitted_at: null, feedback: [] };
      send(state.submission, 201);
    } else if (route === '/assignment-submissions/synthetic-submission' && req.method === 'PATCH') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const data = JSON.parse(body);
        if (data.expected_revision !== state.submission.revision) { send({ detail: 'Conflicto de revisión' }, 409); return; }
        state.patchCalls++;
        state.submission = { ...state.submission, revision: state.submission.revision + 1, response_text: data.response_text };
        const snapshot = { ...state.submission };
        setTimeout(() => send(snapshot), state.patchDelay);
      });
    } else if (route === '/assignment-submissions/synthetic-submission') send(state.submission);
    else if (route === '/assignment-submissions/synthetic-submission/submit') {
      state.submitCalls++; state.keys.push(req.headers['idempotency-key']);
      state.submission = { ...state.submission, revision: state.submission.revision + 1, status: 'submitted', submitted_at: '2026-10-27T17:00:00Z', receipt: { confirmation_reference: 'SYNTHETIC-RECEIPT' } };
      if (state.failSubmitOnce) { state.failSubmitOnce = false; send({ detail: 'Respuesta de entrega interrumpida de muestra' }, 503); }
      else send(state.submission);
    } else send({ detail: 'Ruta no configurada en fixture' }, 503);
    return true;
  }
  return { state, handle };
};
