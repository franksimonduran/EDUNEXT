// Exact, reviewed UI copy only. Never rewrite identifiers, comments or documentation.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const changes = [
 ['frontend/js/components/admin-dashboard-ui.js', 'Fuente Fase 16 · Sin periodo de matrícula confirmado', 'Periodo de matrícula sin confirmar'],
 ['frontend/js/components/monitor-lesson-block-editor.js', 'Diccionario de la Fase 8 — selección de términos existentes', 'Selecciona términos del diccionario'],
 ['frontend/js/monitor/gradebook.js', 'Consulta los resultados académicos de tus estudiantes. Cada puntaje procede de la corrección de fase 17.', 'Consulta los resultados de las correcciones locales.'],
 ['frontend/js/monitor/management-shell.js', 'Datos de demostración incluidos en la aplicación. Servicio no integrado; última actualización y cambios remotos desconocidos.', 'Datos de demostración · Sin conexión al servicio.'],
 ['frontend/js/services/admin-activity.service.js', 'IndexedDB · Fase 22', 'Borrador local'],
 ['frontend/js/services/admin-activity.service.js', 'IndexedDB · Fase 17; configuración demostrativa', 'Evaluación local de demostración'],
 ['frontend/js/services/admin-activity.service.js', 'IndexedDB · Fase 19; configuración local', 'Actividad local'],
 ['frontend/js/services/admin-platform-activity.service.js', 'Registros locales de demostración. No refleja actividad de servidor ni de otros dispositivos. Eventos de evaluación basados en correcciones locales de fase 17.', 'Registros locales de demostración; no incluyen actividad remota.'],
 ['frontend/js/services/monitor-calendar.service.js', 'Actividad local de fase 19', 'Actividad local'],
 ['frontend/js/services/monitor-grades.service.js', 'Correcciones locales de fase 17; datos ficticios', 'Correcciones locales · Datos ficticios'],
 ['frontend/js/services/admin-users.service.js', 'Relación de demostración Fase 16; no matrícula confirmada', 'Relación de demostración · Matrícula sin confirmar'],
 ['frontend/js/data/admin-academic-periods-demo.data.js', 'Periodo de demostración de la Fase 15; no define un calendario oficial', 'Periodo de demostración · No oficial'],
 ['frontend/js/data/admin-dashboard-config.data.js', 'Relación demostrativa de Fase 16 sin periodo de matrícula conocido; el periodo no cambia este contador.', 'Relación de demostración sin periodo confirmado; este filtro no cambia el total.'],
 ['frontend/js/utils/academic-relations.js', 'Relación compartida de la Fase 16; sin periodo confirmado', 'Relación de demostración · Periodo sin confirmar'],
 ['frontend/js/i18n/monitor-account.js', 'Avisos internos de la Fase 21; sin notificaciones Push nuevas.', 'Avisos internos · Sin notificaciones push.'],
 ['frontend/js/i18n/monitor-account.js', 'Phase 21 internal notices; no new Push notifications.', 'Internal notices · No push notifications.'],
 ['frontend/js/admin/admin-shell.js', 'Mi Perfil — próxima fase', 'Mi Perfil — no disponible'],
 ['frontend/js/admin/admin-shell.js', 'Configuración institucional — próxima fase', 'Configuración institucional — no disponible'],
 ['frontend/js/admin/admin-shell.js', 'Ayuda — próxima fase', 'Ayuda — no disponible'],
 ['frontend/js/student/evaluaciones.js', 'Modo demostrativo - sin backend', 'Datos de demostración'],
 ['frontend/js/student/learning-i18n.js', 'Las descargas todavía no están implementadas. No se ha almacenado ni verificado ningún recurso en IndexedDB o Cache Storage.', 'Descarga no disponible. No se guardaron recursos.'],
 ['frontend/js/student/practice-i18n.js', 'Recurso no disponible offline. El motor de descargas está pendiente.', 'Este recurso no está disponible sin conexión.'],
 ['frontend/js/student/i18n.js', 'Esta evaluación es una muestra y no está habilitada. El servidor deberá verificar el período autorizado antes de permitir su acceso.', 'Evaluación de muestra · No habilitada.'],
 ['frontend/js/monitor/support-tracking.js', 'Observación de demostración guardada en este dispositivo. No se ha compartido con estudiantes.', 'Observación demo guardada aquí · No enviada.'],
 ['frontend/js/monitor/calendar-views.js', 'No representa actualización confirmada del servidor.', 'Sin confirmación remota.'],
];
const modified = new Map();
for (const [relative, before, after] of changes) {
 const file = path.join(root, relative);
 const source = modified.get(file) ?? fs.readFileSync(file, 'utf8');
 if (!source.includes(before)) throw new Error('Expected copy missing: ' + relative + ': ' + before);
 modified.set(file, source.replaceAll(before, after));
}
for (const [file, source] of modified) fs.writeFileSync(file, source);
console.log(`${changes.length} reviewed copy replacements in ${modified.size} files.`);
