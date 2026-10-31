# Operaciones

`lesson.progress.complete`, schema_version=1:
- Entrada: UUID de operación, UUID estable de lección y UUID de versión publicada.
- Requiere permisos existentes `progress.read_own` y `progress.record_own_activity`.
- ProgressService valida perfil activo, institución, curso accesible, publicación,
  versión y matrícula real. Tiempo de aplicación lo determina el servidor.
- Serializa por perfil estudiantil, como el servicio de progreso anterior.
- Misma operación/mismo contenido: recibo ya aplicado; contenido diferente: conflicto.
- No admite dependencias porque es una operación independiente, no un intento.

Se rechazan por schema tipos desconocidos y campos extra (score/achievement_level,
roles, permisos, publicaciones, matrículas, respuestas académicas, etc.).
No están habilitadas operaciones de práctica, juego, tarea o evaluación oficial.
