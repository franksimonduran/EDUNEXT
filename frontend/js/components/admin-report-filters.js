import {field,select} from './admin-dashboard-ui.js';
import {availablePeriods,availableGrades,availableCourses} from '../data/admin-report-types.data.js';
import {esc} from './admin-dashboard-ui.js';

export function reportFilters({values={},onChange,onReset,extraFields=[]}={}){
  const periodOptions=[['','Todos'],...availablePeriods.map(p=>[p.id,p.label])];
  const gradeOptions=[['','Todos'],...availableGrades.map(g=>[g.id,g.label])];
  const courseOptions=[['','Todas'],...availableCourses.map(c=>[c.id,c.label])];
  const roomOptions=[['','Todas']];
  const indicatorOptions=[['','Todos'],['organization','Organización'],['content','Contenido'],['academic','Académica'],['progress','Progreso'],['formative','Formativa'],['availability','Disponibilidad'],['users','Usuarios'],['rooms','Aulas'],['enrollments','Matrículas'],['assignments','Asignaciones'],['evaluations','Evaluaciones']];
  
  const fields=`
    ${select('period','Periodo',periodOptions,values.period||'')}
    ${select('grade','Grado',gradeOptions,values.grade||'')}
    ${select('room','Aula',roomOptions,values.room||'')}
    ${select('course','Asignatura',courseOptions,values.course||'')}
    ${extraFields.map(f=>f(values)).join('')}
  `;
  
  return `
    <form class="filter-card" id="report-filters" aria-label="Filtros de reportes">
      <div class="filter-grid">${fields}</div>
      <div class="filter-actions">
        <button class="button-secondary" type="reset">Limpiar filtros</button>
        ${onChange?`<button class="button-primary" type="submit">Aplicar</button>`:''}
      </div>
    </form>
  `;
}

export function reportConfigForm(config={},availableRooms=[]){
  const periodOptions=[['','Seleccionar'],...availablePeriods.map(p=>[p.id,p.label])];
  const gradeOptions=[['','Seleccionar'],...availableGrades.map(g=>[g.id,g.label])];
  const roomOptions=[['','Seleccionar'],...availableRooms.map(r=>[r.id,`${r.grade}º${r.section}`])];
  const courseOptions=[['','Seleccionar'],...availableCourses.map(c=>[c.id,c.label])];
  const indicatorOptions=[['','Seleccionar'],['organization','Organización'],['content','Contenido'],['academic','Académica'],['progress','Progreso'],['formative','Formativa'],['availability','Disponibilidad'],['users','Usuarios'],['rooms','Aulas'],['enrollments','Matrículas'],['assignments','Asignaciones'],['evaluations','Evaluaciones']];
  
  const typeOptions=[['','Seleccionar'],['institutional','Reporte Institucional'],['grade','Reporte por Grado'],['classroom','Reporte por Aula'],['course','Reporte por Asignatura'],['statistics','Estadísticas Institucionales'],['monitoring','Seguimiento Académico'],['quality','Calidad de Datos'],['activity','Actividad de la Plataforma'],['history','Historial de Reportes']];
  
  return `
    <form class="config-form" id="report-config-form" aria-label="Configuración de reporte">
      <div class="form-grid">
        ${field('name','Nombre del reporte (opcional)',config.name||'')}
        ${select('type','Tipo',typeOptions,config.type||'')}
        ${select('period','Periodo',periodOptions,config.period||'')}
        ${select('grade','Grado',gradeOptions,config.grade||'')}
        ${select('room','Aula',roomOptions,config.room||'')}
        ${select('course','Asignatura',courseOptions,config.course||'')}
      </div>
      <fieldset class="indicator-fieldset">
        <legend>Indicadores a incluir</legend>
        <div class="indicator-grid" id="indicator-checkboxes"></div>
      </fieldset>
      <div class="options-grid">
        <label class="checkbox-label"><input type="checkbox" name="showTables" ${config.showTables?'checked':''}> Mostrar tablas</label>
        <label class="checkbox-label"><input type="checkbox" name="showCharts" ${config.showCharts?'checked':''}> Mostrar gráficos</label>
        <label class="checkbox-label"><input type="checkbox" name="showMethodology" ${config.showMethodology?'checked':''}> Incluir metodología</label>
        <label class="checkbox-label"><input type="checkbox" name="showWarnings" ${config.showWarnings?'checked':''}> Incluir advertencias</label>
      </div>
      <div class="form-actions">
        <button class="button-secondary" type="button" id="validate-config">Validar</button>
        <button class="button-primary" type="submit">Generar reporte</button>
      </div>
    </form>
  `;
}

export function bindConfigForm(root,onValidate,onSubmit){
  const form=root.querySelector('#report-config-form');
  if(!form)return;
  const typeSelect=form.elements.type;
  const gradeSelect=form.elements.grade;
  const roomSelect=form.elements.room;
  
  const indicatorMap={
    institutional:['organization','content','academic'],
    grade:['organization','progress','formative'],
    classroom:['organization','progress'],
    course:['content','formative','progress'],
    statistics:['organization','content','academic','progress','formative','availability'],
    monitoring:['progress','formative'],
    quality:['users','rooms','enrollments','assignments','content','evaluations','academic','availability'],
    activity:[],
    history:[]
  };
  
  function updateIndicators(){
    const type=typeSelect.value;
    const container=root.querySelector('#indicator-checkboxes');
    const allowed=indicatorMap[type]||[];
    const all=['organization','content','academic','progress','formative','availability','users','rooms','enrollments','assignments','content','evaluations'];
    container.innerHTML=all.map(id=>`<label class="checkbox-label"><input type="checkbox" name="indicators" value="${id}" ${allowed.includes(id)?'checked':''} ${!allowed.includes(id)?'disabled':''}> ${id}</label>`).join('');
    gradeSelect.disabled=type!=='grade'&&type!=='classroom'&&type!=='course'&&type!=='monitoring'&&type!=='quality';
    roomSelect.disabled=type!=='classroom'&&type!=='quality';
  }
  
  typeSelect.onchange=updateIndicators;
  updateIndicators();
  
  form.querySelector('#validate-config').onclick=e=>{e.preventDefault();onValidate?.(Object.fromEntries(new FormData(form)));};
  form.onsubmit=e=>{e.preventDefault();onSubmit?.(Object.fromEntries(new FormData(form)));};
  form.onreset=()=>{setTimeout(updateIndicators,0);};
}
