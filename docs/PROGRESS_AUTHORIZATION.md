# Autorización de progreso

Se reutilizan sesión, cuenta activa y permisos efectivos de FASE 35. No se confía
en roles/UUID del navegador. Identidad propia procede de AuthorizationContext.

| Ámbito | Control efectivo | Verificación ejecutada |
|---|---|---|
| propio | progress.read_own + StudentProfile activo institucional | servicio y HTTP |
| escritura propia | lectura + progress.record_own_activity + matrícula/oferta + versión publicada | servicio y HTTP |
| historial/insignias | institución y propietario en consulta SQL | servicio y HTTP |
| docente | progress.read_assigned + perfil/asignación real curso/aula | servicio |
| agregado | progress.read_institution_aggregates | servicio, supresión de cohorte pequeña |

Los permisos nuevos se insertan en catálogo, sin concederlos a ningún rol. No hay
administración libre de progreso ni modificación de registros académicos.

El agregado institucional no acepta filtros individuales y suprime cantidades
cuando la población activa es menor a 5. Cuenta estudiantes únicos, no matrículas
históricas. Las finalizaciones son históricas de la población actual, no un nuevo
porcentaje de dominio. No expone identidad ni notas.

Las pruebas incluyen institución B sin cursos/progreso A, UUID de lección ajena,
permiso de escritura ausente, versión incorrecta y payload de porcentaje rechazado.
No se probó nuevamente toda la matriz de login/sesión revocada/cuenta inactiva.

No se almacenan respuestas autenticadas de progreso en IndexedDB/Cache Storage.
Los logs nuevos no registran contenido privado ni tokens. Los metadatos de contexto
no sustituyen todavía claves foráneas compuestas de integridad institucional.
