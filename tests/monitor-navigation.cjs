const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'frontend/js/components/sidebar.js'), 'utf8')
  .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const context = vm.createContext({
  t: key => key, uiT: key => key, profileLocale: () => 'es',
  icon: key => `<svg data-icon="${key}"></svg>`, config: {routes: {roles: 'role-selection.html'}}
});
vm.runInContext(source, context);
const data = fs.readFileSync(path.join(root, 'frontend/js/data/monitor-demo.data.js'), 'utf8');
vm.runInContext(data.replace(/export /g, '') + '\nglobalThis.sections = monitorNavigation;', context);
const nodes = {};
const container = {
  classList: {toggle(key, value) { this[key] = value; }}, innerHTML: '',
  querySelector(selector) { return nodes[selector] ||= {setAttribute(key, value) {this[key] = value;}}; }
};
context.renderSidebar(container, false, 'calendar', {sections: context.sections});
assert.equal(container.classList['monitor-navigation'], true);
assert.equal((container.innerHTML.match(/class="nav-group"/g) || []).length, 5);
assert.match(container.innerHTML, /data-section="calendar"[^>]*aria-current="page"/);
assert.match(container.innerHTML, /data-icon="settings"/);
assert.match(container.innerHTML, /data-icon="logout"/);
assert.equal(nodes['#sidebar-toggle']['aria-controls'], 'sidebar-navigation');
context.renderSidebar(container, true, 'home', {sections: context.sections, role: 'admin'});
assert.equal(container.classList['monitor-navigation'], false);
assert.equal(nodes.nav['aria-label'], 'Navegación administrativa');
assert.ok(fs.existsSync(path.join(root, 'frontend/css/monitor/navigation.css')));
console.log('PASS monitor navigation: groups, active state, icons, ARIA and admin isolation');
