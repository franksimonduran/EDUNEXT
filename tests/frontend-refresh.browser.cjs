// Real local browser, synthetic public views only. No backend or private credentials.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { saveFinalEvidence, evidenceDirectory } = require('../tools/final-evidence.cjs');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const temp = path.join(process.env.LOCALAPPDATA || path.join(require('node:os').homedir(), 'AppData', 'Local'), 'Temp', 'opencode');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav', '.webmanifest': 'application/manifest+json', '.wasm':'application/wasm', '.json':'application/json' };
const missing = new Set();
const journeyFixture = process.env.AITHRON_STUDENT_JOURNEY === '1' ? require('./fixtures/student-journey.fixture.cjs')() : null;
const premiumReadability = process.env.AITHRON_PREMIUM_READABILITY === '1' ? require('./fixtures/premium-readability-checks.cjs') : null;
const brandFixture = process.env.EDUNEXT_BRAND_VALIDATION === '1' ? require('./fixtures/edunext-brand-checks.cjs')() : null;
const argosFixture = process.env.EDUNEXT_ARGOS_BROWSER === '1' ? require('./fixtures/argos-translation-browser.cjs')() : null;
const minicpmFixture = process.env.EDUNEXT_MINICPM_BROWSER === '1' ? require('./fixtures/local-minicpm-browser.cjs')() : null;
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (argosFixture?.handle(req, res, pathname)) return;
  if (brandFixture?.handle(req, res, pathname)) return;
  if (journeyFixture?.handle(req, res, pathname)) return;
  if (req.method !== 'GET' || pathname.startsWith('/api/')) { res.writeHead(503); res.end(); return; }
  const file = path.resolve(frontend, '.' + pathname);
  if (!file.startsWith(frontend + path.sep) || pathname.split('/').some(p => p.startsWith('.')) || !fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(fs.realpathSync(frontend) + path.sep)) {
    missing.add(pathname); res.writeHead(404); res.end(); return;
  }
  const stat = fs.statSync(file);
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});

async function connect(url) {
  const socket = new WebSocket(url), pending = new Map(), errors = [], requests = [];
  let id = 0;
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Network.requestWillBeSent') requests.push({url:message.params.request.url,method:message.params.request.method});
    const request = pending.get(message.id);
    if (request) { pending.delete(message.id); clearTimeout(request.timer); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
  };
  function call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const key = ++id;
      const timer = setTimeout(() => { pending.delete(key); reject(new Error('CDP timeout: ' + method)); }, 15000);
      pending.set(key, { resolve, reject, timer }); socket.send(JSON.stringify({ id: key, method, params }));
    });
  }
  return { call, errors, requests, close: () => socket.close(), evaluate: async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'Evaluation failed');
    return result.result.value;
  } };
}

(async () => {
  assert.equal(process.env.AITHRON_FINAL_VALIDATION, '1', 'Use final validation namespace');
  assert.ok(fs.existsSync(temp));
  await argosFixture?.start();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const profile = fs.mkdtempSync(path.join(temp, 'frontend-refresh-'));
  const child = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--remote-debugging-port=0', '--disable-extensions', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let cdp;
  const results = [];
  const directory = path.join(root, evidenceDirectory());
  fs.mkdirSync(directory, { recursive: true });
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      const active = path.join(profile, 'DevToolsActivePort');
      if (fs.existsSync(active)) { port = fs.readFileSync(active, 'utf8').split('\n')[0]; break; }
      await delay(100);
    }
    assert.ok(port, 'Browser started');
    const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    cdp = await connect(tab.webSocketDebuggerUrl);
    await cdp.call('Page.enable'); await cdp.call('Runtime.enable');
    async function navigate(url) {
      await cdp.call('Page.navigate', { url });
      for (let i = 0; i < 120; i++) {
        await delay(50);
        if (await cdp.evaluate(`location.pathname === ${JSON.stringify(new URL(url).pathname)} && document.readyState === 'complete' && Boolean(document.querySelector('main')) && !document.querySelector('main[aria-busy="true"], main [aria-busy="true"]') && (location.pathname !== '/monitor/index.html' || Boolean(document.querySelector('.monitor-hero'))) && (location.pathname !== '/admin/index.html' || Boolean(document.querySelector('.admin-hero')))`)) { await delay(100); return; }
      }
      throw new Error('Page not ready: ' + url);
    }
    async function screenshot(name) {
      const image = await cdp.call('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(directory, name + '.png'), Buffer.from(image.data, 'base64'), { flag: 'wx' });
    }
    const pages = [
      'login.html', 'register.html', 'forgot-password.html', 'reset-password.html',
      'student/index.html', 'student/aprende.html', 'student/practica.html', 'student/juegos.html',
      'student/evaluaciones.html', 'student/agenda.html', 'student/progreso.html', 'student/misiones.html',
      'student/logros.html', 'student/descargas.html', 'student/tutor.html', 'student/traductor.html',
      'student/pronuncia.html', 'student/perfil.html', 'student/configuracion.html',
      'monitor/index.html', 'monitor/cursos.html', 'monitor/estudiantes.html', 'monitor/tareas.html',
      'admin/index.html', 'admin/usuarios.html', 'admin/matriculas.html',
    ];
    if (brandFixture) pages.push('unauthorized.html', 'admin/sync.html', 'monitor/reportes.html');
    if (premiumReadability) pages.push(
      'student/curso.html?course=math',
      'student/unidad.html?course=math&unit=math-g4-u1',
      'student/leccion.html?course=math&unit=math-g4-u1&lesson=math-g4-u1-l1',
      'student/ejercicio.html?activity=practice-math-4',
      'student/juego.html?activity=game-memory-4',
      'student/actividades-pendientes.html', 'student/recordatorios.html',
      'student/accesibilidad.html', 'student/mis-descargas.html',
      'monitor/editar-evaluacion.html', 'monitor/notas.html', 'monitor/reportes.html',
      'monitor/configuracion.html', 'monitor/perfil.html',
      'admin/aulas.html', 'admin/editar-usuario.html',
      'admin/periodos-academicos.html', 'admin/asignaciones-docentes.html'
    );
    if (process.env.AITHRON_CORPORATE_COMPOSITION === '1') pages.push(
      'monitor/detalle-curso.html?grade=4&course=math',
      'monitor/lecciones.html?grade=4&course=math&unit=math-g4-u1',
      'monitor/editar-leccion.html?grade=4&course=math&unit=math-g4-u1',
      'monitor/editar-perfil.html'
    );
    if (process.env.AITHRON_PREMIUM_FOCUS === '1') pages.length = 0;
    for (const page of pages) {
      for (const width of [320, 768, 1440]) {
        await cdp.call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
        const before = cdp.errors.length;
         await navigate(`${base}/${page}${page.startsWith('student/') ? (page.includes('?')?'&':'?')+'grade=4&lang=es&modo=demo' : ''}`);
         if (brandFixture) await brandFixture.checkPage({ cdp, page, width, results });
        if (process.env.AITHRON_REFERENCE_PALETTES === '1' && /^(monitor|admin)\/index\.html$/.test(page)) {
          const palette = await cdp.evaluate(`document.documentElement.dataset.theme='light'; (() => { const sidebar=document.querySelector('#monitor-sidebar,#admin-sidebar'); return {background:getComputedStyle(document.body).backgroundColor, sidebar:getComputedStyle(sidebar).backgroundColor}; })()`);
          assert.equal(palette.sidebar, 'rgb(17, 27, 46)');
          assert.equal(palette.background, page.startsWith('admin/') ? 'rgb(242, 246, 255)' : 'rgb(255, 248, 239)');
          const layout = await cdp.evaluate(`({stats:document.querySelectorAll('.reference-stat').length,links:[...document.querySelectorAll('.reference-shortcut')].map(a=>new URL(a.href).pathname),search:!!document.querySelector('.reference-search input')})`);
          assert.equal(layout.stats, 4);
          assert.equal(layout.links.length, 4);
          assert.equal(layout.search, true);
          for (const link of layout.links) assert.ok(fs.existsSync(path.join(frontend, link)), 'Existing shortcut: '+link);
          results.push({ check: 'reference-light-palette', page, width, ...palette, pass: true });
        }
        const snapshot = await cdp.evaluate(`({overflow:document.documentElement.scrollWidth > innerWidth, title:document.title, busy:Boolean(document.querySelector('main[aria-busy="true"]')), navigation:document.querySelectorAll('#student-sidebar a[data-nav-section]').length, overflowing:document.documentElement.scrollWidth > innerWidth ? [...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>e.className) : []})`);
        const readability = premiumReadability ? await premiumReadability(cdp) : undefined;
        results.push({ page, width, ...snapshot, readability, exceptions: cdp.errors.slice(before), pass: !snapshot.overflow && !snapshot.busy && cdp.errors.length === before && (!readability || readability.smallTextCount === 0) });
        if (page.endsWith('/index.html') && width !== 768) await screenshot(page.split('/')[0] + '-' + width);
      }
    }
    await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate(base + '/student/index.html?grade=6&lang=en&modo=demo');
    const links = await cdp.evaluate(`[...document.querySelectorAll('#student-sidebar a[data-nav-section]')].map(a=>({section:a.dataset.navSection,href:a.href,label:a.textContent.trim()}))`);
    assert.equal(links.length, 14);
    assert.equal(new Set(links.map(link => link.href)).size, 14);
    for (const link of links) {
      assert.equal(new URL(link.href).searchParams.get('grade'), '6');
      assert.equal(new URL(link.href).searchParams.get('lang'), 'en');
      assert.equal(new URL(link.href).searchParams.get('modo'), 'demo');
      assert.ok(!['agenda', 'evaluations'].includes(link.label), 'Translated label');
      const before = cdp.errors.length;
      await navigate(link.href);
      assert.equal(cdp.errors.length, before, link.section + ' without exceptions');
      const active = await cdp.evaluate(`document.querySelector('#student-sidebar [aria-current="page"]')?.dataset.navSection`);
      results.push({ section: link.section, active, pass: active === link.section, scope: 'Student section navigation' });
    }
    await navigate(base + '/student/agenda.html?grade=4&modo=demo');
    assert.equal(await cdp.evaluate(`document.querySelector('#next').click(); document.activeElement.id`), 'next');
    await navigate(base + '/student/descargas.html?grade=4&modo=demo');
    const filter = await cdp.evaluate(`document.querySelector('[data-f="descargados"]').click(); ({pressed:document.querySelector('[data-f="descargados"]').getAttribute('aria-pressed'), empty:Boolean(document.querySelector('#list .empty-state')), focus:document.activeElement.dataset.f})`);
    assert.deepEqual(filter, { pressed: 'true', empty: true, focus: 'descargados' });
    await navigate(base + '/student/index.html?grade=4&lang=en&modo=demo');
    await cdp.evaluate(`document.querySelector('#student-sidebar [data-nav-section="agenda"]').focus()`);
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    let keyboardNavigation = false;
    for (let i = 0; i < 100; i++) {
      await delay(50);
      if (await cdp.evaluate(`location.pathname==='/student/agenda.html' && document.querySelector('#learning-main')?.getAttribute('aria-busy')==='false'`)) { keyboardNavigation = true; break; }
    }
    assert.ok(keyboardNavigation, 'Keyboard follows native section link');
    results.push({ check: 'download-filter-focus-and-keyboard-section-navigation', filter, keyboardNavigation, pass: true });
    await navigate(base + '/monitor/index.html');
    const disclosure = await cdp.evaluate(`document.querySelector('[data-open="navigation"]').click(); new Promise(resolve=>setTimeout(()=>resolve(document.querySelector('[data-open="navigation"]').getAttribute('aria-expanded')),30))`);
    assert.equal(disclosure, 'true');
    await navigate(base + '/student/index.html?grade=4&modo=demo');
    await cdp.evaluate(`document.documentElement.dataset.theme='dark'`);
    const dark = await cdp.evaluate(`getComputedStyle(document.querySelector('#academic-summary')).backgroundColor`);
    assert.equal(dark, 'rgb(26, 38, 56)');
    const darkControls = await cdp.evaluate(`({hero:getComputedStyle(document.querySelector('.hero-button')).color,selectBackground:getComputedStyle(document.querySelector('#grade-select')).backgroundColor})`);
    assert.deepEqual(darkControls, { hero: 'rgb(255, 255, 255)', selectBackground: 'rgb(26, 38, 56)' });
    await screenshot('student-dark');
    await cdp.evaluate(`document.documentElement.style.fontSize='200%'`);
    const zoomOverflow = await cdp.evaluate('document.documentElement.scrollWidth > innerWidth');
    results.push({ check: 'calendar-focus-menu-disclosure-dark-and-text-200-percent', dark, zoomOverflow, pass: !zoomOverflow });
    if (premiumReadability) await require('./fixtures/premium-layout-checks.cjs')({ cdp, base, navigate, screenshot, results });
    if (process.env.AITHRON_CORPORATE_COMPOSITION === '1') await require('./fixtures/corporate-composition-checks.cjs')({ cdp, base, navigate, screenshot, results });
    if (journeyFixture) await require('./fixtures/student-journey-checks.cjs')({ cdp, base, navigate, screenshot, fixture: journeyFixture, results });
    if (brandFixture) await brandFixture.verifyContinuity({ cdp, base, navigate, results });
    if (argosFixture) await argosFixture.check({ cdp, base, navigate, results });
    if (minicpmFixture) await minicpmFixture.check({ cdp, base, navigate, results });
    assert.equal(cdp.errors.length, 0, 'No browser exceptions across journeys');
    assert.deepEqual([...missing].filter(p => p !== '/favicon.ico'), [], 'No missing resources');
  } catch (error) {
    results.push({ pass: false, error: error.message, exceptions: cdp?.errors ?? [] });
  } finally {
    cdp?.close(); child.kill(); argosFixture?.stop(); server.close();
    const evidence = { date: new Date().toISOString(), scope: 'Public demo, real Edge, synthetic disposable profile. No authenticated E2E, PostgreSQL, physical mobile, screen reader or WCAG certification.', results, missing: [...missing], pass: results.length > 0 && results.every(result => result.pass) };
    saveFinalEvidence('FRONTEND_REFRESH_BROWSER.json', evidence);
    const files = require('../tools/final-inventory.cjs').corpus().filter(file => file.path.startsWith('frontend/'));
    saveFinalEvidence('FRONTEND_REFRESH_HASHES.json', { date: new Date().toISOString(), scope: 'Public frontend source and resources only; no historical candidate manifest overwritten.', files });
    console.log(JSON.stringify(premiumReadability || brandFixture || argosFixture || minicpmFixture ? {date:evidence.date,pass:evidence.pass,checks:results.length,generation:results.find(result=>result.generation)?.generation,failed:results.filter(result=>!result.pass).map(result=>({check:result.check,page:result.page,profile:result.profile,theme:result.theme,width:result.width,overflow:result.overflow,overflowing:result.overflowing,clipped:result.clipped,smallTextCount:result.readability?.smallTextCount,smallText:result.readability?.smallText.filter((item,index,items)=>items.findIndex(other=>other.className===item.className&&other.parentClass===item.parentClass&&other.fontSize===item.fontSize)===index),exceptions:result.exceptions,error:result.error})),evidence:path.relative(root,directory)} : evidence, null, 2));
    if (!evidence.pass) process.exitCode = 1;
  }
})().catch(error => { console.error(error); argosFixture?.stop(); server.close(); process.exitCode = 1; });
