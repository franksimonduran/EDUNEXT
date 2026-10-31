import {esc} from './admin-dashboard-ui.js';

export function offlinePackageCard(pkg){
  const statusColors={
    preparado:'#3b82f6',
    descargado:'#10b981',
    verificado:'#8b5cf6',
    incompleto:'#f59e0b',
    'version-diferente':'#ef4444',
    'sin-verificar':'#6b7280',
  };
  return `
    <article class="package-card" data-pkg="${esc(pkg.id)}">
      <header>
        <h3>${esc(pkg.name)}</h3>
        <span class="pkg-status" style="background:${statusColors[pkg.localStatus]||'#6b7280'}">${esc(getStatusLabel(pkg.localStatus))}</span>
      </header>
      <dl>
        <dt>Curso</dt><dd>${esc(pkg.course)}</dd>
        <dt>Grado</dt><dd>${pkg.grade}º</dd>
        <dt>Versión</dt><dd>${esc(pkg.version)}</dd>
        <dt>Lecciones</dt><dd>${pkg.lessonsIncluded}</dd>
        <dt>Recursos</dt><dd>${pkg.resourcesTotal} (${pkg.requiredResources} obligatorios)</dd>
        <dt>Estado</dt><dd>${esc(getStatusLabel(pkg.localStatus))}</dd>
        ${pkg.downloadedAt?`<dt>Descargado</dt><dd>${new Date(pkg.downloadedAt).toLocaleString()}</dd>`:''}
        ${pkg.verifiedAt?`<dt>Verificado</dt><dd>${new Date(pkg.verifiedAt).toLocaleString()}</dd>`:''}
      </dl>
      <div class="pkg-actions">
        <button class="button-secondary" data-action="detail" data-pkg="${esc(pkg.id)}">Detalle</button>
        <button class="button-secondary" data-action="verify" data-pkg="${esc(pkg.id)}">Verificar</button>
        <button class="button-secondary" data-action="deps" data-pkg="${esc(pkg.id)}">Dependencias</button>
      </div>
    </article>
  `;
}

export function packageDetailPanel(pkg,resourceCheck){
  const statusColors={
    preparado:'#3b82f6',
    descargado:'#10b981',
    verificado:'#8b5cf6',
    incompleto:'#f59e0b',
    'version-diferente':'#ef4444',
    'sin-verificar':'#6b7280',
  };
  return `
    <section class="package-detail">
      <header>
        <h2>${esc(pkg.name)}</h2>
        <span class="pkg-status" style="background:${statusColors[pkg.localStatus]||'#6b7280'}">${esc(getStatusLabel(pkg.localStatus))}</span>
      </header>
      <dl>
        <dt>ID</dt><dd>${esc(pkg.id)}</dd>
        <dt>Curso</dt><dd>${esc(pkg.course)}</dd>
        <dt>Grado</dt><dd>${pkg.grade}º</dd>
        <dt>Versión</dt><dd>${esc(pkg.version)}</dd>
        <dt>Lecciones</dt><dd>${pkg.lessonsIncluded}</dd>
        <dt>Recursos totales</dt><dd>${pkg.resourcesTotal}</dd>
        <dt>Obligatorios</dt><dd>${pkg.requiredResources}</dd>
        <dt>Opcionales</dt><dd>${pkg.optionalResources}</dd>
        <dt>Tamaño</dt><dd>${pkg.sizeBytes?formatBytes(pkg.sizeBytes):'Desconocido'}</dd>
        <dt>Estado local</dt><dd>${getStatusLabel(pkg.localStatus)}</dd>
        ${pkg.downloadedAt?`<dt>Descargado</dt><dd>${new Date(pkg.downloadedAt).toLocaleString()}</dd>`:''}
        ${pkg.verifiedAt?`<dt>Verificado</dt><dd>${new Date(pkg.verifiedAt).toLocaleString()}</dd>`:''}
      </dl>
      
      ${pkg.dependencies?.length?`
        <h3>Dependencias</h3>
        <ul>${pkg.dependencies.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>
      `:''}
      
      <h3>Recursos</h3>
      ${resourceCheck?`
        <div class="resource-check">
          <div class="check-summary">
            <span class="${resourceCheck.valid?'ok':'warn'}">Total: ${resourceCheck.total} | Disponibles: ${resourceCheck.available} | Faltantes: ${resourceCheck.missing}</span>
            ${resourceCheck.integrity?`<span class="integrity ${resourceCheck.integrity==='valid'?'ok':resourceCheck.integrity==='mismatch'?'warn':'error'}">Integridad: ${resourceCheck.integrity}</span>`:''}
          </div>
          <table class="resource-table">
            <thead><tr><th>Recurso</th><th>Tipo</th><th>URL</th><th>Obligatorio</th><th>Estado</th></thead>
            <tbody>
              ${resourceCheck.details.map(r=>`
                <tr class="${r.exists?'ok':'missing'}">
                  <td>${esc(r.resourceId)}</td>
                  <td>${esc(r.type)}</td>
                  <td>${esc(r.url)}</td>
                  <td>${r.required?'Sí':'No'}</td>
                  <td>${r.exists?'✅ Disponible':'❌ Faltante'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `:`<p class="muted">Sin verificación de recursos disponible.</p>`}
      
      <div class="detail-actions">
        <button class="button-secondary" data-action="close">Cerrar</button>
        <button class="button-primary" data-action="verify">Verificar ahora</button>
        <button class="button-secondary" data-action="deps">Ver dependencias</button>
      </div>
    </section>
  `;
}

function formatBytes(bytes){
  if(bytes<1024) return bytes+' B';
  if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB';
  if(bytes<1024*1024*1024) return (bytes/1024/1024).toFixed(2)+' MB';
  return (bytes/1024/1024/1024).toFixed(2)+' GB';
}

function getStatusLabel(status){
  const labels={
    preparado:'Preparado',
    descargado:'Descargado',
    verificado:'Verificado',
    incompleto:'Incompleto',
    'version-diferente':'Versión diferente',
    'sin-verificar':'Sin verificar',
  };
  return labels[status]||status;
}

export function packageFilters(packages){
  const courses=[...new Set(packages.map(p=>p.course).filter(Boolean))];
  const grades=[...new Set(packages.map(p=>p.grade).filter(Boolean))];
  const statuses=['preparado','descargado','verificado','incompleto','version-diferente','sin-verificar'];
  
  const courseOptions=[['','Todos'],...courses.map(c=>[c,c])];
  const gradeOptions=[['','Todos'],...grades.map(g=>[g,g+'º'])];
  const statusOptions=[['','Todos'],...statuses.map(s=>[s,getStatusLabel(s)])];
  
  return `
    <form class="filter-card" id="pkg-filters">
      <div class="filter-grid">
        <label class="field"><span>Curso</span><select name="course">${courseOptions.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="field"><span>Grado</span><select name="grade">${gradeOptions.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="field"><span>Estado</span><select name="status">${statusOptions.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>
        <label class="field field-search"><span>Buscar</span><input type="search" name="q" placeholder="Nombre o ID"></label>
      </div>
      <div class="filter-actions"><button class="button-secondary" type="reset">Limpiar filtros</button></div>
    </form>
  `;
}

export function packageStatsGrid(stats){
  return `
    <div class="summary-grid">
      <div class="summary-card"><h3>Total paquetes</h3><strong>${stats.total}</strong></div>
      ${Object.entries(stats.byStatus||{}).map(([s,c])=>`<div class="summary-card"><h3>${getStatusLabel(s)}</h3><strong>${c}</strong></div>`).join('')}
      <div class="summary-card"><h3>Total recursos</h3><strong>${stats.totalResources||0}</strong></div>
      <div class="summary-card"><h3>Tamaño total</h3><strong>${stats.totalSize?formatBytes(stats.totalSize):'0 B'}</strong></div>
    </div>
  `;
}