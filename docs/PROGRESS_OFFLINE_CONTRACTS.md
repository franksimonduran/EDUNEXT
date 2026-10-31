# Progreso offline

No se implementó sincronización remota ni un nuevo Service Worker/IndexedDB.
El Service Worker existente excluye `/api/` y el nuevo cliente no cachea respuestas
privadas. Los shells estáticos pueden seguir disponibles según preparación previa.

Modo API: una falla de red o autorización se informa; no se transforma en avance
confirmado ni reemplaza por cifras demo. Confirmación solo tras respuesta del
servidor posterior al commit. Si el refresco posterior falla, la interfaz distingue
"guardado, vista no actualizada" de un fallo de escritura.

Los datos demo/locales existentes permanecen separados. No se migran ni eliminan.
El motor nuevo no crea una cola de avance offline. Esa integración está pendiente.

Futuro contrato local: operation_id, contexto de identidad, entidad/versión,
tipo de evento, fecha auxiliar local, estado provisional. La recepción requerirá
autorización vigente, validación de versión, política de admisión, idempotencia y
tratamiento de conflictos. Fecha del dispositivo no es prueba de autorización.

Equipos compartidos: no se persiste progreso API nuevo en almacenamiento local;
la privacidad completa de almacenes demo heredados y del cambio de cuenta en una
misma vista sigue pendiente de pruebas. No se borran datos pendientes al salir.
