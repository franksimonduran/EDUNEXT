import {diagnosticRules, diagnosticCategories} from '../data/admin-diagnostic-rules.data.js';

export function getAllDiagnosticRules(){
  return diagnosticRules;
}

export function getDiagnosticRulesByCategory(categoryKey){
  const catLabel=diagnosticCategories[categoryKey]?.label;
  if(!catLabel) return [];
  return diagnosticRules.filter(r=>r.category===catLabel);
}

export function getDiagnosticRule(id){
  return diagnosticRules.find(r=>r.id===id);
}

export function getAllCategories(){
  return Object.entries(diagnosticCategories).map(([key,{label,icon}])=>({key,label,icon}));
}

export function getCategoryLabel(key){
  return diagnosticCategories[key]?.label||key;
}

export function getCategoryIcon(key){
  return diagnosticCategories[key]?.icon||'help-circle';
}

export function validateDiagnosticResult(result){
  return result && typeof result==='object' && typeof result.id==='string' && typeof result.result==='string';
}

export function normalizeDiagnosticResult(raw){
  if(!raw) return {result:'skipped',evidence:'no-data',error:'Sin resultado'};
  return {
    id:raw.id||'unknown',
    result:['success','warning','error','skipped'].includes(raw.result)?raw.result:'skipped',
    evidence:raw.evidence||raw.message||'',
    error:raw.error||null,
    duration:typeof raw.duration==='number'?raw.duration:0,
    recommendation:raw.recommendation||undefined,
    limitation:'Prueba local · Sin validación de servidor',
  };
}