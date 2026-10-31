# Reportes institucionales

Pantalla: `admin/reportes.html?modo=api`. Permiso reports.read_institution_aggregates;
no concede consulta global ni detalle individual. Exportar requiere permiso específico.

## Disponibles

- institution.enrollments: estudiantes únicos por grado, año/periodo y corte.
- institution.overview: población vigente y cantidades institucionales de cursos,
  tareas publicadas y destinatarios-tarea con alguna entrega recibida.
- institution.courses: cursos activos y lecciones publicadas autorizadas por curso;
  admite grade_id/course_id, sin registros individuales.

El corte de matrícula nunca puede ser futuro. Sin corte explícito y con año/periodo,
se usa el menor entre ahora y final civil de ese contexto en zona institucional.
Una matrícula actualmente transferida se puede contar antes de ended_at; no se
reconstruye un pasado usando exclusivamente status actual. Si faltan finales
históricos se informa partial.

## Privacidad

Matrículas se presentan como distribución fija por grado, sin filtros de estudiante,
aula/sección o curso. Si alguna celda no vacía es menor al mínimo, se suprime toda
la distribución y total. En overview se suprimen también cantidades cuando una
celda no vacía de los conteos resulta pequeña o no hay población elegible.
El catálogo de cursos no contiene menores y no necesita suprimir cursos pequeños.

No están implementados reportes por sección/aula institucional, monitores,
ocupación, recursos, resultados publicados o distribuciones AD/A/B/C. La ausencia
de sus fuentes no se representa como cero ni como nivel académico bajo.
