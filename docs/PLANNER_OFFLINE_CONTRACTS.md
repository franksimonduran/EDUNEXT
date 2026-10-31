# Contrato offline y sincronización futura

## Capacidad actual

El nuevo flujo autenticado necesita conexión para guardar y entregar. La respuesta
permanece en el formulario si falla; el aviso no promete persistencia tras recarga.
No hay aún guardado IndexedDB de borradores autenticados ni cola de entregas.
Las propuestas demo existentes siguen separadas y no se convierten en tareas reales.

Una respuesta en memoria o IndexedDB nunca es recibo PostgreSQL. Solo submitted_at
y receipt confirmados permiten mostrar «recibido por servidor». Tras timeout, la
vista consulta el estado durable antes de volver a escribir el borrador.

## Contrato futuro

operation_id, contexto de usuario/institución, assignment_id, submission_id,
assignment_version_id, revisión esperada, fecha local, received_at servidor,
idempotency_key, sync_status y conflict_reason. Hora local no valida el plazo.

Conflictos: tarea cerrada/archivada, fecha superada, versión o revisión distinta,
matrícula retirada, sesión vencida, permiso cambiado, archivo ausente o entrega
ya confirmada. El servidor debe decidir; no sobrescribir automáticamente.

En dispositivos compartidos, el almacenamiento debe aislar usuario/institución y
no mostrarse tras cambio de sesión. No borrar pendientes sin estrategia explícita.
El Service Worker existente no fue reemplazado ni se alteró IndexedDB. No se
implementa EDUNEXT Sync remoto ni se afirma actualización reciente de calendario
sin respuesta real del servidor. No hay notificaciones push ni correos enviados.

Inspección del Service Worker: sw.js omite solicitudes no GET, orígenes ajenos y
rutas /api/. Esa exclusión se conserva; no se añaden entregas privadas al caché.
