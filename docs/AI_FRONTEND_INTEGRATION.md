# Integración de pantallas existentes

- `student/tutor.html?modo=api`: capacidades, selector de lección publicada,
  pregunta, respuesta completa, origen, fuentes y errores. Sin historial servidor;
  hilos en memoria no se reenvían completos. Tutor deshabilitado si no disponible.
- `student/traductor.html?modo=api`: español/inglés, traducción generativa separada
  de búsqueda de vocabulario. Sin detección fingida ni traducción automática de URL.
- `student/pronuncia.html?modo=api` y `practicar-pronunciacion.html?modo=api&id=...`:
  referencias reales, voz local opt-in y sesión reference_only; sin micrófono/análisis.
- `admin/estado-servicios.html?modo=api`: política institucional, revisión y consumo
  técnico permitido. No instala modelos ni revela conversaciones/secretos.

Cliente único ai-api.service.js reutiliza apiRequest/auth. Proveedor solo backend;
no se envían peticiones al modelo desde JS. La UI no selecciona modelos o costos.
Componentes previos se conservan, sin frameworks ni reconstrucción de páginas.

Salida generada se escapa como texto; no se interpreta HTML ni enlaza URLs del modelo.
Formularios etiquetados, estados accesibles, botones de voz explícitos y alternativa
textual. Prueba Chromium a 390×844. No se activó micrófono al abrir/practicar API.

Errores no se sustituyen por demo. `modo=demo` mantiene flujos anteriores. Chats y
traducciones son efímeros; salir limpia texto y restaurar bfcache exige recarga.
No se cambió IndexedDB. La integración completa de identidad/shell autenticado y
de UI docente de contexto de Tutor sigue pendiente; backend docente sí exige aula.
No se verificó lector de pantalla físico ni toda la regresión de voz/dispositivos.
