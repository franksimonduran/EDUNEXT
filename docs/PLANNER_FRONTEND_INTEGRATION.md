# Integración HTML/CSS/JavaScript

## Conectado

- `student/agenda.html?grade=4&modo=api`: tareas propias paginadas, calendario de
  próximos 31 días, resumen, apertura de instrucciones, borrador de texto, guardado,
  entrega con recibo, feedback publicado y preparación de corrección autorizada.
- `monitor/tareas.html?modo=api`: contextos docentes obtenidos del servidor,
  creación de borrador, publicación, consulta de entregas y feedback formativo.
- `modo=demo` conserva implementación previa. Sin parámetro se reutiliza detección
  de sesión del servicio de progreso. Un error API nunca se sustituye por demo.

Servicio único `academic-planner-api.service.js` reutiliza apiRequest y autenticación
existentes. No se añadieron frameworks ni otro diseño. Se reutilizan shells,
tarjetas, formularios, diálogo y regiones de estado.

Claves de idempotencia se conservan en memoria para la operación. Tras recarga,
el estado persistente y las restricciones siguen siendo autoridad. Las respuestas
se escapan antes de renderizar; se usa textarea.value para contenido editable.
Botones se bloquean mientras se opera, errores se anuncian con role=status y el
diálogo devuelve foco al botón de tarea. Prueba móvil ejecutada a 390×844.

## Pendiente

Sin conexión, el formulario conserva texto en memoria; recargar puede perderlo.
No se afirma «guardado local» ni «entregado» sin confirmación. No hay adjuntos.
Calendario mostrado como lista; todavía no tiene selector de rango/mes del modo API.
Monitor muestra primeras 25 tareas y primeras 100 versiones de entrega. Las vistas
de refuerzos/otras pantallas docentes no conectadas muestran límite explícito en API.
Dashboard Estudiante, Monitor, Administrador y calendario docente no están integrados.
La cabecera API oculta identidad demo/avisos remotos en los controles adaptados,
pero el shell de cuenta completo sigue pendiente de integración autenticada.

No se ejecutó aún E2E completo con login real. La prueba de navegador utiliza API
simulada y se documenta separada de la prueba PostgreSQL/ASGI.
