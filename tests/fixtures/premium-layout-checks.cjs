const assert = require('node:assert/strict');
module.exports = async function checkPremiumLayout({ cdp, base, navigate, screenshot, results }) {
  const evaluate = expression => cdp.evaluate(`(()=>eval(${JSON.stringify(expression)}))()`);
  const measure = () => evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,overflowing:document.documentElement.scrollWidth>innerWidth?[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>1&&r.right>innerWidth+1&&getComputedStyle(el).position!=='fixed'&&!el.closest('.student-bottom-nav,.cal-month,.user-table-wrap,.table-wrap,.table-container')}).map(el=>({className:el.className,text:el.textContent.trim().slice(0,70),right:el.getBoundingClientRect().right})):[],clipped:[...document.querySelectorAll('main button,main a.button-primary,main a.button-secondary')].filter(el=>{const r=el.getBoundingClientRect();return r.width>1&&r.height>1&&el.textContent.trim().length>2&&el.scrollWidth>el.clientWidth+2}).map(el=>({text:el.textContent.trim(),className:el.className}))})`);
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
  await navigate(base + '/login.html');
  await screenshot('premium-login-desktop');
  await navigate(base + '/student/leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1&modo=demo');
  assert.equal(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.lesson-reading p')).fontSize)`), 18);
  await screenshot('premium-lesson-desktop');
  await navigate(base + '/student/aprende.html?grade=4&modo=demo');
  await screenshot('premium-courses-desktop');
  for (const profile of ['student', 'monitor', 'admin']) {
    await navigate(base + '/' + profile + '/index.html');
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
      const state = await measure();
      results.push({ check: 'premium-theme-layout', profile, theme, ...state, pass: !state.overflow && state.clipped.length === 0 });
      await screenshot('premium-' + profile + '-' + theme);
    }
    if (profile === 'admin') {
      const separated = await evaluate(`[...document.querySelectorAll('.future-action .action-copy')].every(el=>{const title=el.querySelector('span').getBoundingClientRect(),caption=el.querySelector('small').getBoundingClientRect();return caption.top>=title.bottom})`);
      assert.equal(separated, true, 'Action labels and status captions occupy separate lines');
      assert.equal(await evaluate(`[...document.querySelectorAll('.future-action .action-copy')].every(el=>el.textContent.includes(el.querySelector('span').textContent+' '))`), true, 'Action text also preserves a word boundary when copied');
    }
    if (profile === 'monitor') assert.equal(await evaluate(`[...document.querySelectorAll('.quick-actions button')].every(el=>el.textContent.includes(el.querySelector('span').textContent+' '))`), true, 'Teacher action labels are not joined to status text');
  }
  const pages = [
    'login.html', 'student/index.html', 'monitor/index.html', 'admin/index.html',
    'student/leccion.html?grade=4&course=math&unit=math-g4-u1&lesson=math-g4-u1-l1&modo=demo',
    'student/agenda.html?grade=4&modo=demo',
  ];
  for (const page of pages) {
    for (const width of [375, 1440]) {
      await cdp.call('Emulation.setDeviceMetricsOverride', { width, height: 960, deviceScaleFactor: 1, mobile: false });
      await navigate(base + '/' + page);
      await evaluate(`document.documentElement.style.fontSize='200%'`);
      const state = await measure();
      results.push({ check: 'premium-200-percent-text', page, width, ...state, pass: !state.overflow && state.clipped.length === 0 });
    }
  }
};
