# Menú lateral del monitor

Mejora visual acotada, sin cambios en APIs, permisos o datos. Conserva cinco grupos:
Principal, Gestión educativa, Seguimiento, Organización y Cuenta. Sincronización
permanece en Organización. Cerrar sesión conserva la confirmación demo existente;
no se afirma revocación de sesión real.

Cambios: `frontend/js/components/sidebar.js` incorpora clase exclusiva del monitor
y relación aria-controls; `frontend/js/data/monitor-demo.data.js` usa iconos existentes
settings/logout. `frontend/css/monitor/dashboard.css` importa el layout anterior
conservado en `dashboard-layout.css` y los nuevos estilos en `navigation.css`.
No se cambia el contenido del detalle de evento ni se añaden grupos desplegables.

Verificación: `node tests/monitor-navigation.cjs` pasa (grupos, activo, iconos, ARIA,
aislamiento administrativo). `node tests/phase23.cjs` no arranca: requiere Playwright
en una ruta absoluta ajena a este equipo. Navegador/mobile/contraste visual pendientes;
no se declara conformidad WCAG. No cambia el gate NO-GO del proyecto.
