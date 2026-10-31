# Consistencia transversal

La fuente confirmada debe ser PostgreSQL a través de FastAPI. Los cambios de este trabajo no modifican reglas académicas, transacciones, identificadores ni historial. No hay migración nueva.

Dependencias críticas pendientes de prueba cruzada:

- Finalización → progreso → reportes: misma versión y matrícula, sin duplicar logros.
- Publicación de tarea → destinatario → agenda → entrega → feedback: confirmar commit antes de indicar éxito.
- Traslado/retiro → autorización: preservar historia y revocar acceso según reglas existentes.
- Contenido publicado → AI: solo contexto autorizado, nunca borrador ajeno.
- Prácticas/evaluaciones → resultados: no aceptar puntuación del navegador ni derivar AD/A/B/C.
- Sync local → recibo → progreso: bloqueado por ausencia de backend Sync registrado.

La matriz estática no certifica estos vínculos. Ningún resultado provisional se ha promovido automáticamente a confirmado.
