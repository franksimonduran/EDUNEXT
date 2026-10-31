# Frontend integrado y pendiente

Pantalla existente `frontend/student/sincronizacion.html?modo=api`:
`student/synchronization.js` añade consulta de estado,
cola propia, recibos y envío manual. Sin modo=api permanece experiencia demo previa.
No se sustituye 401/403/red por demo. Disponible no se deduce de navigator.onLine.

`queueLessonCompletion(context, lessonId, versionId)` prepara escritura atómica local;
todavía no se conecta a botones de finalización de lección para evitar activar
edición offline sin validar permisos/experiencia completa. No hay envíos automáticos.

Panel Monitor/Administrador conservados, sin nueva integración servidor. No se
implementan diagnósticos agregados o paquetes. Vista API usa texto accesible y no
interpreta mensajes del servidor como HTML; accesibilidad responsive no ensayada.
Después de un envío se requiere recargar para revalidar el estado antes de otro.
