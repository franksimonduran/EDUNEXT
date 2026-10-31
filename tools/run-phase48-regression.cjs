const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const tests=['tests/phase47-api.cjs','tests/phase48-security.cjs','tests/phase48-resilience.cjs','tests/phase48-session.cjs'];
const results=tests.map(file=>{
 const start=Date.now();const run=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:20000});
 return {file,exitCode:run.status,elapsedMs:Date.now()-start,stdout:(run.stdout||'').slice(0,10000),stderr:(run.stderr||'').slice(0,10000),error:run.error?.code};
});
const syntax=['frontend/sw.js','frontend/js/services/auth.service.js','frontend/js/core/config.js'].map(file=>{
 const run=spawnSync(process.execPath,['--input-type=module','--check'],{input:fs.readFileSync(path.join(root,file),'utf8'),encoding:'utf8',timeout:10000});
 return {file,exitCode:run.status,stderr:run.stderr||''};
});
const evidence={date:new Date().toISOString(),node:process.version,scope:'Four Node contract/policy/resilience/session suites and three syntax checks. Durations are test runner wall time, NOT platform latency or throughput. Public login browser test has separate evidence.',results,syntax,notExecuted:['Python unittest/pytest','FastAPI/PostgreSQL/Alembic','Authenticated browser E2E and historical browser suites','Load/stress/soak','EXPLAIN and backup restoration','Full WCAG, physical mobile devices, Firefox and Safari']};
require('./final-evidence.cjs').saveEvidence('NODE_REGRESSION.json','docs/PHASE_48_REGRESSION_EVIDENCE.json',evidence);
console.log(JSON.stringify(evidence,null,2));
if([...results,...syntax].some(r=>r.exitCode!==0))process.exitCode=1;
