const fs=require('node:fs'),path=require('node:path');
function evaluate(gate,target){
 if(!['staging','production'].includes(target))throw new Error('Target must be staging or production');
 const required=target==='production'
  ? ['phase47Accepted','phase48Accepted','dependencyLockReviewed','providerConfigured','separateEnvironmentsVerified','stagingVerified','restoreVerified','productionDeploymentAuthorized','responsibleApprovalRecorded']
  : ['stagingDeploymentAuthorized','providerConfigured','separateEnvironmentsVerified'];
 const blocked=required.filter(key=>gate[key]!==true);
 if(gate.schemaVersion!==1)blocked.push('supported gate schema');
 if(target==='production'&&!/^sha256:[a-f0-9]{64}$/.test(gate.imageDigest||''))blocked.push('immutable image digest');
 return {target,eligible:blocked.length===0,blocked};
}
module.exports={evaluate};
if(require.main===module){
 try{
  const gate=JSON.parse(fs.readFileSync(path.join(__dirname,'../release-gate.json'),'utf8'));
  const result=evaluate(gate,process.argv[2]);console.log(JSON.stringify(result,null,2));
  if(!result.eligible)process.exitCode=1;
 }catch{console.error('Release gate invalid; deployment remains blocked.');process.exitCode=1;}
}
