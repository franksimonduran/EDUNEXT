import {icon} from './icons.js';
import {esc} from './admin-dashboard-ui.js';

export function reportTypeCard(type,{onClick}={}){
  const t=reportTypes.find(x=>x.id===type)||{id:type,label:type,description:'',icon:'clipboard',availability:'unknown'};
  const availClass=t.availability==='full'?'avail-full':t.availability==='grade'?'avail-grade':t.availability==='room'?'avail-room':t.availability==='course'?'avail-course':'avail-unknown';
  return `<article class="report-type-card ${availClass}" data-type="${esc(type)}" tabindex="0" role="button" aria-label="Preparar ${esc(t.label)}">
    <div class="card-icon">${icon(t.icon)}</div>
    <h3>${esc(t.label)}</h3>
    <p>${esc(t.description)}</p>
    <div class="card-meta">
      <span class="badge ${availClass}">Datos: ${esc(t.availability)}</span>
    </div>
    <button class="button-primary" type="button" data-action="prepare" data-type="${esc(type)}">Preparar reporte</button>
  </article>`;
}

export function reportTypeGrid(types){
  return `<div class="report-type-grid">${types.map(t=>reportTypeCard(t)).join('')}</div>`;
}

export function summaryCard(label,value,subtitle=''){
  return `<article class="summary-card"><h3>${esc(label)}</h3><strong>${esc(String(value))}</strong>${subtitle?`<p class="muted">${esc(subtitle)}</p>`:''}</article>`;
}

export function summaryGrid(items){
  return `<div class="summary-grid">${items.map(([label,value,sub])=>summaryCard(label,value,sub)).join('')}</div>`;
}

export const reportTypes=[
  {id:'institutional',label:'Reporte Institucional',icon:'clipboard',description:'Resumen global de la organización, estudiantes, aulas, docentes, contenidos y actividad.',availability:'full'},
  {id:'grade',label:'Reporte por Grado',icon:'book',description:'Distribución de estudiantes, aulas, cursos y resultados para un grado específico.',availability:'grade'},
  {id:'classroom',label:'Reporte por Aula',icon:'users',description:'Organización, indicadores agregados y calidad de datos de un aula concreta.',availability:'room'},
  {id:'course',label:'Reporte por Asignatura',icon:'book-open',description:'Unidades, lecciones, prácticas, evaluaciones y resultados por curso y grado.',availability:'course'},
  {id:'statistics',label:'Estadísticas Institucionales',icon:'chart',description:'Indicadores agregados, gráficos y comparativas entre periodos compatibles.',availability:'full'},
  {id:'monitoring',label:'Seguimiento Académico',icon:'target',description:'Progreso curricular, prácticas formativas, evaluaciones corregidas y observaciones.',availability:'full'},
  {id:'quality',label:'Calidad de Datos',icon:'alert-triangle',description:'Validación de integridad, duplicados, referencias rotas, cobertura y disponibilidad.',availability:'full'},
  {id:'activity',label:'Actividad de la Plataforma',icon:'activity',description:'Eventos administrativos y académicos locales con filtros por tipo, periodo y fuente.',availability:'full'},
  {id:'history',label:'Historial de Reportes',icon:'clock',description:'Configuraciones e informes demostrativos preparados localmente.',availability:'full'}
];
