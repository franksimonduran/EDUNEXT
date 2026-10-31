// Source inventory and internal candidate fingerprint. No DB/network/private .env access.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const generated=new Set(['docs/final/FINAL_INVENTORY.json','docs/final/FINAL_CANDIDATE_MANIFEST.json']);
function publicFiles(dir=''){
 return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>{
   const p=path.posix.join(dir,entry.name);
   if(p==='backend/.local')return []; // Installed translation weights/runtime are not source or evidence.
   if(p==='frontend/assets/models/minicpm5-2b-gguf'||p==='frontend/assets/models/minicpm5-2b-gguf.installing'||p==='frontend/js/vendor/wllama.installing')return [];
  if(entry.isSymbolicLink()||['.git','__pycache__','.pytest_cache','.venv','venv','node_modules','.build'].includes(entry.name))return [];
  if(entry.isDirectory())return publicFiles(p);
  if((entry.name.startsWith('.env')&&entry.name!=='.env.example')||/\.(?:log|dump|age|key|pem|pyc)$/.test(entry.name)||entry.name.includes('.dump.'))return [];
  return [p];
 });
}
function corpus(){
 return publicFiles().filter(p=>!generated.has(p)&&!p.startsWith('docs/final/evidence/'))
  .filter(p=>/\.(?:py|js|cjs|mjs|html|css|svg|png|jpe?g|webp|wav|mp3|md|json|toml|ini|ya?ml|sh|webmanifest)$/.test(p)||/(?:^|\/)(?:Dockerfile|\.dockerignore|\.gitignore|\.gitattributes|\.env.example)$/.test(p)||p.endsWith('.Dockerfile'))
  .sort().map(p=>({path:p,bytes:fs.statSync(path.join(root,p)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}));
}
function fingerprint(files){return crypto.createHash('sha256').update(files.map(f=>`${f.path}\0${f.sha256}`).join('\n')).digest('hex');}
const dataCache=new Map();
function dataURL(file,stack=new Set()){
 if(dataCache.has(file))return dataCache.get(file);
 if(!file.startsWith('frontend/js/data/')||!file.endsWith('.js')||stack.has(file))throw new Error('Only acyclic existing data modules may be inspected');
 const next=new Set(stack);next.add(file);
 const source=read(file).replace(/from\s*(['"])(\.[^'"]+)\1/g,(_m,_q,spec)=>'from '+JSON.stringify(dataURL(path.posix.normalize(path.posix.join(path.posix.dirname(file),spec)),next)));
 const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');dataCache.set(file,url);return url;
}
async function catalogue(){
 const courses=await import(dataURL('frontend/js/data/courses-demo.data.js'));
 const units=await import(dataURL('frontend/js/data/units-demo.data.js'));
 const practices=await import(dataURL('frontend/js/data/practices-demo.data.js'));
 const games=await import(dataURL('frontend/js/data/games-demo.data.js'));
 const dictionary=await import(dataURL('frontend/js/data/dictionary-demo.data.js'));
 const grades=[4,5,6].map(grade=>{
  const rows=courses.getCoursesDemo(grade);
  return {grade,courses:rows.map(c=>({id:c.id,name:c.name.es,units:units.getUnitsDemo(c).map(u=>({id:u.id,title:u.title,lessons:u.lessons.map(l=>({id:l.id,title:l.title,audio:l.audio?.src}))}))})),practices:practices.getPracticesDemo(grade).map(p=>({id:p.id,questions:p.questions.length})),games:games.getGamesDemo(grade).map(g=>({id:g.id,type:g.type,questions:g.questions.length,validQuestions:g.questions.every(q=>Boolean(q?.id))}))};
 });
 return {classification:'Demonstration data only, NOT published/matriculated/confirmed records or pedagogical approval',grades,dictionaryEntries:dictionary.dictionaryEntries.length};
}
function references(page,ext){return [...read(page).matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(p=>p.endsWith(ext)&&!p.includes('://')).map(p=>path.posix.normalize(path.posix.join(path.posix.dirname(page),p)));}
async function generateInventory(){
 if(fs.existsSync(path.join(root,'docs/final/FINAL_CANDIDATE_MANIFEST.json')))throw new Error('Candidate frozen: use --verify. Do not overwrite its inventory; a new candidate requires explicit review/versioning.');
 const files=publicFiles().sort();
 const phases=JSON.parse(read('docs/final/FINAL_PHASE_STATUS.json'));
 const migrations=files.filter(p=>p.startsWith('backend/alembic/versions/')&&p.endsWith('.py')).map(p=>({file:p,revision:read(p).match(/revision(?:\s*:[^=]+)?\s*=\s*['"]([^'"]+)/)?.[1],parent:read(p).match(/down_revision(?:\s*:[^=]+)?\s*=\s*['"]([^'"]+)/)?.[1]||null}));
 const endpoints=files.filter(p=>p.startsWith('backend/app/api/v1/endpoints/')&&p.endsWith('.py')).flatMap(p=>{
  const text=read(p),prefix=text.match(/APIRouter\([\s\S]*?prefix\s*=\s*['"]([^'"]*)/)?.[1]||'';
  return [...text.matchAll(/@router\.(get|post|put|patch|delete)\(\s*["']([^"']*)["']/g)].map(m=>({method:m[1].toUpperCase(),route:'/api/v1'+prefix+m[2],file:p,verification:'Static decorator only; runtime authorization/OpenAPI not verified'}));
 });
 const models=files.filter(p=>p.startsWith('backend/app/db/models/')&&p.endsWith('.py')).flatMap(p=>[...read(p).matchAll(/__tablename__\s*=\s*['"]([^'"]+)/g)].map(m=>({table:m[1],file:p,verification:'Source declaration, not a live table check'})));
 const pages=files.filter(p=>p.startsWith('frontend/')&&p.endsWith('.html')).map(p=>({file:p,css:references(p,'.css'),scripts:references(p,'.js'),verification:'Static references; per-page functionality not implied'}));
 const result={date:new Date().toISOString(),gitCommit:null,gitBranch:null,classification:'Source snapshot, not a live system inventory or secret-scanning certificate',excluded:['Private .env, keys, dumps, logs, caches, symlinks and build environments; no values/hashes of private credentials'],files:files.map(p=>({path:p,bytes:fs.statSync(path.join(root,p)).size})),pages,endpoints,models,migrations,migrationHeads:migrations.filter(m=>!migrations.some(other=>other.parent===m.revision)).map(m=>m.revision),services:files.filter(p=>p.startsWith('frontend/js/services/')&&p.endsWith('.js')),schemas:files.filter(p=>p.startsWith('backend/app/schemas/')&&p.endsWith('.py')),permissions:[...read('backend/app/schemas/permission.py').matchAll(/^\s+[A-Z][A-Z0-9_]+\s*=\s*["']([^"']+)/gm)].map(m=>m[1]),offline:files.filter(p=>p.startsWith('frontend/js/offline/')||p==='frontend/sw.js'||p==='frontend/manifest.webmanifest'),tests:files.filter(p=>/^(?:tests\/|backend\/(?:tests|verification)\/)/.test(p)),workflows:files.filter(p=>p.startsWith('.github/workflows/')),catalogue:await catalogue(),phases:phases.phases,absent:['database','content','scripts','LICENSE','backend/requirements.lock'].filter(p=>!fs.existsSync(path.join(root,p)))};
 fs.mkdirSync(path.join(root,'docs/final'),{recursive:true});
 fs.writeFileSync(path.join(root,'docs/final/FINAL_INVENTORY.json'),JSON.stringify(result,null,2)+'\n');
 const rows=result.phases.map(p=>`| ${p.phase} | ${p.title} | ${p.status} | ${p.reason} | ${p.evidence.map(e=>'`'+e+'`').join(', ')} |`);
 fs.writeFileSync(path.join(root,'docs/final/FINAL_SYSTEM_INVENTORY.md'),'# Inventario final de fuente y estado de las 50 fases\n\nNo acredita ejecución, publicación ni aceptación. Datos de PostgreSQL vivo no inspeccionados. Inventario completo de archivos/páginas/servicios/routers/modelos/recursos/pruebas en FINAL_INVENTORY.json; las rutas son extracción estática, no OpenAPI runtime.\n\n'+`Páginas HTML: ${pages.length}. Decoradores HTTP: ${endpoints.length}. Migraciones: ${migrations.length}. Tablas declaradas en fuente: ${models.length}.\n\n`+'| Fase | Módulo | Estado actual | Fundamento/limitación | Código o evidencia |\n|---|---|---|---|---|\n'+rows.join('\n')+'\n');
 const acceptance=JSON.parse(read('docs/final/FINAL_ACCEPTANCE_CASES.json'));
 fs.writeFileSync(path.join(root,'docs/final/FINAL_ACCEPTANCE_MATRIX.md'),'# Matriz de aceptación funcional\n\nLos 28 requisitos no se dan por aceptados al pasar contratos de fuente o demos. Prerrequisitos/método/expectativa por caso en FINAL_ACCEPTANCE_CASES.json. Responsable de aceptación: por designar. Schemas/permisos/modelos concretos y comportamiento deben contrastarse en ejecución; inventario de declaraciones disponible, no certificación de vínculos.\n\n| ID | Requisito | Prioridad | Pantalla | Código/servicio | Ruta a verificar | Resultado real | Incidencia |\n|---|---|---|---|---|---|---|---|\n'+acceptance.cases.map(c=>'| '+[c.id,c.requirement,c.priority,'`'+c.page+'`','`'+c.code+'`',c.endpoint||'No contrato operativo verificado',c.result,c.issue].join(' | ')+' |').join('\n')+'\n');
 return result;
}
function freeze(){
 const file=path.join(root,'docs/final/FINAL_CANDIDATE_MANIFEST.json');
 const files=corpus();
 const evidence=publicFiles('docs/final/evidence').filter(p=>p.endsWith('.json')).sort().map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')}));
 const manifest={candidate:'0.1.0-validation.1',productVersion:'0.1.0',status:'INTERNAL_UNAPPROVED_SNAPSHOT_NOT_A_PUBLIC_RELEASE',decision:'NO-GO',gitCommit:null,date:new Date().toISOString(),scope:'Whitelisted source/public resources/docs only; private configuration/keys/dumps/logs excluded. Hashes do not certify absence of private data, licenses or secure behavior.',fingerprint:fingerprint(files),inventorySha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'docs/final/FINAL_INVENTORY.json'))).digest('hex'),files,evidence};
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return {candidate:manifest.candidate,files:files.length,fingerprint:manifest.fingerprint,status:manifest.status};
}
function verify(){
 const manifest=JSON.parse(read('docs/final/FINAL_CANDIDATE_MANIFEST.json')),files=corpus();
 const changedEvidence=manifest.evidence.filter(e=>!fs.existsSync(path.join(root,e.path))||crypto.createHash('sha256').update(fs.readFileSync(path.join(root,e.path))).digest('hex')!==e.sha256).map(e=>e.path);
 const inventoryUnchanged=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'docs/final/FINAL_INVENTORY.json'))).digest('hex')===manifest.inventorySha256;
 const unchanged=fingerprint(files)===manifest.fingerprint&&changedEvidence.length===0&&inventoryUnchanged;
 if(!unchanged)throw new Error('Candidate source/docs or frozen evidence changed; revalidate and prepare a new reviewed candidate, never silently overwrite this manifest.');
 return {candidate:manifest.candidate,unchanged,inventoryUnchanged,files:files.length,evidenceFiles:manifest.evidence.length,decision:manifest.decision};
}
module.exports={root,read,publicFiles,corpus,catalogue,generateInventory,freeze,verify};
if(require.main===module)(async()=>{
 const mode=process.argv[2];
 if(mode==='--freeze')return console.log(JSON.stringify(freeze(),null,2));
 if(mode==='--verify')return console.log(JSON.stringify(verify(),null,2));
 const r=await generateInventory();console.log(JSON.stringify({pages:r.pages.length,endpoints:r.endpoints.length,migrations:r.migrations.length,models:r.models.length,services:r.services.length,files:r.files.length,heads:r.migrationHeads},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
