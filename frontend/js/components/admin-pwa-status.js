import {esc} from './admin-dashboard-ui.js';

export function pwaStatusCard(data){
  const checks=[
    {id:'sw-support',name:'Soporte SW',pass:data.serviceWorker},
    {id:'sw-registration',name:'Registro SW',pass:data.swRegistered},
    {id:'sw-control',name:'Controla página',pass:data.swControlling},
    {id:'manifest',name:'Manifiesto',pass:data.manifest},
    {id:'manifest-valid',name:'Manifiesto válido',pass:data.manifestValid},
    {id:'cache',name:'Cache Storage',pass:data.cacheStorage},
    {id:'installable',name:'Instalable',pass:data.installable},
    {id:'standalone',name:'Standalone',pass:data.standalone},
    {id:'offline',name:'Offline ready',pass:data.offlineReady},
  ];
  
  const passed=checks.filter(c=>c.pass).length;
  
  return `
    <article class="pwa-status-card">
      <header>
        <h2>Diagnóstico PWA</h2>
        <div class="pwa-score">${checks.filter(c=>c.pass).length}/${checks.length}</div>
      </header>
      <ul class="pwa-checks">
        ${checks.map(c=>`
          <li class="${c.pass?'pass':'fail'}">
            <span class="check-icon">${c.pass?'✅':'❌'}</span>
            <span class="check-name">${esc(c.name)}</span>
          </li>
        `).join('')}
      </ul>
    </article>
  `;
}

export function pwaDetailPanels(data){
  return `
    <div class="pwa-panels">
      <section class="pwa-panel">
        <h3>Service Worker</h3>
        <dl>
          <dt>Soportado</dt><dd>${data.serviceWorker?'Sí':'No'}</dd>
          <dt>Registrado</dt><dd>${data.swRegistered?'Sí':'No'}</dd>
          <dt>Activo</dt><dd>${data.swActive?'Sí':'No'}</dd>
          <dt>Controlando página</dt><dd>${data.swControlling?'Sí':'No'}</dd>
          ${data.swScope?`<dt>Ámbito</dt><dd>${data.swScope}</dd>`:''}
        </dl>
      </section>
      <section class="pwa-panel">
        <h3>Manifiesto</h3>
        <dl>
          <dt>Presente</dt><dd>${data.manifest?'Sí':'No'}</dd>
          <dt>Accesible</dt><dd>${data.manifestAccessible?'Sí':'No'}</dd>
          <dt>Válido</dt><dd>${data.manifestValid?'Sí':'No'}</dd>
          ${data.manifestName?`<dt>Nombre</dt><dd>${data.manifestName}</dd>`:''}
          ${data.manifestVersion?`<dt>Versión</dt><dd>${data.manifestVersion}</dd>`:''}
          ${data.manifestIcons?`<dt>Iconos</dt><dd>${data.manifestIcons}</dd>`:''}
        </dl>
      </section>
      <section class="pwa-panel">
        <h3>Cache Storage</h3>
        <dl>
          <dt>Disponible</dt><dd>${data.cacheStorage?'Sí':'No'}</dd>
          <dt>Cachés totales</dt><dd>${data.cacheCount||0}</dd>
          <dt>Cachés de app</dt><dd>${data.appCacheCount||0}</dd>
        </dl>
      </section>
      <section class="pwa-panel">
        <h3>Instalación</h3>
        <dl>
          <dt>Instalable</dt><dd>${data.installable?'Sí':'No'}</dd>
          <dt>Modo standalone</dt><dd>${data.standalone?'Sí':'No'}</dd>
        </dl>
      </section>
      <section class="pwa-panel">
        <h3>Offline</h3>
        <dl>
          <dt>offline.html</dt><dd>${data.offlineReady?'Disponible':'No disponible'}</dd>
          <dt>Fallback SW</dt><dd>${data.offlineFallback?'Configurado':'No configurado'}</dd>
        </dl>
      </section>
    </div>
  `;
}

export function swDetailPanel(data){
  if(!data.supported) return '<p class="muted">Service Worker no soportado en este navegador.</p>';
  return `
    <section class="sw-detail">
      <h3>Service Worker</h3>
      <dl>
        <dt>Soportado</dt><dd>${data.supported?'Sí':'No'}</dd>
        <dt>Registrado</dt><dd>${data.registered?'Sí':'No'}</dd>
        <dt>Activo</dt><dd>${data.active?'Sí':'No'}</dd>
        <dt>Controlando página</dt><dd>${data.controlling?'Sí':'No'}</dd>
        <dt>Ámbito</dt><dd>${data.scope||'—'}</dd>
        <dt>Update via cache</dt><dd>${data.updateViaCache||'—'}</dd>
      </dl>
    </section>
  `;
}

export function manifestDetailPanel(data){
  if(!data.present) return '<p class="muted">No hay manifiesto referenciado.</p>';
  if(!data.accessible) return '<p class="muted">Manifiesto referenciado pero no accesible.</p>';
  return `
    <section class="manifest-detail">
      <h3>Manifiesto PWA</h3>
      <dl>
        <dt>Nombre</dt><dd>${data.name||'—'}</dd>
        <dt>Nombre corto</dt><dd>${data.shortName||'—'}</dd>
        <dt>Start URL</dt><dd>${data.startUrl||'—'}</dd>
        <dt>Display</dt><dd>${data.display||'—'}</dd>
        <dt>Background</dt><dd>${data.backgroundColor||'—'}</dd>
        <dt>Theme color</dt><dd>${data.themeColor||'—'}</dd>
        <dt>Iconos</dt><dd>${data.icons||0}</dd>
        <dt>Versión</dt><dd>${data.version||'—'}</dd>
      </dl>
    </section>
  `;
}

export function cacheDetailPanel(data){
  if(!data.supported) return '<p class="muted">Cache Storage no soportado.</p>';
  return `
    <section class="cache-detail">
      <h3>Cache Storage</h3>
      <p>Total cachés: ${data.cacheNames?.length||0} | Cachés de app: ${data.appCaches?.length||0}</p>
      <ul>
        ${Object.entries(data.details||{}).map(([name,info])=>`<li>${esc(name)}: ${info.count} recursos</li>`).join('')}
      </ul>
    </section>
  `;
}