import { readLearningRoute } from './learning-routes.js';
import { setupLearningShell, showLearningError } from './learning-shell.js';
import { lt } from './learning-i18n.js';

export async function bootLearningPage(loader, render, options = {}) {
  let route, routeError, model, dispose;
  let generation = 0;
  let departed = false;
  try { route = readLearningRoute(); }
  catch (error) { routeError = error; route = { grade: 5, lang: 'es' }; }
  const release = () => {
    if (typeof dispose === 'function') dispose();
    dispose = null;
  };
  const failure = error => showLearningError(error, route, { retry: routeError ? undefined : load });
  const draw = async () => {
    release();
    if (model) dispose = await render(model, route, shell);
    else if (routeError) failure(routeError);
  };
  const shell = setupLearningShell(route, () => draw().catch(failure), options);
  const main = document.querySelector('#learning-main');
  const loading = document.querySelector('#learning-loading');
  async function load() {
    const run = ++generation;
    release();
    main.setAttribute('aria-busy', 'true');
    loading.hidden = false;
    loading.querySelector('span:last-child').textContent = lt('loading');
    document.querySelector('[data-retry-learning]')?.setAttribute('disabled', '');
    try {
      if (routeError) throw routeError;
      const next = await loader(route);
      if (departed || run !== generation) return;
      model = next;
      await draw();
    } catch (error) {
      if (!departed && run === generation) { model = null; failure(error); }
    } finally {
      if (!departed && run === generation) { loading.hidden = true; main.setAttribute('aria-busy', 'false'); }
    }
  }
  window.addEventListener('pagehide', () => { departed = true; generation++; release(); }, { once: true });
  await load();
}
