/* Read-only source inventory. No database, network, secrets or app execution. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
// New evidence only: never overwrite the historical acceptance matrix or inventory.
const output=fs.mkdtempSync(path.join(root,'docs/final/evidence/phase47-source-'));
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function files(dir){if(!fs.existsSync(path.join(root,dir)))return [];return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
const imports=p=>[...read(p).matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(m=>path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1]))).filter(p=>fs.existsSync(path.join(root,p)));
function services(p,seen=new Set()){if(seen.has(p))return [];seen.add(p);return [...new Set(imports(p).flatMap(i=>[...(i.includes('/services/')?[i]:[]),...services(i,seen)]))];}
const pages=files('frontend').filter(p=>p.endsWith('.html')).map(p=>{
 const text=read(p),refs=[...text.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(m=>path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1])));
 const scripts=refs.filter(r=>r.endsWith('.js')&&fs.existsSync(path.join(root,r)));
 return {page:p,profile:p.includes('/student/')?'student':p.includes('/monitor/')?'monitor':p.includes('/admin/')?'admin':'shared',css:refs.filter(r=>r.endsWith('.css')),scripts,services:[...new Set(scripts.flatMap(s=>services(s)))],verification:'Static references only; behavior, permissions and offline not verified per page'};
});
const endpoints=files('backend/app/api/v1/endpoints').filter(p=>p.endsWith('.py')).flatMap(p=>{
 const text=read(p),prefix=text.match(/APIRouter\([\s\S]*?prefix\s*=\s*['"]([^'"]*)/ )?.[1]||'';
 return [...text.matchAll(/@router\.(get|post|put|patch|delete)\(\s*["']([^"']*)["']([\s\S]*?)\)\s*(?:async\s+)?def\s+(\w+)/g)].map(m=>({method:m[1].toUpperCase(),route:'/api/v1'+prefix+m[2],file:p,handler:m[4],response:m[3].match(/response_model\s*=\s*([^,\n]+)/)?.[1]||'See source',verification:'Static decorator extraction; runtime mounting and permission dependencies require validation'}));
});
const absent=['PROJECT_STRUCTURE.md','AGENTS.md','database','content','scripts','.github','docker-compose.yml','compose.yaml'].filter(p=>!fs.existsSync(path.join(root,p)));
const migrations=files('backend/alembic/versions').filter(p=>p.endsWith('.py')).map(p=>({file:p,revision:read(p).match(/revision(?:\s*:[^=]+)?\s*=\s*['"]([^'"]+)/)?.[1],parent:read(p).match(/down_revision(?:\s*:[^=]+)?\s*=\s*['"]([^'"]+)/)?.[1]}));
const inventory={generated:new Date().toISOString(),method:'Static source extraction, not runtime proof',absent,pages,endpoints,migrations,models:files('backend/app/db').filter(p=>p.endsWith('.py')),offline:files('frontend/js').filter(p=>/offline|sync|indexed|storage/i.test(p)),tests:[...files('tests'),...files('backend/tests')].filter(p=>/\.(py|cjs|js)$/.test(p))};
fs.writeFileSync(path.join(output,'INTEGRATION_SOURCE_INVENTORY.json'),JSON.stringify(inventory,null,2)+'\n');
const cell=v=>String(v||'—').replaceAll('|','\\|').replaceAll('\n',' ');
const rows=pages.map(p=>`| ${[p.profile,p.page,p.css.join(', '),p.scripts.join(', '),p.services.join(', '),'No validado en vivo'].map(cell).join(' | ')} |`);
fs.writeFileSync(path.join(output,'INTEGRATION_MATRIX.md'),'# Matriz Fase 47 — referencias estáticas\n\nNo acredita integración: acciones, permisos, modelos y estados requieren contraste en ejecución. No se infieren del nombre de la pantalla. Inventario estructurado: INTEGRATION_SOURCE_INVENTORY.json.\n\n| Perfil | Pantalla | CSS | JavaScript | Servicios transitivos | Resultado |\n|---|---|---|---|---|---|\n'+rows.join('\n')+'\n');
fs.writeFileSync(path.join(output,'INTEGRATION_ENDPOINT_INVENTORY.md'),'# Endpoints — extracción estática\n\nPrefijo /api/v1 según configuración de ejemplo. No sustituye OpenAPI en ejecución; revisar dependencias RBAC en los archivos indicados. No se atribuyen modelos ni pruebas sin evidencia.\n\n| Método | Ruta | Router | Handler | Response model |\n|---|---|---|---|---|\n'+endpoints.map(e=>'| '+[e.method,e.route,e.file,e.handler,e.response].map(cell).join(' | ')+' |').join('\n')+'\n');
console.log(JSON.stringify({output:path.relative(root,output),pages:pages.length,endpointDecorators:endpoints.length,migrations:migrations.length,absent},null,2));
