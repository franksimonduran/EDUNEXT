// Prueba de integración: requiere Playwright solo como herramienta externa.
// Servir frontend por HTTP antes de ejecutar. No añade dependencias a la app.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8087/';
const captures = path.resolve(__dirname, '../docs/previews');

(async () => {
 const browser = await chromium.launch({ channel: 'msedge', headless: true });
 const context = await browser.newContext();
 const page = await context.newPage();
 const errors = [], unexpectedRequests = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
 page.on('request', request => {
  if (request.method() !== 'GET' || !request.url().startsWith(base)) unexpectedRequests.push(request.url());
 });
 const ready = () => page.waitForFunction(() => document.querySelector('#dashboard-main')?.getAttribute('aria-busy') === 'false');
 const close = async () => { await page.keyboard.press('Escape'); assert.equal(await page.locator('#dashboard-dialog').isVisible(), false); };
 async function capture(name, width) {
  await page.setViewportSize({ width, height: 960 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(220);
  await page.screenshot({ path: path.join(captures, name + '.png'), fullPage: true, animations: 'disabled' });
  if (name==='student-dashboard-desktop') await page.screenshot({path:path.join(captures,'student-dashboard-desktop-viewport.png'),animations:'disabled'});
  if (name==='student-dashboard-mobile') await page.screenshot({path:path.join(captures,'student-dashboard-mobile-viewport.png'),animations:'disabled'});
 }
 try {
  await page.goto(base + 'student/index.html');
  await ready();
  assert.equal(await page.locator('.course-card').count(), 5);
  assert.equal(await page.locator('.summary-card').count(), 4);
  assert.equal(await page.locator('#student-sidebar [data-section]').count(), 15);
  assert.equal(await page.locator('.quick-card').count(), 5);
  assert.equal(await page.locator('.evaluation-item').count(), 2);
  assert.equal(await page.locator('.activity-list li').count(), 3);
  assert.equal(await page.locator('.mission-list li').count(), 3);
  assert.equal(await page.locator('#continue-learning progress').getAttribute('value'), '70');
  assert.equal(await page.locator('.download-state').count(), 5);
  const values = await page.locator('#academic-summary').innerText();
  await page.reload(); await ready();
  assert.equal(await page.locator('#academic-summary').innerText(), values);

  for (const locale of ['es','en']) {
   await page.locator('#language-select').selectOption(locale);
   assert.equal(await page.locator('html').getAttribute('lang'), locale);
   for (const width of [320,375,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:960});
    await page.waitForTimeout(200);
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    if (!fits) console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=='fixed').map(el=>[el.tagName,el.className,el.getBoundingClientRect().width,el.getBoundingClientRect().right])));
    assert(fits, `${locale}/${width} overflow`);
    assert.equal(await page.locator('.course-card').count(),5);
    if (width <= 760) {
     assert.equal(await page.locator('#student-sidebar').isVisible(),false);
     assert.equal(await page.locator('#student-bottom-nav button').count(),5);
    }
   }
  }
  assert.match(await page.locator('#courses-title').innerText(),/My courses/);
  await page.locator('[data-open="notifications"]').click();
  assert.equal(await page.locator('.notification-list li').count(),4);
  assert.match(await page.locator('#dashboard-dialog-content').innerText(),/Sample notifications/);
  // El diálogo nativo mantiene el foco dentro mientras está abierto.
  for(let index=0;index<6;index++) await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.querySelector('#dashboard-dialog').contains(document.activeElement)));
  await close();
  assert.equal(await page.evaluate(() => document.activeElement.dataset.open),'notifications');
  await page.locator('#language-select').selectOption('es');
  await page.setViewportSize({width:1440,height:960});
  const before = await page.locator('#student-sidebar').evaluate(el=>el.getBoundingClientRect().width);
  await page.locator('#sidebar-toggle').click();
  await page.waitForTimeout(200);
  const after = await page.locator('#student-sidebar').evaluate(el=>el.getBoundingClientRect().width);
  assert.notEqual(before, after);
  await page.locator('#sidebar-toggle').click();

  for(const [grade,topic] of [['4','Fracciones básicas'],['5','Decimales'],['6','Porcentajes']]) {
   await page.locator('#grade-select').selectOption(grade); await ready();
   assert.match(await page.locator('.course-card').first().innerText(),new RegExp(topic));
   assert.equal(await page.locator('#grade-select').inputValue(),grade);
  }
  await page.locator('#grade-select').selectOption('5'); await ready();
  for(const id of ['math','reading','science','social','english']) {
   await page.locator(`.course-card [data-course="${id}"]`).click();
   await page.waitForURL('**/curso.html?**');
   await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
   assert.equal(new URL(page.url()).searchParams.get('course'),id);
   assert.equal(await page.locator('.unit-card').count(),1);
   await page.goto(base+'student/index.html'); await ready();
  }
  await page.locator('[data-evaluation]').first().click();
  assert.match(await page.locator('#dashboard-dialog-content').innerText(),/no está habilitada/);
  assert.equal(await page.locator('#dashboard-dialog-content [type="submit"]').count(),0);
  await close();
  for(const [key,file] of [['practice','practica.html'],['games','juegos.html']]) {
   await page.locator(`#student-sidebar [data-section="${key}"]`).click();
   await page.waitForURL(`**/${file}?**`);
   await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
   assert.equal(await page.locator('.practice-card').count(),5);
   await page.goto(base+'student/index.html');await ready();
  }
  await page.locator('#student-sidebar [data-section="tutor"]').click();
  await page.waitForURL('**/tutor.html?**');
  await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
  assert.equal(await page.locator('h1').innerText(),'EDUNEXT AI');
  await page.goto(base+'student/index.html');await ready();
  for(const key of ['translator','pronunciation','achievements','downloads','profile']) {
   await page.locator(`#student-sidebar [data-section="${key}"]`).click();
   assert.match(await page.locator('#dashboard-dialog-title').innerText(),/Próximamente/);
   await close();
  }
  for(const key of ['progress','missions','planner','assessments','home']) {
   await page.locator(`#student-sidebar [data-section="${key}"]`).click();
   assert.equal(await page.locator('#dashboard-dialog').isVisible(),false);
  }
  await page.locator('[data-open="user"]').click();
  assert.equal(await page.locator('.user-options button').count(),4);
  await page.locator('[data-user-action="logout"]').click();
  assert.match(await page.locator('#dashboard-dialog-content').innerText(),/No hay una sesión real/);
  assert.equal((await page.request.get(base+'login.html')).status(),200);
  await close();
  await page.locator('[data-open="user"]').click();
  await page.locator('[data-user-action="language"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'language-select');
  await page.locator('[data-open="user"]').click();
  await page.locator('[data-section="settings"]').click();
  assert.match(await page.locator('#dashboard-dialog-title').innerText(),/Configuración/);
  await close();

  await page.setViewportSize({width:320,height:800});
  await page.locator('[data-open="more"]').click();
  assert.equal(await page.locator('.more-navigation [data-section]').count(),14);
  await page.locator('.more-navigation [data-section="tutor"]').click();
  await page.waitForURL('**/tutor.html?**');
  await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
  assert.equal(await page.locator('h1').innerText(),'EDUNEXT AI');
  await page.goto(base+'student/index.html');await ready();
  await page.locator('#student-bottom-nav [data-section="courses"]').click();
  await page.waitForURL('**/aprende.html?**');
  await page.waitForFunction(()=>document.querySelector('#learning-main').getAttribute('aria-busy')==='false');
  assert.equal(await page.locator('.course-card').count(),5);
  await page.goto(base+'student/index.html'); await ready();
  await page.locator('#student-bottom-nav [data-section="progress"]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'progress-title');
  await page.locator('[data-open="notifications"]').click();
  await page.locator('#close-dialog').click();
  assert.equal(await page.locator('#dashboard-dialog').isVisible(),false);

  await context.setOffline(true);
  await page.waitForFunction(()=>!navigator.onLine);
  await page.waitForSelector('#offline-notice:not([hidden])');
  assert.equal(await page.locator('#offline-notice').isVisible(),true);
  assert.match(await page.locator('#offline-notice').innerText(),/todavía no hay contenidos descargados/);
  await context.setOffline(false);
  await page.waitForFunction(()=>navigator.onLine);
  await page.waitForFunction(()=>document.querySelector('#offline-notice').hidden);
  assert.equal(await page.locator('#offline-notice').isVisible(),false);

  const broken = await page.evaluate(async()=>{
   const urls=[...document.querySelectorAll('a[href],link[href],script[src],img[src]')].map(el=>el.href||el.src);
   return (await Promise.all(urls.filter(url=>!url.includes('#')).map(async url=>[url,(await fetch(url)).status]))).filter(([,status])=>status!==200);
  });
  assert.deepEqual(broken,[]);
  assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
  assert.deepEqual(await page.evaluate(async()=>await indexedDB.databases()),[]);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.course-card').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:960});
  if(await page.locator('#student-shell').evaluate(el=>el.classList.contains('is-collapsed'))) await page.locator('#sidebar-toggle').click();
  await page.waitForTimeout(200);
  await capture('student-dashboard-desktop',1440);
  await capture('student-dashboard-tablet',1024);
  await capture('student-dashboard-mobile',375);
  await capture('student-dashboard-mobile-320',320);
  await page.locator('#language-select').selectOption('en');
  await capture('student-dashboard-english',1440);
  if (process.env.AXE_MODULE) {
   const { default: AxeBuilder } = require(process.env.AXE_MODULE);
   for(const [locale,width] of [['es',1440],['es',320],['en',1440],['en',320]]) {
    await page.setViewportSize({width,height:960});
    await page.locator('#language-select').selectOption(locale);
    if(width===1440 && await page.locator('#student-shell').evaluate(el=>el.classList.contains('is-collapsed'))) await page.locator('#sidebar-toggle').click();
    await page.waitForTimeout(200);
    const audit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    if(audit.violations.length) console.log(JSON.stringify(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2));
    assert.deepEqual(audit.violations.map(v=>v.id),[],`Accessibility at ${width}`);
   }
   await page.locator('[data-open="notifications"]').click();
   const modalAudit = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(modalAudit.violations.map(v=>v.id),[],'Notification dialog accessibility');
   await close();
   console.log('Axe: WCAG A/AA automated checks desktop, mobile and notification dialog OK');
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(unexpectedRequests,[]);
  console.log('Dashboard: ES/EN, 3 grades, 6 widths, course cards, sidebar, panels, keyboard, offline indicator, links, reduced motion and storage checks OK');

  // Error y estados vacíos mediante adaptadores de prueba, no datos falsos de producción.
  const errorPage = await context.newPage();
  await errorPage.route('**/js/services/student.service.js',route=>route.fulfill({contentType:'text/javascript',body:'let first=true; export async function loadStudentDemo(grade){ if(first){first=false;throw new Error("test");} const {getStudentDemo}=await import("../data/student-demo.data.js");return getStudentDemo(grade); }'}));
  await errorPage.goto(base+'student/index.html');
  await errorPage.waitForSelector('#dashboard-error:not([hidden])');
  await errorPage.locator('#retry-dashboard').click();
  await errorPage.waitForSelector('#dashboard-content:not([hidden])');
  assert.equal(await errorPage.locator('.course-card').count(),5);
  await errorPage.close();
  const emptyChecks=await page.evaluate(async()=>{
   const {renderCourseCards}=await import('../js/components/course-card.js');
   const {renderNotifications}=await import('../js/components/notification-panel.js');
   return [renderCourseCards([]),renderNotifications([])];
  });
  assert(emptyChecks.every(html=>html.includes('empty-state')));
  const nojs=await browser.newPage({javaScriptEnabled:false});
  await nojs.goto(base+'student/index.html');
  assert(await nojs.locator('noscript').isVisible());
  await nojs.close();
  console.log('Dashboard: error/retry, empty components and no-JS explanation OK');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
