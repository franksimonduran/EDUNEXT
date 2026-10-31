// Explicit public-brand migration. Never reads private .env, databases or secrets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {evidenceDirectory,saveFinalEvidence}=require('./final-evidence.cjs');
const root=path.resolve(__dirname,'..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const legacy=/aithron|athron/gi;
const ignored=new Set(['node_modules','.venv','venv','__pycache__','.git','.pytest_cache']);
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>{const file=(dir?dir+'/':'')+e.name;return e.isDirectory()?(ignored.has(e.name)?[]:walk(file)):[file];});}
function safe(file){return !/(^|\/)\.env(?:\.|$)/.test(file)&&/\.(?:md|html|css|js|cjs|svg|webmanifest|json|py|toml|ya?ml|txt)$/.test(file);}
function currentDoc(file){
 if(/^(?:AGENTS|PROJECT_STRUCTURE)\.md$/.test(file)||file==='backend/README.md')return true;
 if(!file.startsWith('docs/')||!file.endsWith('.md'))return false;
 if(/^docs\/(?:final|pilot)\//.test(file))return false;
 if(/(?:phase|audit|report\.md$|results|baseline|evidence|_2026-|remediation|inventory|matrix|gate|test_plan|validation|changed_files|delivery_report|refresh|improvements)/i.test(file))return false;
 return true;
}
function category(file){
 if(file.startsWith('frontend/'))return /branding\//.test(file)?'visual_identity':/manifest|sw\.js$/.test(file)?'pwa_configuration':'frontend_mixed_visible_and_technical';
 if(file==='README.md'||currentDoc(file))return 'current_documentation';
 if(file.startsWith('docs/'))return 'historical_document';
 if(/(?:alembic|db\/models)\//.test(file))return 'persistent_technical_identifier';
 if(/^(?:infra|\.github)\//.test(file)||/docker-compose/.test(file))return 'external_configuration';
 return 'technical_or_api_contract';
}
function visible(text){
 // Whole public phrases only; no lowercase identifiers, URLs, class names or env keys.
 return text.replace(/(?<![\\/])\b(?:AITHRON|ATHRON) EDU1?\b/gi,'EDUNEXT')
  .replace(/\bAITHRON (?:TUTOR|AI)\b/gi,'EDUNEXT AI')
  .replace(/\bAITHRON TRANSLATE\b/gi,'EDUNEXT Translate')
  .replace(/\bAITHRON INSIGHTS\b/gi,'EDUNEXT Insights')
  .replace(/\bAITHRON SYNC\b/gi,'EDUNEXT Sync')
  .replace(/AITHRON <(?:span|b)>EDU<\/(?:span|b)>/g,'EDUNEXT')
  .replace(/\b(?:AITHRON|Aithron)(?= (?:CONTENT STUDIO|REFUERZA|PRONUNCIA|Pronuncia|Pronounce|APRENDE|PRACTICA|LOGROS|AGENDA|EVALUACIONES|EVALUACIÓN|MISIONES|PROGRESO|\$\{))/g,'EDUNEXT');
}
function transform(file,text){
 if(file==='README.md'){
  const marker='## Historial de fases anteriores';const split=text.indexOf(marker);
  const intro=visible(split<0?text:text.slice(0,split));
  return intro.replace(/^(# .*)$/m,'$1\n\n**EDUNEXT es la nueva identidad de la plataforma anteriormente denominada AITHRON EDU.**\n\nVer [migración de identidad](docs/EDUNEXT_BRAND_MIGRATION.md).')+(split<0?'':text.slice(split));
 }
 if(currentDoc(file))return visible(text);
 if(file.startsWith('frontend/')&&/\.(?:html|js|css|svg)$/.test(file)){
  let result=visible(text);
  // Reviewed display-only demonstration aliases and downloadable filenames.
  result=result.replace(/Explorador Aithron/g,'Explorador EDUNEXT').replace(/Profesor Aithron/g,'Profesor EDUNEXT');
  if(/(?:actividad-tecnica|admin-technical-report|offline-study\.service|reports-api\.service|csv-safety)\.js$/.test(file))result=result.replace(/aithron-tech-summary-/g,'edunext-tech-summary-').replace(/aithron-guia-demo-/g,'edunext-guia-demo-').replace(/`aithron-\$\{code/g,'`edunext-${code').replace(/AITHRON-datos-de-demostracion/g,'EDUNEXT-datos-de-demostracion');
  return result;
 }
 const backendPublic=new Set(['backend/app/main.py','backend/app/core/config.py','backend/app/core/exceptions.py','backend/app/db/__init__.py','backend/app/exporters/csv_exporter.py','backend/app/repositories/dictionary_repository.py','backend/app/api/v1/endpoints/meta.py','backend/app/api/v1/endpoints/ai.py']);
 if(backendPublic.has(file))return visible(text);
 if(['tests/student-dashboard.browser.cjs','tests/tutor.browser.cjs'].includes(file))return text.replace(/AITHRON TUTOR/g,'EDUNEXT AI');
 return text;
}
const action=process.argv[2];
if(action==='audit'){
 const files=walk('').filter(safe),records=[],changes=[],protectedFiles=[];
 for(const file of files){
  const bytes=fs.readFileSync(path.join(root,file)),text=bytes.toString('utf8');
  const matches=[...text.matchAll(legacy)].map(m=>({line:text.slice(0,m.index).split('\n').length,term:m[0]}));
  if(matches.length)records.push({file,category:category(file),matches});
  const updated=transform(file,text);
  if(updated!==text)changes.push({file,before:hash(bytes),after:hash(updated),category:category(file)});
  if(category(file)==='historical_document'||/^(?:backend\/alembic\/|backend\/app\/db\/models\/|infra\/|\.github\/)/.test(file)||file==='frontend/sw.js'||file==='frontend/manifest.webmanifest'||file==='docker-compose.yml')protectedFiles.push({file,sha256:hash(bytes)});
 }
 const evidence={date:new Date().toISOString(),reviewedFiles:files.length,git:'No .git directory; git executable unavailable',records,changes,protectedFiles,pwaBefore:JSON.parse(fs.readFileSync(path.join(root,'frontend/manifest.webmanifest'),'utf8')),swBefore:fs.readFileSync(path.join(root,'frontend/sw.js'),'utf8'),scope:'Safe source/document file allowlist; private environment files and binary/persistent data excluded.'};
 const target=saveFinalEvidence('BRAND_AUDIT_BEFORE.json',evidence);
 console.log(JSON.stringify({audit:target,reviewed:files.length,legacyFiles:records.length,proposedChanges:changes.length,categories:records.reduce((a,r)=>(a[r.category]=(a[r.category]||0)+1,a),{})},null,2));
}else if(action==='apply'){
 const baseline=process.argv[3];
 if(!baseline||!/^docs\/final\/evidence\/[A-Za-z0-9_/-]+\/BRAND_AUDIT_BEFORE\.json$/.test(baseline))throw new Error('Explicit audit path required');
 const audit=JSON.parse(fs.readFileSync(path.join(root,baseline),'utf8'));
 // Validate every input before changing anything; preserve any intervening work.
 for(const item of audit.changes)if(hash(fs.readFileSync(path.join(root,item.file)))!==item.before)throw new Error('File changed since audit: '+item.file);
 for(const item of audit.changes){const target=path.join(root,item.file),updated=transform(item.file,fs.readFileSync(target,'utf8'));if(hash(updated)!==item.after)throw new Error('Unexpected transformation');fs.writeFileSync(target,updated);}
 console.log(`Applied ${audit.changes.length} reviewed phrase-only changes. Storage, API identifiers and historical documents preserved. Audit: ${baseline}`);
}else{console.log('Use audit, then apply <explicit audit path>. No changes made. Evidence: '+evidenceDirectory());}
module.exports={visible,currentDoc,category};
