import { diagnosticRules, diagnosticCategories, runAllDiagnostics } from '../data/admin-diagnostic-rules.data.js';

export async function runFullDiagnostics(){
  const testPromises=runAllDiagnostics();
  const results=await Promise.all(testPromises);
  return {
    tests:results,
    summary:generateSummary(results),
    timestamp:Date.now(),
    limitations:['Todas las pruebas son locales','No validan conectividad real con servidor','Resultados dependen del estado actual del navegador'],
  };
}

export async function runDiagnosticByCategory(category){
  const tests=diagnosticRules.filter(r=>Object.entries(diagnosticCategories).find(([k,v])=>v.label===r.category)?.[0]===category);
  const results=[];
  for(const rule of tests){
    const start=performance.now();
    let result, evidence, error;
    try{result=await rule.test();evidence=result?'pass':'fail';}catch(e){result=false;error=e.message;evidence='error';}
    const duration=Math.round(performance.now()-start);
    results.push({id:rule.id,name:rule.name,description:rule.description,category,result:result?'success':(error?'error':'warning'),evidence,error,duration,recommendation:result?undefined:rule.remediation,limitation:'Prueba local · Sin validación de servidor'});
  }
  return {tests:results,summary:generateSummary(results),timestamp:Date.now()};
}

export async function runSingleDiagnostic(testId){
  const rule=diagnosticRules.find(r=>r.id===testId);
  if(!rule) return {error:'Test no encontrado'};
  const start=performance.now();
  let result, evidence, error;
  try{result=await rule.test();evidence=result?'pass':'fail';}catch(e){result=false;error=e.message;evidence='error';}
  const duration=Math.round(performance.now()-start);
  return {id:rule.id,name:rule.name,description:rule.description,category:rule.category,result:result?'success':(error?'error':'warning'),evidence,error,duration,recommendation:result?undefined:rule.remediation,limitation:'Prueba local · Sin validación de servidor'};
}

function generateSummary(results){
  const counts={success:0,warning:0,error:0,skipped:0};
  for(const r of results){
    if(r.result==='success') counts.success++;
    else if(r.result==='warning') counts.warning++;
    else if(r.result==='error') counts.error++;
    else counts.skipped++;
  }
  return {
    total:results.length,
    ...counts,
    passRate:null,
    categories:Object.entries(diagnosticCategories).map(([key,{label,icon}])=>({
      key,label,icon,
      total:results.filter(r=>Object.entries(diagnosticCategories).find(([k,v])=>v.label===r.category)?.[0]===key).length,
      success:results.filter(r=>r.result==='success' && Object.entries(diagnosticCategories).find(([k,v])=>v.label===r.category)?.[0]===key).length,
    })),
  };
}

export function getDiagnosticRules(){
  return diagnosticRules.map(r=>({id:r.id,name:r.name,description:r.description,category:r.category}));
}

export function getDiagnosticCategories(){
  return Object.entries(diagnosticCategories).map(([key,{label,icon}])=>({key,label,icon}));
}
