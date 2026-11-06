// Coordinador D6: reutiliza las pruebas REALES de Chrome D4 y D5.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const tasks=[
 {name:'D6 contratos y reglas 0/60/80/100',args:['tests/demo-d6.mjs']},
 {name:'D4 recorrido sin servidor de origen',args:['tools/demo-d4-offline.cjs']},
 {name:'D5 auditoría visual de 14 rutas',args:['tools/demo-d5-visual.cjs']}
];
const outcomes=[];
for(const task of tasks){
 const start=Date.now();
 const result=cp.spawnSync(process.execPath,task.args,{cwd:root,env:process.env,encoding:'utf8',timeout:900000,maxBuffer:5*1024*1024});
 const passed=result.status===0&&!result.error;
 outcomes.push({task:task.name,passed,elapsedMs:Date.now()-start,
  error:result.error?String(result.error):null});
 process.stdout.write(result.stdout||'');
 process.stderr.write(result.stderr||'');
 if(!passed)break;
}
const status=outcomes.length===tasks.length&&outcomes.every(x=>x.passed)?'PASS':'FAIL';
const report={status,checks:outcomes,scope:'Solo demostración pública con datos sintéticos'};
const dir=path.join(root,'artifacts','d6-acceptance');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'D6_ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(status!=='PASS')process.exitCode=1;
