# Logros e insignias personales

Catálogo determinista de reglas versión 1:

| Código estable | Condición | Interpretación |
|---|---|---|
| first_lesson | 1 finalización distinta registrada por este motor | primera lección revisada |
| five_lessons | 5 finalizaciones distintas registradas por este motor | cinco lecciones revisadas |

Son reconocimientos personales por declaraciones de revisión autorizadas, no
certificación de dominio. No se conceden por abrir páginas, puntos de juego ni
porcentajes de pruebas. No hay rachas, dinero o rankings.

`student_achievements` conserva institución, estudiante, código, versión de regla,
hecho fuente, fecha y estado. Unicidad `(institution_id, student_id, code)`; checks
de código, versión positiva y estado. Referencias RESTRICT protegen la fuente.

La escritura del hecho y reconocimiento comparte transacción y bloqueo del perfil
estudiantil. Dos finalizaciones repetidas no multiplican insignias. Se cuentan
hechos históricos válidos, incluso si después el catálogo crece; no se revocan
automáticamente por retiro editorial.

No existe todavía operación de rectificación/revocación. La columna admite estado
revoked para futura operación autorizada, pero ningún cliente puede asignarlo.
Cambiar regla o catálogo necesita revisión y pruebas, no cambio silencioso de los
reconocimientos existentes. No hay logros de prácticas/juegos hasta verificar fuentes.
