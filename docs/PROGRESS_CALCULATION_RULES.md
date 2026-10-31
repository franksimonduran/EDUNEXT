# Reglas de cálculo — versión 1

## Unidad del indicador

El porcentaje mide **finalización de lecciones**, no comprensión, dominio,
competencia, nota ni porcentaje de un instrumento.

`100 × lecciones estables completadas aplicables / lecciones estables aplicables`.
Se redondea a dos decimales con Decimal y ROUND_HALF_UP. 5/8 = 62,50%; 1/3 =
33,33%. Sin lecciones, porcentaje `null` y estado `no_applicable_content`.

Cada curso cuenta sus lecciones directamente. No promedia porcentajes de unidades
de diferente tamaño. El resumen general también suma numeradores/denominadores.
`started_lessons_count` cuenta estados `started`, excluyendo las ya completadas.

## Lección aplicable

Exige curso activo institucional, grado de aula, matrícula activa vigente, año y
aula activos y oferta docente activa. Las fechas de año se interpretan en zona
horaria institucional. El contenido necesita versión publicada, validación
`is_valid=true`, publicación institucional y revisión aprobada por persona distinta
del autor. Borradores, archivos y publicaciones retiradas quedan fuera.
La propia lección debe tener estado `published`; una publicación antigua no
habilita una lección que volvió a borrador.

Si existen varias versiones publicadas legacy, se elige determinísticamente la
de mayor version_number y luego ID. No se certifica con ello la integridad del
flujo editorial heredado. Compartición entre instituciones no está habilitada.

## Finalización

Política implementada: el estudiante declara que revisó la lección. El servidor
comprueba identidad, permiso, versión y acceso y registra el hecho. La fuente es
`student_self_declared_server_recorded`: confirma recepción/autorización de la
declaración, no que el aprendizaje haya sido verificado por un docente.

Reabrir o repetir no reinicia estado ni incrementa conteos. Una versión nueva
conserva la finalización del ID estable. El historial conserva su versión de origen.
La respuesta de lección distingue `lesson_version_id` (publicación actual) de
`completed_lesson_version_id` (versión de la declaración conservada). Incluye
`started_at`; cursos, unidades y resumen incluyen `last_confirmed_activity_at`.
En el resumen esta fecha incluye hechos históricos propios institucionales;
en cursos/unidades corresponde a las lecciones actualmente aplicables.
No hay reinicio automático por actualización importante: requiere futura política.

## Catálogo e historia

`catalog_reference` es SHA-256 de pares reales ID lección/ID versión ordenados;
no es un checksum del archivo. Reordenar unidades/lecciones no cambia el conjunto.
Publicar o retirar puede cambiar el porcentaje actual sin borrar hechos anteriores.
No se materializan porcentajes históricos como si fueran actuales.

La ausencia de competencia confirmada devuelve `not_available`, nunca C ni 0%.
Ningún cálculo lee o modifica AD/A/B/C, AssessmentResult o AcademicRecord.

Las reglas de primera/cinco lecciones se evalúan al completar, contando únicamente
lecciones distintas del catálogo aplicable consultado en esa operación. Retirar
contenido después no revoca automáticamente reconocimientos anteriores.
