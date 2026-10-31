// Read-only source checks; no database, authentication or browser simulation.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const manifest = JSON.parse(fs.readFileSync(path.join(frontend, 'manifest.webmanifest'), 'utf8'));
const hashes = {};
for (const icon of manifest.icons) {
  const file = path.join(frontend, icon.src);
  const bytes = fs.readFileSync(file);
  hashes[icon.src] = crypto.createHash('sha256').update(bytes).digest('hex');
  if (icon.type === 'image/png') {
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
}
const mark = fs.readFileSync(path.join(frontend, 'assets/images/branding/mark.svg'), 'utf8');
const embedded = mark.match(/base64,([^"]+)/);
assert(embedded, 'Self-contained SVG is required for favicon image loading');
assert.deepEqual(Buffer.from(embedded[1], 'base64'), fs.readFileSync(path.join(frontend, 'assets/images/Icono.png')));
assert(fs.existsSync(path.join(frontend, 'assets/images/Logo Horizontal.png')));
const css = fs.readFileSync(path.join(frontend, 'css/base.css'), 'utf8');
const sidebar = fs.readFileSync(path.join(frontend, 'js/components/sidebar.js'), 'utf8');
assert(sidebar.includes("collapsed ? 'Icono.png' : 'Logo%20Horizontal.png'"));
assert(sidebar.includes('link.innerHTML = brandImage'));
assert(css.includes('object-fit: contain'));
const report = { date: new Date().toISOString(), status: 'pass', scope: 'Static asset existence, embedded icon identity, PNG dimensions and sidebar CSS. Browser rendering and installed PWA not verified.', hashes };
if (process.env.AITHRON_FINAL_VALIDATION === '1') {
  const dir = path.join(root, 'docs/final/evidence', 'brand-assets-' + Date.now());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'BRAND_ASSETS.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
