const assert = require('node:assert/strict');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
module.exports = async function checkCorporateComposition({ cdp, base, navigate, screenshot, results }) {
  const evaluate = expression => cdp.evaluate(`(()=>eval(${JSON.stringify(expression)}))()`);
  async function wait(expression) {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw new Error('Corporate condition not met: ' + expression);
  }
  for (const profile of ['student', 'monitor', 'admin']) {
    for (const width of [375, 1440]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await navigate(base + '/' + profile + '/index.html');
      await evaluate(`document.documentElement.dataset.theme='light';scrollTo(0,0)`);
      const layout = await evaluate(`({h1:document.querySelectorAll('h1').length,heading:document.querySelector('main h1').textContent,overflow:document.documentElement.scrollWidth>innerWidth,corporate:document.body.classList.contains('corporate-ui')})`);
      assert.equal(layout.h1, 1, profile + ' has one primary heading');
      assert.equal(layout.overflow, false);
      assert.equal(layout.corporate, true);
      if (profile === 'student') {
        const action = await evaluate(`({top:document.querySelector('.hero-button').getBoundingClientRect().top,bottom:document.querySelector('.hero-button').getBoundingClientRect().bottom,guideAfter:!!(document.querySelector('#continue-learning').compareDocumentPosition(document.querySelector('#student-guide'))&Node.DOCUMENT_POSITION_FOLLOWING)})`);
        assert.ok(action.bottom < 820, 'Continue action is visible without scrolling');
        assert.equal(action.guideAfter, true, 'Guide does not precede primary activity');
        await evaluate(`document.querySelector('[data-open="guide"]').click()`);
        assert.equal(await evaluate(`document.querySelector('#dashboard-dialog').open && document.querySelector('#dashboard-dialog details').open`), true);
        await evaluate(`document.querySelector('#close-dialog').click()`);
        layout.continueAction = action;
      }
      if (profile === 'admin') {
        assert.equal(await evaluate(`document.querySelector('#admin-presentation').contains(document.querySelector('#admin-theme'))`), true);
        if (width === 375) assert.equal(await evaluate(`document.querySelector('#admin-filter-panel').open`), false);
      }
      if (profile === 'monitor') assert.equal(await evaluate(`document.querySelector('#dashboard-content').firstElementChild.className`), 'operational-priorities');
      results.push({ check: 'corporate-composition', profile, width, ...layout, pass: true });
      await screenshot('corporate-' + profile + '-' + width);
    }
  }
  await navigate(base + '/admin/index.html');
  const all = await evaluate(`Number(document.querySelector('[data-metric="students"] > strong').textContent)`);
  await evaluate(`document.querySelector('#admin-filter-panel').open=true;const select=document.querySelector('#admin-filters [name="grade"]');select.value='4';select.dispatchEvent(new Event('input',{bubbles:true}))`);
  await wait(`document.querySelector('#admin-content').getAttribute('aria-busy')==='false' && document.querySelector('#admin-filters [name="grade"]').value==='4'`);
  const selected = await evaluate(`Number(document.querySelector('[data-metric="students"] > strong').textContent)`);
  assert.ok(selected < all, 'Filters still scope the existing service metrics');
  await evaluate(`document.querySelector('[data-metric-help="students"]').click()`);
  assert.equal(await evaluate(`document.querySelector('#admin-dialog').open`), true);
  assert.match(await evaluate(`document.querySelector('#dialog-content').textContent`), /distintos/);
  await evaluate(`document.querySelector('#close-dialog').click();document.querySelector('[data-scroll="admin-users"]').click()`);
  assert.equal(await evaluate(`document.querySelector('#admin-users').closest('details').open && document.activeElement.id==='admin-users'`), true);
  await evaluate(`document.querySelector('#admin-filters').dispatchEvent(new Event('reset',{bubbles:true,cancelable:true}))`);
  await wait(`document.querySelector('#admin-content').getAttribute('aria-busy')==='false' && Number(document.querySelector('[data-metric="students"] > strong').textContent)===${all}`);
  results.push({ check: 'corporate-admin-filter-definition-disclosure-jump-and-reset', all, selected, pass: true, scope: 'Synthetic local services only' });
  await navigate(base + '/monitor/index.html');
  await evaluate(`const select=document.querySelector('#classroom');select.value=select.options[1].value;select.dispatchEvent(new Event('change',{bubbles:true}))`);
  await wait(`Boolean(document.querySelector('.operational-priorities')) && !document.querySelector('#classroom').value.includes('all')`);
  await evaluate(`document.querySelector('.priority-item [data-module="grades"]').click()`);
  await wait(`location.pathname==='/monitor/registro-notas.html'`);
  results.push({ check: 'corporate-monitor-classroom-and-review-navigation', pass: true, scope: 'Demonstration UI, not official grades' });
};
