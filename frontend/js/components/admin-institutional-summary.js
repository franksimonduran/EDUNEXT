import {esc,number,date} from './admin-dashboard-ui.js';

export function institutionalSummary(data){
  if(!data)return '<p class="muted">Sin datos disponibles.</p>';
  return `
    <section class="institutional-summary">
      <header><h2>${esc(data.institution?.name||'Institución')}</h2></header>
      <dl class="summary-dl">
        <dt>Año / Periodo</dt><dd>${esc(data.filters?.period||'—')}</dd>
        <dt>Grado</dt><dd>${esc(data.filters?.grade||'Todos')}</dd>
        <dt>Aula</dt><dd>${esc(data.filters?.room||'Todas')}</dd>
        <dt>Asignatura</dt><dd>${esc(data.filters?.course||'Todas')}</dd>
        <dt>Generado</dt><dd>${date(data.generatedAt)}</dd>
      </dl>
      <p class="demo-notice"><strong>Documento de demostración — No constituye un informe oficial.</strong></p>
    </section>
  `;
}

export function overviewMetrics(data){
  if(!data)return '';
  const m=data.summary||data.overview||{};
  const items=[
    ['Estudiantes',m.students||0],
    ['Docentes',m.teachers||0],
    ['Aulas',m.rooms||0],
    ['Cursos',m.courses||0],
    ['Contenidos',m.content||0],
    ['Evaluaciones',m.evaluations||0],
    ['Prácticas',m.formative||0]
  ].filter(([,v])=>v!==null&&v!==undefined);
  return `<div class="summary-grid">${items.map(([l,v])=>`<div class="summary-card"><h3>${esc(l)}</h3><strong>${number(v)}</strong></div>`).join('')}</div>`;
}

export function gradeDistributionTable(grades){
  if(!grades?.length)return '<p class="muted">Sin distribución por grado.</p>';
  return `
    <table class="data-table"><thead><tr><th>Grado</th><th>Estudiantes</th><th>Aulas</th><th>% del total</th><th>% institución</th></tr></thead>
    <tbody>${grades.map(g=>`<tr><td>${esc(g.id)}º</td><td>${number(g.count)}</td><td>${number(g.rooms)}</td><td>${esc(g.percent)}%</td><td>${esc(g.institutionPercent)}%</td></tr>`).join('')}</tbody></table>
  `;
}

export function roomSummaryTable(rooms){
  if(!rooms?.length)return '<p class="muted">Sin aulas.</p>';
  return `
    <table class="data-table"><thead><tr><th>Aula</th><th>Grado</th><th>Sección</th><th>Estudiantes</th><th>Docentes</th><th>Asignaturas</th></tr></thead>
    <tbody>${rooms.map(r=>`<tr><td>${esc(r.id)}</td><td>${r.grade}º</td><td>${esc(r.section)}</td><td>${number(r.students)}</td><td>${esc((r.teachers||[]).join(', ')||'—')}</td><td>${number(r.subjects)}</td></tr>`).join('')}</tbody></table>
  `;
}

export function subjectSummaryTable(subjects){
  if(!subjects?.length)return '<p class="muted">Sin asignaturas.</p>';
  return `
    <table class="data-table"><thead><tr><th>Asignatura</th><th>Grados</th><th>Unidades</th><th>Lecciones</th><th>Recursos</th></tr></thead>
    <tbody>${subjects.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc((s.grades||[]).join(', '))}</td><td>${number(s.units)}</td><td>${number(s.lessons)}</td><td>${number(s.resources)}</td></tr>`).join('')}</tbody></table>
  `;
}

export function academicSummarySection(academic){
  if(!academic)return '<p class="muted">Sin datos académicos.</p>';
  return `
    <section class="academic-summary">
      <h3>Actividad Académica</h3>
      <div class="summary-grid">
        <div class="summary-card"><h3>Evaluaciones</h3><strong>${number(academic.evaluations||0)}</strong></div>
        <div class="summary-card"><h3>Revisadas</h3><strong>${number(academic.reviewed||0)}</strong></div>
        <div class="summary-card"><h3>Pendientes</h3><strong>${number(academic.pending||0)}</strong></div>
        <div class="summary-card"><h3>Prácticas</h3><strong>${number(academic.formative||0)}</strong></div>
        <div class="summary-card"><h3>Progreso</h3><strong>${academic.progress!==null?academic.progress+'%':'—'}</strong></div>
        <div class="summary-card"><h3>Muestra</h3><strong>${number(academic.progressSample||0)}</strong></div>
      </div>
    </section>
  `;
}