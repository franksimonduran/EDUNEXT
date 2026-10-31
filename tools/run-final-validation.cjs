// Local validation only. No DB reset, seed, cloud deploy, real accounts or paid AI.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {evidenceDirectory,saveFinalEvidence}=require('./final-evidence.cjs');
const root=path.resolve(__dirname,'..'),directory=evidenceDirectory(),out=path.join(root,directory);
fs.mkdirSync(out,{recursive:true});
const env={...process.env,AITHRON_FINAL_VALIDATION:'1',AITHRON_FINAL_EVIDENCE_DIR:directory};
const commands=[
 ['node-regression',['tools/run-phase48-regression.cjs'],120000],
  ['infrastructure-contracts',['tests/phase49-infra.cjs'],120000],
  ['migration-source-alignment',['tests/deployment-readiness.cjs'],120000],
  ['edunext-public-config',['tests/edunext-config-alias.cjs'],120000],
 ['real-browser-demo',['tests/phase48-browser.cjs'],120000],
 ['handover-acceptance',['tests/acceptance/phase50-acceptance.cjs'],120000]
];
const results=[];
for(const [id,args,timeout] of commands){
 const start=Date.now(),run=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',timeout,maxBuffer:4*1024*1024});
 results.push({id,command:'node '+args.join(' '),exitCode:run.status,elapsedMs:Date.now()-start,error:run.error?.code,stdout:(run.stdout||'').slice(0,40000),stderr:(run.stderr||'').slice(0,4000)});
 console.log(id+': '+(run.status===0?'PASS':'FAILED_OR_BLOCKED'));
}
const evidence={date:new Date().toISOString(),node:process.version,scope:'Local source/contracts, synthetic HTTP/VM and public demonstration browser views. NOT an authenticated E2E, institution pilot, DB verification or production acceptance.',results,decision:'NO-GO',pilot:{planned:true,authorized:false,executed:false,evaluated:false},production:{authorized:false,deployed:false,verified:false},notExecuted:['Python/FastAPI/PostgreSQL/Alembic','Authenticated student/monitor/admin/cross-role/tenant flows','Sync receipts/offline account isolation','Real AI/Insights/pedagogical review','Docker/CI/cloud/HTTPS/backups/restoration','Human usability, training or educational pilot']};
saveFinalEvidence('FINAL_TEST_RUN.json',evidence);
console.log('Evidence directory: '+directory);
if(results.some(r=>r.exitCode!==0))process.exitCode=1;
