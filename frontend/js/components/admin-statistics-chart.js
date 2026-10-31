import {esc,number} from './admin-dashboard-ui.js';

export function svgBar(label,percent,total,maxWidth=280){
  const w=Math.max(0,Math.min(100,percent));
  return `<div class="chart-bar" role="group" aria-label="${esc(label)}: ${esc(String(percent))}% (n=${esc(String(total))})"><div class="bar-label">${esc(label)}</div><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><div class="bar-value">${esc(String(percent))}% <small>(n=${esc(String(total))})</small></div></div>`;
}

export function distributionChart(rows,total,label){
  if(!total)return `<p class="muted">${esc('Sin datos para '+label)}</p>`;
  return `<div class="distribution-chart" role="group" aria-label="${esc(label)}">${rows.map(r=>svgBar(r.label,r.percent,total)).join('')}<p class="chart-note">Total: ${rows.reduce((n,r)=>n+r.count,0)}. Porcentaje = cantidad ÷ total × 100.</p></div>`;
}

export function gradeDistributionChart(data){
  if(!data?.grades?.length)return '<p class="muted">Sin distribución por grado.</p>';
  return distributionChart(data.grades.map(g=>({label:`${g.id}º`,count:g.count,percent:g.percent})),data.grades.reduce((n,g)=>n+g.count,0),'Estudiantes por grado');
}

export function roomDistributionChart(data){
  if(!data.rooms?.length)return '<p class="muted">Sin distribución por aula.</p>';
  const total=data.rooms.reduce((n,r)=>n+r.students,0);return distributionChart(data.rooms.map(r=>({label:`${r.grade}º${r.section}`,count:r.students,percent:total?100*r.students/total:0})),total,'Estudiantes por aula');
}

export function courseChart(data){
  if(!data.subjects?.length)return '<p class="muted">Sin datos de asignaturas.</p>';
  const total=data.subjects.reduce((n,s)=>n+s.lessons,0);return distributionChart(data.subjects.map(s=>({label:s.name,count:s.lessons,percent:total?100*s.lessons/total:0})),total,'Lecciones por asignatura');
}

export function progressChart(progress,total){
  if(progress===null||progress===undefined)return '<p class="muted">Progreso no disponible (sin denominador).</p>';
  return `<div class="progress-chart" role="group" aria-label="Progreso curricular"><div class="progress-ring" style="--progress:${progress}"><svg width="120" height="120"><circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="10"></circle><circle cx="60" cy="60" r="50" fill="none" stroke="#3b5bdb" stroke-width="10" stroke-dasharray="${314}" stroke-dashoffset="${314*(100-progress)/100}" transform="rotate(-90 60 60)"></circle><text x="60" y="65" text-anchor="middle" font-size="24" fill="#1e2a4a">${esc(String(progress))}%</text></svg></div><p>${esc(String(progress))}% (${esc(String(total))} estudiantes)</p></div>`;
}

export function formativeChart(data){
  const byCourse=data.formative?.reduce((acc,f)=>{acc[f.course]=(acc[f.course]||0)+1;return acc;},{})||{};
  if(!Object.keys(byCourse).length)return '<p class="muted">Sin prácticas registradas.</p>';
  const total=Object.values(byCourse).reduce((n,v)=>n+v,0);
  return distributionChart(Object.entries(byCourse).map(([k,v])=>({label:k,count:v,percent:total?Math.round(1000*v/total)/10:0})),total,'Prácticas por asignatura');
}

export function evaluationStatusChart(academic){
  if(!academic)return '<p class="muted">Sin datos de evaluaciones.</p>';
  const reviewed=academic.reviewed||0,pending=academic.pending||0,total=reviewed+pending;
  if(total===0)return '<p class="muted">Sin evaluaciones.</p>';
  return distributionChart([{label:'Revisadas',count:reviewed,percent:total?Math.round(1000*reviewed/total)/10:0},{label:'Pendientes',count:pending,percent:total?Math.round(1000*pending/total)/10:0}],total,'Estado de evaluaciones');
}

export function qualitySummaryChart(quality){
  if(!quality)return '<p class="muted">Sin datos de calidad.</p>';
  const errors=quality.summary?.errors||0,warnings=quality.summary?.warnings||0,info=quality.summary?.info||0,total=quality.summary?.total||0;
  if(total===0)return '<p class="muted">Sin incidencias.</p>';
  return distributionChart([{label:'Errores',count:errors,percent:total?Math.round(1000*errors/total)/10:0},{label:'Advertencias',count:warnings,percent:total?Math.round(1000*warnings/total)/10:0},{label:'Información',count:quality.summary.info||0,percent:total?Math.round(1000*(quality.summary.info||0)/total)/10:0}],total,'Calidad de datos');
}
