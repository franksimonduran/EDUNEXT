// Source/compatibility checks. Never opens a database or a private .env.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {saveFinalEvidence}=require('../tools/final-evidence.cjs');
const {publicFiles}=require('../tools/final-inventory.cjs');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
const auditPath='docs/final/evidence/edunext-brand-20261029-01/BRAND_AUDIT_BEFORE.json';
const swBaselinePath='docs/final/evidence/offline-pwa-20261029-01/SW_BASELINE_AFTER.json';
const audit=JSON.parse(read(auditPath)),swBaseline=JSON.parse(read(swBaselinePath)),checks=[];
function check(name,run){try{run();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.message});}}
const files=publicFiles().filter(file=>!/(^|\/)\.env(?:\.|$)/.test(file));
const frontend=files.filter(file=>file.startsWith('frontend/')&&/\.(html|js|css|svg|webmanifest)$/.test(file));
check('No legacy public product phrases across frontend',()=>{for(const file of frontend)assert.ok(!/\b(?:aithron|athron) (?:edu1?|tutor|translate|insights|sync|ai)\b/i.test(read(file)),file);});
check('Every HTML entry has the current brand in its title',()=>{for(const file of frontend.filter(f=>f.endsWith('.html')))assert.match(read(file),/<title>[^<]*EDUNEXT[^<]*<\/title>/,file);});
const manifest=JSON.parse(read('frontend/manifest.webmanifest'));
check('PWA identity and continuity',()=>{
 assert.equal(manifest.name,'EDUNEXT — Plataforma Educativa');assert.equal(manifest.short_name,'EDUNEXT');
 for(const key of ['id','start_url','scope','display','lang'])assert.deepEqual(manifest[key],audit.pwaBefore[key],key);
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,'frontend',icon.src)),icon.src);
 for(const size of [192,512]){const png=fs.readFileSync(path.join(root,`frontend/assets/images/branding/edunext-${size}.png`));assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);}
});
check('Worker semantics match the reviewed offline baseline',()=>{const current=crypto.createHash('sha256').update(read('frontend/sw.js').replace(/^\/\/ EDUNEXT identity update[^\n]*\n/,'')).digest('hex');assert.equal(current,swBaseline.swAfterSha256);});
check('Historical evidence, migrations, models and infrastructure unchanged',()=>{
 for(const item of audit.protectedFiles){if(['frontend/sw.js','frontend/manifest.webmanifest'].includes(item.file))continue;if(swBaseline.reviewedDocSha256?.[item.file]){assert.equal(hash(item.file),swBaseline.reviewedDocSha256[item.file],item.file);continue;}assert.equal(hash(item.file),item.sha256,item.file);}
});
check('Persistent frontend identifiers retained',()=>{
 const expected={
  'frontend/js/offline/database-schema.js':["DB_NAME='aithron-edu'",'openAithronDb'],
  'frontend/js/offline/evaluation-draft-store.js':["DB_NAME = 'aithron-evaluations-demo'"],
  'frontend/js/services/preferences.service.js':['aithron.preferences.v1.','aithron-preferences-change'],
  'frontend/js/offline/confirmed-sync.js':['aithron-sync-v1:'],
  'frontend/js/utils/monitor-data-events.js':['aithron-demo-monitor-data'],
  'frontend/js/services/auth.service.js':['aithron.access_token','aithron.csrf_token'],
  'frontend/js/core/config.js':['globalThis.AITHRON_CONFIG','/api/v1'],
  'backend/app/core/config.py':['JWT_ISSUER: str = "aithron-edu"','JWT_AUDIENCE: str = "aithron-edu-web"','AITHRON_AI_ENABLED: bool = False','SYNC_ENABLED: bool = False'],
  'backend/app/schemas/system.py':['athron_ai'],
 };
 for(const [file,values]of Object.entries(expected))for(const value of values)assert.ok(read(file).includes(value),file+': '+value);
});
check('Current module names available',()=>{
 for(const [file,brand]of [['frontend/js/student/tutor.js','EDUNEXT AI'],['frontend/js/student/translator.js','EDUNEXT Translate'],['frontend/js/components/insights-api-view.js','EDUNEXT Insights'],['frontend/js/student/synchronization.js','EDUNEXT Sync'],['frontend/role-selection.html','EDUNEXT Student'],['frontend/role-selection.html','EDUNEXT Monitor'],['frontend/role-selection.html','EDUNEXT Admin']])assert.ok(read(file).includes(brand),brand);
});
check('Frontend ES module syntax',()=>{
 for(const file of frontend.filter(file=>file.endsWith('.js'))){const run=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8',timeout:15000});assert.equal(run.status,0,file+': '+run.stderr);}
});
const missing=[];
for(const file of frontend.filter(f=>f.endsWith('.html')))for(const match of read(file).matchAll(/(?:src|href)=["']([^"']+)["']/g)){
 const target=match[1].split(/[?#]/)[0];if(!target||/^(?:[a-z]+:|\/\/)/i.test(target)||target.includes('${'))continue;
 const local=target.startsWith('/')?path.resolve(root,'frontend','.'+target):path.resolve(path.dirname(path.join(root,file)),target);
 if(!fs.existsSync(local))missing.push({file,target});
}
check('Static HTML links and resources exist',()=>assert.deepEqual(missing,[]));
const retained=[];
for(const file of files.filter(f=>/\.(?:md|html|js|cjs|css|svg|webmanifest|json|py|toml|ya?ml)$/.test(f)&&!f.startsWith('docs/final/evidence/'))){
 const text=read(file);
 for(const match of text.matchAll(/\b(?:aithron|athron)[\w.-]*/gi)){
  const historical=file.startsWith('docs/')&&(!audit.changes.some(c=>c.file===file)||file.startsWith('docs/final/'));
  const category=file==='README.md'||file==='docs/EDUNEXT_BRAND_MIGRATION.md'?'historical_explanation':historical?'historical_reference':/^(?:infra|\.github)\//.test(file)||file==='docker-compose.yml'?'external_configuration':/^(?:tests|tools|backend\/tests|backend\/verification)\//.test(file)?'compatibility_test_or_tool': 'technical_identifier_or_path';
  retained.push({file,line:text.slice(0,match.index).split('\n').length,identifier:match[0],category});
 }
}
const supplementary=['frontend/manifest.webmanifest','frontend/sw.js','frontend/assets/images/branding/mark.svg','frontend/css/variables.css','frontend/role-selection.html','backend/pyproject.toml','backend/.env.example','backend/tests/test_meta.py','tests/frontend-refresh.browser.cjs'];
const changed=[...new Set([...audit.changes.filter(c=>hash(c.file)!==c.before).map(c=>c.file),...supplementary])].sort();
const added=['frontend/assets/images/branding/legacy-mark.svg','frontend/assets/images/branding/edunext-192.png','frontend/assets/images/branding/edunext-512.png','tools/edunext-brand-migration.cjs','tools/edunext-icons.cjs','tools/verify-edunext-backend.py','tests/edunext-brand.cjs','tests/fixtures/edunext-brand-checks.cjs','docs/EDUNEXT_BRAND_MIGRATION.md'];
const hashes=[...changed,...added].map(file=>({file,sha256:hash(file)}));
const result={date:new Date().toISOString(),scope:'Static source, syntax, links and hash compatibility only; browser and backend evidence saved separately. Not installed-PWA/physical Android/account-isolation/pilot acceptance.',baseline:auditPath,reviewedBefore:audit.reviewedFiles,frontendReviewed:frontend.length,changedFiles:changed,addedFiles:added,checks,missing,retained,hashes,pass:checks.every(c=>c.pass),decision:'NO-GO'};
saveFinalEvidence('EDUNEXT_BRAND_VALIDATION.json',result);
console.log(JSON.stringify({pass:result.pass,reviewedBefore:result.reviewedBefore,frontendReviewed:frontend.length,changed:changed.length,checks,retainedOccurrences:retained.length},null,2));
if(!result.pass)process.exitCode=1;
